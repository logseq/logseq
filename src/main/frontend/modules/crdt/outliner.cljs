(ns frontend.modules.crdt.outliner
  (:require [frontend.db :as db]))

(defn merge-remote-changes!
  "Notice that `:db/id` need to be changed to `:block/uuid` in `changes`"
  [graph changes]
  (let [tx (keep
             (fn [{:keys [action] :as data}]
               (case action
                 :delete
                 (when-let [ent (db/entity [:block/uuid (:block-id data)])]
                   [:db/retractEntity (:db/id ent)])
                 :upsert
                 (dissoc (:block data) :db/id)))
             changes)]
    (db/transact! graph tx {:skip-remote-sync? true})))
