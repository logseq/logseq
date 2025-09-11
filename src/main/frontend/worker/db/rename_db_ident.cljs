(ns frontend.worker.db.rename-db-ident
  "utils for rename-db-idents migration"
  (:require [datascript.core :as d]
            [logseq.db :as ldb]))

(defn rename-db-idents-migration-tx-data
  "Rename :db/ident and replace all usages as well.
  rename-db-idents: fn to generate coll of {:db-ident ..., :new-db-ident ...}
  NOTE: this fn should only care about :db/ident changing, don't touch other attr/values"
  [db rename-db-idents]
  (assert (fn? rename-db-idents))
  (let [rename-db-idents-coll (rename-db-idents db)
        rename-db-idents-coll2  (rename-db-idents db)
        ;; ensure there's no random data in result
        _ (when (not= rename-db-idents-coll rename-db-idents-coll2)
            (throw (ex-info "db-idents cannot be randomly generated"
                            {:rename-db-idents-colls [rename-db-idents-coll rename-db-idents-coll2]})))
        *rename-db-idents-coll (atom [])
        tx-data
        (->> (for [{:keys [db-ident-or-block-uuid new-db-ident] :as rename-db-ident} rename-db-idents-coll
                   :let [ent (d/entity db (if (keyword? db-ident-or-block-uuid)
                                            db-ident-or-block-uuid
                                            [:block/uuid db-ident-or-block-uuid]))
                         old-db-ident (:db/ident ent)]]
               (do (when (some? ent)
                     (when-not (ldb/class? ent)
                       (throw (ex-info "Only entities of class type support :rename-db-ident" {:ent (into {} ent)})))
                     (swap! *rename-db-idents-coll conj rename-db-ident))
                   (cons {:db/id (:db/id ent) :db/ident new-db-ident}
                         (some->> old-db-ident
                                  (d/q '[:find ?b ?v :in $ ?a :where [?b ?a ?v]] db)
                                  (mapcat (fn [[id v]]
                                            [[:db/retract id old-db-ident]
                                             [:db/add id new-db-ident v]]))))))
             (apply concat)
             doall)]
    [tx-data @*rename-db-idents-coll]))
