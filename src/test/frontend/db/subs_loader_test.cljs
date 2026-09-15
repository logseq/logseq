(ns frontend.db.subs-loader-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.db.subs-loader :as subs-loader]))

(deftest request-groups-flushes-resources-before-block-trees-test
  (let [view-uuid (random-uuid)
        block-uuid (random-uuid)
        parent-uuid (random-uuid)
        page-uuid (random-uuid)
        entries [{:slot-key [:children parent-uuid]}
                 {:slot-key [:block block-uuid]}
                 {:slot-key [:resource [:block-ref-count page-uuid]]}
                 {:slot-key [:resource [:view-data view-uuid {}]]}
                 {:slot-key [:resource [:views page-uuid :class-objects]]}]
        groups (#'subs-loader/request-groups entries)
        resource-kinds (fn [group]
                         (into #{}
                               (keep (fn [{:keys [slot-key]}]
                                       (when (= :resource (first slot-key))
                                         (first (second slot-key)))))
                               group))]
    (is (= 4 (count groups)))
    (is (= #{:view-data :views} (resource-kinds (nth groups 0)))
        "Tags/All Pages view-data must leave before leftover resources.")
    (is (= #{:block-ref-count} (resource-kinds (nth groups 1)))
        "block-ref-count must not share the first table window request.")
    (is (= [[:block block-uuid]] (mapv :slot-key (nth groups 2))))
    (is (= [[:children parent-uuid]] (mapv :slot-key (nth groups 3)))
        "Children open-block-tree stays last.")))
