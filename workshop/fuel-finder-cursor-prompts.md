# Fuel Finder Live: Cursor Prompt Library

Quick reference prompts to use during the workshop for building each component with Cursor AI.

---

## Phase 1: Scaffold & Setup

### Prompt 1.1: Initialize Express Server
```
Create a basic Express server with:
- GET /api/health endpoint that returns { status: "ok", timestamp, uptime_seconds, report_count }
- GET /api/reports endpoint that returns an empty array for now
- POST /api/reports endpoint stub (returns 201 with echo of request)
- Listen on port 3000
- Log each request with method, path, and response time
- Add basic error handling middleware that returns { error: message }
```

**Expected output:**
- `server.js` with Express setup
- Health check working
- Empty /api/reports returns []
- You can test with: `curl http://localhost:3000/api/health`

---

### Prompt 1.2: Static HTML + CSS Frontend
```
Create a responsive HTML file (index.html) with:
- Header with title "Fuel Finder Live"
- Two tabs: "Feed View" and "Map View" (tab switching with JS)
- Form on left: station_name text input, product_type dropdown (Petrol/Diesel/Gas), status (radio buttons for Available/Low Stock/Out of Stock/Unknown), queue_time number input, notes textarea, Submit button
- Feed on right: empty list that will populate dynamically
- Mobile responsive: single column on < 640px, two columns on larger screens
- Color theme: green for Available, yellow for Low Stock, red for Out of Stock
- No frameworks, plain HTML/CSS/JS only
```

**Expected output:**
- `public/index.html` - form and feed layout
- `public/style.css` - (optional separate) or inline styles
- Mobile-friendly design
- Form fields clearly labeled

---

## Phase 2: Build Core Features

### Prompt 2.1: Form Validation & Submission
```
Add to the frontend form:
- Client-side validation function that checks:
  * station_name: required, 1-100 characters
  * product_type: must be one of Petrol, Diesel, Gas
  * status: must be one of Available, Low Stock, Out of Stock, Unknown
  * queue_time_minutes: required, must be a number between 0 and 999
  * notes: optional, max 500 characters
- Display field-specific error messages in red below each field
- On submit: validate first, show errors if invalid, POST to /api/reports if valid
- On success: show green confirmation message, clear form, refresh feed
- Use fetch() API to POST JSON to the server
```

**Expected output:**
- Form won't submit if validation fails
- Errors appear as red text
- Success message appears after valid submission
- Form clears after success

---

### Prompt 2.2: Server-Side Report Validation & Storage
```
Update POST /api/reports endpoint:
- Validate incoming JSON same as client-side rules
- Return 400 with field errors if validation fails (show which fields are bad)
- Generate a UUID for each report
- Add server timestamp (not client timestamp) to report
- Store reports in memory array (we'll persist later)
- Calculate a simple ai_trust_score (for now: random 0.5 to 0.95)
- Return 201 with the saved report object including id, timestamp, trust_score
- Include a success message: "Report submitted successfully!"
```

**Expected output:**
- POST /api/reports validates properly
- Returns 400 for invalid data with specific error messages
- Returns 201 for valid data
- Stored reports have id, timestamp, ai_trust_score

---

### Prompt 2.3: Live Feed Display
```
Add JavaScript to fetch and display reports:
- On page load: fetch GET /api/reports and display each report in the feed
- For each report show: station_name, product_type, status (with color), queue_time_minutes, timestamp (relative: "2 min ago", "1 hour ago")
- Sort reports newest first
- Color code status: green for Available, yellow for Low Stock, red for Out of Stock, gray for Unknown
- Add auto-refresh: fetch reports every 5 seconds and update feed without full page reload
- Merge new reports into existing feed (don't duplicate)
- Show "No reports yet" message if feed is empty
- Handle errors gracefully: show error message if fetch fails
```

**Expected output:**
- Feed populates on page load
- Reports show correct status colors
- Feed updates every 5 seconds automatically
- Timestamps update (e.g., "5 min ago" changes to "6 min ago")
- New reports appear in feed instantly

---

### Prompt 2.4: Time Conversion Helper
```
Add a JavaScript utility function that converts ISO timestamps to relative time:
- Input: "2026-05-08T14:30:00Z" (ISO string)
- Output: "2 minutes ago"
- Rules:
  * < 1 min: "just now"
  * < 1 hour: "N minutes ago"
  * < 1 day: "N hours ago"
  * >= 1 day: "N days ago"
- Use for feed display: show relative time instead of absolute ISO timestamp
```

**Expected output:**
- Helper function like `formatRelativeTime(isoString)` returns "2 minutes ago"
- Works for all time ranges

---

## Phase 3: Quality & Polish

### Prompt 3.1: AI Trust Score Heuristic
```
Implement a trust score calculation function on the backend:
- Input: current report + all reports in system
- Output: score 0-100
- Algorithm:
  * Start at 50 (neutral)
  * Add up to 30 points based on report age: new reports higher, -1 per hour old
  * If 3+ reports at same station with same status in last 2 hours: +20 points (cluster agreement)
  * If report says "Out of Stock" but only 1 report at that station: -15 points (penalize outliers)
  * Clamp final score to 0-100
- Display in feed: show confidence icon (✅ if >= 80, ⚠️ if < 50)
- Return trust_score in POST response and GET /api/reports
```

**Expected output:**
- Reports with high cluster agreement get higher scores
- Lone "out of stock" claims get lower scores
- UI shows confidence icons based on score

---

### Prompt 3.2: Error Messaging & Recovery
```
Improve error handling:
- If form submission fails (network error, server error), show error message
- Keep user's form input (don't clear on error)
- Show: "Something went wrong. Please check your connection and try again"
- Add retry button
- If feed fails to fetch, show: "Unable to load reports. Retrying in 5 seconds..." and auto-retry
- Client should never crash or show "undefined" - always show user-friendly messages
- Log actual errors to browser console (for debugging) but show friendly messages to user
```

**Expected output:**
- Form data persists if submission fails
- Users see clear error messages
- App keeps trying to load feed, doesn't give up
- No JavaScript errors in console (errors are caught and handled)

---

### Prompt 3.3: Responsive Design Audit
```
Ensure mobile responsiveness:
- Test at viewport widths: 375px (mobile), 768px (tablet), 1024px (desktop)
- Form inputs should be at least 44px tall (mobile-friendly tap targets)
- No horizontal scrolling on mobile
- Form labels are visible and clear
- Submit button is prominent and easy to tap
- Feed rows don't overflow on small screens
- Station names can wrap if needed
- Color and status indicators are visible on small screens
- Use media queries: single column < 768px, two columns >= 768px
```

**Expected output:**
- App works on phone without horizontal scroll
- Buttons are large enough to tap (at least 44px)
- Text is readable at mobile size

---

### Prompt 3.4: Accessibility Improvements
```
Add accessibility features:
- All form inputs have associated <label> elements with proper "for" attributes
- Status indicators use both color AND text/icons (not color alone):
  * Available: 🟢 + text
  * Low Stock: 🟡 + text
  * Out of Stock: 🔴 + text
- Submit button has clear text (not just an icon)
- Semantic HTML: use <main>, <header>, <button>, <form>, <label>
- Tab order is logical: can tab through form inputs top to bottom
- Error messages are associated with their input fields (aria-describedby if possible)
- Use focus indicators: outline-style: solid when focused
- Keyboard navigation: Tab to focus, Enter to activate buttons
```

**Expected output:**
- Tab through form works properly
- Press Enter on focused button submits form
- Screen reader can read form labels and error messages
- No keyboard traps (can always Tab away)

---

### Prompt 3.5: Data Persistence (File-Based)
```
Add file-based persistence to store reports between server restarts:
- Use Node.js fs module to read/write a "reports.json" file
- On startup: load existing reports from reports.json if it exists
- On POST /api/reports: save the new report to reports.json (append and overwrite)
- Keep only reports from the last 24 hours (delete older ones before saving)
- Handle file I/O errors gracefully (if file doesn't exist, start with empty array)
- Test: restart server and verify old reports still exist
- Note: file-based storage works for workshop MVP, not production
```

**Expected output:**
- Reports persist after server restarts
- Old reports (> 24 hours) are automatically removed
- Server starts up quickly even with many reports

---

## Phase 4: Deployment & Testing

### Prompt 4.1: Deploy Configuration
```
Prepare app for Cloud Run deployment:
- Add a Dockerfile (or Cloud Run will use buildpacks to auto-detect Node.js)
- Set PORT environment variable from process.env.PORT || 3000
- Add a .gcloudignore file to exclude unnecessary files (node_modules, .git, etc.)
- Ensure server starts cleanly with: npm start
- Health check should respond within 100ms
- No hardcoded file paths; use relative paths or /tmp for writable storage
- Add a simple README with deploy instructions
```

**Expected output:**
- Dockerfile or buildpack config ready
- `npm start` runs the server
- Health check responds quickly

---

### Prompt 4.2: Test Report Submission Script
```
Create a test script (test-reports.js) that:
- Uses fetch or axios to call POST /api/reports
- Submits 5 realistic test reports to the local server:
  * "Shell Station - Colombo", Petrol, Available, 45 min, "Long queue"
  * "Caltex - Kandy", Diesel, Low Stock, 20 min, "Low on fuel"
  * "Esso - Galle", Gas, Out of Stock, 0 min, "Will restock tomorrow"
  * "Mobil - Colombo", Petrol, Unknown, 10 min
  * "Shell Station - Colombo", Petrol, Available, 30 min (different time)
- Logs results: report ID, trust score, any errors
- Can run with: node test-reports.js
```

**Expected output:**
- Script creates test data
- All 5 reports stored with IDs and trust scores
- Feed shows all 5 reports when fetched

---

### Prompt 4.3: Load Testing (Optional Stretch)
```
Create a simple load test (optional):
- Submit 50 reports rapidly to test rate limiting
- Verify that after 1 report per station, subsequent ones return 429 rate limit
- Measure server response times
- Verify no crashes or corrupted data
```

**Expected output:**
- Rate limiting works (429 errors appear after first report per station)
- No server crashes
- Response times stay fast

---

## Phase 5: Debug Scenarios

### Prompt D1: "Reports not appearing in feed"
```
Troubleshoot why submitted reports don't appear in feed:
1. Check browser console (F12) for any JavaScript errors
2. Open Network tab, watch the POST /api/reports request:
   - What status code? (201 = good, 400 = validation error, 500 = server error)
   - What response body?
3. Check GET /api/reports after submission:
   - Does it include the report?
   - Is report in the response array?
4. If report is in API but not UI:
   - Debug the JavaScript that renders the feed
   - Add console.log to see if reports array is populated
5. If report is missing entirely:
   - Check server-side storage (is it being saved?)
   - Check if reports are older than 24 hours (auto-excluded)
```

**Debugging checklist provided in form of guided questions**

---

### Prompt D2: "Rate limiting too strict / too lenient"
```
Tuning rate limit logic:
- Current rule: 1 report per station per user per 5 minutes
- If too strict: increase time window (e.g., 3 minutes instead of 5)
- If too lenient: decrease window or increase report frequency limit
- Check rate limiter logic:
  1. How are users identified? (IP address, session, user ID?)
  2. Are you checking (station_name, user_id, timestamp) combination?
  3. Is timestamp comparison correct? (new report time - last report time)
- Add logging: console.log rate limit check results for debugging
```

**Expected output:**
- Rate limiting can be adjusted by workshop facilitator
- Logic is clear and testable

---

### Prompt D3: "Trust score seems wrong"
```
Debug trust score calculation:
- What score is being assigned? (should be 0-100)
- Expected behavior:
  * Newest reports: 70-90 (depending on cluster agreement)
  * Oldest reports (near 24h): 50-70
  * Outlier status (e.g., 1 "out of stock" among 5 "available"): 35-50
- Add logging to the calculateTrustScore function:
  - Log age boost: +X points
  - Log cluster bonus: +X points if agreement > 60%
  - Log anomaly penalty: -X points if outlier
  - Log final score: X/100
- Run a test with 5 similar reports + 1 outlier, check logs
```

**Expected output:**
- Trust score algorithm is transparent and debuggable
- Scores can be validated by looking at logs

---

## Quick Reference: Common Prompts

### "I need to add feature X quickly"
```
I want to [specific feature in 1-2 sentences].
Current tech: Express backend, vanilla JS frontend, in-memory storage.
Success looks like: [1-3 acceptance criteria].
What's the smallest change to add this?
```

### "This code has a bug"
```
Given this [error message or observed behavior], what's the likely root cause?
Here's the code: [paste relevant snippet]
Show me the fix with minimal changes.
```

### "How do I test this?"
```
How do I manually test that [specific functionality] works?
Step-by-step test plan I can run on localhost:3000.
Include example data and expected results.
```

### "Make this production-ready"
```
Review this code for production readiness:
- Security issues?
- Error handling gaps?
- Performance problems?
- Priorities by severity.
```

---

## Reference: Real Prompts from Workshop

These are prompts that have worked well in previous vibe-coding workshops:

**✅ Good prompt (specific, constrained):**
> "Add a 'last updated' label to the feed showing when it was last refreshed. Format: 'Feed updated 2 minutes ago'. Update it every time GET /api/reports completes. Show 'Loading...' while fetching."

**❌ Vague prompt (too broad):**
> "Make the feed better and faster."

**✅ Good debugging prompt:**
> "When I submit a report with queue_time=100, I see an error in the Network tab: '400 Bad Request, queue_time must be between 0 and 999'. But 100 is in that range. Why?"

**❌ Vague debugging prompt:**
> "The form doesn't work."

---

## Tips for Maximum Vibe Coding Success

1. **Start with Scope** – Use Prompt 1.1 to scaffold, get a working baseline fast
2. **Test After Each Build** – After each prompt, verify behavior works before moving on
3. **Save Prompts That Work** – If a prompt generates good code, save it for reference
4. **Ask for Diffs, Not Rewrites** – "Add X to this file" not "rewrite this whole component"
5. **Read AI Output Before Accepting** – Don't blindly accept generated code; understand it
6. **Break Big Problems Into Small Prompts** – Don't try to build everything at once
7. **Use Cursor's Context** – Keep related files open in tabs so AI has better context
8. **Review + Test = Confidence** – Every feature should pass your manual test before shipping

