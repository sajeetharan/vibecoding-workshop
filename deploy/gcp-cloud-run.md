# Deploy to Google Cloud Run (Developer-Friendly Path)

Cloud Run is a good fit for student workshops because it is simple, serverless, and scales automatically.

## One-Time Setup
1. Install Google Cloud SDK.
2. Authenticate:
   - `gcloud auth login`
3. Set project:
   - `gcloud config set project YOUR_PROJECT_ID`
4. Enable required APIs:
   - `gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com`

## Quick Deploy from Source
From workspace root:

```bash
gcloud run deploy campus-vibe-board --source app --region us-central1 --allow-unauthenticated
```

This builds and deploys without requiring students to manually manage container registry steps.

## Verify
- Visit the generated URL.
- Check health endpoint: `https://YOUR_SERVICE_URL/api/health`
- Post new vibe updates in the UI.

## Update After Code Changes
Run the same deploy command again:

```bash
gcloud run deploy campus-vibe-board --source app --region us-central1 --allow-unauthenticated
```

## Optional: Cost Safety for Workshops
- Set a budget alert in Google Cloud Billing.
- Use one shared project for demo, or cap team projects.
- Tear down service after workshop if not needed.

## Cleanup
```bash
gcloud run services delete campus-vibe-board --region us-central1
```
