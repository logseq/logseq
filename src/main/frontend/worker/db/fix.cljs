(ns frontend.worker.db.fix
  "fix db"
  (:require [datascript.core :as d]
            [logseq.db :as ldb]))

(defn check-and-fix-schema!
  [repo conn]
  (let [schema (ldb/get-schema repo)
        db-schema (:schema @conn)
        diffs (->> (keep (fn [[k v]]
                           (let [schema-v (-> (get db-schema k)
                                              (dissoc :db/ident))
                                 schema-v' (cond-> schema-v
                                             (= (:db/cardinality schema-v) :db.cardinality/one)
                                             (dissoc :db/cardinality)
                                             (and (:db/index schema-v)
                                                  (nil? (:db/index v)))
                                             (dissoc :db/index))]
                             (when-not (or (= v schema-v') (= k :db/ident))
                               (assoc v :db/ident k))))
                         schema))]
    (when (seq diffs)
      (d/transact! conn diffs))))
