from flask import Flask, Response
from flask_cors import CORS
import cv2
import time
import threading
from inference_sdk import InferenceHTTPClient
import os
import numpy as np
from queue import Queue
import base64

app = Flask(__name__)
CORS(app)

# Initialize the inference client
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="WFaRswyHYqQ1AGlvv5ig"
)

# Global variables
PROCESS_NTH_FRAME = 2  # Process every 2nd frame for better performance
frame_queue = Queue(maxsize=10)  # Smaller queue for lower latency
result_queue = Queue(maxsize=10)
should_process = True
last_predictions = []
prediction_lock = threading.Lock()  # Add thread lock for safe predictions access

def process_frame_ml(frame):
    try:
        # Keep aspect ratio while resizing
        h, w = frame.shape[:2]
        scale = 320 / max(h, w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # Resize maintaining aspect ratio
        resized = cv2.resize(frame, (new_w, new_h))
        
        # Create 320x320 canvas
        square_img = np.zeros((320, 320, 3), dtype=np.uint8)
        
        # Calculate offset to center the image
        x_offset = (320 - new_w) // 2
        y_offset = (320 - new_h) // 2
        
        # Place resized image in center
        square_img[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
        
        # Convert to base64
        _, buffer = cv2.imencode('.jpg', square_img, [cv2.IMWRITE_JPEG_QUALITY, 70])
        img_str = base64.b64encode(buffer).decode('utf-8')
        
        # Get predictions
        result = CLIENT.infer(img_str, model_id="weapon-detection-f1lih-zelr4/1")
        predictions = result.get('predictions', [])
        
        # Adjust coordinates based on padding
        for pred in predictions:
            # Convert coordinates back to original scale
            pred['x'] = (pred['x'] - x_offset) / scale
            pred['y'] = (pred['y'] - y_offset) / scale
            pred['width'] = pred['width'] / scale
            pred['height'] = pred['height'] / scale
        
        return [p for p in predictions if p.get('confidence', 0) > 0.3]
            
    except Exception as e:
        print(f"ML Processing error: {e}")
        import traceback
        print(traceback.format_exc())
        return []

def ml_processor():
    global should_process, last_predictions
    consecutive_errors = 0
    while should_process:
        try:
            if not frame_queue.empty():
                frame = frame_queue.get_nowait()
                predictions = process_frame_ml(frame)
                if predictions:
                    with prediction_lock:
                        last_predictions = predictions
                    consecutive_errors = 0
                frame_queue.task_done()
            else:
                time.sleep(0.001)  # Minimal sleep when queue is empty
        except Exception as e:
            consecutive_errors += 1
            if consecutive_errors > 5:
                time.sleep(0.1)  # Back off if having consistent errors
            continue

def draw_predictions(frame, predictions):
    if not predictions:
        return frame

    try:
        # Get original frame dimensions
        orig_h, orig_w = frame.shape[:2]
        
        for pred in predictions:
            try:
                # Get normalized coordinates (0-1)
                x = float(pred['x']) / 320  # normalize by input size (320x320)
                y = float(pred['y']) / 320
                w = float(pred['width']) / 320
                h = float(pred['height']) / 320
                
                # Convert to actual pixel coordinates
                box_x = int(x * orig_w)
                box_y = int(y * orig_h)
                box_w = int(w * orig_w)
                box_h = int(h * orig_h)
                
                # Calculate corner points
                x1 = max(0, int(box_x - box_w/2))
                y1 = max(0, int(box_y - box_h/2))
                x2 = min(orig_w, int(box_x + box_w/2))
                y2 = min(orig_h, int(box_y + box_h/2))
                
                # Draw red box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                
                # Prepare label
                confidence = pred.get('confidence', 0)
                label = f"{pred['class']}: {confidence:.2f}"
                
                # Get label size for background
                font_scale = 0.8
                font_thickness = 2
                (label_w, label_h), baseline = cv2.getTextSize(
                    label, 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    font_scale, 
                    font_thickness
                )
                
                # Draw label background
                label_x = x1
                label_y = y1 - 10 if y1 - 10 > 20 else y1 + 30
                cv2.rectangle(
                    frame,
                    (label_x, label_y - label_h - 10),
                    (label_x + label_w + 10, label_y + 5),
                    (0, 0, 255),
                    -1
                )
                
                # Draw white text
                cv2.putText(
                    frame,
                    label,
                    (label_x + 5, label_y - 5),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    font_scale,
                    (255, 255, 255),
                    font_thickness
                )
                
            except Exception as box_error:
                print(f"Error drawing single box: {box_error}")
                continue
                
    except Exception as e:
        print(f"Error in draw_predictions: {e}")
        import traceback
        print(traceback.format_exc())
    
    return frame

def generate_frames():
    global should_process, last_predictions
    video_path = os.path.join(os.path.dirname(__file__), 'video.mp4')
    
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Could not open video file: {video_path}")
            
        print(f"Video opened successfully: {video_path}")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_time = 1/fps
        frame_count = 0
        print(f"Video FPS: {fps}")
        
        # Start ML processor thread
        ml_thread = threading.Thread(target=ml_processor)
        ml_thread.daemon = True
        ml_thread.start()
        print("ML processor thread started")
        
        while True:
            loop_start = time.time()
            
            success, frame = cap.read()
            if not success:
                print("Resetting video to start")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            frame_count += 1
            if frame_count % 5 == 0:  # Log every 5th frame
                print(f"Processing frame {frame_count}")
            
            # Only process every nth frame
            if frame_count % PROCESS_NTH_FRAME == 0:
                try:
                    if not frame_queue.full():
                        frame_queue.put_nowait(np.copy(frame))
                except:
                    pass
            
            # Draw predictions on frame
            with prediction_lock:
                current_predictions = last_predictions
            
            if current_predictions:
                frame = draw_predictions(frame, current_predictions)
            
            # Optimize frame encoding
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            # Control frame rate
            processing_time = time.time() - loop_start
            sleep_time = frame_time - processing_time
            if sleep_time > 0:
                time.sleep(max(0, sleep_time * 0.8))  # Slightly faster than real-time
            
    except Exception as e:
        print(f"Error in generate_frames: {e}")
        import traceback
        print(traceback.format_exc())
        if cap:
            cap.release()
    finally:
        should_process = False

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    return 'Server is running'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
