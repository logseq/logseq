(ns logseq.e2e.reference-basic-test
  (:require
   [clojure.test :refer [deftest is testing use-fixtures]]
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
  fixtures/new-logseq-page
  fixtures/validate-graph)

;; block references
(deftest self-reference
  (testing "self reference"
    (b/new-block "b2")
    (b/copy)
    (b/paste)
    (util/exit-edit)
    (assert/assert-selected-block-text "b2")))

(deftest self-tag-block-reference
  (testing "self reference"
    (b/new-block "b2")
    (util/set-tag "task")
    (b/copy)
    (b/paste)
    (util/exit-edit)
    (assert/assert-selected-block-text "b2")))

(deftest mutual-reference
  (testing "mutual reference"
    (b/new-blocks ["b1" "b2"])
    (util/set-tag "task")
    (b/copy)
    (k/arrow-up)
    (b/wait-editor-text "b1")
    (b/paste)
    (b/copy)
    (k/arrow-down)
    (b/wait-editor-text "b2")
    (b/paste)
    (util/exit-edit)
    (b/assert-blocks-visible ["b1[[b2]]" "b2[[b1]]"])))

(deftest parent-reference
  (testing "parent reference"
    (b/new-blocks ["b1" "b2"])
    (util/set-tag "task")
    (b/indent)
    (b/copy)
    (k/arrow-up)
    (b/wait-editor-text "b1")
    (b/paste)
    (b/copy)
    (k/arrow-down)
    (b/wait-editor-text "b2")
    (b/paste)
    (util/exit-edit)
    (b/assert-blocks-visible ["b1[[b2]]" "b2[[b1]]"])))

(deftest cycle-reference
  (testing "cycle reference"
    (b/new-blocks ["b1" "b2" "b3"])
    (util/set-tag "task")
    (b/jump-to-block "b1")
    (assert/assert-editor-mode)
    (b/copy)
    (k/arrow-down)
    (b/wait-editor-text "b2")
    (b/paste)
    (b/copy)
    (k/arrow-down)
    (b/wait-editor-text "b3")
    (b/paste)
    (b/copy)
    (b/jump-to-block "b1")
    (assert/assert-editor-mode)
    (b/paste)
    (util/exit-edit)
    (b/assert-blocks-visible ["b1[[b3[[b2]]]]" "b2[[b1[[b3]]]]" "b3[[b2[[b1]]]]"])))

(defn- inner-text
  [sel]
  (w/eval-js
   (str "(() => { const el = document.querySelector('" sel "');"
        " return el ? el.innerText : ''; })()")))

(defn- no-raw-uuid?
  "Text contains no uuid block ref or raw uuid string."
  [text]
  (not (re-find #"\(\(|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-" text)))

(deftest search-displays-referenced-block-title
  (testing "cmdk and [[ autocomplete resolve [[uuid]] to the referenced title"
    (b/new-block "ref target")
    (b/copy)
    (b/new-block "")
    (b/paste)
    (util/exit-edit)
    (b/assert-blocks-visible ["ref target" "ref target"])

    ;; cmdk search
    (util/search "ref target")
    (assert/assert-is-visible ".cp__cmdk :text('ref target')")
    (is (no-raw-uuid? (inner-text ".cp__cmdk"))
        "cmdk results show resolved title, not raw [[uuid]]")
    ;; first esc clears the query, second closes the modal
    (k/esc)
    (k/esc)
    (w/wait-for-not-visible ".cp__cmdk")

    ;; [[ node autocomplete
    (b/new-block "")
    (util/press-seq "[[")
    (util/wait-timeout 300)
    (util/press-seq "ref")
    (util/wait-timeout 800)
    (assert/assert-is-visible "#ui__ac-inner")
    (assert/assert-is-visible "#ui__ac-inner :text('ref target')")
    (is (no-raw-uuid? (inner-text "#ui__ac-inner"))
        "[[ autocomplete shows resolved title, not raw [[uuid]]")))

(deftest page-self-mentions-are-excluded-from-references
  (testing "blocks on a page do not appear in that page's linked or unlinked references"
    (let [page-name (str "self-ref-page-" (random-uuid))
          other-name (str "self-ref-other-" (random-uuid))
          self-linked "self-linked-mention-block"
          self-unlinked "self-unlinked-mention-block"
          other-linked "other-linked-mention-block"
          other-unlinked "other-unlinked-mention-block"]
      (page/new-page page-name)
      (b/new-block (str self-linked " [[" page-name "]]"))
      (b/new-block (str self-unlinked " " page-name))
      (util/exit-edit)
      (page/goto-page page-name)
      (assert/assert-have-count ".references" 0)
      (assert/assert-have-count ".unlinked-references" 0)

      (page/new-page other-name)
      (b/new-block (str other-linked " [[" page-name "]]"))
      (b/new-block (str other-unlinked " " page-name))
      (util/exit-edit)
      (page/goto-page page-name)

      (assert/assert-is-visible
       (loc/filter ".references" :has-text other-name))
      (assert/assert-is-visible
       (loc/filter ".references" :has-text other-linked))
      (assert/assert-have-count
       (loc/filter ".references" :has-text self-linked)
       0)

      (w/click ".unlinked-references .ls-foldable-title-control")
      (assert/assert-is-visible
       (loc/filter ".unlinked-references" :has-text other-name))
      (assert/assert-is-visible
       (loc/filter ".unlinked-references" :has-text other-unlinked))
      (assert/assert-have-count
       (loc/filter ".unlinked-references" :has-text self-unlinked)
       0))))
