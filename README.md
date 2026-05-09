# Vibe Coding Workshop: AI Powered CV Generator

A practical workshop for undergraduate and graduate students to build an AI Powered CV Generator using Cursor. Participants provide GitHub and Stack Overflow URLs, extract profile signals, and generate polished CV content.

## Workshop Goal
By the end of this workshop, participants will:
- Use Cursor to plan, scaffold, and improve an app with high-quality prompts.
- Build a small full-stack app called **AI Powered CV Generator**.
- Collaborate in teams and iterate quickly.
- Deploy the app and share a public URL.
- Reflect on engineering trade-offs across data quality, prompt design, and output structure.

## Audience
- Undergraduates: basic programming knowledge.
- Graduates: can dive deeper into architecture, observability, and scaling.

## Repo Structure
- `workshop/` - slides, guides, prompts, and materials
- `app/` - hands-on sample app source code
- `deploy/` - deployment guides and GCP configuration

## Workshop Guides (Follow in Order)

### 📋 Before Workshop (Pre-Setup - 90 minutes)
**Participants**: Start here before the workshop begins
- **[deploy/gcp-setup-guide.md](deploy/gcp-setup-guide.md)** — Complete GCP project setup in 14 steps
  - Create GCP project, enable APIs, set up secrets, IAM roles
  - Initialize Firestore, authenticate local environment
  - **Required before lab time starts**

### 🎯 During Workshop (Lab Phase - 40 minutes)
**Participants**: Use these during hands-on coding
- **[workshop/cursor-cv-prompts.md](workshop/cursor-cv-prompts.md)** — Copy-paste Cursor prompts for each phase
  - Phase 1-3: GitHub + Stack Overflow API integration (20 min)
  - Phase 4-5: CV generation + Firestore persistence (10 min)
  - Phase 6: Secret Manager integration (optional)
  - **Paste prompts directly into Cursor Chat (`Ctrl+K`)**

- **[workshop/cv-generator-rules-and-skills.md](workshop/cv-generator-rules-and-skills.md)** — Deep reference guide
  - 6 core skills with detailed implementation guidance
  - Business rules, error handling, testing strategies
  - Common gotchas and fixes

### 📚 Reference & Extension
- **[workshop/cv-generator-technical-spec.md](workshop/cv-generator-technical-spec.md)** — Architecture deep dive
  - GCP service architecture, API specs, data schemas
  - Rate limiting, error handling, monitoring
  
- **[workshop/participant-handbook.md](workshop/participant-handbook.md)** — General workshop handbook

- **[workshop/cursor-prompt-playbook.md](workshop/cursor-prompt-playbook.md)** — General prompt patterns (not CV-specific)

### 🎤 For Facilitators
- **[workshop/slides-vibe-coding.html](workshop/slides-vibe-coding.html)** — Main slide deck (40-min presentation)
  - Open in browser, press `N` to toggle speaker notes
  - Arrow keys to navigate slides
  
- **[workshop/slides-walkthrough.md](workshop/slides-walkthrough.md)** — Minute-by-minute speaking guide

- **[.cursorrules](.cursorrules)** — Cursor context for attendees' IDE

## Slide Deck Assets
- `workshop/slides-vibe-coding.html` - Full presentation with embedded speaker notes (press `N` while presenting)
- `workshop/slides-walkthrough.md` - Detailed timing and transitions for facilitators

## Quick Start
1. Install Node.js 20+.
2. From `app/`, run:
   - `npm install`
   - `npm run dev`
3. Open http://localhost:8080 (or `http://localhost:$PORT` if `PORT` is set)
4. Follow **[workshop/cursor-cv-prompts.md](workshop/cursor-cv-prompts.md)** for the lab journey.

## Fastest Deploy
From workspace root:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud run deploy ai-cv-generator --source app --region us-central1 --allow-unauthenticated
```

Windows note:
- Command Prompt (cmd): use `set PROJECT_ID=YOUR_PROJECT_ID` for a session variable, or `setx PROJECT_ID "YOUR_PROJECT_ID"` for persistent.
- PowerShell: use `$env:PROJECT_ID="YOUR_PROJECT_ID"`.
- Any shell: `gcloud config set project YOUR_PROJECT_ID` is the recommended way to set active project for `gcloud`.

## Suggested Duration
- 3.5 to 4.5 hours total.

## License
For educational use in workshops and bootcamps.
