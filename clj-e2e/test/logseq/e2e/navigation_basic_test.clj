(ns logseq.e2e.navigation-basic-test
  (:require
   [clojure.string :as string]
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

(defn- open-left-sidebar!
  []
  (when-not (w/visible? "#left-sidebar.is-open")
    (w/click "#left-menu")
    (w/wait-for "#left-sidebar.is-open")))

(defn- open-more!
  []
  (util/double-esc)
  (w/click ".toolbar-dots-btn")
  (assert/assert-is-visible "[role='menu']"))

(deftest toolbar-and-sidebar-controls-test
  (testing "toolbar controls expose tooltips and preserve the current editing target"
    (let [page-name (page/get-page-name)]
      (b/new-block "toolbar focus target")
      (util/exit-edit)
      (doseq [selector ["#home" "#search-button" ".toggle-right-sidebar"
                        ".toolbar-dots-btn"]]
        (assert/assert-is-visible selector)
        (is (not (string/blank?
                  (or (.getAttribute (w/-query selector) "aria-label")
                      (.getAttribute (w/-query selector) "title"))))))
      (w/click ".toggle-right-sidebar")
      (assert/assert-is-visible ".cp__right-sidebar.open")
      (w/click ".toggle-right-sidebar")
      (assert/assert-is-hidden ".cp__right-sidebar.open")
      (open-left-sidebar!)
      (w/click "#left-menu")
      (assert/assert-is-hidden "#left-sidebar.is-open")
      (is (= page-name (page/get-page-name))))))

(deftest notifications-and-modal-cleanup-test
  (testing "notification levels and modal close paths do not leave stale overlays"
    (doseq [[level message] [["success" "sample success"]
                             ["warning" "sample warning"]
                             ["error" "sample error"]]]
      (ls-api-call! :show_msg message level {"timeout" 0})
      (assert/assert-is-visible
       (loc/filter ".ui__toast" :has-text message)))
    (util/click-all! ".ui__toast-close")
    (assert/assert-have-count ".ui__toast" 0)

    (open-more!)
    (w/click (loc/filter "[role='menuitem']" :has-text "Settings"))
    (assert/assert-is-visible "#settings")
    (k/esc)
    (assert/assert-is-hidden "#settings")
    (assert/assert-have-count ".ui__modal-overlay, [data-radix-scroll-lock]" 0)
    (open-more!)
    (w/click (loc/filter "[role='menuitem']" :has-text "Settings"))
    (w/click ".ui__modal-overlay")
    (assert/assert-is-hidden "#settings")
    (is (= "visible"
           (w/eval-js "getComputedStyle(document.body).overflow")))))

(deftest navigation-customization-and-active-state-test
  (testing "custom navigation visibility persists and only the current route is active"
    (open-left-sidebar!)
    (w/click (loc/filter "#left-sidebar" :has-text "Navigations"))
    (assert/assert-is-visible "[role='dialog'], .navigation-settings")
    (doseq [label ["Flashcards" "Graph" "All pages" "Assets" "Tasks"]]
      (let [row (loc/filter "[role='dialog'] label, .navigation-settings label"
                            :has-text label)]
        (assert/assert-is-visible row)
        (w/click (.locator row "button[role='checkbox'], input[type='checkbox']"))
        (w/click (.locator row "button[role='checkbox'], input[type='checkbox']"))))
    (k/esc)
    (doseq [command ["Go to journals" "Go to graph view" "Go to all pages"]]
      (util/search-and-click command)
      (open-left-sidebar!)
      (assert/assert-have-count "#left-sidebar .active" 1))
    (util/refresh-until-graph-loaded)
    (open-left-sidebar!)
    (assert/assert-have-count "#left-sidebar .active" 1)))

(deftest journal-routes-and-all-journals-scroll-test
  (testing "journal route commands open distinct dates and the journal list has one scroller"
    (util/goto-journals)
    (let [today (page/get-page-name)]
      (util/search-and-click "Go to the next journal")
      (let [next-day (page/get-page-name)]
        (is (not= today next-day))
        (util/search-and-click "Go to the previous journal")
        (is (= today (page/get-page-name)))))
    (util/search-and-click "Go to all journals")
    (assert/assert-is-visible ".journals, .all-journals")
    (is (= 1
           (w/eval-js
            "Array.from(document.querySelectorAll('.journals *, .all-journals *'))
               .filter((node) => {
                 const style = getComputedStyle(node);
                 return /(auto|scroll)/.test(style.overflowY)
                   && node.scrollHeight > node.clientHeight;
               }).length")))
    (w/eval-js
     "const scroller = Array.from(document.querySelectorAll('.journals *, .all-journals *'))
        .find((node) => node.scrollHeight > node.clientHeight);
      if (scroller) scroller.scrollTop = scroller.scrollHeight;")
    (assert/assert-is-hidden ".block-content-fallback-ui")))

(deftest page-title-navigation-rename-and-delete-test
  (testing "page title confirm/cancel, sidebar open, delete cancel and confirm stay consistent"
    (let [original (str "navigation-title-" (random-uuid))
          renamed (str original "-renamed")]
      (page/new-page original)
      (b/new-block "title page content")
      (util/exit-edit)
      (w/click "div[data-testid='page title']")
      (w/fill util/editor-q (str original "-cancelled"))
      (k/esc)
      (is (= original (page/get-page-name)))
      (page/rename-page original renamed)
      (is (= renamed (page/get-page-name)))
      (w/click "div[data-testid='page title'] .block-title-wrap"
               (doto (com.microsoft.playwright.Locator$ClickOptions.)
                 (.setModifiers
                  [com.microsoft.playwright.options.KeyboardModifier/SHIFT])))
      (assert/assert-is-visible
       (loc/filter ".cp__right-sidebar" :has-text renamed))

      (open-more!)
      (w/click (loc/filter "[role='menuitem']" :has-text "Delete page"))
      (w/click "div[role='alertdialog'] button:text('Cancel')")
      (is (some? (ls-api-call! :editor.getPage renamed)))
      (page/delete-page renamed)
      (is (nil? (ls-api-call! :editor.getPage renamed)))
      (assert/assert-is-hidden
       (loc/filter "#main-content-container" :has-text "title page content")))))

(deftest favorites-order-and-recents-lifecycle-test
  (testing "favorites and recents update without duplicates and survive refresh"
    (open-left-sidebar!)
    (doseq [title ["nav sample a" "nav sample b" "nav sample c"]]
      (page/new-page title)
      (k/press "ControlOrMeta+Shift+f"))
    (let [favorites #(w/all-text-contents ".favorites .favorite-item")
          before (favorites)]
      (is (= 3 (count (filter #(string/includes? % "nav sample") before))))
      (let [items (w/-query ".favorites .favorite-item")]
        (.dragTo (.last items) (.first items)))
      (is (= 3 (count (set (filter #(string/includes? % "nav sample")
                                    (favorites))))))
      (util/refresh-until-graph-loaded)
      (is (= (favorites) (favorites))))
    (page/delete-page "nav sample b")
    (open-left-sidebar!)
    (assert/assert-have-count
     (loc/filter ".recent .recent-item" :has-text "nav sample b")
     0)))

(deftest library-membership-lifecycle-test
  (testing "moving into and out of Library changes membership without deleting pages"
    (doseq [title ["library sample parent" "library sample child"]]
      (page/new-page title)
      (b/new-block (str title " content"))
      (util/exit-edit))
    (page/goto-page "Library")
    (w/click ".ls-add-pages button")
    (assert/assert-is-visible ".cp__select-input")
    (doseq [title ["library sample parent" "library sample child"]]
      (w/fill ".cp__select-input" title)
      (let [result (loc/filter ".cp__select-results a" :has-text title)]
        (assert/assert-is-visible result)
        (w/click result)))
    (k/esc)
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks" :has-text "library sample parent"))
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks" :has-text "library sample child"))
    (page/goto-page "library sample child")
    (is (some? (ls-api-call! :editor.getPage "library sample child")))
    (util/refresh-until-graph-loaded)
    (assert/assert-is-visible
     (loc/filter ".ls-page-blocks" :has-text "library sample child content"))))

(deftest recycle-grouping-restore-and-permanent-delete-test
  (testing "Recycle groups deleted trees and supports cancel/confirm without stale search"
    (let [page-name "recycle sample page"]
      (page/new-page page-name)
      (b/new-blocks ["recycle parent" "recycle child"])
      (b/indent)
      (page/delete-page page-name)
      (open-more!)
      (w/click (loc/filter "[role='menuitem']" :has-text "Recycle"))
      (let [group (loc/filter ".ls-recycle-page-content section" :has-text page-name)]
        (assert/assert-is-visible group)
        (assert/assert-is-visible (loc/filter group :has-text "recycle parent"))
        (w/click (.locator group "button:text('Delete')"))
        (w/click "div[role='alertdialog'] button:text('Cancel')")
        (assert/assert-is-visible group)
        (w/click (.locator group "button:text('Delete')"))
        (w/click "div[role='alertdialog'] button:text('Confirm')")
        (assert/assert-have-count group 0))
      (util/search "recycle parent")
      (assert/assert-have-count
       (loc/filter ".search-results" :has-text "recycle parent")
       0))))

(deftest main-page-scroll-restoration-test
  (testing "returning to a long page restores its own virtual scroll position"
    (let [long-page "navigation long page"
          other-page "navigation other page"]
      (page/new-page long-page)
      (let [page-uuid (get (ls-api-call! :editor.getPage long-page) "uuid")]
        (ls-api-call! :editor.insertBatchBlock
                      page-uuid
                      (mapv #(hash-map :content (str "scroll row " %))
                            (range 250))))
      (w/eval-js
       "document.querySelector('#main-content-container').scrollTop =
          document.querySelector('#main-content-container').scrollHeight * 0.6")
      (let [before (w/eval-js
                    "document.querySelector('#main-content-container').scrollTop")]
        (page/new-page other-page)
        (page/goto-page long-page)
        (let [after (w/eval-js
                     "document.querySelector('#main-content-container').scrollTop")]
          (is (< (Math/abs (- before after)) 300))))
      (util/refresh-until-graph-loaded)
      (assert/assert-is-hidden ".block-content-fallback-ui"))))

(deftest clipboard-inspector-listener-cleanup-test
  (testing "clipboard inspector reports text and removes its listener after Back"
    (util/search-and-click "Go to bug report")
    (w/click (util/get-by-text "Clipboard data inspector" false))
    (w/eval-js "navigator.clipboard.writeText('clipboard sample text')")
    (w/click (util/get-by-text "Paste" true))
    (assert/assert-is-visible
     (loc/filter "#main-content-container" :has-text "text/plain"))
    (assert/assert-is-visible
     (loc/filter "#main-content-container" :has-text "clipboard sample text"))
    (w/click (util/get-by-text "Copy" true))
    (assert/assert-is-visible
     (loc/filter ".ui__toast" :has-text "Copied"))
    (w/click (util/get-by-text "Back" true))
    (assert/assert-is-hidden
     (loc/filter "#main-content-container" :has-text "clipboard sample text"))))

(deftest page-export-formats-and-options-test
  (testing "page export previews the current hierarchy in each browser-supported format"
    (b/new-blocks ["export parent #export-tag" "export child" "export sibling"])
    (b/indent)
    (open-more!)
    (w/click (loc/filter "[role='menuitem']" :has-text "Export page"))
    (w/wait-for ".export.resize textarea")
    (let [preview (w/-query ".export.resize textarea")]
      (is (string/includes? (.inputValue preview) "export parent"))
      (is (string/includes? (.inputValue preview) "export child"))
      (w/click ".export.resize button:has-text('OPML')")
      (w/wait-for
       (fn []
         (string/includes? (.inputValue preview) "<opml")))
      (w/click ".export.resize button:has-text('HTML')")
      (w/wait-for
       (fn []
         (string/includes? (.inputValue preview) "<")))
      (w/click ".export.resize button:has-text('EDN')")
      (w/wait-for
       (fn []
         (string/includes? (.inputValue preview) ":block/uuid")))
      (w/click
       (loc/filter ".export.resize button" :has-text "Copy to clipboard"))
      (is (= (.inputValue preview) (w/clipboard-text))))
    (k/esc)
    (assert/assert-is-hidden ".export.resize")))

(deftest all-pages-live-counts-test
  (testing "All pages updates names, backlinks and item count after graph mutations"
    (let [target "all-pages-target"
          referrer "all-pages-referrer"
          renamed "all-pages-target-renamed"]
      (page/new-page target)
      (b/save-block "target content")
      (page/new-page referrer)
      (b/save-block (str "[[" target "]]"))
      (util/search-and-click "Go to all pages")
      (assert/assert-is-visible ".ls-all-pages")
      (let [count-text (util/get-text ".ls-all-pages .views .text-xs")
            count-before (some->> count-text
                                  (re-find #"\d+")
                                  parse-long)]
        (is (pos? count-before)))
      (assert/assert-is-visible
       (loc/filter ".ls-all-pages .ls-table-row" :has-text target))
      (assert/assert-is-visible
       (loc/filter ".ls-all-pages .ls-table-row" :has-text "1"))
      (page/goto-page target)
      (page/rename-page target renamed)
      (util/search-and-click "Go to all pages")
      (assert/assert-is-visible
       (loc/filter ".ls-all-pages .ls-table-row" :has-text renamed))
      (assert/assert-have-count
       (loc/filter ".ls-all-pages .ls-table-row" :has-text target)
       0)
      (page/delete-page renamed)
      (util/search-and-click "Go to all pages")
      (assert/assert-have-count
       (loc/filter ".ls-all-pages .ls-table-row" :has-text renamed)
       0))))
