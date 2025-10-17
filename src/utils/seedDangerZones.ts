import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DangerZone {
  location: { latitude: number; longitude: number };
  threatLevel: 'high' | 'medium' | 'low';
  incidentCount: number;
  timePattern: {
    dangerousHours: string[];
    safestTime: string;
  };
  aiPredictedRisk: number; // 0-1
  radius: number;
  incidentTypes: string[];
  areaName: string;
  description: string;
}

const CHENNAI_DANGER_ZONES: DangerZone[] = [
  {
    location: { latitude: 13.0389, longitude: 80.2619 },
    areaName: "Parrys Corner - Late Night",
    description: "High incident rate during late evening hours, poorly lit areas",
    threatLevel: "high",
    incidentCount: 28,
    timePattern: {
      dangerousHours: ["22:00-02:00", "00:00-04:00"],
      safestTime: "10:00-17:00"
    },
    aiPredictedRisk: 0.85,
    radius: 300,
    incidentTypes: ["harassment", "theft", "assault"]
  },
  {
    location: { latitude: 13.0067, longitude: 80.2206 },
    areaName: "Guindy Industrial Area",
    description: "Isolated area with limited public presence after work hours",
    threatLevel: "high",
    incidentCount: 22,
    timePattern: {
      dangerousHours: ["20:00-06:00"],
      safestTime: "09:00-18:00"
    },
    aiPredictedRisk: 0.78,
    radius: 400,
    incidentTypes: ["harassment", "stalking", "theft"]
  },
  {
    location: { latitude: 13.0475, longitude: 80.2824 },
    areaName: "Beach Road - Evening",
    description: "Crowded tourist spot with reports of harassment in isolated sections",
    threatLevel: "medium",
    incidentCount: 15,
    timePattern: {
      dangerousHours: ["19:00-22:00", "05:00-07:00"],
      safestTime: "08:00-18:00"
    },
    aiPredictedRisk: 0.65,
    radius: 250,
    incidentTypes: ["harassment", "stalking"]
  },
  {
    location: { latitude: 12.9716, longitude: 80.2434 },
    areaName: "Adyar Back Streets",
    description: "Narrow lanes with poor lighting and low foot traffic",
    threatLevel: "medium",
    incidentCount: 18,
    timePattern: {
      dangerousHours: ["21:00-01:00"],
      safestTime: "10:00-19:00"
    },
    aiPredictedRisk: 0.72,
    radius: 200,
    incidentTypes: ["harassment", "theft", "stalking"]
  },
  {
    location: { latitude: 13.1067, longitude: 80.0969 },
    areaName: "Ambattur Industrial Estate",
    description: "Industrial zone with limited security presence during off-hours",
    threatLevel: "low",
    incidentCount: 12,
    timePattern: {
      dangerousHours: ["22:00-05:00"],
      safestTime: "08:00-20:00"
    },
    aiPredictedRisk: 0.58,
    radius: 350,
    incidentTypes: ["theft", "harassment"]
  }
];

export const seedDangerZones = async (): Promise<void> => {
  try {
    // Check if danger zones already exist
    const dangerZonesRef = collection(db, 'dangerZones');
    const snapshot = await getDocs(dangerZonesRef);

    if (snapshot.empty) {
      console.log('No danger zones found. Seeding Chennai danger zones...');
      
      // Add all danger zones
      for (const zone of CHENNAI_DANGER_ZONES) {
        await addDoc(dangerZonesRef, {
          ...zone,
          lastUpdated: new Date(),
          createdAt: new Date()
        });
      }
      
      console.log(`✅ Successfully seeded ${CHENNAI_DANGER_ZONES.length} danger zones in Chennai`);
    } else {
      console.log(`ℹ️ Danger zones already exist (${snapshot.size} zones found). Skipping seed.`);
    }
  } catch (error) {
    console.error('Error seeding danger zones:', error);
  }
};

export default seedDangerZones;


