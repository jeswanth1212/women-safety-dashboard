import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const issuesData = [
  {
    description: 'harassment',
    latitude: 13.0827,
    longitude: 80.2707,
    location: 'Lat: 13.0827, Lon: 80.2707',
    timestamp: Timestamp.now(),
    issueType: 'harassment',
    reportedBy: 'User Anonymous',
    status: 'reported',
    severity: 'high'
  },
  {
    description: 'suspicious activity',
    latitude: 13.0478,
    longitude: 80.2785,
    location: 'Lat: 13.0478, Lon: 80.2785',
    timestamp: Timestamp.now(),
    issueType: 'suspicious_activity',
    reportedBy: 'User Anonymous',
    status: 'investigating',
    severity: 'medium'
  },
  {
    description: 'poor lighting',
    latitude: 13.0569,
    longitude: 80.2425,
    location: 'Lat: 13.0569, Lon: 80.2425',
    timestamp: Timestamp.now(),
    issueType: 'infrastructure',
    reportedBy: 'User Anonymous',
    status: 'reported',
    severity: 'low'
  },
  {
    description: 'assault',
    latitude: 13.0878,
    longitude: 80.2785,
    location: 'Lat: 13.0878, Lon: 80.2785',
    timestamp: Timestamp.now(),
    issueType: 'assault',
    reportedBy: 'User Anonymous',
    status: 'resolved',
    severity: 'critical'
  },
  {
    description: 'vandalism',
    latitude: 13.0358,
    longitude: 80.2464,
    location: 'Lat: 13.0358, Lon: 80.2464',
    timestamp: Timestamp.now(),
    issueType: 'vandalism',
    reportedBy: 'User Anonymous',
    status: 'reported',
    severity: 'medium'
  }
];

export const seedIssues = async () => {
  try {
    const issuesCollection = collection(db, 'issues');
    const snapshot = await getDocs(issuesCollection);
    
    // Only seed if we have less than 6 issues (1 existing + 5 new)
    if (snapshot.size < 6) {
      console.log('Seeding issues data...');
      
      for (const issue of issuesData) {
        await addDoc(issuesCollection, issue);
      }
      
      console.log('✅ Issues seeded successfully!');
    } else {
      console.log('Issues already exist, skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding issues:', error);
  }
};

