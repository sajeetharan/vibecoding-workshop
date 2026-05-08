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
- `workshop/` - agenda, facilitator notes, participant handbook, prompt playbook.
- `app/` - hands-on sample app source code.
- `deploy/` - deployment guides and optional Cloud Build config.

## Slide Deck Assets
- `workshop/slides-vibe-coding.md` - presenter-ready slide content (easy to paste into Google Slides or use with Marp).
- `workshop/slides-walkthrough.md` - minute-by-minute speaking guide for facilitators.

## Quick Start
1. Install Node.js 20+.
2. From `app/`, run:
   - `npm install`
   - `npm run dev`
3. Open http://localhost:8080
4. Follow `workshop/participant-handbook.md` for the lab journey.

## Fastest Deploy
From workspace root:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud run deploy ai-cv-generator --source app --region us-central1 --allow-unauthenticated
```

## Suggested Duration
- 3.5 to 4.5 hours total.

## License
For educational use in workshops and bootcamps.
