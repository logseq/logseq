(ns frontend.components.selection-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.selection :as selection]))

(deftest unset-property-event-includes-view-parent
  (let [view-parent {:db/ident :logseq.class/Task}
        selected-blocks [{:db/id 1}]
        [_ payload] (#'selection/unset-property-event nil selected-blocks view-parent)]
    (is (= view-parent (:view-parent payload)))
    (is (= selected-blocks (:selected-blocks payload)))
    (is (:remove-property? payload))))
