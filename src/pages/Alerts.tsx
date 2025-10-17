import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import AlertResponseDialog from '../components/AlertResponseDialog';

interface Alert {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  timestamp: any;
  status: 'pending' | 'resolved';
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedAt?: any;
}

interface ResponseTeam {
  id: string;
  teamName: string;
  teamType: 'police' | 'medical' | 'fire' | 'rescue';
  contactInfo: {
    phone: string;
    email: string;
  };
  currentStatus: 'available' | 'busy' | 'offline';
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Real-time listener for alerts from Firestore
    const alertsQuery = collection(db, 'sos');
    
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const fetchedAlerts: Alert[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedAlerts.push({
          id: doc.id,
          userId: data.userId || '',
          name: data.name || 'Unknown',
          phoneNumber: data.phoneNumber || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timestamp: data.timestamp,
          status: data.status || 'pending',
          assignedTeamId: data.assignedTeamId,
          assignedTeamName: data.assignedTeamName,
          assignedAt: data.assignedAt
        });
      });
      
      // Sort alerts: unresolved first (by newest timestamp), then resolved (by newest timestamp)
      fetchedAlerts.sort((a, b) => {
        // First, sort by status: pending comes before resolved
        if (a.status !== b.status) {
          if (a.status === 'pending' && b.status === 'resolved') return -1;
          if (a.status === 'resolved' && b.status === 'pending') return 1;
        }
        
        // Within same status, sort by timestamp (newest first)
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return timeB - timeA;
      });
      
      setAlerts(fetchedAlerts);
      console.log('Fetched alerts from Firestore:', fetchedAlerts);
    }, (error) => {
      console.error('Error fetching alerts:', error);
      setError('Failed to fetch alerts from Firestore');
    });

    return () => unsubscribe();
  }, []);

  // Fetch response teams from Firestore
  useEffect(() => {
    const teamsCollection = collection(db, 'responseTeams');
    
    const unsubscribe = onSnapshot(teamsCollection, (snapshot) => {
      const fetchedTeams: ResponseTeam[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTeams.push({
          id: doc.id,
          teamName: data.teamName,
          teamType: data.teamType,
          contactInfo: data.contactInfo,
          currentStatus: data.currentStatus
        });
      });
      setResponseTeams(fetchedTeams);
    }, (error) => {
      console.error('Error fetching response teams:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting to resolve alert:', alertId);
      
      // Update the status to 'resolved' in Firestore
      const alertRef = doc(db, 'sos', alertId);
      await updateDoc(alertRef, {
        status: 'resolved'
      });
      
      console.log('Alert resolved successfully');
    } catch (error) {
      console.error('Error resolving alert:', error);
      setError('Failed to resolve alert');
    } finally {
      setLoading(false);
    }
  };

  const handleLocatePerson = (alert: Alert) => {
    navigate('/maps', {
      state: { centerLocation: { latitude: alert.latitude, longitude: alert.longitude } }
    });
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">SOS Alerts</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {alerts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No alerts found
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 rounded-lg shadow-lg transition-all ${
                alert.status === 'resolved'
                  ? 'bg-gray-200 border-2 border-gray-400 opacity-75'
                  : 'bg-white border-2 border-red-500'
              }`}
            >
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      alert.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800 animate-pulse'
                    }`}
                  >
                    {alert.status === 'resolved' ? '✓ RESOLVED' : '⚠ PENDING'}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>

              {/* Alert Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Name:</span>
                  <span className="text-gray-900">{alert.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Phone:</span>
                  <span className="text-gray-900">{alert.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Location:</span>
                  <span className="text-gray-900">
                    Lat: {alert.latitude.toFixed(6)}, Long: {alert.longitude.toFixed(6)}
                  </span>
                </div>
                
                {/* Assigned Response Team */}
                {alert.assignedTeamId && alert.assignedTeamName && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">🚓</span>
                      <div className="flex-1">
                        <div className="font-semibold text-blue-900 mb-1">
                          Assigned Response Team
                        </div>
                        <div className="text-blue-800">
                          <strong>{alert.assignedTeamName}</strong>
                        </div>
                        {(() => {
                          const team = responseTeams.find(t => t.id === alert.assignedTeamId);
                          if (team) {
                            const statusColors = {
                              available: 'bg-green-100 text-green-800',
                              busy: 'bg-yellow-100 text-yellow-800',
                              offline: 'bg-gray-100 text-gray-800'
                            };
                            const statusIcons = {
                              available: '🟢',
                              busy: '🟡',
                              offline: '⚫'
                            };
                            return (
                              <div className="mt-2 space-y-1">
                                <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColors[team.currentStatus]}`}>
                                  {statusIcons[team.currentStatus]} {team.currentStatus.toUpperCase()}
                                </div>
                                <div className="text-sm text-blue-700">
                                  📞 {team.contactInfo.phone}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {alert.assignedAt && (
                          <div className="text-xs text-blue-600 mt-1">
                            Assigned: {formatTimestamp(alert.assignedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>

              {/* Action Buttons */}
            <div className="mt-4 flex gap-3 flex-wrap">
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  📋 Response Timeline
                </button>
                {alert.status === 'pending' && (
              <button
                onClick={() => handleResolveAlert(alert.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading}
              >
                    {loading ? 'Resolving...' : 'Quick Resolve'}
              </button>
                )}
              <button
                onClick={() => handleLocatePerson(alert)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                  📍 Locate on Map
              </button>
                <a
                  href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
        ))}
        </div>
      )}

      {/* Alert Response Dialog */}
      {selectedAlert && (
        <AlertResponseDialog
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
};

export default Alerts;