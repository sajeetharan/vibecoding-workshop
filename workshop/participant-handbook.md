# Participant Handbook

## Workshop Challenge
Build and deploy AI Powered CV Generator:
- Users provide GitHub username and Stack Overflow user ID.
- App generates a detailed CV with summary, skills, projects, and achievements.
- App exports CV as PDF.
- App is deployed to Google Cloud Run.

## Part A: Build Locally
1. Open the project in Cursor.
2. Go to app/ and install dependencies:
   - npm install
3. Run app:
   - npm run dev
4. Open http://localhost:8080

## Part B: Practice Vibe Coding in Cursor
Use these prompts and adapt:
1. Read this codebase and explain architecture in 8 bullets.
2. Improve professional tone and formatting of generated CV sections.
3. Add robust validation for POST /api/generate-cv.
4. Create a minimal test checklist for API and PDF export.

## Part C: Deploy to Google Cloud Run
From workspace root:
1. gcloud auth login
2. gcloud config set project YOUR_PROJECT_ID
3. gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
4. gcloud run deploy cv-generator --source app --region us-central1 --allow-unauthenticated

After deploy:
- open service URL,
- call /api/health,
- generate at least 1 CV,
- download the generated PDF.

## Stretch Goals
- Persist CV records in Firestore.
- Add multiple PDF templates.
- Add ATS scoring hints.
- Add optional LLM rewrite pass.

## Submission
Share:
- Cloud Run URL,
- screenshot or short demo,
- 3 prompts that helped most,
- one lesson on safe AI-assisted coding.
