# Lower CLI OCaml Minimum to 5.1.1

## Problem

The CLI does not declare an OCaml version constraint. `cli/dune-project`
depends on `ocaml` without a lower bound, so the generated
`cli/logseq-cli.opam` file does the same. At the same time, every GitHub Actions
workflow that builds the CLI selects OCaml 5.4.0. The repository therefore
neither advertises the intended minimum nor verifies it.

The local `default` opam switch uses OCaml 5.1.1 and Dune 3.23.1. Those tool
versions are sufficient for the project metadata and the pinned CLI
dependencies, but a clean CLI test build currently stops while parsing
`cli/spec/core/cli_primitive.mli`:

```text
type keyword = Melange_edn_melange.(keyword t)
                                      ^
Error: Syntax error
```

`Module.(type_expression)` is a type-level local open, an OCaml 5.2 language
feature. The [OCaml 5.2 release notes](https://github.com/ocaml/ocaml/releases/tag/5.2.0)
identify local opens in type expressions as new in that release. Parsing all
122 checked-in `.ml` and `.mli` files with the OCaml 5.1.1 compiler found this
as the only parser incompatibility. The equivalent fully qualified type
expression
`Melange_edn_melange.keyword Melange_edn_melange.t` parses under OCaml 5.1.1.

The compiler version and the installed dependency set are separate concerns.
The current `default` switch does not have Melange or the private pinned CLI
packages installed, so it cannot build the CLI without the normal dependency
installation step. A different local switch using the same OCaml 5.1.1
compiler already contains the required dependency family, including Melange,
`melange-edn-melange`, `melange-transit-melange`, `humanize`, and `rrbvec`.
The pinned `melange-edn` and `melange-transit` packages declare OCaml
`>= 5.1.1`, `humanize` declares OCaml `>= 5.0`, and Melange publishes a
compiler-specific 5.1 package variant. No dependency inspected requires OCaml
5.2 or newer.

The goal is therefore to make OCaml 5.1.1 the explicit, continuously verified
CLI minimum so the existing `default` switch can be used after installing the
project dependencies. It is not to make a switch with missing dependencies
build the CLI without bootstrapping them.

## Proposal

Declare OCaml `>= 5.1.1` in the `logseq-cli` package dependencies in
`cli/dune-project`, then regenerate and commit `cli/logseq-cli.opam` so both
files expose the same constraint.

Replace the single OCaml 5.2-only type-level local open in
`cli/spec/core/cli_primitive.mli` with the fully qualified OCaml 5.1-compatible
type expression:

```ocaml
type keyword = Melange_edn_melange.keyword Melange_edn_melange.t
```

This is a syntax-only change to an existing alias. It does not change the
public type, runtime representation, or CLI behavior. Do not add a conditional
compatibility layer or maintain separate source paths for different compiler
versions.

Change `OCAML_VERSION` from 5.4.0 to 5.1.1 in all four workflows that build the
CLI:

- `.github/workflows/build.yml`;
- `.github/workflows/build-desktop-release.yml`;
- `.github/workflows/deps-cli.yml`; and
- `.github/workflows/cli-sync-stress.yml`.

This makes the minimum compiler the single compiler baseline for CLI unit,
E2E, dependency-update, stress, Desktop release, and npm release builds. The
released JavaScript artifacts will therefore also be produced with the 5.1.1
compiler-specific Melange variant.

Keep the normal local bootstrap command as:

```sh
cd cli
opam install . --deps-only --with-test --yes
opam exec -- dune runtest
```

The implementation must verify the dependency installation in a clean 5.1.1
switch rather than relying on packages already pinned in a developer switch.
If the existing `pin-depends` metadata does not bootstrap the private packages
in that clean environment, fix that single bootstrap path as part of this
decision; do not introduce a fallback dependency-install path.

## Alternatives considered

### Keep OCaml 5.4.0 as the minimum

Rejected because the only checked-in language dependency on OCaml 5.2 or newer
is a shorthand type expression with a direct 5.1-compatible spelling. The
inspected dependencies already support OCaml 5.1.1, and requiring a separate
5.4 switch adds local setup cost without providing a needed CLI capability.

### Declare `>= 5.1.1` without changing the source

Rejected because the declaration would be false. A clean OCaml 5.1.1 build
currently fails before type checking, and an existing Dune build directory can
hide the problem by reusing artifacts produced with a newer compiler.

### Keep the package unconstrained and rely on documentation

Rejected because opam could select an unsupported older compiler and CI would
not enforce the documented minimum. The package manifest is the authoritative
place for the compiler contract.

### Maintain separate source for OCaml 5.1 and newer compilers

Rejected because the fully qualified type is accepted by both compiler lines
and preserves the same public type. A compatibility branch or preprocessor
would add complexity without retaining a distinct capability.

## Acceptance criteria

- `cli/dune-project` declares `ocaml (>= 5.1.1)`, and the generated
  `cli/logseq-cli.opam` file contains the equivalent constraint.
- `cli/spec/core/cli_primitive.mli` contains no type-level local open and
  exposes the same `keyword` alias through fully qualified type constructors.
- In a clean opam switch whose compiler is exactly OCaml 5.1.1,
  `opam install . --deps-only --with-test --yes` succeeds from `cli/` without
  manually installing a newer compiler.
- A clean, non-cached `opam exec -- dune runtest` succeeds with OCaml 5.1.1.
- `opam exec -- pnpm cli:release` succeeds with OCaml 5.1.1, and
  `node dist/logseq.js --help` succeeds against the staged artifact.
- `bb -f cli-e2e/bb.edn test --skip-build` passes against artifacts freshly
  built with OCaml 5.1.1.
- `.github/workflows/build.yml`, `.github/workflows/build-desktop-release.yml`,
  `.github/workflows/deps-cli.yml`, and
  `.github/workflows/cli-sync-stress.yml` all select OCaml 5.1.1.
- The required GitHub Actions paths collectively exercise dependency
  bootstrap, CLI unit and E2E tests, release builds, smoke tests, and stress
  tests with OCaml 5.1.1 so a future use of OCaml 5.2-only syntax cannot merge
  or ship unnoticed.
- The existing OCaml 5.4 build remains supported because the package contract
  has no upper bound.

## Risks

- Building release artifacts with OCaml 5.1.1 selects a different
  compiler-specific Melange package variant than OCaml 5.4.0. Unit, smoke, and
  CLI E2E tests must validate the generated JavaScript rather than assuming the
  compiler downgrade is syntax-only at the artifact level.
- The private dependencies in `pin-depends` track `main`, so their future
  minimum OCaml version can move independently of this repository. The clean
  5.1.1 dependency-install CI step is the guard against that drift.
- Incremental Dune artifacts built under another switch can conceal parser
  incompatibilities. Minimum-version verification must use a clean build
  directory.
- Installing the CLI dependencies into a multipurpose `default` switch changes
  that switch's package set. This decision makes the compiler version
  sufficient; it does not promise that installing the dependencies is free of
  solver changes to unrelated packages already present in the switch.
