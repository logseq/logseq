(ns frontend.components.block.comments-model
  (:require [clojure.string :as string]
            [goog.object :as gobj]))

(def comments-tag-ident :logseq.class/Comments)

(defn comments-area?
  [block]
  (boolean
   (some (fn [tag]
           (= comments-tag-ident
              (if (keyword? tag)
                tag
              (:db/ident tag))))
         (:block/tags block))))

(defn comment-block?
  [block]
  (comments-area? (:block/parent block)))

(defn protected-comment-block?
  [block]
  (or (comments-area? block)
      (comment-block? block)))

(defn move-allowed?
  ([blocks target-block]
   (move-allowed? blocks target-block {}))
  ([blocks target-block opts]
   (boolean
    (and (seq blocks)
         target-block
         (not-any? protected-comment-block? blocks)
         (not (comment-block? target-block))
         (or (:sibling? opts)
             (not (comments-area? target-block)))))))

(defn- author-initials
  [author]
  (let [author (string/trim (str author))]
    (if (string/blank? author)
      ""
      (if (= "me" (string/lower-case author))
        "ME"
        (-> author
            (subs 0 1)
            string/upper-case)))))

(defn- created-by-title
  [block]
  (some-> (:logseq.property/created-by-ref block)
          :block/title
          string/trim
          not-empty))

(defn- uuid-string
  [value]
  (cond
    (uuid? value) (str value)
    (string? value) (not-empty value)
    :else nil))

(defn- created-by-uuid
  [block]
  (some-> (:logseq.property/created-by-ref block)
          :block/uuid
          uuid-string))

(defn comment-row
  [block]
  (let [author (created-by-title block)
        created-at (:block/created-at block)
        updated-at (:block/updated-at block)]
    {:author author
     :avatar (author-initials author)
     :body (string/trim (or (:block/title block) ""))
     :created-at created-at
     :updated-at updated-at
     :edited? (boolean
               (and (number? created-at)
                    (number? updated-at)
                    (> updated-at created-at)))}))

(defn comment-rows
  [blocks]
  (mapv comment-row blocks))

(defn comments-summary
  [blocks]
  (let [rows (comment-rows blocks)]
    (when (seq rows)
      (let [latest (last (sort-by #(or (:created-at %) 0) rows))]
        {:count (count rows)
         :latest-author (:author latest)
         :latest-created-at (:created-at latest)}))))

(defn comments-render-token
  [blocks]
  (mapv (fn [block]
          [(:block/uuid block)
           (:block/title block)
           (:block/updated-at block)])
        blocks))

(defn comment-draft-block
  [comments-block draft-uuid draft]
  {:block/uuid draft-uuid
   :block/title (or draft "")
   :block/format :markdown
   :block/page (:block/page comments-block)
   :block/parent comments-block})

(defn submittable-comment-content
  [draft]
  (not-empty (string/trim (or draft ""))))

(defn comment-owned-by?
  [block current-user-uuid]
  (let [created-by (created-by-uuid block)
        current-user (uuid-string current-user-uuid)]
    (boolean
     (and created-by
          current-user
          (= created-by current-user)))))

(defn comment-actions
  [block current-user-uuid]
  (cond-> [:reaction :edit]
    (comment-owned-by? block current-user-uuid)
    (conj :delete)))

(defn comment-edit-cursor-position
  [body]
  (count (or body "")))

(defn comment-submit-shortcut?
  ([event]
   (comment-submit-shortcut? event nil))
  ([event editor-action]
   (boolean
    (and (nil? editor-action)
         (= "Enter" (gobj/get event "key"))
         (not (true? (gobj/get event "shiftKey")))))))
