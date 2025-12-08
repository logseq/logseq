(ns frontend.worker.rtc.db
  "rtc db ops"
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]))

(defn remove-rtc-data-from-local-db!
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/transact! conn [[:db/retractEntity :logseq.kv/graph-uuid]
                         [:db/retractEntity :logseq.kv/graph-local-tx]
                         [:db/retractEntity :logseq.kv/remote-schema-version]
                         [:db/retractEntity :logseq.kv/graph-rtc-e2ee?]])))

(defn reset-client-op-conn
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (let [tx-data (->> (concat (d/datoms @conn :avet :graph-uuid)
                               (d/datoms @conn :avet :local-tx)
                               (d/datoms @conn :avet :block/uuid))
                       (map (fn [datom] [:db/retractEntity (:e datom)])))]
      (ldb/transact! conn tx-data))))

(defn remove-rtc-data-in-conn!
  [repo]
  (remove-rtc-data-from-local-db! repo)
  (reset-client-op-conn repo))
