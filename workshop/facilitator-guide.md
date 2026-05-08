# Facilitator Guide

## Teaching Style
Use a build-first, explain-second rhythm:
- 5-10 minutes concept framing.
- 20-30 minutes live building.
- 10 minutes reflection and checkpoint.

## Required Setup
- Cursor installed and signed in.
- Google Cloud account with billing enabled.
- Google Cloud SDK (`gcloud`) installed.
- Node.js 20+.

## Pre-Workshop Checklist
- Verify participants can run `node -v`, `npm -v`, and `gcloud -v`.
- Have a fallback demo project pre-deployed.
- Prepare a shared issue board for support requests.

## Facilitation Flow
1. Establish constraints:
   - Clear app scope.
   - Time box each feature.
2. Model prompt quality:
   - Start vague, then improve with constraints and acceptance criteria.
3. Keep students in the loop:
   - Ask them to inspect AI output before accepting.
4. Promote review culture:
   - Every generated change needs reasoning and quick test.

## Common Failure Modes
- Overly broad prompts produce bloated code.
- Students accept generated code without understanding.
- Deployment errors due to wrong project, API disabled, or region mismatch.

## Recovery Prompts
- "Refactor this file to the smallest maintainable version. Keep existing behavior."
- "Write a failing test for this bug first, then implement the minimal fix."
- "List top 3 risks in this implementation and suggest mitigations."

## Assessment Rubric
- Build quality: app runs, clear UX, no obvious crashes.
- Engineering quality: basic validation, readable structure.
- Deployment quality: public URL and health endpoint works.
- Reflection quality: students can explain why they accepted or rejected AI suggestions.
