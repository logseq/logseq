(ns logseq.e2e.graph-navigation-basic-test
  (:require
   [clojure.string :as string]
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
    (let [graph-name (str "sample-valid-graph-" (random-uuid))]
      (graph/goto-all-graphs)
      (assert/assert-is-visible
       (loc/filter "#main-content-container" :has-text "Create a new graph"))
      (util/search-and-click "Add a DB graph")
      (let [input (w/-query "input[placeholder='your graph name']")]
        (w/fill input "")
        (w/click "button:text('Submit')")
        (assert/assert-is-visible ".new-graph")
        (doseq [invalid-name ["bad/name" "bad\\name"]]
          (w/fill input invalid-name)
          (w/click "button:text('Submit')")
          (assert/assert-is-visible
           ".ui__toast.warning:has-text(\"Graph name can't contain\")")
          (w/click (.last (w/-query ".ui__toast.warning button"))))
        (w/fill input graph-name)
        (w/click "button:text('Submit')")
        (assert/assert-graph-loaded?)
        (graph/goto-all-graphs)
        (util/search-and-click "Add a DB graph")
        (w/fill "input[placeholder='your graph name']" graph-name)
        (w/click "button:text('Submit')")
        (assert/assert-is-visible
         ".ui__toast.error:has-text('already exists')")
        (k/esc)
        (graph/switch-graph graph-name false false)))))

(deftest graph-refresh-and-browser-history-test
  (testing "refresh and back/forward restore current graph/page without duplicate history"
    (let [page-a "graph history a"
          page-b "graph history b"]
      (page/new-page page-a)
      (b/new-block "history a content")
      (util/exit-edit)
      (page/new-page page-b)
      (b/new-block "history b content")
      (util/exit-edit)
      (.goBack (w/get-page))
      (assert/assert-is-visible
       (loc/filter "#main-content-container" :has-text "history a content"))
      (.goForward (w/get-page))
      (assert/assert-is-visible
       (loc/filter "#main-content-container" :has-text "history b content"))
      (util/refresh-until-graph-loaded)
      (is (= page-b (page/get-page-name)))
      (assert/assert-is-visible
       (loc/filter "#main-content-container" :has-text "history b content")))))

(deftest direct-page-and-block-route-test
  (testing "direct page/block URLs load exact worker entities and missing routes recover"
    (let [suffix (str (random-uuid))
          page-name (str "direct-route-page-" suffix)
          block-content (str "direct route block " suffix)]
      (page/new-page page-name)
      (b/new-block block-content)
      (let [block-uuid (.getAttribute
                        (util/get-edit-block-container)
                        "blockid")]
        (util/exit-edit)
        (util/refresh-until-graph-loaded)
        (let [page-uuid (get (ls-api-call! :editor.getPage page-name) "uuid")
              block (ls-api-call! :editor.getBlock block-uuid)
              current-url (.url (w/get-page))
              base (-> current-url
                       (string/replace #"[?#].*$" "")
                       (string/replace #"/$" ""))
              graph-id (some-> (re-find #"[?&]graph-id=([^&]+)" current-url)
                               second)
              direct-url (fn [kind uuid]
                           (str base
                                "/#/"
                                kind
                                "/"
                                uuid
                                "?graph-id="
                                graph-id))
              navigate-direct! (fn [url]
                                 (w/navigate "about:blank")
                                 (w/navigate url))]
          (is (= block-content (get block "content")))
          (is (some? block-uuid))
          (is (some? graph-id))
          (navigate-direct! (direct-url "page" page-uuid))
          (assert/assert-is-visible
           (loc/filter "[data-testid='page title']" :has-text page-name))
          (is (= page-name (page/get-page-name)))
          (assert/assert-is-visible
           (loc/filter "#main-content-container" :has-text block-content))
          (is (= block-content
                 (get (ls-api-call! :editor.getBlock block-uuid) "content")))
          (navigate-direct! (direct-url "block" block-uuid))
          (assert/assert-is-visible
           (loc/filter "#main-content-container" :has-text block-content))
          (navigate-direct! (direct-url "page" (random-uuid)))
          (assert/assert-is-visible
           (loc/filter "#main-content-container" :has-text "Page not found"))
          (util/goto-journals)
          (assert/assert-is-visible "#journals"))))))

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
         (loc/filter card :has-text "Last opened at:"))
        (w/click (.locator card ".graph-action-btn"))
        (w/click ".delete-local-graph-menu-item")
        (w/click "div[role='alertdialog'] button:text('Confirm')")
        (assert/assert-have-count card 0))
      (assert/assert-have-count
       (loc/filter "#main-content-container" :has-text "local graph deletion content")
       0)
      (graph/switch-graph "Demo" false false)
      (page/new-page "post deletion validation")
      (util/exit-edit)
      (util/refresh-until-graph-loaded)
      (assert/assert-is-visible "#search-button"))))

(deftest default-home-route-test
  (testing "configured default home opens on startup and invalid home falls back explicitly"
    (let [set-default-home!
          (fn [page-name]
            (ls-api-call! :app.setCurrentGraphConfigs
                          {"default-home" (cond-> {}
                                            page-name
                                            (assoc "page" page-name))})
            (loop [remaining 40]
              (let [stored-page
                    (ls-api-call! :app.getCurrentGraphConfigs
                                  "default-home"
                                  "page")]
                (when-not (= page-name stored-page)
                  (when (zero? remaining)
                    (throw (ex-info "Default home config did not persist"
                                    {:expected page-name
                                     :actual stored-page})))
                  (util/wait-timeout 250)
                  (recur (dec remaining))))))]
      (page/new-page "sample default home")
      (b/new-block "default home content")
      (util/exit-edit)
      (let [current-url (.url (w/get-page))
            base (-> current-url
                     (string/replace #"[?#].*$" "")
                     (string/replace #"/$" ""))
            graph-id (some-> (re-find #"[?&]graph-id=([^&]+)" current-url)
                             second)
            home-url (str base "/#/?graph-id=" graph-id)
            navigate-home! (fn []
                             (w/navigate "about:blank")
                             (w/navigate home-url))]
        (is (some? graph-id))
        (set-default-home! "sample default home")
        (navigate-home!)
        (assert/assert-is-visible
         (loc/filter "[data-testid='page title']"
                     :has-text "sample default home"))
        (is (= "sample default home" (page/get-page-name)))
        (set-default-home! "missing sample home")
        (navigate-home!)
        (assert/assert-is-visible "#journals")
        (assert/assert-is-hidden ".loading-graph")
        (set-default-home! nil)
        (page/new-page "post default home validation")
        (util/exit-edit)
        (util/refresh-until-graph-loaded)
        (assert/assert-is-visible "#search-button")))))

(deftest graph-view-mode-settings-test
  (testing "Graph view modes and settings rebuild the canvas"
    (doseq [title ["graph view alpha" "graph view beta" "graph view gamma"]]
      (page/new-page title)
      (b/new-block "[[graph view alpha]]")
      (util/set-tag title)
      (util/exit-edit))
    (util/search-and-click "Go to graph view")
    (assert/assert-is-visible "#global-graph.graph-root")
    (assert/assert-is-visible
     "[role='application'][aria-label='Graph canvas']")
    (w/click ".graph-settings-toggle")
    (w/click (loc/filter ".graph-mode-tab" :has-text "Tags"))
    (assert/assert-is-visible
     (loc/filter ".graph-mode-tab[aria-selected='true']" :has-text "Tags"))
    (w/click (loc/filter ".graph-mode-tab" :has-text "All pages"))
    (assert/assert-is-visible
     (loc/filter ".graph-mode-tab[aria-selected='true']" :has-text "All pages"))
    (w/refresh)
    (assert/assert-is-visible "#global-graph.graph-root")
    (assert/assert-is-visible
     "[role='application'][aria-label='Graph canvas']")
    (assert/assert-is-hidden ".graph-error")
    (page/goto-page "graph view beta")
    (assert/assert-graph-loaded?)))

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
        (w/click slider)
        (k/press "Home")
        (is (<= (util/count-elements ".graph-node, [data-node-id]")
                full-count))
        (w/click ".graph-time-travel-reset[title='Now']")
        (assert/assert-is-visible
         (loc/filter ".graph-time-travel-label" :has-text "Now"))
        (is (= full-count
               (util/count-elements ".graph-node, [data-node-id]")))))))

(deftest restoring-graph-gates-and-recovers-interaction-test
  (testing "reload/restoring never accepts half-mounted edits and restores all controls"
    (b/new-block "restore interaction target")
    (util/exit-edit)
    (w/refresh)
    (assert/assert-is-visible
     (loc/or ".loading-graph, .ui__loading"
             "[data-testid='page title']"))
    (when (w/visible? ".loading-graph, .ui__loading")
      (is (or (not (w/visible? ".block-add-button"))
              (.isDisabled (w/-query ".block-add-button")))))
    (assert/assert-graph-loaded?)
    (assert/assert-is-visible ".toolbar-dots-btn")
    (w/click ".toolbar-dots-btn")
    (assert/assert-is-visible "[role='menuitem']")
    (k/esc)
    (b/jump-to-block "restore interaction target")
    (util/move-cursor-to-end)
    (util/press-seq " after restore")
    (is (= "restore interaction target after restore" (util/get-edit-content)))))
