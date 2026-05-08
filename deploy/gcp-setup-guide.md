# GCP Setup Guide for CV Generator Workshop

This guide walks you through setting up your Google Cloud environment for the CV Generator workshop. **Complete this BEFORE the lab starts.**

## Prerequisites

- Google Cloud account (create free at https://cloud.google.com/free)
- `gcloud` CLI installed (https://cloud.google.com/sdk/docs/install)
- GitHub personal access token (https://github.com/settings/tokens)
- Basic terminal/CLI comfort

## Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click project dropdown → "New Project"
3. Enter project name: `cv-generator-workshop`
4. Click "Create" (wait ~1 minute for completion)
5. In the top dropdown, select your new project

**Verify**: Top-left shows "cv-generator-workshop"

---

## Step 2: Enable Required APIs

In Cloud Console, enable these APIs:

### Method A: Using `gcloud` CLI (Faster)

Open terminal and run:

```bash
gcloud config set project cv-generator-workshop
```

Then copy-paste this single command (all on one line):

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com firestore.googleapis.com secretmanager.googleapis.com storage-api.googleapis.com logging.googleapis.com iam.googleapis.com
```

**Alternative** (if you prefer line-by-line):
```powershell
gcloud services enable run.googleapis.com; gcloud services enable cloudbuild.googleapis.com; gcloud services enable artifactregistry.googleapis.com; gcloud services enable firestore.googleapis.com; gcloud services enable secretmanager.googleapis.com; gcloud services enable storage-api.googleapis.com; gcloud services enable logging.googleapis.com; gcloud services enable iam.googleapis.com
```

**Wait**: Takes 2-3 minutes for all APIs to enable

**Verify**: No error messages in terminal

### What Services Are We Enabling? (And Why)

| API | Purpose | Why Needed |
|-----|---------|-----------|
| **run.googleapis.com** | Cloud Run API | Deploy Express app to serverless container service |
| **cloudbuild.googleapis.com** | Cloud Build API | Build Docker images automatically from source |
| **artifactregistry.googleapis.com** | Artifact Registry API | Store Docker images in private registry |
| **firestore.googleapis.com** | Cloud Firestore API | Database to store generated CVs |
| **secretmanager.googleapis.com** | Secret Manager API | Secure storage for GitHub token + API keys |
| **storage-api.googleapis.com** | Cloud Storage API | Store exported PDF/DOCX files |
| **logging.googleapis.com** | Cloud Logging API | Monitor app logs, API latency, errors |
| **iam.googleapis.com** | IAM API | Manage service account permissions |

**TL;DR**: Run the single-line command above. It enables all 8 services needed for the CV Generator to work end-to-end.

### Method B: Using Console (Manual)

1. Go to https://console.cloud.google.com/apis/library
2. Search and **Enable** each:
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Cloud Firestore API
   - Secret Manager API
   - Google Cloud Storage API
   - Cloud Logging API

---

## Step 3: Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Token name: `cv-generator-workshop`
4. Scopes:
   - ☑️ `public_repo` (read public repos)
   - ☑️ `user` (read user profile)
5. Click "Generate token"
6. **Copy the token** (you'll use it next) - save it safely!

**Keep this token safe**: Don't share it; regenerate if exposed

---

## Step 4: Create Secrets in Secret Manager

Store your API keys securely:

### 4.1 GitHub Token Secret

```bash
gcloud secrets create github-token \
  --replication-policy="automatic" \
  --data-file=-
```

When prompted, paste your GitHub token (from Step 3), then press Enter, then Ctrl+D

**Verify**: 
```bash
gcloud secrets list
```
Should show `github-token` in the output

### 4.2 LLM API Key Secret (Claude, OpenAI, or Gemini)

Choose ONE LLM provider and get your API key:

| Provider | Get API Key | Cost | Speed | Quality |
|----------|-------------|------|-------|---------|
| **Claude** | https://console.anthropic.com/account/keys | $1-5 per 1M tokens | Moderate | Excellent reasoning |
| **OpenAI** | https://platform.openai.com/account/api-keys | $5-10 per 1M tokens | Fast | Excellent (GPT-4) |
| **Gemini** | https://aistudio.google.com/app/apikeys | Free tier 60 req/min | Very fast | Good (Gemini 2.0 or Pro) |

**Recommended for this workshop**: Gemini (free tier, fastest)

Then create the secret (same for all three):

```bash
gcloud secrets create llm-api-key --replication-policy="automatic" --data-file=-
```

Paste your API key, then Ctrl+D

**Verify**:
```bash
gcloud secrets list
```

Should show both `github-token` and `llm-api-key`

---

## Step 5: Create Service Account

Cloud Run needs a service account with permissions to access Firestore and Secrets:

**Step 1**: Create service account
```bash
gcloud iam service-accounts create cv-generator --display-name="CV Generator Service Account"
```

**Step 2**: Store the service account email
```bash
export SA_EMAIL=$(gcloud iam service-accounts list --filter="displayName:CV Generator Service Account" --format='value(email)')
echo $SA_EMAIL
```

**Expected output**:
```
cv-generator@cv-generator-workshop.iam.gserviceaccount.com
```

If the above doesn't work, set it manually:
```bash
export SA_EMAIL="cv-generator@$(gcloud config get-value project).iam.gserviceaccount.com"
echo $SA_EMAIL
```

---

## Step 6: Grant IAM Roles to Service Account

Give the service account permissions to access Firestore, Secrets, and Storage:

```bash
# Get your project ID
export PROJECT_ID=$(gcloud config get-value project)

# Role 1: Firestore Editor (read/write CVs)
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/datastore.user" --quiet

# Role 2: Secret Manager Accessor (read API keys)
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/secretmanager.secretAccessor" --quiet

# Role 3: Cloud Storage Object Creator (save PDFs)
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/storage.objectCreator" --quiet

# Role 4: Cloud Logging Writer (send logs)
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/logging.logWriter" --quiet
```

**Verify** (copy-paste single line):
```bash
gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:$SA_EMAIL"
```

Should list 4 roles for your service account

---

## Step 7: Create Cloud Storage Bucket for PDFs

```bash
# Create bucket (name must be globally unique)
export BUCKET_NAME="cv-generator-pdfs-${PROJECT_ID}"

gsutil mb -l us-central1 gs://$BUCKET_NAME

# Set bucket permissions (public read once signed URLs generated)
gsutil defacl ch -u AllUsers:R gs://$BUCKET_NAME
```

**Verify**:
```bash
gsutil ls
```
Should list your bucket

---

## Step 8: Initialize Firestore

Firestore is the database for storing generated CVs:

1. Go to https://console.cloud.google.com/firestore
2. Click "Create Database"
3. Select **Location**: `us-central1` (US)
4. Start in **Native mode**
5. Click "Create"

**Wait**: Firestore initializes (~2 minutes)

**Verify**: You see "Database" tab with empty collections

---

## Step 9: Configure Local Environment

For local testing before deploying to Cloud Run:

1. Create `.env` file in project root:

```bash
cat > .env << 'EOF'
GCP_PROJECT_ID=cv-generator-workshop
GITHUB_TOKEN=your-github-token-here
LLM_API_KEY=your-llm-api-key-here
LLM_PROVIDER=gemini
PORT=3000
EOF
```

2. Replace placeholders:
   - `your-github-token-here` → paste your GitHub token from Step 3
   - `your-llm-api-key-here` → paste your API key from Step 4.2
   - `LLM_PROVIDER` → use one of: `gemini`, `openai`, `claude`

3. **Never commit .env to GitHub!** (add to .gitignore)

---

## Step 10: Authenticate `gcloud` and Docker

For deploying to Cloud Run:

```bash
# Authenticate gcloud
gcloud auth login

# Authenticate Docker (for pushing to Artifact Registry)
gcloud auth configure-docker us-central1-docker.pkg.dev

# Store your project ID for later
export PROJECT_ID=$(gcloud config get-value project)
echo "Project ID: $PROJECT_ID"
```

---

## Step 11: Test Local Setup

Before deploying, test your local environment:

```bash
# 1. Install dependencies
npm install

# 2. Start local server
npm start

# 3. Test health check (in new terminal)
curl http://localhost:3000/api/health

# Expected output:
# {"status":"ok","timestamp":"2025-01-15T10:00:00Z","version":"1.0.0"}

# 4. Test GitHub integration
curl -X POST http://localhost:3000/api/github/torvalds

# 5. Test profile signals
curl -X POST http://localhost:3000/api/profile-signals \
  -H "Content-Type: application/json" \
  -d '{"gitHubUsername":"torvalds","stackOverflowUserId":"1"}'
```

**Fix issues**:
- Error: "GITHUB_TOKEN not set" → Check .env file has correct token
- Error: "permission denied" on Firestore → Check IAM roles assigned (Step 6)
- Timeout (>5 sec) → GitHub API might be slow; retry or use cached data

---

## Step 12: Build and Push Docker Image

When ready to deploy:

```bash
# Set variables
export PROJECT_ID=$(gcloud config get-value project)
export REGISTRY_REGION="us-central1"
export IMAGE_NAME="cv-generator"

# Build Docker image
docker build -t $IMAGE_NAME:latest .

# Tag for Artifact Registry
docker tag $IMAGE_NAME:latest \
  $REGISTRY_REGION-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$IMAGE_NAME:latest

# Push to Artifact Registry
docker push $REGISTRY_REGION-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$IMAGE_NAME:latest
```

---

## Step 13: Deploy to Cloud Run

**Step 1**: Set variables
```bash
export PROJECT_ID=$(gcloud config get-value project)
export SA_EMAIL="cv-generator@${PROJECT_ID}.iam.gserviceaccount.com"
```

**Step 2**: Deploy (single-line version - copy & paste as-is):
```bash
gcloud run deploy cv-generator --image us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/cv-generator:latest --region us-central1 --service-account $SA_EMAIL --memory 512Mi --cpu 1 --timeout 3600 --max-instances 100 --allow-unauthenticated --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID"
```

**Alternative** (multi-line, easier to read):
```bash
gcloud run deploy cv-generator \
  --image us-central1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/cv-generator:latest \
  --region us-central1 \
  --service-account $SA_EMAIL \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600 \
  --max-instances 100 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID"
```

**Output**: Will print your Cloud Run service URL

```
Service URL: https://cv-generator-xyz.run.app
```

**Verify**: 
```bash
curl https://cv-generator-xyz.run.app/api/health
```

---

## Step 14: Test Deployed Service

Once deployed:

```bash
export SERVICE_URL="https://cv-generator-xyz.run.app"

# 1. Health check
curl $SERVICE_URL/api/health

# 2. Generate CV
curl -X POST $SERVICE_URL/api/generate-cv \
  -H "Content-Type: application/json" \
  -d '{...signals...}'

# 3. Check Firestore
# Go to https://console.cloud.google.com/firestore
# Browse "cvs" collection
# Should see generated CV documents
```

---

## Troubleshooting

### Error: "API not enabled"
**Solution**: Run the API enable commands from Step 2

### Error: "Permission denied" on Firestore
**Solution**: 
1. Check service account has Firestore Editor role:
```bash
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:cv-generator"
```
2. If missing, re-run role assignments from Step 6

### Error: "Secret not found"
**Solution**:
1. Verify secret exists:
```bash
gcloud secrets list
```
2. If missing, create it:
```bash
gcloud secrets create github-token --data-file=- < token.txt
```

### Error: "CORS error" when calling APIs
**Solution**: This is expected for client-side calls. Use server-side proxy (Express endpoint) instead.

### Error: "Rate limit exceeded" from GitHub
**Solution**: 
1. Ensure you're using authenticated token (5000 req/hr vs 60)
2. Check Secret Manager has correct token:
```bash
gcloud secrets versions access latest --secret="github-token"
```
3. Implement caching (5-minute TTL)

### Error: Cloud Run deployment fails
**Solution**: Check Cloud Build logs:
```bash
gcloud builds log --limit 50
```
Common issues:
- Docker image build failed → check Dockerfile
- Artifact Registry auth issue → re-run `gcloud auth configure-docker`

---

## Cost Estimation

**Free tier usage** (under Google Cloud free credits):
- Cloud Run: 2 million requests/month free
- Firestore: 1 GB storage free, 50k reads/day free
- Secret Manager: Free
- Cloud Storage: 5 GB storage free
- Cloud Logging: Free

**Estimated cost for workshop**:
- GitHub API: $0 (your personal token)
- OpenAI/Claude: ~$0.003 per CV (1000 tokens)
- GCP services: **Included in free tier**

**Total workshop cost**: ~$0 (within free credits)

For 100 CVs: ~$0.30 in LLM costs

---

## Next Steps

1. ✅ Complete this setup guide
2. 📋 Bookmark: https://github.com/sajeetharan/vibecoding-workshop
3. 🚀 During workshop: Use cursor-cv-prompts.md to build endpoints
4. 📊 Monitor: Cloud Console → Cloud Run → cv-generator → Metrics
5. 🎉 Celebrate: Your first live CV Generator!

---

## Quick Reference Commands

```bash
# Check project
gcloud config get-value project

# List secrets
gcloud secrets list

# View service account
gcloud iam service-accounts list

# Check Cloud Run deployments
gcloud run services list

# View Cloud Logs
gcloud logging read "resource.type=cloud_run_revision" --limit 10 --format=json

# Tail logs in real-time
gcloud logging read "resource.type=cloud_run_revision" --follow

# Delete everything (after workshop)
gcloud run services delete cv-generator
gsutil rm -r gs://cv-generator-pdfs-*
gcloud firestore databases delete --database=default
```

---

## Appendix A: LLM Provider Code Examples

During the workshop, you'll call an LLM in Step 4 (Profile → CV Generation). Here's how to use **Gemini, OpenAI, or Claude**:

### Using Gemini (Recommended - Free & Fastest)

**Install SDK**:
```bash
npm install @google/generative-ai
```

**Code**:
```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new GoogleGenerativeAI(process.env.LLM_API_KEY);
const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generateCV(profileSignals) {
  const prompt = `Generate a professional CV from these signals:\n${JSON.stringify(profileSignals)}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

**Cost**: Free tier 60 req/min, ~$0 per 1M tokens in paid tier

---

### Using Claude (Best Reasoning)

**Install SDK**:
```bash
npm install @anthropic-ai/sdk
```

**Code**:
```javascript
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic.default({
  apiKey: process.env.LLM_API_KEY
});

async function generateCV(profileSignals) {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `Generate a professional CV from these signals:\n${JSON.stringify(profileSignals)}`
    }]
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}
```

**Cost**: ~$0.003 per CV (1000 tokens)

---

### Using OpenAI (Balanced)

**Install SDK**:
```bash
npm install openai
```

**Code**:
```javascript
const OpenAI = require("openai");

const client = new OpenAI.default({
  apiKey: process.env.LLM_API_KEY
});

async function generateCV(profileSignals) {
  const message = await client.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `Generate a professional CV from these signals:\n${JSON.stringify(profileSignals)}`
    }],
    max_tokens: 2048
  });
  return message.choices[0].message.content;
}
```

**Cost**: ~$0.005 per CV (1000 tokens on GPT-4)

---

### Reading API Key from Secret Manager (Best Practice)

In Cloud Run, use Secret Manager instead of `.env`:

```javascript
const secretManager = require("@google-cloud/secret-manager");

async function getApiKey(secretName) {
  const client = new secretManager.SecretManagerServiceClient();
  const projectId = process.env.GCP_PROJECT_ID;
  const name = client.secretVersionPath(projectId, secretName, "latest");
  const [version] = await client.accessSecretVersion({ name });
  return version.payload.data.toString();
}

// Usage
const llmApiKey = await getApiKey("llm-api-key");
```

---

### Choosing Which Provider

| Use Case | Provider | Reason |
|----------|----------|--------|
| **First time, learning** | Gemini | Free tier, fastest |
| **Production CV quality** | Claude | Best reasoning, most natural |
| **Cost sensitive** | OpenAI (GPT-3.5) | Cheapest option |
| **Balancing all factors** | OpenAI (GPT-4) | Good quality + reasonable cost |

---

**Ready? Your CV Generator awaits!** 🎬

Questions? Ask in the workshop Slack channel #vibecoding-workshop
