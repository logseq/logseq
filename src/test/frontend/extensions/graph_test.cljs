(ns frontend.extensions.graph-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.extensions.graph :as graph]))

(deftest canvas-style-fills-available-space
  (is (= {:width "100%" :height "100%"}
         (graph/canvas-style {})))
  (is (= {:width "640px" :height "480px"}
         (graph/canvas-style {:width 640 :height 480}))))
