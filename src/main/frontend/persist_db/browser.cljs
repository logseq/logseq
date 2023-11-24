(ns frontend.persist-db.browser
  "Browser db persist support, using @logseq/sqlite.

   This interface uses clj data format as input."
  (:require ["comlink" :as Comlink]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.core.async.interop :refer [p->c]]
            [frontend.persist-db.protocol :as protocol]
            [frontend.config :as config]
            [promesa.core :as p]
            [frontend.util :as util]
            [frontend.handler.notification :as notification]
            [clojure.string :as string]))

(defonce *sqlite (atom nil))
(defonce *inited (atom false))

(when-not (or (util/electron?) config/publishing? util/node-test?)
  (defonce _do_not_reload_worker
    (let [worker (try
                   (js/Worker. "/static/js/db-worker.js")
                   (catch js/Error e
                     (js/console.error "worker error", e)
                     nil))
          ^js sqlite (Comlink/wrap worker)]
      (p/catch (.init sqlite)
               (fn [error]
                 (notification/show! [:div (str "init error: " error)] :error))) ;; load wasm
      (reset! *sqlite sqlite))))


(defn- ensure-sqlite-init
  []
  (if @*inited
    (p/resolved @*sqlite)
    (js/Promise. (fn [resolve reject]
                   (let [timer (atom nil)
                         timer' (js/setInterval (fn []
                                                  (p/let [inited (.inited ^js @*sqlite)]
                                                    (when inited
                                                      (p/let [version (.getVersion ^js @*sqlite)
                                                              support (.supportOPFS ^js @*sqlite)]
                                                        (prn :init-sqlite version :opfs-support support))
                                                      (js/clearInterval @timer)
                                                      (reset! *inited true)
                                                      (resolve @*sqlite))))
                                                200)
                         _ (reset! timer timer')]
                     (js/setTimeout (fn []
                                      (js/clearInterval timer)
                                      (reject nil)) ;; cannot init
                                    20000))))))

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
  {:uuid (str (:block/uuid b))
   :type (type-of-block b)
   :page_uuid (str (:page_uuid b))
   :page_journal_day (:block/journal-day b)
   :name (or (:file/path b) (:block/name b))
   :content (or (:file/content b) (:block/content b))
   :datoms (:datoms b)
   :created_at (or (:block/created-at b) (time-ms))
   :updated_at (or (:block/updated-at b) (time-ms))})

(comment
  (defn dev-stop!
    "For dev env only, stop opfs backend, close all sqlite connections and OPFS sync access handles."
    []
    (println "[persis-db] Dev: close all sqlite connections")
    (when-not (util/electron?)
      (when @*sqlite
        (.unsafeDevCloseAll ^js @*sqlite)))))


(defrecord InBrowser []
  protocol/PersistentDB
  (<new [_this repo]
    (prn ::new-repo repo)
    (-> (p/let [^js sqlite (ensure-sqlite-init)]
          (.newDB sqlite repo))
        (p/catch (fn [error]
                   (if (string/includes? (str error) "NoModificationAllowedError")
                     (notification/show! [:div (str "Avoid opening the same graph in multi-tabs. Error: " error)] :error)
                     (notification/show! [:div (str "SQLiteDB backend error: " error)] :error))

                   nil))))

  (<list-db [_this]
    (-> (p/let [^js sqlite (ensure-sqlite-init)]
          (.listDB sqlite))
        (p/catch (fn [error]
                   (notification/show! [:div (str "SQLiteDB error: " error)] :error)
                   []))))

  (<unsafe-delete [_this repo]
    (p/let [^js sqlite (ensure-sqlite-init)]
      (.unsafeUnlinkDB sqlite repo)))

  (<transact-data [_this repo upsert-blocks deleted-uuids]
    (p->c (p/let [^js sqlite (ensure-sqlite-init)
                  deleted (clj->js (map str deleted-uuids))
                  _ (when (seq deleted)
                      (.deleteBlocks sqlite repo deleted))
                  upsert-blocks (clj->js (map ds->sqlite-block upsert-blocks))]
            (.upsertBlocks sqlite repo upsert-blocks))))

  (<fetch-initital-data [_this repo _opts]
    (-> (p/let [^js sqlite (ensure-sqlite-init)
            ;; <fetch-initital-data is called when init/re-loading graph
            ;; the underlying DB should be opened
                _ (.openDB sqlite repo)
                all-pages (.fetchAllPages sqlite repo)
                all-blocks (.fetchAllBlocks sqlite repo)
                journal-blocks (.fetchRecentJournals sqlite repo)
                init-data (.fetchInitData sqlite repo)]

          #js {:all-blocks all-blocks
               :all-pages all-pages
               :journal-blocks journal-blocks
               :init-data init-data})
        (p/catch (fn [error]
                   (if (string/includes? (str error) "NoModificationAllowedError")
                     (notification/show! [:div (str "Avoid opening the same graph in multi-tabs. Error: " error)] :error)
                     (notification/show! [:div (str "SQLiteDB backend error: " error)] :error))

                   {}))))
  (<fetch-blocks-excluding [_this repo exclude-uuids _opts]
    (p/let [^js sqlite (ensure-sqlite-init)]
      (.fetchBlocksExcluding sqlite repo (clj->js exclude-uuids)))))
