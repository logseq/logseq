# ADR: Reactions via Properties

## Status
- Proposed

## Context
- Users want lightweight reactions (e.g., 👍 ❤️) on blocks and pages.
- Reactions must be stored in the graph so they sync, can be queried, and work across devices.
- The system already uses properties to attach structured metadata to blocks/pages.
- We need to show who reacted and which emoji they used.

## Decision
- Store reactions as separate entities linked to the reacted block/page.
- Each reaction entity records:
  - Emoji id (from Logseq’s supported `emojis-data` set).
  - Optional `:logseq.property/created-by-ref` pointing to the reacting user (absent for anonymous graphs).
  - Reacted block/page reference.
  - `:block/created-at` timestamp for the reaction entity.
- No `:logseq.property/reactions` collection property is required; use the reverse ref
  `(:logseq.property.reaction/_target node-entity)` to fetch reactions for a node.
- Keep the property name namespaced in logseq.db.frontend.property/built-in-properties.

### Proposed entity shape
```
{:db/id                         ...
 :logseq.property.reaction/emoji-id             "smile"
 :logseq.property/created-by-ref                <user-db-id>   ;; omitted for anonymous graphs
 :logseq.property.reaction/target               <target-db-id> ;; block/page db id
 :block/created-at              1710000000000}
```

### Read/write rules
- Toggling a reaction adds/removes a reaction entity for the current emoji/user.
- If anonymous, only one reaction per emoji per block/page (no user id).
- Reactions are derived via reverse reference lookup; no dedicated collection
  property is stored on the node.

### Example queries
```clj
;; Given a block/page entity `node-entity`, fetch all reactions.
(:logseq.property.reaction/_target node-entity)

;; Filter reactions by emoji id.
(filter #(= "smile" (:logseq.property.reaction/emoji-id %))
        (:logseq.property.reaction/_target node-entity))

;; Count reactions per emoji id.
(->> (:logseq.property.reaction/_target node-entity)
     (map :logseq.property.reaction/emoji-id)
     (frequencies))

;; Filter reactions by user id (when present).
(filter #(= user-db-id (:logseq.property/created-by-ref %))
        (:logseq.property.reaction/_target node-entity))
```

## Consequences
- Reactions sync naturally as part of DB transactions and are queryable.
- Data model supports “who reacted” and multiple users per emoji without map merging.
- Adds more entities; need efficient queries and indexes.

## Alternatives Considered
- **Dedicated table/attribute per emoji**: complicates schema, increases complexity.
- **Property map (emoji -> users)**: smaller but harder to resolve conflicts and query per user.
- **Inline text markers**: not structured, hard to query and sync.

## Open Questions
- Which user identifier should be stored as `:logseq.property/created-by-ref`?
  Each user has a page in the graph
- How to handle anonymous/local graphs (no user identity)?
  Record reactions, for anonymous graphs, don't store :logseq.property/created-by-ref

## Notes for Implementation
- Add emoji entity schema to DB validation.
- UI should show a summary (emoji + count) and a hover/popover with user list.
- User can toggle reaction.
