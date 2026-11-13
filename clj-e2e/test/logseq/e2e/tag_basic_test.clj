(ns logseq.e2e.tag-basic-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is use-fixtures]]
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

(defn add-new-tags
  [title-prefix]
  (b/new-block (str title-prefix 1 " #" title-prefix "1"))
  (util/double-esc)
  (b/new-block (str title-prefix 2))
  (util/set-tag (str title-prefix 2)))

(deftest new-tag-test
  (add-new-tags "tag-test-")
  (util/exit-edit)
  (assert/assert-is-visible ".ls-block .block-title-wrap a.tag:has-text('#tag-test-1')")
  (assert/assert-have-count
   (loc/filter ".ls-block .block-title-wrap"
               :has-text #"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
   0))

(deftest page-title-tag-autocomplete-test
  (let [tag-name "page-title-autocomplete-tag"]
    (doseq [page-name ["new-tag-page-title" "existing-tag-page-title"]]
      (page/new-page page-name)
      (w/click "div[data-testid='page title'] .block-title-wrap")
      (util/move-cursor-to-end)
      (util/press-seq (str " #" tag-name))
      (assert/assert-is-visible
       (loc/filter ".ui__popover-content a.menu-link.chosen" :has-text tag-name))
      (k/enter)
      (assert/assert-is-visible
       (loc/filter "div[data-testid='page title'] .block-tag" :has-text tag-name))
      (util/exit-edit)
      (is (= page-name (page/get-page-name)))
      (w/click "div[data-testid='page title'] .block-title-wrap")
      (k/enter)
      (assert/assert-is-hidden util/editor-q)
      (is (= page-name (page/get-page-name))))))

(deftest page-tag-conversion-persists-and-removes-tag-from-objects-test
  (let [tag-name "page-tag-conversion"
        object-page "page-tag-object"]
    (page/new-page tag-name)
    (k/esc)
    (page/convert-to-tag tag-name)
    (assert/assert-is-visible "div[data-testid='page title'] :text('Tag')")

    (page/new-page object-page)
    (b/save-block "Tagged object")
    (util/set-tag tag-name)
    (k/esc)

    (page/goto-page tag-name)
    (assert/assert-is-visible
     (loc/filter ".ls-view-body" :has-text "Tagged object"))
    (util/refresh-until-graph-loaded)
    (assert/assert-is-visible
     (loc/filter ".ls-view-body" :has-text "Tagged object"))

    (w/click ".toolbar-dots-btn")
    (w/click (loc/filter "[role='menuitem']" :has-text "Convert Tag to Page"))
    (w/click "div[role='alertdialog'] button:text('Confirm')")
    (assert/assert-have-count "button:text('Add tag property')" 0)
    (assert/assert-have-count ".ls-view-body" 0)

    (page/goto-page object-page)
    (assert/assert-have-count
     (format ".block-tag :text('%s')" tag-name)
     0)))

(deftest tag-alias-hashtag-completes-to-source-tag-test
  (let [container-page (page/get-page-name)
        tag-name (str "ExampleTag" (subs (str (random-uuid)) 0 8))
        alias-name (str "ET" (subs (str (random-uuid)) 0 8))
        block-text (str "tagged-via-alias-" (subs (str (random-uuid)) 0 8))]
    (ls-api-call! :editor.createTag tag-name)
    (ls-api-call! :editor.createPage alias-name)
    (let [tag (ls-api-call! :editor.getPage tag-name)
          alias-page (ls-api-call! :editor.getPage alias-name)]
      (ls-api-call! :editor.upsertBlockProperty
                    (get tag "uuid")
                    ":block/alias"
                    [(get alias-page "id")]))
    (page/goto-page container-page)
    (b/open-last-block)
    (util/press-seq (str block-text " #") {:delay 20})
    (util/press-seq alias-name {:delay 20})
    (w/wait-for (format "a.menu-link:has-text('%s')" alias-name))
    (assert/assert-have-count
     (loc/filter ".ui__popover-content a.menu-link" :has-text "Convert")
     0)
    (assert/assert-have-count
     (loc/filter ".ui__popover-content a.menu-link" :has-text "New tag")
     0)
    (assert/assert-is-visible
     (loc/filter ".ui__popover-content a.menu-link" :has-text tag-name))
    (w/click (first (w/query (format "a.menu-link:has-text('%s')" tag-name))))
    (assert/assert-is-visible
     (-> ".ls-block:not(.block-add-button)"
         (loc/filter :has ".editor-wrapper textarea")
         (loc/filter :has (format ".block-tag :text('%s')" tag-name))))
    (util/exit-edit)
    (let [alias-page (ls-api-call! :editor.getPage alias-name)
          tag (ls-api-call! :editor.getPage tag-name)
          blocks (ls-api-call! :editor.getPageBlocksTree container-page)
          block-tags (get (first blocks) "tags")]
      (is (not (string/starts-with? (str (get alias-page "ident")) ":user.class/"))
          "The alias page must stay a non-class page")
      (is (some #(= (get tag "id") (or (get % "id") %)) block-tags)
          "The block is tagged with the source tag, not the alias"))
    (page/goto-page tag-name)
    (assert/assert-is-visible
     (loc/filter ".ls-view-body" :has-text block-text))))
