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
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [electron.ipc :as ipc]))

(defonce *sqlite (atom nil))

(defn- ask-persist-permission!
  []
  (p/let [persistent? (.persist js/navigator.storage)]
    (if persistent?
      (js/console.log "Storage will not be cleared unless from explicit user action")
      (js/console.warn "OPFS storage may be cleared by the browser under storage pressure."))))

(defn start-db-worker!
  []
  (when-not (or config/publishing? util/node-test?)
    (let [worker-url (if (util/electron?)
                       "js/db-worker.js"
                       "/static/js/db-worker.js")
          worker (js/Worker. (str worker-url "?electron=" (util/electron?)))
          sqlite (Comlink/wrap worker)]
      (reset! *sqlite sqlite)
      (p/let [opfs-supported? (.supportOPFS sqlite)]
        (if opfs-supported?
          (p/do!
            (.init sqlite)
            (ask-persist-permission!))
          (notification/show! "It seems that OPFS is not supported on this browser, please upgrade it to the latest version or use another browser." :error))))))

(defn <export-db!
  [repo data]
  (cond
    (util/electron?)
    (ipc/ipc :db-export repo data)

    ;; nfs-supported? auto backup

    ;;
    :else
    nil))

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
                     (if (= "NoModificationAllowedError"  (.-name error))
                       (state/pub-event! [:db/multiple-tabs-opfs-failed])
                       (notification/show! [:div (str "SQLiteDB error: " error)] :error))
                     [])))))

  (<unsafe-delete [_this repo]
    (p/let [^js sqlite @*sqlite]
      (.unsafeUnlinkDB sqlite repo)))

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
                     (prn :debug :fetch-initial-data-error repo)
                     (js/console.error error)
                     (notification/show! [:div (str "SQLiteDB fetch error: " error)] :error) {})))))

  (<export-db [_this repo opts]
    (when-let [^js sqlite @*sqlite]
      (-> (p/let [data (.exportDB sqlite repo)]
            (if (:return-data? opts)
              data
              (<export-db! repo data)))
          (p/catch (fn [error]
                     (prn :debug :save-db-error repo)
                     (js/console.error error)
                     (notification/show! [:div (str "SQLiteDB save error: " error)] :error) {})))))

  (<import-db [_this repo data]
    (when-let [^js sqlite @*sqlite]
      (-> (.importDB sqlite repo data)
          (p/catch (fn [error]
                     (prn :debug :import-db-error repo)
                     (js/console.error error)
                     (notification/show! [:div (str "SQLiteDB import error: " error)] :error) {}))))))
