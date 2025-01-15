import { AlertTriangle } from 'lucide-react';

const Alerts = () => {
  const alerts = [
    {
      id: 1,
      type: 'Motion Detection',
      location: 'Camera #12 - Main Entrance',
      timestamp: '2 minutes ago',
      severity: 'high',
      status: 'pending',
      description: 'Unusual movement detected in restricted area'
    },
    {
      id: 2,
      type: 'Perimeter Breach',
      location: 'Sector B - East Wing',
      timestamp: '15 minutes ago',
      severity: 'critical',
      status: 'active',
      description: 'Security fence breach detected'
    },
    {
      id: 3,
      type: 'Suspicious Activity',
      location: 'Camera #8 - Parking Lot',
      timestamp: '1 hour ago',
      severity: 'medium',
      status: 'investigating',
      description: 'Unknown vehicle parked in restricted zone'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Alert Management</h2>
        <div className="flex space-x-3">
          <select className="bg-white border border-gray-300 rounded-md px-4 py-2">
            <option>All Alerts</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="border-b last:border-0 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{alert.type}</h3>
                    <p className="text-sm text-gray-500">{alert.location}</p>
                    <p className="text-sm text-gray-500">{alert.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </span>
                  <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
                    View Details
                  </button>
                </div>
              </div>
              <p className="mt-2 text-gray-600">{alert.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Alerts;