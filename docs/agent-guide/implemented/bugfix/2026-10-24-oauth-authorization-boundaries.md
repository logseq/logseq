# Enforce OAuth Authorization Boundaries

## Problem

PR #13830 accepts cross-origin login forms, ignores callback state in its example,
buffers unbounded form bodies, and consumes grants before replacement tokens are
persisted. Token responses also omit cache restrictions. The stored redirect URI
reader masks corrupt data despite a single canonical writer.

## Decision

The user requested review, simplification, and fixes for this PR on 2026-10-24.
Reject browser login forms without an exact same-origin Origin, validate the
example callback against its pending request, bound streamed form reads, disable
caching of token responses, and atomically exchange grants for token pairs.
Decode canonical redirect URI JSON directly. Stop copying unused account identity
into login sessions; retain the original SQL columns to preserve migration history.
Bound expiry cleanup to 100 rows per OAuth table during login/consent/token issuance and
add a subsequent D1 migration for expiry and graph-deletion indexes. Move app
workflow translations to their sync owner. Preserve graph/scope binding,
PKCE, public routes, app approval, and supported Node and Worker adapters.

## Alternatives considered

### Pre-login sessions

A separate anonymous session and nonce adds persistent state. Exact Origin
validation suffices for the browser-only password form and rejects missing or
opaque origins. The cross-origin token endpoint remains available to clients.

### Sequential grant writes

Retaining sequential writes leaves clients stranded after a database failure.
Use the existing SQLite transaction boundary and D1 atomic batch semantics.

## Acceptance criteria

- Cross-origin and missing-origin login requests cannot authenticate or set cookies.
- Missing or mismatched callback state cannot exchange codes.
- Oversized form streams stop at the limit, and valid forms still parse.
- Failed issuance leaves the grant available and no partial replacement pair.
- Concurrent exchanges have one winner; token responses cannot be cached.
- Expired records are removed in bounded indexed batches while live grants remain usable.
- Focused regressions, existing db-sync tests, and lint pass.

## Risks

- Strict Origin validation requires browser password forms to originate on the
server origin. The two database adapters must preserve atomic single-use grants.

## Review results

Reviewed the 34 files in PR #13830 using correctness, data contract, regression,
failure mode, migration validation, performance, test coverage, repository
convention, and system additions passes. No graph attributes changed, so no
frontend schema version, property migration, or tx-sanitize update is required.

| Severity | Confirmed issue | Resolution |
| --- | --- | --- |
| Important | Cross-origin login installed an authenticated browser session | Require exact same-origin Origin; HTML uses same-origin referrer policy so real form posts retain Origin |
| Important | Failed replacement inserts consumed usable authorization codes/refresh tokens | Atomically insert the pair and consume the grant; guard concurrent exchanges in SQL |
| Important | Form limit applied only after buffering the entire body | Count streamed bytes and cancel once the 16 KiB cap is exceeded |
| Important | Expired records and consumed refresh tokens accumulated | Bounded indexed expiry cleanup during login, consent and issuance; delete consumed refresh records |
| Important | Demo callback ignored its stored state | Validate pending state/verifier and returned state/code before exchange |
| Minor | Token responses lacked cache restrictions | Set no-store and no-cache on protocol success/error responses |
| Minor | Corrupt redirect JSON silently became an empty list | Reject invalid persisted shapes without fallback/coercion |
| Minor | Unused account identity was copied into OAuth sessions | Stop writing and reading email/username; preserve migration history |
| Minor | App translations used the settings-shell owner | Move the workflow keys to sync.oauth-app in both real locales |

## System additions assessment

| Category | Disposition and evidence |
| --- | --- |
| Files/modules | Retain protocol, HTTP, HTML and frontend separation; each has a concrete consumer and runtime |
| DB schema | Retain five OAuth tables and SQL history; add indexed cleanup through migration 0009 |
| Long-running code | Retain bounded preview polling/servers; add no production scheduler |
| Dependencies | Retain existing dependencies; no new package introduced |
| Configuration/flags | Retain opt-in preview setup and existing Cognito/admin configuration |
| Global state/caches | Retain owner-local UI and browser state; no new shared cache |
| Exposed contracts | Retain public OAuth/app-management routes and graph/scope binding; require browser origin for password submission |
| Persisted artifacts | Retain isolated preview files and pending PKCE state; simplify expired-record retention and unused identity copies |
| Execution boundaries | Retain existing Worker/Node runtimes and offline demo processes |
| Abstractions/branches | Replace sequential token writers with one atomic operation; simplify canonical redirect parsing |

Worker pages keep their existing runtime-local three-language copy: importing
renderer translation state into the server is not justified by this review.
The required OAuth token prefix column remains; removing schema history for a
single unused display helper would add migration obligations without a current
behavioral benefit. PAT prefixes still have real listing consumers.

## Verification

Before fixes, the original 259 tests passed. New regressions reproduced session
creation from cross-origin/missing-origin login, full oversized-stream reads,
unusable grants after injected insertion failures, and callback state mismatch.
The bounded code-cleanup test separately reproduced 250 expired rows remaining
where 150 were expected after a cleanup batch.

After fixes:

- Compiled db-sync-test, db-sync-node and db-sync with zero warnings.
- Ran the compiled db-sync suite: 265 tests, 4709 assertions, zero failures/errors.
- Ran node --test for app.test.mjs and delete_user_totally.test.js: 14 passed.
- Real SQLite tests cover both failed insert positions, retry, concurrent code
  exchange, immediate rejection of a live token, expiry cleanup and its 100-row bound.
- Ran /tmp/pr13830-d1-probe.cjs against local Miniflare/workerd D1: injected
  second-insert failure rolled back; original code retried successfully; replay
  inserted no token rows. The probe loads the compiled production index functions.
- Applied migrations 0001 through 0009 in SQLite; reapplied 0009 successfully.
  EXPLAIN QUERY PLAN uses the new indexes for all four expiry scans and graph cleanup.
- A fresh isolated browser completed login, graph selection, consent, callback,
  task creation and refresh. Refresh succeeded with no-store; replay returned 400.
  Tampered callback state displayed Invalid sign-in callback. A cross-origin
  login attempt was rejected (browser CORS blocked access to its HTML response).
  Separate real HTTP probes confirmed cross-origin, opaque and missing Origin
  each returned 400 without Set-Cookie.
- clj-kondo over db-sync src/test and the frontend API/component: zero warnings/errors.
- bb lint:carve and bb lint:large-vars passed in deps/db-sync.
- Translation validation, hardcoded-string lint and canonical dictionary formatting passed.
- git diff --check and spec-dev-tool check --all passed.

The OAuth browser preview uses the documented local Cognito stand-in. Production
Cognito and the Desktop Developer settings panel were not exercised. No real user
graph or deployed database was modified. Apply migration 0009 before deployment.

## Consequences

- Browser password forms require exact same-origin Origin; OAuth token clients remain cross-origin.
- Failed token persistence preserves the original grant for retry.
- Existing SQL history is retained and deployments must apply migration 0009.

## Questions

None. Scope is authorized by the review, simplify, and fix request.
