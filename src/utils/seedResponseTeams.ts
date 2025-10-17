import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../config/firebase';

export const seedResponseTeams = async () => {
  try {
    // Check if response teams already exist
    const responseTeamsRef = collection(db, 'responseTeams');
    const existingTeams = await getDocs(query(responseTeamsRef));
    
    if (existingTeams.size >= 5) {
      console.log('Response teams already seeded');
      return;
    }

    const teams = [
      {
        teamName: "Chennai Central Police Response Unit",
        teamType: "police",
        location: {
          latitude: 13.0827,
          longitude: 80.2707,
          address: "Central Police Station, Park Town, Chennai"
        },
        contactInfo: {
          phone: "+91-44-23456789",
          email: "central@chennaipolice.gov.in"
        },
        members: [
          {
            name: "Inspector Rajesh Kumar",
            role: "Team Lead",
            phone: "+91-9876543210",
            badgeNumber: "CHN001"
          },
          {
            name: "Constable Priya Sharma",
            role: "Field Officer",
            phone: "+91-9876543211",
            badgeNumber: "CHN002"
          }
        ],
        availability: "24/7",
        responseRadius: 5000,
        currentStatus: "available",
        lastActive: new Date(),
        createdAt: new Date()
      },
      {
        teamName: "T. Nagar Medical Emergency Team",
        teamType: "medical",
        location: {
          latitude: 13.0418,
          longitude: 80.2341,
          address: "Apollo Hospital, Greams Road, Chennai"
        },
        contactInfo: {
          phone: "+91-44-28296000",
          email: "emergency@apollochennai.com"
        },
        members: [
          {
            name: "Dr. Anjali Reddy",
            role: "Chief Medical Officer",
            phone: "+91-9876543220",
            badgeNumber: "MED001"
          },
          {
            name: "Paramedic Suresh Kumar",
            role: "Emergency Responder",
            phone: "+91-9876543221",
            badgeNumber: "MED002"
          }
        ],
        availability: "24/7",
        responseRadius: 4000,
        currentStatus: "available",
        lastActive: new Date(),
        createdAt: new Date()
      },
      {
        teamName: "Anna Nagar Fire & Rescue",
        teamType: "fire",
        location: {
          latitude: 13.0850,
          longitude: 80.2101,
          address: "Fire Station, Anna Nagar West, Chennai"
        },
        contactInfo: {
          phone: "+91-44-26161000",
          email: "annanagar@chennaifire.gov.in"
        },
        members: [
          {
            name: "Fire Officer Karthik Venkat",
            role: "Station Commander",
            phone: "+91-9876543230",
            badgeNumber: "FIRE001"
          },
          {
            name: "Firefighter Deepak Singh",
            role: "Rescue Specialist",
            phone: "+91-9876543231",
            badgeNumber: "FIRE002"
          }
        ],
        availability: "24/7",
        responseRadius: 6000,
        currentStatus: "available",
        lastActive: new Date(),
        createdAt: new Date()
      },
      {
        teamName: "Adyar Women Safety Patrol",
        teamType: "police",
        location: {
          latitude: 13.0067,
          longitude: 80.2570,
          address: "Adyar Police Station, Chennai"
        },
        contactInfo: {
          phone: "+91-44-24913300",
          email: "adyar@chennaipolice.gov.in"
        },
        members: [
          {
            name: "Sub-Inspector Lakshmi Bai",
            role: "Women Safety Lead",
            phone: "+91-9876543240",
            badgeNumber: "ADY001"
          },
          {
            name: "Constable Meena Devi",
            role: "Patrol Officer",
            phone: "+91-9876543241",
            badgeNumber: "ADY002"
          }
        ],
        availability: "24/7",
        responseRadius: 4500,
        currentStatus: "available",
        lastActive: new Date(),
        createdAt: new Date()
      },
      {
        teamName: "Velachery Multi-Response Unit",
        teamType: "rescue",
        location: {
          latitude: 12.9750,
          longitude: 80.2212,
          address: "Velachery Main Road, Chennai"
        },
        contactInfo: {
          phone: "+91-44-22430000",
          email: "velachery@rescue.gov.in"
        },
        members: [
          {
            name: "Rescue Lead Arjun Menon",
            role: "Team Commander",
            phone: "+91-9876543250",
            badgeNumber: "RES001"
          },
          {
            name: "Technician Vimal Kumar",
            role: "Emergency Tech Specialist",
            phone: "+91-9876543251",
            badgeNumber: "RES002"
          }
        ],
        availability: "24/7",
        responseRadius: 5500,
        currentStatus: "busy",
        lastActive: new Date(),
        createdAt: new Date()
      }
    ];

    // Add teams to Firestore
    for (const team of teams) {
      await addDoc(responseTeamsRef, team);
    }

    console.log('✅ Successfully seeded 5 response teams in Chennai');
  } catch (error) {
    console.error('Error seeding response teams:', error);
  }
};


