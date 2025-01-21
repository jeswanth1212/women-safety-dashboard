import { AlertTriangle, Camera } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface DetectedObject {
  object?: string;
  confidence?: number;
  rectangle?: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
  };
}

interface AzureResponse {
  objects?: DetectedObject[];
  tags?: Array<{ name: string; confidence: number }>;
}

interface Analytics {
  objectCount: number;
  peopleCount: number;
  lastMotion: Date | null;
  activeZones: string[];
}

interface CameraInfo {
  id: number;
  name: string;
  status: 'online' | 'offline';
  zone: string;
}

const cameras: CameraInfo[] = [
  { id: 1, name: 'Main Entrance', status: 'online', zone: 'Main Entrance' },
  { id: 2, name: 'Parking Lot', status: 'online', zone: 'Parking Lot' },
  { id: 3, name: 'Loading Dock', status: 'offline', zone: 'Loading Area' },
  { id: 4, name: 'Side Entrance', status: 'offline', zone: 'Side Area' }
];

const COMPUTER_VISION_KEY = '90ANAjr3pzEkiZEGqHb4RlHmjT6kexJ1p4Uwu2KNDGR0AyqK3FPuJQQJ99BAACYeBjFXJ3w3AAAFACOGwS4x';
const COMPUTER_VISION_ENDPOINT = 'https://comp-vision-women.cognitiveservices.azure.com/';

const Cameras = () => {
  const [videoError, setVideoError] = useState(false);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    objectCount: 0,
    peopleCount: 0,
    lastMotion: null,
    activeZones: []
  });

  // Initialize object detection for Camera 2
  useEffect(() => {
    let animationFrameId: number;
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL = 2000; // Run detection every 2 seconds

    const processFrame = async (timestamp: number) => {
      const video = video2Ref.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        console.log('Video or canvas not ready');
        requestAnimationFrame(processFrame);
        return;
      }

      if (videoError) {
        console.log('Video error present');
        return;
      }

      if (video.readyState !== 4) {
        console.log('Video not ready:', video.readyState);
        requestAnimationFrame(processFrame);
        return;
      }

      console.log('Processing frame at:', timestamp);

      const context = canvas.getContext('2d', { 
        alpha: true,
        willReadFrequently: true 
      });

      if (!context) {
        console.log('Could not get canvas context');
        return;
      }

      // Set canvas size to match video size
      const containerWidth = canvas.clientWidth;
      const containerHeight = canvas.clientHeight;

      if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        console.log('Canvas resized:', { width: canvas.width, height: canvas.height });
      }

      // Clear the canvas with semi-transparent overlay
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Only run detection if enough time has passed
      if (timestamp - lastDetectionTime >= DETECTION_INTERVAL) {
        console.log('Running detection at:', timestamp);
        try {
          // Create a temporary canvas for frame capture
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 1280; // Fixed width for API
          tempCanvas.height = 720; // Fixed height for API
          const tempContext = tempCanvas.getContext('2d');
          
          if (!tempContext) {
            console.log('Could not get temp canvas context');
            return;
          }

          // Draw the current frame to temp canvas
          tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
          console.log('Frame captured');

          // Get frame as blob
          const blob = await new Promise<Blob>((resolve) => 
            tempCanvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95)
          );
          
          console.log('Frame blob created, size:', blob.size);

          // Send to Azure
          const response = await fetch(
            `${COMPUTER_VISION_ENDPOINT}vision/v3.2/analyze?visualFeatures=Objects`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/octet-stream',
                'Ocp-Apim-Subscription-Key': COMPUTER_VISION_KEY
              },
              body: blob
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result: AzureResponse = await response.json();
          console.log('Azure response:', result);

          if (result.objects && result.objects.length > 0) {
            const detectedObjects = result.objects;
            console.log('Number of objects detected:', detectedObjects.length);

            // Calculate scaling factors
            const scaleX = canvas.width / 1280;
            const scaleY = canvas.height / 720;

            console.log('Scale factors:', { scaleX, scaleY });

            // Update analytics state
            const peopleCount = detectedObjects.filter(obj => 
              obj.object?.toLowerCase().includes('person')
            ).length;

            console.log('People detected:', peopleCount);

            setAnalytics(prev => {
              const newState = {
                ...prev,
                objectCount: detectedObjects.length,
                peopleCount: peopleCount,
                lastMotion: peopleCount > 0 ? new Date() : prev.lastMotion,
                activeZones: ['Parking Lot']
              };
              console.log('New analytics state:', newState);
              return newState;
            });

            // Draw detections
            detectedObjects.forEach((obj: DetectedObject, index: number) => {
              if (obj.rectangle && obj.object) {
                const rect = obj.rectangle;
                const x = (rect.x ?? 0) * scaleX;
                const y = (rect.y ?? 0) * scaleY;
                const w = (rect.w ?? 0) * scaleX;
                const h = (rect.h ?? 0) * scaleY;

                console.log(`Drawing object ${index}:`, {
                  object: obj.object,
                  confidence: obj.confidence,
                  coords: { x, y, w, h }
                });

                // Draw box with high contrast
                context.strokeStyle = '#00ff00';
                context.lineWidth = 3;
                context.strokeRect(x, y, w, h);

                // Fill with semi-transparent color
                context.fillStyle = 'rgba(0, 255, 0, 0.2)';
                context.fillRect(x, y, w, h);

                // Draw label
                const text = `${obj.object} (${Math.round((obj.confidence || 0) * 100)}%)`;
                context.font = 'bold 16px Arial';

                // Draw label background
                const metrics = context.measureText(text);
                const padding = 4;
                const bgHeight = 24;
                
                context.fillStyle = 'rgba(0, 0, 0, 0.8)';
                context.fillRect(
                  x - padding, 
                  y > bgHeight ? y - bgHeight : y + h, 
                  metrics.width + (padding * 2), 
                  bgHeight
                );

                // Draw label text
                context.fillStyle = '#ffffff';
                context.textBaseline = 'middle';
                context.fillText(
                  text,
                  x,
                  y > bgHeight ? y - (bgHeight/2) : y + h + (bgHeight/2)
                );

                console.log(`Drew box for ${obj.object} at:`, {
                  x, y, w, h,
                  canvasSize: { width: canvas.width, height: canvas.height },
                  confidence: obj.confidence
                });
              }
            });
          } else {
            console.log('No objects detected');
          }
          lastDetectionTime = timestamp;
        } catch (error) {
          console.error('Error in detection:', error);
        }
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    console.log('Setting up video detection');
    
    const initializeVideo = () => {
      const video = video2Ref.current;
      if (!video) {
        console.log('Video element not found');
        return;
      }

      video.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded:', {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          readyState: video.readyState
        });

        // Start processing frames
        animationFrameId = requestAnimationFrame(processFrame);
      });

      video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        setVideoError(true);
      });

      // Start playing
      video.play().catch(e => {
        console.error('Error playing video:', e);
        setVideoError(true);
      });
    };

    initializeVideo();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [videoError]);

  return (
    <div className="h-full w-full p-6 bg-gray-100">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Security Cameras</h1>
        <p className="text-gray-600">Monitoring all zones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cameras.map((camera) => (
          <div key={camera.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{camera.name}</span>
              </div>
              <span className="text-sm text-gray-400">{camera.zone}</span>
            </div>

            <div className="aspect-video relative bg-gray-900">
              {camera.id === 1 ? (
                <div className="relative w-full h-full">
                  <img
                    src="http://127.0.0.1:5000/video_feed"
                    className="h-full w-full object-cover"
                    alt="Main Entrance Feed"
                  />
                </div>
              ) : camera.id === 2 ? (
                <>
                  {!videoError ? (
                    <div className="relative w-full h-full bg-black">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <video
                          ref={video2Ref}
                          src="/pages/video2.mp4"
                          className="w-full h-full object-contain"
                          autoPlay
                          loop
                          muted
                          playsInline
                          onLoadedData={(e) => {
                            const video = e.currentTarget;
                            console.log('Video loaded successfully', {
                              width: video.videoWidth,
                              height: video.videoHeight,
                              duration: video.duration,
                              readyState: video.readyState
                            });
                            setVideoError(false);
                          }}
                          onError={(e) => {
                            console.error('Video loading error:', e);
                            setVideoError(true);
                          }}
                        />
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full"
                          style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            pointerEvents: 'none',
                            zIndex: 2
                          }}
                        />
                      </div>
                      {/* Analytics Overlay */}
                      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Status:</span>
                          <span className="font-bold text-green-400">Live</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Objects:</span>
                          <span className="font-bold">{analytics.objectCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>People:</span>
                          <span className="font-bold">{analytics.peopleCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Last Motion:</span>
                          <span className="font-bold">
                            {analytics.lastMotion 
                              ? new Date(analytics.lastMotion).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })
                              : 'No motion'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Active Zone:</span>
                          <span className="font-bold text-blue-400">Parking Lot</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-lg font-semibold">Video Error</p>
                        <p className="text-sm">Check connection</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p>{camera.status === 'online' ? 'No Feed Available' : 'Camera Offline'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cameras;