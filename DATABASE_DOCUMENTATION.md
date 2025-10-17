# Women Safety Dashboard - Database Documentation

## 📊 Complete Database Schema & DBMS Concepts

---

## 1. **`admins` Collection**

### Purpose:
Stores administrator user credentials and access control information for the web dashboard.

### Schema:
```typescript
{
  id: "auto-generated",
  email: "admin@test.com",
  name: "Admin Name",
  role: "super_admin" | "moderator" | "viewer",
  permissions: ["view_alerts", "resolve_alerts", "manage_users"],
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

### DBMS Concepts:
- **Primary Key**: `id` (auto-generated unique identifier)
- **Authentication**: Stores login credentials
- **Role-Based Access Control (RBAC)**: Different roles with different permissions
- **Audit Trail**: Tracks `createdAt` and `lastLogin` timestamps

### Relationships:
- **One-to-Many** with `alertResponses`: One admin can respond to multiple alerts
- **Referenced in**: `alertResponses.adminEmail` (Foreign Key reference)

### Sample Data:
```json
{
  "id": "admin123",
  "email": "admin@test.com",
  "name": "Super Admin",
  "role": "super_admin",
  "permissions": ["view_alerts", "resolve_alerts", "manage_users", "manage_teams"],
  "createdAt": "2025-10-15T10:00:00Z",
  "lastLogin": "2025-10-17T09:30:00Z"
}
```

---

## 2. **`sos` Collection**

### Purpose:
Stores emergency SOS alerts triggered by users from the mobile app.

### Schema:
```typescript
{
  id: "auto-generated",
  userId: "reference-to-users",
  userName: "User Name",
  userPhone: "+91-9876543210",
  location: {
    latitude: 13.0827,
    longitude: 80.2707
  },
  timestamp: Timestamp,
  status: "pending" | "resolved",
  alertType: "emergency" | "harassment" | "medical",
  assignedTeamId: "reference-to-responseTeams",
  assignedTeamName: "Chennai Central Response Team",
  assignedAt: Timestamp
}
```

### DBMS Concepts:
- **Primary Key**: `id`
- **Foreign Keys**: 
  - `userId` → references `users.id`
  - `assignedTeamId` → references `responseTeams.id`
- **Geospatial Data**: Stores latitude/longitude coordinates
- **Status Tracking**: Enum field for alert lifecycle
- **Indexing**: Should be indexed on `timestamp` for efficient querying

### Relationships:
- **Many-to-One** with `users`: Many alerts can be created by one user
- **One-to-Many** with `alertResponses`: One alert can have multiple response entries
- **Many-to-One** with `responseTeams`: One team can handle multiple alerts

### Sample Data:
```json
{
  "id": "sos_001",
  "userId": "user_123",
  "userName": "Priya Sharma",
  "userPhone": "+91-9876543210",
  "location": { "latitude": 13.0827, "longitude": 80.2707 },
  "timestamp": "2025-10-17T08:45:00Z",
  "status": "pending",
  "alertType": "emergency",
  "assignedTeamId": "team_001",
  "assignedTeamName": "Chennai Central Response Team",
  "assignedAt": "2025-10-17T08:46:00Z"
}
```

---

## 3. **`alertResponses` Collection**

### Purpose:
Tracks the complete response timeline for each SOS alert (Acknowledged → Dispatched → Arrived → Resolved).

### Schema:
```typescript
{
  id: "auto-generated",
  alertId: "reference-to-sos",
  responseType: "acknowledged" | "dispatched" | "arrived" | "resolved",
  responseTime: Timestamp,
  adminEmail: "reference-to-admins",
  adminName: "Admin Name",
  notes: "Police dispatched to location",
  sequenceNumber: 1 | 2 | 3 | 4
}
```

### DBMS Concepts:
- **Primary Key**: `id`
- **Foreign Keys**: 
  - `alertId` → references `sos.id`
  - `adminEmail` → references `admins.email`
- **Sequential Workflow**: Steps must be completed in order
- **Audit Logging**: Tracks who did what and when
- **Composite Relationship**: Links alerts and admins

### Relationships:
- **Many-to-One** with `sos`: Multiple responses belong to one alert
- **Many-to-One** with `admins`: Multiple responses can be created by one admin

### Sample Data:
```json
{
  "id": "response_001",
  "alertId": "sos_001",
  "responseType": "acknowledged",
  "responseTime": "2025-10-17T08:46:00Z",
  "adminEmail": "admin@test.com",
  "adminName": "Super Admin",
  "notes": "Alert acknowledged, dispatching team",
  "sequenceNumber": 1
}
```

---

## 4. **`responseTeams` Collection**

### Purpose:
Stores information about emergency response teams (Police, Medical, Fire, Rescue) that handle SOS alerts.

### Schema:
```typescript
{
  id: "auto-generated",
  teamName: "Chennai Central Response Team",
  teamType: "police" | "medical" | "fire" | "rescue",
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
  currentStatus: "available" | "busy" | "offline",
  lastActive: Timestamp
}
```

### DBMS Concepts:
- **Primary Key**: `id`
- **Nested/Embedded Document**: `location`, `contactInfo`, `members` (NoSQL feature)
- **Geospatial Queries**: Used for nearest neighbor search (Haversine formula)
- **Array Data Type**: `members` array stores multiple team members
- **Status Management**: Real-time availability tracking

### Relationships:
- **One-to-Many** with `sos`: One team can be assigned to multiple alerts
- **One-to-Many** with `patrols`: One team can handle multiple patrol routes

### Sample Data:
```json
{
  "id": "team_001",
  "teamName": "Chennai Central Response Team",
  "teamType": "police",
  "location": {
    "latitude": 13.0827,
    "longitude": 80.2707,
    "address": "Central Police Station, Chennai"
  },
  "contactInfo": {
    "phone": "+91-44-23456789",
    "email": "team@chennai.gov.in"
  },
  "members": [
    { "name": "Officer Raj", "role": "Team Lead", "phone": "+91-9876543210", "badgeNumber": "CHN001" }
  ],
  "availability": "24/7",
  "responseRadius": 5000,
  "currentStatus": "available",
  "lastActive": "2025-10-17T10:00:00Z"
}
```

---

## 5. **`patrols` Collection**

### Purpose:
Manages scheduled security patrol routes and schedules for proactive crime prevention.

### Schema:
```typescript
{
  id: "auto-generated",
  patrolZone: "T Nagar Commercial Area",
  location: {
    latitude: 13.0418,
    longitude: 80.2341,
    radius: 1000
  },
  assignedTeamId: "reference-to-patrol-teams",
  assignedTeamName: "T Nagar Patrol Unit",
  patrolType: "foot_patrol" | "vehicle_patrol" | "bike_patrol",
  schedule: {
    days: ["Monday", "Wednesday", "Friday"],
    startTime: "18:00",
    endTime: "22:00"
  },
  route: [
    { latitude: 13.0418, longitude: 80.2341, checkpointName: "Bus Stand" }
  ],
  frequency: "Daily" | "Alternate Days" | "Weekends",
  priority: "high" | "medium" | "low",
  status: "active" | "paused" | "completed",
  lastPatrolDate: Timestamp,
  nextPatrolDate: Timestamp,
  notes: "Focus on poorly lit areas"
}
```

### DBMS Concepts:
- **Primary Key**: `id`
- **Foreign Key**: `assignedTeamId` → references patrol teams (conceptually separate from responseTeams)
- **Array/List Field**: `route` stores ordered checkpoints
- **Nested Objects**: `location`, `schedule`
- **Temporal Data**: Tracks past and future patrol dates
- **Enum Fields**: `patrolType`, `frequency`, `priority`, `status`

### Relationships:
- **Many-to-One** with patrol teams: Multiple patrols can be assigned to one team
- **Geospatial Relationship** with `dangerZones`: Patrols can be scheduled based on danger zones

### Sample Data:
```json
{
  "id": "patrol_001",
  "patrolZone": "T Nagar Commercial Area",
  "location": { "latitude": 13.0418, "longitude": 80.2341, "radius": 1000 },
  "assignedTeamId": "patrol_team_001",
  "assignedTeamName": "T Nagar Patrol Unit",
  "patrolType": "foot_patrol",
  "schedule": {
    "days": ["Monday", "Wednesday", "Friday"],
    "startTime": "18:00",
    "endTime": "22:00"
  },
  "route": [
    { "latitude": 13.0418, "longitude": 80.2341, "checkpointName": "T Nagar Bus Stand" },
    { "latitude": 13.0425, "longitude": 80.2355, "checkpointName": "Pondy Bazaar" }
  ],
  "frequency": "Alternate Days",
  "priority": "high",
  "status": "active",
  "lastPatrolDate": "2025-10-16T20:00:00Z",
  "nextPatrolDate": "2025-10-18T18:00:00Z",
  "notes": "Focus on poorly lit areas near shopping complexes"
}
```

---

## 6. **`safeZones` Collection**

### Purpose:
Stores verified safe locations with security features (malls, police stations, hospitals).

### Schema:
```typescript
{
  id: "auto-generated",
  name: "Central Mall",
  type: "mall" | "police_station" | "hospital" | "public_place",
  address: "456 Market St, Chennai",
  location: {
    latitude: 12.9716,
    longitude: 77.5946
  },
  radius: 500,
  verifiedBy: "admin@test.com",
  securityFeatures: ["CCTV", "Security Guards", "Emergency Button"],
  rating: 4.5,
  createdAt: Timestamp
}
```

### DBMS Concepts:
- **Primary Key**: `id`
- **Geospatial Data**: Location coordinates and coverage radius
- **Array Field**: `securityFeatures` list
- **Rating System**: Numeric field for user feedback
- **Data Verification**: `verifiedBy` tracks admin who verified the location

### Relationships:
- **Referenced by**: Mobile app for user navigation
- **Spatial Relationship** with `sos`: Users can be directed to nearest safe zone

### Sample Data:
```json
{
  "id": "safe_001",
  "name": "Chennai Central Police Station",
  "type": "police_station",
  "address": "Park Town, Chennai",
  "location": { "latitude": 13.0827, "longitude": 80.2707 },
  "radius": 500,
  "verifiedBy": "admin@test.com",
  "securityFeatures": ["24/7 Security", "CCTV", "Emergency Response"],
  "rating": 4.8,
  "createdAt": "2025-10-15T10:00:00Z"
}
```

---

## 7. **`dangerZones` Collection**

### Purpose:
Identifies high-risk areas based on incident data and AI predictions.

### Schema:
```typescript
{
  id: "auto-generated",
  location: {
    latitude: 13.0827,
    longitude: 80.2707
  },
  areaName: "T Nagar Evening Zone",
  description: "High incident rate during evening hours",
  threatLevel: "high" | "medium" | "low",
  incidentCount: 15,
  timePattern: {
    dangerousHours: ["22:00-02:00", "18:00-20:00"],
    safestTime: "10:00-16:00"
  },
  aiPredictedRisk: 0.85,
  lastUpdated: Timestamp,
  radius: 200,
  incidentTypes: ["harassment", "theft", "assault"]
}
```

### DBMS Concepts:
- **Primary Key**: `id`
- **Geospatial Data**: Location and radius
- **AI/ML Integration**: `aiPredictedRisk` score (0-1)
- **Temporal Patterns**: Time-based risk analysis
- **Array Field**: `incidentTypes`
- **Derived Data**: Calculated from `issues` collection

### Relationships:
- **Analytical Relationship** with `issues`: Danger zones are derived from incident reports
- **Informs**: `patrols` scheduling decisions
- **Spatial Relationship** with `sos`: Alerts are analyzed based on danger zones

### Sample Data:
```json
{
  "id": "danger_001",
  "location": { "latitude": 13.0827, "longitude": 80.2707 },
  "areaName": "T Nagar Evening Zone",
  "description": "High incident rate during evening hours",
  "threatLevel": "high",
  "incidentCount": 15,
  "timePattern": {
    "dangerousHours": ["22:00-02:00", "18:00-20:00"],
    "safestTime": "10:00-16:00"
  },
  "aiPredictedRisk": 0.85,
  "lastUpdated": "2025-10-17T00:00:00Z",
  "radius": 200,
  "incidentTypes": ["harassment", "theft", "assault"]
}
```

---

## 8. **`issues` Collection**

### Purpose:
Stores user-reported safety concerns and non-emergency incidents.

### Schema:
```typescript
{
  id: "auto-generated",
  description: "theft" | "harassment" | "suspicious_activity" | "infrastructure",
  latitude: 12.844212,
  longitude: 80.1548664,
  location: "Lat: 12.844212, Lon: 80.1548664",
  timestamp: Timestamp,
  issueType: "harassment" | "theft" | "assault" | "vandalism" | "infrastructure",
  reportedBy: "User Anonymous",
  status: "reported" | "investigating" | "resolved",
  severity: "critical" | "high" | "medium" | "low"
}
```

### DBMS Concepts:
- **Primary Key**: `id`
- **Geospatial Data**: Location coordinates
- **Status Workflow**: `reported → investigating → resolved`
- **Severity Classification**: Priority-based categorization
- **Aggregation Source**: Used to calculate danger zones

### Relationships:
- **Many-to-One** with `users`: Multiple issues can be reported by one user
- **Feeds Data To**: `dangerZones` (analytical relationship)
- **Feeds Data To**: `analytics` (for reporting)

### Sample Data:
```json
{
  "id": "issue_001",
  "description": "harassment",
  "latitude": 12.844212,
  "longitude": 80.1548664,
  "location": "Lat: 12.844212, Lon: 80.1548664",
  "timestamp": "2025-10-17T10:07:39Z",
  "issueType": "harassment",
  "reportedBy": "User Anonymous",
  "status": "reported",
  "severity": "high"
}
```

---

## 9. **`analytics` Collection**

### Purpose:
Stores pre-aggregated analytics data for dashboard insights and reporting.

### Schema:
```typescript
{
  id: "auto-generated",
  period: "daily" | "weekly" | "monthly",
  periodDate: Timestamp,
  metrics: {
    totalAlerts: 45,
    resolvedAlerts: 42,
    pendingAlerts: 3,
    avgResponseTime: 8.5,
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
  generatedAt: Timestamp
}
```

### DBMS Concepts:
- **Primary Key**: `id`
- **Materialized View**: Pre-computed aggregations for performance
- **Time-Series Data**: Period-based analytics
- **Nested Objects**: Complex structured data
- **Data Denormalization**: Stores aggregated results to avoid expensive queries

### Relationships:
- **Aggregates From**: `sos`, `issues`, `alertResponses`, `responseTeams`
- **Read-Only**: Data is generated, not directly modified

### Sample Data:
```json
{
  "id": "analytics_2025_10_17",
  "period": "daily",
  "periodDate": "2025-10-17T00:00:00Z",
  "metrics": {
    "totalAlerts": 45,
    "resolvedAlerts": 42,
    "pendingAlerts": 3,
    "avgResponseTime": 8.5,
    "activeUsers": 250
  },
  "incidentsByType": {
    "emergency": 20,
    "harassment": 15,
    "medical": 10
  },
  "aiPredictions": {
    "nextDayAlerts": 12,
    "highRiskAreas": ["T Nagar", "Anna Nagar"],
    "riskScore": 7.5
  },
  "generatedAt": "2025-10-17T23:59:00Z"
}
```

---

## 10. **`users` Collection**

### Purpose:
Stores end-user (mobile app users) profile and contact information.

### Schema:
```typescript
{
  id: "auto-generated",
  name: "Priya Sharma",
  email: "priya@example.com",
  phone: "+91-9876543210",
  emergencyContacts: [
    { name: "Raj Sharma", phone: "+91-9876543211", relation: "Father" }
  ],
  createdAt: Timestamp,
  lastActive: Timestamp
}
```

### DBMS Concepts:
- **Primary Key**: `id`
- **Array Field**: `emergencyContacts`
- **User Authentication**: Linked to Firebase Auth
- **Activity Tracking**: `lastActive` timestamp

### Relationships:
- **One-to-Many** with `sos`: One user can create multiple SOS alerts
- **One-to-Many** with `issues`: One user can report multiple issues

### Sample Data:
```json
{
  "id": "user_123",
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "+91-9876543210",
  "emergencyContacts": [
    { "name": "Raj Sharma", "phone": "+91-9876543211", "relation": "Father" }
  ],
  "createdAt": "2025-10-01T10:00:00Z",
  "lastActive": "2025-10-17T09:00:00Z"
}
```

---

## 📐 Entity-Relationship Diagram (ERD)

```
┌─────────────┐
│   admins    │
└──────┬──────┘
       │
       │ (creates)
       │
       ↓
┌─────────────────┐      ┌──────────────┐
│ alertResponses  │◄─────┤     sos      │
└─────────────────┘      └──────┬───────┘
                                │
                                │ (created by)
                                │
                         ┌──────↓──────┐
                         │    users    │
                         └──────┬──────┘
                                │
                                │ (reports)
                                │
                         ┌──────↓──────┐
                         │   issues    │
                         └──────┬──────┘
                                │
                                │ (feeds into)
                                ↓
                         ┌─────────────┐
                         │ dangerZones │
                         └─────────────┘

┌──────────────────┐
│  responseTeams   │◄─── (assigned to) ──── sos
└──────────────────┘

┌──────────────────┐
│     patrols      │ (scheduled based on) → dangerZones
└──────────────────┘

┌──────────────────┐
│    safeZones     │ (referenced in) → Mobile App Navigation
└──────────────────┘

┌──────────────────┐
│    analytics     │◄─── (aggregates from) ──── sos, issues, alertResponses
└──────────────────┘
```

---

## 🔗 Key Relationships Summary

| Relationship Type | Collections | Description |
|------------------|-------------|-------------|
| **One-to-Many** | `users` → `sos` | One user creates many alerts |
| **One-to-Many** | `users` → `issues` | One user reports many issues |
| **One-to-Many** | `sos` → `alertResponses` | One alert has many response steps |
| **One-to-Many** | `admins` → `alertResponses` | One admin handles many responses |
| **One-to-Many** | `responseTeams` → `sos` | One team handles many alerts |
| **Many-to-One** | `issues` → `dangerZones` | Many issues create danger zones |
| **Aggregation** | `analytics` ← Multiple | Analytics aggregates from multiple tables |
| **Spatial** | `sos` ↔ `safeZones` | Nearest safe zone calculation |
| **Spatial** | `responseTeams` ↔ `sos` | Nearest team assignment |

---

## 🎯 DBMS Concepts Demonstrated

### 1. **NoSQL Database Design (Firestore)**
- Document-based storage
- Flexible schema
- Nested/embedded documents
- Array fields

### 2. **Primary Keys & Foreign Keys**
- Every collection has auto-generated `id` (Primary Key)
- Foreign key references: `userId`, `alertId`, `assignedTeamId`, `adminEmail`

### 3. **Normalization vs Denormalization**
- **Normalized**: Separate tables for users, alerts, responses (reduces redundancy)
- **Denormalized**: `analytics` table stores pre-computed results (improves read performance)

### 4. **CRUD Operations**
- **Create**: Add new alerts, teams, patrols, issues
- **Read**: Query alerts, view analytics, check team status
- **Update**: Change alert status, update team availability
- **Delete**: Remove old analytics records (soft delete with status)

### 5. **Indexing**
- Timestamp fields (for sorting)
- Status fields (for filtering)
- Location fields (for geospatial queries)

### 6. **Transactions & Atomicity**
- Alert assignment and team status update happen together
- Response steps must be sequential

### 7. **Aggregation & Analytics**
- `analytics` table uses GROUP BY, COUNT, AVG operations
- Real-time dashboard calculations

### 8. **Geospatial Queries**
- Haversine formula for distance calculation
- Nearest neighbor search for team assignment
- Radius-based zone coverage

### 9. **Constraints**
- **Enum Constraints**: `status`, `priority`, `threatLevel`
- **Required Fields**: Marked with `*` in forms
- **Referential Integrity**: Foreign keys maintain relationships

### 10. **Temporal Data Management**
- Timestamps for all events
- Date-based analytics periods
- Scheduled patrol dates

### 11. **Role-Based Access Control (RBAC)**
- Admin permissions array
- Different roles: super_admin, moderator, viewer

### 12. **Audit Logging**
- `alertResponses` tracks every action
- `lastActive`, `lastLogin` timestamps
- `verifiedBy`, `reportedBy` fields

---

## 📊 Query Examples

### 1. Get all pending SOS alerts
```javascript
const pendingAlerts = await getDocs(
  query(collection(db, 'sos'), 
    where('status', '==', 'pending'),
    orderBy('timestamp', 'desc')
  )
);
```

### 2. Find nearest available response team
```javascript
// Uses Haversine formula
const nearestTeam = findNearestTeam(alertLocation, availableTeams);
```

### 3. Get high-priority danger zones
```javascript
const dangerZones = await getDocs(
  query(collection(db, 'dangerZones'),
    where('threatLevel', '==', 'high')
  )
);
```

### 4. Count resolved alerts by admin
```javascript
const adminStats = await getDocs(
  query(collection(db, 'alertResponses'),
    where('adminEmail', '==', 'admin@test.com'),
    where('responseType', '==', 'resolved')
  )
);
```

### 5. Get today's analytics
```javascript
const today = new Date();
today.setHours(0,0,0,0);
const analytics = await getDocs(
  query(collection(db, 'analytics'),
    where('period', '==', 'daily'),
    where('periodDate', '>=', today)
  )
);
```

---

## 🎓 How to Explain to Your Teacher

### Structure Your Presentation:

1. **Introduction (2 min)**
   - "Women Safety Dashboard is a real-time emergency response system"
   - "Uses Firestore NoSQL database with 10 interconnected collections"

2. **Core Tables (3 min)**
   - **`sos`**: Emergency alerts (heart of the system)
   - **`users`**: Mobile app users
   - **`admins`**: Dashboard administrators

3. **Response Management (3 min)**
   - **`alertResponses`**: Sequential workflow tracking
   - **`responseTeams`**: Emergency responders
   - Show the foreign key relationships

4. **Prevention & Analysis (3 min)**
   - **`patrols`**: Proactive security
   - **`safeZones`** & **`dangerZones`**: Geospatial data
   - **`issues`**: User-reported concerns
   - **`analytics`**: Aggregated insights

5. **DBMS Concepts (3 min)**
   - Primary/Foreign Keys
   - One-to-Many relationships
   - Geospatial queries
   - Normalization vs Denormalization
   - CRUD operations
   - Real-time listeners

6. **Demo (2 min)**
   - Show the web dashboard
   - Create an alert → auto-assign team → track response

---

## 💡 Key Points to Emphasize

✅ **10 interconnected tables** working together  
✅ **Foreign key relationships** maintain data integrity  
✅ **Geospatial queries** for location-based features  
✅ **Real-time synchronization** using Firestore listeners  
✅ **Aggregation & analytics** for decision-making  
✅ **Role-based access control** for security  
✅ **Audit trails** for accountability  
✅ **Normalized design** reduces redundancy  
✅ **Denormalized analytics** improves performance  
✅ **Sequential workflows** ensure process compliance  

---

## 📝 Conclusion

This database design demonstrates:
- **Scalability**: Can handle thousands of alerts
- **Performance**: Optimized queries with indexing
- **Integrity**: Foreign keys maintain relationships
- **Security**: RBAC and authentication
- **Analytics**: Pre-computed aggregations
- **Real-time**: Live updates across all clients

**Total Collections**: 10  
**Total Relationships**: 15+  
**DBMS Concepts**: 12+ demonstrated  
**Query Types**: SELECT, INSERT, UPDATE, WHERE, ORDER BY, GROUP BY, Geospatial  

---

*Generated for DBMS Project - Women Safety Dashboard*  
*Date: October 17, 2025*

