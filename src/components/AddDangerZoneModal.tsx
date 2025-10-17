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

const AddDangerZoneModal: React.FC<Props> = ({ location, adminName, onClose, onSuccess }) => {
  const [areaName, setAreaName] = useState('');
  const [description, setDescription] = useState('');
  const [threatLevel, setThreatLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [radius, setRadius] = useState(200);
  const [incidentCount, setIncidentCount] = useState(0);
  const [aiPredictedRisk, setAiPredictedRisk] = useState(0.5);
  const [incidentTypes, setIncidentTypes] = useState<string[]>([]);
  const [newIncidentType, setNewIncidentType] = useState('');
  const [dangerousHours, setDangerousHours] = useState('');
  const [safestTime, setSafestTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddIncidentType = () => {
    if (newIncidentType.trim() && !incidentTypes.includes(newIncidentType.trim())) {
      setIncidentTypes([...incidentTypes, newIncidentType.trim()]);
      setNewIncidentType('');
    }
  };

  const handleRemoveIncidentType = (type: string) => {
    setIncidentTypes(incidentTypes.filter(t => t !== type));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!areaName.trim() || !description.trim()) {
      window.alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'dangerZones'), {
        location: {
          latitude: location.lat,
          longitude: location.lng
        },
        areaName: areaName.trim(),
        description: description.trim(),
        threatLevel,
        incidentCount,
        timePattern: {
          dangerousHours: dangerousHours.split(',').map(h => h.trim()).filter(h => h),
          safestTime: safestTime.trim()
        },
        aiPredictedRisk,
        radius,
        incidentTypes,
        reportedBy: adminName,
        lastUpdated: new Date(),
        createdAt: new Date()
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding danger zone:', error);
      window.alert('Failed to add danger zone. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getThreatColor = () => {
    switch (threatLevel) {
      case 'high': return 'bg-red-100 border-red-500';
      case 'medium': return 'bg-orange-100 border-orange-500';
      case 'low': return 'bg-yellow-100 border-yellow-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${getThreatColor()}`}>
          <div>
            <h2 className="text-2xl font-bold text-red-800">⚠️ Add Danger Zone</h2>
            <p className="text-sm text-red-600 mt-1">
              Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-red-700" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Area Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Parrys Corner - Late Night"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={2}
                placeholder="e.g., High incident rate during late evening hours, poorly lit areas"
                required
              />
            </div>

            {/* Threat Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Threat Level <span className="text-red-500">*</span>
              </label>
              <select
                value={threatLevel}
                onChange={(e) => setThreatLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="low">🟡 Low Risk</option>
                <option value="medium">🟠 Medium Risk</option>
                <option value="high">🔴 High Risk</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Incident Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reported Incidents
                </label>
                <input
                  type="number"
                  min="0"
                  value={incidentCount}
                  onChange={(e) => setIncidentCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* AI Risk Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Risk Score: {aiPredictedRisk.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={aiPredictedRisk}
                  onChange={(e) => setAiPredictedRisk(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danger Radius (meters): {radius}m
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
            </div>

            {/* Time Patterns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dangerous Hours (comma-separated)
              </label>
              <input
                type="text"
                value={dangerousHours}
                onChange={(e) => setDangerousHours(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 22:00-02:00, 00:00-04:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safest Time
              </label>
              <input
                type="text"
                value={safestTime}
                onChange={(e) => setSafestTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 10:00-17:00"
              />
            </div>

            {/* Incident Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Types
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newIncidentType}
                  onChange={(e) => setNewIncidentType(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIncidentType())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., harassment, theft, assault"
                />
                <button
                  type="button"
                  onClick={handleAddIncidentType}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Add
                </button>
              </div>
              {incidentTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {incidentTypes.map((type, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                    >
                      ⚠️ {type}
                      <button
                        type="button"
                        onClick={() => handleRemoveIncidentType(type)}
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
            disabled={submitting || !areaName.trim() || !description.trim()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Adding...' : 'Add Danger Zone'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDangerZoneModal;



