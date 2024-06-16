(ns frontend.worker.rtc.skeleton
  "Validate skeleton data between server and client"
  (:require [datascript.core :as d]
            [frontend.worker.rtc.ws-util :as ws-util]
            [missionary.core :as m]))

(defn- get-all-db-ident-blocks
  [db]
  (let [db-ident-coll (map :v (d/datoms db :avet :db/ident))
        db-ident-blocks (->> db-ident-coll
                             (d/pull-many db [:db/ident
                                              :block/uuid
                                              {:block/parent [:block/uuid]}
                                              :block/order
                                              :block/type
                                              :block/content])
                             (filter :block/uuid))]
    (map
     (fn [block]
       (cond-> block
         (:block/parent block) (update :block/parent :block/uuid)))
     db-ident-blocks)))

(defn new-task--calibrate-graph-skeleton
  [get-ws-create-task graph-uuid conn t]
  (m/sp
    (let [db @conn
          db-ident-blocks (get-all-db-ident-blocks db)
          r (m/? (ws-util/send&recv get-ws-create-task
                                    {:action "calibrate-graph-skeleton"
                                     :graph-uuid graph-uuid
                                     :t t
                                     :db-ident-blocks db-ident-blocks}))]
      (if-let [remote-ex (:ex-data r)]
        (case (:type remote-ex)
          :t-not-matched nil
        ;;else
          (throw (ex-info "Unavailable" {:remote-ex remote-ex})))
        (let [diff-data (:diff-data r)]
          (when (seq diff-data)
            (throw (ex-info "different graph skeleton between server and client"
                            {:type :rtc.exception/different-graph-skeleton
                             :diff-data diff-data}))))))))
