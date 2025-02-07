import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Alert {
  id: number;
  name: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  message: string;
  age?: number;
  timestamp: string;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/alerts');
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

  const handleResolveAlert = async (alertId: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting to delete alert:', alertId);
      
      const response = await axios.delete(`http://localhost:5000/alerts/${alertId}`);
      console.log('Delete response:', response.data);
      
      // Refresh the alerts list after successful deletion
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      setError('Failed to resolve alert');
    } finally {
      setLoading(false);
    }
  };

  const handleLocatePerson = (alert: Alert) => {
    navigate('/maps', {
      state: { centerLocation: alert.location }
    });
  };

  const sortedAlerts = alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="p-6 bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Alerts</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <ul className="space-y-4">
        {sortedAlerts.map((alert) => (
          <li key={alert.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{alert.name}: {alert.message}</span>
              <span className="text-sm text-gray-500">{new Date(alert.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Location: {alert.location.latitude}, {alert.location.longitude}
              {alert.age && <span> - Age: {alert.age}</span>}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleResolveAlert(alert.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={loading}
              >
                Resolve
              </button>
              <button
                onClick={() => handleLocatePerson(alert)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Locate Person
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Alerts;