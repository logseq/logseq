(ns logseq.e2e.bidirectional-properties-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is testing use-fixtures]]
            [jsonista.core :as json]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.page :as page]
            [wally.main :as w]
            [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(defn- to-snake-case
  "Converts a string to snake_case. Handles camelCase, PascalCase, spaces, hyphens, and existing underscores."
  [s]
  (when (string? s)
    (-> s
        (string/replace #"[-\s]+" "_")
        (string/replace #"(?<!^)([A-Z])" "_$1")
        (string/replace #"_+" "_")
        (string/trim)
        (string/lower-case))))

(defn- ls-api-call!
  [tag & args]
  (let [tag (name tag)
        ns' (string/split tag #"\.")
        ns? (and (seq ns') (= (count ns') 2))
        inbuilt? (contains? #{"app" "editor"} (first ns'))
        ns1 (string/lower-case (if (and ns? (not inbuilt?))
                                 (str "sdk." (first ns')) "api"))
        name1 (if ns? (to-snake-case (last ns')) tag)
        estr (format "s => { const args = JSON.parse(s);const o=logseq.%1$s; return o['%2$s']?.apply(null, args || []); }"
                     ns1
                     name1)
        args (json/write-value-as-string (vec args))]
    (w/eval-js estr args)))

(deftest bidirectional-properties-test
  (testing "shows reverse property references when a class enables bidirectional properties"
    (let [friend-prop "friend"
          person-tag "Person"
          project-tag "Project"
          target "Bob"
          container-page "Bidirectional Props"]
      (ls-api-call! :editor.createTag person-tag
                    {:tagProperties [{:name friend-prop
                                      :schema {:type "node"}}]})
      (ls-api-call! :editor.createTag project-tag)
      (let [person (ls-api-call! :editor.getTag person-tag)
            person-uuid (get person "uuid")
            friend (ls-api-call! :editor.getPage friend-prop)]
        (ls-api-call! :editor.upsertBlockProperty (get friend "id")
                      "logseq.property/classes"
                      (get person "id"))
        (is (string? person-uuid))
        (ls-api-call! :editor.upsertBlockProperty person-uuid
                      "logseq.property.class/title-plural"
                      "People")
        (ls-api-call! :editor.upsertBlockProperty person-uuid
                      "logseq.property.class/enable-bidirectional?"
                      true))
      (ls-api-call! :editor.createPage target)
      (ls-api-call! :editor.createPage container-page)
      (let [bob (ls-api-call! :editor.getPage target)
            bob-id (get bob "id")]
        (ls-api-call! :editor.insertBlock container-page (str "Alice #" person-tag)
                      {:properties {friend-prop bob-id}})
        (ls-api-call! :editor.insertBlock container-page (str "Charlie #" project-tag)
                      {:properties {friend-prop bob-id}}))

      (page/goto-page target)
      (w/wait-for ".property-k:text('People')")
      (assert/assert-is-visible ".property-value .block-title-wrap:text('Alice')")
      (assert/assert-have-count ".property-k:text('Projects')" 0))))
