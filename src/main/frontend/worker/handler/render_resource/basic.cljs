(ns frontend.worker.handler.render-resource.basic
  "Page, block, journal, and other simple renderer resources."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.reaction :as reaction]
            [frontend.worker.handler.block :as block-handler]
            [frontend.worker.handler.comments :as comments-handler]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.handler.property :as property-handler]
            [frontend.worker.handler.query :as query-handler]
            [frontend.worker.handler.render-resource.common :as common]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]))

(defn- sidebar-page-summary
  [page]
  (cond-> (select-keys page
                       [:db/id
                        :block/uuid
                        :block/title
                        :block/raw-title
                        :block/name
                        :block/journal-day
                        :logseq.property/icon
                        :logseq.property.asset/type])
    (seq (:block/tags page))
    (assoc :block/tags
           (mapv #(select-keys % [:db/id :db/ident :logseq.property/icon])
                 (:block/tags page)))))

(defn- favorites-page
  [db]
  (or (ldb/get-page db common-config/favorites-page-name)
      (common/fail! "Missing favorites page" {})))

(defn- favorite-targets
  [db]
  (->> (favorites-page db)
       :db/id
       (ldb/get-page-blocks db)
       ldb/sort-by-order
       (keep :block/link)
       (map #(d/entity db (:db/id %)))
       (remove ldb/recycled?)
       vec))

(defn- favorites
  [db _resource-key _runtime]
  (let [favorites-page-uuid (:block/uuid (favorites-page db))
        targets (favorite-targets db)]
    [(into #{[:children favorites-page-uuid]}
           (map (fn [page] [:entity (:block/uuid page)]))
           targets)
     (mapv sidebar-page-summary targets)]))

(defn- favorite-status
  [db resource-key _runtime]
  (let [page-uuid (common/require-uuid! :page-uuid (second resource-key))
        favorites-page-uuid (:block/uuid (favorites-page db))]
    [#{[:children favorites-page-uuid]}
     (boolean (some #(= page-uuid (:block/uuid %))
                    (favorite-targets db)))]))

(defn- recent-pages
  [db resource-key _runtime]
  (let [page-ids (second resource-key)]
    (when-not (and (vector? page-ids) (every? integer? page-ids))
      (common/fail! "Invalid recent page IDs" {:page-ids page-ids}))
    (let [pages (->> page-ids
                     distinct
                     (take 20)
                     (keep #(d/entity db %))
                     (filter ldb/page?)
                     (remove ldb/hidden?)
                     (remove (fn [page]
                               (or (and (ldb/property? page)
                                        (true? (:logseq.property/hide? page)))
                                   (string/blank? (:block/title page)))))
                     vec)]
      [(into #{} (map (fn [page] [:entity (:block/uuid page)])) pages)
       (mapv sidebar-page-summary pages)])))

(defn- page-identity
  [db resource-key _runtime]
  (let [lookup (second resource-key)]
    (when-not (or (uuid? lookup)
                  (and (string? lookup) (not (string/blank? lookup))))
      (common/fail! "Invalid page identity lookup" {:lookup lookup}))
    (let [watch-lookup (if (string? lookup)
                         (common-util/page-name-sanity-lc lookup)
                         lookup)]
      [#{[:page-lookup watch-lookup]}
       (some-> (ldb/get-page db lookup) :block/uuid)])))

(defn- page-preview-source
  [db resource-key _runtime]
  (let [page-uuid (common/require-uuid! :page-uuid (second resource-key))
        page (common/entity-by-uuid! db :page-uuid page-uuid)
        source (or (ldb/get-alias-source-page db (:db/id page)) page)]
    [#{[:entity page-uuid]
       [:attr :block/alias]}
     (common/entity-uuid! db (:db/id source))]))

(defn- breadcrumb-ref-titles
  [entities]
  (into {}
        (comp
         (mapcat :block/refs)
         (keep (fn [ref]
                 (when-let [ref-uuid (:block/uuid ref)]
                   (let [title (:block/title ref)]
                     (when-not (string? title)
                       (common/fail! "Invalid breadcrumb reference title"
                              {:ref-uuid ref-uuid
                               :title title}))
                     [ref-uuid title])))))
        entities))

(defn- block-breadcrumb
  [db resource-key _runtime]
  (let [[_ block-uuid load-depth] resource-key
        block (common/entity-by-uuid! db :block-uuid block-uuid)]
    (when-not (and (integer? load-depth) (pos? load-depth))
      (common/fail! "Invalid breadcrumb load depth" {:load-depth load-depth}))
    (let [parents (vec (ldb/get-block-parents db block-uuid {:depth load-depth}))
          page (:block/page block)
          ancestor-blocks (if (and page
                                   (not= (:db/id page) (:db/id (first parents))))
                            (into [page] parents)
                            parents)
          from-property (:logseq.property/created-from-property block)
          ancestor-blocks (cond-> ancestor-blocks
                                 from-property
                                 (conj from-property))
          ancestor-uuids (mapv (fn [ancestor]
                                 (common/entity-uuid! db (:db/id ancestor)))
                               ancestor-blocks)
          ref-titles (breadcrumb-ref-titles (into [block] ancestor-blocks))
          watch-uuids (into (conj (set ancestor-uuids) block-uuid)
                            (keys ref-titles))
          watch-keys (into #{}
                           (map (fn [watch-uuid]
                                  [:entity watch-uuid]))
                           watch-uuids)]
      [watch-keys
       {:target-uuid block-uuid
        :ancestor-uuids ancestor-uuids
        :ref-titles ref-titles}])))

(defn- journals
  [db _resource-key _runtime]
  [#{[:journals]}
   (mapv :block/uuid (ldb/get-latest-journals db))])

(defn- recycle-roots
  [db _resource-key _runtime]
  (let [roots (->> (d/q '[:find [?e ...]
                           :where
                           [?e :logseq.property/deleted-at]]
                         db)
                   (map #(d/entity db %))
                   (sort-by :logseq.property/deleted-at #(compare %2 %1)))
        root-uuids (mapv :block/uuid roots)
        blocks (:blocks (block-handler/canonical-blocks db root-uuids))]
    [#{[:recycle-roots]}
     (mapv blocks root-uuids)]))

(defn- property-choices
  [db resource-key _runtime]
  (let [property-uuid (common/require-uuid! :property-uuid (second resource-key))
        property (common/entity-by-uuid! db :property-uuid property-uuid)
        choices (:property/closed-values
                 (property-handler/display-property-map db (:db/id property)))
        watch-keys (into #{[:entity property-uuid]
                           [:property-membership :block/closed-value-property]}
                         (map (fn [choice]
                                [:entity (:block/uuid choice)]))
                         choices)]
    [watch-keys (vec choices)]))

(defn- block-reactions
  [db resource-key _runtime]
  (let [[_ target-uuid current-user-uuid] resource-key
        target (common/entity-by-uuid! db :target-uuid target-uuid)]
    (when-not (or (nil? current-user-uuid) (uuid? current-user-uuid))
      (common/fail! "Invalid reaction user UUID" {:current-user-uuid current-user-uuid}))
    (let [reactions (block-handler/block-reactions db (:db/id target))
          watch-keys (into #{[:reactions target-uuid]}
                           (keep (fn [item]
                                   (when-let [creator-uuid
                                              (get-in item [:logseq.property/created-by-ref
                                                            :block/uuid])]
                                     [:entity creator-uuid])))
                           reactions)]
      [watch-keys (reaction/summarize reactions current-user-uuid)])))

(defn- block-ref-count
  [db resource-key _runtime]
  (let [block-uuid (second resource-key)
        block (common/entity-by-uuid! db :block-uuid block-uuid)]
    [#{[:refs block-uuid]}
     (ldb/get-block-refs-count db (:db/id block))]))

(defn- block-unlinked-ref-exists
  [db resource-key {:keys [repo]}]
  (let [block-uuid (second resource-key)
        block (common/entity-by-uuid! db :block-uuid block-uuid)]
    [#{}
     (block-handler/unlinked-reference-exists? db repo (:db/id block))]))

(defn- block-comment-threads
  [db resource-key _runtime]
  (let [block-uuid (second resource-key)]
    (common/entity-by-uuid! db :block-uuid block-uuid)
    [#{[:comments block-uuid]}
     (->> (comments-handler/get-comment-threads-for-block db block-uuid)
          ldb/sort-by-order
          (mapv #(common/require-uuid! :comment-thread-uuid
                                (:block/uuid %))))]))

(defn- block-task-time
  [db resource-key _runtime]
  (let [block-uuid (second resource-key)
        block (common/entity-by-uuid! db :block-uuid block-uuid)
        [history seconds]
        (or (query-handler/task-spent-time db (:db/id block)
                                           (common-util/time-ms))
            [[] 0])]
    [#{[:task-time block-uuid]}
     {:history
      (mapv (fn [item]
              {:created-at (:block/created-at item)
               :status-uuid
               (common/require-uuid!
                :status-uuid
                (:logseq.property.history/ref-value-uuid item))})
            history)
      :seconds seconds}]))

(defn- route-block
  [db resource-key _runtime]
  (let [[_ page-lookup route-name] resource-key]
    (when-not (and (string? page-lookup) (not (string/blank? page-lookup)))
      (common/fail! "Invalid route page lookup" {:page-lookup page-lookup}))
    (when-not (and (string? route-name) (not (string/blank? route-name)))
      (common/fail! "Invalid block route name" {:route-name route-name}))
    (let [normalized-page-lookup (common-util/page-name-sanity-lc page-lookup)
          {:keys [page candidates block]}
          (worker-page/block-route-resolution db page-lookup route-name)
          page-uuid (when page
                      (common/require-uuid! :page-uuid (:block/uuid page)))
          block-uuid (when block
                       (common/require-uuid! :route-block-uuid (:block/uuid block)))
          referenced-uuids
          (into #{}
                (comp
                 (mapcat #(concat (:block/tags %) (:block/refs %)))
                 (map (fn [reference]
                        (common/require-uuid! :route-reference-uuid
                                       (:block/uuid reference)))))
                candidates)
          watch-keys
          (if page
            (into #{[:page-lookup normalized-page-lookup]
                    [:entity page-uuid]
                    [:route-page page-uuid]}
                  (map (fn [reference-uuid]
                         [:entity reference-uuid]))
                  referenced-uuids)
            #{[:page-lookup normalized-page-lookup]})]
      [watch-keys block-uuid])))

(defn- direct-child-entities
  [db page-uuid]
  (mapv (fn [[child-uuid]]
          (common/entity-by-uuid! db :child-uuid child-uuid))
        (:items (block-handler/direct-children-membership db page-uuid))))

(defn- comment-thread?
  [entity]
  (boolean
   (some #(= :logseq.class/Comments (:db/ident %))
         (:block/tags entity))))

(defn- comment-author-title
  [comment-block]
  (some-> comment-block
          :logseq.property/created-by-ref
          :block/title
          string/trim
          not-empty))

(defn- comment-author-uuid
  [comment-block]
  (when-let [author (:logseq.property/created-by-ref comment-block)]
    (common/require-uuid! :comment-author-uuid (:block/uuid author))))

(defn- block-comment-summary
  [db resource-key _runtime]
  (let [thread-uuid (second resource-key)
        thread (common/entity-by-uuid! db :thread-uuid thread-uuid)]
    (when-not (comment-thread? thread)
      (common/fail! "Renderer resource entity is not a comment thread"
             {:thread-uuid thread-uuid}))
    (let [comments (direct-child-entities db thread-uuid)
          _ (doseq [comment-block comments]
              (when-not (or (nil? (:block/created-at comment-block))
                            (number? (:block/created-at comment-block)))
                (common/fail! "Invalid comment creation time"
                       {:comment-uuid (:block/uuid comment-block)
                        :created-at (:block/created-at comment-block)})))
          latest (last (sort-by #(or (:block/created-at %) 0) comments))
          watch-uuids (concat [thread-uuid]
                              (map :block/uuid comments)
                              (keep comment-author-uuid comments))
          watch-keys (into #{[:children thread-uuid]}
                           (map (fn [watch-uuid]
                                  [:entity watch-uuid]))
                           watch-uuids)]
      [watch-keys
       {:count (count comments)
        :latest-author (comment-author-title latest)
        :latest-created-at (:block/created-at latest)}])))

(defn- tagged-with-page?
  [child page-id]
  (some #(= page-id (:db/id %)) (:block/tags child)))

(defn- page-membership
  [db resource-key _runtime]
  (let [[_ page-uuid membership-kind current-user-uuid] resource-key
        page (common/entity-by-uuid! db :page-uuid page-uuid)
        children (direct-child-entities db page-uuid)]
    (case membership-kind
      :class
      (do
        (common/require-shape! resource-key :page-membership 3)
        [#{[:entity page-uuid]
           [:children page-uuid]
           [:class-membership page-uuid]}
         (->> children
              ;; A class membership resource can remain subscribed for the
              ;; transaction that converts its class to a page.
              (remove #(and (ldb/class? page)
                            (tagged-with-page? % (:db/id page))))
              (mapv :block/uuid))])

      :property
      (do
        (common/require-shape! resource-key :page-membership 3)
        (when-not (ldb/property? page)
          (common/fail! "Page membership target is not a property"
                 {:page-uuid page-uuid}))
        (let [property-ident (:db/ident page)]
          [#{[:entity page-uuid]
             [:children page-uuid]
             [:property-membership property-ident]}
           (->> children
                (remove #(some? (property-handler/entity-direct-value
                                 db (:db/id %) property-ident)))
                (mapv :block/uuid))]))

      :quick-add
      (do
        (common/require-shape! resource-key :page-membership 4)
        (when-not (= common-config/quick-add-page-name (:block/title page))
          (common/fail! "Page membership target is not quick add"
                 {:page-uuid page-uuid}))
        (let [current-user
              (common/entity-by-uuid! db :current-user-uuid current-user-uuid)
              current-user-id (:db/id current-user)]
          [#{[:entity page-uuid]
             [:children page-uuid]
             [:attr :logseq.property/created-by-ref]}
           (->> children
                (filter (fn [child]
                          (let [creator-id
                                (property-handler/entity-direct-value
                                 db child :logseq.property/created-by-ref)]
                            (or (nil? creator-id)
                                (= current-user-id creator-id)))))
                (mapv :block/uuid))]))

      (common/fail! "Unsupported page membership kind"
             {:membership-kind membership-kind
              :resource-key resource-key}))))

(def resource-renderers
  {:favorites (common/renderer 1 favorites)
   :favorite-status (common/renderer 2 favorite-status)
   :recent-pages (common/renderer 2 recent-pages)
   :page-identity (common/renderer 2 page-identity)
   :page-preview-source (common/renderer 2 page-preview-source)
   :block-breadcrumb (common/renderer 3 block-breadcrumb)
   :journals (common/renderer 1 journals)
   :recycle-roots (common/renderer 1 recycle-roots)
   :property-choices (common/renderer 2 property-choices)
   :block-reactions (common/renderer 3 block-reactions)
   :block-ref-count (common/renderer 2 block-ref-count)
   :block-unlinked-ref-exists (common/renderer 2 block-unlinked-ref-exists)
   :block-comment-threads (common/renderer 2 block-comment-threads)
   :block-comment-summary (common/renderer 2 block-comment-summary)
   :block-task-time (common/renderer 2 block-task-time)
   :route-block (common/renderer 3 route-block)
   :page-membership (common/renderer nil page-membership)})
