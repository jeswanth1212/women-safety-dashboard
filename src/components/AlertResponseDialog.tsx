import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Circle, Clock } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { makeTeamAvailable } from '../utils/autoAssignTeam';

interface Alert {
  id: string;
  name: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  timestamp: any;
  status: 'pending' | 'resolved';
  assignedTeamId?: string;
}

interface AlertResponse {
  id: string;
  alertId: string;
  adminId: string;
  adminName: string;
  responseType: 'acknowledged' | 'dispatched' | 'arrived' | 'resolved';
  notes: string;
  timestamp: any;
}

interface Props {
  alert: Alert;
  onClose: () => void;
}

const RESPONSE_STEPS = [
  { type: 'acknowledged', label: 'Acknowledged', description: 'Alert has been seen and acknowledged' },
  { type: 'dispatched', label: 'Dispatched', description: 'Help has been dispatched to location' },
  { type: 'arrived', label: 'Arrived', description: 'Responders have arrived at location' },
  { type: 'resolved', label: 'Resolved', description: 'Situation has been resolved' }
] as const;

const AlertResponseDialog: React.FC<Props> = ({ alert, onClose }) => {
  const { adminUser } = useAuth();
  const [responses, setResponses] = useState<AlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchResponses();
  }, [alert.id]);

  const fetchResponses = async () => {
    try {
      const responsesQuery = query(
        collection(db, 'alertResponses'),
        where('alertId', '==', alert.id)
      );
      
      const snapshot = await getDocs(responsesQuery);
      const fetchedResponses: AlertResponse[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedResponses.push({
          id: doc.id,
          alertId: data.alertId,
          adminId: data.adminId,
          adminName: data.adminName,
          responseType: data.responseType,
          notes: data.notes || '',
          timestamp: data.timestamp
        });
      });

      // Sort by timestamp (oldest first) in JavaScript
      fetchedResponses.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return timeA - timeB;
      });

      setResponses(fetchedResponses);
      
      // Determine current step based on responses
      const stepOrder = ['acknowledged', 'dispatched', 'arrived', 'resolved'];
      const lastCompletedStep = fetchedResponses.length > 0 
        ? stepOrder.indexOf(fetchedResponses[fetchedResponses.length - 1].responseType)
        : -1;
      
      setCurrentStep(lastCompletedStep + 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching responses:', error);
      setLoading(false);
    }
  };

  const handleSubmitStep = async () => {
    if (!adminUser || currentStep >= RESPONSE_STEPS.length) return;

    setSubmitting(true);
    try {
      const step = RESPONSE_STEPS[currentStep];
      
      // Add response to Firestore
      await addDoc(collection(db, 'alertResponses'), {
        alertId: alert.id,
        adminId: adminUser.id,
        adminName: adminUser.name,
        responseType: step.type,
        notes: notes.trim(),
        timestamp: new Date()
      });

      // If this is the "resolved" step, update the main alert status
      if (step.type === 'resolved') {
        const alertRef = doc(db, 'sos', alert.id);
        await updateDoc(alertRef, {
          status: 'resolved'
        });

        // Make the assigned team available again
        if (alert.assignedTeamId) {
          await makeTeamAvailable(alert.assignedTeamId);
        }
      }

      // Refresh responses and reset notes
      await fetchResponses();
      setNotes('');
    } catch (error) {
      console.error('Error submitting response:', error);
      window.alert('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
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

  const isStepCompleted = (stepIndex: number) => {
    return responses.some(r => r.responseType === RESPONSE_STEPS[stepIndex].type);
  };

  const getStepResponse = (stepIndex: number) => {
    return responses.find(r => r.responseType === RESPONSE_STEPS[stepIndex].type);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Alert Response Timeline</h2>
            <p className="text-sm text-gray-600 mt-1">
              {alert.name} • {formatTimestamp(alert.timestamp)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading response timeline...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {RESPONSE_STEPS.map((step, index) => {
                const completed = isStepCompleted(index);
                const stepResponse = getStepResponse(index);
                const isCurrent = index === currentStep;
                const isDisabled = index > currentStep;

                return (
                  <div key={step.type} className="relative">
                    {/* Connector Line */}
                    {index < RESPONSE_STEPS.length - 1 && (
                      <div
                        className={`absolute left-5 top-12 w-0.5 h-16 ${
                          completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    )}

                    <div
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        completed
                          ? 'bg-green-50 border-green-500'
                          : isCurrent
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Step Icon */}
                        <div className="flex-shrink-0">
                          {completed ? (
                            <CheckCircle className="w-10 h-10 text-green-600" />
                          ) : isCurrent ? (
                            <Circle className="w-10 h-10 text-blue-600" />
                          ) : (
                            <Circle className="w-10 h-10 text-gray-400" />
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {step.label}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                          {/* Completed Step Info */}
                          {completed && stepResponse && (
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">{stepResponse.adminName}</span>
                                <span>•</span>
                                <span>{formatTimestamp(stepResponse.timestamp)}</span>
                              </div>
                              {stepResponse.notes && (
                                <p className="text-sm text-gray-600 italic bg-white p-2 rounded mt-2">
                                  "{stepResponse.notes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Current Step Input */}
                          {isCurrent && !completed && (
                            <div className="mt-4 space-y-3">
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={`Add notes for ${step.label.toLowerCase()}...`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows={2}
                              />
                              <button
                                onClick={handleSubmitStep}
                                disabled={submitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {submitting ? 'Submitting...' : `Mark as ${step.label}`}
                              </button>
                            </div>
                          )}

                          {/* Locked Step */}
                          {isDisabled && (
                            <p className="mt-2 text-sm text-gray-500 italic">
                              Complete previous steps first
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {responses.length} of {RESPONSE_STEPS.length} steps completed
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertResponseDialog;
