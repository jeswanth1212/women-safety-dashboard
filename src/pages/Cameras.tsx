import { Camera, Video, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';

const Cameras = () => {
  const [videoError, setVideoError] = useState(false);
  const cameras = [
    { id: 1, name: 'Main Entrance', status: 'online', activity: 'Motion detected' },
    { id: 2, name: 'Parking Lot A', status: 'online', activity: 'All clear' },
    { id: 3, name: 'Loading Dock', status: 'offline', activity: 'Connection lost' },
    { id: 4, name: 'Side Entrance', status: 'online', activity: 'All clear' }
  ];

  const videoRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    const drawBoundingBoxes = (predictions) => {
      if (context && video) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        predictions.forEach(prediction => {
          const { x, y, width, height } = prediction.bbox;
          context.strokeStyle = 'red';
          context.lineWidth = 2;
          context.strokeRect(x, y, width, height);
        });
      }
    };

    const fetchPredictions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/predictions');
        const data = await response.json();
        drawBoundingBoxes(data);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      }
    };

    const intervalId = setInterval(fetchPredictions, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.onerror = () => setVideoError(true);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Camera Monitoring</h2>
        <div className="flex space-x-3">
          <select className="bg-white border border-gray-300 rounded-md px-4 py-2">
            <option>All Cameras</option>
            <option>Online</option>
            <option>Offline</option>
            <option>Active Alerts</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {cameras.map((camera, index) => (
          <div key={camera.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-video bg-gray-900 relative">
              {camera.status === 'offline' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center text-gray-400">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p>Camera Offline</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {index === 0 ? (
                    videoError ? (
                      <div className="text-center text-gray-400">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                        <p>Error loading video stream</p>
                      </div>
                    ) : (
                      <div>
                        <img
                          ref={videoRef}
                          src="http://127.0.0.1:5000/video_feed"
                          className="h-full w-full object-cover"
                          alt="Video feed with predictions"
                        />
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0"
                          width="640"
                          height="360"
                        ></canvas>
                      </div>
                    )
                  ) : (
                    <Video className="h-12 w-12 text-gray-600" />
                  )}
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center">
                <span className={`flex h-3 w-3 mr-2 ${
                  camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                } rounded-full`}></span>
                <span className="text-white text-sm">{camera.status}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{camera.name}</h3>
                  <p className="text-sm text-gray-500">{camera.activity}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cameras;