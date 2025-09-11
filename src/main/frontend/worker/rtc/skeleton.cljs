(ns frontend.worker.rtc.skeleton
  "Validate skeleton data between server and client"
  (:require [clojure.data :as data]
            [datascript.core :as d]
            [frontend.worker.rtc.ws-util :as ws-util]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [missionary.core :as m]))

(defn- get-builtin-db-idents
  [db]
  (d/q '[:find [?i ...]
         :in $
         :where
         [?b :db/ident ?i]
         [?b :block/uuid]
         [?b :logseq.property/built-in?]]
       db))

(defn new-task--calibrate-graph-skeleton
  [get-ws-create-task graph-uuid major-schema-version db]
  (m/sp
    (let [r (m/? (ws-util/send&recv get-ws-create-task
                                    {:action "get-graph-skeleton"
                                     :graph-uuid graph-uuid
                                     :schema-version (str major-schema-version)}))]
      (if-let [remote-ex (:ex-data r)]
        (case (:type remote-ex)
          :graph-lock-failed
          (throw (ex-info "retry calibrate-graph-skeleton" {:missionary/retry true}))
          ;; else
          (do (log/info :remote-ex remote-ex)
              (throw (ex-info "Unavailable2" {:remote-ex remote-ex}))))
        (let [{:keys [server-schema-version server-builtin-db-idents]} r
              client-builtin-db-idents (set (get-builtin-db-idents db))
              client-schema-version (ldb/get-graph-schema-version db)]
          (when-not (zero? (db-schema/compare-schema-version client-schema-version server-schema-version))
            (log/warn "RTC schema error: client version doesn't match server's version"
                      [client-schema-version server-schema-version]))
          (let [[client-only server-only _]
                (data/diff client-builtin-db-idents server-builtin-db-idents)]
            (when (or (seq client-only) (seq server-only))
              (log/warn :db-idents-diff {:client-only client-only
                                         :server-only server-only})))
          r)))))
