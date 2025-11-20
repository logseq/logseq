(ns frontend.worker.db.validate
  "Validate db"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.shared-service :as shared-service]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.validate :as db-validate]))

(defn- get-property-by-title
  [db title]
  (when title
    (some->> (first (ldb/page-exists? db title [:logseq.class/Property]))
             (d/entity db))))

(defn- ^:large-vars/cleanup-todo fix-invalid-blocks!
  [conn errors]
  (let [db @conn
        fix-tx-data (mapcat
                     (fn [{:keys [entity dispatch-key]}]
                       (let [entity (d/entity db (:db/id entity))]
                         (cond
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
                           (:block/warning entity)
                           [[:db/retract (:db/id entity) :block/warning]]
                           (= :whiteboard-shape (:logseq.property/ls-type entity))
                           [[:db/retractEntity (:db/id entity)]]
                           (and (:block/page entity) (not (:block/parent entity)))
                           [[:db/add (:db/id entity) :block/parent (:db/id (:block/page entity))]]
                           (and (:logseq.property/created-by-ref entity)
                                (not (de/entity? (:logseq.property/created-by-ref entity))))
                           [[:db/retractEntity (:db/id entity)]]
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
      (d/transact! conn tx-data {:fix-db? true}))))

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
  [conn]
  (fix-extends-cardinality! conn)
  (fix-icon-wrong-type! conn)
  (db-migrate/ensure-built-in-data-exists! conn)
  (fix-non-closed-values! conn)
  (fix-num-prefix-db-idents! conn)

  (let [db @conn
        {:keys [errors datom-count entities]} (db-validate/validate-db! db)
        invalid-entity-ids (distinct (map (fn [e] (:db/id (:entity e))) errors))]

    (doseq [error errors]
      (prn :debug
           :entity (:entity error)
           :error (dissoc error :entity)))

    (if errors
      (do
        (fix-invalid-blocks! conn errors)
        (shared-service/broadcast-to-clients! :log [:db-invalid :error
                                                    {:msg "Validation errors"
                                                     :errors errors}])
        (shared-service/broadcast-to-clients! :notification
                                              [(str "Validation detected " (count errors) " invalid block(s). These blocks may be buggy. Attempting to fix invalid blocks. Run validation again to see if they were fixed.")
                                               :warning false]))

      (shared-service/broadcast-to-clients! :notification
                                            [(str "Your graph is valid! " (assoc (db-validate/graph-counts db entities) :datoms datom-count))
                                             :success false]))
    {:errors errors
     :datom-count datom-count
     :invalid-entity-ids invalid-entity-ids}))
