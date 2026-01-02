# Logseq Agent Guidelines

## Repository Layout
- `src/main/`: Core application logic (ClojureScript)
  - `src/main/frontend/components/`: UI components (Rum/React)
  - `src/main/frontend/handler/`: Business logic and event handlers
  - `src/main/frontend/db/`: Database operations (DataScript)
  - `src/main/frontend/worker/`: Web workers for background tasks
  - `src/electron/`: Electron-specific desktop code
- `src/test/`: Unit tests
- `deps/`: Internal Clojure modules
- `clj-e2e/`: End-to-end tests
- `packages/`: UI and other packages

## Build/Lint/Test Commands

### Quick Validation (Run Before Every Commit)
```bash
# Lint ClojureScript code
yarn cljs:lint

# Run unit tests
yarn test

# Style linting
yarn style:lint

# Full validation script (recommended)
./validate-local.sh
```

### Single Test Execution
```bash
# Run focused unit test (add ^:focus metadata to test)
(deftest ^:focus my-test ...)
bb dev:test -i focus

# Run specific namespace tests
bb dev:test src/test/frontend/components/block_test.cljs

# Run E2E tests
bb dev:e2e-basic-test
```

### Development Commands
```bash
# Start development server (all platforms)
yarn dev

# Watch specific platform
yarn watch              # Desktop web
yarn electron-watch     # Desktop electron
yarn mobile-watch       # Mobile development

# Build commands
yarn release-mobile     # Mobile build (like CI)
yarn release-electron   # Electron build
yarn release-app        # Web app build
```

### Advanced Testing & Linting
```bash
# Full lint + test suite (CI equivalent)
bb dev:lint-and-test

# Code quality checks
bb lint:large-vars      # Find overly large functions
bb lint:carve           # Find unused variables
bb lint:ns-docstrings   # Check namespace docs
bb lint:kondo-git-changes  # Lint only changed files

# Config validation
bb dev:validate-global-config-edn
bb dev:validate-repo-config-edn
bb dev:validate-plugins-edn
bb dev:validate-ast

# Generate linting config
bb dev:gen-malli-kondo-config
```

## Code Style Guidelines

### Naming Conventions

#### Functions & Variables
- **kebab-case**: `get-page`, `update-block`, `safe-path?`
- **Predicates**: End with `?` - `valid?`, `empty?`, `exists?`
- **Side effects**: Use `!` suffix - `save!`, `delete!`, `update!`
- **Constants**: `SCREAMING_SNAKE_CASE` - `MAX_FILE_SIZE`

#### Namespaces
- **frontend.* **: Web-specific code
- **electron.* **: Desktop-specific code
- **mobile.* **: Mobile-specific code
- **db.* **: Database operations
- **handler.* **: Business logic

#### Keywords & Specs
- Use `logseq.common.defkeywords/defkeyword` for common keywords
- Define specs with meaningful names
- Search for `defkeywords` to find all keyword definitions

### Imports & Requires

#### Namespace Imports
```clojure
;; Good: Group related imports
(ns my-namespace
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]))

;; Avoid: Long import lists without grouping
(ns my-namespace
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]
            [logseq.util :as util]))
```

#### Java Interop
```clojure
;; Good: Direct Java class/method access
(java.util.UUID/randomUUID)
(java.time.Instant/now)

;; Avoid: Importing Java classes unnecessarily
;; (CLJS allows direct access)
```

### Function Design

#### Pure Functions Preferred
```clojure
;; Good: Pure functions
(defn calculate-score [stats]
  (+ (:points stats) (:bonus stats)))

;; Avoid: Functions with side effects in name
(defn update-and-save-score! [stats] ; ! indicates side effect
  (let [new-score (calculate-score stats)]
    (save-to-db! new-score)
    new-score))
```

#### Parameter Validation
```clojure
;; Good: Early validation with clear error messages
(defn process-file [path]
  (when-not (string? path)
    (throw (ex-info "Path must be a string" {:path path})))
  ;; ... processing logic
  )
```

#### Function Length
- Max 20-30 lines per function
- Extract helper functions for complex logic
- Use `bb lint:large-vars` to check function sizes

### Error Handling

#### Use ex-info for Structured Errors
```clojure
;; Good: Structured error information
(throw (ex-info "Invalid file format"
                {:file file-path
                 :expected-format "markdown"
                 :actual-format detected-format}))

;; Avoid: Generic error messages
(throw (Exception. "Something went wrong"))
```

#### Logging with glogi
```clojure
;; Good: Structured logging
(require '[lambdaisland.glogi :as log])

(log/info :file-processed {:path file-path :size size})
(log/error :db-error {:operation "save" :error error})

;; Avoid: Console logging
(js/console.log "Processing file" file-path)
```

### Data Structures & Immutability

#### Prefer Persistent Data Structures
```clojure
;; Good: Immutable updates
(def updated-user
  (assoc user :last-login (js/Date.)))

;; Good: Threading for complex updates
(defn update-user-stats [user stats]
  (-> user
      (assoc :stats stats)
      (update :login-count inc)))

;; Avoid: Direct mutation (except for atoms when necessary)
(swap! some-atom #(assoc % :key value))
```

#### Map Operations
```clojure
;; Good: Keyword keys
{:user-id 123 :name "Alice" :active? true}

;; Avoid: String keys (unless interop required)
{"user-id" 123 "name" "Alice"}
```

### Database & State Management

#### Datascript Patterns
```clojure
;; Good: Use db parameter, not conn for read operations
(defn get-page [db page-id]
  (d/pull db '[*] [:page/id page-id]))

;; Good: Use conn parameter for write operations
(defn save-page! [conn page-data]
  (d/transact! conn [page-data]))

;; Avoid: Using conn for read operations
(defn get-page [conn page-id] ; conn implies mutability
  (d/pull @conn [:page/id page-id]))
```

#### State Management
```clojure
;; Good: Descriptive state keys
(def initial-state
  {:current-page nil
   :loading? false
   :error-message nil})

;; Avoid: Generic keys
{:page nil :loading false :error nil}
```

### Component Patterns (Rum/React)

#### Component Structure
```clojure
;; Good: Clear component structure
(rum/defc page-header [page-title user]
  [:div.header
   [:h1 page-title]
   (user-avatar user)])

;; Avoid: Large components - break into smaller pieces
(rum/defc huge-component [data]
  ;; 100+ lines of JSX/mixed logic
  )
```

#### Props & State
```clojure
;; Good: Destructure props clearly
(rum/defc user-card [{:keys [name email avatar-url]}]
  [:div.user-card
   [:img {:src avatar-url}]
   [:div name]
   [:div email]])

;; Avoid: Generic prop names
(rum/defc user-card [user-data]
  [:div (:name user-data)]) ; unclear what user-data contains
```

### Testing Guidelines

#### Unit Test Structure
```clojure
;; Good: Clear test structure
(deftest page-creation-test
  (testing "valid page creation"
    (let [page-data {:title "Test Page" :content "Content"}
          result (create-page page-data)]
      (is (= "Test Page" (:title result)))
      (is (uuid? (:id result))))))

;; Good: Use testing macros appropriately
(deftest ^:focus focused-test  ; Run only this test
  (is (= 4 (+ 2 2))))
```

#### Mocking Strategy
```clojure
;; Good: Mock external dependencies
(with-redefs [api-call (constantly {:status 200 :data test-data})]
  (let [result (fetch-user-data 123)]
    (is (= test-data (:data result)))))
```

### Performance Considerations

#### Avoid Common Pitfalls
```clojure
;; Avoid: Converting large Uint8Arrays to vectors
(vec large-uint8-array) ; Very slow for large arrays

;; Good: Work with arrays directly or use specific operations
(aget large-uint8-array 0)

;; Avoid: Memoizing functions with mutable parameters
(def slow-memoized-fn
  (memoize (fn [entity] (expensive-calc entity)))) ; Memory leak

;; Good: Memoize pure functions only
(def fast-memoized-fn
  (memoize (fn [pure-data] (expensive-calc pure-data))))
```

### Code Organization

#### File Structure
- One namespace per file
- Related functions grouped together
- Public API functions first, helpers below
- Clear separation between data, logic, and UI

#### Comments & Documentation
```clojure
;; Good: Explain why, not what
(defn complex-calculation [data]
  ;; Use approximation for performance with large datasets
  ;; Exact calculation would be O(n^2) vs O(n) approximation
  (approximate-calc data))

;; Avoid: Obvious comments
(defn add [a b]
  ;; Add two numbers
  (+ a b))
```

### Review Checklist (from prompts/review.md)

- [ ] Use `empty?` instead of `empty` for boolean contexts
- [ ] Functions without `d/transact!` should use `db` param, not `conn`
- [ ] `cljs-time.format/formatter` with const args should be constants
- [ ] Avoid `memoize` with mutable parameters (entity/block/conn/db)
- [ ] Use `doseq` instead of `dorun` for side effects
- [ ] Use `lambdaisland.glogi` for logging instead of `js/console.*`
- [ ] Update migrations when adding new properties
- [ ] Update keyword definitions when adding common keywords
- [ ] Promise-returning functions should start with `<`
- [ ] Avoid converting `js/Uint8Array` to vector

## Cursor/Copilot Rules

No specific Cursor rules (.cursor/rules/) or Copilot rules (.github/copilot-instructions.md) found in this repository.