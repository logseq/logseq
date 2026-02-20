# Generate Demo Graph

Generate a realistic demo graph for Logseq DB using the file-based pipeline.

## Overview

This command generates a ~300-page realistic demo graph with 6 months of journal entries, people, projects, books, meetings, tasks, and cross-references.

## Step 0: Choose Archetype

Ask the user which archetype to generate (or use the one they specified):

| Archetype | Description | Key tags |
|-----------|-------------|----------|
| **Operator/PM** | Product manager: meetings, projects, OKRs, decisions | Meeting, Project, OKR, Decision |
| **Student** | University student: courses, study groups, assignments | Course, Study Group, Lecture, Semester Goal |
| **Researcher** | PhD/academic: papers, experiments, grants, conferences | Research Project, Paper, Experiment, Grant |
| **Writer** | Writer/creator: drafts, characters, world building, submissions | Writing Project, Draft, Character, Submission |
| **Developer** | Software dev: architecture decisions, sprints, bugs, tech notes | Architecture Decision, Sprint, Bug Report, Tech Note |

The archetype determines which `*-properties`, `*-classes`, `*-cast-spec`, `*-timeline-spec`, and `*-journal-patterns` to use from `demo_archetypes.cljs`. All archetypes follow the same pipeline below.

## Prerequisites

Read these files before generating:

1. **Archetype definitions**: `deps/db/src/logseq/db/demo_archetypes.cljs` -- Properties, classes, cast spec, timeline, journal patterns
2. **Assembly script**: `scripts/src/logseq/tasks/db_graph/demo_assembly.cljs` -- JSON->EDN conversion logic
3. **Cast manifest** (if regenerating journals only): `.context/demo-graphs/<archetype>/cast-manifest.txt`

## Pipeline

All intermediate files go in `.context/demo-graphs/<archetype>/` (gitignored). Replace `<archetype>` with the chosen archetype name (e.g., `operator`, `student`, `researcher`, `writer`, `developer`).

### Step 1: Write Ontology (deterministic)

Copy `:properties`, `:classes`, and `:class-placement` from the archetype definitions in `demo_archetypes.cljs` into EDN format:

```
.context/demo-graphs/<archetype>/00-ontology.edn
```

Format: `{:properties {...} :classes {...} :class-placement {:page-only #{...} :block-only #{...} :mixed #{...}}}`

The `:class-placement` map is used by the assembly script for tag validation.

### Step 2: Generate Cast (1 agent)

Generate `01-cast.json` -- a JSON array of entities. Each entity:

```json
{"name": "Sarah Chen", "tags": ["Person"], "properties": {"role": "Senior PM", "email": "sarah@example.com", "company": "Meridian Labs"}}
```

Target counts come from `<archetype>-cast-spec` in `demo_archetypes.cljs`. Read the cast spec and generate entities matching those counts and mix ratios.

### Step 3: Extract Cast Manifest

Create `cast-manifest.txt` from the cast — a flat list of all names and roles, organized by category. This is the only file journal agents need to read (keeps their context small).

### Step 4: Generate Journals (parallel agents)

Launch 3 agents in parallel, each generating 2 months of journals. The phase names and activity levels come from `<archetype>-timeline-spec` in `demo_archetypes.cljs`:

| File | Months | Activity |
|------|--------|----------|
| `02-journals-batch1.json` | Months 1–2 | High |
| `03-journals-batch2.json` | Months 3–4 | Medium |
| `04-journals-batch3.json` | Months 5–6 | Low |

Each agent reads `cast-manifest.txt`, the archetype definitions, `<archetype>-journal-patterns` for day-type weights, and `<archetype>-class-placement` for tag placement rules.

### Step 5: Assemble & Import

```bash
bb dev:assemble-demo .context/demo-graphs/<archetype>/
bb dev:create my-demo .context/demo-graphs/<archetype>/assembled.edn
```

The graph appears at `~/logseq/graphs/my-demo/db.sqlite`, discoverable by localhost:3001 or :3003.

## JSON Format Rules

### Journal entries

Three examples showing the full range of depth and structure (Operator/PM flavored; adapt entity names, tags, and properties to match the chosen archetype). Note: these show individual day entries inside the `"entries"` array:

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
- **Only reference people from the cast manifest.** Do NOT invent character names that aren't in the manifest. If your narrative organically introduces a new recurring character (e.g., hiring an RA, a new collaborator), declare them in the `new-people` array (see below).
- **`tags`**: Array of class names (e.g., `["Meeting"]`, `["Reflection"]`). See **Tag placement rules** below.
- **`properties`**: Object with property keys matching the ontology. Node properties use arrays of names: `"attendees": ["Sarah Chen", "James Liu"]`
- **`task`**: Shorthand for built-in Task class. Status: `backlog`, `todo`, `doing`, `in-review`, `done`, `canceled`. Priority: `low`, `medium`, `high`, `urgent`
- **`children`**: Nested blocks (recursive, same format)
- **Closed value strings must match exactly**: `"Active"`, `"Backlog"`, `"Paused"`, `"Done"` for project-status; `"Reading"`, `"Completed"`, `"Want to Read"`, `"Abandoned"` for reading-status; etc.
- **Dates are integers**: `YYYYMMDD` format (e.g., `20250815`)

### Journal file format

Each journal batch file is a JSON **object** (not a bare array) with two keys:

```json
{
  "new-people": [
    {"name": "Maya Rodriguez", "tags": ["Person"],
     "properties": {"role": "Research Assistant", "institution": "Stanford University"}}
  ],
  "entries": [
    {"date": 20260110, "blocks": [...]},
    {"date": 20260111}
  ]
}
```

- **`entries`** (required): Array of journal day objects (same format as before).
- **`new-people`** (optional): Array of emergent characters introduced organically during this batch. Each entry has the same format as a cast entity (`name`, `tags`, `properties`). The assembly pipeline creates proper tagged pages for them.

**Emergent character rules:**
- When the narrative organically introduces a new recurring person (hiring, a visiting scholar, etc.), declare them in `new-people` with appropriate tags and properties.
- **Before they officially join**, mention them as plain text (e.g., "Maya Rodriguez: sophomore, neuroscience major"). This represents the phase where they're hypothetical candidates being discussed.
- **Once they officially join** (hired, enrolled, introduced), switch to `[[wiki links]]` (e.g., `[[Maya Rodriguez]]'s first day`). This is the moment they become a real entity in the graph.
- The transition from plain text to wiki link creates a natural narrative arc: discussion → decision → integration.

### Tag placement rules

Tags on journal blocks create **objects**. Each archetype's `*-class-placement` in `demo_archetypes.cljs` declares three categories. Read them before generating journals.

**Page-only classes** — entities exist as pages in the cast. Journal blocks reference them via `[[wiki links]]` but NEVER tag themselves with these classes.

```json
// WRONG: tagging a journal block with a page-only class
{"text": "Read 3 chapters of [[Frankenstein]]", "tags": ["Book"]}

// WRONG: tagging a block that mentions a person
{"text": "Met with [[Dr. Helen Marcus]] about research", "tags": ["Professor"]}

// RIGHT: just use wiki links to reference existing pages
{"text": "Read 3 chapters of [[Frankenstein]]"}
{"text": "Met with [[Dr. Helen Marcus]] about research"}
```

**Block-only classes** — never in the cast. Born as tagged blocks inside journal entries. The block IS the object:

```json
// The block IS a meeting (Operator)
{"text": "1:1 with [[James Liu]]", "tags": ["Meeting"],
 "properties": {"attendees": ["James Liu"], "agenda": "Sprint 15 prep"}}

// The block IS a lecture note (Student)
{"text": "CS 201 lecture: binary search trees and AVL rotations", "tags": ["Lecture"],
 "properties": {"subject": "Data Structures & Algorithms (CS 201)", "location": "CS Building 104"}}

// The block IS a reflection
{"text": "Feeling more confident about the material after today's study session", "tags": ["Reflection"]}
```

**Mixed classes** — substantial instances are pages in the cast; lightweight instances are born as tagged **block objects** in journals. Use the **parent/child pattern**: narrative context goes in the parent block, the clean entity name goes in a tagged child block.

```json
// NEW Book discovered — child block is the clean object
{"text": "Sam recommended a great programming book",
 "children": [
   {"text": "The Pragmatic Programmer", "tags": ["Book"],
    "properties": {"reading-status": "Want to Read"}}
 ]}

// NEW article found while browsing
{"text": "Found an interesting article on spaced repetition",
 "children": [
   {"text": "Effective Spaced Repetition", "tags": ["Read"],
    "properties": {"reading-status": "Reading"}}
 ]}

// NEW Idea captured in the moment
{"text": "Had a thought during the lecture",
 "children": [
   {"text": "What if we gamified the flashcard review process?", "tags": ["Idea"]}
 ]}

// EXISTING book from cast — just reference it, NO tag
{"text": "Finished [[Frankenstein]]. Loved the ending."}
```

**The key rule**: If the text contains a `[[wiki link]]` to an existing cast entity, do NOT tag the block with that entity's class. Tags create new objects; wiki links reference existing ones.

**Block object guidelines for journals**:
- Aim for 5-10 block objects per 2-month batch across mixed classes (a few new books/articles discovered, a few new ideas captured)
- Block object titles should be clean entity names, not narrative sentences
- **Never prefix entity names with their class name.** The tag already communicates the type. Write `"Combine VR with fMRI for ecologically valid memory paradigms"` not `"Idea: Combine VR with fMRI..."`. Write `"RSA Methods Comparison"` not `"Lit Note: RSA Methods Comparison"`. This applies everywhere: cast entities, block objects, and wiki link targets.
- The parent block provides context (who recommended it, where you found it, what prompted the thought)

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
- **Use realistic language for the archetype**: e.g., PM language for Operator (sprint planning, PRD reviews, 1:1s), academic language for Researcher (literature reviews, grant proposals), etc.
- **Cross-reference liberally**: mention people, projects, books, tools, ideas naturally via `[[wiki links]]`
- **Create block objects**: each 2-month batch should birth 5-10 new block objects using the parent/child pattern (new books/articles discovered, new ideas captured, one-off events). These appear alongside cast pages in class tables, creating a realistic mix.
- **Include personal life**: friend meetups, family calls, book reading, subscription content, hobby mentions
- **Progress arcs**: projects should evolve over months (kickoff → progress → blockers → resolution)
- **Activity levels**: high (Aug-Sep onboarding), medium (Oct-Nov execution), low (Dec-Jan holidays)

## Regenerating Parts

You can regenerate individual pieces without redoing everything:

- **New cast**: Regenerate `01-cast.json`, update `cast-manifest.txt`, regenerate all journals
- **One month of journals**: Regenerate just that file (e.g., `03-journals-oct-nov.json`), re-run assembly
- **Add content**: Edit any JSON file, re-run `bb dev:assemble-demo` then `bb dev:create`
- **Fresh import**: Delete old graph first: `rm -rf ~/logseq/graphs/<name>`, then `bb dev:create`
