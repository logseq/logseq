(ns logseq.e2e.flashcards-basic-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [logseq.e2e.api :refer [ls-api-call!]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.graph :as graph]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/validate-graph)

(defn- open-flashcards
  []
  (util/double-esc)
  (when-not (w/visible? ".flashcards-nav")
    (w/click "#left-menu")
    (w/wait-for ".flashcards-nav"))
  (w/eval-js "selector => document.querySelector(selector)?.click()" ".flashcards-nav a")
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
      (assert/assert-is-visible (loc/filter "#cards-modal .text-sm.opacity-50" :has-text "1/2"))))

  (testing "an untitled #Cards block is listed by its query with page names, not uuids"
    (let [tag-a "fc-tag-a"
          card-a "Card A"
          query-a (str "[[" tag-a "]]")]
      (k/esc)
      (assert/assert-is-hidden "#cards-modal")
      (util/goto-journals)
      (let [page (ls-api-call! :editor.getCurrentPage)
            page-name (get page "name")
            cards (ls-api-call! :editor.getTag "logseq.class/Cards")
            cards-id (get cards "id")
            untitled-cards (ls-api-call! :editor.appendBlockInPage page-name ""
                                         {:properties {:block/tags #{cards-id}}})
            query-id (get untitled-cards ":logseq.property/query")]
        (ls-api-call! :editor.updateBlock query-id query-a))

      (open-flashcards)
      (w/click "#cards-modal [role='combobox']")
      (assert/assert-is-visible (loc/filter "[role='option']" :has-text query-a))
      (assert/assert-have-count
       (loc/filter "[role='option']"
                   :has-text #"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
       0)

      (w/click (loc/filter "[role='option']" :has-text query-a))
      (assert/assert-is-visible (format "#cards-modal .ls-card :text('%s')" card-a))
      (assert/assert-is-visible (loc/filter "#cards-modal .text-sm.opacity-50" :has-text "1/1")))))

(deftest flashcards-due-zero-browse-and-due-review-test
  (testing "due=0 still browses existing cards; due>0 still reviews only due cards"
    (graph/new-graph (str "flashcards-due-zero-" (random-uuid)) false)
    (util/goto-journals)
    (let [page (ls-api-call! :editor.getCurrentPage)
          page-name (get page "name")
          future-card-title "Future scheduled card"
          due-card-title "Due now card"
          future-card (ls-api-call! :editor.appendBlockInPage page-name (str future-card-title " #Card"))
          due-card (ls-api-call! :editor.appendBlockInPage page-name (str due-card-title " #Card"))
          future-uuid (get future-card "uuid")
          future-ms (+ (System/currentTimeMillis) (* 10 24 60 60 1000))]
      (ls-api-call! :editor.upsertBlockProperty future-uuid "logseq.property.fsrs/due" future-ms)

      (open-flashcards)
      (assert/assert-is-visible (format "#cards-modal .ls-card :text('%s')" due-card-title))
      (assert/assert-have-count (format "#cards-modal .ls-card :text('%s')" future-card-title) 0)
      (assert/assert-is-visible (loc/filter "#cards-modal .text-sm.opacity-50" :has-text "1/1"))

      (k/esc)
      (assert/assert-is-hidden "#cards-modal")
      (ls-api-call! :editor.upsertBlockProperty
                    (get due-card "uuid")
                    "logseq.property.fsrs/due"
                    future-ms)

      (open-flashcards)
      (select-cards-option "All cards")
      (assert/assert-have-count (loc/filter "#cards-modal" :has-text "Time to create a card!") 0)
      (assert/assert-is-visible (loc/filter "#cards-modal .text-sm.opacity-50" :has-text #"1/2"))
      (assert/assert-is-visible "#cards-modal .ls-card")
      (is (re-find #"1/2" (or (util/get-text "#cards-modal") ""))
          "due=0 All cards browse shows existing cards instead of the empty state"))))
