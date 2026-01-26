# Logseq CLI Add Tag And Built-in Property Support Implementation Plan

Goal: Extend logseq-cli add block and add page to accept tags and built-in properties with correct type handling.

Architecture: Parse tag and property options in the CLI, resolve them via db-worker-node, and apply them using existing outliner ops.
Architecture: Use built-in property definitions and property type rules to coerce values before invoking :batch-set-property or :create-page.

Tech Stack: ClojureScript, babashka.cli, Datascript, db-worker-node, outliner ops.

Related: Relates to docs/agent-guide/015-logseq-cli-db-worker-node-housekeeping.md.

## Problem statement

Logseq CLI currently supports add block and add page with content and basic status support.
Users need to set tags and built-in properties at creation time from CLI, but built-in properties have multiple value types and validation rules.
The implementation must align with the built-in property definitions and property type system so that values are stored and validated correctly in db-worker-node.

## Testing Plan

I will add unit tests that parse new CLI options for tags and properties and validate error cases for invalid property names and invalid type values.
I will add integration tests that run add block and add page with tags and built-in properties and assert the resulting data in the graph.
I will add tests that cover ref-type properties like :logseq.property/deadline and :block/tags to ensure resolution behavior is correct.
I will add tests that cover scalar properties like :logseq.property/publishing-public? and :logseq.property/heading with proper type coercion.
I will verify that invalid types cause CLI errors before any outliner ops are sent.
I will add tests that missing tags in --add-tag fail with a clear error and do not create tags.
NOTE: I will write *all* tests before I add any implementation behavior.

## Current behavior summary

Add block and add page live in src/main/logseq/cli/command/add.cljs.
Add block supports content, blocks, blocks-file, target selection, position, and status, and it sets status via :batch-set-property.
Add page uses :create-page with an empty options map and does not apply tags or properties.
Built-in properties and their schema are defined in deps/db/src/logseq/db/frontend/property.cljs and type rules in deps/db/src/logseq/db/frontend/property/type.cljs.

## Requirements

Add block supports setting tags on all inserted blocks.
Add page supports setting tags on the created page.
Add block supports setting built-in properties with correct type coercion.
Add page supports setting built-in properties with correct type coercion.
CLI rejects non built-in properties for these new options.
CLI rejects built-in properties that are not public and provides a clear error message.
CLI rejects adding non public tags to blocks.
CLI rejects combining --blocks or --blocks-file with --add-property, --remove-property, --add-tag, or --remove-tag.

## Non goals

Do not change db-worker-node HTTP APIs or add new endpoints.
Do not change outliner property validation logic.
Do not add support for user properties in this change.

## Built-in property type considerations

Built-in property configuration lives in deps/db/src/logseq/db/frontend/property.cljs.
Built-in property types and validation live in deps/db/src/logseq/db/frontend/property/type.cljs.
Property types include user types (:default, :number, :date, :datetime, :checkbox, :url, :node) and internal types (:string, :keyword, :map, :coll, :any, :entity, :class, :page, :property, :raw-number).
Some built-in properties are not public and must not be user-settable via CLI.

### Value coercion table

| Property type | Expected CLI input | Resolution behavior |
| --- | --- | --- |
| :checkbox | boolean or "true"/"false" | Coerce to boolean and send directly. |
| :number | number or numeric string | Coerce to number and send directly. |
| :raw-number | number | Send directly and reject non numeric. |
| :datetime | ISO string | Convert to epoch ms number before sending. |
| :date | date string or journal page name | Resolve to journal page entity id. |
| :default | string or EDN | If string, pass as text value and let outliner create property value block. |
| :url | string | Validate with db-property-type/url? or allow macro urls and send as string. |
| :string | string | Send directly. |
| :keyword | keyword or string | Coerce string to keyword if safe. |
| :map | EDN map | Send directly. |
| :coll | EDN vector or list | Send directly. |
| :entity | block uuid or db/id | Resolve to entity id with :thread-api/pull or reject. |
| :page | page name or uuid | Resolve to page entity id, create page if missing. |
| :class | tag name or uuid | Resolve to class entity id and fail if missing. |
| :property | property name or keyword | Resolve to property entity id using built-in properties map. |
| :node | block uuid or page name | Resolve to entity id or allow node text block if required. |
| :any | EDN value | Send directly. |

## Data flow overview

CLI input is parsed by babashka.cli and normalized in src/main/logseq/cli/command/add.cljs.
CLI resolves tags and property values via db-worker-node using :thread-api/pull and existing outliner ops.
CLI applies properties using :batch-set-property for blocks and :create-page options for pages.

ASCII architecture sketch.

CLI add command
  -> parse options
  -> resolve tags and properties
  -> db-worker-node :thread-api/apply-outliner-ops
  -> outliner ops set properties and tags

## Design decisions

Tags are applied through :block/tags because it is the built-in tags property and is validated by outliner validation.
Page creation uses :create-page with :tags and :properties options to avoid separate post-create transactions.
Block creation uses existing insert blocks then batch-set-property for tags and each built-in property to keep behavior consistent with status handling.
Tags are always written to :block/tags and never to :logseq.property/page-tags.
Add block rejects any combination of --blocks or --blocks-file with --add-property, --remove-property, --add-tag, or --remove-tag.
Properties provided via CLI apply to all inserted blocks unless the input blocks already include explicit values in their block maps.
Properties provided via CLI override existing values on the newly created blocks to avoid ambiguity.

## Implementation plan

### 1. CLI option design and parsing

Add new options to content-add-spec in src/main/logseq/cli/command/add.cljs for tags and properties.
Add new options to add-page-spec in src/main/logseq/cli/command/add.cljs for tags and properties.
Use a single EDN map option like --properties for multiple properties and a repeated option like --property for key value pairs if needed.
Use a single EDN vector option like --tags and a repeated option like --tag for convenience.
Update command summary and help output in src/main/logseq/cli/command/core.cljs if needed to reflect new options.

### 2. Tag resolution helpers

Add a helper in src/main/logseq/cli/command/add.cljs to normalize tag inputs into a vector of tag names or uuids.
Add a helper that validates each tag exists and fails fast when a tag is missing.
Use :thread-api/pull with lookup refs to resolve existing tag pages by name or uuid.
Return a vector of tag entity ids or uuids suitable for outliner ops.

### 3. Built-in property resolution helpers

Add a helper in src/main/logseq/cli/command/add.cljs to parse --properties EDN and validate keys against logseq.db.frontend.property/built-in-properties.
Reject keys not present in built-in-properties or not public based on :schema :public?.
Add a helper to get property type from built-in-properties and then coerce values using rules in deps/db/src/logseq/db/frontend/property/type.cljs.
Add a helper to resolve ref values into entity ids via :thread-api/pull for :page, :class, :property, :entity, and :node.
Add a helper to resolve :date to a journal page, creating it when missing if that is consistent with UI behavior.
Do not create tags implicitly when missing for --add-tag.

### 4. Add page execution changes

Extend build-add-page-action to carry tags and properties in the action context.
Modify execute-add-page in src/main/logseq/cli/command/add.cljs to pass :tags and :properties into the :create-page op options map.
Ensure property values are coerced before being sent so outliner validation passes.

### 5. Add block execution changes

Extend build-add-block-action to carry tags and properties in the action context.
After insert blocks and status application, apply tags via :batch-set-property with :block/tags and the resolved tag ids.
Apply each built-in property via :batch-set-property for the newly created block uuids.
Keep :keep-uuid? behavior for status so tags and properties can reference inserted block ids.

### 6. CLI formatting and errors

Update error messages in src/main/logseq/cli/commands.cljs to include new invalid option errors.
Add error formatting in src/main/logseq/cli/format.cljs if needed to show applied tags or properties in human output.
Ensure JSON output includes any new context if the CLI returns it.

### 7. Tests and fixtures

Add unit tests in src/test/logseq/cli/commands_test.cljs for option parsing and error handling.
Add integration tests in src/test/logseq/cli/integration_test.cljs that create blocks and pages with tags and built-in properties.
Add tests for at least one ref property (e.g. :logseq.property/deadline) and one scalar property (e.g. :logseq.property/publishing-public?).
Add tests for tag creation when tag pages do not exist.

## Edge cases

Tags that collide with private or built-in non-tag classes should be rejected by validation and surfaced to the CLI user.
Missing tags in --add-tag should produce a clear missing tag error without creating new tag pages.
Properties with closed values like :logseq.property/status should accept keyword idents as well as string labels where supported.
Date properties must resolve to journal pages or fail with a clear error if parsing is invalid.
Properties with cardinality many should accept vectors and sets and maintain ordering when required.
Inline tags or page namespaces should not be created implicitly without validation of allowed characters.

## Resolved decisions

CLI must not allow setting non public built-in properties, even with a force option.
Tags are applied via :block/tags and not :logseq.property/page-tags.
Add block must reject --blocks or --blocks-file when combined with --add-property, --remove-property, --add-tag, or --remove-tag.
Datetime values are provided as ISO strings.

## Testing Details

I will add CLI tests that run add page and add block end to end and assert the actual persisted properties and tags using list or show commands.
I will add tests that confirm invalid inputs fail fast and do not produce partial writes.
I will add tests that assert correct ref resolution for tag pages and journal pages.
I will ensure tests cover behavior rather than internal data structures and follow @test-driven-development.

## Implementation Details

- Update src/main/logseq/cli/command/add.cljs with new option parsing and action fields.
- Add tag and property normalization helpers in src/main/logseq/cli/command/add.cljs.
- Use deps/db/src/logseq/db/frontend/property.cljs to validate built-in property keys.
- Use deps/db/src/logseq/db/frontend/property/type.cljs to coerce values by type.
- Use :thread-api/pull in src/main/logseq/cli/command/add.cljs to resolve pages, tags, properties, and blocks.
- Pass tags and properties into :create-page ops in src/main/logseq/cli/command/add.cljs.
- Apply :batch-set-property for :block/tags and built-in properties in src/main/logseq/cli/command/add.cljs.
- Update src/test/logseq/cli/commands_test.cljs with parsing validation tests.
- Update src/test/logseq/cli/integration_test.cljs with behavior tests for tags and built-in properties.

## Question

No open questions.

---
