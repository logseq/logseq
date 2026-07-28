(ns logseq.e2e.outliner-basic-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [logseq.e2e.api :refer [ls-api-call!]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.graph :as graph]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.page :as p]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each
  fixtures/new-logseq-page
  fixtures/validate-graph)

(defn- block-text-position
  [text]
  (let [locator (w/find-one-by-text "span" text)]
    (assert/assert-is-visible locator)
    (first (util/bounding-xy locator))))

(defn create-test-page-and-insert-blocks []
  ;; a page block and a child block
  (is (= 2 (util/blocks-count)))
  (b/new-blocks ["first block" "second block"])
  (util/exit-edit)
  (is (= 3 (util/blocks-count))))

(defn indent-and-outdent []
  (b/new-blocks ["b1" "b2"])
  (testing "simple indent and outdent"
    (b/indent)
    (b/outdent))

  (testing "indent a block with its children"
    (b/new-block "b3")
    (b/indent)
    (k/arrow-up)
    (b/indent)
    (util/exit-edit)
    (let [[x1 x2 x3] (map block-text-position ["b1" "b2" "b3"])]
      (is (< x1 x2 x3))))

  (testing "unindent a block with its children"
    (b/open-last-block)
    (b/new-blocks ["b4" "b5"])
    (b/indent)
    (k/arrow-up)
    (b/outdent)
    (util/exit-edit)
    (let [[x2 x3 x4 x5] (map block-text-position ["b2" "b3" "b4" "b5"])]
      (is (and (= x2 x4) (= x3 x5) (< x2 x3))))))

(defn indent-outdent-embed-page []
  (p/new-page "Page embed")
  (b/new-blocks ["b1" "b2"])
  (p/new-page "Page testing")
  (b/new-blocks ["b3" ""])
  (util/input-command "Node embed")
  (util/press-seq "Page embed" {:delay 60})
  (w/wait-for "#ac-0.menu-link:has-text('Page embed')")
  (k/press "Enter" {:delay 60})
  (util/exit-edit)
  (b/new-blocks ["b4"])
  (b/outdent)
  (b/indent)
  (util/exit-edit)
  (let [[x2 x3 x4] (map block-text-position ["b2" "b3" "b4"])]
    (is (= x2 x4))
    (is (< x3 x2))))

(defn move-up-down []
  (b/new-blocks ["b1" "b2" "b3" "b4"])
  (util/repeat-keyboard 2 "Shift+ArrowUp")
  (let [contents (util/get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"])))
  (util/repeat-keyboard 2 (str (if util/mac? "Meta" "Alt") "+Shift+ArrowUp"))
  (let [contents (util/get-page-blocks-contents)]
    (is (= contents ["b3" "b4" "b1" "b2"])))
  (util/repeat-keyboard 2 (str (if util/mac? "Meta" "Alt") "+Shift+ArrowDown"))
  (let [contents (util/get-page-blocks-contents)]
    (is (= contents ["b1" "b2" "b3" "b4"]))))

(defn- zoom-in-shortcut []
  (k/press (if util/mac? "Meta+Shift+." "Alt+ArrowRight")))

(defn- current-location-hash []
  (w/eval-js "window.location.hash"))

(defn- current-editing-block-id []
  (w/eval-js
   "(() => {
      const editor = document.querySelector('.editor-wrapper textarea');
      return editor?.closest('[blockid]')?.getAttribute('blockid') ?? null;
    })();"))

(deftest focused-root-block-cannot-indent-or-move-test
  (testing "Focused root block ignores indent/outdent/move-up/move-down commands"
    (b/new-blocks ["focused-root" "focused-child"])
    (k/arrow-up)
    (let [root-id (current-editing-block-id)]
      (is (string? root-id))
      (zoom-in-shortcut)
      (util/wait-timeout 400)
      ;; Retry once in case the first key event gets swallowed by the editor.
      (when-not (string/includes? (or (current-location-hash) "") root-id)
        (zoom-in-shortcut)
        (util/wait-timeout 400))
      (is (string/includes? (or (current-location-hash) "") root-id))
      (util/wait-editor-visible)
      (is (= "focused-root" (util/get-edit-content)))
      (let [before-hash (current-location-hash)
            before-block-contents (util/get-page-blocks-contents)]
        (k/tab)
        (util/wait-timeout 100)
        (k/shift+tab)
        (util/wait-timeout 100)
        (k/meta+shift+arrow-up)
        (util/wait-timeout 100)
        (k/meta+shift+arrow-down)
        (util/wait-timeout 100)
        (is (= "focused-root" (util/get-edit-content)))
        (is (= before-hash (current-location-hash)))
        (is (= before-block-contents (util/get-page-blocks-contents)))))))

(defn delete []
  (testing "Delete blocks case 1"
    (b/new-blocks ["b1" "b2" "b3" "b4"])
    (b/delete-blocks)                        ; delete b4
    (util/repeat-keyboard 2 "Shift+ArrowUp") ; select b3 and b2
    (b/delete-blocks)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count)))))

(defn delete-end []
  (testing "Delete at end"
    (b/new-blocks ["b1" "b2" "b3"])
    (k/arrow-up)
    (k/delete)
    (is (= "b2b3" (util/get-edit-content)))
    (is (= 2 (util/page-blocks-count)))))

(defn delete-test-with-children []
  (testing "Delete block with its children"
    (b/new-blocks ["b1" "b2" "b3" "b4"])
    (b/indent)
    (k/arrow-up)
    (b/indent)
    (k/arrow-up)
    (b/delete-blocks)
    (util/wait-editor-visible)
    (is (= "b1" (util/get-edit-content)))
    (is (= 1 (util/page-blocks-count)))))

(deftest create-test-page-and-insert-blocks-test
  (create-test-page-and-insert-blocks))

(deftest indent-and-outdent-test
  (indent-and-outdent))

(deftest indent-outdent-embed-page-test
  (indent-outdent-embed-page))

(deftest move-up-down-test
  (move-up-down))

(deftest delete-test
  (delete))

(deftest delete-end-test
  (delete-end))

(deftest delete-test-with-children-test
  (delete-test-with-children))

(deftest delete-concat-test-2-blocks
  (testing "Delete concat with empty block"
    (b/new-blocks ["" "b2"])
    (b/indent)
    (k/arrow-up)
    (k/delete)
    (util/wait-editor-visible)
    (is (= "b2" (util/get-edit-content)))
    (util/exit-edit)
    (is (= ["b2"] (util/get-page-blocks-contents)))))

(deftest delete-concat-test-3-blocks
  (testing "Delete concat with empty block"
    (b/new-blocks ["" "b2" "b3"])
    (b/indent)
    (k/arrow-up)
    (k/arrow-up)
    (k/delete)
    (util/wait-editor-visible)
    (is (= "b2" (util/get-edit-content)))
    (util/exit-edit)
    (is (= ["b2" "b3"] (util/get-page-blocks-contents)))))

(deftest delete-concat-test-with-children
  (testing "Delete concat with children blocks"
    (b/new-blocks ["" "b2" "b3"])
    (b/indent)
    (k/arrow-up)
    (b/indent)
    (k/arrow-up)
    (k/delete)
    (util/wait-editor-visible)
    (is (= "" (util/get-edit-content)))
    (is (= 3 (util/page-blocks-count)))))

(deftest delete-concat-test-with-tag
  (testing "Delete concat with tag"
    (b/new-blocks ["" "b2"])
    (b/indent)
    (util/set-tag "tag1")
    (k/arrow-up)
    (k/delete)
    (util/wait-editor-visible)
    (is (= "b2" (util/get-edit-content)))
    (util/exit-edit)
    (assert/assert-is-visible
     ".ls-block a.tag:has-text('tag1')")
    (is (= ["b2"] (util/get-page-blocks-contents)))))

(deftest backspace-empty-first-child-keeps-empty-parent-subtree-test
  (testing "Backspace in the first empty child of an empty parent deletes only the child"
    (p/new-page "backspace empty first child")
    (let [page-uuid (get (ls-api-call! :editor.getBlock "backspace empty first child") "uuid")
          [parent first-child child2 child3]
          (ls-api-call! :editor.insertBatchBlock
                        page-uuid
                        [{:content ""
                          :children [{:content ""}
                                     {:content "child2"}
                                     {:content "child3"}]}])
          block-visible? #(pos? (util/count-elements (str "#ls-block-" %)))]
      (w/click (str "#ls-block-" (get first-child "uuid") " .block-content"))
      (util/wait-editor-visible)
      (is (= "" (util/get-edit-content)))
      (k/backspace)
      (util/wait-timeout 100)
      (is (not (block-visible? (get first-child "uuid"))))
      (is (block-visible? (get parent "uuid")))
      (is (block-visible? (get child2 "uuid")))
      (is (block-visible? (get child3 "uuid"))))))

(deftest backspace-at-parent-start-keeps-children-test
  (doseq [[page-name parent-content]
          [["backspace non-empty parent start" "a"]
           ["backspace empty parent start" ""]]]
    (testing (str "Backspace at the start of parent " (pr-str parent-content)
                  " preserves its child")
      (p/new-page page-name)
      (let [page-uuid (get (ls-api-call! :editor.getBlock page-name) "uuid")
            [parent child]
            (ls-api-call! :editor.insertBatchBlock
                          page-uuid
                          [{:content parent-content
                            :children [{:content "b"}]}])
            parent-uuid (get parent "uuid")
            child-uuid (get child "uuid")
            block-visible? #(pos? (util/count-elements (str "#ls-block-" %)))]
        (w/click (str "#block-content-" parent-uuid))
        (util/wait-editor-visible)
        (w/eval-js
         "(() => {
            const editor = document.querySelector('.editor-wrapper textarea');
            editor.focus();
            editor.setSelectionRange(0, 0);
          })();")
        (k/backspace)
        (util/wait-timeout 200)
        (is (= parent-content (util/get-edit-content)))
        (is (block-visible? parent-uuid))
        (is (block-visible? child-uuid))))))

(deftest consecutive-backspace-does-not-restore-deleted-blocks-test
  (testing "Deleting b and then a never renders stale block content"
    (p/new-page "consecutive backspace deletion")
    (let [page-uuid (get (ls-api-call! :editor.getBlock "consecutive backspace deletion") "uuid")
          [_a b] (ls-api-call! :editor.insertBatchBlock
                               page-uuid
                               [{:content "a"}
                                {:content "b"}])
          editor-state #(w/eval-js
                         "(() => {
                            const editor = document.querySelector('.editor-wrapper textarea');
                            return [
                              editor?.value ?? null,
                              Array.from(document.querySelectorAll(
                                '.ls-page-blocks .block-title-wrap'))
                                .map((node) => node.textContent.trim())
                                .filter(Boolean)
                            ];
                          })();")]
      (w/click (str "#block-content-" (get b "uuid")))
      (util/wait-editor-visible)
      (w/eval-js
       "(() => {
          const editor = document.querySelector('.editor-wrapper textarea');
          editor.focus();
          editor.setSelectionRange(editor.value.length, editor.value.length);
        })();")
      (dotimes [_ 4]
        (k/backspace))
      (util/wait-timeout 50)
      (let [immediate (editor-state)]
        (is (= [] (second immediate)))
        (util/wait-timeout 500)
        (is (= immediate (editor-state)))))))

(deftest rapid-retype-before-enter-keeps-the-edit-test
  (testing "Backspace, retype, and Enter keep the retyped content"
    (b/open-last-block)
    (k/press "a")
    (k/press "Backspace")
    (k/press "a")
    (k/press "Enter")
    (util/wait-timeout 700)
    (util/exit-edit)
    (is (= ["a"] (remove string/blank?
                         (util/get-page-blocks-contents))))))

(defn- block-tree
  [page-name]
  (ls-api-call! :editor.getPageBlocksTree page-name))

(defn- content-tree
  [nodes]
  (mapv (fn [node]
          [(get node "content")
           (content-tree (get node "children"))])
        nodes))

(defn- drag-block!
  [source-title target-title placement]
  (w/eval-js
   (format
    "(async () => {
       const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
       const find = (title) => Array.from(
         document.querySelectorAll('.ls-page-blocks .ls-block[data-block-title]')
       ).find((block) => block.dataset.blockTitle === title);
       const source = find(%s);
       const target = find(%s);
       if (!source || !target) throw new Error('drag source or target missing');
       const handle = source.querySelector('.bullet-container');
       const targetRect = target.getBoundingClientRect();
       const sourceRect = handle.getBoundingClientRect();
       const destinationY = %s === 'before'
         ? targetRect.top + 2
         : (%s === 'after' ? targetRect.bottom - 2 : targetRect.top + targetRect.height / 2);
       const init = (x, y, buttons) => ({
         bubbles: true, cancelable: true, button: 0, buttons,
         clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse'
       });
       handle.dispatchEvent(new PointerEvent(
         'pointerdown', init(sourceRect.left + 4, sourceRect.top + 4, 1)
       ));
       await delay(120);
       target.dispatchEvent(new PointerEvent(
         'pointermove', init(targetRect.left + 30, destinationY, 1)
       ));
       target.dispatchEvent(new MouseEvent(
         'mouseover', init(targetRect.left + 30, destinationY, 1)
       ));
       await delay(120);
       document.dispatchEvent(new PointerEvent(
         'pointerup', init(targetRect.left + 30, destinationY, 0)
       ));
       await delay(250);
     })();"
    (pr-str source-title)
    (pr-str target-title)
    (pr-str placement)
    (pr-str placement))))

(deftest drag-reorders-once-and-is-undoable-test
  (testing "same-level drag changes order once and undo restores the original order"
    (let [page-name (p/get-page-name)]
      (b/new-blocks ["drag first" "drag second" "drag third"])
      (util/exit-edit)
      (drag-block! "drag third" "drag first" "before")
      (is (= ["drag third" "drag first" "drag second"]
             (mapv #(get % "content") (block-tree page-name))))
      (b/undo)
      (is (= ["drag first" "drag second" "drag third"]
             (mapv #(get % "content") (block-tree page-name)))))))

(deftest drag-indents-and-outdents-test
  (testing "dragging into and out of a parent updates both sides of the tree"
    (let [page-name (p/get-page-name)]
      (b/new-blocks ["drag parent" "drag child candidate" "drag tail"])
      (util/exit-edit)
      (drag-block! "drag child candidate" "drag parent" "inside")
      (is (= [["drag parent" [["drag child candidate" []]]]
              ["drag tail" []]]
             (content-tree (block-tree page-name))))
      (drag-block! "drag child candidate" "drag tail" "after")
      (is (= ["drag parent" "drag tail" "drag child candidate"]
             (mapv #(get % "content") (block-tree page-name)))))))

(deftest drag-rejects-parent-into-descendant-test
  (testing "dragging a parent into its descendant leaves the tree unchanged"
    (let [page-name (p/get-page-name)]
      (b/new-blocks ["cycle parent" "cycle child"])
      (b/indent)
      (util/exit-edit)
      (let [before (content-tree (block-tree page-name))]
        (drag-block! "cycle parent" "cycle child" "inside")
        (is (= before (content-tree (block-tree page-name))))))))

(deftest undo-history-is-scoped-to-current-graph-test
  (testing "Undo in a newly switched graph cannot consume the previous graph history"
    (let [graph-a (str "undo-a-" (random-uuid))
          graph-b (str "undo-b-" (random-uuid))]
      (graph/new-graph graph-a false)
      (p/new-page "undo graph a page")
      (b/new-block "graph a history")
      (graph/new-graph graph-b false)
      (p/new-page "undo graph b page")
      (b/new-block "graph b history")
      (b/undo)
      (is (nil? (ls-api-call! :editor.getBlock "graph b history")))
      (graph/switch-graph graph-a false false)
      (is (= "graph a history"
             (get (ls-api-call! :editor.getBlock "graph a history") "content"))))))
