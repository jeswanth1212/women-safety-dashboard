import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface SafeZone {
  name: string;
  type: 'mall' | 'police_station' | 'hospital' | 'public_place';
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  verifiedBy: string;
  securityFeatures: string[];
  rating: number;
}

const CHENNAI_SAFE_ZONES: SafeZone[] = [
  {
    name: "Egmore Police Station",
    type: "police_station",
    address: "EVR Periyar Salai, Egmore, Chennai, Tamil Nadu 600008",
    location: {
      latitude: 13.0732,
      longitude: 80.2609
    },
    radius: 300,
    verifiedBy: "admin",
    securityFeatures: ["24/7 Police Presence", "CCTV Surveillance", "Emergency Response", "Women's Help Desk"],
    rating: 4.5
  },
  {
    name: "Apollo Hospitals",
    type: "hospital",
    address: "21, Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006",
    location: {
      latitude: 13.0569,
      longitude: 80.2495
    },
    radius: 400,
    verifiedBy: "admin",
    securityFeatures: ["24/7 Security Guards", "CCTV Surveillance", "Emergency Care", "Well-lit Area"],
    rating: 4.8
  },
  {
    name: "Phoenix Marketcity",
    type: "mall",
    address: "142, Velachery Road, Velachery, Chennai, Tamil Nadu 600042",
    location: {
      latitude: 12.9934,
      longitude: 80.2203
    },
    radius: 500,
    verifiedBy: "admin",
    securityFeatures: ["CCTV Coverage", "Security Guards", "Emergency Buttons", "Women's Safety Patrol", "Well-lit Parking"],
    rating: 4.6
  },
  {
    name: "Anna Nagar Police Station",
    type: "police_station",
    address: "2nd Avenue, Anna Nagar West, Chennai, Tamil Nadu 600040",
    location: {
      latitude: 13.0878,
      longitude: 80.2087
    },
    radius: 350,
    verifiedBy: "admin",
    securityFeatures: ["24/7 Police Presence", "CCTV Surveillance", "Quick Response Team", "Women's Safety Cell"],
    rating: 4.4
  },
  {
    name: "Marina Beach Police Booth",
    type: "public_place",
    address: "Marina Beach, Kamarajar Salai, Chennai, Tamil Nadu 600001",
    location: {
      latitude: 13.0499,
      longitude: 80.2824
    },
    radius: 250,
    verifiedBy: "admin",
    securityFeatures: ["Police Booth", "CCTV Cameras", "Emergency SOS", "Regular Patrolling"],
    rating: 4.2
  }
];

export const seedSafeZones = async (): Promise<void> => {
  try {
    // Check if safe zones already exist
    const safeZonesRef = collection(db, 'safeZones');
    const snapshot = await getDocs(safeZonesRef);

    if (snapshot.empty) {
      console.log('No safe zones found. Seeding Chennai safe zones...');
      
      // Add all safe zones
      for (const zone of CHENNAI_SAFE_ZONES) {
        await addDoc(safeZonesRef, {
          ...zone,
          createdAt: new Date()
        });
      }
      
      console.log(`✅ Successfully seeded ${CHENNAI_SAFE_ZONES.length} safe zones in Chennai`);
    } else {
      console.log(`ℹ️ Safe zones already exist (${snapshot.size} zones found). Skipping seed.`);
    }
  } catch (error) {
    console.error('Error seeding safe zones:', error);
  }
};

export default seedSafeZones;


