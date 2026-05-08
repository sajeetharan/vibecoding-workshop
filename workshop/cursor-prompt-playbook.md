# Cursor Prompt Playbook for Vibe Coding

## Principles
- Be explicit about constraints (time, stack, complexity).
- Ask for acceptance criteria before code generation.
- Request minimal diffs instead of broad rewrites.
- Ask for risk review after each major change.

## Prompt Templates

## 1) Scope and Plan
"You are my pair programmer. Propose a 60-minute implementation plan for this app. Keep scope small, list files to change, and define acceptance criteria for each step."

## 2) Focused Feature Build
"Implement feature X with the smallest maintainable change. Do not modify unrelated files. Add concise comments only where logic is non-obvious."

## 3) Review and Risk
"Review this diff like a senior engineer. Find bugs, edge cases, and regressions. Prioritize by severity."

## 4) Debugging
"Given this error and current code, generate 3 likely root causes and a step-by-step fix plan. Then apply the lowest-risk fix first."

## 5) Deployment Readiness
"Before deployment, produce a checklist for security, config, and runtime stability for Cloud Run."

## Prompt Anti-Patterns
- "Build a full production app with all features" (too broad).
- "Refactor everything" (high risk).
- "Just make it better" (undefined quality target).

## Good Practice Loop
1. Ask for plan.
2. Implement one step.
3. Run app/test.
4. Review risks.
5. Commit.
