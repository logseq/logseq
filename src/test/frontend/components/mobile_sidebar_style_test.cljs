(ns frontend.components.mobile-sidebar-style-test
  (:require [cljs.test :refer [deftest is]]
            ["fs" :as fs]))

(deftest mobile-sidebar-uses-compact-navigation-text-test
  (let [container-css (.readFileSync fs "src/main/frontend/components/container.css" "utf8")
        mobile-css (.readFileSync fs "src/main/mobile/components/app.css" "utf8")]
    (is (.includes container-css "> strong {\n            @apply sm:text-xs text-sm font-medium;"))
    (is (.includes mobile-css ".page-title {\n      @apply text-sm opacity-100;"))
    (is (.includes mobile-css ".hd .wrap-th > strong {\n    @apply !text-sm;"))))
