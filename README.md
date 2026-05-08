# Vibe Coding Workshop: Cursor + Google Cloud Run

A practical workshop for undergraduate and graduate students to build an interesting web app using AI-assisted development in Cursor, then deploy it to Google Cloud using Cloud Run.

## Workshop Goal
By the end of this workshop, participants will:
- Use Cursor to plan, scaffold, and improve an app with high-quality prompts.
- Build a small full-stack app called **Campus Vibe Board**.
- Collaborate in teams and iterate quickly.
- Deploy the app to Google Cloud Run.
- Share a public URL and reflect on engineering trade-offs.

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

## Fastest Deploy (Cloud Run Source Deploy)
From workspace root:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud run deploy campus-vibe-board --source app --region us-central1 --allow-unauthenticated
```

## Suggested Duration
- 3.5 to 4.5 hours total.

## License
For educational use in workshops and bootcamps.
