import React from 'react';
import { AlertTriangle, Clock, CheckCircle, AlertOctagon, LucideIcon } from 'lucide-react';

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
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium">Motion Detected - Camera #12</p>
                    <p className="text-sm text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Cameras Online</span>
              <span className="text-green-600">48/50</span>
            </div>
            <div className="flex justify-between items-center">
              <span>System Load</span>
              <span className="text-yellow-600">75%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Storage Usage</span>
              <span className="text-blue-600">62%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Network Status</span>
              <span className="text-green-600">Optimal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;