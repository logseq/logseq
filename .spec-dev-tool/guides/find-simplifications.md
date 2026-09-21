# Repository-Specific Simplification Rules

## Production corpus

- Treat `src/main`, `src/electron`, `deps/*/src`, `deps/*/worker`,
  `static`, `resources`, runtime scripts, migrations, and package/build
  metadata as production unless a narrower owner document proves otherwise.
- Treat command-line entry points, worker resource renderers, IPC/event
  handlers, Datascript schemas, built-in properties/classes, migrations, and
  import/export formats as supported contracts.

## Non-production and ambiguous corpus

- Treat `src/test`, `deps/*/test`, `clj-e2e`, `cli-e2e`, fixtures, benchmark
  helpers, examples, and docs as non-production evidence, not as automatic
  deletion targets.
- Treat scripts, generated test artifacts, and development-only helpers as
  ambiguous until their call sites and package metadata prove whether they are
  shipped, CI-only, or local-only.

## Excluded edit targets

- Do not edit generated, vendored, lockfile, build-output, or distribution
  artifacts as simplification targets unless the generator or packaging rule is
  the actual surface being simplified.
- Do not remove migrations, schema history, translation keys, public command
  options, import/export compatibility, or persisted data handling without a
  separate behavior-changing decision.

## Protected surfaces

- Preserve persisted DB shape, Datascript schema semantics, sync/RTC
  protocols, render-resource envelopes, resource watch keys, import/export
  output, CLI output/options, Electron IPC contracts, and i18n key semantics.
- Preserve fail-fast behavior and one clear code path; do not replace explicit
  validation with silent defaults or compatibility fallbacks.

## Candidate priorities

- Prefer simplifications that remove mirrored state, duplicate resource keys,
  unused compatibility layers, speculative abstractions, single-use wrappers,
  or stale feature residue.
- Prefer local deletion and clearer ownership over broad rewrites. A candidate
  should reduce concepts or obligations, not just move complexity.

## Dependency policy

- Reuse existing repository libraries and helpers before introducing a new
  dependency.
- Replacing hand-rolled code with a dependency is a simplification only when
  the dependency is already allowed, maintained, and reduces total code and
  contracts.

## Required evidence

- Search for Clojure/CLJS symbols, keyword values, resource keys, command names,
  event names, config keys, generated references, and dynamic registrations
  before calling a surface unused.
- Read both caller and callee paths. Distinguish production use from test-only
  coverage and documentation mentions.
- For public or persisted contracts, identify the compatibility promise that is
  preserved or explain why no supported external consumer exists.

## Validation

- Run the narrowest relevant unit tests first, then broader namespaces when
  helper behavior is shared.
- Use `bb dev:test -v <namespace/test>` for frontend/unit targets and
  `pnpm --dir deps/db test-v <namespace/test>` for `deps/db` targets.
- Run `spec-dev-tool check --all` before completing work that creates or
  updates agent decision documents.
