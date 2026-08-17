(ns frontend.worker.db.validate
  "Validate db"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.shared-service :as shared-service]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.validate :as db-validate]))

(defn- get-property-by-title
  [db title]
  (when title
    (some->> (first (ldb/page-exists? db title [:logseq.class/Property]))
             (d/entity db))))

(defn- block-missing-uuid?
  [entity]
  (and (nil? (:block/uuid entity))
       (string? (:block/title entity))
       (:block/page entity)
       (:block/parent entity)
       (string? (:block/order entity))
       (int? (:block/created-at entity))
       (int? (:block/updated-at entity))))

(defn- normal-page-missing-updated-at?
  [entity dispatch-key]
  (and (= dispatch-key :normal-page)
       (nil? (:block/updated-at entity))
       (int? (:block/created-at entity))))

(defn- ^:large-vars/cleanup-todo fix-invalid-blocks!
  [conn errors]
  (let [db @conn
        fix-tx-data (mapcat
                     (fn [{:keys [entity dispatch-key]}]
                       (let [entity (d/entity db (:db/id entity))]
                         (cond
                           (= :logseq.property.embedding/hnsw-label (:db/ident entity))
                           (db-migrate/delete-property db :logseq.property.embedding/hnsw-label)
                           (some? (:logseq.property/parent entity))
                           [[:db/retract (:db/id entity) :logseq.property/parent]]
                           (and (ldb/class? entity) (:block/order entity))
                           [[:db/retract (:db/id entity) :block/order]]
                           (and (not (ldb/page? entity)) (:block/name entity))
                           [[:db/retract (:db/id entity) :block/name]]
                           (some? (:hide? entity))
                           [[:db/retract (:db/id entity) :hide?]]
                           (some? (:public? entity))
                           [[:db/retract (:db/id entity) :public?]]
                           (some? (:block/pre-block? entity))
                           [[:db/retract (:db/id entity) :block/pre-block?]]
                           (some? (:logseq.property.embedding/hnsw-label entity))
                           [[:db/retract (:db/id entity) :logseq.property.embedding/hnsw-label]]
                           (some? (:logseq.property.embedding/hnsw-label-updated-at entity))
                           [[:db/retract (:db/id entity) :logseq.property.embedding/hnsw-label-updated-at]]
                           (normal-page-missing-updated-at? entity dispatch-key)
                           [[:db/add (:db/id entity) :block/updated-at (:block/created-at entity)]]
                           (and (= "External URL" (:block/title entity))
                                (nil? (:block/tags entity)))
                           [[:db/retractEntity (:db/id entity)]]
                           (and (ldb/property? entity)
                                (some #(= (:db/ident %) :logseq.class/Tag) (:block/tags entity)))
                           [[:db/retract (:db/id entity) :block/tags :logseq.class/Tag]]
                           (and (:db/ident entity)
                                (db-class/user-class-namespace? (str (:db/ident entity)))
                                (not (:logseq.property/built-in? entity))
                                (not (ldb/class? entity)))
                           [[:db/add (:db/id entity) :block/tags :logseq.class/Tag]
                            [:db/retract (:db/id entity) :block/tags :logseq.class/Page]]
                           (and (ldb/class? entity) (:kv/value entity))
                           [[:db/retract (:db/id entity) :kv/value]]
                           (and (ldb/property? entity)
                                (:logseq.property.class/extends entity))
                           (mapv (fn [class]
                                   [:db/retract (:db/id entity) :logseq.property.class/extends (:db/id class)])
                                 (:logseq.property.class/extends entity))
                           (:block/level entity)
                           [[:db/retract (:db/id entity) :block/level]]
                           ;; missing :db/ident
                           (and (ldb/class? entity) (nil? (:db/ident entity)) (:block/title entity))
                           [[:db/add (:db/id entity) :db/ident (db-class/create-user-class-ident-from-name db (:block/title entity))]]
                           (and
                            (= (:block/title (:logseq.property/created-from-property entity)) "description")
                            (nil? (:block/page entity)))
                           (let [property-id (:db/id (:logseq.property/created-from-property entity))]
                             [[:db/add (:db/id entity) :block/page property-id]
                              [:db/add (:db/id entity) :block/parent property-id]])
                           (and (:db/ident entity)
                                (:logseq.property/built-in? entity)
                                (:block/parent entity))
                           [[:db/retract (:db/id entity) :block/parent]]
                           (:block/format entity)
                           [[:db/retract (:db/id entity) :block/format]]
                           (= :whiteboard-shape (:logseq.property/ls-type entity))
                           [[:db/retractEntity (:db/id entity)]]
                           (and (:block/page entity) (not (:block/parent entity)))
                           [[:db/add (:db/id entity) :block/parent (:db/id (:block/page entity))]]
                           (and (:logseq.property/created-by-ref entity)
                                (not (de/entity? (:logseq.property/created-by-ref entity))))
                           [[:db/retractEntity (:db/id entity)]]
                           (block-missing-uuid? entity)
                           [[:db/add (:db/id entity) :block/uuid (random-uuid)]]
                           (vector? (:logseq.property/value entity))
                           [[:db/retractEntity (:db/id entity)]]
                           (and (:block/tx-id entity) (nil? (:block/title entity)))
                           [[:db/retractEntity (:db/id entity)]]
                           (and (:block/title entity) (nil? (:block/page entity)) (nil? (:block/parent entity)) (nil? (:block/name entity)))
                           [[:db/retractEntity (:db/id entity)]]
                           (= :block/path-refs (:db/ident entity))
                           (try
                             (db-migrate/remove-block-path-refs db)
                             (catch :default _e
                               nil))
                           (not-every? (fn [e] (ldb/class? e)) (:block/tags entity))
                           (let [non-tags (remove ldb/class? (:block/tags entity))]
                             (map (fn [tag]
                                    [:db/retract (:db/id entity) :block/tags (:db/id tag)]) non-tags))
                           (and (= dispatch-key :normal-page) (:block/page entity))
                           [[:db/retract (:db/id entity) :block/page]]
                           (and (= dispatch-key :block) (nil? (:block/title entity)))
                           [[:db/retractEntity (:db/id entity)]]
                           (and (= dispatch-key :block) (nil? (:block/page entity)))
                           (let [latest-journal-id (:db/id (first (ldb/get-latest-journals db)))
                                 page-id (:db/id (:block/page (:block/parent entity)))]
                             (cond
                               page-id
                               [[:db/add (:db/id entity) :block/page page-id]]
                               latest-journal-id
                               [[:db/add (:db/id entity) :block/page latest-journal-id]
                                [:db/add (:db/id entity) :block/parent latest-journal-id]]
                               :else
                               (js/console.error (str "Don't know where to put the block " (:db/id entity)))))

                           (and (= dispatch-key :block)
                                (some (fn [k] (= "user.class" (namespace k))) (keys (:logseq.property.table/sized-columns entity))))
                           (let [new-value (->> (keep (fn [[k v]]
                                                        (if (= "user.class" (namespace k))
                                                          (when-let [property (get-property-by-title db (:block/title (d/entity db k)))]
                                                            [(:db/ident property) v])
                                                          [k v]))
                                                      (:logseq.property.table/sized-columns entity))
                                                (into {}))]
                             [[:db/add (:db/id entity) :logseq.property.table/sized-columns new-value]])

                           (some (fn [k] (= "block.temp" (namespace k))) (keys entity))
                           (let [ks (filter (fn [k] (= "block.temp" (namespace k))) (keys entity))]
                             (mapv (fn [k] [:db/retract (:db/id entity) k]) ks))
                           (and (not (:block/page entity)) (not (:block/parent entity)) (not (:block/name entity)))
                           [[:db/retractEntity (:db/id entity)]]
                           (and (= dispatch-key :property-value-block) (:block/title entity))
                           [[:db/retract (:db/id entity) :block/title]]
                           (and (ldb/class? entity) (not (:logseq.property.class/extends entity))
                                (not= (:db/ident entity) :logseq.class/Root))
                           [[:db/add (:db/id entity) :logseq.property.class/extends :logseq.class/Root]]
                           (and (or (ldb/class? entity) (ldb/property? entity)) (ldb/internal-page? entity))
                           [[:db/retract (:db/id entity) :block/tags :logseq.class/Page]]

                           (and (:logseq.property.asset/remote-metadata entity) (nil? (:logseq.property.asset/type entity)))
                           [[:db/retractEntity (:db/id entity)]]

                           :else
                           nil)))
                     errors)
        class-as-properties (concat
                             (mapcat
                              (fn [ident]
                                (->> (d/datoms db :avet ident)
                                     (mapcat (fn [d]
                                               (let [entity (d/entity db (:v d))]
                                                 (when (ldb/class? entity)
                                                   (if-let [property (get-property-by-title db (:block/title entity))]
                                                     [[:db/retract (:e d) (:a d) (:v d)]
                                                      [:db/add (:e d) (:a d) (:db/id property)]]
                                                     [[:db/retract (:e d) (:a d) (:v d)]])))))))
                              [:logseq.property.view/group-by-property :logseq.property.table/pinned-columns])
                             (->> (d/datoms db :eavt)
                                  (filter (fn [d] (= (namespace (:a d)) "user.class")))
                                  (mapcat (fn [d]
                                            (let [class-title (:block/title (d/entity db (:a d)))
                                                  property (get-property-by-title db class-title)]
                                              (if property
                                                [[:db/retract (:e d) (:a d) (:v d)]
                                                 [:db/add (:e d) (:db/ident property) (:v d)]]
                                                [[:db/retract (:e d) (:a d) (:v d)]]))))))
        tx-data (concat fix-tx-data
                        class-as-properties)]
    (when (seq tx-data)
      (let [tx-report (ldb/transact! conn tx-data {:fix-db? true})]
        (seq (:tx-data tx-report))))))

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

(defn- closed-value-type?
  [property]
  (contains? db-property-type/closed-value-property-types
             (:logseq.property/type property)))

(defn- fix-non-closed-values!
  "Retract values that are not in a property's closed-value set.
   Only runs for property types that still support closed values. Leftover closed
   values on a Node (or other non-enum) property must not delete live values."
  [conn]
  (let [db @conn
        now (common-util/time-ms)
        properties (->> (ldb/get-all-properties db)
                        (filter :block/_closed-value-property)
                        (filter closed-value-type?))
        retract-tx (vec
                    (mapcat
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
                              [:db/retract b (:db/ident property) v]))
                          values)))
                     properties))
        updated-at-tx (map (fn [eid]
                             {:db/id eid
                              :block/updated-at now})
                           (distinct (map second retract-tx)))
        tx-data (concat retract-tx updated-at-tx)]
    (when (seq retract-tx)
      (log/info :fix-non-closed-values {:retractions retract-tx})
      (ldb/transact! conn tx-data {:fix-db? true}))
    retract-tx))

(defn- fix-icon-wrong-type!
  [conn]
  (let [icon (d/entity @conn :logseq.property/icon)]
    (when (= :db.type/ref (:db/valueType icon))
      (let [datoms (d/datoms @conn :avet :logseq.property/icon)
            now (common-util/time-ms)
            retract-tx (map (fn [d] [:db/retract (:e d) (:a d)]) datoms)
            tx-data (concat
                     [[:db/retract (:db/id icon) :db/valueType]]
                     retract-tx
                     (map (fn [d]
                            {:db/id (:e d)
                             :block/updated-at now})
                          datoms))]
        (when (seq datoms)
          (log/info :fix-icon-wrong-type {:retractions retract-tx}))
        (ldb/transact! conn tx-data {:fix-db? true})))))

(defn- fix-extends-cardinality!
  [conn]
  (when (not= :db.cardinality/many (:db/cardinality (d/entity @conn :logseq.property.class/extends)))
    (ldb/transact! conn
                   [{:db/ident :logseq.property.class/extends
                     :db/cardinality :db.cardinality/many
                     :db/index true}]
                   {:fix-db? true})))

(defn- validate-db-result
  [db]
  (let [{:keys [errors datom-count entities]} (db-validate/validate-db db)
        invalid-entity-ids (distinct (map (fn [e] (:db/id (:entity e))) errors))]
    {:errors errors
     :datom-count datom-count
     :entities entities
     :invalid-entity-ids invalid-entity-ids}))

(defn- log-validation-errors!
  [errors]
  (doseq [error errors]
    (prn :debug
         :entity (:entity error)
         :error (dissoc error :entity))))

(defn- validate-and-fix-invalid-blocks!
  [conn]
  (loop [{:keys [errors] :as result} (validate-db-result @conn)]
    (log-validation-errors! errors)
    (if (and (seq errors) (fix-invalid-blocks! conn errors))
      (recur (validate-db-result @conn))
      result)))

(defn- notify-validation-result!
  [{:keys [errors fix retracted-property-values counts]}]
  (cond
    (seq errors)
    (do
      (shared-service/broadcast-to-clients! :log [:db-invalid :error
                                                  {:msg "Validation errors"
                                                   :errors errors}])
      (shared-service/broadcast-to-clients!
       :notification
       [nil :warning false nil nil
        {:i18n-key (if fix
                     :graph.validation/invalid-blocks-detected
                     :graph.validation/invalid-blocks-found)
         :i18n-args [(str (count errors))]}]))

    (pos? retracted-property-values)
    (shared-service/broadcast-to-clients!
     :notification
     [nil :warning false nil nil
      {:i18n-key :graph.validation/values-retracted
       :i18n-args [(str retracted-property-values)]}])

    :else
    (shared-service/broadcast-to-clients!
     :notification
     [nil :success false nil nil
      {:i18n-key :graph.validation/valid
       :i18n-args [(pr-str counts)]}])))

(defn validate-db
  [conn & {:keys [fix] :or {fix false}}]
  (let [retracted-property-values
        (if fix
          (do
            (fix-extends-cardinality! conn)
            (fix-icon-wrong-type! conn)
            (db-migrate/ensure-built-in-data-exists! conn)
            (let [retractions (fix-non-closed-values! conn)]
              (fix-num-prefix-db-idents! conn)
              (count retractions)))
          0)
        {:keys [errors datom-count entities invalid-entity-ids]}
        (if fix
          (validate-and-fix-invalid-blocks! conn)
          (let [{:keys [errors] :as result} (validate-db-result @conn)]
            (log-validation-errors! errors)
            result))
        db @conn
        counts (assoc (db-validate/graph-counts db entities) :datoms datom-count)]
    (notify-validation-result!
     {:errors errors
      :fix fix
      :retracted-property-values retracted-property-values
      :counts counts})
    (merge {:errors errors
            :invalid-entity-ids invalid-entity-ids
            :retracted-property-values retracted-property-values}
           counts)))

(defn recompute-checksum-diagnostics
  [_repo conn {:keys [local-checksum remote-checksum] :as _sync-diagnostics}]
  (let [{:keys [checksum attrs blocks e2ee?]} (sync-checksum/recompute-checksum-diagnostics @conn)]
    {:recomputed-checksum checksum
     :local-checksum local-checksum
     :remote-checksum remote-checksum
     :e2ee? e2ee?
     :checksum-attrs attrs
     :blocks blocks}))
