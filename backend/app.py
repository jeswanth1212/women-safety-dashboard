from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
from inference_sdk import InferenceHTTPClient
import numpy as np
import logging
import os
import tempfile
import concurrent.futures
import time
import mediapipe as mp  # Added for MediaPipe

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.DEBUG)

# Use your API key in place of "API_KEY"
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="WFaRswyHYqQ1AGlvv5ig"
)

# Define the paths for both videos (they should be in public/videos/)
current_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.join(os.path.dirname(current_dir))
video_path_camera1 = os.path.join(base_dir, "public", "videos", "video.mp4")
video_path_camera2 = os.path.join(base_dir, "public", "videos", "viole.mp4")
video_path_camera3 = os.path.join(base_dir, "public", "videos", "video3.mp4")

detection_status = {
    "camera1": True,   # continuous weapon detection assumed active
    "camera2": True,   # continuous violo detection assumed active
    "camera3": False   # SOS gesture; updated dynamically in generate_frames_camera3
}

# In-memory alerts store.
alerts = []

def run_inference_camera1(frame):
    """
    Runs inference on a frame for camera1 (weapon detection).
    """
    success_enc, buffer = cv2.imencode('.jpg', frame)
    if not success_enc:
        raise Exception("Failed to encode frame for camera1")
    
    tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
    try:
        tmp.write(buffer.tobytes())
        tmp.flush()
        tmp_filename = tmp.name
    finally:
        tmp.close()
    
    result = CLIENT.infer(tmp_filename, model_id="weapon-detection-f1lih-zelr4/1")
    os.remove(tmp_filename)
    return result

def run_inference_camera2(frame):
    """
    Encodes the frame as JPEG, writes it to a temporary file,
    runs inference using the 'violo/1' model, logs the result,
    then deletes the temporary file and returns the result.
    """
    success_enc, buffer = cv2.imencode('.jpg', frame)
    if not success_enc:
        raise Exception("Failed to encode frame for camera2")
    
    tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
    try:
        tmp.write(buffer.tobytes())
        tmp.flush()
        tmp_filename = tmp.name
    finally:
        tmp.close()
    
    result = CLIENT.infer(tmp_filename, model_id="violo/1")
    os.remove(tmp_filename)
    app.logger.debug("Camera2 inference result: %s", result)
    return result

def generate_frames_camera1():
    logging.info(f"Opening camera1 video: {video_path_camera1}")
    video = cv2.VideoCapture(video_path_camera1)
    if not video.isOpened():
        logging.error(f"Cannot open video for camera1: {video_path_camera1}")
        return
    fps = video.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25  # Fallback FPS
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        pending = []  # List of tuples: (frame_id, future)
        latest_detection = (0, None)  # (frame_id, detection result)
        frame_counter = 0
        while True:
            success, frame = video.read()
            if not success:
                video.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            frame_counter += 1
            if len(pending) < 4:
                future = executor.submit(run_inference_camera1, frame.copy())
                pending.append((frame_counter, future))
            still_pending = []
            for fid, fut in pending:
                if fut.done():
                    try:
                        result = fut.result()
                        if fid > latest_detection[0]:
                            latest_detection = (fid, result)
                    except Exception as e:
                        logging.error(f"Inference error in camera1 frame {fid}: {e}")
                else:
                    still_pending.append((fid, fut))
            pending = still_pending
            if latest_detection[1] is not None and "predictions" in latest_detection[1]:
                for prediction in latest_detection[1]["predictions"]:
                    x = prediction["x"]
                    y = prediction["y"]
                    width = prediction["width"]
                    height = prediction["height"]
                    x1 = int(x - width / 2)
                    y1 = int(y - height / 2)
                    x2 = int(x + width / 2)
                    y2 = int(y + height / 2)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(
                        frame,
                        f"{prediction['class']} {prediction['confidence']:.2f}",
                        (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 255, 0),
                        2,
                    )
            _, buffer = cv2.imencode(".jpg", frame)
            frame_bytes = buffer.tobytes()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
            time.sleep(1.0 / fps)

def generate_frames_camera2():
    app.logger.info(f"Opening camera2 video: {video_path_camera2}")
    video = cv2.VideoCapture(video_path_camera2)
    if not video.isOpened():
        app.logger.error(f"Cannot open video for camera2: {video_path_camera2}")
        return
    fps = video.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25  # fallback FPS
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        pending = []  # List of tuples: (frame_id, future)
        latest_detection = (0, None)  # (frame_id, detection result)
        frame_counter = 0
        while True:
            success, frame = video.read()
            if not success:
                video.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            frame_counter += 1
            if len(pending) < 4:
                future = executor.submit(run_inference_camera2, frame.copy())
                pending.append((frame_counter, future))
            still_pending = []
            for fid, fut in pending:
                if fut.done():
                    try:
                        result = fut.result()
                        # Update detection result if this frame is newer
                        if fid > latest_detection[0]:
                            latest_detection = (fid, result)
                    except Exception as e:
                        app.logger.error(f"Inference error in camera2 frame {fid}: {e}")
                else:
                    still_pending.append((fid, fut))
            pending = still_pending

            # If we have detection results, log them (for debugging) and then overlay them:
            if latest_detection[1] is not None and "predictions" in latest_detection[1]:
                app.logger.debug("Camera2 detections: %s", latest_detection[1]["predictions"])
                for prediction in latest_detection[1]["predictions"]:
                    x = prediction["x"]
                    y = prediction["y"]
                    width = prediction["width"]
                    height = prediction["height"]
                    x1 = int(x - width / 2)
                    y1 = int(y - height / 2)
                    x2 = int(x + width / 2)
                    y2 = int(y + height / 2)
                    # Draw bounding boxes in blue for Camera2
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                    cv2.putText(
                        frame,
                        f"{prediction['class']} {prediction['confidence']:.2f}",
                        (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (255, 0, 0),
                        2,
                    )
            _, buffer = cv2.imencode(".jpg", frame)
            frame_bytes = buffer.tobytes()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
            time.sleep(1.0 / fps)

# ---------------------------
# Camera 3 - SOS Gesture Detection using MediaPipe
# ---------------------------
def generate_frames_camera3():
    global detection_status
    app.logger.info(f"Opening camera3 video: {video_path_camera3}")
    video = cv2.VideoCapture(video_path_camera3)
    if not video.isOpened():
        app.logger.error(f"Cannot open video for camera3: {video_path_camera3}")
        return
    fps = video.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25  # fallback FPS

    # Initialize MediaPipe Hands.
    mp_hands = mp.solutions.hands
    hands_detector = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    mp_drawing = mp.solutions.drawing_utils

    # Initialize state variables for closed-hand event tracking.
    closed_gesture_count = 0      # distinct closed-hand events count
    prev_closed = False           # hand state in previous frame
    sos_detect_time = None         # timestamp when SOS was triggered
    current_bounds = None          # bounding box for the detected closed hand

    while True:
        start_time = time.time()  # record start time for this frame
        success, frame = video.read()
        if not success:
            # When the video ends, loop it and reset the gesture state.
            video.set(cv2.CAP_PROP_POS_FRAMES, 0)
            closed_gesture_count = 0
            prev_closed = False
            sos_detect_time = None
            current_bounds = None
            continue

        image_height, image_width, _ = frame.shape
        # Convert the image from BGR to RGB for MediaPipe processing.
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands_detector.process(frame_rgb)

        # Determine whether a closed hand is present in this frame.
        current_closed = False
        detected_bounds = None

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Convert normalized landmarks to pixel coordinates.
                landmarks_px = [
                    (int(lm.x * image_width), int(lm.y * image_height))
                    for lm in hand_landmarks.landmark
                ]
                xs = [pt[0] for pt in landmarks_px]
                ys = [pt[1] for pt in landmarks_px]
                x_min, x_max = min(xs), max(xs)
                y_min, y_max = min(ys), max(ys)

                # Heuristic for closed hand: Check if all 4 fingers are folded.
                folded = 0
                finger_indices = [(8, 6), (12, 10), (16, 14), (20, 18)]
                for tip_idx, pip_idx in finger_indices:
                    if hand_landmarks.landmark[tip_idx].y > hand_landmarks.landmark[pip_idx].y:
                        folded += 1

                if folded == 4:
                    current_closed = True
                    detected_bounds = (x_min, y_min, x_max, y_max)
                    # Process only the first closed hand detected.
                    break

        # Detect a state transition from open to closed (i.e. a distinct closed-hand event).
        if current_closed and not prev_closed:
            closed_gesture_count += 1
            app.logger.debug("Closed-hand event detected. Count: %d", closed_gesture_count)
            current_bounds = detected_bounds

        prev_closed = current_closed  # update for the next frame

        # Trigger SOS detection only when the second distinct closed-hand event occurs.
        if closed_gesture_count == 2 and sos_detect_time is None:
            sos_detect_time = time.time()
            app.logger.info("SOS gesture triggered.")

        # If SOS is active, draw the bounding box for 1.5 seconds.
        if sos_detect_time is not None:
            elapsed_since_sos = time.time() - sos_detect_time
            if elapsed_since_sos < 1.5:
                cv2.rectangle(frame, (current_bounds[0], current_bounds[1]),
                              (current_bounds[2], current_bounds[3]), (0, 0, 255), 2)
                cv2.putText(
                    frame,
                    "SOS Detected",
                    (current_bounds[0], current_bounds[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    2,
                )
            # After 2 seconds, reset the SOS detection so new gestures can be counted.
            if elapsed_since_sos >= 2.0:
                sos_detect_time = None
                closed_gesture_count = 0
        else:
            # If SOS is not active, draw hand landmarks for visual feedback.
            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        # Update detection_status for Camera 3 based on SOS activity.
        # The detection status (and the message on the card) remains True for 2 seconds.
        if sos_detect_time is not None and (time.time() - sos_detect_time < 2.0):
            detection_status["camera3"] = True
        else:
            detection_status["camera3"] = False

        # Encode the frame for streaming.
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
        )

        # Compute elapsed time and sleep to maintain the video's original speed.
        elapsed = time.time() - start_time
        sleep_duration = max(0, (1.0 / fps) - elapsed)
        time.sleep(sleep_duration)

@app.route("/")
def index():
    return jsonify({"status": "Server is running"})

@app.route("/video_feed")
def video_feed():
    logging.info("Camera1 video feed accessed")
    return Response(
        generate_frames_camera1(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

@app.route("/video_feed_2")
def video_feed_2():
    logging.info("Camera2 video feed accessed")
    return Response(
        generate_frames_camera2(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )

@app.route("/video_feed_3")
def video_feed_3():
    app.logger.info("Camera3 video feed accessed")
    return Response(
        generate_frames_camera3(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

@app.route("/detection_status")
def detection_status_endpoint():
    global detection_status
    return jsonify(detection_status)

@app.route("/alerts", methods=["GET", "POST"])
def alerts_endpoint():
    global alerts
    if request.method == "POST":
        data = request.get_json()
        data["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
        alerts.append(data)
        return jsonify({"status": "success", "alert": data}), 201
    else:
        return jsonify(alerts)

if __name__ == "__main__":
    logging.info(f"Camera1 video path: {video_path_camera1}")
    logging.info(f"Camera1 file exists: {os.path.exists(video_path_camera1)}")
    logging.info(f"Camera2 video path: {video_path_camera2}")
    logging.info(f"Camera2 file exists: {os.path.exists(video_path_camera2)}")
    logging.info(f"Camera3 video path: {video_path_camera3}")
    logging.info(f"Camera3 file exists: {os.path.exists(video_path_camera3)}")
    app.run(debug=True, host="0.0.0.0", port=5000) 