# Semantic URL Property Values


## Problem

The semantic property API rejects URL strings for native URL properties because
it resolves every ref-backed property value as an existing entity before calling
the outliner. The outliner already creates native URL value blocks from strings.
Real Mapre integration requests reproduce HTTP 400 while the same graph accepts
class inheritance, node references, scalar strings and Task status values.

## Decision

Allow valid scalar URL strings, including arrays for many-valued URL properties,
on unencrypted graphs through single and batch property routes. Keep existing
entity selectors working and reject invalid URLs before applying any batch.
Delegate native value creation and identity reuse to the existing outliner.
Require existing entity selectors on encrypted graphs so a new URL cannot create
an unencrypted title. Preserve class/status/node semantics and add behavioral
handler tests plus local HTTP acceptance. Prepare a PR; deployment is separate.


Accept valid new URL strings only for open URL properties on unencrypted graphs.
Resolve existing entity selectors first. Preserve closed-choice validation and
pass new raw values to the existing outliner converter. All single/batch routes
use this shared preparation path.

## Alternatives considered

### Store URL values as string properties

This changes the user's native property model and requires converting existing
URL definitions. It is not selected without the user's explicit preference.

### Create visible surrogate URL blocks in integrations

This leaks internal encoding into graph content and makes every client manage
property-value lifecycle independently. The outliner already owns this behavior.

## Consequences

Integrations can write native URL properties without creating surrogate graph
blocks. Existing ref, class, task-status and encrypted-graph behavior remains
covered by the handler suite. The implementation is verified locally; production
consumers still need a separately approved Logseq API release.

## Acceptance criteria

- Single and batch routes persist URL strings as native URL property values.
- Many-valued inputs append/reset through the established batch contract.
- Repeating a write does not create duplicate native URL value blocks.
- An invalid URL in a mixed batch prevents every mutation in that batch.
- Existing URL entity selectors remain accepted; node/class/status behavior passes.
- Encrypted graphs reject new plaintext URL values and retain existing ref handling.
- Handler tests and a local HTTP reproduction establish before/after behavior.
- The original Logseq checkout remains unchanged; no production deployment occurs.

## Risks

- URL values are ref-backed in storage; raw values must reach outliner conversion
  rather than bypassing its validation or creating ad hoc Datascript transactions.
- Allowing raw URL text on encrypted graphs would leak title content, so this
  change deliberately restricts creation to unencrypted graphs.

## Questions

- Scope is decided: URL value creation on unencrypted graphs only, preserving
  entity selectors and closed choices. Production deployment is a separate step.

## Verification

- Before the fix, native URL single/batch handler tests reproduced nine failures;
  real API requests returned HTTP 400 for the same URL values.
- A closed-choice regression initially reproduced two further assertion failures.
- After the fix, `clojure -M:cljs compile db-sync-test db-sync-node` succeeded and
  `node worker/dist/worker-test.js` passed 234 tests with 4,412 assertions.
- The Cloudflare target also compiled with `clojure -M:cljs compile db-sync`.
- Focused clj-kondo analysis reported zero errors and warnings.
- A local Node adapter with signed test JWT/JWKS authentication issued its own
  graph PAT. The actual HTTP URL batch returned 200 after a fresh graph was
  initialized with the normal built-in schema.
- Mapre's workerd runtime and durable writer against that local service persisted
  a native URL and project reference, then changed Doing to Canceled on expiry
  using the same block UUID. Infrastructure was a controlled service; no real
  Boat allocation occurred. This does not establish a production Logseq rollout.
