(ns logseq.e2e.shell-search-basic-test
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

(defn- open-settings!
  []
  (util/double-esc)
  (w/click ".toolbar-dots-btn")
  (w/click (loc/filter "[role='menuitem']" :has-text "Settings"))
  (assert/assert-is-visible "#settings"))

(defn- settings-tab!
  [id]
  (w/click (format ".settings-menu-item[data-id='%s']" id))
  (assert/assert-have-count ".settings-menu-item.active" 1))

(defn- create-view-data!
  [tag-name rows]
  (ls-api-call! :editor.createTag
                tag-name
                {:tagProperties [{:name "Text column"}
                                 {:name "Number column"
                                  :schema {:type "number"}}
                                 {:name "Date column"
                                  :schema {:type "date"}}]})
  (doseq [[title text-value number-value date-value] rows]
    (ls-api-call! :editor.insertBlock
                  (page/get-page-name)
                  (str title " #" tag-name)
                  {:properties {"Text column" text-value
                                "Number column" number-value
                                "Date column" date-value}}))
  (page/goto-page tag-name)
  (assert/assert-is-visible ".ls-view-body .ls-table-row"))

(deftest graph-create-switch-and-unsaved-edit-isolation-test
  (testing "local graphs create once and switching preserves pending edits per graph"
    (let [graph-a (str "graph-a-" (random-uuid))
          graph-b (str "graph-b-" (random-uuid))]
      (graph/new-graph graph-a false)
      (util/goto-journals)
      (b/new-block "graph a pending text")
      (graph/new-graph graph-b false)
      (util/goto-journals)
      (b/new-block "graph b only text")
      (assert/assert-have-count
       (loc/filter "#main-content-container" :has-text "graph a pending text")
       0)
      (graph/switch-graph graph-a false false)
      (assert/assert-is-visible
       (loc/filter "#main-content-container" :has-text "graph a pending text"))
      (assert/assert-have-count
       (loc/filter "#main-content-container" :has-text "graph b only text")
       0)
      (util/refresh-until-graph-loaded)
      (assert/assert-is-visible "#journals"))))

(deftest global-and-current-page-search-navigation-test
  (testing "global and page-scoped search expose context and navigate the exact result"
    (let [target-page "sample search target"
          other-page "sample search other"
          target-text "unique current page needle"]
      (page/new-page target-page)
      (b/new-blocks ["collapsed search parent" target-text])
      (b/indent)
      (util/exit-edit)
      (w/click ".ls-page-blocks .ls-block:first-of-type .bullet-container")
      (page/new-page other-page)
      (b/new-block target-text)
      (page/goto-page target-page)
      (util/search-and-click "Search blocks in page")
      (w/fill ".cp__cmdk-search-input" target-text)
      (assert/assert-have-count
       (loc/filter ".search-results" :has-text other-page)
       0)
      (w/click (.first (loc/filter ".search-results" :has-text target-text)))
      (assert/assert-is-visible
       (loc/filter ".ls-page-blocks" :has-text target-text))
      (util/search target-text)
      (assert/assert-is-visible
       (loc/filter ".search-results" :has-text other-page)))))

(deftest table-sort-columns-width-and-persistence-test
  (testing "typed sorting, column visibility/order and width persist after edits and refresh"
    (create-view-data!
     "sample table class"
     [["table alpha" "z" 2 "2026-07-29"]
      ["table beta" "a" 1 "2026-07-28"]])
    (w/click (loc/filter ".ls-table-header-cell" :has-text "Number column"))
    (w/click (loc/filter "[role='menuitem']" :has-text "Sort ascending"))
    (let [body (util/get-text ".ls-view-body")]
      (is (< (string/index-of body "table beta")
             (string/index-of body "table alpha"))))
    (w/click ".view-actions button:has(.ls-icon-dots)")
    (w/click (loc/filter "[role='menuitem']" :has-text "Columns visibility"))
    (w/click (loc/filter "[role='menuitemcheckbox']" :has-text "Text column"))
    (assert/assert-have-count
     (loc/filter ".ls-table-header-cell" :has-text "Text column")
     0)
    (let [handle (w/-query
                  ".ls-table-header-cell:has-text('Number column') .column-resize-handle")]
      (.dragTo handle (w/-query
                       ".ls-table-header-cell:has-text('Date column')")))
    (let [width (.getAttribute
                 (w/-query ".ls-table-header-cell:has-text('Number column')")
                 "style")]
      (is (string/includes? width "width")))
    (util/refresh-until-graph-loaded)
    (assert/assert-have-count
     (loc/filter ".ls-table-header-cell" :has-text "Text column")
     0)))

(deftest today-and-empty-query-render-test
  (testing "today and empty query resources render a stable empty/result state"
    (util/goto-journals)
    (assert/assert-is-visible "#today-queries")
    (assert/assert-have-count "#today-queries .block-content-fallback-ui" 0)
    (let [query-tag (ls-api-call! :editor.getTag "logseq.class/Query")
          query (ls-api-call! :editor.appendBlockInPage
                              (page/get-page-name)
                              "sample empty query"
                              {:properties {:block/tags #{(get query-tag "id")}}})]
      (ls-api-call! :editor.updateBlock
                    (get query ":logseq.property/query")
                    "")
      (assert/assert-is-visible
       (loc/filter ".ls-block" :has-text "sample empty query"))
      (assert/assert-have-count
       (loc/filter ".ls-block" :has-text "Query error")
       0))))

(deftest search-builtins-tags-and-special-terms-test
  (testing "search modes handle built-ins, user tags, Unicode and FTS punctuation safely"
    (ls-api-call! :editor.createTag "sample searchable tag")
    (b/new-block "搜索 Unicode \"quoted\" OR    spaced")
    (doseq [term ["sample searchable tag" "Task" "搜索" "\"quoted\"" "OR    spaced"
                  "no-result-needle"]]
      (util/search term)
      (assert/assert-is-hidden
       (loc/filter ".ui__toast.error" :has-text "FTS"))
      (if (= term "no-result-needle")
        (assert/assert-is-visible
         ".search-results-empty, .search-results:has-text('No result')")
        (assert/assert-is-visible ".search-results"))
      (k/esc))
    (util/search "Task")
    (assert/assert-is-visible
     (loc/filter ".search-results" :has-text "Task"))))

(deftest command-palette-state-history-and-single-execution-test
  (testing "palette filtering closes cleanly and history never duplicates execution"
    (k/press "ControlOrMeta+Shift+p")
    (assert/assert-is-visible ".cp__cmdk")
    (w/fill ".cp__cmdk-search-input" "Toggle right sidebar")
    (assert/assert-have-count
     (loc/filter ".search-results" :has-text "Toggle right sidebar")
     1)
    (k/enter)
    (assert/assert-is-visible ".cp__right-sidebar.open")
    (assert/assert-is-hidden ".cp__cmdk")
    (k/press "ControlOrMeta+Shift+p")
    (assert/assert-have-count
     (loc/filter ".search-results" :has-text "Toggle right sidebar")
     1)
    (k/esc)
    (assert/assert-is-hidden ".cp__cmdk")
    (k/press "ControlOrMeta+Shift+p")
    (is (string/blank? (.inputValue (w/-query ".cp__cmdk-search-input"))))))

(deftest shortcut-help-customization-conflict-and-tooltip-test
  (testing "keymap search/edit/conflict/tooltip state updates without reopening the app"
    (open-settings!)
    (settings-tab! "keymap")
    (w/fill "input[placeholder*='Search']" "Toggle right sidebar")
    (let [row (loc/filter ".keyboard-shortcut-row, tr"
                          :has-text "Toggle right sidebar")]
      (assert/assert-is-visible row)
      (w/click (.locator row "button:has-text('Edit'), .shortcut-binding"))
      (k/press "Control+Alt+9")
      (w/click (util/get-by-text "Save" true))
      (assert/assert-is-visible (loc/filter row :has-text "Ctrl"))
      (w/click (.locator row "button:has-text('Edit'), .shortcut-binding"))
      (k/press "ControlOrMeta+k")
      (assert/assert-is-visible ".text-warning, .ui__toast.warning")
      (k/esc))
    (settings-tab! "general")
    (let [toggle (loc/filter ".form-control" :has-text "shortcut")]
      (w/click (.locator toggle "button[role='switch']")))
    (k/esc)
    (.hover (w/-query ".toggle-right-sidebar"))
    (assert/assert-is-visible "[role='tooltip']")
    (open-settings!)
    (settings-tab! "keymap")
    (assert/assert-is-visible
     (loc/filter ".keyboard-shortcut-row, tr"
                 :has-text "Toggle right sidebar"))))

(deftest sequential-shortcuts-and-editor-scope-test
  (testing "key sequences navigate in normal mode and remain literal while editing"
    (util/double-esc)
    (doseq [[keys expected]
            [[["g" "h"] "Home"]
             [["g" "j"] "Journal"]
             [["g" "a"] "All"]]]
      (doseq [key keys] (k/press key))
      (assert/assert-is-visible
       (loc/filter "#main-content-container" :has-text expected)))
    (b/open-last-block)
    (util/input "sequence ")
    (doseq [key ["g" "h" "g" "j" "t" "r"]]
      (util/press-seq key))
    (is (= "sequence ghgjtr" (util/get-edit-content)))
    (assert/assert-is-hidden ".cp__right-sidebar.open")))

(deftest sidebar-add-multi-instance-menu-and-order-test
  (testing "sidebar items are unique, reorderable and obey item menu scope"
    (doseq [title ["sidebar sample a" "sidebar sample b" "sidebar sample c"]]
      (page/new-page title)
      (util/exit-edit)
      (k/press "Shift+Enter"))
    (assert/assert-have-count ".cp__right-sidebar .sidebar-item" 3)
    (let [first-title (util/get-text
                       ".cp__right-sidebar .sidebar-item:first-child")
          last-item (w/-query ".cp__right-sidebar .sidebar-item:last-child")
          first-item (w/-query ".cp__right-sidebar .sidebar-item:first-child")]
      (.dragTo last-item first-item)
      (is (not= first-title
                (util/get-text
                 ".cp__right-sidebar .sidebar-item:first-child"))))
    (w/click
     ".cp__right-sidebar .sidebar-item:first-child button[aria-label*='More']")
    (w/click (loc/filter "[role='menuitem']" :has-text "Collapse others"))
    (assert/assert-have-count
     ".cp__right-sidebar .sidebar-item:not(.collapsed)"
     1)
    (w/click
     ".cp__right-sidebar .sidebar-item:first-child button[aria-label*='More']")
    (w/click (loc/filter "[role='menuitem']" :has-text "Close others"))
    (assert/assert-have-count ".cp__right-sidebar .sidebar-item" 1)
    (w/click
     ".cp__right-sidebar .sidebar-item:first-child button[aria-label*='More']")
    (w/click (loc/filter "[role='menuitem']" :has-text "Open as page"))
    (assert/assert-is-hidden ".cp__right-sidebar.open")))

(deftest sidebar-resize-bounds-and-persistence-test
  (testing "sidebar resize is bounded and leaves one content scrollbar"
    (w/click ".toggle-right-sidebar")
    (let [handle (w/-query ".cp__right-sidebar .resizer, .cp__right-sidebar-resizer")]
      (.hover handle)
      (w/eval-js
       "(() => {
          const handle = document.querySelector('.cp__right-sidebar .resizer, .cp__right-sidebar-resizer');
          const rect = handle.getBoundingClientRect();
          handle.dispatchEvent(new PointerEvent('pointerdown',
            {bubbles:true, buttons:1, clientX:rect.left, clientY:rect.top}));
          document.dispatchEvent(new PointerEvent('pointermove',
            {bubbles:true, buttons:1, clientX:20, clientY:rect.top}));
          document.dispatchEvent(new PointerEvent('pointerup',
            {bubbles:true, buttons:0, clientX:20, clientY:rect.top}));
        })()"))
    (let [width (w/eval-js
                 "document.querySelector('.cp__right-sidebar').getBoundingClientRect().width")]
      (is (< 200 width (- (w/eval-js "window.innerWidth") 200))))
    (util/refresh-until-graph-loaded)
    (assert/assert-have-count
     ".cp__right-sidebar .sidebar-item-list"
     1)))

(deftest built-in-sidebar-items-and-help-links-test
  (testing "built-in sidebar panels mount current content and release it on close"
    (doseq [command ["Toggle contents in sidebar"
                     "Toggle page graph in sidebar"
                     "Open help"]]
      (util/search-and-click command)
      (assert/assert-is-visible ".cp__right-sidebar.open")
      (assert/assert-is-visible ".cp__right-sidebar .sidebar-item")
      (w/click
       ".cp__right-sidebar .sidebar-item:last-child button[aria-label*='Close']")
      (assert/assert-have-count ".cp__right-sidebar .sidebar-item" 0))
    (util/search-and-click "Open help")
    (doseq [section ["Usage" "Community" "Development" "About"]]
      (assert/assert-is-visible
       (loc/filter ".cp__right-sidebar" :has-text section)))
    (assert/assert-is-visible ".cp__right-sidebar a[href]")))

(deftest document-wide-and-recent-highlight-modes-test
  (testing "layout/highlight modes toggle classes without losing editor or selection"
    (b/new-block "layout mode target")
    (util/exit-edit)
    (doseq [keys [["t" "d"] ["t" "w"]]]
      (doseq [key keys] (k/press key)))
    (is (or (w/eval-js
             "document.documentElement.classList.contains('is-wide-mode')")
            (w/eval-js
             "document.querySelector('#main-content-container').classList.contains('document-mode')")))
    (util/search-and-click "Highlight recent blocks")
    (assert/assert-is-visible ".recent-block, .is-recent")
    (util/search-and-click "Highlight recent blocks")
    (assert/assert-have-count ".recent-block, .is-recent" 0)
    (w/click (loc/filter ".block-title-wrap" :has-text "layout mode target"))
    (is (= "layout mode target" (util/get-edit-content)))))

(deftest theme-language-font-accent-and-default-restore-test
  (testing "general appearance settings repaint, persist and restore default CSS"
    (open-settings!)
    (settings-tab! "general")
    (let [initial-language (w/eval-js "document.documentElement.lang")]
      (w/click ".cp__settings-general .ui__select-trigger")
      (w/click (loc/filter "[role='option']" :has-text "简体中文"))
      (is (= "zh-CN" (w/eval-js "document.documentElement.lang")))
      (w/click ".cp__settings-general .ui__select-trigger")
      (w/click (loc/filter "[role='option']" :has-text "English"))
      (is (= initial-language (w/eval-js "document.documentElement.lang"))))
    (settings-tab! "general")
    (w/click (loc/filter ".cp__theme-modes-options" :has-text "Dark"))
    (is (= "dark" (w/eval-js "document.documentElement.dataset.theme")))
    (w/click "input[type='color'], button[aria-label*='accent']")
    (w/click "[data-color='purple']")
    (is (not (string/blank?
              (w/eval-js
               "getComputedStyle(document.documentElement)
                  .getPropertyValue('--ls-link-text-color')"))))
    (k/esc)
    (util/refresh-until-graph-loaded)
    (is (= "dark" (w/eval-js "document.documentElement.dataset.theme")))
    (open-settings!)
    (settings-tab! "general")
    (w/click (util/get-by-text "Default" true))
    (k/esc)
    (assert/assert-is-hidden "link[data-theme]:not([href*='default'])")))

(deftest editor-settings-immediate-behavior-and-persistence-test
  (testing "editor toggles alter their target behavior and persist after refresh"
    (open-settings!)
    (settings-tab! "editor")
    (doseq [label ["Show brackets" "Wide mode" "Logical outdenting"
                   "Auto-expand block references" "Shortcut tooltip"]]
      (let [row (loc/filter ".form-control, label" :has-text label)]
        (assert/assert-is-visible row)
        (w/click (.locator row "button[role='switch'], input[type='checkbox']"))))
    (k/esc)
    (b/new-block "[[editor settings reference]]")
    (util/exit-edit)
    (assert/assert-have-count ".page-reference .text-gray-500" 0)
    (util/refresh-until-graph-loaded)
    (open-settings!)
    (settings-tab! "editor")
    (doseq [label ["Show brackets" "Wide mode" "Logical outdenting"]]
      (assert/assert-is-visible
       (loc/filter ".form-control:has([aria-checked='true']), label:has(input:checked)"
                   :has-text label)))))

(deftest handbook-navigation-search-and-cleanup-test
  (testing "Handbook route/search/history/copy-link reload without stale listeners"
    (util/search-and-click "Open handbook")
    (assert/assert-is-visible ".handbook, .cp__handbook")
    (w/fill ".handbook input[type='search'], .cp__handbook input[type='search']"
            "properties")
    (assert/assert-is-visible
     (loc/filter ".handbook, .cp__handbook" :has-text "properties"))
    (w/click
     ".handbook a, .cp__handbook a")
    (w/click "button[title='Copy link'], button:has-text('Copy link')")
    (let [link (w/eval-js "navigator.clipboard.readText()")]
      (is (string/starts-with? link "logseq://handbook/")))
    (k/esc)
    (assert/assert-is-hidden ".handbook, .cp__handbook")
    (util/search-and-click "Open handbook")
    (assert/assert-is-visible ".handbook, .cp__handbook")))

(defn- block-uuid
  [title]
  (get (ls-api-call! :editor.getBlock title) "uuid"))

(deftest large-view-virtual-scroll-stays-stable-test
  (testing "a 1000-row view has stable top/middle/bottom identities after scrolling"
    (let [tag-name "large-view-e2e"
          page-name (page/get-page-name)
          page-uuid (get (ls-api-call! :editor.getPage page-name) "uuid")
          rows (mapv (fn [idx] {:content (format "large row %04d #%s" idx tag-name)})
                     (range 1001))]
      (ls-api-call! :editor.createTag tag-name)
      (ls-api-call! :editor.insertBatchBlock page-uuid rows)
      (page/goto-page tag-name)
      (assert/assert-is-visible
       (loc/filter ".ls-view-body" :has-text "large row 0000"))
      (w/eval-js
       "document.querySelector('#main-content-container').scrollTop =
          document.querySelector('#main-content-container').scrollHeight / 2")
      (util/wait-timeout 200)
      (is (pos? (util/count-elements ".ls-view-body .ls-table-row")))
      (w/eval-js
       "document.querySelector('#main-content-container').scrollTop =
          document.querySelector('#main-content-container').scrollHeight")
      (assert/assert-is-visible
       (loc/filter ".ls-view-body" :has-text "large row 1000"))
      (is (= (util/count-elements ".ls-view-body .ls-table-row")
             (util/count-elements ".ls-view-body .ls-table-row [data-index]"))))))

(deftest invalid-query-recovers-after-edit-test
  (testing "a query error stays local and a corrected query replaces the error"
    (let [query-tag (ls-api-call! :editor.getTag "logseq.class/Query")
          query-block (ls-api-call! :editor.appendBlockInPage
                                    (page/get-page-name)
                                    "invalid query"
                                    {:properties {:block/tags #{(get query-tag "id")}}})
          query-uuid (get query-block ":logseq.property/query")]
      (ls-api-call! :editor.updateBlock query-uuid "[:find ?e :where [broken]")
      (assert/assert-is-visible
       (loc/filter ".ls-block" :has-text "Query error"))
      (b/new-block "page remains editable after query error")
      (ls-api-call! :editor.updateBlock query-uuid "[[Query]]")
      (w/wait-for-not-visible ".ls-block:has-text('Query error')")
      (assert/assert-is-visible
       (loc/filter ".ls-block" :has-text "page remains editable after query error")))))

(deftest global-block-search-opens-owning-page-test
  (testing "global search shows block context and navigates to the exact UUID"
    (let [target-page "search block owner"
          unique-text "needle-for-global-block-search"]
      (page/new-page target-page)
      (b/new-block unique-text)
      (let [uuid (block-uuid unique-text)]
        (page/new-page "search block source")
        (util/search unique-text)
        (assert/assert-is-visible
         (loc/filter ".search-results" :has-text target-page))
        (assert/assert-is-visible
         (loc/filter ".search-results" :has-text unique-text))
        (w/click (.first (loc/filter ".search-results > div" :has-text unique-text)))
        (is (string/includes? (w/eval-js "window.location.hash") uuid))))))

(deftest alias-search-index-updates-test
  (testing "page alias finds the canonical title and disappears after removal"
    (let [canonical "canonical search page"
          alias-title "unique searchable alias"]
      (page/new-page canonical)
      (let [page-uuid (get (ls-api-call! :editor.getPage canonical) "uuid")]
        (ls-api-call! :editor.upsertBlockProperty page-uuid "Alias" alias-title)
        (util/search alias-title)
        (assert/assert-is-visible
         (loc/filter ".search-results" :has-text canonical))
        (k/esc)
        (ls-api-call! :editor.removeBlockProperty page-uuid "Alias")
        (util/search alias-title)
        (assert/assert-have-count
         (loc/filter ".search-results" :has-text canonical)
         0)))))

(deftest search-modes-do-not-leak-results-test
  (testing "node, current-page and command filters keep independent results"
    (b/new-block "mode-specific-block-result")
    (util/search "mode-specific-block-result")
    (assert/assert-is-visible
     (loc/filter ".search-results" :has-text "mode-specific-block-result"))
    (k/press "ControlOrMeta+Shift+p")
    (assert/assert-is-visible
     (loc/filter ".cp__cmdk" :has-text "Search only commands"))
    (assert/assert-have-count
     (loc/filter ".search-results" :has-text "mode-specific-block-result")
     0)
    (k/esc)
    (util/search-and-click "Search blocks in page")
    (w/fill ".cp__cmdk-search-input" "mode-specific-block-result")
    (assert/assert-is-visible
     (loc/filter ".search-results" :has-text "mode-specific-block-result"))))

(deftest rebuild-search-index-replaces-progress-test
  (testing "re-index exposes progress, completes, and retains old and new results"
    (b/new-block "search-before-reindex")
    (util/search-and-click "Rebuild search index")
    (assert/assert-is-visible ".search-index-progress")
    (w/wait-for-not-visible ".search-index-progress" {:timeout 30000})
    (b/new-block "search-after-reindex")
    (doseq [text ["search-before-reindex" "search-after-reindex"]]
      (util/search text)
      (assert/assert-is-visible (loc/filter ".search-results" :has-text text))
      (k/esc))))

(deftest editing-during-reindex-reaches-final-index-test
  (testing "concurrent insert/update/delete remains editable and final search is current"
    (let [page-name (page/get-page-name)]
      (b/new-block "index-concurrency-old")
      (let [uuid (block-uuid "index-concurrency-old")]
        (util/search-and-click "Rebuild search index")
        (ls-api-call! :editor.updateBlock uuid "index-concurrency-updated")
        (ls-api-call! :editor.appendBlockInPage page-name "index-concurrency-created")
        (w/wait-for-not-visible ".search-index-progress" {:timeout 30000})
        (doseq [text ["index-concurrency-updated" "index-concurrency-created"]]
          (util/search text)
          (assert/assert-is-visible (loc/filter ".search-results" :has-text text))
          (k/esc))
        (util/search "index-concurrency-old")
        (assert/assert-have-count
         (loc/filter ".search-results" :has-text "index-concurrency-old")
         0)))))

(deftest deleting-open-sidebar-entity-removes-stale-editor-test
  (testing "deleting a block mounted in the sidebar removes both live renderers"
    (let [block (ls-api-call! :editor.appendBlockInPage
                              (page/get-page-name)
                              "sidebar deletion target")
          uuid (get block "uuid")]
      (ls-api-call! :editor.openInRightSidebar uuid)
      (assert/assert-have-count (str "#ls-block-" uuid) 2)
      (ls-api-call! :editor.removeBlock uuid)
      (assert/assert-have-count (str "#ls-block-" uuid) 0)
      (assert/assert-have-count
       (format ".cp__right-sidebar textarea[id*='%s']" uuid)
       0))))

(deftest missing-asset-shows-retry-state-test
  (testing "a missing asset has an explicit warning and retry does not stay pending"
    (b/new-block "![missing asset](../assets/e2e-missing-asset.png)")
    (util/exit-edit)
    (assert/assert-is-visible ".asset-missing-file")
    (assert/assert-is-visible
     (loc/filter ".asset-missing-file" :has-text "Can't find file"))
    (w/click (.locator (w/-query ".asset-missing-file") "button"))
    (assert/assert-is-hidden ".asset-missing-file .ui__loading")))

(deftest settings-tabs-do-not-leak-content-test
  (testing "rapid settings navigation keeps one active category and closes cleanly"
    (open-settings!)
    (doseq [[id heading] [["general" "General"]
                          ["editor" "Editor"]
                          ["features" "Features"]
                          ["advanced" "Advanced"]
                          ["general" "General"]]]
      (w/click (format ".settings-menu-item[data-id='%s']" id))
      (assert/assert-have-count ".settings-menu-item.active" 1)
      (assert/assert-is-visible
       (loc/filter ".cp__settings-category-title" :has-text heading)))
    (k/esc)
    (w/wait-for-not-visible "#settings")
    (open-settings!)
    (assert/assert-have-count ".settings-menu-item.active" 1)
    (assert/assert-is-visible
     (loc/filter ".cp__settings-category-title" :has-text "General"))))
