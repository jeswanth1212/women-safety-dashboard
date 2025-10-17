import React, { useState } from 'react';
import { X } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Props {
  location: { lat: number; lng: number };
  adminName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddSafeZoneModal: React.FC<Props> = ({ location, adminName, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'mall' | 'police_station' | 'hospital' | 'public_place'>('public_place');
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(300);
  const [rating, setRating] = useState(4.0);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !address.trim()) {
      window.alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'safeZones'), {
        name: name.trim(),
        type,
        address: address.trim(),
        location: {
          latitude: location.lat,
          longitude: location.lng
        },
        radius,
        verifiedBy: adminName,
        securityFeatures: features,
        rating,
        createdAt: new Date()
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding safe zone:', error);
      window.alert('Failed to add safe zone. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-green-50">
          <div>
            <h2 className="text-2xl font-bold text-green-800">🛡️ Add Safe Zone</h2>
            <p className="text-sm text-green-600 mt-1">
              Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-green-700" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Phoenix Marketcity"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="mall">🛍️ Mall</option>
                <option value="police_station">👮 Police Station</option>
                <option value="hospital">🏥 Hospital</option>
                <option value="public_place">🏛️ Public Place</option>
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                rows={2}
                placeholder="e.g., 142, Velachery Road, Velachery, Chennai"
                required
              />
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safety Radius (meters): {radius}m
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>100m</span>
                <span>1000m</span>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safety Rating: {rating}/5 ⭐
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>5</span>
              </div>
            </div>

            {/* Security Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Features
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., CCTV Cameras"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      ✓ {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feature)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !address.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Adding...' : 'Add Safe Zone'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSafeZoneModal;



