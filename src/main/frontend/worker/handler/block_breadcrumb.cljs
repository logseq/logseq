(ns frontend.worker.handler.block-breadcrumb
  "Canonical breadcrumb payloads shared by block loads and search results."
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]))

(def ^:private load-depth 16)

(def ^:dynamic *ref-identity-cache* nil)

(defn- fail!
  [message data]
  (throw (ex-info message data)))

(defn- eavt-scalar
  [db eid attr]
  (when-let [datom (first (d/datoms db :eavt eid attr))]
    (:v datom)))

(defn- eavt-values
  [db eid attr]
  (mapv :v (d/datoms db :eavt eid attr)))

(defn- resolve-ref-id
  [db ref-or-id]
  (cond
    (integer? ref-or-id) ref-or-id
    (or (de/entity? ref-or-id) (map? ref-or-id)) (:db/id ref-or-id)
    :else (:db/id (d/entity db ref-or-id))))

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

(defn- ref-extras
  "Read renderer identity extras from eavt. Page refs need tags; property,
  class, and asset refs also need type/icon/closed-value fields. Entity
  ILookup of those attrs walks inbound refs and is multi-second on Movies."
  [db ref-id]
  (let [ref-title (let [title (eavt-scalar db ref-id :block/title)]
                    (when (string? title) title))
        ref-tags (mapv #(tag-summary db %) (eavt-values db ref-id :block/tags))
        choice-exclusions
        (mapv #(choice-summary db %)
              (eavt-values db ref-id :logseq.property/choice-exclusions))
        property-type (eavt-scalar db ref-id :logseq.property/type)
        cardinality (eavt-scalar db ref-id :db/cardinality)
        property-value (eavt-scalar db ref-id :logseq.property/value)
        property-icon (eavt-scalar db ref-id :logseq.property/icon)
        hide-from-node (eavt-scalar db ref-id :logseq.property.class/hide-from-node)
        asset-type (eavt-scalar db ref-id :logseq.property.asset/type)
        asset-width (eavt-scalar db ref-id :logseq.property.asset/width)
        asset-height (eavt-scalar db ref-id :logseq.property.asset/height)
        asset-resize-metadata (eavt-scalar db ref-id :logseq.property.asset/resize-metadata)
        asset-external-url (eavt-scalar db ref-id :logseq.property.asset/external-url)
        closed-value? (some? (eavt-scalar db ref-id :block/closed-value-property))
        created-from-property? (some? (eavt-scalar db ref-id :logseq.property/created-from-property))
        property-value-title (when (and ref-title (or closed-value? created-from-property?))
                               ref-title)]
    (cond-> {}
      (seq ref-tags) (assoc :block/tags ref-tags)
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
  (let [ref-uuid (eavt-scalar db ref-id :block/uuid)
        ref-ident (eavt-scalar db ref-id :db/ident)
        ref-title (let [title (eavt-scalar db ref-id :block/title)]
                    (when (string? title) title))
        ref-name (let [page-name (eavt-scalar db ref-id :block/name)]
                   (when (string? page-name) page-name))]
    (when (and (some? ref-uuid) (not (uuid? ref-uuid)))
      (fail! "Invalid canonical block reference UUID"
             {:ref-id ref-id :block-uuid ref-uuid}))
    (when (and (some? ref-ident) (not (keyword? ref-ident)))
      (fail! "Invalid canonical block reference ident"
             {:ref-id ref-id :db-ident ref-ident}))
    (cond-> (merge {:db/id ref-id} (ref-extras db ref-id))
      ref-uuid (assoc :block/uuid ref-uuid)
      (keyword? ref-ident) (assoc :db/ident ref-ident)
      (string? ref-title) (assoc :block/title ref-title)
      (string? ref-name) (assoc :block/name ref-name))))

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
         breadcrumb-ancestors (if (and page
                                         (not= (:db/id page) (:db/id (first parents))))
                                 (into [page] parents)
                                 parents)]
     (cond-> (mapv #(breadcrumb-entity db %) breadcrumb-ancestors)
       (:logseq.property/created-from-property block)
       (conj (breadcrumb-entity db
                                 (:logseq.property/created-from-property block)))))))
