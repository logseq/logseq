(ns frontend.worker.handler.comments
  "Comments operations for the db worker."
  (:require [datascript.core :as d]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.state :as worker-state]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]))

(def ^:private comments-tag-ident :logseq.class/Comments)
(def ^:private comments-blocks-property :logseq.property.comments/blocks)

(def ^:private block-selector
  '[:db/id
    :block/uuid
    :block/title
    :block/name
    :block/order
    :block/created-at
    :block/updated-at
    :logseq.property/deleted-at
    {:block/tags [:db/id :db/ident :block/title]}
    {:block/parent [:db/id :block/uuid :block/title {:block/tags [:db/ident]}]}
    {:block/page [:db/id :block/uuid :block/title :block/name {:block/tags [:db/ident]}]}
    {:logseq.property.comments/blocks [:db/id :block/uuid :block/title :logseq.property/deleted-at]}])

(defn- block-ref-entity
  [db block-ref]
  (cond
    (uuid? block-ref)
    (d/entity db [:block/uuid block-ref])

    (and (string? block-ref) (common-util/uuid-string? block-ref))
    (d/entity db [:block/uuid (uuid block-ref)])

    :else
    (d/entity db block-ref)))

(defn- block-map
  [db block]
  (when block
    (d/pull db block-selector (:db/id block))))

(defn- block-map-with-children
  [db block]
  (when-let [block' (block-map db block)]
    (assoc block'
           :block/children
           (mapv #(block-map db %) (ldb/get-children db (:db/id block))))))

(defn- tagged-with?
  [block tag-ident]
  (boolean
   (some (fn [tag]
           (= tag-ident
              (if (keyword? tag)
                tag
                (:db/ident tag))))
         (:block/tags block))))

(defn- comments-area?
  [block]
  (tagged-with? block comments-tag-ident))

(defn- comment-block?
  [block]
  (or (tagged-with? block :logseq.class/Comment)
      (comments-area? (:block/parent block))))

(defn- comment-target-block?
  [block]
  (not (or (comments-area? block)
           (comment-block? block))))

(defn- block-lookup-ref
  [block]
  [:block/uuid (:block/uuid block)])

(defn- single-comment-targets
  [block]
  #{(block-lookup-ref block)})

(defn- comments-area-child
  [db block]
  (some (fn [child]
          (when (comments-area? child)
            child))
        (ldb/sort-by-order (ldb/get-children db (:db/id block)))))

(defn- comments-area-title
  [block]
  (if (entity-util/page? block)
    "Comments on this page"
    "Comments"))

(defn- comments-area-insert-position
  [block]
  (if (entity-util/page? block)
    {:start? true}
    {:end? true}))

(defn- block-ref-uuid
  [block-ref]
  (cond
    (map? block-ref) (:block/uuid block-ref)
    (uuid? block-ref) block-ref
    (and (string? block-ref) (common-util/uuid-string? block-ref)) (uuid block-ref)
    :else nil))

(defn- comment-thread-target-blocks
  [comments-area]
  (->> (get comments-area comments-blocks-property)
       (remove :logseq.property/deleted-at)
       vec))

(defn- same-comment-targets?
  [comments-area target-uuids]
  (= target-uuids
     (->> (comment-thread-target-blocks comments-area)
          (keep block-ref-uuid)
          set)))

(defn- existing-comments-area-for-targets
  [blocks]
  (let [target-uuids (set (keep :block/uuid blocks))]
    (some (fn [comments-area]
            (when (same-comment-targets? comments-area target-uuids)
              comments-area))
          (get (first blocks) :logseq.property.comments/_blocks))))

(defn get-comments-area-block
  [db block-ref]
  (some->> (block-ref-entity db block-ref)
           (block-map db)))

(defn resolve-comments-area
  [db block-ref]
  (when-let [block (block-ref-entity db block-ref)]
    (if-let [comments-area (comments-area-child db block)]
      (cond-> {:action :existing
               :comments-area (block-map db comments-area)}
        (not (seq (get comments-area comments-blocks-property)))
        (assoc :target-property {:block-id (:db/id comments-area)
                                 :property comments-blocks-property
                                 :value (single-comment-targets block)}))
      {:action :insert
       :title (comments-area-title block)
       :opts (merge {:block-uuid (:block/uuid block)
                     :edit-block? false
                     :other-attrs {:block/tags #{comments-tag-ident}
                                   comments-blocks-property (single-comment-targets block)}}
                    (comments-area-insert-position block))})))

(defn resolve-comments-area-for-blocks
  [db block-refs]
  (let [blocks (->> block-refs
                    (keep #(block-ref-entity db %))
                    (filter comment-target-block?)
                    vec)]
    (when-let [last-block (last blocks)]
      (if (= 1 (count blocks))
        {:action :single
         :block-ref (:block/uuid last-block)}
        (if-let [comments-area (existing-comments-area-for-targets blocks)]
          {:action :existing
           :comments-area (block-map db comments-area)}
          {:action :insert
           :title "Comments"
           :opts {:block-uuid (:block/uuid last-block)
                  :sibling? true
                  :edit-block? false
                  :other-attrs {:block/tags #{comments-tag-ident}
                                comments-blocks-property (set (map block-lookup-ref blocks))}}})))))

(defn get-comment-delete-targets
  [db comment-block-ref]
  (when-let [comment-block (block-ref-entity db comment-block-ref)]
    (let [comments-area (:block/parent comment-block)
          live-children (remove :logseq.property/deleted-at
                                (ldb/get-children db (:db/id comments-area)))]
      (if (and (comments-area? comments-area)
               (<= (count live-children) 1))
        [(block-map-with-children db comments-area)]
        [(block-map db comment-block)]))))

(defn get-comment-threads-for-block
  [db block-uuid]
  (let [thread-ids (d/q '[:find [?comments-area ...]
                          :in $ ?block-uuid
                          :where
                          [?block :block/uuid ?block-uuid]
                          [?comments-area :logseq.property.comments/blocks ?block]
                          [?comments-area :block/tags :logseq.class/Comments]
                          [(missing? $ ?comments-area :logseq.property/deleted-at)]]
                        db
                        block-uuid)]
    (mapv #(block-map-with-children db (d/entity db %)) thread-ids)))

(defn get-comment-thread-block-uuids
  [db block-uuids]
  (let [id->uuid (into {}
                       (keep (fn [block-uuid]
                               (let [block-uuid (cond
                                                  (uuid? block-uuid) block-uuid
                                                  (and (string? block-uuid)
                                                       (common-util/uuid-string? block-uuid))
                                                  (uuid block-uuid))]
                                 (when-let [block-id (when block-uuid
                                                      (d/entid db [:block/uuid block-uuid]))]
                                   [block-id block-uuid]))))
                       block-uuids)]
    (when (seq id->uuid)
      (->> (d/datoms db :aevt :logseq.property.comments/blocks)
           (keep (fn [{comments-area-id :e block-id :v}]
                   (when-let [block-uuid (get id->uuid block-id)]
                     (let [comments-area (d/entity db comments-area-id)]
                       (when (and (some #(= :logseq.class/Comments (:db/ident %))
                                        (:block/tags comments-area))
                                  (not= block-id (:db/id (:block/parent comments-area)))
                                  (nil? (:logseq.property/deleted-at comments-area)))
                         (str block-uuid))))))
           vec))))

(def-thread-api :thread-api/get-comments-area-block
  [repo block-ref]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-comments-area-block @conn block-ref)))

(def-thread-api :thread-api/resolve-comments-area
  [repo block-ref]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (resolve-comments-area @conn block-ref)))

(def-thread-api :thread-api/resolve-comments-area-for-blocks
  [repo block-refs]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (resolve-comments-area-for-blocks @conn block-refs)))

(def-thread-api :thread-api/get-comment-delete-targets
  [repo comment-block-ref]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-comment-delete-targets @conn comment-block-ref)))

(def-thread-api :thread-api/get-comment-threads-for-block
  [repo block-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-comment-threads-for-block @conn block-uuid)))

(def-thread-api :thread-api/get-comment-thread-block-uuids
  [repo block-uuids]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-comment-thread-block-uuids @conn block-uuids)))
