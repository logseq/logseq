(ns logseq.e2e.right-sidebar-basic-test
  (:require
   [clojure.string :as string]
   [clojure.test :refer [deftest is testing use-fixtures]]
   [logseq.e2e.api :refer [ls-api-call!]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.util :as util]
   [wally.main :as w]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- use-dark-neutral-theme!
  []
  (w/eval-js
   "window.logseq.api.set_theme_mode('dark');
    window.logseq.api.set_state_from_store(['ui/system-theme?'], false);
    window.logseq.api.set_state_from_store(['ui/radix-color'], 'none');")
  (util/wait-timeout 100))

(defn- right-sidebar-backgrounds
  []
  (-> (w/eval-js
       "(() => {
          const topbar = document.querySelector('.cp__right-sidebar-topbar');
          const inner = document.querySelector('.cp__right-sidebar-inner');
          return [
            getComputedStyle(topbar).backgroundColor,
            getComputedStyle(inner).backgroundColor,
            document.documentElement.dataset.theme,
            document.documentElement.dataset.color
          ].join('|');
        })()")
      (string/split #"\|")))

(deftest right-sidebar-topbar-uses-dark-neutral-background
  (testing "right sidebar header stays dark with neutral accent color"
    (use-dark-neutral-theme!)
    (w/click ".toggle-right-sidebar")
    (assert/assert-is-visible ".cp__right-sidebar.open .cp__right-sidebar-topbar")
    (assert/assert-is-visible ".cp__right-sidebar .sidebar-item")
    (let [[topbar-bg inner-bg theme color] (right-sidebar-backgrounds)]
      (is (= "dark" theme))
      (is (= "none" color))
      (is (= inner-bg topbar-bg)))))

(deftest same-block-updates-in-main-and-right-sidebar
  (testing "one mounted UUID rerenders content and properties in both containers"
    (let [initial-title "sidebar live block before"
          updated-title "sidebar live block after"
          property-name "sidebar-live-property"
          initial-property-value "sidebar property before"
          updated-property-value "sidebar property after"
          block (ls-api-call! :editor.appendBlockInPage
                              initial-title
                              {:properties {property-name initial-property-value}})
          block-uuid (get block "uuid")
          main-block (format ".ls-page-blocks #ls-block-%s" block-uuid)
          sidebar-block (format ".cp__right-sidebar #ls-block-%s" block-uuid)]
      (w/wait-for (format "%s .block-title-wrap:text('%s')" main-block initial-title))
      (ls-api-call! :editor.openInRightSidebar block-uuid)
      (w/wait-for sidebar-block)
      (assert/assert-have-count (format "#ls-block-%s" block-uuid) 2)

      (ls-api-call! :editor.updateBlock block-uuid updated-title)
      (ls-api-call! :editor.upsertBlockProperty
                    block-uuid property-name updated-property-value)

      (doseq [block-selector [main-block sidebar-block]]
        (w/wait-for
         (format "%s .block-title-wrap:text('%s')" block-selector updated-title))
        (w/wait-for
         (format "%s .property-k:text('%s')" block-selector property-name))
        (w/wait-for
         (format "%s .property-value :text('%s')"
                 block-selector updated-property-value)))
      (w/wait-for-not-visible
       (format "#ls-block-%s .block-title-wrap:text('%s')"
               block-uuid initial-title)))))
