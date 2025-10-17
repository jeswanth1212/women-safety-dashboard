import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Alert {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: any;
}

interface ResponseTeam {
  id: string;
  teamName: string;
  teamType: 'police' | 'medical' | 'fire' | 'rescue';
  location: {
    latitude: number;
    longitude: number;
  };
  responseRadius: number;
  currentStatus: 'available' | 'busy' | 'offline';
}

// Calculate distance between two points using Haversine formula (in meters)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Find nearest available team to an alert
export const findNearestTeam = async (
  alert: Alert
): Promise<ResponseTeam | null> => {
  try {
    // Fetch all teams
    const teamsSnapshot = await getDocs(collection(db, 'responseTeams'));
    const teams: ResponseTeam[] = [];

    teamsSnapshot.forEach((doc) => {
      const data = doc.data();
      teams.push({
        id: doc.id,
        teamName: data.teamName,
        teamType: data.teamType,
        location: data.location,
        responseRadius: data.responseRadius,
        currentStatus: data.currentStatus
      });
    });

    // Filter available teams
    const availableTeams = teams.filter(
      (team) => team.currentStatus === 'available'
    );

    if (availableTeams.length === 0) {
      console.log('No available teams found');
      return null;
    }

    // Calculate distance for each team and find the nearest
    let nearestTeam: ResponseTeam | null = null;
    let minDistance = Infinity;

    availableTeams.forEach((team) => {
      const distance = calculateDistance(
        alert.latitude,
        alert.longitude,
        team.location.latitude,
        team.location.longitude
      );

      // Check if team is within response radius
      if (distance <= team.responseRadius && distance < minDistance) {
        minDistance = distance;
        nearestTeam = team;
      }
    });

    // If no team within response radius, assign the closest one anyway
    if (!nearestTeam && availableTeams.length > 0) {
      availableTeams.forEach((team) => {
        const distance = calculateDistance(
          alert.latitude,
          alert.longitude,
          team.location.latitude,
          team.location.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestTeam = team;
        }
      });
    }

    return nearestTeam;
  } catch (error) {
    console.error('Error finding nearest team:', error);
    return null;
  }
};

// Auto-assign team to alert
export const autoAssignTeamToAlert = async (alertId: string, alert: Alert) => {
  try {
    // Find nearest available team
    const nearestTeam = await findNearestTeam(alert);

    if (!nearestTeam) {
      console.log('No suitable team found for alert:', alertId);
      return;
    }

    // Update alert with assigned team
    const alertRef = doc(db, 'sos', alertId);
    await updateDoc(alertRef, {
      assignedTeamId: nearestTeam.id,
      assignedTeamName: nearestTeam.teamName,
      assignedAt: new Date()
    });

    // Update team status to busy
    const teamRef = doc(db, 'responseTeams', nearestTeam.id);
    await updateDoc(teamRef, {
      currentStatus: 'busy',
      lastActive: new Date()
    });

    console.log(`✅ Assigned team ${nearestTeam.teamName} to alert ${alertId}`);
    return nearestTeam;
  } catch (error) {
    console.error('Error auto-assigning team:', error);
    throw error;
  }
};

// Check for unassigned alerts and assign teams
export const checkAndAssignUnassignedAlerts = async () => {
  try {
    // Get all pending alerts without assigned teams
    const alertsSnapshot = await getDocs(collection(db, 'sos'));
    const unassignedAlerts: { id: string; data: Alert }[] = [];

    alertsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'pending' && !data.assignedTeamId) {
        unassignedAlerts.push({
          id: doc.id,
          data: {
            id: doc.id,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: data.timestamp
          }
        });
      }
    });

    console.log(`Found ${unassignedAlerts.length} unassigned alerts`);

    // Assign teams to unassigned alerts
    for (const alert of unassignedAlerts) {
      await autoAssignTeamToAlert(alert.id, alert.data);
    }
  } catch (error) {
    console.error('Error checking unassigned alerts:', error);
  }
};

// Make team available when alert is resolved
export const makeTeamAvailable = async (teamId: string) => {
  try {
    const teamRef = doc(db, 'responseTeams', teamId);
    await updateDoc(teamRef, {
      currentStatus: 'available',
      lastActive: new Date()
    });
    
    console.log(`✅ Team ${teamId} is now available`);
    
    // Check for unassigned alerts
    await checkAndAssignUnassignedAlerts();
  } catch (error) {
    console.error('Error making team available:', error);
  }
};


