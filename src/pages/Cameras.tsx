import { Camera } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface CameraInfo {
  id: number;
  name: string;
  type?: string;
  status: 'online' | 'offline';
  zone: string;
}

const cameras: CameraInfo[] = [
  { id: 1, name: 'Main Entrance', type: 'Weapon Detection', status: 'online', zone: 'Fifth Avenue' },
  { id: 2, name: 'Parking Lot', type: 'Violo Detection', status: 'online', zone: 'West Wing' },
  { id: 3, name: 'Emergency', type: 'SOS Gesture Detection', status: 'online', zone: 'North Block' },
  { id: 4, name: 'Side Entrance', status: 'offline', zone: 'East Wing' }
];

interface DetectionStatus {
  camera1: boolean;
  camera2: boolean;
  camera3: boolean;
}

const Cameras: React.FC = () => {
  const [videoError, setVideoError] = useState<string | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>({
    camera1: true,  // weapon detection is assumed continuous
    camera2: true,  // violo detection is assumed continuous
    camera3: false  // SOS gesture detection; updated dynamically
  });

  // Verify backend connectivity.
  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((response) => {
        if (!response.ok) throw new Error("Backend not responding");
        return response.json();
      })
      .then((data) => {
        console.log("Backend status:", data);
      })
      .catch((error) => {
        setVideoError("Failed to connect to video server");
        console.error("Connection error:", error);
      });
  }, []);

  // Poll the backend detection status every second.
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:5000/detection_status")
        .then((res) => res.json())
        .then((data) => {
          setDetectionStatus(data);
        })
        .catch((err) => {
          console.error("Error fetching detection status:", err);
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Returns the detection message for cameras 1-3.
  const getDetectionMessage = (camera: CameraInfo) => {
    if (camera.id === 1) {
      return detectionStatus.camera1 ? "Weapon Detected Continuously" : "";
    }
    if (camera.id === 2) {
      return detectionStatus.camera2 ? "Violo Detected Continuously" : "";
    }
    if (camera.id === 3) {
      return detectionStatus.camera3 ? "SOS Gesture Detected" : "";
    }
    return "";
  };

  return (
    <div className="h-full w-full p-6 bg-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Camera Dashboard</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {cameras.map((camera) => (
          <div key={camera.id} className="relative w-full h-full bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{camera.name}</h3>
              {camera.id !== 4 ? (
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full inline-block mr-1"></span>
                  <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    {getDetectionMessage(camera)}
                  </span>
                </div>
              ) : (
                <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                  Offline
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <p>Zone: {camera.zone}</p>
            </div>
            <div className="aspect-video bg-gray-200 mt-2 rounded-md flex items-center justify-center">
              {videoError ? (
                <div className="text-red-500 text-sm">{videoError}</div>
              ) : (
                <>
                  {camera.id === 1 && (
                    <img
                      src="http://localhost:5000/video_feed"
                      alt="Camera 1 Video Feed"
                      className="w-full h-full object-cover rounded-md"
                    />
                  )}
                  {camera.id === 2 && (
                    <img
                      src="http://localhost:5000/video_feed_2"
                      alt="Camera 2 Video Feed"
                      className="w-full h-full object-cover rounded-md"
                    />
                  )}
                  {camera.id === 3 && (
                    <img
                      src="http://localhost:5000/video_feed_3"
                      alt="Camera 3 Video Feed"
                      className="w-full h-full object-cover rounded-md"
                    />
                  )}
                  {camera.id > 3 && <Camera className="w-12 h-12 text-gray-400" />}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cameras;