# System Additions Pass

Identify what the reviewed change adds to the system and investigate whether each addition earns its ongoing maintenance cost. Look for unnecessary additions and additions whose narrow benefit could be provided by a substantially simpler design. Inspect additions inside existing files as well as newly added files. For implementation plans, assess proposed additions and distinguish stated requirements from unresolved design choices. An inventory alone does not complete this pass.

## Addition categories

| Category | Checks |
|---|---|
| Files and modules | Identify new responsibilities and whether a separate file or module is justified. Compare with existing implementations for duplicated logic or unnecessary configuration and abstraction. Distinguish genuine additions from moves, renames, and generated files. |
| DB schema | Identify new attributes, properties, classes, tables, indexes, and other persistent structures. Check whether the existing model can express the requirement and whether derived or temporary state needs persistence. Include schema additions in existing files. |
| Long-running code | Identify background tasks, polling, timers, subscriptions, listeners, workers, and persistent loops. Check why continuous execution is needed, who starts and owns it, when it stops, and whether repeated initialization or missing cleanup can leave duplicate work active. |
| Dependencies | Identify new npm/Maven packages and external services. Compare with existing capabilities and inspect the additional build, packaging, and runtime requirements. |
| Configuration and flags | Identify new settings, environment variables, and feature flags. Check whether the choice needs to be exposed and which additional behavior combinations must be maintained and tested. |
| Global state and caches | Identify new atoms, registries, caches, and singletons. Trace ownership, invalidation, and cleanup, including graph switches and window boundaries. |
| Exposed contracts | Identify new APIs, CLI commands, IPC messages, events, and extension points. Check why each interface must be exposed and which consumers require it. |
| Persisted artifacts | Identify new disk files, localStorage or IndexedDB entries, temporary directories, and log storage. Check ownership, retention, cleanup, and capacity limits beyond the DB schema itself. |
| Execution boundaries | Identify new processes, threads, workers, and network services. Check why the boundary is necessary and what communication, deployment, and failure-handling responsibilities it introduces. |
| Abstractions and implementation branches | Identify new adapters, framework-like wrappers, platform branches, and parallel implementations. Check for a concrete requirement and whether an existing clear path can satisfy it without compatibility layers or speculative generalization. |

## Necessity and simplification assessment

For each addition or cohesive group:

1. Establish the concrete requirement and actual consumers. Trace production callers, indirect registration, persisted readers/writers, and supported external contracts. Distinguish these from tests, fixtures, generated references, and hypothetical future use; reference counts alone do not prove necessity or disuse.
2. Describe the benefit and the ongoing obligations it introduces: state synchronization, cleanup and retention, failure recovery, platform branches, deployment or dependency updates, configuration combinations, and tests or documentation that must remain in sync. Consider the whole dependent surface, not only lines added.
3. Investigate a smaller way to meet the same requirement. Consider deleting an unused surface, deriving duplicated state, merging an artifact or interface into its existing owner, keeping a one-off operation local, or replacing custom machinery with an existing capability. Identify what code, state, files, flags, tests, or maintenance obligations actually disappear; moving complexity elsewhere is not a simplification.
4. Compare the candidate with the strongest reason to retain the addition. A small feature can justify substantial machinery when it protects data integrity, security, recovery, or a supported platform. Conversely, working code is not sufficient justification for maintaining an unused table, duplicated field, speculative extension point, or separate subsystem for a minor convenience.
5. Conclude **Retain**, **Simplify**, or **Question**, with evidence. For Simplify, name the smallest cleanup, the behavior and contracts preserved, and the check that can demonstrate preservation. For Question, name the missing evidence or product decision instead of assuming the addition is necessary.

Separate behavior-preserving cleanup from proposals to drop a feature or guarantee. If the only meaningful reduction gives up supported behavior, report the benefit/cost tradeoff as a product or architecture question; do not present it as safe cleanup or implement it during review.

## Review boundaries and evidence

- Inventory every applicable category; an addition is not inherently a problem. Do not demand removal merely because something is new or because a rationale is undocumented.
- Base necessity concerns on consumer evidence, concrete duplication, an existing simpler capability, or identifiable maintenance obligations disproportionate to the demonstrated benefit. Explain the comparison; vague claims of overengineering or a preference for fewer files are insufficient. A supported structural cleanup need not wait for a runtime failure or a measured performance regression to become a finding.
- Focus on the need for new persistent structures and exposed interfaces. Data contract and Migration validation own detailed contract correctness, migration requirements, and schema-version checks.
- Focus on the need for ongoing work, state ownership, and lifecycle boundaries. Note related failure or performance concerns for the corresponding passes; the main agent deduplicates shared findings.
- Follow the main workflow's validation requirements. Runtime claims such as duplicate workers, leaked subscriptions, or state surviving a graph switch require an applicable Logseq interaction. Structural concerns can use static evidence when no executable behavior path applies; explain why.

## Output

Return results using [`subagent-output.md`](./subagent-output.md), plus a separate additions inventory with necessity assessments even when there are no findings. Report evidence-backed unnecessary complexity as System Additions candidate findings using the normal severity guidance; do not bury actionable cleanup solely in the inventory. Deduplicate cleanup that also fixes a bug with the corresponding pass.

For each addition, record:

- category and location, including the symbol or artifact where useful
- what was added and its purpose, supported by code, tests, or a documented requirement; label inferences and unknowns
- the owning module and lifecycle or ongoing maintenance responsibility, as applicable
- actual consumers, demonstrated benefit, and the main ongoing maintenance obligations
- Retain / Simplify / Question, with the reason; for a simplification, name the surface removed or reduced and the preservation check
- related finding or unresolved question, if any

Group related additions to keep the inventory compact. An item spanning categories, such as a worker that adds an execution boundary and ongoing work, may occupy one entry tagged with both categories. List categories with no additions in one short line; distinguish uninspected categories from confirmed absence. Mark moves, renames, and generated artifacts as such rather than treating them as new architectural responsibilities. For plans, label entries as proposed rather than implemented.

If no simplifications are supported, briefly identify the alternatives investigated and the concrete requirements that ruled them out. Do not substitute “no correctness bug found” for this assessment.
