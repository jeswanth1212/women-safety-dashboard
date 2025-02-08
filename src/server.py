from flask import Flask, request, jsonify
from inference_sdk import InferenceHTTPClient
import base64

app = Flask(__name__)

# Initialize the Roboflow client
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="WFaRswyHYqQ1AGlvv5ig"
)

@app.route('/infer', methods=['POST'])
def infer():
    try:
        # Get the image data from the request
        data = request.json
        image_data = data.get('image')
        model_id = data.get('model_id', 'weapon-detection-f1lih-zelr4/1')

        # Decode the base64 image
        image_bytes = base64.b64decode(image_data)
        image_path = 'temp_image.jpg'
        with open(image_path, 'wb') as f:
            f.write(image_bytes)

        # Perform inference
        result = CLIENT.infer(image_path, model_id=model_id)

        # Return the result
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
