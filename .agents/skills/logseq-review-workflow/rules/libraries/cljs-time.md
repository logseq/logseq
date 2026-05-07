# cljs-time Review Rules

Apply when a change touches `cljs-time`, especially `cljs-time.format/formatter`, date parsing, date formatting, or repeated time formatter construction.

## Review focus

- If `cljs-time.format/formatter` arguments are constants, define the formatter once instead of rebuilding it repeatedly.
- Date parsing and formatting should make timezone, locale, and expected input shape explicit when those details affect behavior.
- Hot paths should not allocate equivalent formatter instances repeatedly.

## Red flags

- Calling `cljs-time.format/formatter` inside render loops, query loops, or repeated conversions with constant arguments.
- Parsing user or persisted date strings without clear expected format.
- Changing formatter behavior without tests for representative dates.

## Review questions

- Can the formatter be a namespace-level constant?
- Does the change affect persisted date strings or user-visible date output?
- Are timezone and locale assumptions intentional?
