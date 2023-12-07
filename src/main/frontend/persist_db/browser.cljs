(ns frontend.persist-db.browser
  "Browser db persist support, using @logseq/sqlite-wasm.

   This interface uses clj data format as input."
  (:require ["comlink" :as Comlink]
            [cljs.core.async.interop :refer [p->c]]
            [frontend.persist-db.protocol :as protocol]
            [frontend.config :as config]
            [promesa.core :as p]
            [frontend.util :as util]
            [frontend.handler.notification :as notification]))

(defonce *sqlite (atom nil))

(defn start-db-worker!
  []
  (when-not (or config/publishing? util/node-test?)
    (let [worker-url (if (util/electron?)
                       "js/db-worker.js"
                       "/static/js/db-worker.js")
          worker (js/Worker. worker-url)
          sqlite (Comlink/wrap worker)]
      (reset! *sqlite sqlite))))

(defrecord InBrowser []
  protocol/PersistentDB
  (<new [_this repo]
    (prn :debug ::new-repo repo)
    (-> (p/let [^js sqlite @*sqlite]
          (.newDB sqlite repo))
        (p/catch (fn [error]
                   (js/console.error error)
                   (notification/show! [:div (str "SQLiteDB creation error: " error)] :error)
                   nil))))

  (<list-db [_this]
    (when-let [^js sqlite @*sqlite]
      (-> (.listDB sqlite)
          (p/catch (fn [error]
                     (prn :debug :list-db-error (js/Date.))
                     (notification/show! [:div (str "SQLiteDB error: " error)] :error)
                     [])))))

  (<unsafe-delete [_this repo]
    (p/let [^js sqlite @*sqlite]
      ;; (.unsafeUnlinkDB sqlite repo)
      ))

  (<transact-data [_this repo tx-data tx-meta]
    (prn :debug ::transact-data repo (count tx-data) (count tx-meta))
    (p->c
     (p/let [^js sqlite @*sqlite
             _ (.transact sqlite repo (pr-str tx-data) (pr-str tx-meta))]
       nil)))

  (<fetch-initital-data [_this repo _opts]
    (prn ::fetch-initital-data repo @*sqlite)
    (-> (let [^js sqlite @*sqlite
                ;; <fetch-initital-data is called when init/re-loading graph
                ;; the underlying DB should be opened
              ]
          (p/let [_ (.newDB sqlite repo)]
            (.getInitialData sqlite repo)))
        (p/catch (fn [error]
                   (prn :debug :fetch-initial-data-error)
                   (js/console.error error)
                   (notification/show! [:div (str "SQLiteDB fetch error: " error)] :error) {})))))
