# Sources

**Access date for all web sources:** 2026-07-24

Only official primary sources and recognized standards/frameworks were used for
material external claims. Local files are evidence of current workspace
practice, not public-source evidence or proof of organization-wide adoption.

## External primary sources

| ID | Source | Publisher | Relevance |
| --- | --- | --- | --- |
| <a id="s1"></a>S1 | [About this guide](https://developers.google.com/style) | Google for Developers | Project-specific style precedence; clarity and consistency. |
| <a id="s2"></a>S2 | [Microsoft Learn style and voice quick start](https://learn.microsoft.com/en-us/contribute/content/style-quick-start) | Microsoft | Audience intent, direct language, consistency, localization-aware writing. |
| <a id="s3"></a>S3 | [Content design principles](https://docs.github.com/en/contributing/writing-for-github-docs/content-design-principles) | GitHub | User-centered, high-value, “just enough” documentation. |
| <a id="s4"></a>S4 | [About the content model](https://docs.github.com/en/enterprise-cloud@latest/contributing/style-guide-and-content-model/about-the-content-model) | GitHub | Explicit content types, hierarchy, reuse, and maintainability. |
| <a id="s5"></a>S5 | [How-to content type](https://docs.github.com/en/contributing/style-guide-and-content-model/how-to-content-type) | GitHub | Task-focused procedures and boundaries with concepts/reference/troubleshooting. |
| <a id="s6"></a>S6 | [Diátaxis](https://diataxis.fr/) | Diátaxis project, Daniele Procida | Tutorials, how-to guides, reference, and explanation as distinct user-need modes. |
| <a id="s7"></a>S7 | [Documentation Content Guide](https://kubernetes.io/docs/contribute/style/content-guide/) | Kubernetes | Link to canonical sources; dual sourcing increases maintenance and staleness. |
| <a id="s8"></a>S8 | [About contributing to GitHub Docs](https://docs.github.com/en/contributing/collaborating-on-github-docs/about-contributing-to-github-docs) | GitHub | Repository collaboration, self-review, technical review, previews, and checks. |
| <a id="s9"></a>S9 | [Using the content linter](https://docs.github.com/en/contributing/collaborating-on-github-docs/using-the-content-linter) | GitHub | Automated Markdown/style validation, actionable rules, warnings/errors, expiry checks, and bounded autofix. |
| <a id="s10"></a>S10 | [About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) | GitHub | Path-based ownership and optional required owner approval. |
| <a id="s11"></a>S11 | [Kubernetes API reference: Core](https://kubernetes.io/docs/reference/kubernetes-api/core/) | Kubernetes | An official API reference page explicitly labeled automatically generated. |
| <a id="s12"></a>S12 | [Architectural decision record process](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html) | AWS Prescriptive Guidance | ADR scope, template, owner, states, review, immutability, and supersession. |
| <a id="s13"></a>S13 | [Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/) | Google SRE | Triggered, blameless, reviewed postmortems with action items and sharing. |
| <a id="s14"></a>S14 | [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) | W3C | Accessible structure, headings, labels, links, text alternatives, and presentation. |
| <a id="s15"></a>S15 | [RFC 2119: Key words for use in RFCs to Indicate Requirement Levels](https://www.rfc-editor.org/info/rfc2119/) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) | IETF / RFC Editor | Precise and sparing use of normative requirement keywords. |
| <a id="s16"></a>S16 | [Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile, NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) | U.S. National Institute of Standards and Technology | Confabulation, information integrity, provenance, privacy, and human oversight risks. |
| <a id="s17"></a>S17 | [Documentation Style Guide](https://kubernetes.io/docs/contribute/style/style-guide/) | Kubernetes | Active voice, direct language, semantic headings, descriptive links, and Markdown conventions. |
| <a id="s18"></a>S18 | [Developer content](https://learn.microsoft.com/en-us/style-guide/developer-content/) | Microsoft | Reference and examples as foundational developer-content forms. |

## Local evidence

| ID | Source | Status |
| --- | --- | --- |
| L1 | `AGENTS.md` and `ai/agent/*.md` | Active workspace instructions; authoritative for this task. |
| L2 | `platform/docs/templates/*.md` | Verified repository templates; adoption scope is not established. |
| L3 | `platform/docs/architecture/decisions/template.md` | Verified local ADR template. |
| L4 | `platform/docs/changelog/template.md` | Verified local change-report template. |
| L5 | `platform/docs/api/contracts/README.md`, `platform/docs/api/flows/README.md`, and `platform/docs/diagrams/sequence/README.md` | Verified index claims; generation completeness is mixed and not independently established. |
| L6 | `platform/.github/CODEOWNERS` | Verified; does not assign documentation owners. |
| L7 | `arvasit-ui/apps/arvasit-ui-docs/docusaurus.config.ts` | Verified docs-site configuration; includes broken-link enforcement and placeholder settings. |
| L8 | [`evidence/local-documentation-audit.md`](evidence/local-documentation-audit.md) | Portable snapshot of the consolidated design-time local audit and limitations. |

## Source-selection limitations

- Public sources show practices that work in their publishers’ contexts; they do
  not prove those practices fit this organization unchanged.
- No confidential handbooks, analytics, support-search data, legal retention
  policy, or real ownership directory was available.
- Diátaxis is a framework source rather than evidence that a named enterprise
  adopted it. This standard uses it as a conceptual input, not an authority
  claim about another organization.
- NIST identifies AI risks; the workflow controls in this standard are a
  documented synthesis and organization-specific design.
