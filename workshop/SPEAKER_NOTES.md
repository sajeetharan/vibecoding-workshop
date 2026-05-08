# Vibe Coding Workshop - Speaker Notes

> **Presenter:** Sajeetharan (@sajeetharan)  
> **Duration:** ~40 minutes slides + hands-on build time  
> **Goal:** Deliver a practical workshop on prompt engineering with Cursor and shipping AI-assisted apps

---

## Slide 1: Title & Welcome

**Key Points:**
- Welcome everyone to the Vibe Coding Workshop
- Introduce yourself quickly using the profile card
- Set expectations: practical, hands-on, shipped-by-end experience
- Point to sajeetharan.dev for talks, projects, and blogs
- Emphasize: personal passion project, not employer-related (see disclaimer)

**Timing:** 2 minutes

**Transition:** "Next, let me walk you through what we're building and the timing for today."

---

## Slide 2: Agenda

**Key Points:**
- **40 minutes slides** covering fundamentals → patterns → architecture → deployment
- **Remaining time: hands-on building** with live support
- Walk through timing so everyone knows the pace
- Emphasize this is "less slides, more building"
- Call out the **deployment checkpoint as mandatory**
- Ask everyone to keep **one tab for docs, one tab for coding**

**Timing:** 3 minutes

**Transition:** "Let's start with why this matters..."

---

## Slide 3: Project Context – The Fuel Crisis

**Key Points:**
- Set the real-world scenario: fuel shortage during crisis
- Users need to find fuel in real-time
- Challenge: "How do we build this fast with AI help?"
- Frame the Fuel Finder app as the solution you'll build
- Emphasize: this is a real problem that AI can actually help solve

**Timing:** 3 minutes

**Transition:** "Here's what you'll achieve by the end of today..."

---

## Slide 4: Session Outcomes

**Key Points:**
- You'll ship a **working full-stack app** deployed to Cloud Run
- You'll learn **3 reusable AI prompt patterns** for future projects
- You'll understand when to use AI scaffolding vs. human review
- Success metric: "Everyone leaves with deployed code"

**Timing:** 2 minutes

**Transition:** "Before we start building, let me give you a quick intro to Cursor if you're new to it..."

---

## Slide 5-14: Cursor Crash Course (10 minutes total)

### Slide 5: What is Cursor?
- AI-first code editor built on VS Code
- Think: "ChatGPT native in your editor"
- Fast for scaffolding, great for team code reviews
- Not a replacement for thinking—amplifier for productivity

**Timing:** 1 minute

### Slide 6: Core Features
- **Chat:** Ask questions about your code or generate
- **Tab Autocomplete:** AI suggests next lines (like Copilot)
- **Codebase Context:** Understands your full project
- **Edit Mode:** Highlight a block and ask for rewrites

**Timing:** 1.5 minutes

**Live Demo Moment:** "Show Tab Autocomplete in action if possible"

### Slide 7: Installation & Setup
- Download from cursor.sh
- Sign in with GitHub
- Set your API key (use Cursor's or your own OpenAI key)
- Recommended: Use Claude 3.5 Sonnet model

**Timing:** 1 minute

### Slide 8: Keyboard Shortcuts
- `Ctrl+L` (Windows/Linux) or `Cmd+L` (Mac): Open chat
- `Ctrl+K`: Edit mode (highlight and fix code)
- `Ctrl+Shift+L`: Codebase search
- Recommend: Keep shortcuts visible in first 20 minutes

**Timing:** 1 minute

**Tip:** "Bookmark the shortcuts page; muscle memory builds fast"

### Slide 9: Chat vs. Tab Autocomplete
- **Chat:** Strategic (complex rewrites, architecture questions)
- **Tab Autocomplete:** Tactical (fill in repetitive code)
- Use tab autocomplete during live coding

**Timing:** 1 minute

### Slide 10: Good Prompts vs. Bad Prompts
- ❌ "Make this better" → Too vague
- ✅ "Add 3-second debounce to this search function" → Specific
- ❌ "Build a database" → Too large
- ✅ "Create a SQL migration for a users table with email unique constraint" → Scoped

**Timing:** 1.5 minutes

### Slide 11: Codebase Context
- Use `@` symbol in chat to reference files
- Tell Cursor: "Here's the pattern I want to follow"
- Reduces hallucinations and wrong implementations

**Timing:** 1 minute

### Slide 12: Gotchas & Limitations
- Cursor can hallucinate dependencies (always verify)
- Doesn't know your business logic—must provide context
- Works best with incremental asks, not big-bang prompts
- Always review AI-generated security-critical code

**Timing:** 1 minute

### Slide 13: Settings for This Workshop
- Use Claude 3.5 Sonnet (best quality/speed tradeoff)
- Enable "Multiline Editing" mode
- Turn on code formatting on save
- Set editor to "VS Code Dark" theme to match this deck

**Timing:** 0.5 minute

### Slide 14: Your First Cursor Action
- Open Cursor
- Create a `hello.js` file
- Use Tab Autocomplete to suggest a simple function
- Get comfortable with the feedback loop

**Timing:** 1 minute (or demo)

**Transition:** "Now let's talk about the patterns that make AI prompts actually work..."

---

## Slide 15-18: Vibe Coding Patterns (10 minutes total)

### Slide 15: What is Vibe Coding?
- Using AI prompts to generate code scaffolding
- Combining human judgment with AI speed
- Philosophy: "Let AI do the repetitive, you do the creative"

**Timing:** 1 minute

**Analogy:** "Like pair programming with a very fast junior developer"

### Slide 16: The 3 Core Patterns
1. **Scaffolding:** "Generate the skeleton, I fill in the logic"
2. **Refactoring:** "Improve this code for readability"
3. **Review & Debug:** "Why is this failing?"

**Timing:** 1.5 minutes

### Slide 17: Pattern 1 – Scaffolding
- Prompt: "Create a React component for a search bar that debounces input"
- Cursor generates the structure
- You add domain-specific logic (API calls, filtering)
- Saves 60% of boilerplate time

**Timing:** 2 minutes

**Example Code:** Show before/after

### Slide 18: Pattern 2 & 3 – Refactoring & Debugging
- **Refactoring:** Select messy code → "Improve variable names and split into helpers"
- **Debugging:** Share the error → "Why am I getting CORS errors?"
- Cursor walks you through the solution

**Timing:** 3 minutes

**Transition:** "Let's see how we apply these patterns to the architecture of Fuel Finder..."

---

## Slide 19-22: Fuel Finder Architecture (10 minutes total)

### Slide 19: What We're Building
- Real-time fuel availability map
- Users query: "Where can I get fuel in the next 5 minutes?"
- System responds with: location, price, distance, availability

**Timing:** 1 minute

### Slide 20: Tech Stack
- **Frontend:** React + Leaflet (mapping)
- **Backend:** Node.js + Express
- **Database:** Firebase (Firestore) or in-memory for demo
- **Deployment:** Google Cloud Run (containerized)

**Timing:** 1 minute

**Callout:** "Why Cloud Run? Fast to deploy, pay per request, scales to zero."

### Slide 21: Database Schema (Key Design)
```
Collection: fuel_stations
  - id: string (primary key)
  - name: string
  - location: GeoPoint (lat, lng)
  - fuel_type: string
  - available_liters: number
  - price_per_liter: number
  - updated_at: timestamp
```

**Partition Key Best Practice:**
- Use `station_id` for queries like "Get all fuel for station X"
- High cardinality = better distribution
- Avoid partitioning by `fuel_type` (too few values = hotspots)

**Timing:** 2 minutes

**Key Takeaway:** "A good partition key makes queries 10x cheaper."

### Slide 22: Deployment Overview
- Container → Docker image
- Registry → Google Container Registry (GCR)
- Platform → Cloud Run
- Trigger → git push (via Cloud Build)

**Timing:** 1 minute

**Timing:** "You'll deploy this at the end of the workshop."

**Transition:** "Now let's jump into hands-on building. I'll guide you through each step using Cursor prompts..."

---

## Slide 23-27: Lab Instructions (5 minutes overview)

### Slide 23: Part 1 – Scaffold the Backend
- Start with a blank `server.js`
- Use Cursor to generate: Express setup, routes, middleware
- Add the fuel lookup logic manually
- Test with curl or Postman

**Timing:** 1 minute

**Prompt Example:** 
> "Create an Express server with GET /fuel endpoint that returns mock fuel station data"

### Slide 24: Part 2 – Build the Frontend
- React component: Search bar + Results list
- Use Cursor for: component boilerplate, state management (useState)
- Add manual styling to match the dark theme

**Timing:** 1 minute

**Prompt Example:**
> "Create a React component that takes a list of fuel stations and displays them in a formatted card layout"

### Slide 25: Part 3 – Add Quality Improvements
- Error handling: "What if the API is down?"
- Debouncing: Don't spam the server with every keystroke
- Logging: Understand what's happening in production

**Timing:** 1 minute

### Slide 26: Part 4 – Deploy to Cloud Run
- Dockerfile (Cursor can scaffold this)
- Push to GCR
- Deploy to Cloud Run
- Share the live URL

**Timing:** 1 minute

### Slide 27: Troubleshooting Guide
- 404 errors? Check routes in `server.js`
- CORS issues? Ensure `app.use(cors())` is before routes
- Container won't start? Check `package.json` for start script

**Timing:** 1 minute

**Transition:** "During the break, I'll be here to help. Use the GitHub repo as reference."

---

## Slide 28+: Architecture Details, Optional Iterations, Resources

### Slide 28-32: (Advanced topics—reference only, skip if time is tight)
- **Slide 28:** Firestore/NoSQL best practices
- **Slide 29:** Caching strategies
- **Slide 30:** API design patterns
- **Slide 31:** Testing in production
- **Slide 32:** Observability (logging, monitoring)

**Timing:** Mention but don't deep-dive. Say: "Detailed explanations are in the participant handbook."

### Slide 33: Optional Next Iterations
- Add Firestore persistence
- Implement moderation (filter unsafe fuels)
- Add location-based filtering
- Build an analytics dashboard

**Timing:** 1 minute (aspirational—most won't get here)

### Slide 34: Resource Pack
- GitHub repo: https://github.com/sajeetharan/vibecoding-workshop
- participant-handbook.md: Deep technical docs
- cursor-prompt-playbook.md: Copy-paste prompts
- deploy/gcp-cloud-run.md: Deployment walkthrough

**Timing:** 2 minutes

**Say:** "Everything you need is in here. Bookmark the repo."

### Slide 35: Thank You & Close
- Publish your app URL
- Share your 3 best prompts with the group
- Document one engineering decision you made

**Timing:** 2 minutes (final Q&A)

**Tone:** Celebratory. Emphasize: "You shipped code today."

---

## Facilitator Tips

### Managing Time
- **Hard stop at 40 min slides.** Use a timer.
- If running long, skip architecture detail slides (28-32).
- Deployment is non-negotiable—don't skip slide 26.

### Engagement
- Every 10 minutes, ask: "Any quick questions?"
- During labs, circulate. Pick 2-3 teams to share progress.
- Celebrate first working deployment publicly.

### Troubleshooting
- **Cursor not generating?** Check API key and model selection.
- **npm install hangs?** Use `npm ci` instead; faster for CI/CD.
- **Docker build fails?** Check Node.js version in Dockerfile.

### Post-Workshop
- Collect GitHub URLs from teams and share a leaderboard
- Send a follow-up email with "next steps" challenges
- Use feedback to refine prompts for next workshop iteration

---

## Key Phrases to Remember

- "Vibe coding is about speed AND quality."
- "Let the AI scaffold, you validate."
- "Always code review AI output."
- "Deploy early, debug live."
- "You're not replacing engineers—you're making them faster."

---

**Last Updated:** May 8, 2026  
**Facilitator:** Sajeetharan (@sajeetharan)  
**Contact:** sajeetharan.dev
