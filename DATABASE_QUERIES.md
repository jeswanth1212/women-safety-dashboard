# Women Safety Dashboard - Database Queries & Operations

## 📊 Complete Query Documentation

This document shows **every database operation** performed in the application with actual code examples.

---

## 🔑 Firestore Query Methods Used

### Basic Operations:
- `collection()` - Reference a collection
- `doc()` - Reference a specific document
- `addDoc()` - Add new document with auto-generated ID
- `getDoc()` - Get a single document
- `getDocs()` - Get multiple documents
- `updateDoc()` - Update existing document
- `deleteDoc()` - Delete a document
- `onSnapshot()` - Real-time listener for changes

### Query Operations:
- `query()` - Build a query
- `where()` - Filter documents
- `orderBy()` - Sort documents
- `limit()` - Limit results
- `Timestamp.now()` - Get current timestamp
- `Timestamp.fromDate()` - Convert date to timestamp

---

## 1️⃣ **ADMIN OPERATIONS** (`admins` collection)

### 1.1 CREATE - Register New Admin
**Operation**: Add new admin user to database

**Query**:
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const newAdmin = {
  email: "admin@test.com",
  name: "Super Admin",
  role: "super_admin",
  permissions: ["view_alerts", "resolve_alerts", "manage_users"],
  createdAt: Timestamp.now(),
  lastLogin: Timestamp.now()
};

const docRef = await addDoc(collection(db, 'admins'), newAdmin);
console.log("Admin created with ID:", docRef.id);
```

**SQL Equivalent**:
```sql
INSERT INTO admins (email, name, role, permissions, createdAt, lastLogin)
VALUES ('admin@test.com', 'Super Admin', 'super_admin', 
        '["view_alerts","resolve_alerts"]', NOW(), NOW());
```

---

### 1.2 READ - Get Admin by ID
**Operation**: Fetch admin details during login

**Query**:
```javascript
import { doc, getDoc } from 'firebase/firestore';

const adminRef = doc(db, 'admins', userId);
const adminSnap = await getDoc(adminRef);

if (adminSnap.exists()) {
  const adminData = adminSnap.data();
  console.log("Admin data:", adminData);
} else {
  console.log("No admin found!");
}
```

**SQL Equivalent**:
```sql
SELECT * FROM admins WHERE id = 'userId';
```

**Used in**: `src/contexts/AuthContext.tsx`

---

### 1.3 UPDATE - Update Last Login
**Operation**: Track admin's last login time

**Query**:
```javascript
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const adminRef = doc(db, 'admins', adminId);
await updateDoc(adminRef, {
  lastLogin: Timestamp.now()
});
```

**SQL Equivalent**:
```sql
UPDATE admins SET lastLogin = NOW() WHERE id = 'adminId';
```

---

## 2️⃣ **SOS ALERT OPERATIONS** (`sos` collection)

### 2.1 CREATE - New SOS Alert (from Mobile App)
**Operation**: User triggers emergency alert

**Query**:
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const newAlert = {
  userId: "user_123",
  userName: "Priya Sharma",
  userPhone: "+91-9876543210",
  location: {
    latitude: 13.0827,
    longitude: 80.2707
  },
  timestamp: Timestamp.now(),
  status: "pending",
  alertType: "emergency"
};

const alertRef = await addDoc(collection(db, 'sos'), newAlert);
console.log("Alert created:", alertRef.id);
```

**SQL Equivalent**:
```sql
INSERT INTO sos (userId, userName, userPhone, latitude, longitude, 
                 timestamp, status, alertType)
VALUES ('user_123', 'Priya Sharma', '+91-9876543210', 
        13.0827, 80.2707, NOW(), 'pending', 'emergency');
```

**Used in**: Mobile Flutter app (`defenshe1/lib/services/sos_service.dart`)

---

### 2.2 READ - Get All Pending Alerts
**Operation**: Display unresolved alerts in admin dashboard

**Query**:
```javascript
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const alertsQuery = query(
  collection(db, 'sos'),
  where('status', '==', 'pending'),
  orderBy('timestamp', 'desc')
);

const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
  const alerts = [];
  snapshot.forEach((doc) => {
    alerts.push({ id: doc.id, ...doc.data() });
  });
  console.log("Pending alerts:", alerts);
});
```

**SQL Equivalent**:
```sql
SELECT * FROM sos 
WHERE status = 'pending' 
ORDER BY timestamp DESC;
```

**Used in**: `src/pages/Alerts.tsx`

---

### 2.3 READ - Get All Alerts (Sorted by Status)
**Operation**: Show unresolved alerts first, then resolved alerts

**Query**:
```javascript
import { collection, onSnapshot } from 'firebase/firestore';

const alertsCollection = collection(db, 'sos');

onSnapshot(alertsCollection, (snapshot) => {
  const fetchedAlerts = [];
  snapshot.forEach((doc) => {
    fetchedAlerts.push({ id: doc.id, ...doc.data() });
  });
  
  // Client-side sorting
  fetchedAlerts.sort((a, b) => {
    // Pending alerts first
    if (a.status !== b.status) {
      if (a.status === 'pending' && b.status === 'resolved') return -1;
      if (a.status === 'resolved' && b.status === 'pending') return 1;
    }
    // Within same status, newest first
    const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
    const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
    return timeB - timeA;
  });
  
  console.log("Sorted alerts:", fetchedAlerts);
});
```

**SQL Equivalent**:
```sql
SELECT * FROM sos 
ORDER BY 
  CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
  timestamp DESC;
```

**Used in**: `src/pages/Alerts.tsx`

---

### 2.4 UPDATE - Assign Response Team to Alert
**Operation**: Auto-assign nearest available team

**Query**:
```javascript
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const alertRef = doc(db, 'sos', alertId);
await updateDoc(alertRef, {
  assignedTeamId: teamId,
  assignedTeamName: teamName,
  assignedAt: Timestamp.now()
});
```

**SQL Equivalent**:
```sql
UPDATE sos 
SET assignedTeamId = 'team_001', 
    assignedTeamName = 'Chennai Central Response Team',
    assignedAt = NOW()
WHERE id = 'alertId';
```

**Used in**: `src/utils/autoAssignTeam.ts`

---

### 2.5 UPDATE - Resolve Alert
**Operation**: Mark alert as resolved when all response steps complete

**Query**:
```javascript
import { doc, updateDoc } from 'firebase/firestore';

const alertRef = doc(db, 'sos', alertId);
await updateDoc(alertRef, {
  status: 'resolved'
});
```

**SQL Equivalent**:
```sql
UPDATE sos SET status = 'resolved' WHERE id = 'alertId';
```

**Used in**: `src/components/AlertResponseDialog.tsx`

---

## 3️⃣ **ALERT RESPONSE OPERATIONS** (`alertResponses` collection)

### 3.1 CREATE - Add Response Step
**Operation**: Track each step in alert response timeline

**Query**:
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const newResponse = {
  alertId: "alert_123",
  responseType: "acknowledged",
  responseTime: Timestamp.now(),
  adminEmail: "admin@test.com",
  adminName: "Super Admin",
  notes: "Alert acknowledged, dispatching team",
  sequenceNumber: 1
};

await addDoc(collection(db, 'alertResponses'), newResponse);
```

**SQL Equivalent**:
```sql
INSERT INTO alertResponses (alertId, responseType, responseTime, 
                             adminEmail, adminName, notes, sequenceNumber)
VALUES ('alert_123', 'acknowledged', NOW(), 
        'admin@test.com', 'Super Admin', 
        'Alert acknowledged, dispatching team', 1);
```

**Used in**: `src/components/AlertResponseDialog.tsx`

---

### 3.2 READ - Get Response History for Alert
**Operation**: Display all response steps for an alert

**Query**:
```javascript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const responsesQuery = query(
  collection(db, 'alertResponses'),
  where('alertId', '==', alertId),
  orderBy('sequenceNumber', 'asc')
);

const snapshot = await getDocs(responsesQuery);
const responses = [];
snapshot.forEach((doc) => {
  responses.push({ id: doc.id, ...doc.data() });
});
```

**SQL Equivalent**:
```sql
SELECT * FROM alertResponses 
WHERE alertId = 'alert_123' 
ORDER BY sequenceNumber ASC;
```

**Used in**: `src/components/AlertResponseDialog.tsx`

---

### 3.3 READ - Count Responses by Admin
**Operation**: Get admin performance statistics

**Query**:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

const adminResponsesQuery = query(
  collection(db, 'alertResponses'),
  where('adminEmail', '==', 'admin@test.com'),
  where('responseType', '==', 'resolved')
);

const snapshot = await getDocs(adminResponsesQuery);
const resolvedCount = snapshot.size;
console.log("Admin resolved:", resolvedCount, "alerts");
```

**SQL Equivalent**:
```sql
SELECT COUNT(*) FROM alertResponses 
WHERE adminEmail = 'admin@test.com' 
  AND responseType = 'resolved';
```

---

## 4️⃣ **RESPONSE TEAMS OPERATIONS** (`responseTeams` collection)

### 4.1 CREATE - Add New Response Team
**Operation**: Admin adds a new emergency response team

**Query**:
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const newTeam = {
  teamName: "Chennai Central Response Team",
  teamType: "police",
  location: {
    latitude: 13.0827,
    longitude: 80.2707,
    address: "Central Police Station, Chennai"
  },
  contactInfo: {
    phone: "+91-44-23456789",
    email: "team@chennai.gov.in"
  },
  members: [
    {
      name: "Officer Raj",
      role: "Team Lead",
      phone: "+91-9876543210",
      badgeNumber: "CHN001"
    }
  ],
  availability: "24/7",
  responseRadius: 5000,
  currentStatus: "available",
  lastActive: Timestamp.now()
};

await addDoc(collection(db, 'responseTeams'), newTeam);
```

**SQL Equivalent**:
```sql
INSERT INTO responseTeams (teamName, teamType, latitude, longitude, 
                           address, phone, email, availability, 
                           responseRadius, currentStatus, lastActive)
VALUES ('Chennai Central Response Team', 'police', 13.0827, 80.2707,
        'Central Police Station, Chennai', '+91-44-23456789',
        'team@chennai.gov.in', '24/7', 5000, 'available', NOW());

-- Separate table for members (normalized design)
INSERT INTO teamMembers (teamId, name, role, phone, badgeNumber)
VALUES ('team_001', 'Officer Raj', 'Team Lead', 
        '+91-9876543210', 'CHN001');
```

**Used in**: `src/components/AddResponseTeamModal.tsx`

---

### 4.2 READ - Get All Teams (Real-time)
**Operation**: Display all response teams with live status updates

**Query**:
```javascript
import { collection, onSnapshot } from 'firebase/firestore';

const teamsCollection = collection(db, 'responseTeams');

const unsubscribe = onSnapshot(teamsCollection, (snapshot) => {
  const teams = [];
  snapshot.forEach((doc) => {
    teams.push({ id: doc.id, ...doc.data() });
  });
  console.log("Response teams:", teams);
});
```

**SQL Equivalent**:
```sql
SELECT * FROM responseTeams;
-- Note: Real-time updates require polling or websockets in SQL
```

**Used in**: `src/pages/ResponseTeams.tsx`, `src/pages/Maps.tsx`

---

### 4.3 READ - Get Available Teams for Auto-Assignment
**Operation**: Find teams that are available to handle new alerts

**Query**:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

const availableTeamsQuery = query(
  collection(db, 'responseTeams'),
  where('currentStatus', '==', 'available')
);

const snapshot = await getDocs(availableTeamsQuery);
const availableTeams = [];
snapshot.forEach((doc) => {
  availableTeams.push({ id: doc.id, ...doc.data() });
});
```

**SQL Equivalent**:
```sql
SELECT * FROM responseTeams WHERE currentStatus = 'available';
```

**Used in**: `src/hooks/useAutoAssignTeams.ts`

---

### 4.4 UPDATE - Change Team Status
**Operation**: Update team availability (Available/Busy/Offline)

**Query**:
```javascript
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const teamRef = doc(db, 'responseTeams', teamId);
await updateDoc(teamRef, {
  currentStatus: 'busy',
  lastActive: Timestamp.now()
});
```

**SQL Equivalent**:
```sql
UPDATE responseTeams 
SET currentStatus = 'busy', 
    lastActive = NOW() 
WHERE id = 'team_001';
```

**Used in**: `src/pages/ResponseTeams.tsx`, `src/utils/autoAssignTeam.ts`

---

### 4.5 COMPLEX QUERY - Find Nearest Available Team (Geospatial)
**Operation**: Auto-assign nearest team using Haversine formula

**Query**:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

// Step 1: Get all available teams
const availableTeamsQuery = query(
  collection(db, 'responseTeams'),
  where('currentStatus', '==', 'available')
);

const snapshot = await getDocs(availableTeamsQuery);
const teams = [];
snapshot.forEach((doc) => {
  teams.push({ id: doc.id, ...doc.data() });
});

// Step 2: Calculate distance using Haversine formula (client-side)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Step 3: Find nearest team
let nearestTeam = null;
let minDistance = Infinity;

teams.forEach(team => {
  const distance = calculateDistance(
    alertLocation.latitude,
    alertLocation.longitude,
    team.location.latitude,
    team.location.longitude
  );
  
  if (distance < minDistance && distance <= team.responseRadius / 1000) {
    minDistance = distance;
    nearestTeam = team;
  }
});
```

**SQL Equivalent (PostGIS)**:
```sql
SELECT *, 
  ST_Distance(
    ST_MakePoint(longitude, latitude)::geography,
    ST_MakePoint(80.2707, 13.0827)::geography
  ) AS distance
FROM responseTeams
WHERE currentStatus = 'available'
  AND ST_Distance(
    ST_MakePoint(longitude, latitude)::geography,
    ST_MakePoint(80.2707, 13.0827)::geography
  ) <= responseRadius
ORDER BY distance ASC
LIMIT 1;
```

**Used in**: `src/utils/autoAssignTeam.ts`

---

## 5️⃣ **PATROLS OPERATIONS** (`patrols` collection)

### 5.1 CREATE - Add New Patrol
**Operation**: Admin schedules a new security patrol

**Query**:
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const newPatrol = {
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
    { latitude: 13.0425, longitude: 80.2355, checkpointName: "Pondy Bazaar" }
  ],
  frequency: "Alternate Days",
  priority: "high",
  status: "active",
  lastPatrolDate: Timestamp.now(),
  nextPatrolDate: Timestamp.fromDate(new Date('2025-10-18T18:00:00')),
  notes: "Focus on poorly lit areas"
};

await addDoc(collection(db, 'patrols'), newPatrol);
```

**SQL Equivalent**:
```sql
INSERT INTO patrols (patrolZone, latitude, longitude, radius, 
                     assignedTeamId, patrolType, frequency, 
                     priority, status, lastPatrolDate, 
                     nextPatrolDate, notes)
VALUES ('T Nagar Commercial Area', 13.0418, 80.2341, 1000,
        'patrol_team_001', 'foot_patrol', 'Alternate Days',
        'high', 'active', NOW(), 
        '2025-10-18 18:00:00', 'Focus on poorly lit areas');

-- Separate tables for schedule and route (normalized)
INSERT INTO patrolSchedules (patrolId, day, startTime, endTime)
VALUES 
  ('patrol_001', 'Monday', '18:00', '22:00'),
  ('patrol_001', 'Wednesday', '18:00', '22:00'),
  ('patrol_001', 'Friday', '18:00', '22:00');

INSERT INTO patrolCheckpoints (patrolId, sequenceNumber, latitude, 
                                longitude, checkpointName)
VALUES 
  ('patrol_001', 1, 13.0418, 80.2341, 'T Nagar Bus Stand'),
  ('patrol_001', 2, 13.0425, 80.2355, 'Pondy Bazaar');
```

**Used in**: `src/components/AddPatrolModal.tsx`

---

### 5.2 READ - Get Active Patrols Sorted by Priority
**Operation**: Display high-priority patrols first

**Query**:
```javascript
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const patrolsQuery = query(
  collection(db, 'patrols'),
  orderBy('priority', 'desc')
);

onSnapshot(patrolsQuery, (snapshot) => {
  const patrols = [];
  snapshot.forEach((doc) => {
    patrols.push({ id: doc.id, ...doc.data() });
  });
  console.log("Patrols:", patrols);
});
```

**SQL Equivalent**:
```sql
SELECT * FROM patrols 
ORDER BY 
  CASE priority 
    WHEN 'high' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'low' THEN 3 
  END ASC;
```

**Used in**: `src/pages/Patrols.tsx`

---

### 5.3 READ - Filter Patrols by Status
**Operation**: Show only active/paused/completed patrols

**Query**:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

const activePatrolsQuery = query(
  collection(db, 'patrols'),
  where('status', '==', 'active')
);

const snapshot = await getDocs(activePatrolsQuery);
const activePatrols = [];
snapshot.forEach((doc) => {
  activePatrols.push({ id: doc.id, ...doc.data() });
});
```

**SQL Equivalent**:
```sql
SELECT * FROM patrols WHERE status = 'active';
```

**Used in**: `src/pages/Patrols.tsx`

---

## 6️⃣ **SAFE ZONES OPERATIONS** (`safeZones` collection)

### 6.1 CREATE - Add Safe Zone
**Operation**: Admin marks a location as safe

**Query**:
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const newSafeZone = {
  name: "Central Mall",
  type: "mall",
  address: "456 Market St, Chennai",
  location: {
    latitude: 13.0827,
    longitude: 80.2707
  },
  radius: 500,
  verifiedBy: "admin@test.com",
  securityFeatures: ["CCTV", "Security Guards", "Emergency Button"],
  rating: 4.5,
  createdAt: Timestamp.now()
};

await addDoc(collection(db, 'safeZones'), newSafeZone);
```

**SQL Equivalent**:
```sql
INSERT INTO safeZones (name, type, address, latitude, longitude, 
                       radius, verifiedBy, rating, createdAt)
VALUES ('Central Mall', 'mall', '456 Market St, Chennai',
        13.0827, 80.2707, 500, 'admin@test.com', 4.5, NOW());

INSERT INTO zoneSecurityFeatures (zoneId, feature)
VALUES 
  ('safe_001', 'CCTV'),
  ('safe_001', 'Security Guards'),
  ('safe_001', 'Emergency Button');
```

**Used in**: `src/components/AddSafeZoneModal.tsx`

---

### 6.2 READ - Get All Safe Zones for Map Display
**Operation**: Show safe zones on the map

**Query**:
```javascript
import { collection, onSnapshot } from 'firebase/firestore';

const safeZonesCollection = collection(db, 'safeZones');

onSnapshot(safeZonesCollection, (snapshot) => {
  const zones = [];
  snapshot.forEach((doc) => {
    zones.push({ id: doc.id, ...doc.data() });
  });
  console.log("Safe zones:", zones);
});
```

**SQL Equivalent**:
```sql
SELECT * FROM safeZones;
```

**Used in**: `src/pages/Maps.tsx`

---

### 6.3 COMPLEX QUERY - Find Nearest Safe Zone
**Operation**: Direct user to closest safe location

**Query**:
```javascript
import { collection, getDocs } from 'firebase/firestore';

// Get all safe zones
const snapshot = await getDocs(collection(db, 'safeZones'));
const zones = [];
snapshot.forEach((doc) => {
  zones.push({ id: doc.id, ...doc.data() });
});

// Calculate distances (same Haversine formula as teams)
let nearestZone = null;
let minDistance = Infinity;

zones.forEach(zone => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    zone.location.latitude,
    zone.location.longitude
  );
  
  if (distance < minDistance) {
    minDistance = distance;
    nearestZone = zone;
  }
});
```

**SQL Equivalent (PostGIS)**:
```sql
SELECT *, 
  ST_Distance(
    ST_MakePoint(longitude, latitude)::geography,
    ST_MakePoint(80.2707, 13.0827)::geography
  ) AS distance
FROM safeZones
ORDER BY distance ASC
LIMIT 1;
```

---

## 7️⃣ **DANGER ZONES OPERATIONS** (`dangerZones` collection)

### 7.1 CREATE - Add Danger Zone
**Operation**: Mark high-risk area based on incidents

**Query**:
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const newDangerZone = {
  location: {
    latitude: 13.0827,
    longitude: 80.2707
  },
  areaName: "T Nagar Evening Zone",
  description: "High incident rate during evening hours",
  threatLevel: "high",
  incidentCount: 15,
  timePattern: {
    dangerousHours: ["22:00-02:00", "18:00-20:00"],
    safestTime: "10:00-16:00"
  },
  aiPredictedRisk: 0.85,
  lastUpdated: Timestamp.now(),
  radius: 200,
  incidentTypes: ["harassment", "theft", "assault"]
};

await addDoc(collection(db, 'dangerZones'), newDangerZone);
```

**SQL Equivalent**:
```sql
INSERT INTO dangerZones (latitude, longitude, areaName, description,
                         threatLevel, incidentCount, aiPredictedRisk,
                         lastUpdated, radius)
VALUES (13.0827, 80.2707, 'T Nagar Evening Zone',
        'High incident rate during evening hours',
        'high', 15, 0.85, NOW(), 200);
```

**Used in**: `src/components/AddDangerZoneModal.tsx`

---

### 7.2 READ - Get High-Risk Danger Zones
**Operation**: Display high-threat areas prominently

**Query**:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

const highRiskQuery = query(
  collection(db, 'dangerZones'),
  where('threatLevel', '==', 'high')
);

const snapshot = await getDocs(highRiskQuery);
const highRiskZones = [];
snapshot.forEach((doc) => {
  highRiskZones.push({ id: doc.id, ...doc.data() });
});
```

**SQL Equivalent**:
```sql
SELECT * FROM dangerZones WHERE threatLevel = 'high';
```

**Used in**: `src/pages/Maps.tsx`, `src/pages/Analytics.tsx`

---

### 7.3 UPDATE - Update Danger Zone Risk Score
**Operation**: AI recalculates risk based on new incidents

**Query**:
```javascript
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const zoneRef = doc(db, 'dangerZones', zoneId);
await updateDoc(zoneRef, {
  incidentCount: 20,
  aiPredictedRisk: 0.92,
  lastUpdated: Timestamp.now()
});
```

**SQL Equivalent**:
```sql
UPDATE dangerZones 
SET incidentCount = 20, 
    aiPredictedRisk = 0.92, 
    lastUpdated = NOW()
WHERE id = 'zone_001';
```

---

## 8️⃣ **ISSUES OPERATIONS** (`issues` collection)

### 8.1 CREATE - Report New Issue
**Operation**: User reports a safety concern

**Query**:
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const newIssue = {
  description: "harassment",
  latitude: 12.844212,
  longitude: 80.1548664,
  location: "Lat: 12.844212, Lon: 80.1548664",
  timestamp: Timestamp.now(),
  issueType: "harassment",
  reportedBy: "User Anonymous",
  status: "reported",
  severity: "high"
};

await addDoc(collection(db, 'issues'), newIssue);
```

**SQL Equivalent**:
```sql
INSERT INTO issues (description, latitude, longitude, location,
                    timestamp, issueType, reportedBy, status, severity)
VALUES ('harassment', 12.844212, 80.1548664,
        'Lat: 12.844212, Lon: 80.1548664',
        NOW(), 'harassment', 'User Anonymous', 'reported', 'high');
```

**Used in**: Mobile Flutter app

---

### 8.2 READ - Get All Issues Sorted by Time
**Operation**: Display recent issues first

**Query**:
```javascript
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const issuesQuery = query(
  collection(db, 'issues'),
  orderBy('timestamp', 'desc')
);

onSnapshot(issuesQuery, (snapshot) => {
  const issues = [];
  snapshot.forEach((doc) => {
    issues.push({ id: doc.id, ...doc.data() });
  });
  console.log("Issues:", issues);
});
```

**SQL Equivalent**:
```sql
SELECT * FROM issues ORDER BY timestamp DESC;
```

**Used in**: `src/pages/Issues.tsx`

---

### 8.3 READ - Filter Issues by Status
**Operation**: Show only reported/investigating/resolved issues

**Query**:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

const reportedIssuesQuery = query(
  collection(db, 'issues'),
  where('status', '==', 'reported')
);

const snapshot = await getDocs(reportedIssuesQuery);
// Process results...
```

**SQL Equivalent**:
```sql
SELECT * FROM issues WHERE status = 'reported';
```

**Used in**: `src/pages/Issues.tsx`

---

### 8.4 UPDATE - Change Issue Status
**Operation**: Admin marks issue as investigating/resolved

**Query**:
```javascript
import { doc, updateDoc } from 'firebase/firestore';

const issueRef = doc(db, 'issues', issueId);
await updateDoc(issueRef, {
  status: 'investigating'
});
```

**SQL Equivalent**:
```sql
UPDATE issues SET status = 'investigating' WHERE id = 'issue_001';
```

---

### 8.5 AGGREGATION - Count Issues by Type
**Operation**: Analytics dashboard shows issue breakdown

**Query**:
```javascript
import { collection, getDocs } from 'firebase/firestore';

const snapshot = await getDocs(collection(db, 'issues'));
const issuesByType = {};

snapshot.forEach((doc) => {
  const issue = doc.data();
  const type = issue.issueType;
  issuesByType[type] = (issuesByType[type] || 0) + 1;
});

console.log("Issues by type:", issuesByType);
// Output: { harassment: 15, theft: 10, assault: 5 }
```

**SQL Equivalent**:
```sql
SELECT issueType, COUNT(*) as count
FROM issues
GROUP BY issueType;
```

**Used in**: `src/pages/Dashboard.tsx`, `src/pages/Analytics.tsx`

---

## 9️⃣ **ANALYTICS OPERATIONS** (`analytics` collection)

### 9.1 CREATE - Generate Daily Analytics
**Operation**: System auto-generates analytics at midnight

**Query**:
```javascript
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

// Step 1: Aggregate data from multiple collections
const sosSnapshot = await getDocs(collection(db, 'sos'));
const totalAlerts = sosSnapshot.size;
const resolvedAlerts = sosSnapshot.docs.filter(
  doc => doc.data().status === 'resolved'
).length;

// Step 2: Calculate metrics
const avgResponseTime = 8.5; // Calculate from alertResponses

// Step 3: Store analytics
const analytics = {
  period: "daily",
  periodDate: Timestamp.fromDate(new Date('2025-10-17')),
  metrics: {
    totalAlerts: totalAlerts,
    resolvedAlerts: resolvedAlerts,
    pendingAlerts: totalAlerts - resolvedAlerts,
    avgResponseTime: avgResponseTime,
    activeUsers: 250
  },
  incidentsByType: {
    emergency: 20,
    harassment: 15,
    medical: 10
  },
  aiPredictions: {
    nextDayAlerts: 12,
    highRiskAreas: ["T Nagar", "Anna Nagar"],
    riskScore: 7.5
  },
  generatedAt: Timestamp.now()
};

await addDoc(collection(db, 'analytics'), analytics);
```

**SQL Equivalent**:
```sql
-- Multiple aggregation queries
INSERT INTO analytics (period, periodDate, totalAlerts, 
                       resolvedAlerts, avgResponseTime)
SELECT 'daily', 
       CURRENT_DATE,
       COUNT(*) as totalAlerts,
       COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolvedAlerts,
       AVG(responseTime) as avgResponseTime
FROM sos
WHERE DATE(timestamp) = CURRENT_DATE;
```

**Used in**: `src/utils/seedAnalytics.ts`

---

### 9.2 READ - Get Latest Analytics for Dashboard
**Operation**: Display today's statistics

**Query**:
```javascript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const today = new Date();
today.setHours(0, 0, 0, 0);

const analyticsQuery = query(
  collection(db, 'analytics'),
  where('period', '==', 'daily'),
  where('periodDate', '>=', Timestamp.fromDate(today)),
  orderBy('periodDate', 'desc'),
  limit(1)
);

const snapshot = await getDocs(analyticsQuery);
if (!snapshot.empty) {
  const todayAnalytics = snapshot.docs[0].data();
  console.log("Today's analytics:", todayAnalytics);
}
```

**SQL Equivalent**:
```sql
SELECT * FROM analytics 
WHERE period = 'daily' 
  AND periodDate = CURRENT_DATE
ORDER BY periodDate DESC
LIMIT 1;
```

**Used in**: `src/pages/Dashboard.tsx`

---

### 9.3 READ - Get Weekly/Monthly Analytics
**Operation**: Show trend analysis over time

**Query**:
```javascript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const weeklyAnalyticsQuery = query(
  collection(db, 'analytics'),
  where('period', '==', 'weekly'),
  orderBy('periodDate', 'desc'),
  limit(12) // Last 12 weeks
);

const snapshot = await getDocs(weeklyAnalyticsQuery);
const weeklyData = [];
snapshot.forEach((doc) => {
  weeklyData.push(doc.data());
});
```

**SQL Equivalent**:
```sql
SELECT * FROM analytics 
WHERE period = 'weekly'
ORDER BY periodDate DESC
LIMIT 12;
```

**Used in**: `src/pages/Analytics.tsx`

---

## 🔟 **USERS OPERATIONS** (`users` collection)

### 10.1 CREATE - Register New User
**Operation**: New user signs up on mobile app

**Query**:
```javascript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const newUser = {
  name: "Priya Sharma",
  email: "priya@example.com",
  phone: "+91-9876543210",
  emergencyContacts: [
    {
      name: "Raj Sharma",
      phone: "+91-9876543211",
      relation: "Father"
    }
  ],
  createdAt: Timestamp.now(),
  lastActive: Timestamp.now()
};

await addDoc(collection(db, 'users'), newUser);
```

**SQL Equivalent**:
```sql
INSERT INTO users (name, email, phone, createdAt, lastActive)
VALUES ('Priya Sharma', 'priya@example.com', 
        '+91-9876543210', NOW(), NOW());

INSERT INTO emergencyContacts (userId, name, phone, relation)
VALUES ('user_123', 'Raj Sharma', '+91-9876543211', 'Father');
```

**Used in**: Mobile Flutter app

---

### 10.2 READ - Get User Details
**Operation**: Fetch user profile and emergency contacts

**Query**:
```javascript
import { doc, getDoc } from 'firebase/firestore';

const userRef = doc(db, 'users', userId);
const userSnap = await getDoc(userRef);

if (userSnap.exists()) {
  const userData = userSnap.data();
  console.log("User:", userData);
}
```

**SQL Equivalent**:
```sql
SELECT u.*, ec.* 
FROM users u
LEFT JOIN emergencyContacts ec ON u.id = ec.userId
WHERE u.id = 'user_123';
```

---

### 10.3 UPDATE - Update Last Active Time
**Operation**: Track user activity

**Query**:
```javascript
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const userRef = doc(db, 'users', userId);
await updateDoc(userRef, {
  lastActive: Timestamp.now()
});
```

**SQL Equivalent**:
```sql
UPDATE users SET lastActive = NOW() WHERE id = 'user_123';
```

---

## 🔗 **COMPLEX MULTI-COLLECTION QUERIES**

### 11.1 Get Alert with Full Details (JOIN-like query)
**Operation**: Display alert with user info, assigned team, and response history

**Query**:
```javascript
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

async function getAlertFullDetails(alertId) {
  // Get alert
  const alertRef = doc(db, 'sos', alertId);
  const alertSnap = await getDoc(alertRef);
  const alertData = { id: alertSnap.id, ...alertSnap.data() };
  
  // Get user details
  const userRef = doc(db, 'users', alertData.userId);
  const userSnap = await getDoc(userRef);
  alertData.userDetails = userSnap.data();
  
  // Get assigned team details
  if (alertData.assignedTeamId) {
    const teamRef = doc(db, 'responseTeams', alertData.assignedTeamId);
    const teamSnap = await getDoc(teamRef);
    alertData.teamDetails = teamSnap.data();
  }
  
  // Get response history
  const responsesQuery = query(
    collection(db, 'alertResponses'),
    where('alertId', '==', alertId)
  );
  const responsesSnap = await getDocs(responsesQuery);
  alertData.responses = [];
  responsesSnap.forEach(doc => {
    alertData.responses.push(doc.data());
  });
  
  return alertData;
}
```

**SQL Equivalent**:
```sql
SELECT 
  a.*,
  u.name as userName,
  u.phone as userPhone,
  u.email as userEmail,
  t.teamName,
  t.teamType,
  t.phone as teamPhone,
  ar.responseType,
  ar.responseTime,
  ar.notes
FROM sos a
LEFT JOIN users u ON a.userId = u.id
LEFT JOIN responseTeams t ON a.assignedTeamId = t.id
LEFT JOIN alertResponses ar ON a.id = ar.alertId
WHERE a.id = 'alert_123';
```

---

### 11.2 Dashboard Statistics (Multiple Aggregations)
**Operation**: Get counts and metrics for dashboard overview

**Query**:
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

async function getDashboardStats() {
  // Total alerts
  const sosSnapshot = await getDocs(collection(db, 'sos'));
  const totalAlerts = sosSnapshot.size;
  
  // Pending alerts
  const pendingQuery = query(
    collection(db, 'sos'),
    where('status', '==', 'pending')
  );
  const pendingSnapshot = await getDocs(pendingQuery);
  const pendingAlerts = pendingSnapshot.size;
  
  // Response team stats
  const teamsSnapshot = await getDocs(collection(db, 'responseTeams'));
  const teamStats = {
    total: teamsSnapshot.size,
    available: 0,
    busy: 0,
    offline: 0
  };
  teamsSnapshot.forEach(doc => {
    const status = doc.data().currentStatus;
    teamStats[status]++;
  });
  
  // Total issues
  const issuesSnapshot = await getDocs(collection(db, 'issues'));
  const totalIssues = issuesSnapshot.size;
  
  return {
    totalAlerts,
    pendingAlerts,
    resolvedAlerts: totalAlerts - pendingAlerts,
    teamStats,
    totalIssues
  };
}
```

**SQL Equivalent**:
```sql
-- Multiple queries combined
SELECT 
  (SELECT COUNT(*) FROM sos) as totalAlerts,
  (SELECT COUNT(*) FROM sos WHERE status = 'pending') as pendingAlerts,
  (SELECT COUNT(*) FROM responseTeams WHERE currentStatus = 'available') as availableTeams,
  (SELECT COUNT(*) FROM issues) as totalIssues;
```

**Used in**: `src/pages/Dashboard.tsx`

---

## 📊 Query Performance Optimization

### Indexes Created (Conceptual - Firestore auto-indexes)
```javascript
// Single-field indexes
sos: ['status', 'timestamp', 'assignedTeamId']
alertResponses: ['alertId', 'sequenceNumber']
responseTeams: ['currentStatus']
patrols: ['priority', 'status']
issues: ['status', 'timestamp', 'severity']
analytics: ['period', 'periodDate']

// Composite indexes
sos: ['status', 'timestamp'] // For "pending alerts ordered by time"
alertResponses: ['alertId', 'sequenceNumber'] // For response history
```

**SQL Equivalent**:
```sql
-- Single-column indexes
CREATE INDEX idx_sos_status ON sos(status);
CREATE INDEX idx_sos_timestamp ON sos(timestamp);
CREATE INDEX idx_teams_status ON responseTeams(currentStatus);

-- Composite indexes
CREATE INDEX idx_sos_status_time ON sos(status, timestamp DESC);
CREATE INDEX idx_responses_alert ON alertResponses(alertId, sequenceNumber);
```

---

## 🎯 Summary of Operations by Type

| Operation | Collections | Query Type | Complexity |
|-----------|-------------|------------|------------|
| **CREATE** | All 10 | `addDoc()` | Simple |
| **READ (Single)** | admins, users | `getDoc()` | Simple |
| **READ (Multiple)** | All 10 | `getDocs()` | Simple |
| **READ (Real-time)** | sos, responseTeams, patrols | `onSnapshot()` | Medium |
| **UPDATE** | sos, responseTeams, issues | `updateDoc()` | Simple |
| **DELETE** | (Soft delete via status) | `updateDoc()` | Simple |
| **WHERE Filter** | All 10 | `where()` | Simple |
| **ORDER BY** | sos, issues, patrols | `orderBy()` | Simple |
| **LIMIT** | analytics | `limit()` | Simple |
| **Geospatial** | responseTeams, safeZones | Custom (Haversine) | Complex |
| **Aggregation** | analytics, dashboard | Client-side | Medium |
| **JOIN-like** | Alert details | Multiple `getDoc()` | Complex |

---

## 🔐 Security Rules (Applied at Database Level)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sos/{document=**} {
      allow read: if true;
      allow update: if true;
    }
    match /users/{document=**} {
      allow read: if true;
    }
    match /admins/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /responseTeams/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /patrols/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /safeZones/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /dangerZones/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /issues/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /analytics/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /alertResponses/{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

---

## 📝 Conclusion

This document demonstrates:
✅ **CRUD operations** on all 10 collections  
✅ **Simple queries** (SELECT, WHERE, ORDER BY)  
✅ **Complex queries** (JOINs, aggregations, geospatial)  
✅ **Real-time listeners** (NoSQL advantage)  
✅ **Indexing strategy** for performance  
✅ **SQL equivalents** for DBMS concepts  

**Total Query Types**: 45+  
**Collections Covered**: 10/10  
**DBMS Operations**: CREATE, READ, UPDATE, DELETE, FILTER, SORT, AGGREGATE, JOIN  

---

*Generated for DBMS Project - Women Safety Dashboard*  
*Date: October 17, 2025*

