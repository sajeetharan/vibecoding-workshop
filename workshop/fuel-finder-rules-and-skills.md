# Fuel Finder Live: Rules and Skills

**Application:** Real-time crisis map for fuel and gas availability  
**Target Users:** Citizens during fuel/gas shortage crisis  
**Platform:** Web (responsive UI) + Cloud Run backend  
**Goal:** Replace rumor with verified, crowdsourced intelligence  

---

## Core Skills (Features)

### 1. **Report Creation Skill**
Users can submit real-time status reports about fuel and gas availability at specific stations.

**What users can report:**
- Station name and location (text or map pin)
- Product type: Petrol, Diesel, or Gas Cylinder
- Current status: Available, Low Stock, Out of Stock, Unknown
- Queue length: None, Short (< 30 min), Medium (30-60 min), Long (> 60 min)
- Waiting time estimate (in minutes)
- Additional notes: Power cut, payment method issues, etc.
- Timestamp: Auto-captured when report is submitted

**Acceptance Criteria:**
- Form validation: all required fields filled
- Station name is not empty
- Status is one of: Available, Low Stock, Out of Stock, Unknown
- Queue time is a valid number (0-999 minutes)
- Report submitted successfully → UI displays confirmation
- New report appears in feed within 2 seconds

---

### 2. **Report Feed Skill**
Users can view all submitted reports in a live feed sorted by recency.

**What users see:**
- Station name, location, product type
- Current status with visual indicator (color-coded)
- Queue time and waiting estimate
- Timestamp (relative: "2 minutes ago", "1 hour ago")
- Reporter confidence or source (e.g., "verified user", "anonymous")
- Report count per station (helps gauge reliability)

**Acceptance Criteria:**
- Feed displays all reports in reverse chronological order (newest first)
- Each report shows clear status and queue information
- Reports refresh automatically (push or poll every 5 seconds)
- If feed is empty, show "No reports yet. Be the first!" message
- Clicking a report shows full details (optional expand)

---

### 3. **Map View Skill**
Users can see station locations on an interactive map with real-time status overlay.

**What users see:**
- Map with fuel/gas station pins
- Pin color indicates status:
  - 🟢 Green = Available
  - 🟡 Yellow = Low Stock
  - 🔴 Red = Out of Stock
  - ⚪ Gray = Unknown/No reports
- Clicking a pin shows latest report + queue status
- Optional: Filter by product type (Petrol, Diesel, Gas)

**Acceptance Criteria:**
- Map loads with known station locations
- Pins update within 5 seconds of new reports
- Clicking a pin displays station name, status, queue, timestamp
- Mobile-responsive map layout

---

### 4. **AI Trust Score Skill**
System flags suspicious or likely fake reports to maintain data integrity.

**What the system does:**
- Analyze report patterns (same user submitting conflicting data repeatedly)
- Detect anomalies (all stations suddenly "out of stock" across region)
- Check for spam keywords or nonsensical entries
- Calculate confidence score: 0-100%
- Flag reports as: Verified (80+), Acceptable (50-79), Suspicious (< 50)

**Acceptance Criteria:**
- Suspicious reports display a warning banner: ⚠️ "This report may be inaccurate"
- Verified reports show a checkmark: ✅
- Reports with < 50% confidence score are shown but clearly marked
- AI decision logic is transparent (show reason for flag in tooltip)
- Users can report false/misleading reports (future iteration)

---

### 5. **Best Time Prediction Skill**
System predicts optimal visit windows based on historical queue patterns.

**What the system recommends:**
- "Best time to visit this station: 6 AM - 7 AM (typically shortest wait)"
- "Current queue: Long. Come back in ~45 minutes"
- Time-based heuristics:
  - Early morning (5-7 AM): Usually shorter queues
  - Mid-day (12-2 PM): Peak traffic
  - Evening (5-7 PM): Variable
  - Night (9 PM+): Closed or sparse reports

**Acceptance Criteria:**
- Prediction displays next to each station
- Prediction updates as new reports arrive
- Recommendation is clearly marked as "estimate based on recent reports"
- Works even with sparse data (graceful degradation)

---

### 6. **Status Persistence Skill**
Backend stores all reports durably so data survives restarts.

**What happens:**
- Each report is saved to Firestore (or simple file-based store initially)
- Historical data accessible for analytics (future)
- Old reports (> 24 hours) can be archived or soft-deleted

**Acceptance Criteria:**
- Reports persist after page refresh
- Reports persist after server restart (if deployed)
- No data loss on normal deployment cycles

---

### 7. **Responsive UI Skill**
Application works seamlessly on mobile, tablet, and desktop.

**What users experience:**
- Mobile (< 640px): Single-column layout, large touch targets
- Tablet (640-1024px): Two-column (map + feed), readable
- Desktop (> 1024px): Full dashboard with map, feed, and sidebar

**Acceptance Criteria:**
- Form inputs remain accessible on mobile (no horizontal scroll)
- Map is readable and interactive on small screens
- Feed rows don't break or overflow
- Buttons are at least 44px tall (mobile-friendly)
- No console errors on any viewport size

---

### 8. **Accessibility Skill**
Application is usable by people with disabilities.

**What we ensure:**
- ARIA labels on form inputs and buttons
- Color not the only indicator (use icons + text)
- Keyboard navigation: Tab through form, Enter to submit
- Semantic HTML: `<button>`, `<label>`, `<main>`, `<nav>`
- Sufficient color contrast (WCAG AA minimum)
- Loading states announced to screen readers

**Acceptance Criteria:**
- All form inputs have associated labels
- Buttons have descriptive text (not just icons)
- Tab order is logical (top to bottom, left to right)
- Color contrast ≥ 4.5:1 for text
- No accessibility errors on axe DevTools or similar

---

## Core Rules (Business Logic & Constraints)

### R1: Report Validation
- **Rule:** All reports must pass schema validation before storage.
- **Fields required:** station_name, product_type, status, queue_time
- **Constraints:**
  - station_name: non-empty string, max 100 characters
  - product_type: one of [Petrol, Diesel, Gas]
  - status: one of [Available, Low Stock, Out of Stock, Unknown]
  - queue_time: integer, 0 ≤ queue_time ≤ 999
  - notes: optional string, max 500 characters
- **Action on failure:** Return 400 Bad Request with field-specific error messages

### R2: Rate Limiting
- **Rule:** Prevent spam and abuse by limiting submissions per user.
- **Constraint:** Max 1 report per user per station per 5 minutes
- **Tracking:** Use IP address (anonymous) or user session (if auth added later)
- **Action on violation:** Return 429 Too Many Requests with retry-after header

### R3: Report TTL (Time to Live)
- **Rule:** Reports older than 24 hours are considered stale and less relevant.
- **Constraint:** Reports visible in main feed for 24 hours, then archived
- **Rationale:** Fuel crisis situations evolve; old data can mislead
- **Action:** Soft-delete or move to archive; don't return in live feed API

### R4: Data Freshness Scoring
- **Rule:** Newer reports weighted higher in feed and predictions.
- **Constraint:** Report relevance = 100% at time of submission → 0% after 24 hours
- **Formula:** weight = max(0, 100 - (hours_old * 4.17))
- **Action:** Sort feed by weight, not just timestamp

### R5: Trust Score Calculation
- **Rule:** AI assigns confidence score to each report based on multiple signals.
- **Signals:**
  - Report age: Newer = higher score
  - Reporter history: Consistent users = higher score
  - Cluster agreement: Multiple reports saying "Available" at same station = higher
  - Anomaly detection: Outlier patterns = lower score
- **Thresholds:**
  - 80+: Verified (show ✅)
  - 50-79: Acceptable (show neutral)
  - < 50: Suspicious (show ⚠️ warning banner)
- **Action:** Display confidence score and reason in UI

### R6: Duplicate Detection
- **Rule:** Prevent duplicate or near-duplicate reports from same user.
- **Constraint:** Same user cannot submit identical report within 10 minutes
- **Check fields:** station_name, product_type, status
- **Action on duplicate:** 
  - Option A: Reject with "Similar report already submitted 5 min ago"
  - Option B: Merge/update the previous report (upsert behavior)

### R7: Geofencing (Optional)
- **Rule:** Users can only submit reports for stations near their location.
- **Constraint:** Station must be within 10 km of reported user location
- **Rationale:** Prevents remote false reporting
- **Action on violation:** Return error "Station too far from your location"
- **Note:** Requires location permission; mark as optional for MVP

### R8: Public Data Policy
- **Rule:** All submitted data is public by default (no private reports).
- **Constraint:** Users agree to terms that data is shared openly
- **Rationale:** Public intelligence requires public data
- **Action:** Show disclaimer on form: "Your report will be visible to all users"

### R9: Error Recovery
- **Rule:** Failed submissions should not lose user data.
- **Constraint:** On validation error, form retains user input and shows error message
- **Rationale:** Better UX; users don't re-type everything
- **Action:** Store form state in browser (localStorage) and restore on page reload

### R10: Health Check
- **Rule:** System exposes health status for monitoring.
- **Constraint:** GET /api/health returns status and response time < 100ms
- **Response format:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-05-08T14:32:00Z",
    "uptime_seconds": 3600,
    "report_count": 247
  }
  ```
- **Action:** Used by deployment platform to detect outages

---

## Interaction Flow Rules

### Flow 1: Submit Report (Happy Path)
1. User fills form: station name, product type, status, queue time
2. User clicks Submit
3. System validates all fields
4. If invalid: show red error message under each bad field, keep form populated
5. If valid: 
   - Save report to database
   - Show green success message: "Report submitted! Thanks for helping."
   - Clear form
   - New report appears in feed within 2 seconds
6. User can submit another report immediately

### Flow 2: View Feed
1. User opens app, sees feed of latest reports (newest first)
2. Each report shows: station name, product, status (color-coded), queue, timestamp
3. Suspicious reports show ⚠️ warning banner
4. User scrolls down to see older reports
5. Feed refreshes automatically every 5 seconds (user doesn't see jarring reload)

### Flow 3: View Map
1. User clicks "Map View" tab
2. Map loads with pins at known station locations
3. Pin colors reflect latest report status (green = available, red = out, etc.)
4. User clicks a pin
5. Popup shows: station name, latest report, queue time, "Report Now" button
6. User can click "Report Now" to open form for that station

### Flow 4: Check Prediction
1. User views a station (map pin or feed item)
2. Prediction badge shows: "Best time: 6-7 AM (estimate)"
3. Current time shows queue estimate: "Long queue now, check back in 30 min"
4. User can dismiss the tip or use it to plan visit

---

## Data Model (Simplified)

### Report Document
```javascript
{
  id: "uuid",
  station_name: "Shell Station - Colombo",
  product_type: "Petrol",  // or "Diesel", "Gas"
  status: "Available",  // or "Low Stock", "Out of Stock", "Unknown"
  queue_time_minutes: 45,
  notes: "Long queue, payment working",
  timestamp: "2026-05-08T14:30:00Z",
  user_id: "anonymous",  // or hashed IP
  location: { lat: 6.9271, lng: 80.7789 },  // optional
  ai_trust_score: 0.87,  // 0-1
  report_count_at_station: 12  // helps gauge reliability
}
```

---

## Success Metrics (for facilitators to track)

- ✅ Form submission latency < 500ms
- ✅ Feed updates within 2 seconds of new report
- ✅ No reports lost on server restart (persistence working)
- ✅ AI trust score working (some reports flagged as suspicious)
- ✅ Mobile-responsive (works on phone without horizontal scroll)
- ✅ Accessibility: no axe errors
- ✅ At least 10 reports submitted by team
- ✅ Team can explain one business rule in plain English

---

## Workshop Scope Notes

### Included in MVP (2-hour workshop):
- ✅ Report creation with validation
- ✅ Live feed display
- ✅ Basic AI trust scoring (simple heuristics)
- ✅ Responsive UI
- ✅ Deploy to Cloud Run

### Stretch Goals (if time allows):
- 🎯 Map view integration
- 🎯 Best time prediction logic
- 🎯 Accessibility audit (WCAG AA)
- 🎯 Rate limiting

### Future Iterations (post-workshop):
- 🚀 User authentication (optional sign-up for verified reporting)
- 🚀 Moderation dashboard (admins review flagged reports)
- 🚀 Analytics dashboard (trends, hotspots, predictions)
- 🚀 Push notifications ("Fuel available at nearby station")
- 🚀 Historical data export (research, government insights)

---

## Prompt Examples for Vibe Coding with These Rules

### "Scaffold Phase"
*"Create a form component for fuel report submission with fields: station name, product type (dropdown), status (radio), queue time. Validate that all are required and queue_time is a number 0-999. Show field errors in red text below each field."*

### "Build Phase"
*"Add a report feed that displays reports sorted newest first. Each report row shows: station name, product type, status with color (green for Available, yellow for Low Stock, red for Out). Implement auto-refresh every 5 seconds by polling /api/reports."*

### "Review Phase"
*"Review this diff for the trust score calculation. Identify any edge cases (e.g., what if all reports say 'Out of Stock'?). What happens if a single user submits 100 identical reports in a row?"*

### "Quality Phase"
*"Make the form accessible: add aria-labels to inputs, ensure tab order is logical, make color not the only indicator of errors. Check mobile responsiveness on a small viewport."*

---

## Reference: Business Context

**Real-World Crisis Context (Sri Lanka 2022-2023):**
- Citizens relied on WhatsApp, rumors, and trial-and-error visits
- Families wasted fuel driving to empty stations
- Students lost hours in unpredictable queues
- Long waits caused stress and social friction

**This App Solves:**
- Centralized, up-to-the-minute source of truth
- Reduced wasted trips and fuel
- Lower anxiety (know what to expect)
- Community intelligence (verified crowd-sourced data)

**Why Rules Matter:**
- Trust score prevents bad actors from gaming the system
- Rate limiting prevents spam from filling the feed with noise
- TTL rules ensure old data doesn't mislead
- Validation rules prevent garbage data from being stored
