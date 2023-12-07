(ns frontend.persist-db.browser
  "Browser db persist support, using @logseq/sqlite-wasm.

   This interface uses clj data format as input."
  (:require ["comlink" :as Comlink]
            [cljs.core.async.interop :refer [p->c]]
            [frontend.persist-db.protocol :as protocol]
            [frontend.config :as config]
            [promesa.core :as p]
            [frontend.util :as util]
            [frontend.handler.notification :as notification]
            [cljs-bean.core :as bean]))

(defonce *sqlite (atom nil))

(defn start-db-worker!
  []
  (when-not (or config/publishing? util/node-test?)
    (let [worker-url (if (util/electron?)
                       "js/db-worker.js"
                       "/static/js/db-worker.js")
          worker (js/Worker. worker-url)
          sqlite (Comlink/wrap worker)]
      (reset! *sqlite sqlite)
      (.init sqlite))))

(defrecord InBrowser []
  protocol/PersistentDB
  (<new [_this repo]
    (let [^js sqlite @*sqlite]
      (-> (.createOrOpenDB sqlite repo)
          (p/then (fn [_result]
                    (prn "SQLite db created or opened successfully: " repo)))
          (p/catch (fn [error]
                     (js/console.error error)
                     (notification/show! [:div (str "SQLiteDB creation error: " error)] :error)
                     nil)))))

  (<list-db [_this]
    (when-let [^js sqlite @*sqlite]
      (-> (.listDB sqlite)
          (p/then (fn [result]
                    (bean/->clj result)))
          (p/catch (fn [error]
                     (prn :debug :list-db-error (js/Date.))
                     (notification/show! [:div (str "SQLiteDB error: " error)] :error)
                     [])))))

  (<unsafe-delete [_this repo]
    ;; (p/let [^js sqlite @*sqlite]
    ;;   ;; (.unsafeUnlinkDB sqlite repo)
    ;;   )
    )

  (<transact-data [_this repo tx-data tx-meta]
    (when-let [^js sqlite @*sqlite]
      (p->c
       (p/let [_ (.transact sqlite repo (pr-str tx-data) (pr-str tx-meta))]
         nil))))

  (<fetch-initial-data [_this repo _opts]
    (when-let [^js sqlite @*sqlite]
      (-> (p/let [_ (.createOrOpenDB sqlite repo)]
            (.getInitialData sqlite repo))
          (p/catch (fn [error]
                     (prn :debug :fetch-initial-data-error)
                     (js/console.error error)
                     (notification/show! [:div (str "SQLiteDB fetch error: " error)] :error) {}))))))
