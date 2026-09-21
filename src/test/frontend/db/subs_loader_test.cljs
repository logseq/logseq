(ns frontend.db.subs-loader-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.db.subs-loader :as subs-loader]))

(defn- reset-loader! []
  (reset! @#'subs-loader/*batch {})
  (reset! @#'subs-loader/*flushing? false)
  (subs-loader/set-still-wanted-fn! (constantly true)))

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

(deftest loader-takes-one-request-group-at-a-time-test
  (reset-loader!)
  (let [graph-id "graph"
        resource-keys (mapv (fn [idx] [:page-identity (str "page-" idx)])
                            (range 26))]
    (doseq [resource-key resource-keys]
      (subs-loader/load! graph-id [:resource resource-key] (fn [_])))
    (let [first-wave (#'subs-loader/take-next-request-group!)
          second-wave (#'subs-loader/take-next-request-group!)]
      (is (= 25 (count first-wave))
          "A flush should take one bounded resource wave, not everything queued.")
      (is (= 1 (count second-wave))
          "The remaining queue stays in the renderer for the next wave."))
    (reset-loader!)))

(deftest loader-drops-unmounted-slots-before-worker-request-test
  (reset-loader!)
  (let [graph-id "graph"
        stale-block (random-uuid)
        visible-block (random-uuid)]
    (subs-loader/set-still-wanted-fn!
     (fn [slot-key]
       (not= slot-key [:block stale-block])))
    (subs-loader/load! graph-id [:block stale-block] (fn [_]))
    (subs-loader/load! graph-id [:block visible-block] (fn [_]))
    (let [wave (#'subs-loader/take-next-request-group!)]
      (is (= [[:block visible-block]]
             (mapv :slot-key wave))
          "Rows that scrolled past should be rejected before they enter the worker queue."))
    (reset-loader!)))
