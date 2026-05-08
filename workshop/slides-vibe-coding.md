# Vibe Coding with Cursor
## From Idea to Cloud Run in One Session

Audience: Undergraduate + Graduate students  
Duration: 4 hours  
Build: Campus Vibe Board

Speaker notes:
- Frame the session as practical software delivery, not prompt tricks.
- Emphasize that AI speeds up loops, but humans own quality.

---

# What We Are Building Today

Campus Vibe Board:
- Post a mood update
- Add location + short study tip
- View live feed + mood distribution
- Deploy publicly on Google Cloud Run

Speaker notes:
- Keep scope intentionally small so teams can ship.

---

# Why "Vibe Coding" Matters

- Faster first draft of ideas
- Better momentum for beginners
- More time for product thinking
- Strong pair-programming behavior with AI

Risks:
- Over-trusting generated code
- Scope explosion
- Hidden bugs in "looks good" code

Speaker notes:
- This is not no-code; it is assisted software engineering.

---

# Learning Outcomes

By end of workshop, each team can:
- Turn fuzzy ideas into scoped implementation plans
- Use Cursor prompts for build, review, and debugging
- Ship a full-stack app
- Deploy and validate in Cloud Run

---

# Session Flow

1. Kickoff and vibe coding mindset
2. Prompt patterns in Cursor
3. Lab Part 1: build core app
4. Lab Part 2: improve quality
5. Deploy to Cloud Run
6. Demo + reflection

---

# Ground Rules for AI-Assisted Building

- Small steps over big rewrites
- Read before accepting generated code
- Validate behavior after each change
- Track assumptions explicitly
- Keep a human decision log

---

# Cursor Prompt Pattern 1: Scope First

Prompt:
"Propose a 60-minute implementation plan. Keep scope small, list files to change, add acceptance criteria."

Expected output:
- Sequence of tasks
- Boundaries
- Test checkpoints

---

# Cursor Prompt Pattern 2: Focused Build

Prompt:
"Implement feature X with the smallest maintainable change. Do not touch unrelated files."

Why this works:
- Reduces regressions
- Easier code review
- Faster debugging

---

# Cursor Prompt Pattern 3: Review and Risk

Prompt:
"Review this diff as a senior engineer. List bugs, edge cases, and regressions by severity."

Use it when:
- Before merge
- Before deployment
- After major refactors

---

# Cursor Prompt Pattern 4: Debug Fast

Prompt:
"Given this error and current code, list 3 likely root causes and lowest-risk fix first."

Debug loop:
1. Reproduce
2. Hypothesize
3. Patch
4. Verify

---

# Architecture We Will Build

Frontend:
- Static HTML/CSS/JS

Backend:
- Express API
- In-memory vibe list

Endpoints:
- GET /api/health
- GET /api/vibes
- POST /api/vibes

---

# Lab Part 1 (Build Core)

Task checklist:
- Run app locally
- Inspect API + UI flow
- Add one new field or validation rule
- Confirm feed updates correctly

Definition of done:
- Team can submit and view vibe posts locally

---

# Lab Part 2 (Quality Pass)

Choose at least 2:
- Better validation messages
- Accessibility improvements
- Responsive UI polish
- Basic test plan

Graduate stretch:
- Discuss persistence strategy (Firestore)
- Add simple observability ideas

---

# Deployment Target: Cloud Run

Why Cloud Run for workshops:
- Fast source deploy
- No VM management
- Scales automatically
- Public URL in minutes

---

# Deploy Commands

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud run deploy campus-vibe-board --source app --region us-central1 --allow-unauthenticated
```

Speaker notes:
- Explain this uses buildpacks/source deploy flow.

---

# Post-Deploy Verification

Check:
- Service URL loads
- /api/health returns status ok
- Can create at least 3 vibe posts
- UI reflects newly posted data

---

# Common Failure Cases and Fixes

- Wrong active project in gcloud
- Required APIs not enabled
- Region mismatch or quota issues
- Validation errors from malformed payload

Fast recovery habit:
- Read exact error text first, then prompt Cursor with context.

---

# Engineering Judgment Checkpoint

Before accepting AI-generated code, ask:
- Is behavior correct?
- Is this the simplest solution?
- What edge case can break this?
- What test or manual check proves it works?

---

# Undergraduate Track Guidance

Focus:
- Prompt clarity
- Working software
- Explain your decisions

Success signal:
- Team ships with confidence and can describe their code path.

---

# Graduate Track Guidance

Focus:
- Trade-offs and reliability
- Lightweight architecture critique
- Cost/performance/security awareness

Success signal:
- Team justifies design decisions beyond "AI suggested it".

---

# Team Demo Format (3 Minutes)

1. Problem and target users
2. One AI-assisted feature
3. One bug and how you fixed it
4. Live URL on Cloud Run
5. One lesson learned

---

# Reflection Prompts

- Where did AI save the most time?
- Where did human review matter most?
- What prompt gave the best result?
- What would you build next?

---

# Optional Next Iterations

- Add Firestore persistence
- Add content moderation rules
- Add filters by mood/location
- Add simple analytics dashboard

---

# Resource Pack

In this repo:
- workshop/participant-handbook.md
- workshop/cursor-prompt-playbook.md
- deploy/gcp-cloud-run.md

---

# Thank You

Build responsibly. Ship confidently.

Call to action:
- Publish your app URL
- Share 3 best prompts from your team
- Document one engineering decision you owned
