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

Prompt pointers (how to ask well):
1. Start with one clear task and one expected output.
2. Name exact files to edit and what must stay unchanged.
3. Include constraints such as keep routes unchanged, no extra dependencies, or minimal diff.
4. Ask for acceptance criteria at the end of each prompt.
5. Ask for test steps in plain language after implementation.

Rules to follow while vibe coding:
1. Use small iterations instead of large rewrites.
2. Read generated code before accepting changes.
3. Verify behavior after each step using API and UI checks.
4. Keep error messages user friendly and actionable.
5. Track assumptions and unresolved questions in notes.

Skills to practice in this workshop:
1. Prompt scoping and decomposition.
2. API design and validation.
3. Data mapping from GitHub and Stack Overflow into CV sections.
4. PDF export quality and layout checks.
5. Debugging with evidence from logs and error text.

Simple tasks (quick wins):
1. Change the page title and hero subtitle to match your team name.
2. Add one new input field (for example: portfolio URL) and show it in the output JSON.
3. Add a friendly validation message when both GitHub and Stack Overflow fields are empty.
4. Show a loading message while CV generation is in progress.
5. Add a small success message after PDF download starts.
6. Test with one real GitHub username and one Stack Overflow user ID, then confirm projects and skills appear.

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
Share your submission with: sajeefx@gmail.com

Share:
- Cloud Run URL,
- screenshot or short demo,
- 3 prompts that helped most,
- one lesson on safe AI-assisted coding.
