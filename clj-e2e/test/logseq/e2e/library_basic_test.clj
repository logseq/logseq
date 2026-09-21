(ns logseq.e2e.library-basic-test
  (:require
   [clojure.test :refer [deftest testing is use-fixtures]]
   [jsonista.core :as json]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.locator :as loc]
   [logseq.e2e.page :as p]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(defn- js-json
  [script]
  (json/read-value (w/eval-js script) json/keyword-keys-object-mapper))

(deftest library-hides-normal-blocks-and-collapses-child-pages
  (testing "Library shows nested pages without their blocks, and parent pages collapse child pages"
    (p/goto-page "Library")
    (b/new-blocks ["Outline Parent" "Outline Child"])
    (b/indent)
    (p/goto-page "Outline Child")
    (b/new-blocks ["hello" "world"])
    (p/goto-page "Library")
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks .block-title-wrap" :has-text "Outline Parent"))
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks .block-title-wrap" :has-text "Outline Child"))
    (let [contents (set (util/get-page-blocks-contents))]
      (is (contains? contents "Outline Parent"))
      (is (contains? contents "Outline Child"))
      (is (not (contains? contents "hello")))
      (is (not (contains? contents "world"))))
    (p/goto-page "Outline Parent")
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks .block-title-wrap" :has-text "Outline Child"))
    (let [contents (set (util/get-page-blocks-contents))]
      (is (contains? contents "Outline Child"))
      (is (not (contains? contents "hello")))
      (is (not (contains? contents "world"))))
    (assert/assert-have-count
     (loc/filter ".ls-page-blocks .page-blocks-inner .ls-new-property" :has-text "Add property")
     0)
    (p/goto-page "Outline Child")
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks .block-title-wrap" :has-text "hello"))))

(deftest library-enter-on-page-creates-sibling
  (testing "Enter on a Library page block creates a sibling instead of a nested child"
    (p/goto-page "Library")
    (b/new-blocks ["Enter Parent" "Enter Nested"])
    (b/indent)
    (k/arrow-up)
    (assert/assert-editor-mode)
    (is (= "Enter Parent" (util/get-edit-content)))
    (util/move-cursor-to-end)
    (k/enter)
    (util/press-seq "Enter Sibling")
    (util/exit-edit)
    (p/goto-page "Library")
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks .block-title-wrap" :has-text "Enter Parent"))
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks .block-title-wrap" :has-text "Enter Nested"))
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks .block-title-wrap" :has-text "Enter Sibling"))
    (let [layout (js-json
                  "() => {
                     const title = (t) => [...document.querySelectorAll('.ls-page-blocks .block-title-wrap')]
                       .find(el => el.textContent.trim() === t);
                     const x = (t) => title(t).getBoundingClientRect().x;
                     return JSON.stringify({
                       parent: x('Enter Parent'),
                       nested: x('Enter Nested'),
                       sibling: x('Enter Sibling')
                     });
                   }")]
      (is (> (:nested layout) (:parent layout))
          (str "Enter Nested stays indented under the parent: " (pr-str layout)))
      (is (< (abs (- (:sibling layout) (:parent layout))) 8)
          (str "Enter Sibling is aligned with the parent, not nested: " (pr-str layout))))))
