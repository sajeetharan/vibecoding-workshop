# CV Generator - Business Rules & Skills

## Business Rules

### Data Extraction

**GitHub Profile Extraction Rules**:
- Only public repositories (no private repos)
- Sort by stars (descending) for top projects
- Extract primary languages per repo
- Skip forks unless starred 50+
- Include repos updated in last 12 months
- Rate limit: 5000 requests/hour (authenticated), 60/hour (unauthenticated)
- Cache GitHub profiles for 5 minutes to reduce API calls
- Timeout for GitHub API: 5 seconds (fail gracefully if slow)

**Stack Overflow Profile Rules**:
- Fetch reputation score (proxy for expertise level)
- Extract top 5 tags (areas of expertise)
- Count answer + question ratio (engagement metric)
- Highlight gold/silver/bronze badges
- Acceptance rate on answers (quality indicator)
- Rate limit: 300 requests/day (free tier)
- Cache Stack Overflow profiles for 5 minutes
- Timeout for SO API: 3 seconds

### CV Composition Rules

**Professional Standards**:
- Resume length: 1-2 pages (ATS compliant)
- Format: JSON first, then render to PDF/DOCX
- Sections required: Summary, Skills, Projects, Achievements
- Project description max 2 lines per project
- Skills limit: 12-15 skills (avoid keyword stuffing)
- Tone: Professional, concise, achievement-focused
- Avoid: Grammatical errors, vague claims, outdated technologies

**CV Ranking Logic** (Priority Order):
1. **Top Projects** (highest star count, recent activity)
   - Include: Project name, GitHub link, star count, languages, description
   - Rank by: stars + recency (weighted 70% stars, 30% recency)

2. **Technical Skills** (languages, frameworks from repos + SO expertise)
   - Extract from: README files, package.json, languages by repo frequency
   - Stack Overflow tags provide expertise validation
   - Rank by: frequency (how many projects use this skill) + reputation weight

3. **Achievements** (badges from SO, high-star repos, contribution streaks)
   - Gold badge count: Expert indicator
   - High-reputation (2000+): Trusted community member
   - Most-starred repo: Flagship project

4. **Experience Summary** (generated from profile data)
   - "X years of experience" (estimate from GitHub join date + activity)
   - "Y projects with Z total stars" (quantify impact)
   - "Expert in [top 3 languages]" (from frequency analysis)

### Validation Rules

**Input Validation**:
- GitHub username: 1-39 characters, alphanumeric + hyphens
- Stack Overflow user ID: Must be positive integer
- Reject if GitHub user has 0 repos
- Reject if SO reputation is 1 (new/inactive user)

**Output Validation**:
- Ensure at least 3 projects are included
- Ensure at least 5 skills are extracted
- Check for null/undefined values in CV sections
- Validate generated PDF renders correctly
- Ensure no sensitive info (email, phone if not provided) is exposed

**Error Scenarios**:
- GitHub user not found (404) → User error message
- Rate limit (429) → Suggest using app token
- Stack Overflow user not found → Suggest checking user ID
- Timeout (>10s) → Async processing with email notification
- LLM generation fails → Fallback to template-based CV

## Skills & Implementation Guide for Workshop

### Skill 1: GitHub API Integration

**Learning Outcome**: Fetch GitHub user data and parse repositories

**Cursor Prompt**:
```
Create an Express.js endpoint GET /api/github/:username that:
1. Takes a GitHub username as parameter
2. Calls GitHub API to fetch user info and repositories
3. Extracts: repositories list, primary languages, star count
4. Returns JSON with top 5 repos sorted by stars
5. Stores GitHub token in process.env.GITHUB_TOKEN for auth
6. Handles errors: user not found (404), rate limit (429)
Include pagination if user has 100+ repos.
```

**Implementation Steps**:
1. Create `src/services/github.js`
2. Use `axios` or `node-fetch` for HTTP requests
3. Authenticate with `Authorization: token ${process.env.GITHUB_TOKEN}`
4. Parse repo data: name, description, stars, languages, homepage URL
5. Test with well-known GitHub user (e.g., "torvalds")

**Verification Checklist**:
- [ ] GET /api/github/torvalds returns 200 OK
- [ ] Response includes at least 5 repositories
- [ ] Each repo has stars, languages, description
- [ ] Top repo by stars is included
- [ ] Handles GitHub user not found gracefully

**Rate Limit Handling**:
- GitHub free tier: 60 req/hr unauthenticated, 5000 authenticated
- Store GitHub token in Secret Manager (not .env file in production)
- Implement local cache (5-minute TTL) to avoid duplicate API calls

### Skill 2: Stack Overflow API Integration

**Learning Outcome**: Fetch Stack Overflow user reputation and badges

**Cursor Prompt**:
```
Create an Express.js endpoint GET /api/stackoverflow/:userId that:
1. Takes a Stack Overflow user ID as parameter
2. Calls Stack Overflow API (site=stackoverflow)
3. Extracts: reputation, badges (gold/silver/bronze), top tags
4. Returns JSON with user expertise profile
5. Handles errors: user not found (404), rate limit (429)
6. Timeout after 3 seconds
Stack Overflow API endpoint: https://api.stackexchange.com/2.3/users/{id}?site=stackoverflow
Include badge endpoint: https://api.stackexchange.com/2.3/users/{id}/badges?site=stackoverflow
```

**Implementation Steps**:
1. Create `src/services/stackoverflow.js`
2. Use `https` module or fetch (no auth token needed for public data)
3. Parse user data: reputation, badge_counts, top_tags
4. Sort badges by count (gold > silver > bronze)
5. Test with well-known SO user (e.g., ID 1 for Jeff Atwood)

**Verification Checklist**:
- [ ] GET /api/stackoverflow/1 returns 200 OK
- [ ] Response includes reputation score
- [ ] Response includes badge counts
- [ ] Response includes top 5 tags
- [ ] Handles SO user not found gracefully

**Rate Limit Handling**:
- Stack Overflow: 300 requests/day (free tier)
- No backoff strategy needed for workshop (under 300 calls)
- Show warning if approaching quota

### Skill 3: API Response Integration & Signals Aggregation

**Learning Outcome**: Combine GitHub + Stack Overflow data into unified "signals" object

**Cursor Prompt**:
```
Create an Express.js endpoint POST /api/profile-signals that:
1. Takes JSON body with gitHubUsername and stackOverflowUserId
2. Calls both /api/github/:username and /api/stackoverflow/:userId
3. Merges responses into unified profile signals object with:
   - topProjects (from GitHub, sorted by stars)
   - topLanguages (from GitHub)
   - skills (extracted from SO tags)
   - expertise (from SO reputation level)
4. Returns JSON ready for CV generation
5. Caches result in memory for 5 minutes (key: username+userId)
6. Handles timeout if either API takes >5 seconds
```

**Implementation Steps**:
1. Create `src/services/profileSignals.js`
2. Implement Promise.all() for parallel API calls
3. Map GitHub languages → CV skills section
4. Map SO tags → expertise keywords
5. Create aggregation function: `(github, stackoverflow) => signals`
6. Add simple in-memory cache with TTL

**Verification Checklist**:
- [ ] POST /api/profile-signals with valid inputs returns 200
- [ ] Response includes combined topProjects + skills
- [ ] Response structure matches CV generation needs
- [ ] Caching works (second call faster than first)
- [ ] Error handling for missing GitHub or SO user

### Skill 4: CV Generation with LLM

**Learning Outcome**: Use Claude/GPT-4 to compose professional CV from signals

**Cursor Prompt**:
```
Create an Express.js endpoint POST /api/generate-cv that:
1. Takes JSON body with profileSignals (from previous endpoint)
2. Calls Claude/GPT-4 API with structured prompt to generate CV
3. System prompt includes: Professional tone, ATS optimization, 1-page target
4. Prompt structure:
   - "Generate a professional CV with these sections: Summary, Skills, Projects, Achievements"
   - Include exact project data and metrics from signals
   - Keep project descriptions to 2 lines max
   - Limit skills to 12-15 items
5. Returns formatted CV text (JSON format with sections)
6. Handle token limit (if signals too large, summarize)
7. Timeout after 10 seconds
```

**Implementation Steps**:
1. Create `src/services/cvGenerator.js`
2. Use OpenAI SDK or Anthropic SDK
3. Build system prompt with guidelines
4. Build user prompt with profile signals data
5. Call LLM and parse structured response
6. Validate response format (ensure all sections present)
7. Test with actual GitHub + SO user

**Verification Checklist**:
- [ ] POST /api/generate-cv returns 200 with CV content
- [ ] CV includes Summary, Skills, Projects sections
- [ ] Projects mention GitHub links and metrics
- [ ] Skills are relevant to extracted languages/tags
- [ ] CV is professional tone (no placeholder text)
- [ ] Generation time < 10 seconds

**Cost Consideration**:
- Claude 3.5 Sonnet: ~$0.003 per CV (1000 tokens)
- GPT-4: ~$0.01 per CV (1500 tokens)
- Set reasonable quota (e.g., 100 CVs/month for free tier)

### Skill 5: Firestore Persistence

**Learning Outcome**: Store generated CVs for later retrieval

**Cursor Prompt**:
```
Add Firestore integration to save generated CVs:
1. Create Firestore collection: "cvs"
2. Document schema:
   {
     cvId: "cv_abc123",
     gitHubUsername: "octocat",
     stackOverflowUserId: "123456",
     content: "...full CV text...",
     format: "json",
     generatedAt: Timestamp.now(),
     status: "completed"
   }
3. After CV generation completes, write to Firestore
4. Return cvId in response for later retrieval
5. Handle Firestore write errors gracefully
6. Add GET /api/cvs/:id endpoint to retrieve stored CVs
```

**Implementation Steps**:
1. Install: `npm install @google-cloud/firestore`
2. Initialize Firestore: `new Firestore({ projectId })`
3. Create CV document in `cvs` collection after generation
4. Use cvId as document ID (easier lookup)
5. Add error handling for write failures
6. Create retrieval endpoint

**Verification Checklist**:
- [ ] Generated CV appears in Firestore console
- [ ] CV document has all required fields
- [ ] GET /api/cvs/:id retrieves stored CV
- [ ] Handles Firestore permission errors gracefully

**IAM Setup**:
- Cloud Run service account needs role: Firestore Editor
- Grant with: `gcloud projects add-iam-policy-binding PROJECT --member=serviceAccount:cv-gen@PROJECT.iam.gserviceaccount.com --role=roles/datastore.user`

### Skill 6: Secret Manager Integration

**Learning Outcome**: Read API keys securely from Secret Manager

**Cursor Prompt**:
```
Refactor to read API keys from GCP Secret Manager:
1. Create secrets in Secret Manager:
   - github-token
   - openai-api-key
   - stackoverflow-api-key (if needed)
2. In src/config.js, create function getSecret(secretName)
3. Use @google-cloud/secret-manager SDK
4. Call getSecret('github-token') instead of process.env.GITHUB_TOKEN
5. Cache secret value in memory (10-minute TTL)
6. Handle secret not found error gracefully
7. Never log secret values
```

**Implementation Steps**:
1. Install: `npm install @google-cloud/secret-manager`
2. Create `src/config/secretManager.js`
3. Function: `async getSecret(secretName) => value`
4. Add caching layer (in-memory, 10-min TTL)
5. Update GitHub + OpenAI service files to use getSecret()
6. Test with actual Secret Manager

**Verification Checklist**:
- [ ] API calls use Secret Manager (not .env)
- [ ] Secrets are never logged or exposed in error messages
- [ ] Caching works (second call returns from cache)
- [ ] Handles missing secret gracefully

**Production Security**:
- Rotate secrets every 90 days
- Never commit secrets to GitHub
- Use workload identity (Cloud Run → Secret Manager)
- Monitor secret access in Cloud Audit Logs

## Skills Progression Path

**Lab Part 1 (20 min)**: Skills 1, 2, 3
- Build GitHub integration
- Build Stack Overflow integration
- Combine into profile signals

**Lab Part 2 (10 min)**: Skills 4, 5, 6
- Choose 2 of 3: CV generation, Firestore persistence, Secret Manager
- Most teams will do CV generation + Firestore
- Advanced teams add Secret Manager

**Graduation (Optional)**: All skills + error handling + testing

## Common Gotchas & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| GitHub API 401 | Invalid token | Check Secret Manager has token; verify token scope includes public_repo |
| Stack Overflow 404 | Wrong user ID format | SO user ID is integer; GitHub username is string |
| Firestore permission denied | Service account missing role | Grant Firestore Editor role to Cloud Run SA |
| LLM timeout | Signals object too large | Limit to top 5 projects + top 10 skills |
| CORS errors | Browser can't call GitHub API directly | Use server-side proxy; call backend endpoint instead |
| Rate limit 429 | Too many API calls | Implement caching (5-min TTL); use app token for GitHub |

## Recommended Model Configuration

For CV Generator workshop, recommend:
- **GitHub API**: Always use authenticated token (5000 req/hr vs 60)
- **Stack Overflow API**: Acceptable with free tier (300/day)
- **LLM**: Claude Sonnet 3.5 (best for structured CV composition)
  - Reasoning models produce higher-quality CVs
  - Faster than GPT-4 Turbo
  - Cost: ~$0.003 per CV

## Testing Strategy

**Unit Tests**:
- GitHub profile fetching (mock API response)
- Stack Overflow parsing (validate JSON extraction)
- Signal aggregation (correct merge logic)

**Integration Tests**:
- End-to-end: GitHub username → CV generation
- Verify Firestore write after CV generation
- Test Secret Manager fallback if secret unavailable

**Workshop-Level Test**:
- Use GitHub user: "torvalds" (high-star repos, recognizable)
- Use Stack Overflow user: "1" (Jeff Atwood)
- Generate CV → verify 3+ projects, 5+ skills, professional tone
