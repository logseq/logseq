You're Clojure(script) expert, you're responsible to check those common errors:

- `empty?` should be used instead of `empty` when a boolean value is expected in an expression.

- If a function does not use `d/transact!`, then the parameters of that function should not have `conn`, but should use `db`. `conn` is mutable, and `db` is immutable.

- If the arguments of `cljs-time.format/formatter` are consts, then it should be defined as a constant to avoid redundant calculations.

- Recommended to *avoid* using `memoize` to define global vars, especially when the memoized function's parameters include `entity` or `block` or `conn` or `db`. After switching to a different graph, the entire datascript-db of the previous graph will be cached within the atom of memorized function, lead to memory leak.

- Avoid using `dorun` to execute side effects; `doseq` is recommended.

- `util/web-platform?` is a not a function.

- It is recommended to use `lambdaisland.glogi` for printing logs.
  - Require `[lambdaisland.glogi :as log]` if needed.
  - Replace `js/console.error` with `log/error`.
  - Replace `js/console.warn` with `log/warn`.
  - Replace `js/console.log` with `log/info`.
  - NOTE: `log/<level>` function takes key-value pairs as arguments
  
- After adding a new property in `logseq.db.frontend.property/built-in-properties`, you need to add a corresponding migration in `frontend.worker.db.migrate/schema-version->updates`.
  - e.g. `["65.9" {:properties [:logseq.property.embedding/hnsw-label-updated-at]}]`

- If common keywords are added or modified, make corresponding changes in their definitions.
