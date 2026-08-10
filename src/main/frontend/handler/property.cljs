(ns frontend.handler.property
  "Property fns"
  (:require [frontend.db.async :as db-async]
            [frontend.handler.db-based.property :as db-property-handler]
            [promesa.core :as p]))

(defn remove-block-property!
  [block-id property-id-or-key & [opts]]
  (assert (some? property-id-or-key) "remove-block-property! remove-block-property! is nil")
  (if (= :logseq.property/status property-id-or-key)
    (db-property-handler/batch-set-property! [block-id] property-id-or-key nil (or opts {}))
    (db-property-handler/remove-block-property! block-id property-id-or-key)))

(defn set-block-property!
  [block-id key v]
  (assert (some? key) "set-block-property! key is nil")
  (if (or (nil? v) (and (coll? v) (empty? v)))
    (remove-block-property! block-id key)
    (db-property-handler/set-block-property! block-id key v)))

(defn batch-remove-block-property!
  [block-ids key & [opts]]
  (assert (some? key) "key is nil")
  (if (= :logseq.property/status key)
    (db-property-handler/batch-set-property! block-ids key nil (or opts {}))
    (db-property-handler/batch-remove-property! block-ids key)))

(defn batch-set-block-property!
  [block-ids key value & {:as opts}]
  (assert (some? key) "key is nil")
  (if (nil? value)
    (batch-remove-block-property! block-ids key opts)
    (db-property-handler/batch-set-property! block-ids key value opts)))

(defn set-block-properties!
  [block-id properties]
  (assert (uuid? block-id))
  (db-property-handler/set-block-properties! block-id properties))

(defonce class-property-excludes
  #{:logseq.property.class/properties :block/tags
    :logseq.property/icon :block/alias :logseq.property/enable-history?
    :logseq.property/exclude-from-graph-view :logseq.property/template-applied-to
    :logseq.property/hide-empty-value :logseq.property.class/hide-from-node
    :logseq.property/page-tags :logseq.property.class/extends
    :logseq.property.class/bidirectional-property-title
    :logseq.property.class/enable-bidirectional?
    :logseq.property/publishing-public? :logseq.property.user/avatar
    :logseq.property.user/email :logseq.property.user/name})

(defn get-class-property-choices
  []
  (p/let [properties (db-async/<get-all-properties :remove-ui-non-suitable-properties? true)]
    (remove (fn [property]
              (contains? class-property-excludes (:db/ident property)))
            properties)))
