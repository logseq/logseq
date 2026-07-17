(ns frontend.handler.comments
  "Handles creation, editing, deletion, and focus behavior for block comment threads."
  (:require [logseq.melange.bridge.common.api :as melange-common]
            [clojure.string :as string]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.handler.block :as block-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.melange.bridge.db.core :as ldb]
            [promesa.core :as p]))

(defn- block-ref->entity
  [block-ref]
  (cond
    (map? block-ref)
    block-ref

    (uuid? block-ref)
    (db/entity [:block/uuid block-ref])

    (and (string? block-ref) (melange-common/uuid-string? block-ref))
    (db/entity [:block/uuid (uuid block-ref)])

    (number? block-ref)
    (db/entity block-ref)

    :else
    nil))

(defn- comments-area-child
  [block]
  (some (fn [child]
          (when (comments-model/comments-area? child)
            child))
        (db/sort-by-order (:block/_parent block))))

(defn- block-ref-uuid
  [block-ref]
  (cond
    (map? block-ref) (:block/uuid block-ref)
    (uuid? block-ref) block-ref
    (and (string? block-ref) (melange-common/uuid-string? block-ref)) (uuid block-ref)
    :else nil))

(defn- block-lookup-ref
  [block]
  [:block/uuid (:block/uuid block)])

(def ^:private comment-thread-pull-selector
  '[:db/id
    :block/uuid
    :block/title
    :block/order
    :block/created-at
    :block/updated-at
    :logseq.property/deleted-at
    {:block/tags [:db/id :db/ident]}
    {:block/parent [:db/id :block/uuid]}
    {:logseq.property.comments/blocks [:db/id :block/uuid :block/title :logseq.property/deleted-at]}])

(defn <get-comment-threads-for-block
  [block-uuid]
  (when-let [repo (and block-uuid (state/get-current-repo))]
    (p/let [threads (db-async/<q repo
                                 {:transact-db? true}
                                 '[:find [(pull ?comments-area ?selector) ...]
                                   :in $ ?block-uuid ?selector
                                   :where
                                   [?block :block/uuid ?block-uuid]
                                   [?comments-area :logseq.property.comments/blocks ?block]
                                   [?comments-area :block/tags :logseq.class/Comments]
                                   [(missing? $ ?comments-area :logseq.property/deleted-at)]]
                                 block-uuid
                                 comment-thread-pull-selector)
            _ (p/all
               (mapv (fn [thread]
                       (db-async/<get-block repo
                                            (:block/uuid thread)
                                            {:children? true
                                             :include-collapsed-children? true
                                             :skip-refresh? true}))
                     threads))]
      (->> threads
           (keep (fn [thread]
                   (db/entity [:block/uuid (:block/uuid thread)])))
           vec))))

(defn <get-comment-thread-block-uuids
  ([block-uuids]
   (<get-comment-thread-block-uuids (state/get-current-repo) block-uuids))
  ([repo block-uuids]
   (let [block-uuids (->> block-uuids
                          (keep (fn [block-uuid]
                                  (cond
                                    (uuid? block-uuid)
                                    block-uuid

                                    (and (string? block-uuid) (melange-common/uuid-string? block-uuid))
                                    (uuid block-uuid)

                                    :else
                                    nil)))
                          vec)]
     (when (and repo (seq block-uuids))
       (p/let [result (db-async/<q repo
                                   {:transact-db? false}
                                   '[:find [?block-uuid ...]
                                     :in $ [?block-uuid ...]
                                     :where
                                     [?block :block/uuid ?block-uuid]
                                     [?comments-area :logseq.property.comments/blocks ?block]
                                     [?comments-area :block/tags :logseq.class/Comments]
                                     [?comments-area :block/parent ?comments-area-parent]
                                     [(not= ?comments-area-parent ?block)]
                                     [(missing? $ ?comments-area :logseq.property/deleted-at)]]
                                   block-uuids)]
         (mapv str result))))))

(defn- single-comment-targets
  [block]
  #{(block-lookup-ref block)})

(defn- comments-area-entity
  [comments-area]
  (when-let [uuid (:block/uuid comments-area)]
    (db/entity [:block/uuid uuid])))

(defn- ensure-single-comment-target-property!
  [comments-area block]
  (when (and comments-area block (not (seq (get comments-area comments-model/comments-blocks-property))))
    (db-property-handler/set-block-property! (:db/id comments-area)
                                             comments-model/comments-blocks-property
                                             (single-comment-targets block))))

(defn- comments-area-title
  [block]
  (if (ldb/page? block)
    "Comments on this page"
    "Comments"))

(defn- comments-area-insert-position
  [block]
  (if (ldb/page? block)
    {:start? true}
    {:end? true}))

(defn ensure-comments-area!
  [block-id]
  (when-let [block (db/entity [:block/uuid block-id])]
    (if-let [comments-area (comments-area-child block)]
      (p/let [_ (ensure-single-comment-target-property! comments-area block)]
        comments-area)
      (editor-handler/api-insert-new-block!
       (comments-area-title block)
       (merge {:block-uuid block-id
               :edit-block? false
               :other-attrs {:block/tags #{comments-model/comments-tag-ident}
                             comments-model/comments-blocks-property (single-comment-targets block)}}
              (comments-area-insert-position block))))))

(defn- same-comment-targets?
  [comments-area target-uuids]
  (= target-uuids
     (->> (comments-model/comment-thread-target-blocks comments-area)
          (keep block-ref-uuid)
          set)))

(defn- existing-comments-area-for-targets
  [blocks]
  (let [target-uuids (set (keep :block/uuid blocks))]
    (some (fn [comments-area]
            (when (same-comment-targets? comments-area target-uuids)
              comments-area))
          (comments-model/comment-threads-for-block (first blocks)))))

(defn ensure-comments-area-for-selected-blocks!
  [block-refs]
  (let [blocks (->> block-refs
                    (keep block-ref->entity)
                    block-handler/get-top-level-blocks
                    comments-model/comment-target-blocks)]
    (when-let [last-block (last blocks)]
      (if (= 1 (count blocks))
        (p/let [comments-area (ensure-comments-area! (:block/uuid last-block))]
          (when comments-area
            (editor-handler/expand-block! (:block/uuid comments-area)))
          comments-area)
        (if-let [comments-area (existing-comments-area-for-targets blocks)]
          (p/do!
           (editor-handler/expand-block! (:block/uuid comments-area))
           comments-area)
          (p/let [comments-area (editor-handler/api-insert-new-block!
                                 "Comments"
                                 {:block-uuid (:block/uuid last-block)
                                  :sibling? true
                                  :edit-block? false
                                  :other-attrs {:block/tags #{comments-model/comments-tag-ident}
                                                comments-model/comments-blocks-property (set (map block-lookup-ref blocks))}})]
            (when comments-area
              (editor-handler/expand-block! (:block/uuid comments-area)))
            comments-area))))))

(defn- focus-comments-reply!
  [comments-area-el]
  (when comments-area-el
    (if-let [input (.querySelector comments-area-el ".ls-comment-add textarea, .ls-comment-box textarea, .ls-comment-box input, .ls-comment-box [contenteditable='true']")]
      (.focus input)
      (some-> comments-area-el
              (.querySelector ".ls-comment-reply-placeholder")
              (.click)))))

(defn reveal-comments-area!
  ([comments-area]
   (reveal-comments-area! comments-area nil))
  ([comments-area {:keys [focus-editor?]}]
   (when-let [uuid (:block/uuid (comments-area-entity comments-area))]
     (p/do!
      (editor-handler/expand-block! uuid)
      (js/requestAnimationFrame
       #(when-let [comments-area-el (gdom/getElement (str "ls-block-" uuid))]
          (.scrollIntoView comments-area-el #js {:block "nearest"
                                                 :behavior "smooth"})
          (when focus-editor?
            (js/setTimeout
             (fn []
               (some-> (gdom/getElement (str "ls-block-" uuid))
                       (focus-comments-reply!)))
             0))))))))

(defn expand-comments-area!
  [comments-area]
  (when-let [uuid (:block/uuid (comments-area-entity comments-area))]
    (editor-handler/expand-block! uuid)))

(defn edit-comments-area-title!
  [comments-area container-id]
  (when-let [block (comments-area-entity comments-area)]
    (editor-handler/edit-block! block :max {:container-id (or container-id :unknown-container)})))

(defn- selected-block-entities
  []
  (vec (keep #(db/entity [:block/uuid %]) (state/get-selection-block-ids))))

(defn- edit-block-entity
  []
  (when-let [block (state/get-edit-block)]
    (db/entity [:block/uuid (:block/uuid block)])))

(defn- comment-shortcut-targets
  []
  (or (when (state/editing?)
        (some-> (edit-block-entity) vector seq))
      (seq (selected-block-entities))))

(defn- current-edit-block-blank?
  []
  (when-let [block (state/get-edit-block)]
    (string/blank? (or (state/get-edit-content)
                       (:block/title block)
                       ""))))

(defn- set-current-block-as-comments-area!
  []
  (when-let [block (state/get-edit-block)]
    (editor-handler/save-current-block!)
    (p/let [_ (db-property-handler/set-block-property! (:db/id block)
                                                       :block/tags
                                                       comments-model/comments-tag-ident)]
      (state/clear-edit!)
      (reveal-comments-area! block {:focus-editor? true})
      block)))

(defn add-comment-to-blocks!
  [blocks]
  (when-let [comment-targets (seq (comments-model/comment-target-blocks blocks))]
    (p/let [comments-area (ensure-comments-area-for-selected-blocks! comment-targets)]
      (when comments-area
        (reveal-comments-area! comments-area {:focus-editor? true}))
      (state/clear-selection!)
      (state/pub-event! [:editor/hide-action-bar]))))

(defn add-comment-to-current-context!
  [& _]
  (if (and (state/editing?)
           (current-edit-block-blank?))
    (set-current-block-as-comments-area!)
    (let [comment-targets (comment-shortcut-targets)]
      (when (state/editing?)
        (editor-handler/save-current-block!)
        (state/clear-edit!))
      (add-comment-to-blocks! comment-targets))))

(defn insert-comment!
  [comments-block content]
  (editor-handler/api-insert-new-block!
   content
   {:block-uuid (:block/uuid comments-block)
    :end? true
    :edit-block? false
    :other-attrs {:block/tags #{comments-model/comment-tag-ident}}}))

(defn create-sibling-block-after-comments!
  [comments-block]
  (editor-handler/api-insert-new-block!
   ""
   {:block-uuid (:block/uuid comments-block)
    :sibling? true
    :edit-block? true}))

(defn save-comment!
  [comment-block content]
  (editor-handler/save-block! (state/get-current-repo) comment-block content))

(defn- comment-delete-targets
  [comment-block]
  (let [comments-area' (:block/parent comment-block)
        comments-area (or (some-> comments-area' :db/id db/entity)
                          comments-area')
        live-children (remove :logseq.property/deleted-at (:block/_parent comments-area))]
    (if (and (comments-model/comments-area? comments-area)
             (<= (count live-children) 1))
      [comments-area]
      [comment-block])))

(defn delete-comment!
  [comment-block]
  (ui-outliner-tx/transact!
   {:outliner-op :delete-blocks}
   (outliner-op/delete-blocks! (comment-delete-targets comment-block) nil)))

(defn paste-assets!
  [target-block e]
  (let [clipboard-data (gobj/get e "clipboardData")
        files (some-> clipboard-data (gobj/get "files"))]
    (when (and target-block (seq files))
      (util/stop e)
      (editor-handler/db-based-save-assets!
       (state/get-current-repo)
       (js->clj files)
       :target-block target-block)
      true)))
