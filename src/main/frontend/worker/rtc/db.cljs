(ns frontend.worker.rtc.db
  "rtc db ops"
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]))

(defn remove-rtc-data-from-local-db!
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (d/transact! conn [[:db/retractEntity :logseq.kv/graph-uuid]
                       [:db/retractEntity :logseq.kv/graph-local-tx]
                       [:db/retractEntity :logseq.kv/remote-schema-version]])))

(defn reset-client-op-conn
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (let [tx-data (->> (concat (d/datoms @conn :avet :graph-uuid)
                               (d/datoms @conn :avet :local-tx)
                               (d/datoms @conn :avet :aes-key-jwk)
                               (d/datoms @conn :avet :block/uuid))
                       (map (fn [datom] [:db/retractEntity (:e datom)])))]
      (d/transact! conn tx-data))))

(defn remove-rtc-data-in-conn!
  [repo]
  (remove-rtc-data-from-local-db! repo)
  (reset-client-op-conn repo))
