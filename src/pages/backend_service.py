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
PROCESS_NTH_FRAME = 1  # Process every frame to keep up with video speed
frame_queue = Queue(maxsize=2)
result_queue = Queue(maxsize=2)
should_process = True
last_predictions = []  # Global to store last predictions

def process_frame_ml(frame):
    try:
        # Convert frame to BGR format if needed
        if len(frame.shape) == 2:
            frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
        elif frame.shape[2] == 4:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
            
        # Convert to jpg and then base64
        _, buffer = cv2.imencode('.jpg', frame)
        img_str = base64.b64encode(buffer).decode('utf-8')
        
        # Send to Roboflow API
        result = CLIENT.infer(img_str, model_id="weapon-detection-f1lih-zelr4/1")
        
        if 'predictions' in result:
            predictions = result['predictions']
            return predictions
        else:
            return []
            
    except Exception as e:
        return []

def ml_processor():
    global should_process, last_predictions
    while should_process:
        try:
            if not frame_queue.empty():
                frame = frame_queue.get_nowait()
                predictions = process_frame_ml(frame)
                if predictions is not None and len(predictions) > 0:
                    last_predictions = predictions
        except Exception as e:
            pass
        time.sleep(0.001)

def draw_predictions(frame, predictions):
    if not predictions:
        return frame
        
    try:
        for prediction in predictions:
            x = prediction['x']
            y = prediction['y']
            width = prediction['width']
            height = prediction['height']
            confidence = prediction['confidence']
            class_name = prediction['class']
            
            start_point = (int(x - width/2), int(y - height/2))
            end_point = (int(x + width/2), int(y + height/2))
            
            # Draw more visible box
            cv2.rectangle(frame, start_point, end_point, (0, 255, 0), 2)
            
            # Add background to text for better visibility
            label = f"{class_name}: {confidence:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            label_bg_start = (start_point[0], start_point[1] - 20)
            label_bg_end = (start_point[0] + label_size[0], start_point[1])
            cv2.rectangle(frame, label_bg_start, label_bg_end, (0, 255, 0), -1)
            
            # Draw text
            cv2.putText(frame, label, (start_point[0], start_point[1] - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
    except Exception as e:
        pass
    return frame

def generate_frames():
    global should_process, last_predictions
    video_path = os.path.join(os.path.dirname(__file__), 'video.mp4')
    
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Could not open video file: {video_path}")
            
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_time = 1/fps
        frame_count = 0
        
        # Start ML processor thread
        ml_thread = threading.Thread(target=ml_processor)
        ml_thread.daemon = True
        ml_thread.start()
        
        while True:
            loop_start = time.time()
            
            success, frame = cap.read()
            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            # Queue frame for ML processing if it's the nth frame
            if frame_count % PROCESS_NTH_FRAME == 0:
                try:
                    if not frame_queue.full():
                        frame_queue.put_nowait(np.copy(frame))
                except Exception as e:
                    pass
            
            # Draw predictions on frame
            if last_predictions:
                frame = draw_predictions(frame, last_predictions)
            
            # Encode frame with lower quality for speed
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_bytes = buffer.tobytes()
            
            # Calculate time spent processing
            processing_time = time.time() - loop_start
            
            # Sleep if we're ahead of schedule
            if processing_time < frame_time:
                time.sleep(frame_time - processing_time)
            
            frame_count += 1
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                   
    except Exception as e:
        pass
    finally:
        should_process = False
        if 'cap' in locals():
            cap.release()

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    return 'Server is running'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
