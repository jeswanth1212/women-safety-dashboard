import React, { useState } from 'react';
import { X } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AddPatrolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPatrolModal: React.FC<AddPatrolModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    patrolZone: '',
    latitude: '',
    longitude: '',
    radius: '1000',
    assignedTeamName: '',
    patrolType: 'foot_patrol' as 'foot_patrol' | 'vehicle_patrol' | 'bike_patrol',
    frequency: 'Daily',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'active' as 'active' | 'paused' | 'completed',
    scheduleDays: [] as string[],
    startTime: '18:00',
    endTime: '22:00',
    notes: '',
    // Checkpoints
    checkpoint1Name: '',
    checkpoint1Lat: '',
    checkpoint1Lon: '',
    checkpoint2Name: '',
    checkpoint2Lat: '',
    checkpoint2Lon: '',
    checkpoint3Name: '',
    checkpoint3Lat: '',
    checkpoint3Lon: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!isOpen) return null;

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      scheduleDays: prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter(d => d !== day)
        : [...prev.scheduleDays, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.patrolZone || !formData.latitude || !formData.longitude || formData.scheduleDays.length === 0) {
        setError('Please fill in all required fields and select at least one day');
        setLoading(false);
        return;
      }

      // Build route from checkpoints
      const route = [];
      if (formData.checkpoint1Name && formData.checkpoint1Lat && formData.checkpoint1Lon) {
        route.push({
          latitude: parseFloat(formData.checkpoint1Lat),
          longitude: parseFloat(formData.checkpoint1Lon),
          checkpointName: formData.checkpoint1Name
        });
      }
      if (formData.checkpoint2Name && formData.checkpoint2Lat && formData.checkpoint2Lon) {
        route.push({
          latitude: parseFloat(formData.checkpoint2Lat),
          longitude: parseFloat(formData.checkpoint2Lon),
          checkpointName: formData.checkpoint2Name
        });
      }
      if (formData.checkpoint3Name && formData.checkpoint3Lat && formData.checkpoint3Lon) {
        route.push({
          latitude: parseFloat(formData.checkpoint3Lat),
          longitude: parseFloat(formData.checkpoint3Lon),
          checkpointName: formData.checkpoint3Name
        });
      }

      // Calculate next patrol date (tomorrow at start time)
      const now = new Date();
      const nextPatrolDate = new Date(now);
      nextPatrolDate.setDate(nextPatrolDate.getDate() + 1);
      const [hours, minutes] = formData.startTime.split(':');
      nextPatrolDate.setHours(parseInt(hours), parseInt(minutes), 0);

      const newPatrol = {
        patrolZone: formData.patrolZone,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radius: parseInt(formData.radius)
        },
        assignedTeamId: `patrol_team_${Date.now()}`,
        assignedTeamName: formData.assignedTeamName || 'Unassigned',
        patrolType: formData.patrolType,
        schedule: {
          days: formData.scheduleDays,
          startTime: formData.startTime,
          endTime: formData.endTime
        },
        route: route.length > 0 ? route : [
          {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            checkpointName: 'Main Checkpoint'
          }
        ],
        frequency: formData.frequency,
        priority: formData.priority,
        status: formData.status,
        lastPatrolDate: Timestamp.now(),
        nextPatrolDate: Timestamp.fromDate(nextPatrolDate),
        notes: formData.notes || 'No additional notes'
      };

      await addDoc(collection(db, 'patrols'), newPatrol);
      
      // Reset form
      setFormData({
        patrolZone: '',
        latitude: '',
        longitude: '',
        radius: '1000',
        assignedTeamName: '',
        patrolType: 'foot_patrol',
        frequency: 'Daily',
        priority: 'medium',
        status: 'active',
        scheduleDays: [],
        startTime: '18:00',
        endTime: '22:00',
        notes: '',
        checkpoint1Name: '',
        checkpoint1Lat: '',
        checkpoint1Lon: '',
        checkpoint2Name: '',
        checkpoint2Lat: '',
        checkpoint2Lon: '',
        checkpoint3Name: '',
        checkpoint3Lat: '',
        checkpoint3Lon: ''
      });
      
      alert('✅ Patrol added successfully!');
      onClose();
    } catch (err: any) {
      console.error('Error adding patrol:', err);
      setError(err.message || 'Failed to add patrol');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🚶</span> Add New Patrol
          </h2>
          <button onClick={onClose} className="text-white hover:bg-blue-800 rounded p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Patrol Details */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <span>📋</span> Patrol Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patrol Zone Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patrolZone"
                  value={formData.patrolZone}
                  onChange={handleChange}
                  placeholder="e.g., T Nagar Commercial Area"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Team Name
                </label>
                <input
                  type="text"
                  name="assignedTeamName"
                  value={formData.assignedTeamName}
                  onChange={handleChange}
                  placeholder="e.g., T Nagar Patrol Unit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patrol Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="patrolType"
                  value={formData.patrolType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="foot_patrol">🚶 Foot Patrol</option>
                  <option value="vehicle_patrol">🚗 Vehicle Patrol</option>
                  <option value="bike_patrol">🏍️ Bike Patrol</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Daily">Daily</option>
                  <option value="Alternate Days">Alternate Days</option>
                  <option value="Weekends">Weekends</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">✅ Active</option>
                  <option value="paused">⏸️ Paused</option>
                  <option value="completed">🏁 Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <span>📍</span> Location & Coverage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g., 13.0418"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., 80.2341"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Radius (meters)
                </label>
                <input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleChange}
                  placeholder="e.g., 1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <span>📅</span> Schedule <span className="text-red-500">*</span>
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Days
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.scheduleDays.includes(day)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Route Checkpoints */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <span>🗺️</span> Route Checkpoints (Optional)
            </h3>
            
            {/* Checkpoint 1 */}
            <div className="mb-4 p-3 bg-white rounded border border-purple-300">
              <h4 className="font-medium text-purple-800 mb-2">Checkpoint 1</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  name="checkpoint1Name"
                  value={formData.checkpoint1Name}
                  onChange={handleChange}
                  placeholder="Checkpoint name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="any"
                  name="checkpoint1Lat"
                  value={formData.checkpoint1Lat}
                  onChange={handleChange}
                  placeholder="Latitude"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="any"
                  name="checkpoint1Lon"
                  value={formData.checkpoint1Lon}
                  onChange={handleChange}
                  placeholder="Longitude"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Checkpoint 2 */}
            <div className="mb-4 p-3 bg-white rounded border border-purple-300">
              <h4 className="font-medium text-purple-800 mb-2">Checkpoint 2</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  name="checkpoint2Name"
                  value={formData.checkpoint2Name}
                  onChange={handleChange}
                  placeholder="Checkpoint name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="any"
                  name="checkpoint2Lat"
                  value={formData.checkpoint2Lat}
                  onChange={handleChange}
                  placeholder="Latitude"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="any"
                  name="checkpoint2Lon"
                  value={formData.checkpoint2Lon}
                  onChange={handleChange}
                  placeholder="Longitude"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Checkpoint 3 */}
            <div className="p-3 bg-white rounded border border-purple-300">
              <h4 className="font-medium text-purple-800 mb-2">Checkpoint 3</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  name="checkpoint3Name"
                  value={formData.checkpoint3Name}
                  onChange={handleChange}
                  placeholder="Checkpoint name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="any"
                  name="checkpoint3Lat"
                  value={formData.checkpoint3Lat}
                  onChange={handleChange}
                  placeholder="Latitude"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="any"
                  name="checkpoint3Lon"
                  value={formData.checkpoint3Lon}
                  onChange={handleChange}
                  placeholder="Longitude"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <span>📝</span> Notes
            </h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any special instructions or notes for the patrol team..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ Adding Patrol...' : '✅ Add Patrol'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatrolModal;

