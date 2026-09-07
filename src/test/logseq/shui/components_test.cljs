(ns logseq.shui.components-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [logseq.shui.components :as components]))

(deftest popup-scroll-style-keeps-long-menus-in-viewport
  (let [style (#'components/popup-scroll-style)
        max-height (.-maxHeight style)]
    (is (= "auto" (.-overflowY style)))
    (is (= "hidden" (.-overflowX style)))
    (is (string/includes? max-height "--available-height"))
    (is (string/includes? max-height "100vh"))))

(deftest submenu-css-allows-vertical-scroll-on-every-side
  (let [fs (js/require "fs")
        path (js/require "path")
        css (.readFileSync fs (.resolve path "resources/css/shui.css") "utf8")]
    (is (string/includes? css ".ui__dropdown-menu-sub-content"))
    (is (string/includes? css ".ui__context-menu-sub-content"))
    (is (string/includes? css "--available-height"))
    (is (string/includes? css "overflow-y-auto"))))
