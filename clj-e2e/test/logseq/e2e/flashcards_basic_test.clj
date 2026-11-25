(ns logseq.e2e.flashcards-basic-test
  (:require [clojure.test :refer [deftest testing use-fixtures]]
            [logseq.e2e.api :refer [ls-api-call!]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.fixtures :as fixtures]
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

(defn- set-flashcards-enabled!
  [enabled?]
  (ls-api-call! :app.setCurrentGraphConfigs {"feature/enable-flashcards?" enabled?})
  (.waitForFunction (w/get-page)
                    "async enabled => (await logseq.api.get_user_configs()).enabledFlashcards === enabled"
                    enabled?))

(defn- press-flashcards-shortcut!
  [first-key second-key]
  (util/double-esc)
  (assert/assert-in-normal-mode?)
  (k/press first-key)
  (k/press second-key))

(defn- assert-card-tag-suggestions
  [query enabled?]
  (util/double-esc)
  (let [journal (ls-api-call! :editor.getCurrentPage)
        note (ls-api-call! :editor.appendBlockInPage (get journal "name") "Sample note")]
    (w/click (format ".ls-block[blockid='%s'] .block-content" (get note "uuid"))))
  (util/move-cursor-to-end)
  (util/press-seq (str " #" query) {:delay 20})
  (let [options "#ui__ac a.menu-link > span"
        assert-visibility (if enabled? assert/assert-is-visible assert/assert-is-hidden)]
    (assert/assert-is-visible (loc/filter options :has-text "Card sample"))
    (assert-visibility (loc/filter options :has-text #"^\s*Card\s*$"))
    (assert-visibility (loc/filter options :has-text #"^\s*Cards\s*$")))
  (util/double-esc))

(deftest flashcards-feature-flag-gates-shortcuts-and-tags-test
  (ls-api-call! :editor.createTag "Card sample")
  (util/goto-journals)
  (let [journal (ls-api-call! :editor.getCurrentPage)
        cards (ls-api-call! :editor.getTag "logseq.class/Cards")
        deck (ls-api-call! :editor.appendBlockInPage (get journal "name") "Sample deck"
                           {:properties {:block/tags #{(get cards "id")}}})
        practice (format ".ls-block[blockid='%s'] button:text-is('Practice')" (get deck "uuid"))]
    (try
      (testing "disabling Flashcards prevents review and hides built-in tag suggestions"
        (assert/assert-is-visible practice)
        (set-flashcards-enabled! false)
        (assert/assert-is-hidden practice)
        (doseq [[first-key second-key] [["g" "f"] ["t" "c"]]]
          (press-flashcards-shortcut! first-key second-key)
          (assert/assert-is-hidden "#cards-modal"))
        (assert-card-tag-suggestions "" false)
        (.reload (w/get-page))
        (assert/assert-graph-loaded?)
        (assert-card-tag-suggestions "card" false))

      (testing "enabling Flashcards restores review and built-in tag suggestions"
        (set-flashcards-enabled! true)
        (util/goto-journals)
        (assert/assert-is-visible practice)
        (doseq [[first-key second-key] [["g" "f"] ["t" "c"]]]
          (press-flashcards-shortcut! first-key second-key)
          (assert/assert-is-visible "#cards-modal")
          (k/esc)
          (assert/assert-is-hidden "#cards-modal"))
        (assert-card-tag-suggestions "card" true))
      (finally
        (set-flashcards-enabled! true)))))
