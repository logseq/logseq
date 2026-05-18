(ns frontend.components.block.comments-model
  (:require [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [goog.object :as gobj]))

(def comments-tag-ident :logseq.class/Comments)
(def comments-blocks-property :logseq.property.comments/blocks)

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

(defn comment-target-blocks
  [blocks]
  (->> blocks
       (remove protected-comment-block?)
       distinct
       vec))

(defn range-comments-area?
  [block]
  (boolean
   (and (comments-area? block)
        (seq (get block comments-blocks-property)))))

(defn comment-thread-target-blocks
  [comments-area]
  (->> (get comments-area comments-blocks-property)
       (remove :logseq.property/deleted-at)
       vec))

(defn comment-threads-for-block
  [block]
  (->> (get block :logseq.property.comments/_blocks)
       (filter comments-area?)
       (remove :logseq.property/deleted-at)
       vec))

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

(defn- same-local-day?
  [^js a ^js b]
  (and (= (.getFullYear a) (.getFullYear b))
       (= (.getMonth a) (.getMonth b))
       (= (.getDate a) (.getDate b))))

(defn- yesterday?
  [^js date ^js now]
  (let [yesterday (js/Date. (.getFullYear now) (.getMonth now) (dec (.getDate now)))]
    (same-local-day? date yesterday)))

(defn- comment-time
  [^js date]
  (.toLocaleTimeString date
                       js/undefined
                       #js {:hour "numeric"
                            :minute "2-digit"}))

(defn- comment-date
  [^js date]
  (.toLocaleDateString date
                       js/undefined
                       #js {:year "numeric"
                            :month "short"
                            :day "numeric"}))

(defn comment-time-label
  ([created-at]
   (comment-time-label created-at (js/Date.)))
  ([created-at now]
   (when (number? created-at)
     (let [date (js/Date. created-at)
           time (comment-time date)]
       (cond
         (same-local-day? date now)
         time

         (yesterday? date now)
         (t :block.comments/yesterday-at time)

         :else
         (t :block.comments/date-at-time (comment-date date) time))))))

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

(defn comment-draft-storage-key
  [comments-block]
  (when-let [comments-uuid (:block/uuid comments-block)]
    (str "comments-" comments-uuid "-draft")))

(defn- local-storage
  []
  (gobj/get js/globalThis "localStorage"))

(defn saved-comment-draft
  [comments-block]
  (when-let [key (comment-draft-storage-key comments-block)]
    (some-> (local-storage)
            (.getItem key))))

(defn clear-comment-draft!
  [comments-block]
  (when-let [key (comment-draft-storage-key comments-block)]
    (some-> (local-storage)
            (.removeItem key))))

(defn save-comment-draft!
  [comments-block draft]
  (if-not (string/blank? (or draft ""))
    (when-let [key (comment-draft-storage-key comments-block)]
      (some-> (local-storage)
              (.setItem key draft)))
    (clear-comment-draft! comments-block)))

(defn comments-block-current-page?
  [comments-block current-page]
  (boolean
   (and (:block/uuid comments-block)
        current-page
        (= (str (:block/uuid comments-block)) (str current-page)))))

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
