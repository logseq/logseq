(ns logseq.e2e.plugins-basic-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [jsonista.core :as json]
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
        estr (format "s => { const args = JSON.parse(s);const o=logseq.%1$s; return o['%2$s']?.apply(null, args || []); }" ns1 name1)
        args (json/write-value-as-string (vec args))]
    ;; (prn "Debug: eval-js #" estr args)
    (w/eval-js estr args)))

(defn- assert-api-ls-block!
  ([ret] (assert-api-ls-block! ret 1))
  ([ret-or-uuid count]
   (let [uuid' (or (get ret-or-uuid "uuid") ret-or-uuid)]
     (is (string? uuid'))
     (assert/assert-have-count (str "#ls-block-" uuid') count)
     uuid')))

(deftest editor-apis-test
  (testing "editor related apis"
    (page/new-page "test-block-apis")
    (ls-api-call! :ui.showMsg "hello world" "info")
    (let [ret (ls-api-call! :editor.appendBlockInPage "test-block-apis" "append-block-in-page-0")
          ret1 (ls-api-call! :editor.appendBlockInPage "append-block-in-current-page-0")
          _ (assert-api-ls-block! ret1)
          uuid' (assert-api-ls-block! ret)]
      (-> (ls-api-call! :editor.insertBlock uuid' "insert-0")
          (assert-api-ls-block!))
      (ls-api-call! :editor.updateBlock uuid' "append-but-updated-0")
      (k/esc)
      (w/wait-for ".block-title-wrap:text('append-but-updated-0')")
      (ls-api-call! :editor.removeBlock uuid')
      (assert-api-ls-block! uuid' 0))))

(deftest block-properties-test
  (testing "block properties related apis"
    (page/new-page "test-block-properties-apis")
    (let [ret (ls-api-call! :editor.appendBlockInPage "test-block-properties-apis" "block-in-page-0" {:properties {:p1 1}})
          uuid' (assert-api-ls-block! ret)
          prop1 (ls-api-call! :editor.getBlockProperty uuid' "p1")
          props1 (ls-api-call! :editor.getBlockProperties uuid' "p1")
          props2 (ls-api-call! :editor.getPageProperties "test-block-properties-apis")]
      (w/wait-for ".property-k:text('p1')")
      (is (= 1 (get prop1 "value")))
      (is (= (get prop1 "ident") ":plugin.property._test_plugin/p1"))
      (is (= 1 (get props1 ":plugin.property._test_plugin/p1")))
      (is (= ["Page"] (get props2 ":block/tags")))
      (ls-api-call! :editor.upsertBlockProperty uuid' "p2" "p2")
      (ls-api-call! :editor.upsertBlockProperty uuid' "p3" true)
      (ls-api-call! :editor.upsertBlockProperty uuid' "p4" {:a 1, :b [2, 3]})
      (let [prop2 (ls-api-call! :editor.getBlockProperty uuid' "p2")
            prop3 (ls-api-call! :editor.getBlockProperty uuid' "p3")
            prop4 (ls-api-call! :editor.getBlockProperty uuid' "p4")]
        (w/wait-for ".property-k:text('p2')")
        (is (= "p2" (get prop2 "value")))
        (is (true? prop3))
        (is (= prop4 {"a" 1, "b" [2 3]})))
      (ls-api-call! :editor.removeBlockProperty uuid' "p4")
      ;; wait for react re-render
      (util/wait-timeout 16)
      (is (nil? (w/find-one-by-text ".property-k" "p4")))
      (ls-api-call! :editor.upsertBlockProperty uuid' "p3" false)
      (ls-api-call! :editor.upsertBlockProperty uuid' "p2" "p2-updated")
      (w/wait-for ".block-title-wrap:text('p2-updated')")
      (let [props (ls-api-call! :editor.getBlockProperties uuid')]
        (is (= (get props ":plugin.property._test_plugin/p3") false))
        (is (= (get props ":plugin.property._test_plugin/p2") "p2-updated"))))))

(deftest property-related-test
  (testing "properties management related apis"
    (dorun
     (map-indexed
      (fn [idx property-type]
        (let [property-name (str "property-" idx)
              _ (ls-api-call! :editor.upsertProperty property-name {:type property-type})
              property (ls-api-call! :editor.getProperty property-name)]
          (is (= (get property "ident") (str ":plugin.property._test_plugin/" property-name)))
          (is (= (get property "type") property-type))
          (ls-api-call! :editor.removeProperty property-name)
          (is (nil? (ls-api-call! :editor.getProperty property-name)))))
      ["default" "number" "date" "datetime" "checkbox" "url" "node" "json" "string"]))))
