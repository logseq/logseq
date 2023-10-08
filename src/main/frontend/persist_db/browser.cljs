(ns frontend.persist-db.browser
  "Browser db persist"
  (:require ["comlink" :as Comlink]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.core.async.interop :refer [p->c]]
            [clojure.core.async :as async :refer [<! chan go go-loop]]
            [frontend.persist-db.protocol :as protocol]
            [promesa.core :as p]))

(defonce *worker (atom nil))
(defonce *sqlite (atom nil))

(defonce db-upsert-chan (chan 10))

(defn- ensure-sqlite-init []
  (if (nil? @*worker)
    (js/Promise. (fn [resolve _reject]
                   (let [worker (try
                                  (js/SharedWorker. "/static/js/ls-wa-sqlite/persist-db-worker.js")
                                  (catch js/Error e
                                    (js/console.error "worker error", e)
                                    nil))
                         _ (reset! *worker worker)
                         ^js sqlite (Comlink/wrap (.-port worker))
                         _ (reset! *sqlite sqlite)]
                     (-> (.init sqlite)
                         (p/then (fn []
                                   (js/console.log "sqlite init done")
                                   (resolve @*sqlite)))
                         (p/then (fn []
                                   (go-loop []
                                     (let [[repo ret-ch deleted-uuids upsert-blocks] (<! db-upsert-chan)
                                           delete-rc (when (seq deleted-uuids)
                                                       (<! (p->c (.deleteBlocks sqlite repo (clj->js (map str deleted-uuids))))))
                                           upsert-rc (<! (p->c (.upsertBlocks sqlite repo (clj->js upsert-blocks))))]
                                       (async/put! ret-ch [delete-rc upsert-rc])
                                       (prn :db-upsert-chan :delete delete-rc :upsert upsert-rc))
                                     (recur))
                                   (prn ::done)))
                         (p/catch (fn [e]
                                    (js/console.error "init error", e)))))))
    (p/resolved @*sqlite)))

(defn- type-of-block
  "
  TODO: use :block/type
  | value | meaning                                        |
  |-------+------------------------------------------------|
  |     1 | normal block                                   |
  |     2 | page block                                     |
  |     3 | init data, (config.edn, custom.js, custom.css) |
  |     4 | db schema                                      |
  |     5 | unknown type                                   |
  |     6 | property block                                 |
  "
  [block]
  (cond
    (:block/page block) 1
    (:file/content block) 3
    (contains? (:block/type block) "property") 6
    (:block/name block) 2
    :else 5))

(defn time-ms
  "Copy of util/time-ms. Too basic to couple this to main app"
  []
  (tc/to-long (t/now)))

(defn- ds->sqlite-block
  "Convert a datascript block to a sqlite map in preparation for a sqlite-db fn.

   @uuid, @type, @page_uuid, @page_journal_day, @name, @content, @datoms, @created_at, @updated_at
   "
  [b]
  [(str (:block/uuid b))
   (type-of-block b)
   (str (:page_uuid b))
   (:block/journal-day b)
   (or (:file/path b) (:block/name b))
   (or (:file/content b) (:block/content b))
   (:datoms b)
   (or (:block/created-at b) (time-ms))
   (or (:block/updated-at b) (time-ms))])

(defrecord InBrowser []
  protocol/PersistentDB
  (<new [_this repo]
    (prn ::new-repo repo)
    (p/let [^js sqlite (ensure-sqlite-init)]
      (.newDB sqlite repo)))

  (<list-db [_this]
    (p/let [^js sqlite (ensure-sqlite-init)
            dbs (.listDB sqlite)]
      (js/console.log "list DBs:" dbs)
      dbs))
  (<unsafe-delete [_this repo]
    (p/let [^js sqlite (ensure-sqlite-init)]
      (.unsafeUnlinkDB sqlite repo)))

  (<transact-data [_this repo upsert-blocks deleted-uuids]
    (go
      (let [_ (<! (p->c (ensure-sqlite-init)))
            upsert-blocks (map ds->sqlite-block upsert-blocks)
            ch (chan)
            _ (async/put! db-upsert-chan [repo ch deleted-uuids upsert-blocks])]
        (<! ch))))
  (<fetch-initital-data [_this repo _opts]
    (prn ::fetch-initial repo)
    (p/let [^js sqlite (ensure-sqlite-init)
            all-pages (.fetchAllPages sqlite repo)
            all-blocks (.fetchAllBlocks sqlite repo)
            journal-blocks (.fetchRecentJournalBlocks sqlite repo)
            init-data (.fetchInitData sqlite repo)]

      #js {:all-blocks all-blocks
           :all-pages all-pages
           :journal-blocks journal-blocks
           :init-data init-data}))
  (<fetch-blocks-excluding [_this repo exclude-uuids _opts]
    (p/let [^js sqlite (ensure-sqlite-init)
            res (.fetchBlocksExcluding sqlite repo (clj->js exclude-uuids))]
      (prn :<fetch-blocks-excluding res)
      res)))
