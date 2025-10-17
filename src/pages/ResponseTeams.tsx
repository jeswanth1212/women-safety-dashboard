import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Users, Phone, MapPin, Clock, AlertCircle, Plus } from 'lucide-react';
import AddResponseTeamModal from '../components/AddResponseTeamModal';

interface ResponseTeam {
  id: string;
  teamName: string;
  teamType: 'police' | 'medical' | 'fire' | 'rescue';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  contactInfo: {
    phone: string;
    email: string;
  };
  members: Array<{
    name: string;
    role: string;
    phone: string;
    badgeNumber: string;
  }>;
  availability: string;
  responseRadius: number;
  currentStatus: 'available' | 'busy' | 'offline';
  lastActive: any;
}

const ResponseTeams: React.FC = () => {
  const [teams, setTeams] = useState<ResponseTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);

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
          location: data.location,
          contactInfo: data.contactInfo,
          members: data.members || [],
          availability: data.availability,
          responseRadius: data.responseRadius,
          currentStatus: data.currentStatus,
          lastActive: data.lastActive
        });
      });
      setTeams(fetchedTeams);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching response teams:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (teamId: string, newStatus: 'available' | 'busy' | 'offline') => {
    setUpdatingTeamId(teamId);
    try {
      const teamRef = doc(db, 'responseTeams', teamId);
      await updateDoc(teamRef, {
        currentStatus: newStatus,
        lastActive: new Date()
      });
      console.log(`✅ Team status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating team status:', error);
      alert('Failed to update team status');
    } finally {
      setUpdatingTeamId(null);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const statusColors = {
    available: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    busy: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
    offline: { bg: 'bg-gray-50', border: 'border-gray-500', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' }
  };

  const statusIcons = {
    available: '🟢',
    busy: '🟡',
    offline: '⚫'
  };

  const typeEmojis = {
    police: '🚓',
    medical: '🚑',
    fire: '🚒',
    rescue: '🛟'
  };

  const typeColors = {
    police: 'text-blue-600',
    medical: 'text-red-600',
    fire: 'text-orange-600',
    rescue: 'text-purple-600'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading response teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Users className="w-8 h-8" />
              Response Teams Management
            </h1>
            <p className="text-gray-600 mt-2">Manage emergency response teams and their status</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add New Team
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Teams</p>
                <p className="text-2xl font-bold text-blue-600">{teams.length}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {teams.filter(t => t.currentStatus === 'available').length}
                </p>
              </div>
              <div className="text-3xl">🟢</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Busy</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {teams.filter(t => t.currentStatus === 'busy').length}
                </p>
              </div>
              <div className="text-3xl">🟡</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-gray-600">
                  {teams.filter(t => t.currentStatus === 'offline').length}
                </p>
              </div>
              <div className="text-3xl">⚫</div>
            </div>
          </div>
        </div>

        {/* Teams List */}
        <div className="space-y-4">
          {teams.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No response teams found</p>
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className={`bg-white rounded-lg shadow-md border-2 ${statusColors[team.currentStatus].border} overflow-hidden`}
              >
                <div className="p-6">
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{typeEmojis[team.teamType]}</div>
                      <div>
                        <h3 className={`text-xl font-bold ${typeColors[team.teamType]}`}>
                          {team.teamName}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">{team.teamType} Team</p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-semibold ${statusColors[team.currentStatus].badge}`}>
                      {statusIcons[team.currentStatus]} {team.currentStatus.toUpperCase()}
                    </div>
                  </div>

                  {/* Team Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Location</p>
                        <p className="text-sm text-gray-600">{team.location.address}</p>
                        <p className="text-xs text-gray-500">
                          {team.location.latitude.toFixed(4)}, {team.location.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Contact</p>
                        <p className="text-sm text-gray-600">{team.contactInfo.phone}</p>
                        <p className="text-xs text-gray-500">{team.contactInfo.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Availability</p>
                        <p className="text-sm text-gray-600">{team.availability}</p>
                        <p className="text-xs text-gray-500">
                          Radius: {team.responseRadius}m
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Team Members:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {team.members.map((member, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-sm font-medium text-gray-800">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.role} • Badge: {member.badgeNumber}</p>
                          <p className="text-xs text-gray-500">{member.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Last Active */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">
                      Last Active: {formatTimestamp(team.lastActive)}
                    </p>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleStatusChange(team.id, 'available')}
                      disabled={team.currentStatus === 'available' || updatingTeamId === team.id}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        team.currentStatus === 'available'
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } disabled:opacity-50`}
                    >
                      🟢 Set Available
                    </button>
                    <button
                      onClick={() => handleStatusChange(team.id, 'busy')}
                      disabled={team.currentStatus === 'busy' || updatingTeamId === team.id}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        team.currentStatus === 'busy'
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700'
                      } disabled:opacity-50`}
                    >
                      🟡 Set Busy
                    </button>
                    <button
                      onClick={() => handleStatusChange(team.id, 'offline')}
                      disabled={team.currentStatus === 'offline' || updatingTeamId === team.id}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        team.currentStatus === 'offline'
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      } disabled:opacity-50`}
                    >
                      ⚫ Set Offline
                    </button>
                    <button
                      onClick={() => window.location.href = '/maps'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      📍 View on Map
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Team Modal */}
      <AddResponseTeamModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
};

export default ResponseTeams;


