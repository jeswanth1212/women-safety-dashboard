import React, { useState } from 'react';
import { X } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AddResponseTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddResponseTeamModal: React.FC<AddResponseTeamModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    teamName: '',
    teamType: 'police' as 'police' | 'medical' | 'fire' | 'rescue',
    latitude: '',
    longitude: '',
    address: '',
    phone: '',
    email: '',
    availability: '24/7',
    responseRadius: '5000',
    currentStatus: 'available' as 'available' | 'busy' | 'offline',
    // Team members
    memberName: '',
    memberRole: '',
    memberPhone: '',
    memberBadgeNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.teamName || !formData.latitude || !formData.longitude || !formData.address) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const newTeam = {
        teamName: formData.teamName,
        teamType: formData.teamType,
        location: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          address: formData.address
        },
        contactInfo: {
          phone: formData.phone || 'N/A',
          email: formData.email || 'N/A'
        },
        members: formData.memberName ? [
          {
            name: formData.memberName,
            role: formData.memberRole || 'Team Member',
            phone: formData.memberPhone || 'N/A',
            badgeNumber: formData.memberBadgeNumber || 'N/A'
          }
        ] : [],
        availability: formData.availability,
        responseRadius: parseInt(formData.responseRadius),
        currentStatus: formData.currentStatus,
        lastActive: Timestamp.now()
      };

      await addDoc(collection(db, 'responseTeams'), newTeam);
      
      // Reset form
      setFormData({
        teamName: '',
        teamType: 'police',
        latitude: '',
        longitude: '',
        address: '',
        phone: '',
        email: '',
        availability: '24/7',
        responseRadius: '5000',
        currentStatus: 'available',
        memberName: '',
        memberRole: '',
        memberPhone: '',
        memberBadgeNumber: ''
      });
      
      alert('✅ Response team added successfully!');
      onClose();
    } catch (err: any) {
      console.error('Error adding response team:', err);
      setError(err.message || 'Failed to add response team');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🚓</span> Add New Response Team
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

          {/* Team Details */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <span>📋</span> Team Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  placeholder="e.g., Chennai North Response Team"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="teamType"
                  value={formData.teamType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="police">🚓 Police</option>
                  <option value="medical">🚑 Medical</option>
                  <option value="fire">🚒 Fire</option>
                  <option value="rescue">🛟 Rescue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <input
                  type="text"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  placeholder="e.g., 24/7"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Status
                </label>
                <select
                  name="currentStatus"
                  value={formData.currentStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">✅ Available</option>
                  <option value="busy">⏳ Busy</option>
                  <option value="offline">❌ Offline</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <span>📍</span> Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="e.g., 13.0827"
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
                  placeholder="e.g., 80.2707"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main Street, Chennai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Radius (meters)
                </label>
                <input
                  type="number"
                  name="responseRadius"
                  value={formData.responseRadius}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <span>📞</span> Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +91-9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., team@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Team Member (Optional) */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <span>👤</span> Team Member (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Name
                </label>
                <input
                  type="text"
                  name="memberName"
                  value={formData.memberName}
                  onChange={handleChange}
                  placeholder="e.g., Officer Raj"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  name="memberRole"
                  value={formData.memberRole}
                  onChange={handleChange}
                  placeholder="e.g., Team Lead"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="memberPhone"
                  value={formData.memberPhone}
                  onChange={handleChange}
                  placeholder="e.g., +91-9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge Number
                </label>
                <input
                  type="text"
                  name="memberBadgeNumber"
                  value={formData.memberBadgeNumber}
                  onChange={handleChange}
                  placeholder="e.g., CHN001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ Adding Team...' : '✅ Add Response Team'}
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

export default AddResponseTeamModal;

