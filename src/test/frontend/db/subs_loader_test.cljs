(ns frontend.db.subs-loader-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.subs-loader :as subs-loader]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- reset-loader! []
  (reset! @#'subs-loader/*batch {})
  (reset! @#'subs-loader/*flushing? false)
  (subs-loader/set-still-wanted-fn! (constantly true)))

(deftest request-groups-flushes-block-trees-before-resources-test
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
    (is (= [[:block block-uuid]] (mapv :slot-key (nth groups 1)))
        "An open page's blocks must not wait behind title decorations.")
    (is (= [[:children parent-uuid]] (mapv :slot-key (nth groups 2)))
        "An open page's children must not wait behind title decorations.")
    (is (= #{:block-ref-count} (resource-kinds (nth groups 3)))
        "block-ref-count must not share the first table window request.")))

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

(deftest a-failed-batch-retries-each-entry-alone-test
  (async done
    (reset-loader!)
    (let [graph-id "graph"
          live-key [:resource [:block-ref-count (random-uuid)]]
          deleted-key [:resource [:block-comment-threads (random-uuid)]]
          requests (atom [])
          original-invoke state/<invoke-db-worker
          original-ready? @state/db-worker-ready?
          *flush (atom nil)]
      (set! state/<invoke-db-worker
            (fn [_api _graph-id request]
              (swap! requests conj (:resources request))
              (if (some #{(second deleted-key)} (:resources request))
                (p/rejected (ex-info "Missing renderer resource entity" {:block-uuid :deleted}))
                (p/resolved {:basis-rev 1
                             :groups {live-key [live-key]}
                             :slots {live-key {:value 3}}}))))
      (reset! state/db-worker-ready? true)
      (let [live (subs-loader/load! graph-id live-key #(reset! *flush %))
            deleted (subs-loader/load! graph-id deleted-key #(reset! *flush %))]
        (@*flush)
        (-> (p/all [live (p/catch deleted (fn [error] [:rejected (ex-message error)]))])
            (p/then
             (fn [[live-value deleted-value]]
               (is (= {:basis-rev 1 :slots {live-key {:value 3}}} live-value)
                   "a resource batched with a failing one still loads")
               (is (= [:rejected "Missing renderer resource entity"] deleted-value)
                   "the failing resource is still rejected with the worker's error")
               ;; requests without resources come from other watchers of db-worker-ready?
               (let [resource-requests (filter seq @requests)]
                 (is (= 2 (count (first resource-requests))) "the first request was the batch")
                 (is (= #{[(second live-key)] [(second deleted-key)]} (set (rest resource-requests)))
                     "then each entry went alone, once")
                 (is (= 3 (count resource-requests))))))
            (p/catch (fn [error] (is false (str error))))
            (p/finally
             (fn []
               (set! state/<invoke-db-worker original-invoke)
               (reset! state/db-worker-ready? original-ready?)
               (reset-loader!)
               (done))))))))

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
