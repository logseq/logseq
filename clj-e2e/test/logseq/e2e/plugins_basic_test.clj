(ns logseq.e2e.plugins-basic-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.page :as page]
   [logseq.e2e.util :as util]
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
        inbuilt? (contains? #{"app" "editor"} (first ns'))
        ns1 (string/lower-case (if (and ns? (not inbuilt?))
                                 (str "sdk." (first ns')) "api"))
        name1 (if ns? (to-snake-case (last ns')) tag)
        estr (format "args => { const o=logseq.%1$s; return o['%2$s']?.apply(null, args || []); }" ns1 name1)]
    ;(prn "Debug: eval-js #" estr (vec args))
    (w/eval-js estr (vec args))))

(defn- assert-api-ls-block!
  ([ret] (assert-api-ls-block! ret 1))
  ([ret-or-uuid count]
   (let [uuid' (or (get ret-or-uuid "uuid") ret-or-uuid)]
     (is (string? uuid'))
     (assert/assert-have-count (str "#ls-block-" uuid') count)
     uuid')))

(deftest apis-related-test
  (testing "block related apis"
    (page/new-page "test-apis")
    (ls-api-call! :ui.showMsg "hello world" "error")
    (let [ret (ls-api-call! :editor.appendBlockInPage "test-apis" "append-block-in-page-0")
          uuid' (assert-api-ls-block! ret)]
      (-> (ls-api-call! :editor.insertBlock uuid' "insert-0")
        (assert-api-ls-block!))
      (ls-api-call! :editor.updateBlock uuid' "append-but-updated-0")
      (k/esc)
      (w/wait-for ".block-title-wrap:text('append-but-updated-0')")
      (ls-api-call! :editor.removeBlock uuid')
      (assert-api-ls-block! uuid' 0))))
