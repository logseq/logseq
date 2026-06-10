(ns frontend.worker.db.validate-fix
  "Script-safe DB validation repairs shared by worker validation and dev tasks."
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
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

(defn- on-recycle-page?
  [entity]
  (= "recycle" (:block/name (:block/page entity))))

(defn- has-attr?
  [db entity attr]
  (boolean
   (some #(= attr (:a %))
         (d/datoms db :eavt (:db/id entity)))))

(defn- invalid-recycled-block?
  [db entity dispatch-key]
  (and (= dispatch-key :block)
       (or (ldb/recycled? entity)
           (and (on-recycle-page? entity)
                (has-attr? db entity :logseq.property.recycle/original-page)))))

(defn- resolve-entity-id
  [db entity]
  (letfn [(valid-entity-id [id]
            (when (and (int? id)
                       (<= id 2147483647))
              id))]
    (or (valid-entity-id (:db/id entity))
      (when (de/entity? entity)
        (valid-entity-id (.-eid ^js entity)))
      (some (fn [[property value]]
              (when-let [attr (:db/ident property)]
                (:e (first (d/datoms db :avet attr value)))))
            (:block/properties entity))
      (some->> (re-find #":db/id (\d+)" (pr-str entity))
               second
               parse-long
               valid-entity-id))))

(defn- invalid-normal-page-alias-datoms
  [db entity dispatch-key]
  (let [eid (resolve-entity-id db entity)]
    (when (and (= dispatch-key :normal-page)
               eid)
      (seq
       (remove
        (fn [datom]
          (ldb/page? (d/entity db (:v datom))))
        (d/datoms db :eavt eid :block/alias))))))

(defn- invalid-recycle-fragment?
  [entity dispatch-key]
  (and (nil? dispatch-key)
       (or (:logseq.property.recycle/original-order entity)
           (:logseq.property.recycle/original-page entity)
           (:logseq.property.recycle/original-parent entity)
           (:logseq.property/deleted-at entity))))

(defn- invalid-orphan-fragment?
  [entity dispatch-key]
  (and (nil? dispatch-key)
       (not (block-missing-uuid? entity))
       (or (:logseq.property.embedding/hnsw-label-updated-at entity)
           (:logseq.property/deleted-at entity)
           (:block/uuid entity))))

(defn- invalid-fragment-error?
  [{:keys [entity dispatch-key]}]
  (or (invalid-recycle-fragment? entity dispatch-key)
      (invalid-orphan-fragment? entity dispatch-key)))

(defn invalid-fragment-ids
  [db errors]
  (distinct
   (keep (fn [{error-entity-id :entity-id :as error}]
           (when (invalid-fragment-error? error)
             (or error-entity-id (resolve-entity-id db (:entity error)))))
         errors)))

(defn- remove-block-path-refs
  [db]
  (if (d/entity db :block/path-refs)
    (let [remove-datoms (->> (d/datoms db :avet :block/path-refs)
                             (map :e)
                             (distinct)
                             (mapv (fn [id]
                                     [:db/retract id :block/path-refs])))]
      (conj remove-datoms [:db/retractEntity :block/path-refs]))
    (map (fn [eid]
           [:db/retract eid :block/path-refs])
         (d/q '[:find [?e ...]
                :where
                [?e :block/path-refs ?v]]
              db))))

(defn- invalid-fragment-tx-data
  [db entity error-entity dispatch-key entity-id]
  (let [invalid-alias-datoms (invalid-normal-page-alias-datoms db entity dispatch-key)]
    (cond
      (invalid-recycle-fragment? error-entity dispatch-key)
      [[:db/retractEntity entity-id]]
      (invalid-orphan-fragment? error-entity dispatch-key)
      [[:db/retractEntity entity-id]]
      (invalid-recycled-block? db entity dispatch-key)
      [[:db/retractEntity entity-id]]

      (some? (:logseq.property/parent entity))
      [[:db/retract entity-id :logseq.property/parent]]
      (some? (:hide? entity))
      [[:db/retract entity-id :hide?]]
      (some? (:public? entity))
      [[:db/retract entity-id :public?]]
      (some? (:block/pre-block? entity))
      [[:db/retract entity-id :block/pre-block?]]
      (some? (:logseq.property.embedding/hnsw-label entity))
      [[:db/retract entity-id :logseq.property.embedding/hnsw-label]]
      (some? (:logseq.property.embedding/hnsw-label-updated-at entity))
      [[:db/retract entity-id :logseq.property.embedding/hnsw-label-updated-at]]
      (normal-page-missing-updated-at? entity dispatch-key)
      [[:db/add entity-id :block/updated-at (:block/created-at entity)]]
      (and (= "External URL" (:block/title entity))
           (nil? (:block/tags entity)))
      [[:db/retractEntity entity-id]]
      (and (ldb/property? entity)
           (some #(= (:db/ident %) :logseq.class/Tag) (:block/tags entity)))
      [[:db/retract entity-id :block/tags :logseq.class/Tag]]
      (and (:db/ident entity)
           (db-class/user-class-namespace? (str (:db/ident entity)))
           (not (:logseq.property/built-in? entity))
           (not (ldb/class? entity)))
      [[:db/add entity-id :block/tags :logseq.class/Tag]
       [:db/retract entity-id :block/tags :logseq.class/Page]]
      (and (ldb/class? entity) (:kv/value entity))
      [[:db/retract entity-id :kv/value]]
      (and (ldb/property? entity)
           (:logseq.property.class/extends entity))
      (mapv (fn [class]
              [:db/retract entity-id :logseq.property.class/extends (:db/id class)])
            (:logseq.property.class/extends entity))
      invalid-alias-datoms
      (mapv (fn [datom]
              [:db/retract (:e datom) (:a datom) (:v datom)])
            invalid-alias-datoms))))

(defn- invalid-location-tx-data
  [db entity entity-id remove-block-path-refs-fn]
  (cond
    (:block/level entity)
    [[:db/retract entity-id :block/level]]
    (and (ldb/class? entity) (nil? (:db/ident entity)) (:block/title entity))
    [[:db/add entity-id :db/ident (db-class/create-user-class-ident-from-name db (:block/title entity))]]
    (and
     (= (:block/title (:logseq.property/created-from-property entity)) "description")
     (nil? (:block/page entity)))
    (let [property-id (:db/id (:logseq.property/created-from-property entity))]
      [[:db/add entity-id :block/page property-id]
       [:db/add entity-id :block/parent property-id]])
    (and (:db/ident entity)
         (:logseq.property/built-in? entity)
         (:block/parent entity))
    [[:db/retract entity-id :block/parent]]
    (:block/format entity)
    [[:db/retract entity-id :block/format]]
    (= :whiteboard-shape (:logseq.property/ls-type entity))
    [[:db/retractEntity entity-id]]
    (and (:block/page entity) (not (:block/parent entity)))
    [[:db/add entity-id :block/parent (:db/id (:block/page entity))]]
    (and (:logseq.property/created-by-ref entity)
         (not (de/entity? (:logseq.property/created-by-ref entity))))
    [[:db/retractEntity entity-id]]
    (block-missing-uuid? entity)
    [[:db/add entity-id :block/uuid (random-uuid)]]
    (vector? (:logseq.property/value entity))
    [[:db/retractEntity entity-id]]
    (and (:block/tx-id entity) (nil? (:block/title entity)))
    [[:db/retractEntity entity-id]]
    (and (:block/title entity) (nil? (:block/page entity)) (nil? (:block/parent entity)) (nil? (:block/name entity)))
    [[:db/retractEntity entity-id]]
    (= :block/path-refs (:db/ident entity))
    (try
      ((or remove-block-path-refs-fn remove-block-path-refs) db)
      (catch :default _e
        nil))))

(defn- invalid-block-tx-data
  [db entity dispatch-key entity-id]
  (cond
    (not-every? (fn [e] (ldb/class? e)) (:block/tags entity))
    (let [non-tags (remove ldb/class? (:block/tags entity))]
      (map (fn [tag]
             [:db/retract entity-id :block/tags (:db/id tag)]) non-tags))
    (and (= dispatch-key :normal-page) (:block/page entity))
    [[:db/retract entity-id :block/page]]
    (and (= dispatch-key :block) (nil? (:block/title entity)))
    [[:db/retractEntity entity-id]]
    (and (= dispatch-key :block) (nil? (:block/page entity)))
    (let [latest-journal-id (:db/id (first (ldb/get-latest-journals db)))
          page-id (:db/id (:block/page (:block/parent entity)))]
      (cond
        page-id
        [[:db/add entity-id :block/page page-id]]
        latest-journal-id
        [[:db/add entity-id :block/page latest-journal-id]
         [:db/add entity-id :block/parent latest-journal-id]]
        :else
        (js/console.error (str "Don't know where to put the block " entity-id))))

    (and (= dispatch-key :block)
         (some (fn [k] (= "user.class" (namespace k))) (keys (:logseq.property.table/sized-columns entity))))
    (let [new-value (->> (keep (fn [[k v]]
                                 (if (= "user.class" (namespace k))
                                   (when-let [property (get-property-by-title db (:block/title (d/entity db k)))]
                                     [(:db/ident property) v])
                                   [k v]))
                               (:logseq.property.table/sized-columns entity))
                         (into {}))]
      [[:db/add entity-id :logseq.property.table/sized-columns new-value]])

    (some (fn [k] (= "block.temp" (namespace k))) (keys entity))
    (let [ks (filter (fn [k] (= "block.temp" (namespace k))) (keys entity))]
      (mapv (fn [k] [:db/retract entity-id k]) ks))
    (and (not (:block/page entity)) (not (:block/parent entity)) (not (:block/name entity)))
    [[:db/retractEntity entity-id]]
    (and (= dispatch-key :property-value-block) (:block/title entity))
    [[:db/retract entity-id :block/title]]
    (and (ldb/class? entity) (not (:logseq.property.class/extends entity))
         (not= (:db/ident entity) :logseq.class/Root))
    [[:db/add entity-id :logseq.property.class/extends :logseq.class/Root]]
    (and (or (ldb/class? entity) (ldb/property? entity)) (ldb/internal-page? entity))
    [[:db/retract entity-id :block/tags :logseq.class/Page]]

    (and (:logseq.property.asset/remote-metadata entity) (nil? (:logseq.property.asset/type entity)))
    [[:db/retractEntity entity-id]]))

(defn- invalid-entity-tx-data
  [db {:keys [entity dispatch-key] error-entity-id :entity-id} opts]
  (when-let [entity-id (or error-entity-id (resolve-entity-id db entity))]
    (let [current-entity (d/entity db entity-id)]
      (or (invalid-fragment-tx-data db current-entity entity dispatch-key entity-id)
          (invalid-location-tx-data db current-entity entity-id (:remove-block-path-refs-fn opts))
          (invalid-block-tx-data db current-entity dispatch-key entity-id)))))

(defn- class-as-properties-tx-data
  [db]
  (concat
   (mapcat
    (fn [ident]
      (->> (d/datoms db :eavt)
           (filter (fn [d] (= ident (:a d))))
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
                    (if-let [property-ident (:db/ident property)]
                      [[:db/retract (:e d) (:a d) (:v d)]
                       [:db/add (:e d) property-ident (:v d)]]
                      [[:db/retract (:e d) (:a d) (:v d)]])))))))

(defn fix-invalid-blocks!
  ([conn errors]
   (fix-invalid-blocks! conn errors nil))
  ([conn errors opts]
   (let [db @conn
         tx-data (concat (mapcat #(invalid-entity-tx-data db % opts) errors)
                         (class-as-properties-tx-data db))]
     (when (seq tx-data)
       (let [tx-report (d/transact! conn tx-data {:fix-db? true})]
         (seq (:tx-data tx-report)))))))

(defn validate-db-result
  [db]
  (let [{:keys [errors datom-count entities]} (db-validate/validate-db db)
        errors' (map (fn [error]
                       (assoc error :entity-id (resolve-entity-id db (:entity error))))
                     errors)
        invalid-entity-ids (distinct (map :entity-id errors'))]
    {:errors (seq errors')
     :datom-count datom-count
     :entities entities
     :invalid-entity-ids invalid-entity-ids}))

(defn log-validation-errors!
  [errors]
  (doseq [error errors]
    (prn :debug
         :entity (:entity error)
         :error (dissoc error :entity))))

(defn validate-and-fix-invalid-blocks!
  ([conn]
   (validate-and-fix-invalid-blocks! conn nil))
  ([conn opts]
   (loop [{:keys [errors] :as result} (validate-db-result @conn)
          seen-validation-states #{}]
     (log-validation-errors! errors)
     (let [validation-state (hash (pr-str errors))
           fix-progress? (and (seq errors)
                              (not (contains? seen-validation-states validation-state))
                              (fix-invalid-blocks! conn errors opts))]
       (if fix-progress?
         (recur (validate-db-result @conn)
                (conj seen-validation-states validation-state))
         result)))))
