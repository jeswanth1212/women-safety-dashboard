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
  { id: 1, name: 'Main Entrance', status: 'online', zone: 'Fifth Avenue' },
  { id: 2, name: 'Parking Lot', status: 'online', zone: 'West Wing' },
  { id: 3, name: 'Loading Dock', status: 'online', zone: 'South Block' },
  { id: 4, name: 'Side Entrance', status: 'online', zone: 'East Wing' }
];

const COMPUTER_VISION_KEY = '90ANAjr3pzEkiZEGqHb4RlHmjT6kexJ1p4Uwu2KNDGR0AyqK3FPuJQQJ99BAACYeBjFXJ3w3AAAFACOGwS4x';
const COMPUTER_VISION_ENDPOINT = 'https://comp-vision-women.cognitiveservices.azure.com/';

const Cameras = () => {
  const [videoError, setVideoError] = useState(false);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const video3Ref = useRef<HTMLVideoElement>(null);
  const video4Ref = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    objectCount: 0,
    peopleCount: 0,
    lastMotion: null,
    activeZones: []
  });

  const createOverlay = (message: string) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.bottom = '10px';
    overlay.style.left = '10px';
    overlay.style.color = 'white';
    overlay.style.backgroundColor = '#2196F3'; // Blue background
    overlay.style.padding = '8px';
    overlay.style.borderRadius = '6px';
    overlay.style.fontSize = '16px';
    overlay.style.display = 'none';
    overlay.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    overlay.style.border = '1px solid #bbb';
    overlay.innerHTML = `<span style='margin-right: 6px;'>⚠️</span>${message}`;
    return overlay;
  };

  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    if (!video1 || !video2) return;

    video1.src = "/videos/video.mp4";
    video1.play().catch(error => console.error('Error playing video:', error));

    const weaponOverlay = createOverlay('Weapon Detected');
    video1.parentElement?.appendChild(weaponOverlay);

    const violenceOverlay = createOverlay('Violence Detected');
    const sosOverlay = createOverlay('SOS Gesture Detected');
    const crowdOverlay = createOverlay('Crowd Detected');
    video2.parentElement?.appendChild(violenceOverlay);
    video2.parentElement?.appendChild(sosOverlay);
    video2.parentElement?.appendChild(crowdOverlay);

    const showWeaponOverlay = () => {
      const currentTime = video1.currentTime;
      if (currentTime >= 4 && currentTime <= 9) {
        weaponOverlay.style.display = 'block';
      } else {
        weaponOverlay.style.display = 'none';
      }
    };

    const showOtherOverlays = () => {
      const currentTime = video2.currentTime;
      if (currentTime >= 3 && currentTime <= 8) {
        violenceOverlay.style.display = 'block';
      } else {
        violenceOverlay.style.display = 'none';
      }
      if (currentTime >= 2 && currentTime <= 7) {
        sosOverlay.style.display = 'block';
      } else {
        sosOverlay.style.display = 'none';
      }
      if (currentTime >= 5 && currentTime <= 10) {
        crowdOverlay.style.display = 'block';
      } else {
        crowdOverlay.style.display = 'none';
      }
    };

    const handleError = (event: Event) => {
      console.error('Video error:', event);
    };

    video1.addEventListener('timeupdate', showWeaponOverlay);
    video2.addEventListener('timeupdate', showOtherOverlays);
    video1.addEventListener('error', handleError);
    video2.addEventListener('error', handleError);

    return () => {
      video1.removeEventListener('timeupdate', showWeaponOverlay);
      video2.removeEventListener('timeupdate', showOtherOverlays);
      video1.removeEventListener('error', handleError);
      video2.removeEventListener('error', handleError);
      weaponOverlay.remove();
      violenceOverlay.remove();
      sosOverlay.remove();
      crowdOverlay.remove();
    };
  }, [video1Ref, video2Ref]);

  useEffect(() => {
    const video = video2Ref.current;
    if (!video) return;

    video.addEventListener('loadeddata', (e) => {
      const video = e.currentTarget as HTMLVideoElement;
      console.log('Video loaded successfully', {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        readyState: video.readyState
      });
      setVideoError(false);
    });

    video.addEventListener('error', (e) => {
      console.error('Video loading error:', e);
      setVideoError(true);
    });

    return () => {
      video.removeEventListener('loadeddata', () => {});
      video.removeEventListener('error', () => {});
    };
  }, [video2Ref]);

  useEffect(() => {
    const video3 = video3Ref.current;
    if (!video3) return;

    const violenceOverlay = createOverlay('Violence Detected');
    video3.parentElement?.appendChild(violenceOverlay);

    const showViolenceOverlay = () => {
      const currentTime = video3.currentTime;
      if (currentTime >= 3 && currentTime <= 8) {
        violenceOverlay.style.display = 'block';
      } else {
        violenceOverlay.style.display = 'none';
      }
    };

    video3.addEventListener('timeupdate', showViolenceOverlay);

    return () => {
      video3.removeEventListener('timeupdate', showViolenceOverlay);
      violenceOverlay.remove();
    };
  }, [video3Ref]);

  useEffect(() => {
    if (video4Ref.current) {
      const videoElement = video4Ref.current;
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.bottom = '10px';
      overlay.style.left = '10px';
      overlay.style.color = 'white';
      overlay.style.backgroundColor = '#2196F3'; // Blue background
      overlay.style.padding = '5px';
      overlay.style.borderRadius = '5px';
      overlay.style.fontSize = '20px';
      overlay.style.display = 'none';
      overlay.innerHTML = `<span style='margin-right: 8px;'>⚠️</span>SOS Gesture Detected`;
      videoElement.parentElement?.appendChild(overlay);

      const updateOverlay = () => {
        if (videoElement.currentTime >= 3) {
          overlay.style.display = 'block';
        } else {
          overlay.style.display = 'none';
        }
      };

      videoElement.addEventListener('timeupdate', updateOverlay);

      videoElement.addEventListener('ended', () => {
        overlay.style.display = 'none';
      });

      return () => {
        videoElement.removeEventListener('timeupdate', updateOverlay);
        videoElement.removeEventListener('ended', () => {
          overlay.style.display = 'none';
        });
      };
    }
  }, []);

  useEffect(() => {
    if (video2Ref.current) {
      const videoElement = video2Ref.current;
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.bottom = '10px';
      overlay.style.left = '10px';
      overlay.style.color = 'white';
      overlay.style.backgroundColor = '#2196F3'; // Blue background
      overlay.style.padding = '5px';
      overlay.style.borderRadius = '5px';
      overlay.style.fontSize = '20px';
      overlay.style.display = 'block';
      overlay.innerHTML = `<span style='margin-right: 8px;'>⚠️</span>Crowd Detected`;
      videoElement.parentElement?.appendChild(overlay);

      return () => {
        videoElement.parentElement?.removeChild(overlay);
      };
    }
  }, [video2Ref]);

  useEffect(() => {
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL = 500; // Run detection every 500ms

    const processFrameCamera1 = async (timestamp: number) => {
      const video = video1Ref.current;

      if (!video) {
        requestAnimationFrame(processFrameCamera1);
        return;
      }

      if (videoError) {
        console.log('Video error present');
        return;
      }

      if (video.readyState !== 4) {
        console.log('Video not ready:', video.readyState);
        requestAnimationFrame(processFrameCamera1);
        return;
      }

      if (timestamp - lastDetectionTime >= DETECTION_INTERVAL) {
        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 640;
          tempCanvas.height = 360;
          const tempContext = tempCanvas.getContext('2d');
          
          if (!tempContext) {
            console.log('Could not get temp canvas context');
            return;
          }

          tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

          const blob = await new Promise<Blob>((resolve) => 
            tempCanvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8)
          );

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
            setDetections(detectedObjects);

            const peopleCount = detectedObjects.filter(obj => 
              obj.object?.toLowerCase().includes('person')
            ).length;

            setAnalytics(prev => ({
              ...prev,
              objectCount: detectedObjects.length,
              peopleCount: peopleCount,
              lastMotion: peopleCount > 0 ? new Date() : prev.lastMotion,
              activeZones: ['Parking Lot']
            }));

            lastDetectionTime = timestamp;
          }
        } catch (error) {
          console.error('Detection error:', error);
        }
      }

      requestAnimationFrame(processFrameCamera1);
    };

    requestAnimationFrame(processFrameCamera1);

    return () => {
      // Cleanup
    };
  }, [videoError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = video2Ref.current;
    if (!canvas || !video) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const drawBoundingBoxes = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      detections.forEach((obj) => {
        if (!obj.rectangle) return;

        console.log('Drawing bounding box:', obj.rectangle);

        // Calculate scaling factors
        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;

        // Apply scaling to rectangle coordinates
        const x = (obj.rectangle.x ?? 0) * scaleX;
        const y = (obj.rectangle.y ?? 0) * scaleY;
        const width = (obj.rectangle.w ?? 0) * scaleX;
        const height = (obj.rectangle.h ?? 0) * scaleY;

        // Draw the rectangle
        context.strokeStyle = '#ff0000';
        context.lineWidth = 3;
        context.strokeRect(x, y, width, height);
      });
    };

    video.addEventListener('play', () => {
      const drawLoop = () => {
        if (!video.paused && !video.ended) {
          drawBoundingBoxes();
          requestAnimationFrame(drawLoop);
        }
      };
      drawLoop();
    });

    return () => {
      video.removeEventListener('play', () => {});
    };
  }, [detections]);

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
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">{camera.zone}</span>
                <span className={`text-xs px-2 py-1 rounded ${camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {camera.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="aspect-video relative bg-gray-900">
              {camera.id === 1 ? (
                <div className="relative w-full h-full">
                  <video
                    ref={video1Ref}
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={(e) => {
                      console.error('Video error:', e);
                      setVideoError(true);
                    }}
                  />
                  {videoError && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-red-500 bg-opacity-50">
                      <span className="text-white font-bold">Error loading video</span>
                    </div>
                  )}
                </div>
              ) : camera.id === 2 ? (
                <>
                  {!videoError ? (
                    <div className="relative w-full h-full bg-black">
                      <video
                        ref={video2Ref}
                        src="/src/pages/video2.mp4" // Ensure the path is correct
                        className="w-full h-full object-contain"
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={(e) => console.error('Video error:', e)}
                      />

                      {/* Bounding Box Overlay using Canvas */}
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 pointer-events-none"
                        width={640}
                        height={360}
                      />
                    </div>
                  ) : null}
                </>
              ) : camera.id === 3 ? (
                <div className="relative w-full h-full">
                  <video
                    ref={video3Ref}
                    src="/videos/viole.mp4" // Ensure the path is correct
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={(e) => {
                      console.error('Video error:', e);
                      setVideoError(true);
                    }}
                  />
                  {videoError && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-red-500 bg-opacity-50">
                      <span className="text-white font-bold">Error loading video</span>
                    </div>
                  )}
                </div>
              ) : camera.id === 4 ? (
                <div className="relative w-full h-full">
                  <video
                    ref={video4Ref}
                    src="/videos/video3.mp4" // Verify this path is correct
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={(e) => {
                      console.error('Video error:', e);
                      setVideoError(true);
                    }}
                  />
                  {videoError && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-red-500 bg-opacity-50">
                      <span className="text-white font-bold">Error loading video</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cameras;