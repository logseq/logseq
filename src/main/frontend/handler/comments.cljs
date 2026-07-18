(ns frontend.handler.comments
  "Handles creation, editing, deletion, and focus behavior for block comment threads."
  (:require [clojure.string :as string]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.db.async :as db-async]
            [frontend.handler.block :as block-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [promesa.core :as p]))

(defn- <block-ref
  [block-ref]
  (cond
    (map? block-ref)
    (p/resolved block-ref)

    (uuid? block-ref)
    (db-async/<get-block (state/get-current-repo) block-ref {:children? false})

    (and (string? block-ref) (util/uuid-string? block-ref))
    (db-async/<get-block (state/get-current-repo) (uuid block-ref) {:children? false})

    (number? block-ref)
    (db-async/<get-block (state/get-current-repo) block-ref {:children? false})

    :else
    (p/resolved nil)))

(defn- worker-block-ref
  [block-ref]
  (cond
    (map? block-ref) (or (:block/uuid block-ref) (:db/id block-ref))
    :else block-ref))

(defn <get-comment-threads-for-block
  [block-uuid]
  (when-let [repo (and block-uuid (state/get-current-repo))]
    (db-async/<get-comment-threads-for-block repo block-uuid)))

(defn <get-comment-thread-block-uuids
  ([block-uuids]
   (<get-comment-thread-block-uuids (state/get-current-repo) block-uuids))
  ([repo block-uuids]
   (let [block-uuids (->> block-uuids
                          (keep (fn [block-uuid]
                                  (cond
                                    (uuid? block-uuid)
                                    block-uuid

                                    (and (string? block-uuid) (util/uuid-string? block-uuid))
                                    (uuid block-uuid)

                                    :else
                                    nil)))
                          vec)]
     (when (and repo (seq block-uuids))
       (db-async/<get-comment-thread-block-uuids repo block-uuids)))))

(defn- <comments-area-block
  [comments-area]
  (if-let [repo (state/get-current-repo)]
    (db-async/<get-block repo (worker-block-ref comments-area) {:children? false})
    (p/resolved nil)))

(defn ensure-comments-area!
  [block-id]
  (when-let [repo (state/get-current-repo)]
    (state/<invoke-db-worker :thread-api/ensure-comments-area repo (worker-block-ref block-id))))

(defn ensure-comments-area-for-selected-blocks!
  [block-refs]
  (p/let [blocks (p/all (mapv <block-ref block-refs))
          blocks (->> blocks
                      (keep identity)
                      block-handler/get-top-level-blocks
                      comments-model/comment-target-blocks)]
    (when (seq blocks)
      (p/let [comments-area (state/<invoke-db-worker
                             :thread-api/ensure-comments-area-for-blocks
                             (state/get-current-repo)
                             (mapv worker-block-ref blocks))]
        (when comments-area
          (editor-handler/expand-block! (:block/uuid comments-area)))
        comments-area))))

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
   (p/let [comments-area (<comments-area-block comments-area)]
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
               0)))))))))

(defn expand-comments-area!
  [comments-area]
  (p/let [comments-area (<comments-area-block comments-area)]
    (when-let [uuid (:block/uuid comments-area)]
      (editor-handler/expand-block! uuid))))

(defn edit-comments-area-title!
  [comments-area container-id]
  (p/let [comments-area (<comments-area-block comments-area)]
    (when comments-area
      (editor-handler/edit-block! comments-area :max {:container-id (or container-id :unknown-container)}))))

(defn- selected-block-entities
  []
  (p/let [blocks (p/all (mapv <block-ref (state/get-selection-block-ids)))]
    (vec (keep identity blocks))))

(defn- edit-block-entity
  []
  (when-let [block (state/get-edit-block)]
    (<block-ref (:block/uuid block))))

(defn- comment-shortcut-targets
  []
  (if (state/editing?)
    (p/let [block (edit-block-entity)]
      (some-> block vector seq))
    (p/let [blocks (selected-block-entities)]
      (seq blocks))))

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
    (p/let [comment-targets (comment-shortcut-targets)]
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

(defn delete-comment!
  [comment-block]
  (when-let [repo (state/get-current-repo)]
    (state/<invoke-db-worker :thread-api/delete-comment repo (worker-block-ref comment-block))))

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
