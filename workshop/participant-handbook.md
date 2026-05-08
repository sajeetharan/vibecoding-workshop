# Participant Handbook

## Workshop Challenge
Build and deploy **Campus Vibe Board**:
- Students can post short "vibe updates" (mood + location + tip).
- App shows a feed and mood distribution.
- App is deployed to Google Cloud Run.

## Part A: Build Locally
1. Open the project in Cursor.
2. Go to `app/` and install dependencies:
   - `npm install`
3. Run app:
   - `npm run dev`
4. Open http://localhost:8080

## Part B: Practice Vibe Coding in Cursor
Use these prompts and adapt:
1. "Read this codebase and explain architecture in 8 bullets."
2. "Add input validation and user-friendly errors for POST /api/vibes."
3. "Improve frontend accessibility: labels, focus states, and color contrast."
4. "Create a minimal test plan for the API and UI."

## Part C: Deploy to Google Cloud Run
From workspace root:
1. `gcloud auth login`
2. `gcloud config set project YOUR_PROJECT_ID`
3. `gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com`
4. `gcloud run deploy campus-vibe-board --source app --region us-central1 --allow-unauthenticated`

After deploy:
- open service URL,
- call `/api/health`,
- submit at least 3 vibe posts.

## Stretch Goals
- Persist data in Firestore.
- Add filters by mood and location.
- Add anonymous nickname generator.
- Add simple moderation rules (blocked words).

## Submission
Share:
- Cloud Run URL,
- screenshot or short demo,
- 3 prompts that helped most,
- one lesson on safe AI-assisted coding.
