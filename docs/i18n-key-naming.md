# Logseq i18n Key Naming Standard

## Purpose

This document defines how to name new i18n keys in
`src/resources/dicts/en.edn`.

Goal: given any new user-facing string, this document should let you determine
its key name directly.

Secondary goal: keep prefixes converged. A name that is slightly less "pure"
but stays inside an existing owner is usually better than creating a new
low-density root or singleton dotted subdomain.

Audience:

- developers adding or renaming English keys
- AI agents reviewing or generating i18n changes

Non-English locale contributors should not invent or rename keys. They should
use [contributing-to-translations.md](contributing-to-translations.md) instead.

This document is only about key naming and reuse. Rules for placeholders,
hiccup, punctuation, locale fallback, linting, and helper selection live in
[dev-practices.md](dev-practices.md).

Developer-only `(Dev)` labels are out of scope for this document. Keep them as
inline English labels next to the developer UI/command definition instead of
adding translation keys.

## Key Shape

Use this shape:

```clojure
:<root>[.<subdomain>]/<leaf>
```

Rules:

- `<root>` chooses the semantic owner
- `<subdomain>` is optional and used only for a stable subfeature, workflow, or representation
- `<leaf>` describes the text's role inside that owner
- `<root>` names are singular semantic owners
- All segments use kebab-case

Examples:

```clojure
:ui/close
:page.delete/confirm-title
:nav.all-pages/title
:settings.editor/show-brackets
:plugin.install-from-file/success
:view.table/sort-ascending
:cmdk.action/open
:mobile.toolbar/undo
```

## Before Naming a New Key

1. Search `src/resources/dicts/en.edn`.
2. Reuse a key only when both match:
   - semantic owner
   - textual role
3. If the English text matches but the owner or role differs, create a new key.

Examples:

- toolbar `"Bold"` and command `"Bold"` are different keys
- dialog `"Close"` and window `"Close"` are different keys
- reusable `"Copied!"` feedback may share a `notification/*` key only when it
  is intentionally cross-domain

## Step 1: Choose the Owner

The namespace must be chosen by owner, not by file path, not by component name,
and not by where the text happens to be rendered.

There are only 5 owner classes.

### 1. Interaction Systems

Use when the text belongs to an interaction registry or interaction subsystem.

| Namespace | Use for |
|---|---|
| `command.*` | Built-in command descriptions |
| `shortcut.category` | Shortcut help categories |
| `keymap` | Keybinding editor text |
| `cmdk` | Command palette text |

Use this class when:

- the text is attached to a command id
- the text names a shortcut group
- the text belongs to rebinding/conflict/chord UI
- the text belongs only to command palette behavior

For `command.*` keys:

- the subdomain is the command group name
- use a stable semantic group name, not an implementation placeholder
- avoid new opaque or self-referential groups such as `command.command`

Examples:

```clojure
:command.editor/bold
:command.graph/open
:command.page/toggle-favorite
:command.shell/run
:shortcut.category/block-editing
:keymap/search-placeholder
:cmdk.action/open
```

### 2. Shared Primitives

Use only when the wording keeps the same meaning across unrelated domains.

| Namespace | Use for |
|---|---|
| `ui` | Generic actions and states |
| `nav` | Global destinations and route-level constraints |
| `notification` | Reusable cross-feature feedback |
| `search` | Generic search vocabulary |
| `select` | Generic picker vocabulary |
| `format` | Formatting vocabulary |
| `color` | Color vocabulary |

Qualification rules:

- removing product context does not change the meaning
- the wording can be reused in multiple unrelated domains
- the wording does not name a specific entity or workflow
- if the text names a product entity such as `graph`, `page`, or `server`, use that product domain instead

Examples:

```clojure
:ui/close
:ui/save
:nav/home
:notification/copied
:search/no-result
:select/default-prompt
:format/bold
:color/red
```

### 3. Product Domains

This is the default class. Most keys should be here.

Use when the text belongs to a first-class product feature, entity, or workflow.

#### 3.1 Workspace and content domains

- `graph`
- `file`
- `page`
- `block`
- `node`
- `journal`
- `library`
- `date`
- `editor`
- `reference`
- `property`
- `class`
- `view`
- `query`
- `icon`
- `asset`
- `pdf`
- `flashcard`

#### 3.2 Data movement and publishing domains

- `import`
- `export`
- `publish`

#### 3.3 Customization, AI, and extensibility domains

- `settings`
- `theme`
- `plugin`
- `ai`
- `youtube`
- `zotero`
- `server`
- `storage`

`ai` is a reserved owner for future built-in AI feature UI. Current AI-related
settings copy may still live under `settings.ai/*`.

#### 3.4 Account, cloud, and security domains

- `account`
- `sync`
- `collaboration`
- `encryption`

#### 3.5 Support, diagnostics, and lifecycle domains

- `onboarding`
- `help`
- `bug-report`
- `shell`
- `profiler`
- `updater`
- `deeplink`

#### Product domain boundaries

Use this table to resolve common conflicts.

| Namespace | Owns | Does not own |
|---|---|---|
| `graph` | Graph lifecycle, graph switching, graph-level state, graph visualization entry points | Individual pages, blocks, raw files |
| `file` | Raw file browser, file metadata, file-level errors | Graph switching, page semantics, import workflow |
| `page` | Page metadata and page-level workflows | Active editing mechanics |
| `block` | Block as stored content entity | Active editing session behavior |
| `node` | Generic node vocabulary intentionally shared across page/block/tag/property-like entities | Page-only, block-only, property-only, or class-only workflows |
| `editor` | Active authoring behavior: selection, cursor actions, paste, heading changes, inline creation | Command registry text, page metadata, property schema |
| `journal` | Journal-only behavior | Generic page behavior |
| `library` | Library page copy and library-specific add/remove flows | Generic page search or generic page metadata outside the library feature |
| `date` | Relative-date vocabulary, natural-language date phrases, and date-only labeling/parsing copy | Journal-only workflows, editor command registries |
| `reference` | Backlinks, linked references, block refs, page refs | Generic search or editing text |
| `property` | Property schema, values, choices, dialogs, validation | Query semantics and result presentation |
| `class` | Class/tag schema and class-specific configuration | Generic property schema |
| `query` | Query definition, query source, query inputs, live-query semantics | Table sorting, grouping, row selection |
| `view` | Result presentation, table controls, grouping, sorting, columns, selection, representation modes | Query source semantics or property schema |
| `icon` | Icon picker, emoji/icon browsing, icon-search tabs and counts | Generic search vocabulary or generic select/picker wording outside icon picking |
| `asset` | Attachments and embedded media assets | Generic file browser or export |
| `pdf` | PDF viewer and PDF-specific reading/annotation behavior | Generic asset browsing or generic reference behavior |
| `flashcard` | Card review, card study flow, card-specific review UI | Generic editor actions or generic query/view controls |
| `import` | Import workflows, import source parsing, import options, and import-specific validation/feedback | Export, publish, or generic file browser wording |
| `export` | Export workflows, export format/options, export progress, and export-specific feedback | Import flows, publish lifecycle, or generic file browser wording |
| `publish` | Publish and unpublish flows, publish access settings, and publish status/failure messages | Generic export formats/backups, sync state, or account identity |
| `settings` | Built-in settings page copy, settings sections, built-in setting labels, and built-in setting feedback | Plugin lifecycle UI, standalone runtime workflows outside settings |
| `theme` | Theme selection and theme-specific customization | Generic settings |
| `plugin` | Plugin lifecycle, marketplace, plugin configuration, install/update/remove flows | Built-in settings or theme selection |
| `ai` | Semantic search, embedding model selection, model download states, and other built-in AI feature UI | Generic settings scaffolding or non-AI search vocabulary |
| `youtube` | YouTube-specific embed and timestamp behavior | Generic asset/video wording or generic mobile warnings |
| `zotero` | Built-in Zotero integration, Zotero attachment access, Zotero-linked or imported file affordances, and Zotero-specific defaults | Generic file browser, generic import/export, or plugin lifecycle |
| `server` | Local HTTP API, MCP, local server setup and diagnostics | Cloud sync or account identity |
| `storage` | Local persistence, sqlite/local-db storage errors, recycle UI and recycle storage constraints | Cloud sync lifecycle or file browser UI |
| `account` | Login, identity, plan, membership, billing-facing account state, and account-authentication actions such as resetting the account password | Graph sync state or passwords/keys that gate encrypted data |
| `sync` | Graph sync, storage usage, invitations, remote graph lifecycle | Login identity or password management |
| `collaboration` | Collaborators, participants, collaboration-only permissions and presence | Generic sync storage accounting |
| `encryption` | Passwords, keypairs, encrypted graph access, and key reset flows for encrypted data | Login/billing identity state or account-authentication actions |
| `onboarding` | First-run setup and initial import/graph setup | General settings or ongoing help |
| `help` | Documentation, handbook, shortcut help, community/support entry points | Bug reporting flow |
| `bug-report` | Bug reporting, diagnostics, issue helpers | General help navigation |
| `shell` | Built-in shell command runner UI and its workflow | Built-in command descriptions or generic terminal wording outside the shell runner feature |
| `profiler` | Built-in profiling and diagnostics UI for developers or advanced users | Bug reporting copy, generic settings, or runtime performance logs |
| `updater` | Release install/restart state | Generic settings labels about updates |
| `deeplink` | `logseq://` or deep-link open flows and deep-link resolution errors | Generic navigation labels or route names |

Examples:

```clojure
:page/delete
:page.validation/name-no-hash
:page.convert/cant-be-block
:editor/remove-heading
:editor.slash/node-reference
:date.nlp/today
:node/built-in-cant-delete-error
:property/default-value
:view.table/sort-ascending
:plugin/install
:settings.editor/show-brackets
:sync/invitation-sent
:encryption/reset-password
:bug-report.inspector/title
```

### 4. Shell Surfaces

Use only when the meaning depends on the shell surface itself.

| Namespace | Use for |
|---|---|
| `header` | Header-only actions and labels |
| `sidebar.left` | Left sidebar shell affordances |
| `sidebar.right` | Right sidebar shell affordances |
| `context-menu` | Context menu-only affordances |
| `window` | Window chrome actions |

Use this class when:

- moving the text to another surface would change its meaning
- the text describes pane controls, sidebar controls, or window chrome

Do not use a surface namespace for:

- feature titles rendered inside a surface
- route or destination labels rendered inside a surface
- domain workflows that happen to be launched from a surface

Examples:

```clojure
:header/go-back
:sidebar.left/favorites
:sidebar.right/close
:context-menu/set-icon
:window/minimize
```

### 5. Platform Runtimes

Use only when the text exists because one runtime has a unique implementation.

| Namespace | Use for |
|---|---|
| `mobile` | Mobile-only runtime behavior |
| `electron` | Electron-only runtime behavior |

Use this class when:

- the workflow exists only on one runtime
- the wording refers to a native/runtime-only capability

Examples:

```clojure
:mobile.tab/graphs
:mobile.settings/version
:electron/new-window
:electron/add-to-dictionary
```

## Step 2: Apply the Decision Tree

Choose the first matching branch and stop.

1. Is the text owned by an interaction system?
   Use `command.*`, `shortcut.category`, `keymap`, or `cmdk`.
2. Is the text a shared primitive reused across unrelated domains?
   Use `ui`, `nav`, `notification`, `search`, `select`, `format`, or `color`.
3. Is the text owned by a product domain?
   Use the matching product domain namespace.
4. Is the text owned by a shell surface?
   Use `header`, `sidebar.left`, `sidebar.right`, `context-menu`, or `window`.
5. Is the text runtime-exclusive?
   Use `mobile` or `electron`.

If none fits, define a new product domain only when the feature has a clear,
long-lived product boundary. Otherwise, keep the nearest existing product
domain and use a more specific leaf.

## Owner Constraints

- Do not create roots from implementation modules or component files such as `outliner`, `content`, or `views`.
- Do not create plural owner roots such as `flashcards` or `views`. Use the singular owner.
- Do not use implementation acronyms such as `e2ee` when the product-facing owner is `encryption`.
- Do not use implementation state holders such as `state` as owners. Use the semantic feature owner such as `journal.default-query/*`.
- Do not use a surface owner for a destination label. Use `nav/*` or the feature owner.
- Do not use a validator or storage engine as owner for a domain rule. Validation copy belongs to the constrained domain.
- Treat a new root with fewer than ~5 plausible near-term keys as a smell, not a goal. Small roots are acceptable only when they name a first-class product feature, entity, or integration with a clear independent boundary.
- When keeping a new root, update this taxonomy in the same change so the standard stays aligned with `src/resources/dicts/en.edn`.
- Not every existing key in `en.edn` is a good naming precedent. Prefer this
  standard even when some legacy keys remain unchanged for compatibility.

Examples:

```clojure
:reference.filter/title
:help.handbook/title
:page.validation/name-blank
:property.choice/already-exists
:class.validation/extends-cycle
```

## Existing Namespace Caveats

These namespaces already exist in `en.edn`, but they do not all carry the same
precedent weight for new keys.

| Namespace | Status | Guidance |
|---|---|---|
| `command.command-palette` | Legacy | Keep existing keys, but put new command-palette UI under `cmdk.*`. |
| `property.built-in`, `class.built-in` | Intentional | Stable built-in schema vocabularies under the `property` and `class` owners. |
| `block.macro`, `property.repeat-recur-unit` | Intentional | Stable representation/enum groups. This pattern is acceptable when the subdomain names a real user-facing concept. |

## Step 3: Decide Whether a Subdomain Is Needed

Use a dotted subdomain only for one of these 4 cases.

### 1. Stable section

Examples:

```clojure
:nav.all-pages/title
:settings/account
:settings.editor/show-brackets
```

### 2. Stable workflow

Examples:

```clojure
:page.delete/confirm-title
:page.delete/warning
:page.delete/success
:plugin.install-from-file/title
:editor.slash/group-basic
```

### 3. Stable representation or mode

Examples:

```clojure
:view.table/default-title
:view.table/sort-ascending
:mobile.toolbar/undo
:server.status/running
:cmdk.action/open
```

### 4. Stable validator, conversion, or settings section

Examples:

```clojure
:page.validation/name-no-hash
:page.convert/cant-be-block
:property.choice/already-exists
:settings/account
:help.shortcuts/title
```

Rules:

- use `.validation/` when the message is the direct result of a validation check, constraint violation, or failed precondition
- use an existing workflow subdomain such as `.convert/` or `.delete/` for workflow-specific actions, confirmations, and blockers
- do not create a narrower workflow-variant subdomain when an existing workflow already owns the text
- for built-in settings tab labels, use flat keys such as `:settings/general`; reserve `:settings.<section>/*` for copy inside that settings section
- prefer a flat key when the dotted subdomain would only contain one string for now
- create a new dotted subdomain only when at least one of these is true:
  - the namespace already has sibling keys
  - the workflow or section clearly needs multiple roles such as `title` + `desc`, `confirm-title` + `confirm-desc`, or `empty` + `empty-desc`
  - the flat leaf would become less readable than the dotted form
- a prefix with 2 to 4 keys is often healthy; the main smell is a singleton dotted subdomain such as `:help/about-title` or `:graph/delete-local-confirm-desc`

Good examples:

```clojure
:page.convert/tag-to-page-action
:page.convert/tag-to-page-confirm-desc
:property.validation/invalid-name
:help/about
:graph/delete-local-confirm-desc
```

Do not use a subdomain for:

- component names
- implementation names
- layout slices
- words like `main`, `section`, `tab`, `btn`, `modal`, `page`

Bad examples:

```clojure
:command.command-palette/toggle
:help/about-title
```

## Step 4: Choose the Leaf

The leaf describes the text's role inside its owner.

### 1. Canonical labels

Use a bare subject or action when the text is the canonical label itself.

Examples:

```clojure
:ui/save
:page/backlinks
:property/default-value
:plugin/install
```

### 2. Structured role suffixes

Use these suffixes consistently.

| Suffix | Use for |
|---|---|
| `title` | Panel, section, page, dialog, modal title |
| `desc` | Supporting description |
| `label` | Control, nav, picker, or form label when it is not the title |
| `prompt` | Short picker or flow prompt |
| `placeholder` | Input placeholder |
| `hint` | Short inline help |
| `tip` | Advice or explanatory tip |
| `tooltip` | Hover text |
| `empty` | Empty-state heading or label |
| `empty-desc` | Empty-state description |
| `confirm-title` | Confirmation title |
| `confirm-desc` | Confirmation body |
| `success` | Success feedback |
| `error` | Error feedback |
| `warning` | Warning feedback |
| `count` | Parameterized count text |
| `action` | Action label when a bare verb would be ambiguous |

Additional rules:

- use `desc`, not `description`
- use `prompt`, not `message`, for short chooser, picker, or action-sheet instructions
- use `label` when the text prefixes an inline value such as an ID, date, or selected item
- do not split one sentence into `*-prefix` and `*-suffix` keys; keep a single translation entry and insert links, shortcuts, or styled fragments with placeholders

Examples:

```clojure
:help.shortcuts/label
:graph.switch/select-prompt
:nav.all-pages/title
:server.config/port-label
:graph/delete-local-confirm-desc
:plugin.install-from-file/success
:graph.switch/empty-desc
:bug-report.inspector/copy
```

Use `error` or `warning` for failure feedback, based on the feedback severity
shown in the UI. Do not use `failure` as a leaf.

## Reuse Rules

Do not reuse a key only because the English text matches.

Reuse a key only when both are the same:

1. semantic owner
2. textual role

Examples:

- toolbar `"Bold"` and command `"Bold"` are different keys
- dialog `"Close"` and window `"Close"` are different keys
- `"Copied!"` may be shared only if it is intentionally a reusable cross-domain notification

When two keys are truly duplicates:

- keep the key that already follows the standard
- deprecate the duplicate key
- do not merge keys when one message carries extra workflow or domain-specific detail

## Naming Workflow

For every new string:

1. Identify the owner with the decision tree.
2. Choose the root namespace from the owner taxonomy.
3. Add a subdomain only if the string belongs to a stable section, workflow, or representation.
4. Choose the leaf from the role rules.
5. Search `src/resources/dicts/en.edn` for an existing key with the same owner and role.
6. Reuse only on exact semantic match.
7. If the new name would create a new root or a singleton dotted subdomain,
   justify why convergence would be worse without it.
8. Add the English source text to `src/resources/dicts/en.edn`.
9. After editing dict files, run `bb lang:format-dicts`.

## Canonical Examples

| Need | Correct key |
|---|---|
| Generic dialog close button | `:ui/close` |
| Header back button tooltip | `:header/go-back` |
| Window close button | `:window/close` |
| Graph local deletion confirmation body | `:graph/delete-local-confirm-desc` |
| Page name validation error | `:page.validation/name-no-hash` |
| Active editor action `"Remove heading"` | `:editor/remove-heading` |
| Built-in node delete validation | `:node/built-in-cant-delete-error` |
| Property name input placeholder | `:property/name-placeholder` |
| Recycle item restore action | `:storage.recycle/restore` |
| Recycle page deletion metadata | `:storage.recycle/page-deleted-at` |
| Graph switch picker prompt | `:graph.switch/select-prompt` |
| Export copied page data feedback | `:export/page-data-copied` |
| Live query table title | `:view.table/live-query-title` |
| Table sort ascending action | `:view.table/sort-ascending` |
| Plugin install-from-file success | `:plugin.install-from-file/success` |
| Command palette open action | `:cmdk.action/open` |
| Mobile-only graph tab | `:mobile.tab/graphs` |
| Server running status | `:server.status/running` |
