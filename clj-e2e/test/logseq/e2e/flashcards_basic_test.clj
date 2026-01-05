(ns logseq.e2e.flashcards-basic-test
  (:require [clojure.test :refer [deftest testing use-fixtures]]
            [logseq.e2e.api :refer [ls-api-call!]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]
            [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/validate-graph)

(defn- open-flashcards
  []
  (util/double-esc)
  (k/press ["t" "c"])
  (assert/assert-is-visible "#cards-modal"))

(defn- select-cards-option
  [label]
  (w/click "#cards-modal [role='combobox']")
  (w/click (loc/filter "[role='option']" :has-text label)))

(defn- click-flashcards-plus
  []
  (w/click "#ls-cards-add"))

(defn- setup-flashcards-data!
  [{:keys [page-name tag-a tag-b card-a card-b query-a query-b]}]
  (ls-api-call! :editor.appendBlockInPage page-name (str card-a " #Card #" tag-a))
  (ls-api-call! :editor.appendBlockInPage page-name (str card-b " #Card #" tag-b))
  (let [cards (ls-api-call! :editor.getTag "logseq.class/Cards")
        cards-id (get cards "id")
        cards-a (ls-api-call! :editor.appendBlockInPage page-name "Cards A"
                              {:properties {:block/tags #{cards-id}}})
        cards-b (ls-api-call! :editor.appendBlockInPage page-name "Cards B"
                              {:properties {:block/tags #{cards-id}}})
        query-a-id (get cards-a ":logseq.property/query")
        query-b-id (get cards-b ":logseq.property/query")]
    (ls-api-call! :editor.updateBlock query-a-id query-a)
    (ls-api-call! :editor.updateBlock query-b-id query-b)))

(deftest flashcards-plus-and-switching-test
  (testing "create #Cards blocks from flashcards dialog and switch card sets"
    (let [tag-a "fc-tag-a"
          tag-b "fc-tag-b"
          card-a "Card A"
          card-b "Card B"
          query-a (str "[[" tag-a "]]")
          query-b (str "[[" tag-b "]]")]
      (util/goto-journals)
      (let [page (ls-api-call! :editor.getCurrentPage)
            page-name (get page "name")]
        (setup-flashcards-data!
         {:page-name page-name
          :tag-a tag-a
          :tag-b tag-b
          :card-a card-a
          :card-b card-b
          :query-a query-a
          :query-b query-b}))

      (open-flashcards)
      (click-flashcards-plus)
      (w/wait-for ".ls-block .tag:has-text('Cards')")

      (open-flashcards)
      (select-cards-option "Cards A")
      (assert/assert-is-visible (format "#cards-modal .ls-card :text('%s')" card-a))
      (assert/assert-have-count (format "#cards-modal .ls-card :text('%s')" card-b) 0)
      (assert/assert-is-visible (loc/filter "#cards-modal .text-sm.opacity-50" :has-text "1/1"))

      (select-cards-option "Cards B")
      (assert/assert-is-visible (format "#cards-modal .ls-card :text('%s')" card-b))
      (assert/assert-have-count (format "#cards-modal .ls-card :text('%s')" card-a) 0)
      (assert/assert-is-visible (loc/filter "#cards-modal .text-sm.opacity-50" :has-text "1/1"))

      (select-cards-option "All cards")
      (assert/assert-is-visible (loc/filter "#cards-modal .text-sm.opacity-50" :has-text "1/2")))))
