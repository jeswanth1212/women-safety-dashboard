import { useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { autoAssignTeamToAlert } from '../utils/autoAssignTeam';

/**
 * Hook that listens for new SOS alerts and automatically assigns
 * the nearest available response team
 */
export const useAutoAssignTeams = () => {
  const processedAlertsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log('🚨 Auto-assignment service started');

    // Listen for all SOS alerts
    const unsubscribe = onSnapshot(collection(db, 'sos'), (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const alertData = change.doc.data();
          const alertId = change.doc.id;

          // Check if this is a new pending alert without an assigned team
          if (
            alertData.status === 'pending' &&
            !alertData.assignedTeamId &&
            !processedAlertsRef.current.has(alertId)
          ) {
            console.log(`🚨 New unassigned alert detected: ${alertId}`);
            
            // Mark as processed to avoid duplicate assignments
            processedAlertsRef.current.add(alertId);

            try {
              // Auto-assign nearest team
              await autoAssignTeamToAlert(alertId, {
                id: alertId,
                latitude: alertData.latitude,
                longitude: alertData.longitude,
                timestamp: alertData.timestamp
              });
              
              console.log(`✅ Team assigned to alert ${alertId}`);
            } catch (error) {
              console.error(`❌ Failed to assign team to alert ${alertId}:`, error);
              // Remove from processed set if assignment failed
              processedAlertsRef.current.delete(alertId);
            }
          }
        }
      });
    });

    return () => {
      console.log('🛑 Auto-assignment service stopped');
      unsubscribe();
    };
  }, []);
};


