# Fuel Finder Live: Technical Specification

**Application:** Real-time fuel/gas availability crisis map  
**Stack:** Node.js + Express (backend), HTML/CSS/JS (frontend), Cloud Run (hosting)  
**Duration:** 2-hour workshop build

---

## API Endpoints

### GET /api/health
**Purpose:** Service health check for monitoring and readiness probes.

**Request:**
```
GET /api/health HTTP/1.1
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-05-08T14:32:00Z",
  "uptime_seconds": 3600,
  "report_count": 247
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "degraded",
  "message": "Database connection failed"
}
```

**Notes:**
- Response time must be < 100ms (no database queries, just in-memory state)
- Used by Cloud Run for liveness probes (restart if not OK)

---

### GET /api/reports
**Purpose:** Fetch all reports in the system, sorted by recency.

**Request:**
```
GET /api/reports?limit=50&station_filter=optional_name HTTP/1.1
```

**Query Parameters:**
- `limit` (optional): Max reports to return. Default: 50, Max: 500
- `station_filter` (optional): Partial match on station name. Example: "Shell" returns all Shell stations
- `product_type` (optional): Filter by "Petrol", "Diesel", or "Gas"

**Response (200 OK):**
```json
{
  "reports": [
    {
      "id": "uuid-1",
      "station_name": "Shell Station - Colombo",
      "product_type": "Petrol",
      "status": "Available",
      "queue_time_minutes": 45,
      "notes": "Long queue, payment working",
      "timestamp": "2026-05-08T14:30:00Z",
      "ai_trust_score": 0.87,
      "report_count_at_station": 12,
      "is_flagged": false
    },
    {
      "id": "uuid-2",
      "station_name": "Caltex - Kandy",
      "product_type": "Diesel",
      "status": "Out of Stock",
      "queue_time_minutes": 0,
      "notes": "No supply expected until tomorrow",
      "timestamp": "2026-05-08T14:15:00Z",
      "ai_trust_score": 0.92,
      "report_count_at_station": 8,
      "is_flagged": false
    }
  ],
  "total_count": 247,
  "returned_count": 2
}
```

**Error Responses:**
- 400 Bad Request: If limit > 500 or invalid filter
- 500 Internal Server Error: Database error

**Notes:**
- Reports sorted by timestamp DESC (newest first)
- Exclude reports older than 24 hours
- `ai_trust_score` ranges 0-1 (displayed as percentage in UI)
- `is_flagged` = true if trust_score < 0.50

---

### POST /api/reports
**Purpose:** Submit a new fuel/gas availability report.

**Request:**
```
POST /api/reports HTTP/1.1
Content-Type: application/json

{
  "station_name": "Shell Station - Colombo",
  "product_type": "Petrol",
  "status": "Available",
  "queue_time_minutes": 45,
  "notes": "Long queue, payment working"
}
```

**Request Body Schema:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| station_name | string | Yes | 1-100 chars, non-empty |
| product_type | enum | Yes | One of: Petrol, Diesel, Gas |
| status | enum | Yes | One of: Available, Low Stock, Out of Stock, Unknown |
| queue_time_minutes | integer | Yes | 0 ≤ value ≤ 999 |
| notes | string | No | 0-500 chars |

**Response (201 Created):**
```json
{
  "id": "uuid-new",
  "station_name": "Shell Station - Colombo",
  "product_type": "Petrol",
  "status": "Available",
  "queue_time_minutes": 45,
  "notes": "Long queue, payment working",
  "timestamp": "2026-05-08T14:32:15Z",
  "ai_trust_score": 0.72,
  "message": "Report submitted successfully!"
}
```

**Error Responses:**

**400 Bad Request (Validation failed):**
```json
{
  "error": "Validation failed",
  "details": {
    "station_name": "Required field",
    "queue_time_minutes": "Must be a number between 0 and 999"
  }
}
```

**429 Too Many Requests (Rate limited):**
```json
{
  "error": "Rate limit exceeded",
  "message": "Max 1 report per station per 5 minutes",
  "retry_after_seconds": 180
}
```

**500 Internal Server Error:**
```json
{
  "error": "Database error",
  "message": "Failed to save report"
}
```

**Notes:**
- Response includes calculated `ai_trust_score` (call ML/heuristic function)
- User identified by IP address (anonymously) for rate limiting and duplicate detection
- Timestamp auto-generated server-side (not from client)
- New report should appear in GET /api/reports within 2 seconds

---

### GET /api/reports/:id
**Purpose:** Fetch a single report by ID (optional, for detail view).

**Request:**
```
GET /api/reports/uuid-1 HTTP/1.1
```

**Response (200 OK):**
```json
{
  "id": "uuid-1",
  "station_name": "Shell Station - Colombo",
  "product_type": "Petrol",
  "status": "Available",
  "queue_time_minutes": 45,
  "notes": "Long queue, payment working",
  "timestamp": "2026-05-08T14:30:00Z",
  "ai_trust_score": 0.87,
  "report_count_at_station": 12,
  "is_flagged": false,
  "created_by": "anonymous",
  "hours_old": 0.1
}
```

**Error Responses:**
- 404 Not Found: Report doesn't exist or is older than 24 hours
- 500 Internal Server Error

---

## Frontend Architecture

### HTML Structure
```
index.html
├── Header (logo, title, tabs)
├── Main Content Area
│   ├── Tab 1: Feed View
│   │   ├── Instructions
│   │   ├── Report Form
│   │   └── Reports Feed (auto-updating list)
│   └── Tab 2: Map View (optional)
│       ├── Interactive map with pins
│       └── Station detail popup
└── Footer
```

### JavaScript State Management
```javascript
// Global app state (no framework needed for MVP)
const appState = {
  reports: [],           // Array of report objects
  selectedTab: "feed",   // "feed" or "map"
  formData: {            // Current form input
    station_name: "",
    product_type: "Petrol",
    status: "Available",
    queue_time_minutes: 0,
    notes: ""
  },
  lastRefreshTime: null, // Track last fetch
  isFetching: false,     // Prevent duplicate fetches
  errorMessage: null     // Error to display
};
```

### Data Flow Diagram
```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Load page                                       │
│     ├─> Fetch GET /api/reports                      │
│     └─> Render feed with latest reports             │
│                                                     │
│  2. User fills form & clicks Submit                 │
│     ├─> Validate form locally                       │
│     ├─> POST /api/reports (JSON payload)            │
│     ├─> If success: show confirmation, clear form   │
│     ├─> If error: show validation errors            │
│     └─> Auto-refresh feed                           │
│                                                     │
│  3. Periodic refresh (every 5 seconds)              │
│     ├─> Fetch GET /api/reports                      │
│     ├─> Merge new reports into feed                 │
│     └─> Update UI without full reload               │
│                                                     │
└─────────────────────────────────────────────────────┘
                          │
                          │ HTTP/JSON
                          │
┌─────────────────────────────────────────────────────┐
│              Cloud Run (Express Backend)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  GET /api/health                                    │
│  ├─> Check DB connection                            │
│  └─> Return status                                  │
│                                                     │
│  GET /api/reports                                   │
│  ├─> Query database (reports from last 24h)        │
│  ├─> Sort by timestamp DESC                         │
│  └─> Return JSON array                              │
│                                                     │
│  POST /api/reports                                  │
│  ├─> Validate payload                               │
│  ├─> Calculate AI trust score                       │
│  ├─> Check rate limit (by IP)                       │
│  ├─> Check for duplicates                           │
│  ├─> Save to database                               │
│  └─> Return 201 + report object                     │
│                                                     │
└─────────────────────────────────────────────────────┘
                          │
                          │ SQL/Document queries
                          │
        ┌─────────────────────────────┐
        │  Data Store (Firestore      │
        │  or simple JSON file)        │
        ├─────────────────────────────┤
        │ Reports collection/table     │
        │ - Indexed by timestamp       │
        │ - Filtered by age (< 24h)    │
        └─────────────────────────────┘
```

---

## Form Validation (Client + Server)

### Client-Side Validation (Immediate, UX feedback)
```javascript
function validateReport(data) {
  const errors = {};
  
  if (!data.station_name || data.station_name.trim() === "") {
    errors.station_name = "Station name is required";
  } else if (data.station_name.length > 100) {
    errors.station_name = "Station name must be 100 characters or less";
  }
  
  if (!data.product_type || !["Petrol", "Diesel", "Gas"].includes(data.product_type)) {
    errors.product_type = "Please select a product type";
  }
  
  if (!data.status || !["Available", "Low Stock", "Out of Stock", "Unknown"].includes(data.status)) {
    errors.status = "Please select a status";
  }
  
  if (data.queue_time_minutes === "" || data.queue_time_minutes === null) {
    errors.queue_time_minutes = "Queue time is required";
  } else if (isNaN(data.queue_time_minutes)) {
    errors.queue_time_minutes = "Queue time must be a number";
  } else if (data.queue_time_minutes < 0 || data.queue_time_minutes > 999) {
    errors.queue_time_minutes = "Queue time must be between 0 and 999";
  }
  
  if (data.notes && data.notes.length > 500) {
    errors.notes = "Notes must be 500 characters or less";
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
}
```

### Server-Side Validation (Security, data integrity)
```javascript
function validateReportServer(data) {
  // Repeat all client-side checks
  // + server-specific checks:
  
  // Check rate limit (per IP, per station, per 5 min)
  const recentReports = getRecentReportsFromIP(clientIP, data.station_name, 5);
  if (recentReports.length > 0) {
    throw new Error("Rate limited: max 1 report per station per 5 minutes");
  }
  
  // Check for exact duplicates (same user, same data)
  const possibleDupe = findDuplicate(clientIP, data);
  if (possibleDupe) {
    throw new Error("Duplicate report detected");
  }
  
  return true; // Valid
}
```

---

## AI Trust Score Algorithm

### Simplified Heuristic (MVP Version)
```javascript
function calculateTrustScore(report, allReports) {
  let score = 50; // Start at neutral
  
  // Age boost: Newer reports score higher
  const ageHours = (Date.now() - report.timestamp) / (1000 * 60 * 60);
  score += Math.max(0, 30 - ageHours); // -1 point per hour, capped at 30 points
  
  // Cluster agreement: If multiple reports agree, boost score
  const reportCountAtStation = allReports.filter(
    r => r.station_name === report.station_name && 
         (Date.now() - r.timestamp) < 2 * 60 * 60 * 1000  // Last 2 hours
  ).length;
  
  if (reportCountAtStation >= 3) {
    // Check if statuses agree (simple majority)
    const statusCounts = {};
    allReports.forEach(r => {
      if (r.station_name === report.station_name) {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      }
    });
    
    const maxCount = Math.max(...Object.values(statusCounts));
    if (maxCount >= reportCountAtStation * 0.6) { // 60% agreement
      score += 20; // Boost trust if cluster agrees
    }
  }
  
  // Anomaly detection: Penalize outliers
  if (report.status === "Out of Stock" && reportCountAtStation < 2) {
    score -= 15; // Lone "out of stock" claim, less trustworthy
  }
  
  // Clamp score to 0-100 range
  return Math.max(0, Math.min(100, score));
}
```

---

## Data Persistence Strategy

### Option A: Firestore (Recommended for Cloud Run)
```javascript
// Initialize Firestore
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// Save a report
async function saveReport(reportData) {
  const docRef = await db.collection('reports').add({
    ...reportData,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    user_ip: clientIP
  });
  return docRef.id;
}

// Fetch reports (last 24 hours)
async function getReports(limit = 50) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const snapshot = await db.collection('reports')
    .where('timestamp', '>=', twentyFourHoursAgo)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Option B: Simple File-Based Store (Quick MVP)
```javascript
const fs = require('fs');
const path = require('path');

const REPORTS_FILE = path.join(__dirname, 'reports.json');

function saveReport(reportData) {
  let reports = [];
  if (fs.existsSync(REPORTS_FILE)) {
    reports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
  }
  
  const newReport = {
    id: generateUUID(),
    ...reportData,
    timestamp: new Date().toISOString()
  };
  
  reports.push(newReport);
  
  // Keep only last 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  reports = reports.filter(r => r.timestamp >= cutoff);
  
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
  return newReport.id;
}

function getReports(limit = 50) {
  if (!fs.existsSync(REPORTS_FILE)) {
    return [];
  }
  
  let reports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
  
  // Filter by age and sort
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  reports = reports
    .filter(r => r.timestamp >= cutoff)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
  
  return reports;
}
```

---

## Testing Checklist

### Manual Testing (for workshop participants)

**Test 1: Submit Valid Report**
- [ ] Fill form with valid data (station, product, status, queue time)
- [ ] Click Submit
- [ ] Success message appears
- [ ] Form clears
- [ ] New report appears in feed within 2 seconds

**Test 2: Validation Errors**
- [ ] Leave station_name empty, click Submit → error message appears
- [ ] Enter queue_time = 999, click Submit → should work
- [ ] Enter queue_time = 1000, click Submit → error message appears

**Test 3: Feed Auto-Refresh**
- [ ] Open app, note report count
- [ ] In another tab, submit a new report
- [ ] Check first tab → new report appears without manual refresh

**Test 4: Rate Limiting**
- [ ] Submit report for "Shell Colombo"
- [ ] Try to submit another for "Shell Colombo" within 5 min → rate limit error

**Test 5: Mobile Responsiveness**
- [ ] Open app on mobile (or browser dev tools, 375px viewport)
- [ ] Form inputs are accessible (no horizontal scroll)
- [ ] Buttons are large enough to tap (44px+)
- [ ] Feed is readable

**Test 6: Accessibility**
- [ ] Press Tab → focus moves through form fields in order
- [ ] Press Tab to focus Submit button, press Enter → form submits
- [ ] Screen reader reads form labels (test with NVDA or JAWS if available)

**Test 7: Health Check**
- [ ] `curl http://localhost:3000/api/health` → returns JSON with status "ok"
- [ ] Response time < 100ms

**Test 8: Deployment Verification (Post-Cloud Run Deploy)**
- [ ] Service URL is accessible from public internet
- [ ] Submit report via public URL
- [ ] Report appears in live feed
- [ ] Refresh page → report persists (data not lost)

---

## Deploy to Cloud Run Checklist

**Pre-Deployment:**
- [ ] Code committed to git
- [ ] Environment variables set (.env or Cloud Run config)
- [ ] Firestore or file store configured
- [ ] gcloud CLI installed and authenticated

**Deploy:**
```bash
gcloud run deploy fuel-finder-live \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=your_project
```

**Post-Deployment:**
- [ ] Service URL is public and accessible
- [ ] GET /api/health returns 200 OK
- [ ] GET /api/reports returns a list (even if empty)
- [ ] POST /api/reports works and persists data
- [ ] Team can describe their deployment in 30 seconds

---

## Troubleshooting Common Issues

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| "Form won't submit" | Check browser console for JS errors | Open DevTools F12, check console tab |
| "Reports not showing in feed" | API not returning data | Test `curl localhost:3000/api/reports` |
| "Rate limit error every time" | Rate limiter using wrong key | Check IP detection in middleware |
| "Deployment fails: 'permission denied'" | Not authenticated with gcloud | Run `gcloud auth login` |
| "Health check times out" | Database connection slow | Test Firestore connectivity separately |
| "Data lost after restart" | File-based store, not persisting | Switch to Firestore or add file flush |

---

## Reference: Workshop Timeline

| Time | Activity | Goals |
|------|----------|-------|
| 0:00 - 0:10 | Kickoff + story | Context, motivation |
| 0:10 - 0:25 | Cursor intro + vibe coding patterns | Learn chat, completion, edit |
| 0:25 - 0:60 | Lab 1: Build core | GET /api/reports, POST /api/reports, feed display |
| 1:00 - 1:30 | Lab 2: Quality pass | Validation, trust score, mobile |
| 1:30 - 1:55 | Deploy to Cloud Run | gcloud commands, verify live URL |
| 1:55 - 2:00 | Demo + reflection | Ship it! |

