# Cursor Prompts Playbook - CV Generator Workshop

Use these copy-paste prompts with Cursor Chat (<span class="kbd">Ctrl+K</span>) to scaffold your CV Generator app. Each prompt includes context for Cursor to generate production-ready code.

## Phase 1: GitHub API Integration

### Prompt 1.1: Create GitHub Service Module

**What to paste into Cursor Chat:**
```
Create a GitHub API service module at src/services/github.js that:

1. Fetches GitHub user profile data for a given username
2. Returns repositories sorted by stars (descending)
3. Extracts programming languages from each repo
4. Includes error handling for:
   - User not found (404)
   - Rate limited (429)
   - Network timeout (>5 seconds)
5. Authenticates using a GitHub token from environment variable GITHUB_TOKEN
6. Code structure:
   - Function: async getGitHubProfile(username)
   - Returns: { user: {...}, repositories: [...], languages: {...} }
7. Use axios for HTTP requests
8. Handle paginated responses (100+ repos)

This service will be called by an Express endpoint later.
```

**What you'll get**: Complete GitHub API integration with error handling

**Next step**: Test with `node -e "require('./src/services/github').getGitHubProfile('torvalds').then(console.log)"`

---

### Prompt 1.2: Create Express Endpoint for GitHub

**What to paste into Cursor Chat:**
```
Create an Express.js GET endpoint /api/github/:username that:

1. Calls the getGitHubProfile function from src/services/github.js
2. Returns JSON with top 5 repositories by star count
3. Each repo includes: name, stars, description, languages, url
4. Returns 404 if GitHub user not found
5. Returns 429 with retry-after header if rate limited
6. Returns 500 with error message if service fails
7. Test it works by: curl http://localhost:3000/api/github/torvalds

Add this endpoint to your existing Express app (server.js).
```

**What you'll get**: Production-ready Express endpoint

**Validation**: `curl http://localhost:3000/api/github/torvalds | json_pp`

---

## Phase 2: Stack Overflow Integration

### Prompt 2.1: Create Stack Overflow Service

**What to paste into Cursor Chat:**
```
Create a Stack Overflow API service module at src/services/stackoverflow.js that:

1. Fetches Stack Overflow user profile for a given user ID
2. Extracts: reputation, badge counts (gold/silver/bronze), top tags
3. Includes error handling for:
   - User not found (404)
   - Network timeout (>3 seconds)
4. Use axios for HTTP requests (no authentication needed for public data)
5. Stack Overflow API endpoint: https://api.stackexchange.com/2.3/users/{id}?site=stackoverflow
6. Also fetch badges: https://api.stackexchange.com/2.3/users/{id}/badges?site=stackoverflow&sort=rank&order=desc
7. Code structure:
   - Function: async getStackOverflowProfile(userId)
   - Returns: { reputation: number, badges: {...}, topTags: [...] }
8. Parse response and extract relevant fields

This service will be called by an Express endpoint next.
```

**What you'll get**: Complete Stack Overflow API integration

**Next step**: Test with `node -e "require('./src/services/stackoverflow').getStackOverflowProfile('1').then(console.log)"`

---

### Prompt 2.2: Create Express Endpoint for Stack Overflow

**What to paste into Cursor Chat:**
```
Create an Express.js GET endpoint /api/stackoverflow/:userId that:

1. Calls the getStackOverflowProfile function from src/services/stackoverflow.js
2. Returns JSON with: reputation, gold/silver/bronze badges, top 5 tags
3. Returns 404 if Stack Overflow user not found
4. Returns 500 with error message if service fails
5. Test it works by: curl http://localhost:3000/api/stackoverflow/1

Add this endpoint to your Express app (server.js).
```

**What you'll get**: Production-ready Stack Overflow endpoint

**Validation**: `curl http://localhost:3000/api/stackoverflow/1 | json_pp`

---

## Phase 3: Profile Signals Aggregation

### Prompt 3.1: Create Profile Signals Service

**What to paste into Cursor Chat:**
```
Create a profile signals aggregation service at src/services/profileSignals.js that:

1. Takes gitHubUsername and stackOverflowUserId as input
2. Calls both getGitHubProfile() and getStackOverflowProfile() in parallel using Promise.all()
3. Combines results into a unified "signals" object with:
   {
     "gitHubUsername": "...",
     "topProjects": [...top 5 repos by stars...],
     "topLanguages": [...extracted from repos...],
     "skills": [...from SO tags...],
     "reputation": {...from SO...},
     "expertise": "...",
     "cachedAt": timestamp
   }
4. Implements caching: Store result in memory for 5 minutes using a simple Map
5. Cache key: `${username}:${userId}`
6. Return cached result if available and not expired
7. Include error handling: If GitHub fails but SO succeeds, return partial signals

Code structure:
- Function: async getProfileSignals(gitHubUsername, stackOverflowUserId)
- Returns: combined signals object
```

**What you'll get**: Aggregation service that combines GitHub + Stack Overflow data

**Next step**: Test by calling this service with real usernames/IDs

---

### Prompt 3.2: Create Express Endpoint for Profile Signals

**What to paste into Cursor Chat:**
```
Create an Express.js POST endpoint /api/profile-signals that:

1. Takes JSON body: { "gitHubUsername": "...", "stackOverflowUserId": "..." }
2. Calls getProfileSignals() from src/services/profileSignals.js
3. Returns 200 with signals object (ready for CV generation)
4. Returns 400 if missing gitHubUsername or stackOverflowUserId
5. Returns 404 if GitHub user or SO user not found
6. Returns 500 if aggregation fails
7. Test: 
   curl -X POST http://localhost:3000/api/profile-signals \
     -H "Content-Type: application/json" \
     -d '{"gitHubUsername":"torvalds","stackOverflowUserId":"1"}'

Add this endpoint to your Express app (server.js).
```

**What you'll get**: Complete signals endpoint

**Validation**: Run the curl command above; confirm combined GitHub + SO data returned

---

## Phase 4: CV Generation with Claude/GPT-4

### Prompt 4.1: Create LLM CV Generation Service

**What to paste into Cursor Chat:**
```
Create a CV generation service at src/services/cvGenerator.js that:

1. Takes a signals object (from profileSignals) as input
2. Calls Claude API (or GPT-4) with:
   - System prompt about CV composition (professional tone, 1-page target, ATS optimization)
   - User prompt containing the signals data
3. Structured prompt template:
   System: "You are a professional CV writer. Create a compelling, ATS-optimized resume..."
   User: "Generate a CV with this data: {signals JSON}"
4. Parse LLM response into structured CV with sections:
   - Summary (2-3 lines)
   - Skills (12-15 items)
   - Top Projects (3-5 projects with links)
   - Achievements (2-3 quantified wins)
5. Return formatted CV as JSON object
6. Handle token limits: If signals too large, truncate to top 3 projects
7. Error handling:
   - Return 503 if LLM service unavailable
   - Return 500 if response parsing fails

Use: npm install anthropic (for Claude) or openai (for GPT-4)
Environment variable: OPENAI_API_KEY or ANTHROPIC_API_KEY

Code structure:
- Function: async generateCV(signals)
- Returns: { summary: "...", skills: [...], projects: [...], achievements: [...] }
```

**What you'll get**: LLM integration for CV composition

**Important**: Set API key in .env or Secret Manager before testing

---

### Prompt 4.2: Create Express Endpoint for CV Generation

**What to paste into Cursor Chat:**
```
Create an Express.js POST endpoint /api/generate-cv that:

1. Takes JSON body: signals object (from /api/profile-signals)
2. Calls generateCV(signals) from src/services/cvGenerator.js
3. Returns 200 with structured CV:
   {
     "cvId": "cv_abc123",
     "content": {...CV sections...},
     "generatedAt": timestamp,
     "status": "completed"
   }
4. Returns 400 if signals missing required fields
5. Returns 503 if LLM service unavailable (rate limited)
6. Returns 500 if generation fails
7. Test:
   curl -X POST http://localhost:3000/api/generate-cv \
     -H "Content-Type: application/json" \
     -d '{...signals JSON from previous endpoint...}'

Add this endpoint to your Express app (server.js).
```

**What you'll get**: Complete CV generation endpoint

**Expected output**: Professional CV in JSON format (ready to convert to PDF)

---

## Phase 5: Firestore Persistence (Optional - Advanced)

### Prompt 5.1: Create Firestore Integration

**What to paste into Cursor Chat:**
```
Create Firestore integration at src/services/firestore.js that:

1. Connects to Firestore (automatically uses projectId from Google Cloud environment)
2. Save generated CV to Firestore collection "cvs":
   - Function: async saveCV(cvData)
   - cvData includes: gitHubUsername, stackOverflowUserId, content, generatedAt
   - Auto-generate cvId using: `cv_${Date.now()}_${randomString}`
   - Returns: { cvId, createdAt }

3. Retrieve CV from Firestore:
   - Function: async getCV(cvId)
   - Returns: Full CV document or null if not found

4. Error handling:
   - Handle "permission denied" gracefully (tell user to check IAM roles)
   - Handle "not found" (return null instead of error)

Use: npm install @google-cloud/firestore

Code structure:
- Uses Firestore default credentials (workload identity)
- Collection: "cvs"
- Document ID: cvId
```

**What you'll get**: Firestore read/write functions

**Before testing**: 
- Grant Cloud Run service account role: `roles/datastore.user`
- Create "cvs" collection in Firestore console (or let Firestore auto-create)

---

### Prompt 5.2: Update CV Generation Endpoint to Save to Firestore

**What to paste into Cursor Chat:**
```
Update the /api/generate-cv endpoint to:

1. Generate CV (as before)
2. After CV generation, call saveCV() from Firestore service
3. Return cvId in response:
   {
     "cvId": "cv_abc123",
     "content": {...},
     "downloadUrl": "/api/cvs/cv_abc123"
   }
4. If Firestore save fails, still return the CV (don't fail the entire request)
5. Log Firestore failures to Cloud Logging

This allows users to retrieve their CV later.
```

**What you'll get**: Persistent CV storage

**Test**: Generate CV → Check Firestore console → See CV document created

---

## Phase 6: Secret Manager (Optional - Advanced)

### Prompt 6.1: Create Secret Manager Integration

**What to paste into Cursor Chat:**
```
Create Secret Manager integration at src/config/secrets.js that:

1. Reads API keys from GCP Secret Manager (not .env in production)
2. Function: async getSecret(secretName)
   - secretName examples: "github-token", "openai-api-key"
   - Returns: secret value
   - Caches result for 10 minutes in memory
   - Handles "secret not found" error gracefully

3. In-memory cache logic:
   - Key: secretName
   - Value: { value: "...", expiresAt: timestamp }
   - Return cached if not expired
   - Fetch fresh if expired or not cached

4. Error handling:
   - Log secret name (not value) on errors
   - Return null if secret not found (let calling code handle)
   - Retry once if temporary failure

Use: npm install @google-cloud/secret-manager

Initialization:
- const secretManager = new SecretManagerServiceClient();
- Used automatically with workload identity
```

**What you'll get**: Secure secret retrieval

**Before testing**: 
- Create secrets: `gcloud secrets create github-token --data-file=-`
- Paste your GitHub token
- Press Ctrl+D to save

---

### Prompt 6.2: Update GitHub Service to Use Secret Manager

**What to paste into Cursor Chat:**
```
Refactor src/services/github.js to:

1. Import getSecret() from src/config/secrets.js
2. In getGitHubProfile function, replace:
   OLD: const token = process.env.GITHUB_TOKEN;
   NEW: const token = await getSecret("github-token");
3. Handle case where secret is null (show helpful error)
4. Never log token value

Do the same for src/services/cvGenerator.js:
- Replace process.env.OPENAI_API_KEY with await getSecret("openai-api-key")

Test: Your API calls should work with Secret Manager tokens
```

**What you'll get**: Production-grade secret management

**Verification**: 
- Remove secrets from .env file
- App still works (reading from Secret Manager)
- No secrets in logs or error messages

---

## End-to-End Test Flow

Once all phases complete, test the full pipeline:

**Step 1**: Call profile signals (single-line version - copy & paste as-is):
```bash
curl -X POST http://localhost:3000/api/profile-signals -H "Content-Type: application/json" -d '{"gitHubUsername":"torvalds","stackOverflowUserId":"1"}'
```

**Alternative** (multi-line, easier to read):
```bash
curl -X POST http://localhost:3000/api/profile-signals \
  -H "Content-Type: application/json" \
  -d '{"gitHubUsername":"torvalds","stackOverflowUserId":"1"}'
```

**Expected**: Combined GitHub + Stack Overflow data

**Step 2**: Generate CV from signals (single-line version - copy & paste as-is):
```bash
curl -X POST http://localhost:3000/api/generate-cv -H "Content-Type: application/json" -d '{"gitHubUsername":"torvalds","stackOverflowUserId":"1"}'
```

**Alternative** (multi-line):
```bash
curl -X POST http://localhost:3000/api/generate-cv \
  -H "Content-Type: application/json" \
  -d '{...copy signals from Step 1...}'
```

**Expected**: Formatted CV with Summary, Skills, Projects

**Step 3**: Retrieve CV (if Firestore enabled)
```bash
curl http://localhost:3000/api/cvs/cv_abc123
```

**Expected**: Same CV as Step 2 (retrieved from Firestore)

---

## Troubleshooting Prompts

**When stuck, paste these into Cursor:**

### "My GitHub API returns 401"
```
Why is my GitHub API call returning 401 Unauthorized?
Here's my code: [paste your code]
GitHub token is: [paste first 5 chars]
What should I check?
```

### "Stack Overflow returns empty tags"
```
Stack Overflow response has empty tags array.
Expected: top programming languages/topics user is known for
How do I extract the top tags correctly?
Stack Overflow response: [paste JSON]
```

### "CV generation times out"
```
My /api/generate-cv endpoint times out after 10 seconds.
The signals object is quite large (200KB).
How do I optimize this?
Should I truncate the data?
```

### "Firestore writes fail with permission denied"
```
Firestore save throws: "permission denied on resource 'projects/xyz/databases/(default)/documents/cvs/doc1'"
How do I grant the right IAM roles?
I'm using Cloud Run service account.
```

---

## Tips for Workshop Success

1. **Copy-paste exactly**: Cursor prompts work best when copied precisely
2. **Test each phase**: Don't move to phase 2 until phase 1 works
3. **Use `npm test`**: Run tests after each phase (create simple tests)
4. **Ask Cursor follow-ups**: "Why did you use X?", "How do I test this?"
5. **Watch the Cloud Logging**: See real API latency and errors
6. **Share working prompts**: If you improve a prompt, share with teammates!

---

## Recommended Cursor Settings for CV Generator

In Cursor Settings (Ctrl+,):

1. **Model**: Claude 3.5 Sonnet (best for code generation)
2. **Temperature**: 0 (consistent, deterministic code)
3. **Max tokens**: 2000 (gives detailed responses)
4. **Enable Cursor Rules**: Check `Enable codebase context` (uses .cursorrules)

---

## .cursorrules File for Workshop

Create `.cursorrules` in project root:

```
You are helping with an AI CV Generator workshop using Node.js, Express, and GCP.

## Context
- Project: GitHub profiles + Stack Overflow profiles → Professional CVs (AI-generated)
- Backend: Express.js running on GCP Cloud Run
- APIs: GitHub REST API, Stack Overflow API, Claude/OpenAI for CV generation
- Database: Firestore (NoSQL) for storing generated CVs
- Secrets: GCP Secret Manager for API keys

## Code Style
- ES2020 async/await (not callbacks)
- Error handling: try/catch with descriptive messages
- No hardcoded secrets (always use env vars or Secret Manager)
- Logging: Use console.log/error (Cloud Logging will capture)

## API Design
- POST endpoints for mutations (CV generation, data fetching)
- GET endpoints for retrieval
- Always return JSON with {success, data, error} format
- Status codes: 200 OK, 400 Bad Input, 404 Not Found, 429 Rate Limited, 500 Server Error, 503 Service Unavailable

## GCP Best Practices
- Use workload identity (not service account keys)
- Cache API responses (5-10 minute TTL) to avoid rate limiting
- Log errors to Cloud Logging for debugging
- Validate inputs before calling external APIs

## For Workshop Participants
- Code should be educational and well-commented
- Show security patterns (env vars, not hardcoded secrets)
- Explain why certain libraries/patterns chosen
```

---

## Success Checklist

After workshop, you should have:
- [ ] GitHub profile fetching working
- [ ] Stack Overflow profile fetching working
- [ ] Combined signals endpoint returning merged data
- [ ] CV generation from signals (working draft)
- [ ] Express app deployed to Cloud Run with public URL
- [ ] At least one generated CV stored in Firestore
- [ ] Secret Manager storing API keys (not in .env)
- [ ] No secrets logged or exposed in errors
- [ ] All endpoints returning proper HTTP status codes
- [ ] Cloud Logging showing successful API calls

**Final goal**: Get your Cloud Run URL working → generate a CV for a real GitHub user → celebrate! 🎉
