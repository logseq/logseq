(ns frontend.db.subs-loader-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.db.subs-loader :as subs-loader]))

(deftest request-groups-flushes-resources-before-block-trees-test
  (let [view-uuid (random-uuid)
        block-uuid (random-uuid)
        parent-uuid (random-uuid)
        entries [{:slot-key [:children parent-uuid]}
                 {:slot-key [:block block-uuid]}
                 {:slot-key [:resource [:view-data view-uuid {}]]}]
        groups (#'subs-loader/request-groups entries)]
    (is (= [:resource :block :children]
           (mapv (comp first :slot-key first) groups))
        "Tags/All Pages view-data must flush before children open-block-tree.")))
