(ns frontend.components.left-sidebar-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.left-sidebar :as left-sidebar]))

(deftest mobile-sidebar-navigation-target-test
  (let [target? (some-> (resolve 'frontend.components.left-sidebar/mobile-sidebar-navigation-target?)
                        deref)
        container (.createElement js/document "div")]
    (is (fn? target?) "The sidebar should identify navigation targets")
    (when target?
      (set! (.-innerHTML container)
            (str "<div class=\"dropdown-wrapper\"><a id=\"graph\"></a></div>"
                 "<div class=\"sidebar-navigations\"><a id=\"navigation\"></a></div>"
                 "<div class=\"favorites\"><div class=\"bd\"><a id=\"favorite\"></a></div></div>"
                 "<div class=\"recent\"><div class=\"bd\"><a id=\"recent\"></a></div></div>"
                 "<button id=\"unrelated\"></button>"))
      (testing "links that navigate away from the mobile sidebar"
        (doseq [id ["navigation" "favorite" "recent"]]
          (is (true? (target? (.querySelector container (str "#" id)))) id)))
      (testing "popup triggers and unrelated sidebar controls"
        (is (false? (target? (.querySelector container "#graph"))))
        (is (false? (target? (.querySelector container "#unrelated"))))))))
