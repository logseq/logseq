(ns frontend.handler.property
  "Property fns"
  (:require [frontend.db.model :as db-model]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.state :as state]))

(defn remove-block-property!
  [block-id property-id-or-key]
  (assert (some? property-id-or-key) "remove-block-property! remove-block-property! is nil")
  (let [eid (if (uuid? block-id) [:block/uuid block-id] block-id)]
    (db-property-handler/remove-block-property! eid property-id-or-key)))

(defn set-block-property!
  [block-id key v]
  (assert (some? key) "set-block-property! key is nil")
  (let [eid (if (uuid? block-id) [:block/uuid block-id] block-id)]
    (if (or (nil? v) (and (coll? v) (empty? v)))
      (db-property-handler/remove-block-property! eid key)
      (db-property-handler/set-block-property! eid key v))))

(defn batch-remove-block-property!
  [block-ids key]
  (assert (some? key) "key is nil")
  (db-property-handler/batch-remove-property! block-ids key))

(defn batch-set-block-property!
  [block-ids key value & {:as opts}]
  (assert (some? key) "key is nil")
  (if (nil? value)
    (db-property-handler/batch-remove-property! block-ids key)
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
    :logseq.property.class/default-icon-type
    :logseq.property/publishing-public? :logseq.property.user/avatar
    :logseq.property.user/email :logseq.property.user/name})

(defn get-class-property-choices
  []
  (->>
   (db-model/get-all-properties (state/get-current-repo)
                                {:remove-ui-non-suitable-properties? true})
   (remove (fn [p]
             (contains? class-property-excludes (:db/ident p))))))
