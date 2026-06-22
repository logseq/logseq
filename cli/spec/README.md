# Spec Layout

The spec virtual library is organized by capability boundary instead of an
abstract layer number.

Dependency direction:

```text
core -> domain -> runtime/formatting -> commands -> cli
```

Rules:

- `core` contains primitive shared contracts and must not depend on other spec
  groups.
- `domain` contains Logseq domain model contracts and may depend on `core`.
- `runtime` contains external runtime boundaries such as transport, server, and
  auth state. It may depend on `core` and `domain`.
- `formatting` contains presentation and shared formatting contracts. It may
  depend on `core` and `domain`.
- `commands` contains command contracts. It may depend on `core`, `domain`,
  `runtime`, and `formatting`.
- `cli` contains top-level CLI assembly contracts. It may depend on lower groups.
- Command modules should not depend on each other. Move shared command data to
  `domain` or a clearly named shared contract before adding cross-command
  dependencies.
