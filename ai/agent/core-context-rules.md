## Core Working Principles

These principles govern every task, regardless of its size or complexity. Follow them throughout planning, implementation, review, and documentation.

- Understand before acting. Read the relevant context, code, documentation, and requirements before making decisions.
- Prefer the smallest reversible change that solves the problem while increasing confidence.
- Never blindly accept AI- or worker-generated output. Review, validate, and verify every proposed change before applying it.
- Break large or high-risk work into smaller, independently verifiable steps whenever practical.
- Base decisions on evidence, not assumptions. Use logs, error messages, network requests, database state, test results, and reproducible behavior to investigate problems before forming conclusions.
- Challenge assumptions and identify risks early. If requirements are ambiguous or incomplete, ask for clarification instead of guessing.
- Prioritize correctness, maintainability, and consistency over speed or convenience.
- Follow the project's documented standards, workflows, and architecture. When performing a specific activity, read and follow the corresponding guide (for example, planning, implementation, documentation, or review).
- Keep documentation synchronized with implementation whenever project knowledge or workflows change.
- Before completing any task, verify that the implementation satisfies the original requirements and does not introduce unintended side effects.
- After every completed task, provide a concise summary containing:
  - **What changed**
  - **Why it changed**
  - **Risks or trade-offs introduced**
  - **How to verify the change**

### Git Safety

- Before any synchronization that may modify Git history, record the current commit so the original state can always be identified.
- Stage only files related to the current task.
- Never use `git add .` or `git add -A` unless the user explicitly requests staging every change.
- Verify the staged files using `git diff --cached --name-only` before committing.
- Never execute destructive Git commands such as:
  - `git reset --hard`
  - `git clean -fd`
  - `git checkout -- <file>`
  - `git restore --source`
  - `git push --force`

- Execute destructive commands only when the user explicitly requests them.
- Never include unrelated user changes in a commit, even if they are already staged.
- Never create merge commits on protected branches unless explicitly requested by the user or required by the project's documented workflow.

## Context Discipline

Load project context according to [Context Loading](context-loading.md). For the contents and responsibilities of individual context files, see [Context Responsibilities](feature-branch-workspaces.md#context-responsibilities).

### Context Authority

Verified repository implementation—including code, configuration, tests, and runtime behavior—is the authoritative source of truth.

Project documentation precedence:

1. `overlay.md`
2. `workspace.md`
3. `ai/context.md`

`ai/learned-rules.md` is preventive guidance rather than a source of project-state facts. It supplements but never overrides verified implementation, explicit user instructions, `overlay.md`, `workspace.md`, or `ai/context.md`. If a learned rule conflicts with one of those sources, do not apply it; verify the conflict and update or remove the stale learned rule.

As defined under [Context Responsibilities](feature-branch-workspaces.md#journalmd), `journal.md` records repository execution state. Its authority is limited to:

- current execution progress
- completed work
- remaining tasks
- blockers
- resume point

If information in `journal.md` conflicts with project knowledge, verify the implementation and update the journal rather than treating it as the source of truth.

- For delegation requirements, follow [Worker Context](#worker-context).
- Keep project context synchronized with the implementation. Every factual context update must be verified against the actual codebase before being written. Provisional entries are permitted only as defined under **Context Maintenance**.
- If the synchronized changes modify the project's architecture, conventions, workflows, implementation details, or other long-lived project knowledge, update `ai/context.md` before beginning new work that depends on the affected areas.
- Verify factual context updates against the actual code and merged changes. Do not present assumptions, temporary implementation details, or unverified information as stable project facts.
- Treat stale or incorrect context as a defect. If required baseline knowledge cannot be verified, leave the affected text unchanged, report the gap, and do not begin work that depends on it until the user provides direction or the implementation can be verified. Unrelated work may continue only when it does not rely on the stale area.

## Worker Context

- When delegating work to a worker, provide only the context required for that specific task. More context is not better—only relevant context should be shared. Avoid providing unrelated architecture, implementation details, or documentation that the worker does not need.
- Provide `ai/context.md` as the stable project baseline.
- Provide `ai/learned-rules.md` when its guidance is relevant to the delegated task.
- Provide the relevant feature workspace documents for the task.
- Provide `overlay.md` only when repository-specific project knowledge is required.
- Provide `journal.md` only when repository execution state or resume information is required.
- The orchestrator is responsible for selecting, verifying, and providing the appropriate documents or their relevant contents for every worker. Workers should never be expected to search the agent workspace or discover project context on their own.
- Provide workers with task-specific context through their task specification or prompt. If workers need to read context files directly, identify the exact files rather than asking them to search the workspace.
- Before dispatching work, ensure the supplied context is sufficient for the worker to complete the task independently without unnecessary assumptions.
- If a worker identifies missing or conflicting context, treat it as a request for clarification rather than allowing the worker to guess.

## Context Maintenance

- Context updates may be proposed by workers, but every factual update must be verified against the actual implementation before being written.
- Never accept generated context updates without review. Confirm that every documented fact matches the current codebase, configuration, merged changes, or another authoritative source.
- Update only the sections affected by the completed work. Avoid unnecessary rewrites or reformatting.
- If the correctness of a fact cannot be verified, do not document it as fact.
- `overlay.md` may contain explicitly labeled provisional assumptions, constraints, and risks when they are necessary for current branch work. Keep them separate from verified facts, include the reason and validation needed, and resolve or remove them before promoting knowledge into `ai/context.md` or `ai/learned-rules.md`.
- Incorrect project context is more harmful than missing context because future work depends on it.
