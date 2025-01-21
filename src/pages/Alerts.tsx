import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Alert {
  _id: string;
  name: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  message: string;
  timestamp: string;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/alerts');
      console.log('Fetched alerts:', response.data);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to fetch alerts');
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting to delete alert:', alertId);
      
      const response = await axios.delete(`http://localhost:5000/api/alerts/${alertId}`);
      console.log('Delete response:', response.data);
      
      // Refresh the alerts list after successful deletion
      await fetchAlerts();
      console.log('Alerts refreshed after deletion');
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      setError(error.response?.data?.error || 'Failed to resolve alert');
    } finally {
      setLoading(false);
    }
  };

  const handleLocatePerson = (latitude: number, longitude: number) => {
    navigate('/maps', { state: { centerLocation: { latitude, longitude } } });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Emergency Alerts</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <div key={alert._id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h2 className="text-lg font-semibold">{alert.name}</h2>
                  <p className="text-gray-600">{alert.phone}</p>
                  <p className="text-red-600 font-medium">{alert.message}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Location: {alert.location.latitude}, {alert.location.longitude}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleResolveAlert(alert._id)}
                      disabled={loading}
                      className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Resolving...' : 'SOS Resolved'}
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Contact Person
                    </button>
                    <button
                      onClick={() => handleLocatePerson(alert.location.latitude, alert.location.longitude)}
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                    >
                      Locate Person
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <p className="text-gray-500 text-center py-4">No alerts found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;