import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const patrolsData = [
  {
    patrolZone: "T Nagar Commercial Area",
    location: { 
      latitude: 13.0418,
      longitude: 80.2341,
      radius: 1000
    },
    assignedTeamId: "patrol_team_001",
    assignedTeamName: "T Nagar Patrol Unit",
    patrolType: "foot_patrol",
    schedule: {
      days: ["Monday", "Wednesday", "Friday"],
      startTime: "18:00",
      endTime: "22:00"
    },
    route: [
      { latitude: 13.0418, longitude: 80.2341, checkpointName: "T Nagar Bus Stand" },
      { latitude: 13.0425, longitude: 80.2355, checkpointName: "Pondy Bazaar" },
      { latitude: 13.0432, longitude: 80.2368, checkpointName: "Ranganathan Street" }
    ],
    frequency: "Alternate Days",
    priority: "high",
    status: "active",
    lastPatrolDate: Timestamp.fromDate(new Date('2025-10-16T20:00:00')),
    nextPatrolDate: Timestamp.fromDate(new Date('2025-10-18T18:00:00')),
    notes: "Focus on poorly lit areas near shopping complexes"
  },
  {
    patrolZone: "Marina Beach Promenade",
    location: { 
      latitude: 13.0569,
      longitude: 80.2425,
      radius: 1500
    },
    assignedTeamId: "patrol_team_002",
    assignedTeamName: "Marina Beach Patrol Unit",
    patrolType: "bike_patrol",
    schedule: {
      days: ["Tuesday", "Thursday", "Saturday", "Sunday"],
      startTime: "17:00",
      endTime: "21:00"
    },
    route: [
      { latitude: 13.0569, longitude: 80.2425, checkpointName: "Marina Beach Entrance" },
      { latitude: 13.0590, longitude: 80.2440, checkpointName: "Ice House" },
      { latitude: 13.0620, longitude: 80.2470, checkpointName: "Lighthouse" }
    ],
    frequency: "Daily",
    priority: "high",
    status: "active",
    lastPatrolDate: Timestamp.fromDate(new Date('2025-10-16T19:30:00')),
    nextPatrolDate: Timestamp.fromDate(new Date('2025-10-17T17:00:00')),
    notes: "Increased surveillance during evening hours"
  },
  {
    patrolZone: "Anna Nagar Residential Zone",
    location: { 
      latitude: 13.0878,
      longitude: 80.2088,
      radius: 800
    },
    assignedTeamId: "patrol_team_003",
    assignedTeamName: "Anna Nagar Patrol Unit",
    patrolType: "vehicle_patrol",
    schedule: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: "20:00",
      endTime: "02:00"
    },
    route: [
      { latitude: 13.0878, longitude: 80.2088, checkpointName: "Anna Nagar Tower" },
      { latitude: 13.0892, longitude: 80.2102, checkpointName: "Shanti Colony" },
      { latitude: 13.0910, longitude: 80.2120, checkpointName: "2nd Avenue" }
    ],
    frequency: "Daily",
    priority: "medium",
    status: "active",
    lastPatrolDate: Timestamp.fromDate(new Date('2025-10-17T01:30:00')),
    nextPatrolDate: Timestamp.fromDate(new Date('2025-10-17T20:00:00')),
    notes: "Cover all main streets and parks"
  },
  {
    patrolZone: "Chennai Central Railway Area",
    location: { 
      latitude: 13.0827,
      longitude: 80.2707,
      radius: 1200
    },
    assignedTeamId: "patrol_team_004",
    assignedTeamName: "Railway Station Patrol Unit",
    patrolType: "foot_patrol",
    schedule: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      startTime: "06:00",
      endTime: "23:00"
    },
    route: [
      { latitude: 13.0827, longitude: 80.2707, checkpointName: "Platform Area" },
      { latitude: 13.0835, longitude: 80.2720, checkpointName: "Waiting Hall" },
      { latitude: 13.0840, longitude: 80.2730, checkpointName: "Parking Area" }
    ],
    frequency: "Daily",
    priority: "high",
    status: "active",
    lastPatrolDate: Timestamp.fromDate(new Date('2025-10-17T10:00:00')),
    nextPatrolDate: Timestamp.fromDate(new Date('2025-10-17T18:00:00')),
    notes: "High footfall area - continuous monitoring required"
  },
  {
    patrolZone: "Adyar IT Park Zone",
    location: { 
      latitude: 13.0067,
      longitude: 80.2574,
      radius: 900
    },
    assignedTeamId: "patrol_team_005",
    assignedTeamName: "Adyar IT Corridor Patrol",
    patrolType: "vehicle_patrol",
    schedule: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: "19:00",
      endTime: "23:00"
    },
    route: [
      { latitude: 13.0067, longitude: 80.2574, checkpointName: "IT Park Gate 1" },
      { latitude: 13.0078, longitude: 80.2585, checkpointName: "Food Court Area" },
      { latitude: 13.0090, longitude: 80.2595, checkpointName: "Parking Lot B" }
    ],
    frequency: "Daily",
    priority: "medium",
    status: "active",
    lastPatrolDate: Timestamp.fromDate(new Date('2025-10-16T22:00:00')),
    nextPatrolDate: Timestamp.fromDate(new Date('2025-10-17T19:00:00')),
    notes: "Focus on parking areas and walking paths"
  },
  {
    patrolZone: "Besant Nagar Beach Road",
    location: { 
      latitude: 13.0001,
      longitude: 80.2668,
      radius: 700
    },
    assignedTeamId: "patrol_team_006",
    assignedTeamName: "Besant Nagar Beach Patrol",
    patrolType: "bike_patrol",
    schedule: {
      days: ["Saturday", "Sunday"],
      startTime: "17:00",
      endTime: "22:00"
    },
    route: [
      { latitude: 13.0001, longitude: 80.2668, checkpointName: "Beach Entrance" },
      { latitude: 13.0010, longitude: 80.2675, checkpointName: "Karl Schmidt Memorial" },
      { latitude: 13.0020, longitude: 80.2682, checkpointName: "Beach Parking" }
    ],
    frequency: "Weekends",
    priority: "low",
    status: "paused",
    lastPatrolDate: Timestamp.fromDate(new Date('2025-10-13T21:00:00')),
    nextPatrolDate: Timestamp.fromDate(new Date('2025-10-19T17:00:00')),
    notes: "Temporarily paused due to weather conditions"
  }
];

export const seedPatrols = async () => {
  try {
    const patrolsCollection = collection(db, 'patrols');
    const snapshot = await getDocs(patrolsCollection);
    
    if (snapshot.empty) {
      console.log('Seeding patrols data...');
      
      for (const patrol of patrolsData) {
        await addDoc(patrolsCollection, patrol);
      }
      
      console.log('✅ Patrols seeded successfully!');
    } else {
      console.log('Patrols already exist, skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding patrols:', error);
  }
};

