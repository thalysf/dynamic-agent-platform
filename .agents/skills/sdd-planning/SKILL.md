---
name: sdd:plan
description: Compatibility alias for spec-driven task planning in Codex. Use when the user explicitly mentions `sdd:plan`, asks to transform a draft spec into an implementation-ready plan, or wants structured decomposition before coding.
---

# SDD Plan Alias

This repository uses `sdd:plan` as a local Codex-facing alias for the upstream `plan-task` skill from `context-engineering-kit`.

Use this skill when:

- the user explicitly asks for `sdd:plan`;
- we need to refine a draft spec or task into a validated implementation plan;
- we want spec-driven decomposition before starting a larger change.

Do not use this skill for direct implementation work when the request is already small, clear, and ready to code.

## Workflow

1. Open `../plan-task/SKILL.md`.
2. Follow the upstream workflow from that skill as the source of truth.
3. Keep the resulting plan aligned with this repo's `spec.md` and `AGENTS.md`.
