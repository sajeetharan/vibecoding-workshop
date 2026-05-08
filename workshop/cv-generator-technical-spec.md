# AI Powered CV Generator - Technical Specification

## Overview

The AI Powered CV Generator is a SaaS application that accepts GitHub and Stack Overflow URLs, extracts professional signals (projects, contributions, reputation), and generates a formatted resume/CV using AI.

## System Architecture

```
┌─────────────────┐
│  Browser Client │ (React form with GitHub + Stack Overflow URL inputs)
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────┐
│  Cloud Run (Express.js API)         │ (Orchestration layer)
├─────────────────────────────────────┤
│ - POST /api/health                  │
│ - POST /api/profile-signals         │
│ - POST /api/generate-cv             │
│ - GET /api/cvs/:id                  │
└────┬──────────────────────────────┬─┘
     │                              │
     ├──────────────┬───────────────┼────────────┬──────────────┐
     │              │               │            │              │
     ▼              ▼               ▼            ▼              ▼
┌──────────┐ ┌──────────┐  ┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ GitHub   │ │Stack Over│  │ Secret       │ │Firestore │ │Cloud Storage │
│API Calls │ │flow API  │  │ Manager      │ │(NoSQL)   │ │(PDF export)  │
│(fetch    │ │(fetch    │  │(store API    │ │(cache    │ │              │
│repos)    │ │badges)   │  │keys)         │ │CVs)      │ │              │
└──────────┘ └──────────┘  └──────────────┘ └──────────┘ └──────────────┘
```

## GCP Services

### 1. **Cloud Run** (Container Orchestration)
- **Purpose**: Host Express.js API
- **Configuration**:
  - Memory: 512 MB
  - CPU: 1 vCPU
  - Timeout: 3600 seconds (1 hour for CI fetch operations)
  - Concurrency: 80 (default)
  - Public HTTPS URL for browser requests
- **Environment Variables**:
  - `GCP_PROJECT_ID`
  - `GITHUB_API_KEY` (read from Secret Manager)
  - `STACKOVERFLOW_API_KEY` (read from Secret Manager)

### 2. **Secret Manager**
- **Purpose**: Secure storage for API credentials
- **Credentials Stored**:
  - GitHub Personal Access Token (PAT) – enables 5000 API requests/hour
  - Stack Overflow API Key (if using their API)
  - OpenAI/Claude API Key (for CV composition)
- **Access Control**: Only Cloud Run service account can read
- **Setup**: 
  ```bash
  gcloud secrets create github-token --data-file=- < /dev/stdin
  gcloud secrets create openai-key --data-file=- < /dev/stdin
  ```

### 3. **Firestore** (NoSQL Database)
- **Purpose**: Store generated CVs and user profiles
- **Collections**:
  - `users` – User profiles with input URLs
    ```json
    {
      "userId": "user123",
      "gitHubUsername": "octocat",
      "stackOverflowUserId": "123456",
      "createdAt": "2025-01-15T10:00:00Z",
      "email": "user@example.com"
    }
    ```
  - `cvs` – Generated CV documents
    ```json
    {
      "cvId": "cv_abc123",
      "userId": "user123",
      "gitHubUsername": "octocat",
      "generatedAt": "2025-01-15T10:05:00Z",
      "content": "..formatted CV...",
      "format": "json|pdf|docx",
      "status": "completed|failed",
      "downloadCount": 0
    }
    ```
  - `profiles` – Cached GitHub/SO profile data (5-min TTL)
    ```json
    {
      "gitHubUsername": "octocat",
      "repositories": [...],
      "languages": {"JavaScript": 45, "Python": 30},
      "topProjects": [...],
      "cachedAt": "2025-01-15T10:00:00Z"
    }
    ```
- **Indexes**: 
  - Composite: userId + createdAt (for "My CVs" list)
  - Single: gitHubUsername (for profile lookup)

### 4. **Cloud Storage** (Object Storage)
- **Purpose**: Store exported CV files (PDF, DOCX)
- **Bucket Name**: `cv-generator-pdfs-{project-id}`
- **Access**: Private; signed URLs generated per download
- **Lifecycle**: Delete PDFs after 30 days

### 5. **Cloud Logging** (Observability)
- **Purpose**: Monitor API calls, errors, latency
- **Logs Captured**:
  - GitHub API response times
  - Stack Overflow API response times
  - CV generation latency
  - Error messages (rate limits, auth failures)
- **Queries for Troubleshooting**:
  ```
  resource.type="cloud_run_revision"
  severity="ERROR"
  ```

## API Endpoints

### POST /api/health
**Purpose**: Health check for monitoring
```json
Request: {}
Response: {
  "status": "ok",
  "timestamp": "2025-01-15T10:00:00Z",
  "version": "1.0.0"
}
```

### POST /api/profile-signals
**Purpose**: Fetch GitHub + Stack Overflow signals for a user
```json
Request: {
  "gitHubUsername": "octocat",
  "stackOverflowUserId": "123456"
}

Response: {
  "gitHubSignals": {
    "repositories": [
      {
        "name": "Hello-World",
        "stars": 56,
        "url": "...",
        "languages": ["JavaScript", "Python"],
        "description": "..."
      }
    ],
    "topLanguages": {"JavaScript": 45, "Python": 30, "Go": 15},
    "totalPublicRepos": 28,
    "followers": 150,
    "bio": "Engineer, Open Source Enthusiast",
    "company": "GitHub Inc"
  },
  "stackOverflowSignals": {
    "reputation": 12500,
    "badges": {
      "gold": 5,
      "silver": 20,
      "bronze": 50
    },
    "topTags": ["javascript", "python", "node.js"],
    "answerCount": 280,
    "questionCount": 45,
    "acceptanceRate": 92
  }
}
```

**Implementation Details**:
- GitHub API: `GET /users/{username}`, `GET /users/{username}/repos?sort=stars&per_page=100`
- Stack Overflow API: `GET /2.3/users/{id}?site=stackoverflow` + `/2.3/users/{id}/badges?site=stackoverflow`
- Rate Limiting: GitHub (5000 req/hr), Stack Overflow (300 req/day free tier)
- Caching: Store in Firestore for 5 minutes to avoid repeated API calls
- Error Handling: 
  - 404 if user not found
  - 429 if rate limit exceeded
  - 500 if external API unavailable

### POST /api/generate-cv
**Purpose**: Generate a professional CV from profile signals
```json
Request: {
  "gitHubUsername": "octocat",
  "stackOverflowUserId": "123456",
  "format": "json|pdf|docx",
  "style": "minimal|detailed|executive"
}

Response: {
  "cvId": "cv_abc123",
  "content": "...formatted CV as string or base64...",
  "downloadUrl": "https://..../cv_abc123.pdf",
  "generatedAt": "2025-01-15T10:05:00Z",
  "stats": {
    "projectsIncluded": 5,
    "skillsHighlighted": 12,
    "generationTime": 2.34
  }
}
```

**Implementation Details**:
- Call LLM (Claude/GPT-4) with structured profile signals
- System Prompt: CV composition rules, ATS optimization, tone guidelines
- Response Format: Formatted CV text or PDF binary
- Storage: Save to Firestore + Cloud Storage if PDF
- Async Processing: Use Cloud Tasks for long-running PDF generation

### GET /api/cvs/:id
**Purpose**: Retrieve a previously generated CV
```json
Response: {
  "cvId": "cv_abc123",
  "gitHubUsername": "octocat",
  "content": "...",
  "format": "json",
  "downloadUrl": "https://..../cv_abc123.pdf",
  "createdAt": "2025-01-15T10:05:00Z"
}
```

## Data Flow

### Scenario 1: Generate CV (Full Flow)
1. User enters GitHub username + Stack Overflow user ID in UI
2. UI sends POST `/api/profile-signals` request
3. Express API reads GitHub token from Secret Manager
4. API calls GitHub API (paginated) to fetch repos
5. API calls Stack Overflow API to fetch reputation + badges
6. API caches response in Firestore (5-min TTL)
7. API returns structured signals to client
8. User clicks "Generate CV"
9. UI sends POST `/api/generate-cv` request
10. Express calls Claude/GPT-4 API with signals + CV prompt
11. LLM generates formatted CV text
12. If PDF format requested: convert to PDF, upload to Cloud Storage, generate signed URL
13. Save CV document to Firestore
14. Return CV content + download URL to client
15. Cloud Logging captures latency + success status

### Scenario 2: Retrieve Previously Generated CV
1. User accesses `/cvs/{id}`
2. Express fetches CV document from Firestore
3. If format is PDF: generate signed URL to Cloud Storage object
4. Return CV to client (with download link)

## Rate Limiting & Quotas

| Service | Limit | Action |
|---------|-------|--------|
| GitHub API | 5000 req/hr (authenticated) | Cache responses; queue requests if approaching limit |
| Stack Overflow | 300 req/day (free) | Batch user queries; consider paid tier |
| OpenAI/Claude | Depends on account | Monitor usage; implement request queuing |
| Cloud Run | 80 concurrent requests | Scale with traffic; set max instances |
| Firestore | 1 write/sec per document | Distribute writes across docs; use batching |

## Security Considerations

1. **Secrets Management**:
   - Never hardcode API keys in code
   - Rotate keys every 90 days
   - Use Secret Manager to inject at runtime

2. **API Authentication**:
   - Cloud Run service account has Firestore Editor + Secret Manager Accessor roles
   - Use IAM bindings to restrict access

3. **Data Privacy**:
   - GitHub + Stack Overflow data is public (user requested)
   - Generated CVs stored in Firestore (encrypted at rest)
   - User control: delete CV → cascading delete from Firestore + Cloud Storage

4. **Rate Limiting (Future)**:
   - Implement per-user rate limiting (1 CV gen/minute)
   - Use Firestore counters or Redis for tracking

## Error Handling

| Error | HTTP Status | Recovery |
|-------|-------------|----------|
| GitHub user not found | 404 | "Enter a valid GitHub username" |
| GitHub API rate limit | 429 | "Try again in 1 hour; use authenticated token" |
| Stack Overflow user not found | 404 | "Enter a valid Stack Overflow ID" |
| CV generation timeout | 504 | "Retrying in 10 seconds..." |
| Firestore write failure | 500 | Log error; user can retry |
| LLM API unavailable | 503 | "CV service temporarily unavailable" |

## Deployment

1. Build Docker image: `docker build -t cv-generator .`
2. Push to Artifact Registry
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy cv-generator \
     --image gcr.io/{project}/cv-generator \
     --region us-central1 \
     --service-account cv-generator@{project}.iam.gserviceaccount.com \
     --set-env-vars GCP_PROJECT_ID={project} \
     --memory 512Mi \
     --cpu 1 \
     --timeout 3600 \
     --max-instances 100
   ```

## Monitoring & Observability

- **Metrics to Track**:
  - API latency (GitHub fetch, SO fetch, LLM call)
  - Error rate by endpoint
  - CV generation success rate
  - Cache hit rate
  - Cost per CV generated

- **Dashboards** (Cloud Monitoring):
  - Real-time API latency
  - Error traces
  - GCP service costs
  - User growth

## Future Enhancements

1. Add LinkedIn profile integration
2. Multi-format export (DOCX, ATS-optimized text)
3. CV templates/styles
4. LinkedIn profile sync (OAuth)
5. Analytics dashboard (who viewed my CV)
6. Premium tier (custom domain, advanced analytics)
