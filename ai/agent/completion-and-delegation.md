### Branch Completion

When all participating repository branches for a feature have been merged into `dev`:

1. Verify the merged state separately in every participating repository using repository history and available pull request metadata. Stop and report any repository whose merged state cannot be verified.
2. Update `workspaces/<feature>/workspace.md`: set the overall status to completed, record the final milestone, and record the final branch state for every participating repository.
3. Review each repository branch's `overlay.md` for stable, long-lived project knowledge that should be promoted.
4. Promote verified project knowledge into `ai/context.md`.
5. Promote verified reusable preventive lessons into `ai/learned-rules.md` when appropriate.
6. Leave temporary implementation notes, experiments, work-in-progress information, and unresolved assumptions out of both files.
7. After all eligible knowledge has been promoted or deliberately excluded, update each repository branch `README.md` with the final feature archive path, then archive each repository branch workspace under `archive/branches/<repository>/<normalized-branch>/` or the project-designated archive.
8. Archive the completed feature workspace under `archive/workspaces/<feature>/` or the project-designated archive.

### Worker Context

When delegating work, follow the [Worker Context](core-context-rules.md#worker-context) policy.
