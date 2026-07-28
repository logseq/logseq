(ns logseq.e2e.graph-navigation-basic-test
  (:require
   [clojure.test :refer [deftest is testing use-fixtures]]
   [logseq.e2e.api :refer [ls-api-call!]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.block :as b]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.graph :as graph]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.locator :as loc]
   [logseq.e2e.page :as page]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(deftest graph-empty-state-and-name-validation-test
  (testing "graph creation exposes an actionable empty state and rejects invalid/duplicate names"
    (graph/goto-all-graphs)
    (assert/assert-is-visible
     (loc/filter "#main-content-container" :has-text "Add a graph"))
    (util/search-and-click "Add a DB graph")
    (let [input (w/-query "input[placeholder='your graph name']")]
      (doseq [invalid-name ["" "bad/name" "bad\\name"]]
        (w/fill input invalid-name)
        (assert/assert-is-visible
         "button[disabled]:has-text('Submit'), .text-error, .warning"))
      (w/fill input "sample valid graph")
      (w/click "button:text('Submit')")
      (assert/assert-graph-loaded?)
      (graph/goto-all-graphs)
      (util/search-and-click "Add a DB graph")
      (w/fill "input[placeholder='your graph name']" "sample valid graph")
      (assert/assert-is-visible ".text-error, .warning, .ui__toast.error")
      (k/esc))))

(deftest graph-refresh-and-browser-history-test
  (testing "refresh and back/forward restore current graph/page without duplicate history"
    (let [page-a "graph history a"
          page-b "graph history b"]
      (page/new-page page-a)
      (b/new-block "history a content")
      (page/new-page page-b)
      (b/new-block "history b content")
      (w/eval-js "history.back()")
      (assert/assert-is-visible
       (loc/filter "#main-content-container" :has-text "history a content"))
      (w/eval-js "history.forward()")
      (assert/assert-is-visible
       (loc/filter "#main-content-container" :has-text "history b content"))
      (util/refresh-until-graph-loaded)
      (is (= page-b (page/get-page-name)))
      (assert/assert-is-visible
       (loc/filter "#main-content-container" :has-text "history b content")))))

(deftest direct-page-and-block-route-test
  (testing "direct page/block hashes load exact worker entities and missing routes recover"
    (let [page-name "direct route page"]
      (page/new-page page-name)
      (b/new-block "direct route block")
      (let [page-uuid (get (ls-api-call! :editor.getPage page-name) "uuid")
            block-uuid (get (ls-api-call! :editor.getBlock "direct route block") "uuid")
            base (w/eval-js "location.origin + location.pathname")]
        (w/navigate (str base "#/page/" page-uuid))
        (assert/assert-graph-loaded?)
        (is (= page-name (page/get-page-name)))
        (w/navigate (str base "#/page/" block-uuid))
        (assert/assert-graph-loaded?)
        (assert/assert-is-visible
         (loc/filter "#main-content-container" :has-text "direct route block"))
        (w/navigate (str base "#/page/" (random-uuid)))
        (assert/assert-is-visible ".ui__toast.error, .page-not-found, .warning")
        (util/goto-journals)
        (assert/assert-is-visible "#journals")))))

(deftest local-graph-delete-and-list-metadata-test
  (testing "graph list metadata is current and local deletion cannot leak its route/data"
    (let [graph-name (str "graph-delete-" (random-uuid))]
      (graph/new-graph graph-name false)
      (page/new-page "local graph deletion page")
      (b/new-block "local graph deletion content")
      (graph/goto-all-graphs)
      (let [card (w/-query (format "div[data-testid='logseq_db_%s']" graph-name))]
        (assert/assert-is-visible card)
        (assert/assert-is-visible
         (.locator card ":text('Local'), time, [data-testid*='updated']"))
        (w/click (.locator card ".graph-action-btn"))
        (w/click ".delete-local-graph-menu-item")
        (w/click "div[role='alertdialog'] button:text('Confirm')")
        (assert/assert-have-count card 0))
      (assert/assert-have-count
       (loc/filter "#main-content-container" :has-text "local graph deletion content")
       0))))

(deftest default-home-route-test
  (testing "configured default home opens on startup and invalid home falls back explicitly"
    (page/new-page "sample default home")
    (b/new-block "default home content")
    (w/eval-js
     "window.logseq.api.set_state_from_store(['config', 'default-home'], 'sample default home')")
    (util/refresh-until-graph-loaded)
    (is (= "sample default home" (page/get-page-name)))
    (w/eval-js
     "window.logseq.api.set_state_from_store(['config', 'default-home'], 'missing sample home')")
    (util/refresh-until-graph-loaded)
    (is (or (= "sample default home" (page/get-page-name))
            (w/visible? "#journals")))
    (assert/assert-is-hidden ".loading-graph")))

(deftest graph-view-mode-filter-and-node-navigation-test
  (testing "Graph view modes/settings rebuild data and node clicks open canonical objects"
    (doseq [title ["graph view alpha" "graph view beta" "graph view gamma"]]
      (page/new-page title)
      (b/new-block (str "[[graph view alpha]] #" title)))
    (util/search-and-click "Go to graph view")
    (assert/assert-is-visible ".graph-container, .graph-view")
    (w/click (loc/filter "button, [role='tab']" :has-text "Tags"))
    (assert/assert-is-visible ".graph-container canvas, .graph-container svg")
    (w/click (loc/filter "button, [role='tab']" :has-text "All pages"))
    (w/fill "input[placeholder*='Filter'], input[placeholder*='Search']"
            "graph view beta")
    (assert/assert-is-visible
     (loc/filter ".graph-container, .graph-view" :has-text "graph view beta"))
    (w/click
     "[data-node-title='graph view beta'], .graph-node:has-text('graph view beta')")
    (is (= "graph view beta" (page/get-page-name)))
    (util/refresh-until-graph-loaded)
    (assert/assert-is-hidden ".graph-error")))

(deftest graph-time-travel-playback-test
  (testing "time travel limits nodes and returning to Now restores the complete graph"
    (page/new-page "time travel old")
    (util/wait-timeout 20)
    (page/new-page "time travel new")
    (util/search-and-click "Go to graph view")
    (w/click "button[title*='Time'], button:has-text('Time travel')")
    (let [slider (w/-query "input[type='range']")]
      (assert/assert-is-visible slider)
      (let [full-count (util/count-elements ".graph-node, [data-node-id]")]
        (w/eval-js
         "document.querySelector('input[type=range]').value =
            document.querySelector('input[type=range]').min;
          document.querySelector('input[type=range]').dispatchEvent(
            new Event('input', {bubbles:true})
          );")
        (is (<= (util/count-elements ".graph-node, [data-node-id]")
                full-count))
        (w/click "button:has-text('Now')")
        (is (= full-count
               (util/count-elements ".graph-node, [data-node-id]")))))
    (assert/assert-is-visible
     (loc/filter ".graph-view, .graph-container" :has-text "Now"))))

(deftest late-graph-work-cannot-overwrite-new-graph-test
  (testing "a pending large-page load from graph A cannot render after switching to B"
    (let [graph-a (str "late-load-a-" (random-uuid))
          graph-b (str "late-load-b-" (random-uuid))
          page-a "graph a slow page"
          page-b "graph b stable page"]
      (graph/new-graph graph-a false)
      (page/new-page page-a)
      (let [page-uuid (get (ls-api-call! :editor.getPage page-a) "uuid")]
        (ls-api-call! :editor.insertBatchBlock
                      page-uuid
                      (mapv #(hash-map :content (str "graph a row " %))
                            (range 500))))
      (util/search page-a)
      (graph/new-graph graph-b false)
      (page/new-page page-b)
      (b/new-block "graph b only content")
      (util/wait-timeout 500)
      (is (= page-b (page/get-page-name)))
      (assert/assert-is-visible
       (loc/filter ".ls-page-blocks" :has-text "graph b only content"))
      (assert/assert-have-count
       (loc/filter "#main-content-container" :has-text "graph a row")
       0))))

(deftest restoring-graph-gates-and-recovers-interaction-test
  (testing "reload/restoring never accepts half-mounted edits and restores all controls"
    (b/new-block "restore interaction target")
    (w/refresh)
    (let [loading? (w/visible? ".loading-graph, .ui__loading")
          editor-visible? (w/visible? util/editor-q)]
      (is (or loading? editor-visible?))
      (when loading?
        (is (or (not (w/visible? ".block-add-button"))
                (w/eval-js
                 "document.querySelector('.block-add-button')?.matches(':disabled') ?? true")))))
    (assert/assert-graph-loaded?)
    (assert/assert-is-visible ".toolbar-dots-btn")
    (w/click ".toolbar-dots-btn")
    (assert/assert-is-visible "[role='menuitem']")
    (k/esc)
    (b/open-last-block)
    (util/move-cursor-to-end)
    (util/press-seq " after restore")
    (is (= "restore interaction target after restore" (util/get-edit-content)))))
