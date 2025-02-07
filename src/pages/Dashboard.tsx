import React from 'react';
import { AlertTriangle, Clock, CheckCircle, AlertOctagon, LucideIcon, Camera } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color} bg-opacity-10 mr-4`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const stats = [
    {
      icon: AlertTriangle,
      label: 'Active Alerts',
      value: '24',
      color: 'text-yellow-600',
    },
    {
      icon: AlertOctagon,
      label: 'Critical Incidents',
      value: '3',
      color: 'text-red-600',
    },
    {
      icon: CheckCircle,
      label: 'Resolved Today',
      value: '45',
      color: 'text-green-600',
    },
    {
      icon: Clock,
      label: 'Avg Response Time',
      value: '8m',
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <div className="flex space-x-3">
          <select className="bg-white border border-gray-300 rounded-md px-4 py-2">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4 bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Camera className="h-5 w-5 text-gray-500 mr-3" />
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium">Weapon detected</p>
                  <p className="text-sm text-gray-500">Just now</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm" onClick={() => window.location.href='/cameras'}>
                View
              </button>
            </div>
            <div className="flex items-center justify-between border-b pb-4 bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Camera className="h-5 w-5 text-gray-500 mr-3" />
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium">Crowd detected</p>
                  <p className="text-sm text-gray-500">Just now</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm" onClick={() => window.location.href='/cameras'}>
                View
              </button>
            </div>
            <div className="flex items-center justify-between border-b pb-4 bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Camera className="h-5 w-5 text-gray-500 mr-3" />
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium">SOS gesture detected</p>
                  <p className="text-sm text-gray-500">Just now</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm" onClick={() => window.location.href='/cameras'}>
                View
              </button>
            </div>
            <div className="flex items-center justify-between border-b pb-4 bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Camera className="h-5 w-5 text-gray-500 mr-3" />
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium">Violence detected</p>
                  <p className="text-sm text-gray-500">Just now</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm" onClick={() => window.location.href='/cameras'}>
                View
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Analytics Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Cameras Active</span>
              <span className="text-green-600">4/6</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Alerts Today</span>
              <span className="text-yellow-600">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Average Response Time</span>
              <span className="text-blue-600">5 min</span>
            </div>
            <div className="flex justify-between items-center">
              <span>System Uptime</span>
              <span className="text-green-600">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;