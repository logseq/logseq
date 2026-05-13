# lambdaisland.glogi Review Rules

Apply when a change adds, removes, or edits logging, `js/console.*` calls, error reporting, or `lambdaisland.glogi` usage.

## Review focus

- Prefer `lambdaisland.glogi` for application logging instead of raw `js/console.*`.
- Require `[lambdaisland.glogi :as log]` when logging is needed.
- Replace `js/console.error` with `log/error`.
- Replace `js/console.warn` with `log/warn`.
- Replace `js/console.log` with `log/info`.
- `log/<level>` functions take key-value pairs as arguments.
- Logs should include enough context to debug the failure without leaking sensitive graph content.

## Red flags

- Raw `js/console.*` in shipped application paths.
- Logging calls that drop the exception/error value.
- Logs containing raw user graph content, credentials, tokens, or full sync payloads.
- `log/<level>` calls using free-form positional strings where key-value context is expected.

## Review questions

- Is this developer-only output or application logging?
- Is the log level appropriate for expected frequency and severity?
- Does the log preserve enough context to debug the issue?
- Could the logged values expose private graph data?
