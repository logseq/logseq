(ns logseq.e2e.flashcards-basic-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [logseq.e2e.api :refer [ls-api-call!]]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.block :as b]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.keyboard :as k]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.page :as page]
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
  (util/wait-timeout 500))

(defn- press-flashcards-shortcut!
  [first-key second-key]
  (util/double-esc)
  (assert/assert-in-normal-mode?)
  (k/press first-key)
  (util/wait-timeout 150)
  (k/press second-key)
  (util/wait-timeout 700))

(defn- card-tag-suggestions
  [q]
  (util/double-esc)
  (page/new-page (str "fc-flag-" (random-uuid)))
  (b/open-last-block)
  (util/press-seq (str " #" q) {:delay 30})
  (util/wait-timeout 500)
  (let [links (w/-query "a.menu-link")
        n (.count links)
        titles (mapv #(.textContent (.nth links %)) (range n))]
    (util/double-esc)
    titles))

(deftest flashcards-feature-flag-gates-shortcuts-and-tags-test
  (try
    (testing "disabling Flashcards hides shortcuts and #card / #cards tags"
      (set-flashcards-enabled! false)
      (is (false? (get (ls-api-call! :app.getUserConfigs) "enabledFlashcards")))
      (press-flashcards-shortcut! "g" "f")
      (assert/assert-is-hidden "#cards-modal")
      (press-flashcards-shortcut! "t" "c")
      (assert/assert-is-hidden "#cards-modal")
      (let [card-sugs (card-tag-suggestions "card")
            cards-sugs (card-tag-suggestions "cards")]
        (is (not-any? #{"Card"} card-sugs))
        (is (not-any? #{"Cards"} card-sugs))
        (is (not-any? #{"Cards"} cards-sugs))))

    (testing "enabling Flashcards restores shortcuts and #card / #cards tags"
      (set-flashcards-enabled! true)
      (is (true? (get (ls-api-call! :app.getUserConfigs) "enabledFlashcards")))
      (press-flashcards-shortcut! "g" "f")
      (assert/assert-is-visible "#cards-modal")
      (k/esc)
      (assert/assert-is-hidden "#cards-modal")
      (press-flashcards-shortcut! "t" "c")
      (assert/assert-is-visible "#cards-modal")
      (k/esc)
      (let [card-sugs (card-tag-suggestions "card")]
        (is (some #{"Card"} card-sugs))
        (is (some #{"Cards"} card-sugs))))
    (finally
      (set-flashcards-enabled! true))))
