(ns frontend.components.icon-text-align-style-test
  "Lock the 16px icon / leading-4 label alignment used by compact icon+text rows."
  (:require ["fs" :as fs]
            [cljs.test :refer [deftest is testing]]))

(defn- read-css
  [path]
  (.readFileSync fs path "utf8"))

(deftest sidebar-favorites-and-recent-rows-match-16px-icon
  (testing "favorites/recent page rows keep label line-height on the 16px page icon"
    (let [css (read-css "src/main/frontend/components/container.css")]
      (is (.includes css "h-[32px] w-full rounded-md leading-4"))
      (is (.includes css "overflow-hidden pr-8 leading-4"))
      (is (.includes css "flex items-center h-4 shrink-0 leading-none")))))

(deftest settings-menu-links-match-16px-icon
  (testing "settings left-panel links keep label line-height on the 16px menu icon"
    (let [css (read-css "src/main/frontend/components/settings.css")]
      (is (.includes css "text-left justify-start leading-4"))
      (is (.includes css "inline-flex items-center h-4 shrink-0 leading-none"))
      (is (.includes css "pl-1 opacity-90 leading-4")))))

(deftest graph-switcher-rows-match-16px-icon
  (testing "graph switcher popup rows and footer actions match the 16px icon box"
    (let [css (read-css "src/main/frontend/components/repo.css")]
      (is (.includes css "overflow-ellipsis leading-4"))
      (is (.includes css "hover:bg-gray-03 leading-4"))
      (is (.includes css "pr-4 text-sm leading-4")))))

(deftest dropdown-menu-items-match-16px-icon
  (testing "shared dropdown items used by the main menu match the 16px icon box"
    (let [css (read-css "resources/css/shui.css")
          cljs (.readFileSync fs "deps/shui/src/logseq/shui/components.cljs" "utf8")]
      (is (.includes css ".ui__dropdown-menu-item {"))
      (is (.includes css "@apply leading-4;"))
      (is (.includes cljs "text-sm leading-4 outline-none")))))

(deftest plugins-page-rows-match-16px-icon
  (testing "plugins tabs, category buttons, and card stats keep 16px icon alignment"
    (let [css (read-css "src/main/frontend/components/plugins.css")]
      (is (.includes css "opacity-70 px-3 leading-4"))
      (is (.includes css "border border-b-2 leading-4"))
      (is (.includes css "@apply flex items-center leading-4;"))
      (is (.includes css "text-gray-12 opacity-90 leading-4")))))
