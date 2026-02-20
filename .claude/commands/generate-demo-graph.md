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

Three examples showing the full range of depth and structure:

```json
// SHALLOW DAY: 1-2 flat blocks, no children. Quick capture.
{"date": 20250823, "blocks": [
  {"text": "Quiet Saturday. Finished [[The Momentum Principle]]."}
]}

// STANDARD DAY: 3-5 blocks, light nesting (depth 2).
{"date": 20250825, "blocks": [
  {"text": "Reviewed [[Priya Sharma]]'s mockups for the permissions modal"},
  {"text": "1:1 with [[James Liu]]", "tags": ["Meeting"],
   "properties": {"attendees": ["James Liu"], "agenda": "Sprint 15 prep"},
   "children": [
     {"text": "Sprint 14 velocity was 26 points, below target"},
     {"text": "Agreed to reduce scope on the editor rewrite"}
   ]},
  {"text": "Update PRD for [[Collaborative Workspaces]] phase 2", "task": {"status": "doing", "priority": "high"}}
]}

// EMPTY DAY: must still appear in the array.
{"date": 20250824}

// DEEP DAY: 6+ blocks, depth 3-4, children of children of children.
{"date": 20250826, "blocks": [
  {"text": "Q3 planning review with [[Diana Reyes]]", "tags": ["Meeting"],
   "properties": {"attendees": ["Diana Reyes", "James Liu", "David Park", "Priya Sharma"], "agenda": "Q3 progress and Q4 preview"},
   "children": [
     {"text": "[[Collaborative Workspaces]] beta launch", "children": [
       {"text": "Editor rewrite on track. [[Tom Nguyen]] estimates 2 more sprints."},
       {"text": "Permissions model still needs design review", "children": [
         {"text": "[[Priya Sharma]] will schedule a design critique for Thursday"},
         {"text": "Need to resolve 'workspace admin vs org admin' question first"}
       ]},
       {"text": "Beta access list: 12 teams from [[Crestline Data]] and [[Novaform]]"}
     ]},
     {"text": "[[Smart Notifications Revamp]] status", "children": [
       {"text": "Phase 1 (notification center redesign) shipping next week"},
       {"text": "Phase 2 (smart grouping) blocked on ML pipeline", "children": [
         {"text": "[[Marcus Webb]] says the pipeline needs a dedicated infra sprint"},
         {"text": "Diana suggested we timebox to 2 weeks and reassess"}
       ]}
     ]},
     {"text": "Headcount: open PM role still in pipeline. Diana wants to close by end of August."}
   ]},
  {"text": "Grabbed lunch with [[Yuki Tanaka]]. She's interested in transitioning to a PM track."},
  {"text": "Write up Q3 planning notes and share with team", "task": {"status": "todo", "priority": "medium"}},
  {"text": "Caught up on [[Lenny's Newsletter]]. The piece on 'product sense' interviews resonated."},
  {"text": "Idea: what if we offered workspace templates as a growth lever?", "tags": ["Idea"], "children": [
    {"text": "Similar to Notion's template gallery. Could drive adoption."},
    {"text": "Would need to be curated initially, then open to community contributions."},
    {"text": "Mention to [[Diana Reyes]] in next 1:1"}
  ]}
]}
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
- **Vary block depth and structure**: Real notes have wildly varying structure. Target this distribution across each 2-month batch:
  - ~15% shallow days: 1-2 flat blocks, no children (quick capture, weekends)
  - ~25% standard days: 3-5 blocks, 1-2 have children with depth 2
  - ~20% busy days: 4-7 blocks, depth 2-3, some children have their own children
  - ~10% deep days: 5-8 blocks, depth 3-4, sub-discussions spawning sub-points (see "deep day" example above)
  - ~10% marathon days: 8-12+ blocks, mixed depths, a packed day with multiple meetings and tasks
  - **Hard floor**: at least 15% of non-empty days MUST have depth 3+, at least 5% MUST have depth 4+
- **Writing style**: Avoid em dashes (—). LLMs overuse them but real note-takers rarely do. Use periods, commas, colons, semicolons, or parentheses instead. Or split the aside into a child block. An occasional em dash is fine, but they should be rare (fewer than 10 across an entire 2-month batch).
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
