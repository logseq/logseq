(ns frontend.worker.db.validate
  "Validate db"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.db.validate-fix :as validate-fix]
            [frontend.worker.shared-service :as shared-service]
            [logseq.db :as ldb]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db.frontend.validate :as db-validate]))

(defn- fix-num-prefix-db-idents!
  "Fix invalid db/ident keywords for both classes and properties"
  [conn]
  (let [db @conn
        tx-data (->> (d/datoms db :avet :db/ident)
                     (filter (fn [d] (re-find #"^(\d)" (name (:v d)))))
                     (mapcat (fn [d]
                               (let [new-db-ident (keyword (namespace (:v d)) (string/replace-first (name (:v d)) #"^(\d)" "NUM-$1"))
                                     property (ldb/property? (d/entity db (:v d)))]
                                 (concat
                                  [[:db/add (:e d) :db/ident new-db-ident]]
                                  (when property
                                    (->> (d/datoms db :avet (:v d))
                                         (mapcat (fn [d]
                                                   [[:db/retract (:e d) (:a d) (:v d)]
                                                    [:db/add (:e d) new-db-ident (:v d)]])))))))))
        ;; FIXME: :logseq.property.table/hidden-columns should be :property type to avoid issues like this
        hidden-columns-tx-data (->> (d/datoms db :avet :logseq.property.table/hidden-columns)
                                    (mapcat (fn [d]
                                              (when (re-find #"^(\d)" (name (:v d)))
                                                (let [new-value (keyword (namespace (:v d)) (string/replace-first (name (:v d)) #"^(\d)" "NUM-$1"))]
                                                  [[:db/retract (:e d) (:a d) (:v d)]
                                                   [:db/add (:e d) (:a d) new-value]])))))
        tx-data' (concat tx-data hidden-columns-tx-data)]
    (when (seq tx-data')
      (ldb/transact! conn tx-data'))))

(defn- fix-non-closed-values!
  [conn]
  (let [db @conn
        properties (->> (ldb/get-all-properties db)
                        (filter :block/_closed-value-property))
        tx-data (mapcat
                 (fn [property]
                   (let [closed-values (:block/_closed-value-property property)
                         matches (if (every? de/entity? closed-values)
                                   (set (map :db/id closed-values))
                                   (set closed-values))
                         values (d/q
                                 '[:find ?b ?v
                                   :in $ ?p
                                   :where
                                   [?b ?p ?v]]
                                 db
                                 (:db/ident property))]
                     (keep
                      (fn [[b v]]
                        (when-not (or (matches v)
                                      (= :logseq.property/empty-placeholder (:db/ident (d/entity db v))))
                          [:db/retract b (:db/ident  property) v]))
                      values)))
                 properties)]
    (when (seq tx-data)
      (prn :debug :fix-non-closed-values tx-data)
      (d/transact! conn tx-data {:fix-db? true}))))

(defn- fix-icon-wrong-type!
  [conn]
  (let [icon (d/entity @conn :logseq.property/icon)]
    (when (= :db.type/ref (:db/valueType icon))
      (let [datoms (d/datoms @conn :avet :logseq.property/icon)
            tx-data (cons
                     [:db/retract (:db/id icon) :db/valueType]
                     (map (fn [d] [:db/retract (:e d) (:a d)]) datoms))]
        (d/transact! conn tx-data {:fix-db? true})))))

(defn- fix-extends-cardinality!
  [conn]
  (when (not= :db.cardinality/many (:db/cardinality (d/entity @conn :logseq.property.class/extends)))
    (d/transact! conn
                 [{:db/ident :logseq.property.class/extends
                   :db/cardinality :db.cardinality/many
                   :db/index true}]
                 {:fix-db? true})))

(defn validate-db
  [conn & {:keys [fix] :or {fix true}}]
  (when fix
    (fix-extends-cardinality! conn)
    (fix-icon-wrong-type! conn)
    (db-migrate/ensure-built-in-data-exists! conn)
    (fix-non-closed-values! conn)
    (fix-num-prefix-db-idents! conn))

  (let [{:keys [errors datom-count entities invalid-entity-ids]
         :as result}
        (if fix
          (validate-fix/validate-and-fix-invalid-blocks!
           conn
           {:remove-block-path-refs-fn db-migrate/remove-block-path-refs})
          (let [{:keys [errors] :as result} (validate-fix/validate-db-result @conn)]
            (validate-fix/log-validation-errors! errors)
            result))
        db @conn]

    (if errors
      (do
        (shared-service/broadcast-to-clients! :log [:db-invalid :error
                                                    {:msg "Validation errors"
                                                     :errors errors}])
        (shared-service/broadcast-to-clients! :notification
                                              [(str "Validation detected " (count errors) " invalid block(s). These blocks may be buggy."
                                                    (when fix
                                                      " Attempting to fix invalid blocks. Run validation again to see if they were fixed."))
                                               :warning false]))

      (shared-service/broadcast-to-clients! :notification
                                            [(str "Your graph is valid! " (assoc (db-validate/graph-counts db entities) :datoms datom-count))
                                             :success false]))
    (assoc result
           :errors errors
           :datom-count datom-count
           :invalid-entity-ids invalid-entity-ids)))

(defn recompute-checksum-diagnostics
  [_repo conn {:keys [local-checksum remote-checksum] :as _sync-diagnostics}]
  (let [{:keys [checksum attrs blocks e2ee?]} (sync-checksum/recompute-checksum-diagnostics @conn)]
    {:recomputed-checksum checksum
     :local-checksum local-checksum
     :remote-checksum remote-checksum
     :e2ee? e2ee?
     :checksum-attrs attrs
     :blocks blocks}))
