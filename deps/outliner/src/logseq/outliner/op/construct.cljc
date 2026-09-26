(ns logseq.outliner.op.construct
  "Construct canonical forward and reverse outliner ops for history actions."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]))

(def ^:api semantic-outliner-ops
  #{:save-block
    :insert-blocks
    :apply-template
    :move-blocks
    :move-blocks-up-down
    :indent-outdent-blocks
    :delete-blocks
    :create-page
    :rename-page
    :delete-page
    :restore-recycled
    :recycle-delete-permanently
    :upsert-property})

(def ^:private transient-block-keys
  #{:db/id
    :block/tx-id
    :block/created-at
    :block/updated-at
    :block/meta
    :block/unordered
    :block/level
    :block.temp/ast-title
    :block.temp/ast-body
    :block.temp/load-status
    :block.temp/has-children?
    :logseq.property/created-by-ref})

(def ^:private delete-restore-transient-block-keys
  (disj transient-block-keys :logseq.property/created-by-ref))

(def ^:api rebase-refs-key :block.temp/sync-rebase-refs)
(def ^:api rebase-created-refs-key :block.temp/sync-created-refs)

(defn- stable-entity-ref
  [db x]
  (cond
    (or (map? x) (de/entity? x))
    (let [eid (or (:db/id x)
                  (when-let [id (:block/uuid x)]
                    (:db/id (d/entity db [:block/uuid id]))))]
      (stable-entity-ref db eid))
    (uuid? x)
    [:block/uuid x]
    (and (integer? x) (not (neg? x)))
    (if-let [ent (d/entity db x)]
      (cond
        (:block/uuid ent) [:block/uuid (:block/uuid ent)]
        (:db/ident ent) (:db/ident ent)
        :else x)
      x)
    :else x))

(defn- tx-data-block-uuid-ref
  [tx-data entity-ref]
  (some (fn [item]
          (when (and (= entity-ref (:e item))
                     (= :block/uuid (:a item))
                     (uuid? (:v item)))
            [:block/uuid (:v item)]))
        tx-data))

(defn- stable-entity-ref-with-tx-data
  [db tx-data x]
  (let [entity-ref (stable-entity-ref db x)]
    (if (and (integer? entity-ref) (not (neg? entity-ref)))
      (or (tx-data-block-uuid-ref tx-data entity-ref)
          entity-ref)
      entity-ref)))

(defn- stable-block-ref-with-tx-data
  [db tx-data x]
  (stable-entity-ref-with-tx-data db tx-data x))

(defn- sanitize-ref-value
  ([db v]
   (sanitize-ref-value db nil v))
  ([db tx-data v]
   (cond
     (vector? v) (stable-entity-ref-with-tx-data db tx-data v)
     (or (set? v) (sequential? v)) (set (map #(stable-entity-ref-with-tx-data db tx-data %) v))
     :else (stable-entity-ref-with-tx-data db tx-data v))))

(defn- sanitize-upsert-property-schema
  [db schema]
  (reduce-kv (fn [m k v]
               (assoc m k
                      (if (= :logseq.property/classes k)
                        (sanitize-ref-value db v)
                        v)))
             {}
             schema))

(defn- sanitize-block-refs
  [refs]
  (->> refs
       (keep (fn [ref-entity]
               (when (:block/uuid ref-entity)
                 (select-keys ref-entity [:block/uuid :block/title :db/ident]))))
       vec))

(defn- ref-attr?
  [db a]
  (and (keyword? a)
       (= :db.type/ref
          (:db/valueType (d/entity db a)))))

(defn- sanitize-block-payload
  ([db block]
   (sanitize-block-payload db block nil))
  ([db block {:keys [created-uuids tx-data]}]
   (if (map? block)
     (let [refs (sanitize-block-refs (:block/refs block))
           created-ref-uuids (when (and (seq created-uuids) (seq refs))
                               (->> refs
                                    (keep :block/uuid)
                                    (filter (set created-uuids))
                                    distinct
                                    vec))
          m (reduce-kv
             (fn [m k v]
               (cond
                 (contains? transient-block-keys k) m
                 (= "block.temp" (namespace k)) m
                 (ref-attr? db k)
                 (assoc m k (sanitize-ref-value db tx-data v))
                 :else
                 (assoc m k v)))
             {}
             block)]
      (cond-> m
        (seq refs)
        (assoc rebase-refs-key refs)

        (seq created-ref-uuids)
        (assoc rebase-created-refs-key created-ref-uuids)))
     block)))

(defn- get-missing-ref-by-lookup
  [missing-refs tag-lookups]
  (let [now (common-util/time-ms)]
    (->> missing-refs
         (keep (fn [{:block/keys [title] :as block :keys [db/ident]}]
                 (when-let [block-id (:block/uuid block)]
                   (let [lookup [:block/uuid block-id]
                         tag-ref? (contains? tag-lookups lookup)
                         entity (cond-> {:block/uuid block-id
                                         :block/title (or title "")
                                         :block/created-at now
                                         :block/updated-at now
                                         :block/tags (if tag-ref? :logseq.class/Tag :logseq.class/Page)}
                                  (string? title)
                                  (assoc :block/name (common-util/page-name-sanity-lc title))
                                  tag-ref?
                                  (assoc :logseq.property.class/extends :logseq.class/Root)
                                  ident
                                  (assoc :db/ident ident))]
                     [lookup entity]))))
         (into {}))))

(defn rewrite-block-title-with-retracted-refs
  [db block]
  (let [refs (get block rebase-refs-key)
        created-ref-uuids (set (get block rebase-created-refs-key))
        missing-refs (remove (fn [ref-entity] (d/entity db [:block/uuid (:block/uuid ref-entity)])) refs)
        retracted-refs (remove (fn [block]
                                 (contains? created-ref-uuids (:block/uuid block)))
                               missing-refs)
        tag-lookups (->> (:block/tags block)
                         (filter (fn [v]
                                   (and (vector? v)
                                        (= :block/uuid (first v)))))
                         set)
        missing-ref-by-lookup (get-missing-ref-by-lookup missing-refs tag-lookups)
        rewrite-retracted-refs (fn [v]
                                 (let [rewrite-ref (fn [block-ref]
                                                     (or (get missing-ref-by-lookup block-ref)
                                                         block-ref))]
                                   (map rewrite-ref v)))
        block' (cond-> block
                 (seq retracted-refs)
                 (update :block/title
                         (fn [title]
                           (-> title
                               (db-content/content-id-ref->page retracted-refs))))

                 (seq missing-ref-by-lookup)
                 (-> (update :block/refs rewrite-retracted-refs)
                     (update :block/tags rewrite-retracted-refs)))]
    (dissoc block' rebase-refs-key rebase-created-refs-key)))

(defn- sanitize-insert-block-payload
  [db tx-data block]
  (let [block' (sanitize-block-payload db block {:tx-data tx-data})]
    (if (map? block')
      (dissoc block' :block/page :block/order rebase-refs-key)
      block')))

(defn- stable-id-coll
  [db ids]
  (mapv #(stable-entity-ref db %) ids))

(defn- stable-block-uuid
  [db x]
  (let [entity-ref (stable-entity-ref db x)]
    (cond
      (uuid? entity-ref)
      entity-ref

      (and (vector? entity-ref)
           (= :block/uuid (first entity-ref))
           (uuid? (second entity-ref)))
      (second entity-ref)

      :else
      entity-ref)))

(defn- resolve-target-and-sibling
  [block]
  (if-let [left-sibling (ldb/get-left-sibling block)]
    [(:db/id left-sibling) true]
    (when-let [parent (:block/parent block)]
      [(:db/id parent) false])))

(defn- resolve-move-target
  [db ids]
  (when-let [first-block (some->> ids first (d/entity db))]
    (resolve-target-and-sibling first-block)))

(defn- created-block-uuids-from-tx-data
  [tx-data]
  (->> tx-data
       (keep (fn [item]
               (cond
                 (and (map? item) (:block/uuid item))
                 (:block/uuid item)

                 (and (some? (:a item))
                      (= :block/uuid (:a item))
                      (true? (:added item)))
                 (:v item)

                 (and (vector? item)
                      (= :db/add (first item))
                      (>= (count item) 4)
                      (= :block/uuid (nth item 2)))
                 (nth item 3)

                 :else
                 nil)))
       distinct
       vec))

(defn- created-page-entities-from-tx-data
  "Page-like entities created in `tx-data` (they carry :block/title plus
  :block/name or :db/ident), returned as {:eid :uuid :title :parent-ref :extends-ref}
  maps in tx order. Handles both datom and map forms."
  [tx-data]
  (let [datom-entities
        (->> (group-by :e (filter #(some? (:a %)) tx-data))
             (keep (fn [[eid datoms]]
                     (let [v (fn [a]
                               (some #(when (and (= a (:a %))
                                                 (true? (:added %)))
                                        (:v %))
                                     datoms))
                           uuid' (v :block/uuid)
                           title (v :block/title)]
                       (when (and (uuid? uuid')
                                  (string? title)
                                  (or (string? (v :block/name))
                                      (qualified-keyword? (v :db/ident))))
                         {:eid eid
                          :uuid uuid'
                          :title title
                          :parent-ref (v :block/parent)
                          :extends-ref (v :logseq.property.class/extends)})))))
        map-entities
        (keep (fn [item]
                (when (and (map? item)
                           (nil? (:a item))
                           (uuid? (:block/uuid item))
                           (string? (:block/title item))
                           (or (string? (:block/name item))
                               (qualified-keyword? (:db/ident item))))
                  {:eid (:db/id item)
                   :uuid (:block/uuid item)
                   :title (:block/title item)
                   :parent-ref (:block/parent item)
                   :extends-ref (:logseq.property.class/extends item)}))
              tx-data)]
    (vec (concat datom-entities map-entities))))

(defn- title-eq?
  [a b]
  (and (string? a)
       (string? b)
       (= (common-util/page-name-sanity-lc a)
          (common-util/page-name-sanity-lc b))))

(defn- created-page-info-from-tx-data
  "Returns {:leaf-uuid :parent-uuids :created-uuids} for a :create-page tx.
  :leaf-uuid is the uuid of the created page named `title`.
  :parent-uuids is indexed by the title's namespace parent parts, nil where a
  parent segment was not created by this tx.
  :created-uuids is every page-like entity created by this tx (leaf, namespace
  ancestors, new tags)."
  [tx-data title]
  (let [entities (created-page-entities-from-tx-data tx-data)
        by-eid (into {} (keep (fn [e] (when (:eid e) [(:eid e) e])) entities))
        by-uuid (into {} (map (fn [e] [(:uuid e) e]) entities))
        resolve-ref (fn [v]
                      (cond
                        (contains? by-eid v) (get by-eid v)
                        (uuid? v) (get by-uuid v)
                        (and (vector? v) (= :block/uuid (first v))) (get by-uuid (second v))
                        (map? v) (or (get by-uuid (:block/uuid v))
                                     (get by-eid (:db/id v)))
                        (de/entity? v) (or (get by-uuid (:block/uuid v))
                                           (get by-eid (:db/id v)))
                        :else nil))
        parent-of (fn [e] (or (resolve-ref (:parent-ref e))
                              (resolve-ref (:extends-ref e))))
        parts (->> (string/split (or title "") #"/")
                   (map string/trim)
                   (remove string/blank?)
                   vec)
        leaf-segment (last parts)
        ;; Walk the parent chain of a leaf candidate and require each namespace
        ;; ancestor segment (innermost first) to match.
        chain-match? (fn [leaf]
                       (loop [e leaf
                              segments (seq (rseq (pop parts)))]
                         (if (nil? segments)
                           true
                           (when-let [p (parent-of e)]
                             (when (title-eq? (:title p) (first segments))
                               (recur p (next segments)))))))
        candidates (filter #(title-eq? (:title %) leaf-segment) entities)
        loose-leaf-uuid
        ;; Entities that only assert :block/uuid + :block/title (e.g. synthesized
        ;; tx-data) still count for identifying the created page itself.
        (some (fn [[_eid datoms]]
                (let [uuid' (some #(when (and (= :block/uuid (:a %)) (true? (:added %))) (:v %)) datoms)
                      title' (some #(when (and (= :block/title (:a %)) (true? (:added %))) (:v %)) datoms)]
                  (when (and (uuid? uuid')
                             (or (title-eq? title' leaf-segment)
                                 (title-eq? title' title)))
                    uuid')))
              (group-by :e (filter #(some? (:a %)) tx-data)))
        loose-leaf-map-uuid
        (some (fn [item]
                (when (and (map? item)
                           (nil? (:a item))
                           (uuid? (:block/uuid item))
                           (or (title-eq? (:block/title item) leaf-segment)
                               (title-eq? (:block/title item) title)))
                  (:block/uuid item)))
              tx-data)
        leaf (or (some #(when (chain-match? %) %) candidates)
                 (first candidates)
                 (some #(when (title-eq? (:title %) title) %) entities)
                 (when (or loose-leaf-uuid loose-leaf-map-uuid)
                   {:uuid (or loose-leaf-uuid loose-leaf-map-uuid)}))
        ;; Assign each created ancestor (innermost first) to its segment index
        ;; by walking the leaf's parent chain, so repeated segment titles like
        ;; "a/a/leaf" map to their own entities. Stops at the first title
        ;; mismatch or an ancestor this tx did not create.
        segments (if (seq parts) (pop parts) [])
        parent-uuids
        (let [assignments (loop [e leaf
                                 idx (dec (count segments))
                                 acc {}]
                            (if (or (nil? e) (neg? idx))
                              acc
                              (if-let [p (parent-of e)]
                                (if (title-eq? (:title p) (nth segments idx))
                                  (recur p (dec idx) (assoc acc idx (:uuid p)))
                                  acc)
                                acc)))]
          (mapv #(get assignments %) (range (count segments))))]
    {:leaf-uuid (:uuid leaf)
     :parent-uuids parent-uuids
     :created-uuids (mapv :uuid entities)}))

(defn- created-property-ident-from-tx-data
  "Ident of a property entity created in `tx-data`, matched by the Property tag
  or by its title, falling back to any created db/ident."
  [db tx-data property-name]
  (let [property-class-id (:db/id (d/entity db :logseq.class/Property))
        name-eq? (fn [v] (title-eq? v property-name))
        datom-ident
        (some (fn [[_eid datoms]]
                (let [ident (some (fn [item]
                                    (when (and (= :db/ident (:a item))
                                               (true? (:added item))
                                               (qualified-keyword? (:v item)))
                                      (:v item)))
                                  datoms)
                      title' (some (fn [item]
                                     (when (and (= :block/title (:a item))
                                                (true? (:added item)))
                                       (:v item)))
                                   datoms)
                      property-tagged? (some (fn [item]
                                               (and (= :block/tags (:a item))
                                                    (true? (:added item))
                                                    (= property-class-id (:v item))))
                                             datoms)]
                  (when (and ident (or property-tagged? (name-eq? title')))
                    ident)))
              (group-by :e (filter #(some? (:a %)) tx-data)))
        map-ident
        (some (fn [item]
                (when (and (map? item)
                           (nil? (:a item))
                           (qualified-keyword? (:db/ident item))
                           (or (name-eq? (:block/title item))
                               (some (fn [tag]
                                       (= :logseq.class/Property
                                          (if (keyword? tag) tag (:db/ident tag))))
                                     (:block/tags item))))
                  (:db/ident item)))
              tx-data)]
    (or datom-ident map-ident)))

(defn- created-db-ident-from-tx-data
  [tx-data]
  (or
   (some (fn [item]
           (when (and (map? item)
                      (qualified-keyword? (:db/ident item)))
             (:db/ident item)))
         tx-data)
   (some (fn [item]
           (when (and (map? item)
                      (= :db/ident (:a item))
                      (qualified-keyword? (:v item)))
             (:v item)))
         tx-data)
   (some (fn [item]
           (when (and (vector? item)
                      (keyword? (nth item 1 nil))
                      (= :db/ident (nth item 1 nil))
                      (qualified-keyword? (nth item 2 nil)))
             (nth item 2)))
         tx-data)
   (some (fn [item]
           (when (and (vector? item)
                      (= :db/add (first item))
                      (>= (count item) 4)
                      (= :db/ident (nth item 2))
                      (qualified-keyword? (nth item 3)))
             (nth item 3)))
         tx-data)))

(defn- property-ident-by-title
  [db property-name]
  (some-> (d/q '[:find ?ident .
                 :in $ ?title
                 :where
                 [?e :block/title ?title]
                 [?e :block/tags :logseq.class/Property]
                 [?e :db/ident ?ident]]
               db
               property-name)
          (as-> ident
                (when (qualified-keyword? ident)
                  ident))))

(defn- maybe-rewrite-delete-block-ids
  [db tx-data ids]
  (let [deleted-ids-from-tx-data (->> tx-data
                                      (keep (fn [item]
                                              (cond
                                                (and (vector? item)
                                                     (= :db/retractEntity (first item))
                                                     (>= (count item) 2))
                                                (second item)

                                                ;; d/with-style datom maps after retractEntity
                                                ;; can be used to recover deleted entity ids.
                                                (and (map? item)
                                                     (false? (:added item))
                                                     (= :block/uuid (:a item)))
                                                (:e item)

                                                ;; datascript Datom records from d/with
                                                (and (some? (:a item))
                                                     (false? (:added item))
                                                     (= :block/uuid (:a item)))
                                                (:e item)

                                                :else
                                                nil)))
                                      distinct
                                      vec)
        ids-from-tx-data' (some->> deleted-ids-from-tx-data
                                   (stable-id-coll db)
                                   seq
                                   vec)
        ids' (stable-id-coll db ids)
        created-uuids (created-block-uuids-from-tx-data tx-data)
        unresolved-created-lookups? (and (seq created-uuids)
                                         (= (count ids') (count created-uuids))
                                         (every? (fn [id]
                                                   (and (vector? id)
                                                        (= :block/uuid (first id))
                                                        (nil? (d/entity db id))))
                                                 ids'))]
    (cond
      ;; Prefer the delete ids directly observed in tx-data to avoid carrying stale
      ;; UI selection ids that weren't actually retracted in this transaction.
      (seq ids-from-tx-data')
      ids-from-tx-data'

      unresolved-created-lookups?
      (mapv (fn [block-uuid] [:block/uuid block-uuid]) created-uuids)
      :else
      ids')))

(defn- moved-block-ids-from-tx-data
  [tx-data]
  (->> tx-data
       (keep (fn [[e a _v _t added?]]
               (when (and (= :block/parent a) (true? added?))
                 e)))
       distinct
       vec))

(defn- remap-lookup-ref-by-uuid-map
  [uuid-map v]
  (cond
    (and (vector? v)
         (= :block/uuid (first v))
         (uuid? (second v)))
    [:block/uuid (get uuid-map (second v) (second v))]

    (set? v)
    (into #{} (map #(remap-lookup-ref-by-uuid-map uuid-map %) v))

    (sequential? v)
    (into (empty v) (map #(remap-lookup-ref-by-uuid-map uuid-map %) v))

    :else
    v))

(defn- remap-block-lookup-values-by-uuid-map
  [block uuid-map]
  (if (map? block)
    (reduce-kv (fn [m k v]
                 (assoc m k (remap-lookup-ref-by-uuid-map uuid-map v)))
               {}
               block)
    block))

(defn- template-children-blocks-for-history
  [db template-ref]
  (when-let [template (d/entity db template-ref)]
    (let [template-id (:db/id template)
          template-blocks (some->> (ldb/get-block-and-children db (:block/uuid template)
                                                               {:include-property-block? true})
                                   rest
                                   seq
                                   vec)]
      (when (seq template-blocks)
        (vec
         (cons (assoc (into {} (first template-blocks))
                      :db/id (:db/id (first template-blocks))
                      :logseq.property/used-template template-id)
               (map (fn [block]
                      (assoc (into {} block) :db/id (:db/id block)))
                    (rest template-blocks))))))))

(defn- inserted-block-uuids-from-tx-data
  [tx-data]
  (let [entity-id (fn [item]
                    (cond
                      (some? (:a item)) (:e item)
                      (vector? item) (second item)
                      :else (or (:db/id item) [:block/uuid (:block/uuid item)])))
        parent-ids (into #{}
                         (comp (filter (fn [item]
                                         (or (:block/parent item)
                                             (and (= :block/parent (:a item))
                                                  (true? (:added item)))
                                             (and (vector? item)
                                                  (= :db/add (first item))
                                                  (= :block/parent (nth item 2 nil))))))
                               (map entity-id))
                         tx-data)]
    ;; Saving a reference and inserting a sibling creates both a page and a
    ;; block. Only the inserted tree has parent writes in that transaction.
    ;; Use durable datoms: later edits can move or delete either entity.
    (created-block-uuids-from-tx-data
     (filter #(contains? parent-ids (entity-id %)) tx-data))))

(defn- replaces-empty-target?
  [db tx-data source-uuids target-ref opts]
  (and (or (:replace-empty-target? opts)
           (and (:sibling? opts) (> (count source-uuids) 1)))
       (or (= (first source-uuids) (:block/uuid (d/entity db target-ref)))
           (some (fn [item]
                   (let [[e a v added?]
                         (if (vector? item)
                           [(second item) (nth item 2 nil) (nth item 3 nil)
                            (= :db/add (first item))]
                           [(:e item) (:a item) (:v item) (:added item)])]
                     (and (= :block/title a) (false? added?)
                          (string? v) (string/blank? v)
                          (= target-ref (stable-entity-ref db e)))))
                 tx-data))))

(defn- canonicalize-insert-blocks-op
  ([db tx-data args]
   (canonicalize-insert-blocks-op db tx-data args (inserted-block-uuids-from-tx-data tx-data)))
  ([db tx-data args available-uuids]
   (let [[blocks target-id opts] args
         source-blocks (mapv #(sanitize-insert-block-payload db tx-data %) blocks)
         source-uuids (mapv :block/uuid source-blocks)
         target-ref (stable-entity-ref db target-id)
         target (d/entity db target-ref)
         available-set (set available-uuids)
         replaced-target? (and (not (every? available-set source-uuids))
                                (replaces-empty-target? db tx-data source-uuids target-ref opts))
         new-source-uuids (if replaced-target? (subvec source-uuids 1) source-uuids)
         created-uuids (if (every? available-set new-source-uuids)
                         new-source-uuids
                         (vec (take (count new-source-uuids) available-uuids)))
         block-with-new-id (fn [block block-uuid]
                             (assoc block
                                    :block/uuid block-uuid
                                    :block/parent (let [parent (:block/parent (d/entity db [:block/uuid block-uuid]))]
                                                    [:block/uuid (:block/uuid parent)])))
         blocks* (if (or replaced-target? (seq created-uuids))
                   (if (or replaced-target?
                           (and (:replace-empty-target? opts)
                                (= (inc (count created-uuids)) (count source-blocks))))
                     (let [[fst-block & rst-blocks] source-blocks
                           created-rst-uuids created-uuids]
                       (into [(assoc fst-block :block/uuid (:block/uuid target))]
                             (if (seq created-rst-uuids)
                               (map block-with-new-id rst-blocks created-rst-uuids)
                               rst-blocks)))
                     (mapv block-with-new-id source-blocks created-uuids))
                   source-blocks)
         uuid-remap (->> (map vector source-uuids (map :block/uuid blocks*))
                         (keep (fn [[old-uuid new-uuid]]
                                 (when (and (uuid? old-uuid)
                                            (uuid? new-uuid)
                                            (not= old-uuid new-uuid))
                                   [old-uuid new-uuid])))
                         (into {}))
         blocks* (if (seq uuid-remap)
                   (mapv #(remap-block-lookup-values-by-uuid-map % uuid-remap) blocks*)
                   blocks*)]
     [blocks*
      target-ref
      (assoc (dissoc (or opts {}) :outliner-op)
             :keep-uuid? true)])))

(defn- canonicalize-template-op
  [db tx-data args available-uuids]
  (let [[template-id target-id opts] args
        template-ref (stable-entity-ref db template-id)
        target-ref (stable-entity-ref db target-id)
        template-blocks (or (some-> (:template-blocks opts) seq vec)
                            (template-children-blocks-for-history db template-ref))
        opts-base (dissoc opts :template-id :outliner-op)
        opts' (if (seq template-blocks)
                (let [[blocks* _target-ref insert-opts]
                      (canonicalize-insert-blocks-op db tx-data [template-blocks target-id opts-base] available-uuids)]
                  (assoc insert-opts :template-blocks blocks*))
                (dissoc opts-base :template-blocks))]
    (when-not (and template-ref target-ref)
      (throw (ex-info "Invalid apply-template args"
                      {:args args})))
    [:apply-template [template-ref target-ref opts']]))

(defn ^:api canonicalize-insert-ops
  [db tx-data ops]
  (:ops
   (reduce (fn [{:keys [available] :as result} [op args :as entry]]
             (if (contains? #{:insert-blocks :apply-template} op)
               (let [[_ args' :as entry']
                     (if (= :insert-blocks op)
                       [op (canonicalize-insert-blocks-op db tx-data args available)]
                       (canonicalize-template-op db tx-data args available))
                     blocks (if (= :insert-blocks op) (first args') (get-in args' [2 :template-blocks]))
                     inserted-uuids (set (map :block/uuid blocks))]
                 (-> result
                     (update :ops conj entry')
                     (assoc :available (filterv #(not (contains? inserted-uuids %)) available))))
               (update result :ops conj entry)))
           {:ops [] :available (inserted-block-uuids-from-tx-data tx-data)}
           ops)))

(defn- canonical-move-op-for-block
  [db block-id opts]
  (when-let [[target-id sibling?] (resolve-move-target db [block-id])]
    [:move-blocks [[(stable-entity-ref db block-id)]
                   (stable-entity-ref db target-id)
                   (assoc (dissoc (or opts {}) :outliner-op)
                          :sibling? sibling?)]]))

(defn- canonicalize-indent-outdent-op
  [db tx-data ids indent? opts]
  (let [moved-ids (moved-block-ids-from-tx-data tx-data)]
    (if (seq moved-ids)
      (let [move-ops (->> moved-ids
                          (keep #(canonical-move-op-for-block db % opts))
                          vec)]
        (if (= (count moved-ids) (count move-ops))
          move-ops
          [[:indent-outdent-blocks [(stable-id-coll db ids)
                                    indent?
                                    opts]]]))
      [[:indent-outdent-blocks [(stable-id-coll db ids)
                                indent?
                                opts]]])))

(defn- ^:large-vars/cleanup-todo canonicalize-semantic-outliner-op
  [db tx-data [op args]]
  (case op
    :save-block
    (let [[block opts] args
          created-uuids (created-block-uuids-from-tx-data tx-data)]
      [:save-block [(sanitize-block-payload db block {:created-uuids created-uuids
                                                      :tx-data tx-data})
                    opts]])

    :insert-blocks
    [:insert-blocks
     (canonicalize-insert-blocks-op db tx-data args)]

    :apply-template
    (canonicalize-template-op db tx-data args (inserted-block-uuids-from-tx-data tx-data))

    :move-blocks-up-down
    (let [[ids up?] args]
      [:move-blocks-up-down
       [(stable-id-coll db ids)
        up?]])

    :indent-outdent-blocks
    (let [[ids indent? opts] args]
      (canonicalize-indent-outdent-op db tx-data ids indent? opts))

    :move-blocks
    (let [[ids target-id opts] args]
      [:move-blocks [(stable-id-coll db ids)
                     (stable-block-ref-with-tx-data db tx-data target-id)
                     opts]])

    :delete-blocks
    (let [[ids opts] args]
      [:delete-blocks [(maybe-rewrite-delete-block-ids db tx-data ids) opts]])

    :create-page
    (let [[title opts] args
          {:keys [leaf-uuid parent-uuids]} (created-page-info-from-tx-data tx-data title)]
      [:create-page [title
                     (cond-> (or opts {})
                       leaf-uuid
                       (assoc :uuid leaf-uuid)
                       (some some? parent-uuids)
                       (assoc :parent-uuids parent-uuids))]])

    :rename-page
    (let [[page-uuid new-title] args]
      [:save-block [{:block/uuid (stable-block-uuid db page-uuid)
                     :block/title new-title}
                    {}]])

    :delete-page
    (let [[page-uuid opts] args]
      [:delete-page [(stable-block-uuid db page-uuid) opts]])

    :restore-recycled
    (let [[root-id] args]
      [:restore-recycled [(stable-block-uuid db root-id)]])

    :recycle-delete-permanently
    (let [[root-id] args]
      [:recycle-delete-permanently [(stable-block-uuid db root-id)]])

    :upsert-property
    (let [[property-id schema opts] args
          property-id' (or (stable-entity-ref db property-id)
                           (created-property-ident-from-tx-data db tx-data (:property-name opts))
                           (property-ident-by-title db (:property-name opts))
                           (created-db-ident-from-tx-data tx-data))]
      [:upsert-property [property-id' schema opts]])

    [op args]))

(defn- save-block-keys
  ([block]
   (save-block-keys block transient-block-keys))
  ([block transient-keys]
  (->> (keys block)
       (remove transient-keys)
       (remove #(= :db/other-tx %))
       (remove nil?))))

(defn- worker-ref-attr?
  [db a]
  (and (keyword? a)
       (= :db.type/ref
          (:db/valueType (d/entity db a)))))

(defn- block-entity
  [db block]
  (cond
    (map? block)
    (or (when-let [block-uuid (:block/uuid block)]
          (d/entity db [:block/uuid block-uuid]))
        (when-let [db-id (:db/id block)]
          (d/entity db db-id)))

    (integer? block)
    (d/entity db block)

    (uuid? block)
    (d/entity db [:block/uuid block])

    (vector? block)
    (d/entity db block)

    :else
    nil))

(defn- build-inverse-save-block
  [db-before block opts]
  (when-let [before-ent (block-entity db-before block)]
    (let [keys-to-restore (save-block-keys block)
          inverse-block (reduce
                         (fn [m k]
                           (let [v (if (= :block/title k)
                                     (:block/raw-title before-ent)
                                     (get before-ent k))]
                             (assoc m k
                                    (if (worker-ref-attr? db-before k)
                                      (sanitize-ref-value db-before v)
                                      v))))
                         {:block/uuid (:block/uuid before-ent)}
                         keys-to-restore)]
      [:save-block [inverse-block opts]])))

(defn- build-insert-block-payload
  [db-before ent]
  (when-let [block-uuid (:block/uuid ent)]
    (->> (save-block-keys ent delete-restore-transient-block-keys)
         (remove #(string/starts-with? (name %) "_"))
         (reduce (fn [m k]
                   (let [v (get ent k)]
                     (assoc m k
                            (if (worker-ref-attr? db-before k)
                              (sanitize-ref-value db-before v)
                              v))))
                 {:block/uuid block-uuid}))))

(defn- selected-block-roots
  "The selected blocks without a selected ancestor. With `direct-parent?`, the
  selected blocks without a selected parent: the blocks
  outliner.core/filter-top-level-blocks keeps, so a moved block under a
  selected grandparent gets its own restore."
  [db-before ids & {:keys [direct-parent?]}]
  (let [resolved-entities (mapv #(block-entity db-before %) ids)
        unresolved-id? (some nil? resolved-entities)
        entities (reduce (fn [acc ent]
                           (if (some #(= (:db/id %) (:db/id ent)) acc)
                             acc
                             (conj acc ent)))
                         []
                         (remove nil? resolved-entities))
        selected-ids (set (map :db/id entities))
        has-selected-ancestor? (fn [ent]
                                 (loop [parent (:block/parent ent)]
                                   (if-let [parent-id (some-> parent :db/id)]
                                     (cond
                                       (contains? selected-ids parent-id) true
                                       direct-parent? false
                                       :else (recur (:block/parent parent)))
                                     false)))]
    {:roots (->> entities
                 (remove has-selected-ancestor?)
                 vec)
     :incomplete? (boolean unresolved-id?)}))

(defn- block-restore-target
  [ent]
  (if-let [left-sibling-id (:db/id (ldb/get-left-sibling ent))]
    [left-sibling-id true]
    (when-let [parent-id (or (:db/id (:block/parent ent))
                             (:db/id (:block/page ent)))]
      [parent-id false])))

(defn- created-from-property-ref
  [db-before root]
  (when-let [prop (:logseq.property/created-from-property root)]
    (or (:db/ident prop)
        (stable-entity-ref db-before prop))))

(defn- to-insert-op
  [db-before {:keys [blocks target-id sibling? created-from-property]}]
  [:insert-blocks [blocks
                   (stable-entity-ref db-before target-id)
                   (cond-> {:sibling? (boolean sibling?)
                            :keep-uuid? true
                            :keep-block-order? true}
                     created-from-property
                     (assoc :created-from-property created-from-property))]])

(defn- delete-root->restore-plan
  [db-before root]
  (let [root-id (:db/id root)
        root-uuid (:block/uuid root)
        blocks (when root-uuid
                 (->> (ldb/get-block-and-children db-before root-uuid
                                                  {:include-property-block? true})
                      (keep #(build-insert-block-payload db-before %))
                      vec))
        [target-id sibling?] (block-restore-target root)
        [target-id sibling?] (if (and target-id (= target-id root-id))
                               [(or (:db/id (:block/parent root))
                                    (:db/id (:block/page root)))
                                false]
                               [target-id sibling?])
        created-from-property (created-from-property-ref db-before root)]
    (when (and (seq blocks) (some? target-id))
      (cond-> {:blocks blocks
               :target-id (stable-entity-ref db-before target-id)
               :sibling? sibling?}
        created-from-property
        (assoc :created-from-property created-from-property)))))

(defn- build-inverse-delete-blocks
  [db-before ids]
  (let [{:keys [roots incomplete?]} (selected-block-roots db-before ids)
        plans (mapv #(delete-root->restore-plan db-before %) roots)]
    (when (and (not incomplete?)
               (seq roots)
               (every? some? plans))
      (->> plans
           (mapv #(to-insert-op db-before %))
           seq))))

(defn- move-root->restore-op
  [db-before root]
  (let [root-id (:db/id root)
        [target-id sibling?] (block-restore-target root)
        created-from-property (created-from-property-ref db-before root)]
    (when (and (some? root-id)
               (some? target-id))
      [:move-blocks
       [[(stable-entity-ref db-before root-id)]
        (stable-entity-ref db-before target-id)
        (cond-> {:sibling? (boolean sibling?)}
          created-from-property
          (assoc :created-from-property created-from-property))]])))

(defn- document-order-path
  "The id of the page, then the :block/order of each block from the page down
  to `block`."
  [block]
  (loop [block block
         path ()]
    (if-let [parent (:block/parent block)]
      (recur parent (conj path (:block/order block)))
      (conj path (:db/id block)))))

(defn- compare-document-order
  "Compares 2 document-order-path values: blocks sort as they appear on their
  pages, a parent before its children."
  [path-1 path-2]
  (loop [path-1 (seq path-1)
         path-2 (seq path-2)]
    (cond
      (and (nil? path-1) (nil? path-2)) 0
      (nil? path-1) -1
      (nil? path-2) 1
      :else (let [c (compare (first path-1) (first path-2))]
              (if (zero? c)
                (recur (next path-1) (next path-2))
                c)))))

(defn- build-inverse-move-blocks
  [db-before ids]
  (let [{:keys [roots incomplete?]} (selected-block-roots db-before ids :direct-parent? true)
        ;; Restore in page order: a block's restore target, its left sibling
        ;; or parent, may be another moved block, which must be back first.
        roots (sort-by document-order-path compare-document-order roots)
        restore-ops (mapv #(move-root->restore-op db-before %) roots)]
    (when (and (not incomplete?)
               (seq roots)
               (every? some? restore-ops))
      (seq restore-ops))))

(defn- opposite-move-restores?
  "Whether moving `ids` the other way undoes moving them up (`up?`) or down:
  the top-level blocks among `ids` are adjacent siblings in order, and a
  sibling on the side they move to keeps them under their parent. A move
  past the first or last child takes the blocks into another parent, and
  the opposite move need not bring them back: moving a, b up in `P(Q(a, b))`
  gives `P(a, b, Q)`, and moving them down again gives `P(Q, a, b)`."
  [db ids up?]
  (let [blocks (mapv #(block-entity db %) ids)
        selected-ids (set (keep :db/id blocks))
        top-level-blocks (remove #(contains? selected-ids (:db/id (:block/parent %))) blocks)]
    (and (every? some? blocks)
         (seq top-level-blocks)
         (every? (fn [[left right]]
                   (= (:db/id left) (:db/id (ldb/get-left-sibling right))))
                 (partition 2 1 top-level-blocks))
         (some? (if up?
                  (ldb/get-left-sibling (first top-level-blocks))
                  (ldb/get-right-sibling (last top-level-blocks)))))))

(defn- page-top-level-blocks
  [page]
  (let [page-id (:db/id page)]
    (->> (:block/_page page)
         (filter #(= page-id (some-> % :block/parent :db/id)))
         ldb/sort-by-order
         vec)))

(defn- entity->save-op
  [db-before ent]
  (build-inverse-save-block db-before (into {} ent) nil))

(defn- build-inverse-delete-page
  [db-before page-uuid]
  (when-let [page (d/entity db-before [:block/uuid page-uuid])]
    (let [class-or-property? (or (ldb/class? page)
                                 (ldb/property? page))
          today-page? (when-let [day (:block/journal-day page)]
                        (= (date-time-util/ms->journal-day (common-util/time-ms)) day))
          root-plans (mapv #(delete-root->restore-plan db-before %) (page-top-level-blocks page))]
      (cond
        class-or-property?
        (let [page-save-op (entity->save-op db-before (assoc (into {} page) :db/ident (:db/ident page)))
              create-op (if (ldb/class? page)
                          (let [class-ident-namespace (some-> (:db/ident page) namespace)]
                            [:create-page
                             [(:block/title page)
                              (cond-> {:uuid page-uuid
                                       :class? true
                                       :redirect? false
                                       :split-namespace? true}
                                class-ident-namespace
                                (assoc :class-ident-namespace class-ident-namespace))]])
                          [:upsert-property
                           [(:db/ident page)
                            (db-property/get-property-schema (into {} page))
                            {:property-name (:block/title page)}]])
              restore-root-ops (when (every? some? root-plans)
                                 (mapv #(to-insert-op db-before %) root-plans))]
          ;; Put the page's blocks back before its attributes: a property
          ;; value of the page can be one of those blocks.
          (cond-> []
            create-op
            (conj create-op)
            (seq restore-root-ops)
            (into restore-root-ops)
            page-save-op
            (conj page-save-op)
            :always
            seq))

        today-page?
        (when (every? some? root-plans)
          (->> root-plans
               (mapv #(to-insert-op db-before %))
               seq))

        :else
        ;; Soft-deleted pages are moved to Recycle with recycle metadata.
        ;; Use restore semantics instead of save-block to retract recycle markers.
        [:restore-recycled [page-uuid]]))))

(defn- restore-target-insert-op
  [db-before db-after target-id opts]
  (when (:replace-empty-target? opts)
    (when-let [target-ref (stable-entity-ref db-before target-id)]
      (when (d/entity db-after target-ref)
        (when-let [target (d/entity db-before target-ref)]
          (let [insert-block (build-insert-block-payload db-before target)
                [target-id sibling?] (resolve-target-and-sibling target)]
            [[:delete-blocks [[target-ref] {}]]
             (to-insert-op db-before {:blocks [insert-block]
                                      :target-id (stable-entity-ref db-before target-id)
                                      :sibling? sibling?})]))))))

(defn- build-inverse-insert-like
  [db-before db-after tx-data args]
  (let [[_blocks target-id opts] args
        new-block-eids (keep
                        (fn [d]
                          (when (and (= :block/uuid (:a d))
                                     (:added d)
                                     (nil? (d/entity db-before (:e d))))
                            [:block/uuid (:v d)]))
                        tx-data)
        restore-op (restore-target-insert-op db-before db-after target-id opts)]
    (cond-> []
      (seq new-block-eids)
      (conj [:delete-blocks [new-block-eids {}]])

      restore-op
      (into restore-op)

      :always
      seq)))

(defn- reverse-inverse-entry-groups
  [inverse-entries forward-op-group-sizes]
  (loop [entries inverse-entries
         sizes forward-op-group-sizes
         groups []]
    (if-let [group-size (first sizes)]
      (let [[group remaining] (split-at group-size entries)]
        (recur remaining (next sizes) (conj groups group)))
      (mapcat identity (reverse groups)))))

(defn- ^:large-vars/cleanup-todo build-strict-inverse-outliner-ops
  [db-before db-after tx-data forward-ops forward-op-group-sizes]
  (when (seq forward-ops)
    (let [inverse-entries
          (mapv (fn [[op args]]
                  (let [inverse-entry
                        (case op
                          :save-block
                          (let [[block opts] args]
                            (build-inverse-save-block db-before block opts))

                          :insert-blocks
                          (build-inverse-insert-like db-before db-after tx-data args)

                          :apply-template
                          (build-inverse-insert-like db-before db-after tx-data args)

                          :move-blocks
                          (let [[ids _target-id _opts] args]
                            (build-inverse-move-blocks db-before ids))

                          :indent-outdent-blocks
                          (let [[ids indent? opts] args]
                            [:indent-outdent-blocks [(stable-id-coll db-before ids)
                                                     (not indent?)
                                                     opts]])

                          :move-blocks-up-down
                          (let [[ids up?] args]
                            ;; Moving blocks that aren't adjacent siblings
                            ;; gathers them next to each other, and moving
                            ;; blocks past their parent's first or last child
                            ;; changes their parent, so moving them back the
                            ;; other way can't always restore them.
                            (if (opposite-move-restores? db-before ids up?)
                              [:move-blocks-up-down
                               [(stable-id-coll db-before ids)
                                (not up?)]]
                              (build-inverse-move-blocks db-before ids)))

                          :delete-blocks
                          (let [[ids _opts] args]
                            (build-inverse-delete-blocks db-before ids))

                          :create-page
                          (let [[_title opts] args]
                            (when-let [page-uuid (:uuid opts)]
                              (let [extra-uuids (->> (created-page-entities-from-tx-data tx-data)
                                                     (map :uuid)
                                                     (remove #(= % page-uuid))
                                                     distinct
                                                     vec)]
                                (if (seq extra-uuids)
                                  ;; The tx created auxiliary page-like entities too
                                  ;; (namespace parents, new tags): delete every created
                                  ;; entity so nothing dangling remains after undo.
                                  (->> (cons page-uuid extra-uuids)
                                       (mapcat (fn [u]
                                                 [[:delete-page [u {}]]
                                                  [:recycle-delete-permanently [u]]]))
                                       vec)
                                  [:delete-page [page-uuid {}]]))))

                          :delete-page
                          (let [[page-uuid _opts] args]
                            (build-inverse-delete-page db-before page-uuid))

                          :upsert-property
                          (let [[property-id _schema _opts] args]
                            (when (qualified-keyword? property-id)
                              (if-let [property (d/entity db-before property-id)]
                                [:upsert-property
                                 [property-id
                                  (sanitize-upsert-property-schema
                                   db-before
                                   (db-property/get-property-schema (into {} property)))
                                  {:property-name (:block/title property)}]]
                                [:delete-page [(common-uuid/gen-uuid :db-ident-block-uuid property-id) {}]])))

                          nil)]
                    (if (and (sequential? inverse-entry)
                             (empty? inverse-entry))
                      nil
                      inverse-entry)))
                forward-ops)]
      ;; Any missing inverse entry means the whole semantic inverse is incomplete.
      ;; Use raw reversed tx instead of partially replaying.
      (when (every? some? inverse-entries)
        (some->> (reverse-inverse-entry-groups inverse-entries forward-op-group-sizes)
                 (mapcat #(if (and (sequential? %)
                                   (sequential? (first %)))
                            %
                            [%]))
                 vec
                 seq)))))

(defn- has-replace-empty-target-insert-op?
  [forward-ops]
  (some (fn [[op [_blocks _target-id opts]]]
          (and (contains? #{:insert-blocks :apply-template} op)
               (:replace-empty-target? opts)))
        forward-ops))

(defn contains-transact-op?
  [ops]
  (let [ops' (cond
               (nil? ops)
               nil

               (and (sequential? ops)
                    (keyword? (first ops)))
               [(vec ops)]

               :else
               ops)]
    (some (fn [entry]
            (and (sequential? entry)
                 (= :transact (first entry))))
          ops')))

(defn- normalize-op-entries
  [ops]
  (let [ops' (some-> ops seq vec)]
    (cond
      (nil? ops')
      nil

      (and (keyword? (first ops'))
           (vector? (second ops')))
      [ops']

      :else
      ops')))

(defn- canonical-block-id
  [db block-id]
  (cond
    (uuid? block-id)
    block-id

    (and (vector? block-id)
         (= :block/uuid (first block-id))
         (uuid? (second block-id)))
    (second block-id)

    (and (integer? block-id)
         (not (neg? block-id)))
    (stable-block-uuid db block-id)

    :else
    block-id))

(defn- canonical-property-id
  [db property-id]
  (cond
    (qualified-keyword? property-id)
    property-id

    (and (integer? property-id)
         (not (neg? property-id)))
    (or (some-> (d/entity db property-id) :db/ident)
        property-id)

    :else
    property-id))

(defn- normalize-block-op-entry-ids
  [id ids op args]
  (case op
    :save-block
    (let [[block opts] args]
      [op [block opts]])

    :insert-blocks
    [op [(first args) (id (second args)) (nth args 2)]]

    :apply-template
    [op [(id (first args)) (id (second args)) (nth args 2)]]

    :delete-blocks
    [op [(ids (first args)) (second args)]]

    :move-blocks
    [op [(ids (first args)) (id (second args)) (nth args 2)]]

    :move-blocks-up-down
    [op [(ids (first args)) (second args)]]

    :indent-outdent-blocks
    [op [(ids (first args)) (second args) (nth args 2)]]

    nil))

(defn- normalize-property-op-entry-ids
  [id ids property-id op args]
  (case op
    :set-block-property
    [op [(id (first args)) (property-id (second args)) (nth args 2)]]

    :remove-block-property
    [op [(id (first args)) (property-id (second args))]]

    :delete-property-value
    [op [(id (first args)) (property-id (second args)) (nth args 2)]]

    :create-property-text-block
    [op [(some-> (first args) id) (property-id (second args)) (nth args 2) (nth args 3)]]

    :batch-set-property
    [op [(ids (first args)) (property-id (second args)) (nth args 2) (nth args 3)]]

    :batch-remove-property
    [op [(ids (first args)) (property-id (second args))]]

    :batch-delete-property-value
    [op [(ids (first args)) (property-id (second args)) (nth args 2)]]

    :class-add-property
    [op [(id (first args)) (property-id (second args))]]

    :class-remove-property
    [op [(id (first args)) (property-id (second args))]]

    :upsert-property
    [op [(some-> (first args) property-id) (second args) (nth args 2)]]

    :upsert-closed-value
    [op [(property-id (first args)) (second args)]]

    :delete-closed-value
    [op [(property-id (first args)) (id (second args))]]

    :add-existing-values-to-closed-values
    [op [(property-id (first args)) (second args)]]

    nil))

(defn- normalize-op-entry-ids
  [db [op args :as op-entry]]
  (let [id (fn [v] (canonical-block-id db v))
        property-id (fn [v] (canonical-property-id db v))
        ids (fn [vs] (mapv id vs))
        normalized (or (normalize-block-op-entry-ids id ids op args)
                       (normalize-property-op-entry-ids id ids property-id op args))]
    (or normalized op-entry)))

(defn- canonicalize-explicit-outliner-op-groups
  [db tx-data ops]
  (let [ops' (normalize-op-entries ops)]
    (cond
      (nil? ops')
      nil

      (seq ops')
      (->> (canonicalize-insert-ops db tx-data ops')
           (mapv (fn [op]
                   (let [canonicalized-op (if (contains? #{:insert-blocks :apply-template} (first op))
                                            op
                                            (canonicalize-semantic-outliner-op db tx-data op))]
                     (if (and (sequential? canonicalized-op)
                              (sequential? (first canonicalized-op))
                              (keyword? (ffirst canonicalized-op)))
                       (vec canonicalized-op)
                       [canonicalized-op]))))
           vec)

      :else
      nil)))

(defn- canonicalize-explicit-outliner-ops
  [db tx-data ops]
  (some->> (canonicalize-explicit-outliner-op-groups db tx-data ops)
           (mapcat identity)
           vec))

(defn- patch-inverse-delete-block-ops
  [inverse-outliner-ops forward-outliner-ops]
  (let [forward-insert-ops* (atom (->> forward-outliner-ops
                                       reverse
                                       (filter #(contains? #{:insert-blocks :apply-template} (first %)))
                                       vec))
        op->inserted-ids (fn [[op args]]
                           (let [blocks (case op
                                          :insert-blocks
                                          (first args)

                                          :apply-template
                                          (get-in args [2 :template-blocks])

                                          nil)]
                             (->> (or blocks [])
                                  (keep (fn [block]
                                          (when-let [block-uuid (:block/uuid block)]
                                            [:block/uuid block-uuid])))
                                  vec)))]
    (mapv (fn [[op args :as inverse-op]]
            (if (and (= :delete-blocks op)
                     (seq @forward-insert-ops*))
              (let [ids (op->inserted-ids (first @forward-insert-ops*))]
                (swap! forward-insert-ops* subvec 1)
                (if (seq ids)
                  [:delete-blocks [ids (second args)]]
                  inverse-op))
              inverse-op))
          inverse-outliner-ops)))

(defn- patch-forward-delete-block-op-ids
  [db-before outliner-ops]
  (some->> outliner-ops
           (mapv (fn [[op args :as op-entry]]
                   (if (= :delete-blocks op)
                     (let [[ids opts] args]
                       [:delete-blocks [(stable-id-coll db-before ids) opts]])
                     op-entry)))
           seq
           vec))

(defn- canonicalize-outliner-op-groups
  [db tx-meta tx-data]
  (let [explicit-forward-ops (normalize-op-entries (:db-sync/forward-outliner-ops tx-meta))
        outliner-ops (normalize-op-entries (:outliner-ops tx-meta))]
    (cond
      (seq explicit-forward-ops)
      (canonicalize-explicit-outliner-op-groups db tx-data explicit-forward-ops)

      (seq outliner-ops)
      (canonicalize-explicit-outliner-op-groups db tx-data outliner-ops)

      :else
      nil)))

(defn- unresolved-numeric-entity-id?
  [x]
  (and (integer? x)
       (not (neg? x))))

(defn- numeric-id-in-ref-value?
  [v]
  (cond
    (unresolved-numeric-entity-id? v)
    true

    (set? v)
    (some numeric-id-in-ref-value? v)

    (sequential? v)
    (some numeric-id-in-ref-value? v)

    :else
    false))

(defn- numeric-id-in-block-ref-attrs?
  [db block]
  (and (map? block)
       (some (fn [[k v]]
               (and (ref-attr? db k)
                    (numeric-id-in-ref-value? v)))
             block)))

(defn- stale-numeric-id-in-page-ops?
  [db op args]
  (case op
    :save-block
    (let [[block _opts] args]
      (numeric-id-in-block-ref-attrs? db block))

    :insert-blocks
    (let [[blocks target-id _opts] args]
      (or (some #(numeric-id-in-block-ref-attrs? db %) blocks)
          (unresolved-numeric-entity-id? target-id)))

    :create-page
    (let [[_title opts] args]
      (or (unresolved-numeric-entity-id? (:uuid opts))
          (numeric-id-in-ref-value? (:parent-uuids opts))))

    :rename-page
    (let [[page-uuid _new-title] args]
      (unresolved-numeric-entity-id? page-uuid))

    :delete-page
    (let [[page-uuid _opts] args]
      (unresolved-numeric-entity-id? page-uuid))

    :restore-recycled
    (let [[root-id] args]
      (unresolved-numeric-entity-id? root-id))

    :apply-template
    (let [[template-id target-id opts] args
          template-blocks (:template-blocks opts)]
      (or (unresolved-numeric-entity-id? template-id)
          (unresolved-numeric-entity-id? target-id)
          (some #(numeric-id-in-block-ref-attrs? db %) template-blocks)))

    :recycle-delete-permanently
    (let [[root-id] args]
      (unresolved-numeric-entity-id? root-id))

    nil))

(defn- stale-numeric-id-in-schema-ops?
  [op args]
  (case op
    :upsert-property
    (let [[property-id _schema _opts] args]
      (unresolved-numeric-entity-id? property-id))

    nil))

(defn- stale-numeric-id-in-op?
  [db [op args]]
  (and (not= :transact op)
       (boolean
        (or (stale-numeric-id-in-page-ops? db op args)
            (stale-numeric-id-in-schema-ops? op args)))))

(defn- assert-no-stale-numeric-ids!
  [db ops stage]
  (when-let [[idx op-entry] (some (fn [[idx op-entry]]
                                    (when (stale-numeric-id-in-op? db op-entry)
                                      [idx op-entry]))
                                  (map-indexed vector ops))]
    (throw (ex-info "Non-transact outliner ops contain numeric entity ids"
                    {:stage stage
                     :index idx
                     :op op-entry
                     :ops ops}))))

(defn ^:api assert-no-numeric-entity-ids!
  [db ops stage]
  (assert-no-stale-numeric-ids! db (some-> ops seq vec) stage))

(defn derive-history-outliner-ops
  [db-before db-after tx-data tx-meta]
  (let [canonical-forward-outliner-op-groups
        (some->> (canonicalize-outliner-op-groups db-after tx-meta tx-data)
                 (mapv (fn [group]
                         (->> (patch-forward-delete-block-op-ids db-before group)
                              (mapv #(normalize-op-entry-ids db-after %))))))
        canonical-forward-outliner-ops (some->> canonical-forward-outliner-op-groups
                                                (mapcat identity)
                                                seq
                                                vec)
        _ (assert-no-stale-numeric-ids! db-after canonical-forward-outliner-ops :forward-outliner-ops)
        forward-outliner-ops canonical-forward-outliner-ops
        forward-op-group-sizes (mapv count canonical-forward-outliner-op-groups)
        built-inverse-outliner-ops (some-> (build-strict-inverse-outliner-ops db-before
                                                                            db-after
                                                                            tx-data
                                                                            forward-outliner-ops
                                                                            forward-op-group-sizes)
                                           seq
                                           vec
                                           (->> (mapv #(normalize-op-entry-ids db-before %))))
        _ (assert-no-stale-numeric-ids! db-before built-inverse-outliner-ops :built-inverse-outliner-ops)
        explicit-inverse-outliner-ops (some-> (canonicalize-explicit-outliner-ops db-after tx-data (:db-sync/inverse-outliner-ops tx-meta))
                                              (patch-inverse-delete-block-ops forward-outliner-ops)
                                              seq
                                              vec
                                              (->> (mapv #(normalize-op-entry-ids db-after %))))
        _ (assert-no-stale-numeric-ids! db-after explicit-inverse-outliner-ops :explicit-inverse-outliner-ops)
        inverse-outliner-ops (cond
                               (and (= :apply-template (:outliner-op tx-meta))
                                    (:undo? tx-meta)
                                    (seq (:db-sync/inverse-outliner-ops tx-meta)))
                               explicit-inverse-outliner-ops

                               (has-replace-empty-target-insert-op? forward-outliner-ops)
                               built-inverse-outliner-ops

                               (seq built-inverse-outliner-ops)
                               built-inverse-outliner-ops

                               (nil? explicit-inverse-outliner-ops)
                               nil

                               :else
                               explicit-inverse-outliner-ops)
        inverse-outliner-ops (some-> inverse-outliner-ops
                                     seq
                                     vec
                                     (->> (mapv #(normalize-op-entry-ids db-before %))))
        _ (assert-no-stale-numeric-ids! db-before inverse-outliner-ops :inverse-outliner-ops)]
    {:forward-outliner-ops forward-outliner-ops
     :inverse-outliner-ops inverse-outliner-ops}))
