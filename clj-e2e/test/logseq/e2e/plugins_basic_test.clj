(ns logseq.e2e.plugins-basic-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.fixtures :as fixtures]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page)

(defn- to-snake-case
  "Converts a string to snake_case. Handles camelCase, PascalCase, spaces, hyphens, and existing underscores.
   Examples:
     'HelloWorld' -> 'hello_world'
     'Hello World' -> 'hello_world'
     'hello-world' -> 'hello_world'
     'Hello__World' -> 'hello_world'"
  [s]
  (when (string? s)
    (-> s
      ;; Normalize input: replace hyphens/spaces with underscores, collapse multiple underscores
      (clojure.string/replace #"[-\s]+" "_")
      ;; Split on uppercase letters (except at start) and join with underscore
      (clojure.string/replace #"(?<!^)([A-Z])" "_$1")
      ;; Remove redundant underscores and trim
      (clojure.string/replace #"_+" "_")
      (clojure.string/trim)
      ;; Convert to lowercase
      (clojure.string/lower-case))))

(defn- ls-api-call!
  [tag & args]
  (let [tag (name tag)
        ns' (string/split tag #"\.")
        ns? (and (seq ns') (= (count ns') 2))
        ns1 (string/lower-case (if ns? (str "sdk." (first ns')) "api"))
        name1 (if ns? (to-snake-case (last ns')) tag)]
    (w/eval-js
      (format "args => { const o=logseq.%1$s; return o['%2$s']?.apply(null, args || []); }" ns1 name1)
      (vec args))))

(deftest apis-related-test
  (testing "block related apis"
    (ls-api-call! :ui.showMsg "hello world" "error")))
