# Clojure and ClojureScript Review Rules

Apply when a change touches Clojure, ClojureScript, or Clojure common code and no more specific library/module file owns the rule.

## Review focus

- Use `empty?` when a boolean emptiness check is intended; do not use `empty` as a predicate.
- Prefer `doseq` for side effects; do not use `dorun` only to force side effects.
- Prefer hyphenated map keyword names such as `:user-id`, not underscore names such as `:user_id`.
- Avoid shadowing important local names; for example, prefer `payload` over shadowing `bytes`.
- `util/web-platform?` is not a function; check call sites carefully.
- Do not convert large `js/Uint8Array` values with `(vec uint8-array)` because it is slow for large payloads such as assets.

## Red flags

- Predicate positions using `empty` instead of `empty?`.
- Lazy sequence forcing only to run side effects.
- Large JS typed arrays converted into persistent vectors.
- New underscore keyword names in Clojure maps.
- Calling vars that are values/config flags as functions.

## Review questions

- Is this a language-level issue, or does a more specific module/library file own it?
- Is laziness changing when side effects run?
- Could a data conversion copy large payloads unnecessarily?
- Are keyword names consistent with repository conventions?
