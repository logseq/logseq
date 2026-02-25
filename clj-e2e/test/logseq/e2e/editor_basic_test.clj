(ns logseq.e2e.editor-basic-test
  (:require
   [clojure.set :as set]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.page :as p]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)

(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(defn- drag-and-drop-file!
  [file-name file-type]
  (w/eval-js
   (format "(() => {
      const container = document.querySelector('#main-content-container');
      if (!container) {
        throw new Error('main-content-container not found');
      }
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File(['logseq-e2e-drag-drop'], %s, { type: %s }));
      container.dispatchEvent(new DragEvent('dragover', { dataTransfer, bubbles: true, cancelable: true }));
      container.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }));
    })();"
           (pr-str file-name)
           (pr-str file-type))))

(deftest drag-and-drop-asset-does-not-create-blank-asset
  (testing "dragging and dropping a file should keep non-empty asset title"
    (let [asset-title "drag-drop-regression"
          file-name (str asset-title ".png")]
      (b/new-block "")
      (drag-and-drop-file! file-name "image/png")
      (w/wait-for ".ls-page-blocks .ls-block .asset-container img")
      ;; Exit edit mode to trigger a save; this used to overwrite the new asset with blank content.
      (util/exit-edit)
      (assert/assert-have-count ".ls-page-blocks .ls-block .asset-container img" 1)
      (assert/assert-is-visible
       (format ".ls-page-blocks .ls-block .block-title-wrap:text('%s')" asset-title)))))

(deftest toggle-between-page-and-block
  (testing "Convert block to page and back"
    (b/new-block "b1")
    (util/set-tag "Page" {:hidden? true})
    (assert/assert-is-visible ".ls-page-blocks .ls-block .ls-icon-file")
    (b/toggle-property "Tags" "Page")
    (assert/assert-is-hidden ".ls-page-blocks .ls-block .ls-icon-file")))

(deftest toggle-between-page-and-block-for-selected-blocks
  (testing "Convert selected blocks to pages and back"
    (b/new-blocks ["b1" "b2" "b3"])
    (b/select-blocks 3)
    (b/toggle-property "Tags" "Page")
    (assert/assert-is-visible ".ls-page-blocks .ls-block .ls-icon-file")
    (w/wait-for (format ".menu-link:has-text('%s')" "Page"))
    (k/esc)
    (b/toggle-property "Tags" "Page")
    (w/wait-for-not-visible ".ls-page-blocks .ls-block .ls-icon-file")))

(deftest disallow-adding-page-tag-to-normal-pages
  (testing "Disallow adding #Page to normal pages"
    (k/arrow-up)
    (util/move-cursor-to-end)
    (util/press-seq " #" {:delay 20})
    (util/press-seq "Page")
    (assert/assert-is-hidden (format "#ac-0.menu-link:has-text('%s')" "Page"))))

(deftest move-blocks-mod+shift+m
  (testing "move blocks using `mod+shift+m`"
    (p/new-page "Target page")
    (p/new-page "Source page")
    (b/new-blocks ["b1" "b2" "b3"])
    (b/select-blocks 3)
    (k/press "ControlOrMeta+Shift+m")
    (w/fill "input[placeholder=\"Move blocks to\"]" "Target page")
    (w/wait-for (w/get-by-test-id "Target page"))
    (.focus (w/-query ".cp__cmdk-search-input"))
    (k/enter)
    (assert/assert-have-count ".ls-page-blocks .page-blocks-inner .ls-block" 0)))

(deftest move-blocks-cmdk
  (testing "move blocks using cmdk"
    (p/new-page "Target page 2")
    (p/new-page "Source page 2")
    (b/new-blocks ["b1" "b2" "b3"])
    (b/select-blocks 3)
    (util/search-and-click "Move blocks to")
    (w/fill "input[placeholder=\"Move blocks to\"]" "Target page 2")
    (w/wait-for (w/get-by-test-id "Target page 2"))
    (.focus (w/-query ".cp__cmdk-search-input"))
    (k/arrow-down)
    (k/enter)
    (assert/assert-have-count ".ls-page-blocks .page-blocks-inner .ls-block" 0)))

(deftest move-pages-to-library
  (testing "move pages using `mod+shift+m`"
    (p/goto-page "Library")
    (p/new-page "test page")
    (b/new-blocks ["block1" "block2" "block3"])
    (b/select-blocks 3)
    (b/toggle-property "Tags" "Page")
    (assert/assert-is-visible ".ls-page-blocks .ls-block .ls-icon-file")
    (k/press "ControlOrMeta+Shift+m")
    (w/fill "input[placeholder=\"Move blocks to\"]" "Library")
    (w/wait-for (w/get-by-test-id "Library"))
    (.focus (w/-query ".cp__cmdk-search-input"))
    (k/enter)
    (p/goto-page "Library")
    (let [contents (set (util/get-page-blocks-contents))]
      (is (set/subset? (set ["block1" "block2" "block3"]) contents)))
    (p/goto-page "test page")
    (b/new-blocks ["block4" "block5"])
    (b/select-blocks 2)
    (b/toggle-property "Tags" "Page")
    (assert/assert-is-visible ".ls-page-blocks .ls-block .ls-icon-file")
    (k/press "ControlOrMeta+Shift+m")
    (w/fill "input[placeholder=\"Move blocks to\"]" "Library")
    (w/wait-for (w/get-by-test-id "Library"))
    (.focus (w/-query ".cp__cmdk-search-input"))
    (k/enter)
    (p/goto-page "Library")
    (let [contents (set (util/get-page-blocks-contents))]
      (is (set/subset? (set ["block1" "block2" "block3" "block4" "block5"]) contents)))))

(deftest create-nested-pages-in-library
  (testing "create nested pages in Library"
    (p/goto-page "Library")
    (b/new-blocks ["page parent" "page child"])
    (b/indent)
    (b/new-block "another nested child")
    (b/indent)))
