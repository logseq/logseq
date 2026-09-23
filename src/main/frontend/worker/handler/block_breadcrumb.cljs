(ns frontend.worker.handler.block-breadcrumb
  "Canonical breadcrumb payloads shared by block loads and search results."
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]))

(def ^:private load-depth 16)

(def ^:dynamic *ref-identity-cache* nil)

(defn- fail!
  [message data]
  (throw (ex-info message data)))

(defn- eavt-scalar
  [db eid attr]
  (when-let [datom (first (d/datoms db :eavt eid attr))]
    (:v datom)))

(defn- lookup-eid
  [eid]
  (when (integer? eid) eid))

(defn- resolve-ref-id
  "Search breadcrumbs pass page/parent as uuid, ident, or a pulled map
  that may omit :db/id. Raw (d/entity db uuid) is not a Datascript lookup."
  [db ref-or-id]
  (cond
    (integer? ref-or-id)
    ref-or-id

    (uuid? ref-or-id)
    (lookup-eid (:db/id (d/entity db [:block/uuid ref-or-id])))

    (keyword? ref-or-id)
    (lookup-eid (:db/id (d/entity db ref-or-id)))

    (or (de/entity? ref-or-id) (map? ref-or-id))
    (or (lookup-eid (:db/id ref-or-id))
        (when (uuid? (:block/uuid ref-or-id))
          (lookup-eid (:db/id (d/entity db [:block/uuid (:block/uuid ref-or-id)]))))
        (when (keyword? (:db/ident ref-or-id))
          (lookup-eid (:db/id (d/entity db (:db/ident ref-or-id))))))

    :else
    (lookup-eid (:db/id (d/entity db ref-or-id)))))

(defn- tag-summary
  [db tag-id]
  (let [tag-uuid (eavt-scalar db tag-id :block/uuid)
        tag-ident (eavt-scalar db tag-id :db/ident)]
    (cond-> {:db/id tag-id}
      (uuid? tag-uuid) (assoc :block/uuid tag-uuid)
      (keyword? tag-ident) (assoc :db/ident tag-ident))))

(defn- choice-summary
  [db choice-id]
  (let [choice-uuid (eavt-scalar db choice-id :block/uuid)
        choice-ident (eavt-scalar db choice-id :db/ident)]
    (cond-> {:db/id choice-id}
      (uuid? choice-uuid) (assoc :block/uuid choice-uuid)
      (keyword? choice-ident) (assoc :db/ident choice-ident))))

(def ^:private many-identity-attrs
  #{:block/tags :logseq.property/choice-exclusions})

(def ^:private scalar-identity-attrs
  #{:block/uuid :block/title :block/name :db/ident
    :logseq.property/type :db/cardinality :logseq.property/value
    :logseq.property.node/display-type :logseq.property.code/lang
    :logseq.property/icon :logseq.property.class/hide-from-node
    :logseq.property.asset/type :logseq.property.asset/width
    :logseq.property.asset/height :logseq.property.asset/resize-metadata
    :logseq.property.asset/external-url
    :block/closed-value-property :logseq.property/created-from-property})

(defn- scan-ref-attrs
  "One eavt range per ref. Point lookups per attr doubled Movies first
  paint: each actor did uuid/title/name/ident/tags/extras separately."
  [db ref-id]
  (reduce
   (fn [collected {:keys [a v]}]
     (cond
       (contains? many-identity-attrs a)
       (update collected a (fnil conj []) v)

       (contains? scalar-identity-attrs a)
       (assoc collected a v)

       :else
       collected))
   {:db/id ref-id}
   (d/datoms db :eavt ref-id)))

(defn- page-ref-identity?
  [collected]
  (and (string? (:block/name collected))
       (not (keyword? (:db/ident collected)))
       (nil? (:logseq.property.asset/type collected))))

(defn- property-or-asset-extras
  [db collected]
  (let [ref-title (when (string? (:block/title collected))
                    (:block/title collected))
        choice-exclusions
        (mapv #(choice-summary db %)
              (:logseq.property/choice-exclusions collected))
        property-type (:logseq.property/type collected)
        cardinality (:db/cardinality collected)
        property-value (:logseq.property/value collected)
        property-icon (:logseq.property/icon collected)
        hide-from-node (:logseq.property.class/hide-from-node collected)
        asset-type (:logseq.property.asset/type collected)
        asset-width (:logseq.property.asset/width collected)
        asset-height (:logseq.property.asset/height collected)
        asset-resize-metadata (:logseq.property.asset/resize-metadata collected)
        asset-external-url (let [value (:logseq.property.asset/external-url collected)]
                             (cond
                               (string? value) value
                               (integer? value)
                               (db-property/asset-external-url (d/entity db value))
                               :else
                               (db-property/scalar-property-value value)))
        closed-value? (some? (:block/closed-value-property collected))
        created-from-property? (some? (:logseq.property/created-from-property collected))
        property-value-title (when (and ref-title (or closed-value? created-from-property?))
                               ref-title)]
    (cond-> (select-keys collected [:logseq.property.node/display-type :logseq.property.code/lang])
      (seq choice-exclusions)
      (assoc :logseq.property/choice-exclusions choice-exclusions)
      (some? property-type) (assoc :logseq.property/type property-type)
      (some? cardinality) (assoc :db/cardinality cardinality)
      (some? property-value) (assoc :logseq.property/value property-value)
      (some? property-icon) (assoc :logseq.property/icon property-icon)
      (some? hide-from-node) (assoc :logseq.property.class/hide-from-node hide-from-node)
      (some? asset-type) (assoc :logseq.property.asset/type asset-type)
      (some? asset-width) (assoc :logseq.property.asset/width asset-width)
      (some? asset-height) (assoc :logseq.property.asset/height asset-height)
      (some? asset-resize-metadata)
      (assoc :logseq.property.asset/resize-metadata asset-resize-metadata)
      (some? asset-external-url)
      (assoc :logseq.property.asset/external-url asset-external-url)
      (some? property-value-title) (assoc :block/title property-value-title))))

(defn- compute-shallow-ref-identity
  [db ref-id]
  (when-not ref-id
    (fail! "Missing canonical block reference" {:ref-id ref-id}))
  (let [collected (scan-ref-attrs db ref-id)
        ref-uuid (:block/uuid collected)
        ref-ident (:db/ident collected)
        ref-title (when (string? (:block/title collected))
                    (:block/title collected))
        ref-name (when (string? (:block/name collected))
                   (:block/name collected))
        tag-ids (:block/tags collected)
        tags (when (seq tag-ids)
               (mapv #(tag-summary db %) tag-ids))]
    (when (and (some? ref-uuid) (not (uuid? ref-uuid)))
      (fail! "Invalid canonical block reference UUID"
             {:ref-id ref-id :block-uuid ref-uuid}))
    (when (and (some? ref-ident) (not (keyword? ref-ident)))
      (fail! "Invalid canonical block reference ident"
             {:ref-id ref-id :db-ident ref-ident}))
    (cond-> {:db/id ref-id}
      ref-uuid (assoc :block/uuid ref-uuid)
      (keyword? ref-ident) (assoc :db/ident ref-ident)
      (string? ref-title) (assoc :block/title ref-title)
      (string? ref-name) (assoc :block/name ref-name)
      (seq tags) (assoc :block/tags tags)
      (not (page-ref-identity? collected))
      (merge (property-or-asset-extras db collected)))))

(defn shallow-ref-identity
  [db ref-or-id]
  (let [ref-id (resolve-ref-id db ref-or-id)
        cache *ref-identity-cache*]
    (if-let [hit (and cache (get @cache ref-id))]
      hit
      (let [identity (compute-shallow-ref-identity db ref-id)]
        (when cache
          (vswap! cache assoc ref-id identity))
        identity))))

(defn- breadcrumb-entity
  [db entity]
  (cond-> (shallow-ref-identity db entity)
    (string? (:block/raw-title entity))
    (assoc :block/raw-title (:block/raw-title entity))

    (:logseq.property.node/display-type entity)
    (assoc :logseq.property.node/display-type
           (:logseq.property.node/display-type entity))

    (seq (:block/refs entity))
    (assoc :block/refs
           (mapv #(shallow-ref-identity db %)
                 (:block/refs entity)))))

(defn block-breadcrumb
  ([db block]
   (block-breadcrumb db block load-depth))
  ([db block depth]
   (when-not (and (integer? depth) (pos? depth))
     (fail! "Invalid breadcrumb load depth" {:load-depth depth}))
   (let [parents (vec (ldb/get-block-parents
                        db (:block/uuid block) {:depth depth}))
         page (:block/page block)
         page-id (resolve-ref-id db page)
         ;; get-block-parents is root-first and already includes nested pages.
         ;; Only prepend :block/page when depth truncated it out of that walk;
         ;; comparing only the first ancestor put the leaf page first.
         breadcrumb-ancestors (if (and page-id
                                         (not (some #(= page-id (:db/id %)) parents)))
                                 (into [page] parents)
                                 parents)]
     (cond-> (mapv #(breadcrumb-entity db %) breadcrumb-ancestors)
       (:logseq.property/created-from-property block)
       (conj (breadcrumb-entity db
                                 (:logseq.property/created-from-property block)))))))
