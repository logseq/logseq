(ns logseq.e2e.bidirectional-properties-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [logseq.e2e.api :refer [ls-api-call!]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.page :as page]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

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
                      "logseq.property.class/bidirectional-property-title"
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
