import React from 'react';
import { Camera, Video, AlertTriangle } from 'lucide-react';

const Cameras = () => {
  const cameras = [
    { id: 1, name: 'Main Entrance', status: 'online', activity: 'Motion detected' },
    { id: 2, name: 'Parking Lot A', status: 'online', activity: 'All clear' },
    { id: 3, name: 'Loading Dock', status: 'offline', activity: 'Connection lost' },
    { id: 4, name: 'Side Entrance', status: 'online', activity: 'All clear' }
  ];

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
        {cameras.map((camera) => (
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
                  <Video className="h-12 w-12 text-gray-600" />
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
                  <h3 className="font-semibold text-gray-900">{camera.name}</h3>
                  <p className="text-sm text-gray-500">{camera.activity}</p>
                </div>
                <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm">
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-4">Camera Health Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Online Cameras</p>
            <p className="text-2xl font-semibold text-green-700">3</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Offline Cameras</p>
            <p className="text-2xl font-semibold text-red-700">1</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600">Active Alerts</p>
            <p className="text-2xl font-semibold text-yellow-700">1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cameras;