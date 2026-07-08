(ns frontend.components.block.comments-model
  (:require [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.util :as util]
            [goog.object :as gobj]))

(def comments-tag-ident :logseq.class/Comments)
(def comment-tag-ident :logseq.class/Comment)
(def comments-blocks-property :logseq.property.comments/blocks)

(defn- tagged-with?
  [block tag-ident]
  (boolean
   (some (fn [tag]
           (= tag-ident
              (if (keyword? tag)
                tag
                (:db/ident tag))))
         (:block/tags block))))

(defn comments-area?
  [block]
  (tagged-with? block comments-tag-ident))

(defn tagged-comment-block?
  [block]
  (tagged-with? block comment-tag-ident))

(defn comment-block?
  [block]
  (or (tagged-comment-block? block)
      (comments-area? (:block/parent block))))

(defn protected-comment-block?
  [block]
  (or (comments-area? block)
      (comment-block? block)))

(defn- move-source-allowed?
  [block sibling?]
  (and (not (comment-block? block))
       (or sibling?
           (not (comments-area? block)))))

(defn- move-target-allowed?
  [target-block sibling?]
  (and (not (comment-block? target-block))
       (or sibling?
           (not (comments-area? target-block)))))

(defn move-allowed?
  ([blocks target-block]
   (move-allowed? blocks target-block {}))
  ([blocks target-block {:keys [sibling?]}]
   (boolean
    (and (seq blocks)
         target-block
         (every? #(move-source-allowed? % sibling?) blocks)
         (move-target-allowed? target-block sibling?)))))

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

(defn comment-thread-targets-toggle-visible?
  [comments-area]
  (> (count (comment-thread-target-blocks comments-area)) 1))

(defn show-comment-thread-targets?
  [comments-area targets-open?]
  (boolean
   (and targets-open?
        (comment-thread-targets-toggle-visible? comments-area))))

(defn comment-thread-click-action
  [comments-area-visible?]
  (if comments-area-visible?
    :focus-comments-area
    :show-inline-comments))

(defn next-inline-comment-thread
  [current-inline-thread target-block-uuid comments-area-uuid]
  (let [next-thread {:target-block-uuid (str target-block-uuid)
                     :comments-area-uuid (str comments-area-uuid)}]
    (when-not (= current-inline-thread next-thread)
      next-thread)))

(defn inline-comment-container-id
  [container-id]
  (if (int? container-id)
    container-id
    :unknown-container))

(defn- child-comments-area?
  [block comments-area]
  (let [block-id (:db/id block)
        parent-id (:block/parent-id comments-area)]
    (boolean
     (and block-id
          parent-id
          (= block-id parent-id)))))

(defn comment-threads-for-block
  [block]
  (->> (get block :block/comment-threads)
       (filter comments-area?)
       (remove #(child-comments-area? block %))
       (remove :logseq.property/deleted-at)
       vec))

(defn comment-thread-for-block
  ([block]
   (first (comment-threads-for-block block)))
  ([rendered-block fresh-block]
   (or (some-> fresh-block comment-thread-for-block)
       (comment-thread-for-block rendered-block))))

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

(defn- created-by-avatar-src
  [block]
  (some-> (:logseq.property/created-by-ref block)
          :logseq.property.user/avatar
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
        avatar-src (created-by-avatar-src block)
        author-uuid (created-by-uuid block)
        created-at (:block/created-at block)
        updated-at (:block/updated-at block)]
    {:author author
     :avatar (author-initials author)
     :avatar-src avatar-src
     :author-uuid author-uuid
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

(defn comment-author-visible?
  [current-user-uuid]
  (boolean (uuid-string current-user-uuid)))

(defn comments-summary
  [blocks]
  (let [rows (comment-rows blocks)]
    (when (seq rows)
      (let [latest (last (sort-by #(or (:created-at %) 0) rows))]
        {:count (count rows)
         :latest-author (:author latest)
         :latest-created-at (:created-at latest)}))))

(defn collapsed-comments-label
  [summary]
  (if summary
    (t :block.comments/collapsed-summary
       (:count summary)
       (:latest-author summary))
    (t :block.comments/label)))

(defn comments-area-title
  [comments-area]
  (or (some-> (:block/title comments-area)
              string/trim
              not-empty)
      (t :block.comments/label)))

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
     (if created-by
       (and current-user
            (= created-by current-user))
       (nil? current-user)))))

(defn comment-actions
  [block current-user-uuid]
  (cond-> [:reaction]
    (comment-owned-by? block current-user-uuid)
    (conj :edit :delete)))

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
         (not (util/native-event-is-composing? event))
         (not (true? (gobj/get event "shiftKey")))))))
