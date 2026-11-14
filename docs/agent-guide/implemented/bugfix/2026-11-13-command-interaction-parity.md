# Command Interaction Parity

## Problem

The LUI command palette drops composition identity at its host boundary, so
IME confirmation can execute the highlighted command. Slash and palette search
also omit the English labels and Simplified-Chinese initials searched by master.
The slash catalog has additional entries and different heading/priority ordering.
The palette also discards file-result actions, lacks result-link opening, treats
Control as Command on macOS, and intercepts navigation keys master leaves alone.

## Decision

Both palette hosts preserve composition identity, and shared handling ignores
Enter actions during composition. The existing English dictionary lookup reaches
palette search through its service port and slash search through explicit item
metadata. Native and Web share a deterministic initials converter derived from
the already locked tiny-pinyin dependency. The slash catalog follows master
ordering and excludes non-master entries. Built-in status and priority labels are
translated without changing their stored values. File results use the existing
file route; result links use existing page-property and block-title lookups.
Palette handling uses the platform Mod key and leaves Home, End and page keys to
native input handling. Editor interaction, application host, SDK, PDF, mobile and
Dune files remain unchanged. One retained composition-Enter regression table
protects confirmation from execution; direct mappings use existing contracts,
source comparison and builds.

Configured slash outputs also support status, priority, heading, property and
block-property-targeted property steps. The complete output is structurally
validated before execution. Pure edits remain atomic between property effects;
property effects use existing outliner flush, accepted-save acknowledgement and
owned refresh paths. Asynchronous continuation requires the original graph,
route, popup session, editor epoch, UUID, scope, input sequence and expected
source/selection. It does not compare model versions or base text, which may
legitimately change during an owned save or geometry update. One continuation
regression table verifies that superseded checkpoints cannot receive late edits.

## Alternatives considered

### Host-only pinyin conversion

Rejected because a JavaScript-only implementation would preserve native drift.
An abbreviated command-specific character table would not support plugin and
configured command labels consistently.

## Acceptance criteria

- IME confirmation does not execute, navigate or dismiss the command palette.
- Translated commands remain searchable by English labels on both backends.
- Simplified-Chinese labels remain searchable by the master initials algorithm.
- Slash headings and priorities retain master order and contextual filtering.
- File results navigate, and Mod+O opens a page URL property or a block URL.
- Palette keyboard ownership and platform modifiers match master.
- Configured property steps retain master wire semantics and execution order.
- Superseded configured continuations do not alter another editing checkpoint.
- Existing native/Web builds and command regression checks pass.

## Risks

- Generated transliteration data is tied to the documented tiny-pinyin and ICU
  versions; regeneration must be deliberate. Actual GUI acceptance is separate.
- This patch does not assert parity for host input dispatch or missing editor
  command side effects not covered by the source audit.
- A configured sequence is not a new transaction protocol: already accepted
  property effects are not rolled back when a later continuation is superseded.

## Consequences

The shared palette consumes composition identity and separate locale/English
labels. Both platforms use frozen initials data and their existing regex and URL
capabilities. Home, End and page-navigation keys are no longer palette actions.
Native/Web builds and the existing suite pass; real GUI acceptance remains
separate. YouTube timestamp execution is deferred to the media owner because no
player-time query exists in the current capability surface. Other unsupported
configured-command steps remain explicit gaps rather than claims of complete
command parity. Held-arrow acceleration is not a master behavior: its unused
acceleration state does not change the constant one-item key-repeat movement.
