# Vibe Coding with Cursor
## From Idea to Cloud Run in One Session

Audience: Undergraduate + Graduate students
Duration: 4 hours
Build: AI Powered CV Generator

---

# What We Are Building Today

AI Powered CV Generator:
- Accept GitHub username + Stack Overflow user ID
- Extract project and skill signals
- Generate professional CV sections
- Export CV as downloadable PDF
- Deploy publicly on Google Cloud Run

---

# Why Vibe Coding Matters

- Faster delivery loop from prompt to working software
- Better momentum for beginner and advanced teams
- More time for product and quality decisions
- Strong pair-programming behavior with AI

Risks:
- Over-trusting generated code
- Scope explosion
- Hidden quality issues

---

# Learning Outcomes

By end of workshop, each team can:
- Scope a CV product iteration clearly
- Use Cursor prompts for build, review, and debugging
- Ship a full-stack app to Cloud Run
- Validate output quality with practical checks

---

# Session Flow

1. Kickoff and vibe coding mindset
2. Prompt patterns in Cursor
3. Lab Part 1: build core CV flow
4. Lab Part 2: improve quality and PDF export
5. Deploy to Cloud Run
6. Demo and reflection

---

# Prompt Pattern 1: Scope First

Prompt:
Propose a 60-minute implementation plan. Keep scope small, list files to change, add acceptance criteria.

Expected output:
- Sequence of tasks
- Boundaries
- Test checkpoints

---

# Prompt Pattern 2: Focused Build

Prompt:
Implement feature X with the smallest maintainable change. Do not touch unrelated files.

Why this works:
- Reduces regressions
- Easier code review
- Faster debugging

---

# Prompt Pattern 3: Review and Risk

Prompt:
Review this diff as a senior engineer. List bugs, edge cases, and regressions by severity.

Use it when:
- Before merge
- Before deployment
- After major refactors

---

# Prompt Pattern 4: Debug Fast

Prompt:
Given this error and current code, list 3 likely root causes and lowest-risk fix first.

Debug loop:
1. Reproduce
2. Hypothesize
3. Patch
4. Verify

---

# Architecture We Will Build

Frontend:
- Static HTML/CSS/JS UI for profile input and preview

Backend:
- Express API
- GitHub and Stack Overflow signal fetch
- In-memory CV records
- PDF generation endpoint

Endpoints:
- GET /api/health
- POST /api/generate-cv
- GET /api/cvs/:cvId
- GET /api/cvs/:cvId/pdf

---

# Lab Part 1: Core Flow

Task checklist:
- Run app locally
- Generate CV from sample profiles
- Validate summary, skills, and projects
- Validate PDF download

Definition of done:
- Team can generate and download at least one detailed CV locally

---

# Lab Part 2: Quality Pass

Choose at least 2:
- Improve professional wording in CV sections
- Improve field validation and error messages
- Improve accessibility and responsive layout
- Add checklist-based manual QA plan

Graduate stretch:
- Discuss persistence strategy with Firestore
- Add observability and failure diagnostics

---

# Deployment Target: Cloud Run

Why Cloud Run for workshops:
- Fast source deploy
- No VM management
- Auto scaling
- Public URL in minutes

---

# Deploy Commands

gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud run deploy cv-generator --source app --region us-central1 --allow-unauthenticated

---

# Post-Deploy Verification

Check:
- Service URL loads
- /api/health returns status ok
- CV generation returns cvId and detailed content
- PDF endpoint downloads correctly

---

# Common Failure Cases and Fixes

- Wrong active project in gcloud
- Missing IAM permission for service account actAs
- API rate limit from GitHub
- Stack Overflow user ID invalid

Recovery habit:
- Read exact error text first, then prompt Cursor with full context.

---

# Engineering Judgment Checkpoint

Before accepting AI-generated code, ask:
- Is behavior correct?
- Is this the simplest solution?
- Which edge case can fail?
- What proves it works?

---

# Team Demo Format (3 Minutes)

1. Problem and target users
2. One AI-assisted feature
3. One bug and how you fixed it
4. Live URL on Cloud Run
5. One lesson learned

---

# Optional Next Iterations

- Firestore persistence for generated CVs
- LLM-assisted rewrite mode for ATS optimization
- Multiple PDF design themes
- Export DOCX in addition to PDF

---

# Resource Pack

In this repo:
- workshop/participant-handbook.md
- workshop/cursor-cv-prompts.md
- workshop/cv-generator-rules-and-skills.md
- workshop/cv-generator-technical-spec.md
- deploy/gcp-setup-guide.md
