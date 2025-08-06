(ns frontend.worker.db.rename-db-ident
  "utils for rename-db-idents migration"
  (:require [datascript.core :as d]))

(defn rename-db-idents-migration-tx-data
  "Rename :db/ident and replace all usages as well. return tx-data.
  rename-db-idents: coll of {:db-ident ..., :new-db-ident ...}
  NOTE: this fn should only care about :db/ident changing, don't touch other attr/values"
  [db rename-db-idents]
  (assert (every?
           (fn [{:keys [db-ident new-db-ident]}]
             (and (keyword? db-ident) (keyword? new-db-ident)))
           rename-db-idents)
          rename-db-idents)
  (->> (for [{:keys [db-ident new-db-ident]} rename-db-idents
             :let [ent (d/entity db db-ident)]
             :when (some? ent)]
         (cons {:db/id (:db/id ent) :db/ident new-db-ident}
               (->> (d/q '[:find ?b ?v :in $ ?a :where [?b ?a ?v]] db db-ident)
                    (mapcat (fn [[id v]]
                              [[:db/retract id db-ident]
                               [:db/add id new-db-ident v]])))))
       (apply concat)))
