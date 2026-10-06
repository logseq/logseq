(ns frontend.components.popup-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.shui.popup.core :as shui-popup]))

(deftest popup-without-anchor-event-test
  (let [id :popup-without-anchor]
    (is (= id (shui-popup/show! nil (fn [] [:div "Downloading"]) {:id id})))
    (is (some? (shui-popup/get-popup id)))
    (shui-popup/hide! id)))

(deftest element-anchor-position-uses-trigger-rect-test
  (let [target #js {:getBoundingClientRect (fn []
                                             #js {:left 120 :width 24 :height 20 :bottom 220})}
        [x y width height] (#'shui-popup/element-anchor-position target :end false)]
    (is (= 144 x) "end align uses the trigger's right edge")
    (is (= 200 y) "y is the trigger top")
    (is (= 24 width))
    (is (= 20 height))))
