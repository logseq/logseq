(ns frontend.handler.comments
  "Handles creation, editing, deletion, and focus behavior for block comment threads."
  (:require [clojure.string :as string]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.db :as db]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [promesa.core :as p]))

(defn- block-ref->entity
  [block-ref]
  (cond
    (map? block-ref)
    block-ref

    (uuid? block-ref)
    (db/entity [:block/uuid block-ref])

    (and (string? block-ref) (util/uuid-string? block-ref))
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
    (and (string? block-ref) (util/uuid-string? block-ref)) (uuid block-ref)
    :else nil))

(defn- block-lookup-ref
  [block]
  [:block/uuid (:block/uuid block)])

(defn ensure-comments-area!
  [block-id]
  (when-let [block (db/entity [:block/uuid block-id])]
    (if-let [comments-area (comments-area-child block)]
      (p/resolved comments-area)
      (editor-handler/api-insert-new-block!
       "Comments"
       {:block-uuid block-id
        :end? true
        :edit-block? false
        :other-attrs {:block/tags #{comments-model/comments-tag-ident}}}))))

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
   (when-let [uuid (:block/uuid comments-area)]
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
  (when-let [uuid (:block/uuid comments-area)]
    (editor-handler/expand-block! uuid)))

(defn- selected-block-entities
  []
  (keep #(db/entity [:block/uuid %]) (state/get-selection-block-ids)))

(defn- edit-block-entity
  []
  (when-let [block (state/get-edit-block)]
    (db/entity [:block/uuid (:block/uuid block)])))

(defn- comment-shortcut-targets
  []
  (or (seq (selected-block-entities))
      (some-> (edit-block-entity) vector)))

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
    (db-property-handler/set-block-property! (:db/id block)
                                             :block/tags
                                             comments-model/comments-tag-ident)
    (state/clear-edit!)
    block))

(defn add-comment-to-blocks!
  [blocks]
  (when-let [comment-targets (seq (comments-model/comment-target-blocks blocks))]
    (p/let [comments-area (ensure-comments-area-for-selected-blocks! comment-targets)]
      (when comments-area
        (reveal-comments-area! comments-area))
      (state/clear-selection!)
      (state/pub-event! [:editor/hide-action-bar]))))

(defn add-comment-to-current-context!
  [& _]
  (if (and (state/editing?)
           (current-edit-block-blank?))
    (set-current-block-as-comments-area!)
    (do
      (when (state/editing?)
        (editor-handler/save-current-block!))
      (add-comment-to-blocks! (comment-shortcut-targets)))))

(defn insert-comment!
  [comments-block content]
  (editor-handler/api-insert-new-block!
   content
   {:block-uuid (:block/uuid comments-block)
    :end? true
    :edit-block? false}))

(defn save-comment!
  [comment-block content]
  (editor-handler/save-block! (state/get-current-repo) comment-block content))

(defn delete-comment!
  [comment-block]
  (ui-outliner-tx/transact!
   {:outliner-op :delete-blocks}
   (outliner-op/delete-blocks! [comment-block] nil)))

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
