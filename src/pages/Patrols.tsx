import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MapPin, Clock, Users, Calendar, AlertCircle, Navigation, Route, Plus } from 'lucide-react';
import { seedPatrols } from '../utils/seedPatrols';
import AddPatrolModal from '../components/AddPatrolModal';

interface Checkpoint {
  latitude: number;
  longitude: number;
  checkpointName: string;
}

interface Patrol {
  id: string;
  patrolZone: string;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  assignedTeamId: string;
  assignedTeamName: string;
  patrolType: 'foot_patrol' | 'vehicle_patrol' | 'bike_patrol';
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  route: Checkpoint[];
  frequency: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'paused' | 'completed';
  lastPatrolDate: any;
  nextPatrolDate: any;
  notes: string;
}

const Patrols: React.FC = () => {
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Seed patrols on component mount
  useEffect(() => {
    seedPatrols();
  }, []);

  useEffect(() => {
    const patrolsQuery = query(
      collection(db, 'patrols'),
      orderBy('priority', 'desc')
    );

    const unsubscribe = onSnapshot(patrolsQuery, (snapshot) => {
      const fetchedPatrols: Patrol[] = [];
      snapshot.forEach((doc) => {
        fetchedPatrols.push({ id: doc.id, ...doc.data() } as Patrol);
      });
      setPatrols(fetchedPatrols);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getPatrolTypeIcon = (type: string) => {
    switch (type) {
      case 'foot_patrol':
        return '🚶';
      case 'vehicle_patrol':
        return '🚗';
      case 'bike_patrol':
        return '🏍️';
      default:
        return '🚓';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const filteredPatrols = filter === 'all' 
    ? patrols 
    : patrols.filter(patrol => patrol.status === filter);

  const stats = {
    total: patrols.length,
    active: patrols.filter(p => p.status === 'active').length,
    paused: patrols.filter(p => p.status === 'paused').length,
    completed: patrols.filter(p => p.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading patrols...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Route className="w-8 h-8 text-blue-600" />
              Patrol Management
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor and manage security patrol schedules and routes
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add New Patrol
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Patrols</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.active}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Paused</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.paused}</p>
              </div>
              <div className="text-4xl">⏸️</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.completed}</p>
              </div>
              <div className="text-4xl">🏁</div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Patrols
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('paused')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'paused'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paused
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Patrols Grid */}
        {filteredPatrols.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <Route className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No patrols found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPatrols.map((patrol) => (
              <div
                key={patrol.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{getPatrolTypeIcon(patrol.patrolType)}</div>
                      <div>
                        <h3 className="text-xl font-bold">{patrol.patrolZone}</h3>
                        <p className="text-blue-100 text-sm mt-1">
                          {patrol.patrolType.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(patrol.status)} animate-pulse`}></div>
                      <span className="text-sm font-semibold uppercase">{patrol.status}</span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  {/* Priority & Frequency */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(patrol.priority)}`}>
                      {patrol.priority.toUpperCase()} PRIORITY
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {patrol.frequency}
                    </span>
                  </div>

                  {/* Assigned Team */}
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold text-sm">Assigned Team:</span>
                    </div>
                    <p className="text-purple-900 font-medium mt-1">{patrol.assignedTeamName}</p>
                  </div>

                  {/* Schedule */}
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold text-sm">Schedule:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {patrol.schedule.days.map((day) => (
                        <span key={day} className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-medium">
                          {day.substring(0, 3)}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-green-700">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {patrol.schedule.startTime} - {patrol.schedule.endTime}
                      </span>
                    </div>
                  </div>

                  {/* Location & Radius */}
                  <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-semibold text-sm">Patrol Zone:</span>
                    </div>
                    <p className="text-orange-900 text-sm">
                      Coverage Radius: <strong>{patrol.location.radius}m</strong>
                    </p>
                    <p className="text-orange-700 text-xs mt-1">
                      Center: {patrol.location.latitude.toFixed(4)}, {patrol.location.longitude.toFixed(4)}
                    </p>
                  </div>

                  {/* Route Checkpoints */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <Navigation className="w-4 h-4" />
                      <span className="font-semibold text-sm">Checkpoints ({patrol.route.length}):</span>
                    </div>
                    <div className="space-y-1">
                      {patrol.route.map((checkpoint, index) => (
                        <div key={index} className="flex items-center gap-2 text-blue-900 text-sm">
                          <span className="font-bold text-blue-600">{index + 1}.</span>
                          <span>{checkpoint.checkpointName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                      <p className="text-xs text-gray-600 font-medium">Last Patrol:</p>
                      <p className="text-sm text-gray-800 font-semibold mt-1">
                        {patrol.lastPatrolDate?.toDate
                          ? patrol.lastPatrolDate.toDate().toLocaleString('en-IN', { 
                              day: '2-digit', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium">Next Patrol:</p>
                      <p className="text-sm text-blue-900 font-semibold mt-1">
                        {patrol.nextPatrolDate?.toDate
                          ? patrol.nextPatrolDate.toDate().toLocaleString('en-IN', { 
                              day: '2-digit', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {patrol.notes && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-700 mt-0.5" />
                        <div>
                          <span className="font-semibold text-sm text-yellow-700">Notes:</span>
                          <p className="text-yellow-900 text-sm mt-1">{patrol.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps?q=${patrol.location.latitude},${patrol.location.longitude}`,
                          '_blank'
                        )
                      }
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      View Zone 🗺️
                    </button>
                    <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                      Edit Patrol
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Patrol Modal */}
      <AddPatrolModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
};

export default Patrols;

