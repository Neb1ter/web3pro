# Repository Workflow

- Use `main` as the only working branch for code changes.
- After each completed round of changes, commit and push to `origin/main`.
- Do not use `master` for future code updates unless the user explicitly asks.

## Skills

A skill is a local instruction bundle stored in a `SKILL.md` file. For this repository, prefer the following installed skills when the task matches.

### Available skills

- `playwright`: Automate a real browser from the terminal for navigation, form filling, screenshots, snapshots, data extraction, and UI flow debugging. File: `C:/Users/26292/.codex/skills/playwright/SKILL.md`
- `playwright-interactive`: Use a persistent Playwright browser session for iterative UI debugging and visual QA. File: `C:/Users/26292/.codex/skills/playwright-interactive/SKILL.md`
- `figma-implement-design`: Turn Figma designs into production-ready code. File: `C:/Users/26292/.codex/skills/figma-implement-design/SKILL.md`
- `sora`: Generate and manage Sora videos. File: `C:/Users/26292/.codex/skills/sora/SKILL.md`
- `openai-docs`: Use official OpenAI documentation when the task is about OpenAI products or APIs. File: `C:/Users/26292/.codex/skills/.system/openai-docs/SKILL.md`
- `skill-creator`: Create or update a skill. File: `C:/Users/26292/.codex/skills/.system/skill-creator/SKILL.md`
- `skill-installer`: Install curated or repo-based skills. File: `C:/Users/26292/.codex/skills/.system/skill-installer/SKILL.md`

### Skill usage rules

- If a user explicitly names one of the skills above, use it for that turn.
- If a task clearly matches one of the skills above, prefer using that skill instead of improvising the workflow.
- Open the referenced `SKILL.md` first and only load the minimum extra files needed.
- When multiple skills could apply, use the smallest set that covers the task.
- Repository workflow rules above still take priority for code changes.
