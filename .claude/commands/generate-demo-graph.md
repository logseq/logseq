# Generate Demo Graph

Generate a realistic demo graph for Logseq DB using the file-based pipeline.

## Overview

This command generates a ~300-page realistic demo graph with 6 months of journal entries, people, projects, books, meetings, tasks, and cross-references. The graph uses the **Operator/PM archetype** — a product manager who uses Logseq for daily work.

## Prerequisites

Read these files before generating:

1. **Archetype definitions**: `deps/db/src/logseq/db/demo_archetypes.cljs` — Properties, classes, cast spec, timeline, journal patterns
2. **Assembly script**: `scripts/src/logseq/tasks/db_graph/demo_assembly.cljs` — JSON→EDN conversion logic
3. **Cast manifest** (if regenerating journals only): `.context/demo-graphs/operator/cast-manifest.txt`

## Pipeline

All intermediate files go in `.context/demo-graphs/operator/` (gitignored).

### Step 1: Write Ontology (deterministic)

Copy `:properties` and `:classes` from `operator-properties` and `operator-classes` in `demo_archetypes.cljs` into EDN format:

```
.context/demo-graphs/operator/00-ontology.edn
```

Format: `{:properties {...} :classes {...}}`

### Step 2: Generate Cast (1 agent)

Generate `01-cast.json` — a JSON array of entities. Each entity:

```json
{"name": "Sarah Chen", "tags": ["Person"], "properties": {"role": "Senior PM", "email": "sarah@example.com", "company": "Meridian Labs"}}
```

Target counts from `operator-cast-spec`:
- 25 people (10 coworkers, 4 reports, 3 executives, 4 friends, 2 family, 2 external)
- 12 authors
- 4 companies (1 employer, 2 clients, 1 partner)
- 7 projects (mix of active, backlog, paused, done)
- 14 books (mix of completed, reading, want to read, abandoned)
- 6 tools, 4 subscriptions, 10 ideas, 4 OKRs, 3 decisions

### Step 3: Extract Cast Manifest

Create `cast-manifest.txt` from the cast — a flat list of all names and roles, organized by category. This is the only file journal agents need to read (keeps their context small).

### Step 4: Generate Journals (parallel agents)

Launch 3 agents in parallel, each generating 2 months of journals:

| File | Months | Phase | Activity |
|------|--------|-------|----------|
| `02-journals-aug-sep.json` | Aug–Sep 2025 | Onboarding & Q3 kickoff | High |
| `03-journals-oct-nov.json` | Oct–Nov 2025 | Deep execution | Medium |
| `04-journals-dec-jan.json` | Dec 2025–Jan 2026 | Q4 wrap-up & holidays | Low |

Each agent reads `cast-manifest.txt` and the archetype definitions.

### Step 5: Assemble & Import

```bash
bb dev:assemble-demo .context/demo-graphs/operator/
bb dev:create my-demo .context/demo-graphs/operator/assembled.edn
```

The graph appears at `~/logseq/graphs/my-demo/db.sqlite`, discoverable by localhost:3001 or :3003.

## JSON Format Rules

### Journal entries

```json
[
  {"date": 20250815, "blocks": [
    {"text": "Quick sync with [[Sarah Chen]] about [[Collaborative Workspaces]]"},
    {"text": "Sprint Planning", "tags": ["Meeting"],
     "properties": {"attendees": ["Sarah Chen", "James Liu"], "agenda": "Review priorities"},
     "children": [
       {"text": "Agreed to focus on API refactor first"},
       {"text": "[[James Liu]] will handle the migration piece"}
     ]},
    {"text": "Review PR #847", "task": {"status": "todo", "priority": "medium"}},
    {"text": "Finish quarterly report", "task": {"status": "doing", "priority": "high", "deadline": 20250820}}
  ]},
  {"date": 20250816},
  {"date": 20250817, "blocks": [{"text": "Started reading [[The Adjacent Room]]"}]}
]
```

### Critical rules

- **Every day in the range must appear** (empty days: `{"date": 20250816}`)
- **Use `[[wiki links]]`** for cross-references in `text` — use EXACT names from cast-manifest.txt
- **`tags`**: Array of class names (e.g., `["Meeting"]`, `["Reflection"]`)
- **`properties`**: Object with property keys matching the ontology. Node properties use arrays of names: `"attendees": ["Sarah Chen", "James Liu"]`
- **`task`**: Shorthand for built-in Task class. Status: `backlog`, `todo`, `doing`, `in-review`, `done`, `canceled`. Priority: `low`, `medium`, `high`, `urgent`
- **`children`**: Nested blocks (recursive, same format)
- **Closed value strings must match exactly**: `"Active"`, `"Backlog"`, `"Paused"`, `"Done"` for project-status; `"Reading"`, `"Completed"`, `"Want to Read"`, `"Abandoned"` for reading-status; etc.
- **Dates are integers**: `YYYYMMDD` format (e.g., `20250815`)

### Content quality guidelines

- **Vary day types**: ~20% empty, 15% minimal (1-2 blocks), 15% meeting-heavy, 15% task-focused, 8% reflection, 7% reading notes, 20% mixed
- **Use realistic PM language**: sprint planning, stakeholder alignment, PRD reviews, design critiques, 1:1s, retros
- **Cross-reference liberally**: mention people, projects, books, tools, ideas naturally
- **Include personal life**: friend meetups, family calls, book reading, subscription content, hobby mentions
- **Progress arcs**: projects should evolve over months (kickoff → progress → blockers → resolution)
- **Activity levels**: high (Aug-Sep onboarding), medium (Oct-Nov execution), low (Dec-Jan holidays)

## Regenerating Parts

You can regenerate individual pieces without redoing everything:

- **New cast**: Regenerate `01-cast.json`, update `cast-manifest.txt`, regenerate all journals
- **One month of journals**: Regenerate just that file (e.g., `03-journals-oct-nov.json`), re-run assembly
- **Add content**: Edit any JSON file, re-run `bb dev:assemble-demo` then `bb dev:create`
- **Fresh import**: Delete old graph first: `rm -rf ~/logseq/graphs/<name>`, then `bb dev:create`
