# Root AGENTS.md integration

Copy the section below into the destination project's root `AGENTS.md`. Merge it
with stricter existing rules rather than creating a second documentation
authority.

```markdown
## Documentation Standard

Before creating, updating, restructuring, reviewing, publishing, archiving, or
retiring maintained documentation:

1. Read `ai/docs-guide/README.md`.
2. Read `ai/docs-guide/01-documentation-standard.md` in full and follow its
   workflow, writing rules, safety gates, stop conditions, and verification
   requirements.
3. Read `ai/docs-guide/02-document-taxonomy.md` when selecting the document
   type, location, authority, audience, or lifecycle.
4. Read `ai/docs-guide/04-governance-and-decision-framework.md` before deciding
   whether to create, update, merge, link, promote, archive, or delete
   documentation.
5. Use only the matching file from `ai/docs-guide/templates/` when a template
   applies. Do not create an unnecessary bundle of documents.

Confirm that a new document should exist before creating it. Prefer updating or
linking the authoritative document over creating duplicate knowledge.
Repository-specific rules may be stricter, but they must not weaken the
standard's safety, evidence, authority, or verification requirements.
```

After installation, verify that every referenced path exists from the project
root.
