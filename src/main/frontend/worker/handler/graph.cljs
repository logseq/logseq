(ns frontend.worker.handler.graph
  "Graph metadata, favorites, and overview operations for the db worker."
  (:require [cljs.cache :as cache]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.cache :as common.cache]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.graph-view :as graph-view]
            [frontend.worker.plain-value :as worker-plain]
            [frontend.worker.state :as worker-state]
            [logseq.common.config :as common-config]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.outliner.op :as outliner-op]))

(defn- favorite-page
  [db]
  (ldb/get-page db common-config/favorites-page-name))

(defn- favorite-block
  [db page-block-uuid]
  (let [page-block-id (:db/id (d/entity db [:block/uuid page-block-uuid]))]
    (when-let [page (and page-block-id (favorite-page db))]
      (some (fn [block]
              (when (= page-block-id (:db/id (:block/link block)))
                block))
            (ldb/get-page-blocks db (:db/id page))))))

(defn- entity->plain-map
  [db entity]
  (some-> (worker-plain/entity-forward-map db entity {})
          worker-plain/with-explicit-ref-fields-recursive))

(def-thread-api :thread-api/get-favorite-pages
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (when-let [page (favorite-page db)]
        (->> (ldb/sort-by-order (:block/_parent page))
             (keep (fn [block]
                     (some->> (:block/link block)
                              (entity->plain-map db))))
             (remove ldb/recycled?)
             vec)))))

(def-thread-api :thread-api/favorited-page?
  [repo page-block-uuid]
  (let [db @(worker-state/get-datascript-conn repo)]
    (boolean (favorite-block db page-block-uuid))))

(def-thread-api :thread-api/get-recent-pages
  [repo page-ids]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (->> page-ids
           distinct
           (take 20)
           (keep #(some->> (d/entity db %)
                           (entity->plain-map db)))
           (filter ldb/page?)
           (remove ldb/hidden?)
           (remove (fn [entity]
                     (or (and (ldb/property? entity)
                              (true? (:logseq.property/hide? entity)))
                         (string/blank? (:block/title entity)))))
           vec))))

(defn- favorite-page-ops
  [db page-block-uuid]
  (when-let [page (and (d/entity db [:block/uuid page-block-uuid])
                       (favorite-page db))]
    [[:insert-blocks [[(ldb/build-favorite-tx page-block-uuid)]
                      (:block/uuid page)
                      {}]]]))

(defn- unfavorite-page-ops
  [db page-block-uuid]
  (when-let [block (favorite-block db page-block-uuid)]
    [[:delete-blocks [[(:block/uuid block)] {}]]]))

(def-thread-api :thread-api/set-page-favorite
  [repo page-block-uuid favorite?]
  (let [conn (worker-state/get-datascript-conn repo)
        db @conn
        favorited? (boolean (favorite-block db page-block-uuid))
        ops (cond
              (and favorite? (not favorited?)) (favorite-page-ops db page-block-uuid)
              (and (not favorite?) favorited?) (unfavorite-page-ops db page-block-uuid))]
    (when (seq ops)
      (outliner-op/apply-ops! conn ops nil))
    nil))

(defn- page-block-db-id
  [db page-block-uuid]
  (let [page-block-uuid' (if (string? page-block-uuid)
                           (parse-uuid page-block-uuid)
                           page-block-uuid)]
    (:db/id (d/entity db [:block/uuid page-block-uuid']))))

(defn- reorder-favorites-ops
  [db favorite-page-uuids]
  (when-let [page (favorite-page db)]
    (let [page-block-ids (keep #(page-block-db-id db %) favorite-page-uuids)
          current-blocks (ldb/sort-by-order (ldb/get-page-blocks db (:db/id page)))]
      (->> (map vector page-block-ids current-blocks)
           (keep (fn [[page-block-id block]]
                   (when (not= page-block-id (:db/id (:block/link block)))
                     [:save-block [(assoc block :block/link page-block-id) nil]])))
           vec))))

(def-thread-api :thread-api/reorder-favorites
  [repo favorite-page-uuids]
  (let [conn (worker-state/get-datascript-conn repo)
        db @conn
        ops (reorder-favorites-ops db favorite-page-uuids)]
    (when (seq ops)
      (outliner-op/apply-ops! conn ops nil))
    nil))

(def-thread-api :thread-api/build-graph
  [repo option]
  (let [conn (worker-state/get-datascript-conn repo)]
    (graph-view/build-graph @conn option)))

(def ^:private *get-all-page-titles-cache (volatile! (cache/lru-cache-factory {})))

(defn- get-all-page-titles
  [db]
  (let [pages (ldb/get-all-pages db)]
    (sort (map :block/title pages))))

(def ^:private get-all-page-titles-with-cache
  (common.cache/cache-fn
   *get-all-page-titles-cache
   (fn [repo]
     (let [db @(worker-state/get-datascript-conn repo)]
       [[repo (:max-tx db)]
        [db]]))
   get-all-page-titles))

(def-thread-api :thread-api/get-all-page-titles
  [repo]
  (get-all-page-titles-with-cache repo))

(def-thread-api :thread-api/mobile-logs
  []
  @worker-state/*log)

(def-thread-api :thread-api/get-key-value
  [repo key]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/get-key-value @conn key)))

(def-thread-api :thread-api/get-rtc-graph-uuid
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/get-graph-rtc-uuid @conn)))

(def-thread-api :thread-api/get-graph-uuid
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (or (ldb/get-graph-rtc-uuid @conn)
        (ldb/get-graph-local-uuid @conn))))

(defn- new-local-graph-uuid
  []
  (uuid (str "00000000" (subs (str (common-uuid/gen-uuid)) 8))))

(def-thread-api :thread-api/ensure-local-graph-uuid
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (or (ldb/get-graph-local-uuid @conn)
        (let [local-graph-uuid (new-local-graph-uuid)]
          (d/transact! conn
                       [(ldb/kv :logseq.kv/local-graph-uuid local-graph-uuid)]
                       {:graph-open/ensure-local-graph-uuid? true})
          local-graph-uuid))))
