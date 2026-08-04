(ns frontend.worker.handler.block-breadcrumb
  "Canonical breadcrumb payloads shared by block loads and search results."
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]))

(def ^:private load-depth 16)

(defn- fail!
  [message data]
  (throw (ex-info message data)))

(defn shallow-ref-identity
  [db ref-or-id]
  (let [ref (if (or (de/entity? ref-or-id) (map? ref-or-id))
              ref-or-id
              (d/entity db ref-or-id))
        ref-id (:db/id ref)
        ref-uuid (:block/uuid ref)
        ref-ident (:db/ident ref)
        ref-title (:block/title ref)
        ref-name (:block/name ref)
        ref-tags (mapv (fn [tag]
                         (select-keys tag [:db/id :block/uuid :db/ident]))
                       (:block/tags ref))
        choice-exclusions
        (mapv (fn [choice]
                (select-keys choice [:db/id :block/uuid :db/ident]))
              (:logseq.property/choice-exclusions ref))
        property-value (:logseq.property/value ref)
        property-icon (:logseq.property/icon ref)
        hide-from-node (:logseq.property.class/hide-from-node ref)
        property-value-title (when (or (:block/closed-value-property ref)
                                       (:logseq.property/created-from-property ref))
                               (:block/title ref))]
    (when-not ref
      (fail! "Missing canonical block reference" {:ref-id ref-id}))
    (when (and (some? ref-uuid) (not (uuid? ref-uuid)))
      (fail! "Invalid canonical block reference UUID"
             {:ref-id ref-id :block-uuid ref-uuid}))
    (when (and (some? ref-ident) (not (keyword? ref-ident)))
      (fail! "Invalid canonical block reference ident"
             {:ref-id ref-id :db-ident ref-ident}))
    (cond-> {:db/id ref-id}
      ref-uuid (assoc :block/uuid ref-uuid)
      ref-ident (assoc :db/ident ref-ident)
      (string? ref-title) (assoc :block/title ref-title)
      (string? ref-name) (assoc :block/name ref-name)
      (seq ref-tags) (assoc :block/tags ref-tags)
      (seq choice-exclusions)
      (assoc :logseq.property/choice-exclusions choice-exclusions)
      (some? property-value) (assoc :logseq.property/value property-value)
      (some? property-icon) (assoc :logseq.property/icon property-icon)
      (some? hide-from-node) (assoc :logseq.property.class/hide-from-node hide-from-node)
      (some? property-value-title) (assoc :block/title property-value-title))))

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
  [db block]
  (let [parents (vec (ldb/get-block-parents
                      db (:block/uuid block) {:depth load-depth}))
        page (:block/page block)
        breadcrumb-ancestors (if (and page
                                      (not= (:db/id page) (:db/id (first parents))))
                               (into [page] parents)
                               parents)]
    (cond-> (mapv #(breadcrumb-entity db %) breadcrumb-ancestors)
      (:logseq.property/created-from-property block)
      (conj (breadcrumb-entity db
                               (:logseq.property/created-from-property block))))))
