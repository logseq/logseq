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
   [wally.main :as w])
  (:import
   (com.microsoft.playwright Locator$DragToOptions)))

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

(deftest held-backspace-does-not-duplicate-merged-content-test
  (testing "Repeated Backspace cannot merge the same block twice"
    (p/new-page "held backspace merge")
    (b/new-blocks ["Foo" "" "Foo" "" "Foo" ""])
    (util/repeat-keyboard 75 "Backspace")
    (util/wait-timeout 500)
    (let [editor-content (util/get-edit-content)
          block-contents (util/get-page-blocks-contents)]
      (is (not= "FooFoo" editor-content))
      (is (not-any? #{"FooFoo"} block-contents)))))

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

(defn- wait-for-block-content!
  [block-id expected]
  (loop [attempts-left 40]
    (let [actual (get (ls-api-call! :editor.getBlock block-id) "content")]
      (if (or (= expected actual) (zero? attempts-left))
        (is (= expected actual))
        (do
          (util/wait-timeout 100)
          (recur (dec attempts-left)))))))

(defn- visible-outline-content-tree
  []
  (let [relations
        (w/eval-js
         "(() => {
            const nodes = [...document.querySelectorAll('.ls-page-blocks .ls-block')]
              .filter(node => !node.closest('.is-comments-area, .ls-comments-area, .ls-comment-row'));
            return nodes
              .map((node, index) => {
                const own = selector => [...node.querySelectorAll(selector)]
                  .find(child => child.closest('.ls-block') === node);
                const editor = own('.editor-wrapper textarea');
                const content = own('.block-content');
                const title = (editor && editor.offsetParent !== null
                               ? editor.value
                               : content?.innerText || node.dataset.blockTitle || '').trim();
                const parent = node.parentElement.closest('.ls-block');
                return [index, title, parent ? nodes.indexOf(parent) : null];
              })
              .filter(([_index, title]) => title);
          })()")
        children-by-parent (group-by #(nth % 2) relations)
        build-tree (fn build-tree [parent]
                     (mapv (fn [[index title]]
                             [title (build-tree index)])
                           (get children-by-parent parent)))]
    (build-tree nil)))

(defn- wait-for-content-tree!
  [_page-name expected]
  (util/wait-timeout 300)
  (loop [attempts 40]
    (let [actual (visible-outline-content-tree)]
      (if (= expected actual)
        (do
          (util/wait-timeout 250)
          (is (= expected (visible-outline-content-tree))))
        (if (zero? attempts)
          (is (= expected actual))
          (do
            (util/wait-timeout 100)
            (recur (dec attempts))))))))

(defn- undo-and-wait-for-content-tree!
  [page-name expected]
  (b/undo)
  (util/wait-timeout 1000)
  (wait-for-content-tree! page-name expected))

(defn- redo-and-wait-for-content-tree!
  [page-name expected]
  (b/redo)
  (util/wait-timeout 1000)
  (wait-for-content-tree! page-name expected))

(defn- click-block-by-uuid!
  [uuid]
  (w/click (.first (w/-query (str "#block-content-" uuid ":visible")))))

(defn- click-block-by-title!
  [title]
  (let [target-selector
        (w/eval-js
         (format
          "(() => {
             const root = document.querySelector(\".ls-block[data-block-title='%s']\");
             const own = selector => [...root.querySelectorAll(selector)]
               .find(node => node.closest('.ls-block') === root);
             const editor = own('textarea');
             const target = editor && editor.offsetParent !== null
               ? editor
               : own('.block-content');
             return `#${CSS.escape(target.id)}`;
           })()"
          title))]
    (w/click target-selector)
    (w/eval-js
     (format
      "(() => new Promise((resolve, reject) => {
         let attempts = 40;
         const waitForTarget = () => {
           const root = document.querySelector(\".ls-block[data-block-title='%s']\");
           const target = [...root.querySelectorAll('textarea')]
             .find(node => node.closest('.ls-block') === root && node.offsetParent !== null);
           if (target) {
             target.focus();
             resolve(true);
           } else if (attempts-- === 0) {
             reject(new Error('Target block editor did not become active'));
           } else {
             setTimeout(waitForTarget, 50);
           }
         };
         waitForTarget();
       }))()"
      title))))

(defn- move-editor-cursor-to-start!
  []
  (w/eval-js
   "(() => {
      const editor = document.activeElement?.matches('.editor-wrapper textarea')
        ? document.activeElement
        : [...document.querySelectorAll('.editor-wrapper textarea')]
          .find(node => node.offsetParent !== null);
      editor.focus();
      editor.setSelectionRange(0, 0);
    })();"))

(defn- move-editor-cursor-to!
  [position]
  (w/eval-js
   (format
    "(() => {
       const editor = document.activeElement?.matches('.editor-wrapper textarea')
         ? document.activeElement
         : [...document.querySelectorAll('.editor-wrapper textarea')]
           .find(node => node.offsetParent !== null);
       editor.focus();
       editor.setSelectionRange(%d, %d);
     })();"
    position
    position)))

(defn- move-editor-cursor-to-end!
  []
  (w/eval-js
   "(() => {
      const editor = document.activeElement?.matches('.editor-wrapper textarea')
        ? document.activeElement
        : [...document.querySelectorAll('.editor-wrapper textarea')]
          .find(node => node.offsetParent !== null);
      editor.focus();
      editor.setSelectionRange(editor.value.length, editor.value.length);
    })();"))

(deftest boundary-delete-and-backspace-merge-contract-test
  (testing "boundary edits preserve structure through per-step and full-history undo/redo"
    (let [page-name "boundary edit history"
          page-uuid (do
                      (p/new-page page-name)
                      (get (ls-api-call! :editor.getBlock page-name) "uuid"))
          [_left right _child _source _source-child leaf]
          (ls-api-call! :editor.insertBatchBlock
                        page-uuid
                        [{:content "b"}
                         {:content "c"
                          :children [{:content "d"}]}
                         {:content "e"
                          :children [{:content "f"}]}
                         {:content "g"}])
          initial [["b" []]
                   ["c" [["d" []]]]
                   ["e" [["f" []]]]
                   ["g" []]]
          after-backspace [["bc" [["d" []]]]
                           ["e" [["f" []]]]
                           ["g" []]]
          after-enter [["b" [["c" []]
                              ["d" []]]]
                       ["e" [["f" []]]]
                       ["g" []]]
          after-delete [["b" [["c" []]
                               ["d" []]]]
                        ["e" [["fg" []]]]]
          assert-tree! (partial wait-for-content-tree! page-name)]
      (click-block-by-uuid! (get right "uuid"))
      (util/wait-editor-visible)
      (move-editor-cursor-to-start!)
      (k/backspace)
      (assert-tree! after-backspace)
      (is (= "bc" (util/get-edit-content)))
      (is (= 1
             (w/eval-js
              "document.querySelector('.editor-wrapper textarea').selectionStart")))
      (undo-and-wait-for-content-tree! page-name initial)
      (redo-and-wait-for-content-tree! page-name after-backspace)

      (click-block-by-title! "bc")
      (util/wait-editor-visible)
      (move-editor-cursor-to! 1)
      (is (= ["bc" 1]
             (w/eval-js
              "(() => {
                 const editor = document.activeElement;
                 return [editor.value, editor.selectionStart];
               })()")))
      (k/enter)
      (util/wait-timeout 1000)
      (assert-tree! after-enter)
      (undo-and-wait-for-content-tree! page-name after-backspace)
      (redo-and-wait-for-content-tree! page-name after-enter)

      (click-block-by-title! "e")
      (util/wait-editor-visible)
      (move-editor-cursor-to-start!)
      (k/backspace)
      (assert-tree! after-enter)

      (click-block-by-title! "d")
      (util/wait-editor-visible)
      (move-editor-cursor-to-end!)
      (k/delete)
      (assert-tree! after-enter)

      (click-block-by-title! "f")
      (util/wait-editor-visible)
      (move-editor-cursor-to-end!)
      (k/delete)
      (assert-tree! after-delete)
      (is (nil? (ls-api-call! :editor.getBlock (get leaf "uuid"))))
      (undo-and-wait-for-content-tree! page-name after-enter)
      (redo-and-wait-for-content-tree! page-name after-delete)

      (undo-and-wait-for-content-tree! page-name after-enter)
      (undo-and-wait-for-content-tree! page-name after-backspace)
      (undo-and-wait-for-content-tree! page-name initial))))

(defn- drag-block!
  [source-title target-title placement]
  (let [source-block (w/-query
                      (format ".ls-page-blocks .ls-block[data-block-title='%s']"
                              source-title))
        target-block (w/-query
                      (format ".ls-page-blocks .ls-block[data-block-title='%s']"
                              target-title))
        target-height (.-height (.boundingBox target-block))
        target-x (if (= placement "inside") 80 30)
        target-y (case placement
                   "before" 2
                   "after" (- target-height 2)
                   "inside" (- target-height 2))
        options (doto (Locator$DragToOptions.)
                  (.setTargetPosition target-x target-y)
                  (.setSteps 12))]
    (.dragTo (.first (.locator source-block ".bullet-container"))
             target-block
             options)
    (util/wait-timeout 250)))

(deftest drag-reorders-once-and-is-undoable-test
  (testing "same-level drag changes order once and undo restores the original order"
    (let [page-name (p/get-page-name)
          initial [["drag first" []]
                   ["drag second" []]
                   ["drag third" []]]
          reordered [["drag third" []]
                     ["drag first" []]
                     ["drag second" []]]]
      (b/new-blocks ["drag first" "drag second" "drag third"])
      (util/exit-edit)
      (wait-for-content-tree! page-name initial)
      (drag-block! "drag third" "drag first" "before")
      (wait-for-content-tree! page-name reordered)
      (undo-and-wait-for-content-tree! page-name initial))))

(deftest drag-indents-and-outdents-test
  (testing "dragging into and out of a parent updates both sides of the tree"
    (let [page-name (p/get-page-name)
          initial [["drag parent" []]
                   ["drag child candidate" []]
                   ["drag tail" []]]
          indented [["drag parent" [["drag child candidate" []]]]
                    ["drag tail" []]]
          outdented [["drag parent" []]
                     ["drag tail" []]
                     ["drag child candidate" []]]]
      (b/new-blocks ["drag parent" "drag child candidate" "drag tail"])
      (util/exit-edit)
      (wait-for-content-tree! page-name initial)
      (drag-block! "drag child candidate" "drag parent" "inside")
      (wait-for-content-tree! page-name indented)
      (drag-block! "drag child candidate" "drag tail" "after")
      (wait-for-content-tree! page-name outdented))))

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
      (let [graph-a-block-id (current-editing-block-id)]
        (wait-for-block-content! graph-a-block-id "graph a history")
        (graph/new-graph graph-b false)
        (p/new-page "undo graph b page")
        (b/new-block "graph b history")
        (let [graph-b-block-id (current-editing-block-id)]
          (wait-for-block-content! graph-b-block-id "graph b history")
          (b/undo)
          (wait-for-block-content! graph-b-block-id "")
          (graph/switch-graph graph-a false false)
          (wait-for-block-content! graph-a-block-id "graph a history"))))))
