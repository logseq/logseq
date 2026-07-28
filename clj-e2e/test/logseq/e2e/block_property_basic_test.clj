(ns logseq.e2e.block-property-basic-test
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
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- current-page-name
  []
  (page/get-page-name))

(defn- add-property-through-ui!
  [property-name property-type]
  (util/input-command "Add property")
  (w/click "input[placeholder]")
  (util/input property-name)
  (w/click (w/get-by-text "New option:"))
  (w/click (loc/and "span" (util/get-by-text property-type true))))

(defn- block-value
  [uuid property-name]
  (get (ls-api-call! :editor.getBlockProperty uuid property-name) "value"))

(deftest references-embeds-and-mounted-instance-refresh-test
  (testing "page refs, embeds, linked refs and mounted copies share canonical updates"
    (let [target-page "block sample target"
          source-page "block sample source"]
      (page/new-page target-page)
      (b/new-blocks ["target parent" "target child"])
      (b/indent)
      (let [target-uuid (get (ls-api-call! :editor.getBlock "target parent") "uuid")]
        (page/new-page source-page)
        (b/new-block (str "[[" target-page "]]"))
        (b/new-block "")
        (util/input-command "Page embed")
        (util/press-seq target-page)
        (k/enter)
        (util/exit-edit)
        (assert/assert-is-visible
         (loc/filter ".embed-page" :has-text "target child"))
        (ls-api-call! :editor.openInRightSidebar target-uuid)
        (page/goto-page target-page)
        (assert/assert-is-visible
         (loc/filter ".references" :has-text source-page))
        (ls-api-call! :editor.updateBlock target-uuid "target parent updated")
        (doseq [container ["#main-content-container" ".cp__right-sidebar"]]
          (assert/assert-is-visible
           (loc/filter container :has-text "target parent updated")))
        (is (= 1
               (get (ls-api-call! :editor.getBlock target-page)
                    "refsCount"
                    1)))))))

(deftest unlinked-reference-filter-and-breadcrumb-test
  (testing "unlinked refs convert immediately, filters update counts, breadcrumbs track renames"
    (let [target "reference sample target"
          include-page "reference include"
          exclude-page "reference exclude"]
      (page/new-page target)
      (b/new-block "target nested parent")
      (b/new-block "target nested child")
      (b/indent)
      (page/new-page include-page)
      (b/new-block (str target " plain mention"))
      (page/new-page exclude-page)
      (b/new-block (str target " another mention"))
      (page/goto-page target)
      (assert/assert-is-visible
       (loc/filter ".unlinked-references" :has-text include-page))
      (w/click
       (loc/filter ".unlinked-references button" :has-text "Link"))
      (assert/assert-is-visible
       (loc/filter ".references" :has-text include-page))
      (w/click (loc/filter ".references" :has-text "Filter"))
      (w/click (loc/filter "[role='menuitem']" :has-text exclude-page))
      (assert/assert-have-count
       (loc/filter ".references" :has-text exclude-page)
       0)
      (w/click (loc/filter ".block-title-wrap" :has-text "target nested child"))
      (assert/assert-is-visible
       (loc/filter ".breadcrumb" :has-text "target nested parent"))
      (ls-api-call! :editor.updateBlock
                    (get (ls-api-call! :editor.getBlock "target nested parent") "uuid")
                    "target renamed parent")
      (assert/assert-is-visible
       (loc/filter ".breadcrumb" :has-text "target renamed parent")))))

(deftest task-state-date-priority-and-history-test
  (testing "task state/date/priority updates derived UI and history exactly once"
    (b/new-block "task sample history")
    (util/input-command "TODO")
    (util/input-command "Priority A")
    (util/input-command "Scheduled")
    (w/click (util/get-by-text "Today" true))
    (k/esc)
    (let [uuid (get (ls-api-call! :editor.getBlock "task sample history") "uuid")]
      (k/press "ControlOrMeta+Enter")
      (util/exit-edit)
      (assert/assert-is-visible
       (loc/filter (format "#ls-block-%s" uuid) :has-text "DONE"))
      (assert/assert-is-visible
       (loc/filter (format "#ls-block-%s" uuid) :has-text "Priority"))
      (assert/assert-is-visible
       (loc/filter (format "#ls-block-%s" uuid) :has-text "Scheduled"))
      (let [history (get (ls-api-call! :editor.getBlock uuid)
                         ":logseq.property/history")]
        (is (= 1 (count (filter some? history)))))
      (util/refresh-until-graph-loaded)
      (assert/assert-is-visible (format "#ls-block-%s" uuid)))))

(deftest flashcard-rating-advances-once-test
  (testing "answer reveal and one rating advance to the next card and update due count"
    (let [page-name (current-page-name)]
      (ls-api-call! :editor.appendBlockInPage page-name "sample card one #Card")
      (ls-api-call! :editor.appendBlockInPage page-name "sample card two #Card")
      (w/click ".flashcards-nav a")
      (assert/assert-is-visible "#cards-modal")
      (k/press "s")
      (assert/assert-is-visible
       (loc/filter "#cards-modal" :has-text "Again"))
      (let [before (util/get-text "#cards-modal")]
        (k/press "3")
        (let [after (util/get-text "#cards-modal")]
          (is (not= before after))))
      (assert/assert-have-count "#cards-modal .card-rating-loading" 0))))

(deftest multi-target-comment-draft-edit-delete-test
  (testing "multi-target comments have correct ownership and cancel/edit/delete lifecycle"
    (b/new-blocks ["comment sample a" "comment sample b"])
    (b/select-blocks 2)
    (util/search-and-click "Add comment")
    (assert/assert-is-visible
     (loc/filter ".ls-comments-area" :has-text "those blocks"))
    (w/fill ".ls-comment-add textarea" "discarded comment")
    (k/esc)
    (assert/assert-have-count
     (loc/filter ".ls-comment-row" :has-text "discarded comment")
     0)
    (util/search-and-click "Add comment")
    (w/fill ".ls-comment-add textarea" "saved sample comment")
    (w/click ".ls-comment-submit")
    (assert/assert-is-visible
     (loc/filter ".ls-comment-row" :has-text "saved sample comment"))
    (w/click ".ls-comment-row button[title='Edit']")
    (w/fill ".ls-comment-row textarea" "edited sample comment")
    (k/enter)
    (assert/assert-is-visible
     (loc/filter ".ls-comment-row" :has-text "edited sample comment"))
    (w/click ".ls-comment-row button[title='Delete']")
    (w/click "div[role='alertdialog'] button:text('Confirm')")
    (assert/assert-have-count ".ls-comment-row" 0)))

(deftest block-and-comment-reaction-toggle-test
  (testing "block and comment reactions use their own targets and toggle without duplicates"
    (b/new-blocks ["reaction sample a" "reaction sample b"])
    (b/select-blocks 2)
    (util/search-and-click "Add reaction")
    (w/click "[data-emoji='👍'], button:text('👍')")
    (assert/assert-have-count
     ".ls-page-blocks .ls-block .reaction-item:has-text('👍')"
     2)
    (w/click
     ".ls-page-blocks .ls-block:first-of-type .reaction-item:has-text('👍')")
    (assert/assert-have-count
     ".ls-page-blocks .ls-block:first-of-type .reaction-item:has-text('👍')"
     0)
    (w/click (loc/filter ".block-title-wrap" :has-text "reaction sample b"))
    (util/search-and-click "Add comment")
    (w/fill ".ls-comment-add textarea" "reaction comment")
    (w/click ".ls-comment-submit")
    (w/click ".ls-comment-row button[title='Add reaction']")
    (w/click "[data-emoji='❤️'], button:text('❤️')")
    (assert/assert-have-count
     ".ls-comment-row .reaction-item:has-text('❤️')"
     1)
    (assert/assert-have-count
     ".ls-block > .reaction-item:has-text('❤️')"
     0)))

(deftest icon-and-structural-tag-visibility-test
  (testing "icons update mounted references and internal tags stay hidden from user tags"
    (let [page-name "icon sample page"]
      (page/new-page page-name)
      (util/exit-edit)
      (w/click "div[data-testid='page title']")
      (util/input-command "Set icon")
      (w/click "[data-emoji='📚'], button:text('📚')")
      (assert/assert-is-visible ".ls-page-icon")
      (b/new-block "icon sample block")
      (util/set-tag "task")
      (util/exit-edit)
      (assert/assert-is-visible
       (loc/filter ".block-tag" :has-text "task"))
      (assert/assert-have-count
       (loc/filter ".block-tag" :has-text "Page")
       0)
      (ls-api-call! :editor.openInRightSidebar
                    (get (ls-api-call! :editor.getPage page-name) "uuid"))
      (assert/assert-is-visible ".cp__right-sidebar .ls-page-icon")
      (w/click ".ls-page-icon")
      (w/click (loc/filter "[role='menuitem']" :has-text "Remove icon"))
      (assert/assert-have-count ".ls-page-icon" 0))))

(deftest property-create-and-name-validation-test
  (testing "property creation is unique and invalid names cannot create ghost nodes"
    (b/new-block "property validation owner")
    (add-property-through-ui! "valid-property" "Text")
    (assert/assert-have-count
     (loc/filter ".property-k" :has-text "valid-property")
     1)
    (doseq [invalid-name ["" "[[bad" "#bad"]]
      (util/input-command "Add property")
      (w/click "input[placeholder]")
      (util/input invalid-name)
      (assert/assert-is-visible
       "button[disabled]:has-text('Create'), .text-error, .warning")
      (k/esc))
    (is (nil? (ls-api-call! :editor.getProperty "[[bad")))
    (is (nil? (ls-api-call! :editor.getProperty "#bad")))))

(deftest scalar-property-value-validation-test
  (testing "number/date/url values preserve types and reject incompatible text"
    (let [page-name (current-page-name)
          block (ls-api-call! :editor.appendBlockInPage page-name "scalar property owner")
          uuid (get block "uuid")]
      (doseq [[property-name property-type valid-value invalid-value]
              [["sample number" "number" -12.5 "not-a-number"]
               ["sample date" "date" "2026-07-28" "not-a-date"]
               ["sample url" "url" "https://logseq.com" "not a url"]]]
        (ls-api-call! :editor.upsertProperty property-name {:type property-type})
        (ls-api-call! :editor.upsertBlockProperty uuid property-name valid-value)
        (is (some? (block-value uuid property-name)))
        (w/click
         (loc/filter (format "#ls-block-%s .property-pair" uuid)
                     :has-text property-name))
        (util/input invalid-value)
        (k/enter)
        (assert/assert-is-visible ".text-error, .ui__toast.error, .warning")
        (is (not= invalid-value (block-value uuid property-name))))
      (util/refresh-until-graph-loaded)
      (assert/assert-is-visible (format "#ls-block-%s" uuid)))))

(deftest property-type-cardinality-and-checkbox-choice-test
  (testing "schema changes expose explicit conversion/cardinality/checkbox semantics"
    (let [property-name "sample schema property"
          page-name (current-page-name)
          block (ls-api-call! :editor.appendBlockInPage page-name "schema property owner")
          uuid (get block "uuid")]
      (ls-api-call! :editor.upsertProperty property-name
                    {:type "default" :cardinality "many"})
      (ls-api-call! :editor.upsertBlockProperty uuid property-name ["one" "two"])
      (is (= 2 (count (block-value uuid property-name))))
      (page/goto-page property-name)
      (w/click (loc/filter ".property-pair" :has-text "Cardinality"))
      (w/click (util/get-by-text "One" true))
      (assert/assert-is-visible
       "div[role='alertdialog'], .ui__toast.warning")
      (k/esc)
      (w/click (loc/filter ".property-pair" :has-text "Property type"))
      (w/click (util/get-by-text "Checkbox" true))
      (assert/assert-is-visible
       "div[role='alertdialog'], .ui__toast.warning")
      (k/esc)
      (ls-api-call! :editor.upsertProperty
                    property-name
                    {:type "checkbox"
                     :checkbox-state {:checked "one" :unchecked "two"}})
      (ls-api-call! :editor.upsertBlockProperty uuid property-name true)
      (is (true? (block-value uuid property-name))))))

(deftest property-default-description-position-and-hidden-state-test
  (testing "property presentation/default settings apply to new objects and mounted containers"
    (let [property-name "sample configured property"
          tag-name "sample configured class"]
      (ls-api-call! :editor.upsertProperty
                    property-name
                    {:type "default"
                     :defaultValue "sample default"
                     :description "sample description"
                     :hideEmptyValue true})
      (ls-api-call! :editor.createTag
                    tag-name
                    {:tagProperties [{:name property-name}]})
      (page/new-page "configured object host")
      (b/new-block "configured object")
      (util/set-tag tag-name)
      (util/exit-edit)
      (assert/assert-is-visible
       (loc/filter ".property-pair" :has-text "sample default"))
      (is (= "sample description"
             (.getAttribute
              (w/-query
               (format ".property-k:has-text('%s')" property-name))
              "title")))
      (k/press "p")
      (k/press "a")
      (assert/assert-is-visible ".hidden-properties, .empty-properties")
      (ls-api-call! :editor.openInRightSidebar
                    (get (ls-api-call! :editor.getBlock "configured object") "uuid"))
      (assert/assert-is-visible
       (loc/filter ".cp__right-sidebar" :has-text "sample default")))))

(deftest property-delete-and-bidirectional-refresh-test
  (testing "bidirectional values refresh both sides and deleting the definition removes usages"
    (let [property-name "sample bidirectional"
          owner-tag "sample owner"
          target-tag "sample target"]
      (ls-api-call! :editor.createTag owner-tag)
      (ls-api-call! :editor.createTag target-tag)
      (ls-api-call! :editor.upsertProperty
                    property-name
                    {:type "node" :bidirectional true})
      (let [owner (ls-api-call! :editor.createPage "sample owner object"
                                {:tags [owner-tag]})
            target (ls-api-call! :editor.createPage "sample target object"
                                 {:tags [target-tag]})]
        (ls-api-call! :editor.upsertBlockProperty
                      (get owner "uuid") property-name (get target "uuid"))
        (page/goto-page "sample target object")
        (assert/assert-is-visible
         (loc/filter ".ls-view-body, .references" :has-text "sample owner object"))
        (ls-api-call! :editor.removeBlockProperty (get owner "uuid") property-name)
        (assert/assert-have-count
         (loc/filter ".ls-view-body, .references" :has-text "sample owner object")
         0)
        (ls-api-call! :editor.removeProperty property-name)
        (is (nil? (ls-api-call! :editor.getProperty property-name)))))))

(deftest tag-inheritance-schema-and-object-view-test
  (testing "class inheritance and schema mutations update object views without losing values"
    (let [parent-tag (ls-api-call! :editor.createTag
                                   "sample parent class"
                                   {:tagProperties [{:name "sample inherited property"}]})
          child-tag (ls-api-call! :editor.createTag
                                  "sample child class"
                                  {:tagProperties [{:name "sample child property"}]})]
      (ls-api-call! :editor.addTagExtends
                    (get child-tag "id")
                    (get parent-tag "id"))
      (page/new-page "tag object host")
      (let [object (ls-api-call! :editor.appendBlockInPage
                                 (current-page-name)
                                 "sample child object #sample child class"
                                 {:properties {"sample inherited property" "kept"}})]
        (page/goto-page "sample parent class")
        (assert/assert-is-visible
         (loc/filter ".ls-view-body" :has-text "sample child object"))
        (assert/assert-is-visible
         (loc/filter ".ls-table-header-cell" :has-text "sample inherited property"))
        (ls-api-call! :editor.upsertBlockProperty
                      (get object "uuid") "sample child property" "child value")
        (assert/assert-is-visible
         (loc/filter ".ls-view-body" :has-text "child value"))
        (is (= "kept"
               (block-value (get object "uuid")
                            "sample inherited property")))))))

(deftest tag-template-dynamic-values-test
  (testing "a tag template is applied once and resolves dynamic date references"
    (let [tag-name "sample template class"
          template-page "sample tag template"]
      (page/new-page template-page)
      (b/new-blocks ["template static child" "template date [[today]]"])
      (page/new-page tag-name)
      (page/convert-to-tag tag-name)
      (w/click "button:has-text('Set property')")
      (w/click (loc/filter ".cp__select-results" :has-text "Template"))
      (w/fill "input[placeholder*='Template']" template-page)
      (w/click (loc/filter ".cp__select-results" :has-text template-page))
      (page/new-page "sample templated object")
      (b/new-block "templated object")
      (util/set-tag tag-name)
      (util/exit-edit)
      (assert/assert-have-count
       (loc/filter ".ls-page-blocks" :has-text "template static child")
       1)
      (assert/assert-is-visible
       (loc/filter ".page-reference" :has-text "today"))
      (util/refresh-until-graph-loaded)
      (assert/assert-have-count
       (loc/filter ".ls-page-blocks" :has-text "template static child")
       1))))

(defn- block-uuid
  [title]
  (get (ls-api-call! :editor.getBlock title) "uuid"))

(deftest block-embed-shares-source-entity-test
  (testing "an embedded subtree rerenders source changes without duplicating the entity"
    (let [source-page (page/get-page-name)]
      (b/new-blocks ["embed source" "embed child"])
      (b/indent)
      (let [source-uuid (block-uuid "embed source")]
        (page/new-page "embed host")
        (b/new-block "")
        (util/input-command "Node embed")
        (util/press-seq "embed source")
        (w/click (.first (loc/filter ".ui__popover-content a" :has-text "embed source")))
        (util/exit-edit)
        (assert/assert-is-visible ".embed-block")
        (assert/assert-is-visible
         (loc/filter ".embed-block" :has-text "embed child"))
        (ls-api-call! :editor.updateBlock source-uuid "embed source updated")
        (assert/assert-is-visible
         (loc/filter ".embed-block" :has-text "embed source updated"))
        (is (= "embed source updated"
               (get (ls-api-call! :editor.getBlock source-uuid) "content")))
        (is (not= source-page (page/get-page-name)))))))

(deftest checkbox-property-toggle-persists-test
  (testing "checkbox property toggles immediately and survives refresh"
    (let [property-name "e2e checkbox"
          page-name (page/get-page-name)]
      (ls-api-call! :editor.upsertProperty property-name {:type "checkbox"})
      (let [block (ls-api-call! :editor.appendBlockInPage
                                page-name
                                "checkbox owner"
                                {:properties {property-name false}})
            uuid (get block "uuid")
            checkbox (loc/filter (format "#ls-block-%s .property-pair" uuid)
                                 :has-text property-name)]
        (w/click (.locator checkbox "button[role='checkbox'], input[type='checkbox']"))
        (is (true? (get (ls-api-call! :editor.getBlockProperty uuid property-name)
                        "value")))
        (util/refresh-until-graph-loaded)
        (assert/assert-is-visible
         (format "#ls-block-%s [role='checkbox'][aria-checked='true']" uuid))))))
