### Research & Investigation

Use `workspaces/<feature>/research/` whenever work requires investigation before implementation.

Research is feature-scoped. Make research repository-specific only when explicitly stated, and identify that repository clearly while keeping the document in the feature workspace.

Create a separate research document for each significant topic, issue, feature, or investigation.

A research document may include:

- Problem statement or objective
- Reproduction steps
- Relevant source files and components
- Related APIs, services, or database objects
- Architecture and code-flow analysis
- Error messages, logs, and stack traces
- Network requests or links to HAR files in the feature workspace
- Links to screenshots or diagrams in the feature workspace
- External references and documentation
- Observations and verified facts
- Hypotheses and eliminated possibilities
- Root cause analysis
- Conclusions and recommended approach

#### Sensitive Artifact Handling

Research artifacts (HAR files, logs, screenshots, recordings, database exports, etc.) may contain sensitive information such as access tokens, refresh tokens, cookies, session IDs, API keys, credentials, secrets, or personal data.

- Store sanitized copies under `workspaces/<feature>/assets/` unless raw artifacts are required for investigation.
- Redact secrets and personal information before sharing artifacts or attaching them to reports, issue trackers, chat systems, or external services.
- Never commit raw artifacts containing secrets or personal data to version control.
- If raw artifacts are temporarily required for debugging:
  - Store them only under `workspaces/<feature>/assets/` or other approved secure storage.
  - Prefer sanitized copies whenever practical.
  - Do not automatically delete artifacts.
  - Archive them when they are no longer actively needed, but only to storage approved for the artifact's sensitivity and retention requirements.
  - Use the default `archive/` paths only when they are approved for the raw artifact. If no approved archive destination is defined, stop and ask the user before moving it.
  - Permanently delete them only when the user explicitly requests cleanup or when a documented retention policy requires it.

Research documents should evolve as understanding improves. Clearly distinguish verified facts from assumptions or hypotheses.

Before beginning implementation, review any existing research related to the current task to avoid repeating previous investigations.

#### Temporary Artifact Retention

Temporary artifacts may include:

- HAR files
- logs
- database exports
- packet captures
- recordings
- screenshots containing sensitive information

Rules:

- The agent workspace is outside project Git repositories and is the preferred location for temporary investigation artifacts.
- Maintain sanitized copies inside the feature workspace when they provide long-term value.
- Archive rather than delete by default.
- Permanent deletion requires either:
  - explicit user approval, or
  - a documented project retention policy.

#### Research Naming Convention

Create one research document for each significant investigation, feature, or technical topic.

Use descriptive, subject-based filenames rather than generic names.

Good examples:

```
workspaces/<feature>/research/
├── auth-session-expiry.md
├── oauth-login-investigation.md
├── custom-domain-routing.md
├── employee-search-performance.md
└── dashboard-loading-analysis.md
```

Avoid generic names such as:

```
bug.md
issue.md
test.md
research.md
notes.md
temp.md
```

The filename should clearly describe the subject being investigated so both humans and AI agents can quickly locate previous research.

If an investigation grows significantly, create a dedicated subdirectory for that topic:

```
workspaces/<feature>/research/
└── custom-domain-routing/
    ├── overview.md
    ├── dns-analysis.md
    ├── cloudflare-tests.md
    └── findings.md
```

Organize research by topic rather than chronology.

### Reports

Store implementation and verification reports under `workspaces/<feature>/reports/`.

Reports are feature-scoped and may consolidate outcomes across multiple repositories. If a report covers only one repository, identify that repository explicitly while keeping the report in the feature workspace.

Repository-specific implementation progress belongs in that repository branch's `journal.md`, not in a report inside the repository branch workspace.

### Reviews

Store design, architecture, security, and code reviews under `workspaces/<feature>/review/`.

Reviews are feature-scoped. Record repository implementation differences discovered during a review in the applicable `overlay.md`; do not duplicate the review inside the repository branch workspace.

### Assets

Store screenshots, HAR files, diagrams, logs, recordings, and other supporting artifacts under `workspaces/<feature>/assets/` because feature assets are shared across participating repositories.

Link to assets from research, plans, reviews, reports, and notes as needed. Do not store assets inside repository branch workspaces.

### Workspace Archival

Archived workspaces remain available for future reference but are no longer considered active.

Unless the project documents another archive location, move completed workspaces to these default paths:

- Feature workspace: `archive/workspaces/<feature>/`
- Repository branch workspace: `archive/branches/<repository>/<normalized-branch>/`

Use a project-designated archive instead when one is documented. In either case:

- Move rather than copy the completed workspace so only one active or archived instance exists.
- Preserve the workspace contents and relative directory structure.
- Exclude all archive locations from active workspace discovery and context loading.
- Never merge with or overwrite an existing archive destination. If the destination already exists, stop and report the conflict to the user.
- Move raw sensitive artifacts only to storage approved for their sensitivity and retention requirements. If no approved destination exists, stop and ask the user before archiving the containing feature workspace.
