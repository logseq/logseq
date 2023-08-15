(ns frontend.persist-db.browser
  (:require ["comlink" :as Comlink]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [frontend.persist-db.protocol :as protocol]
            [promesa.core :as p]))

(defonce *worker (atom nil))
(defonce *sqlite (atom nil))

(defn- get-sqlite []
  (if (nil? @*worker)
    (js/Promise. (fn [resolve _reject]
                   (prn ::get-sqlite)
                   (let [worker (js/SharedWorker. "/static/js/ls-wa-sqlite/persist-db-worker.js")
                         _ (reset! *worker worker)
                         ^js sqlite (Comlink/wrap (.-port worker))
                         _ (reset! *sqlite sqlite)]
                     (p/do!
                      (.init ^js sqlite)
                      (resolve @*sqlite)))))
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
    (= "property" (:block/type block)) 6
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
    (prn ::repo repo)
    (p/let [^js sqlite (get-sqlite)
            rc (.newDB ^js sqlite repo)]
      (js/console.log "new db created rc=" rc)))

  (<transact-data [_this repo upsert-blocks deleted-uuids]
    (prn ::transact-data repo)
    (p/let [^js sqlite (get-sqlite)
            upsert-blocks (map ds->sqlite-block upsert-blocks)
            upsert-blocks (clj->js upsert-blocks)
            r1 (when (seq deleted-uuids)
                 (.deleteBlocks sqlite repo (clj->js deleted-uuids)))
            _     (js/console.log "upsert:" upsert-blocks)
            r2 (.upsertBlocks sqlite repo upsert-blocks)]
      (prn ::transact-ret r1  r2)))
  (<fetch-initital-data [_this repo _opts]
    (prn ::fetch-initial repo)
    (p/let [^js sqlite (get-sqlite)
            all-pages (.fetchAllPages sqlite repo)
            all-blocks (.fetchAllBlocks sqlite repo)
            journal-blocks (.fetchRecentJournalBlocks sqlite repo)
            init-data (.fetchInitData sqlite repo)]

      #js {:all-blocks all-blocks
           :all-pages all-pages
           :journal-blocks journal-blocks
           :init-data init-data}))
  (<fetch-blocks-excluding [_this repo exclude-uuids _opts]
    (p/let [^js sqlite (get-sqlite)
            res (.fetchBlocksExcluding sqlite repo (clj->js exclude-uuids))]
      (prn :<fetch-blocks-excluding res)
      res)))

