(ns frontend.persist-db.browser
  "Browser db persist support, using @logseq/sqlite.

   This interface uses clj data format as input."
  (:require ["comlink" :as Comlink]
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
                     (notification/show! [:div (str "SQLiteDB creation error: " error)] :error))

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

  (<transact-data [_this repo tx-data tx-meta]
    (prn ::transact-data repo (count tx-data) (count tx-meta))
    (p->c
     (p/let [^js sqlite (ensure-sqlite-init)
             _ (.transact sqlite repo (pr-str tx-data) (pr-str tx-meta))]
       nil)))

  (<fetch-initital-data [_this repo _opts]
    (prn ::fetch-initital-data repo)
    (-> (p/let [^js sqlite (ensure-sqlite-init)
                ;; <fetch-initital-data is called when init/re-loading graph
                ;; the underlying DB should be opened
                _ (.newDB sqlite repo)]
          (.getInitialData sqlite repo))
        (p/catch (fn [error]
                   (prn ::fuck-error)
                   (if (string/includes? (str error) "NoModificationAllowedError")
                     (notification/show! [:div (str "Avoid opening the same graph in multi-tabs. Error: " error)] :error)
                     (notification/show! [:div (str "SQLiteDB fetch error: " error)] :error))

                   {}))))

  (<fetch-blocks-excluding [_this repo exclude-uuids _opts]
    (p/let [^js sqlite (ensure-sqlite-init)]
      (.fetchBlocksExcluding sqlite repo (clj->js exclude-uuids)))))
