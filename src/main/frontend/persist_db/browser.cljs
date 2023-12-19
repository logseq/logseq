(ns frontend.persist-db.browser
  "Browser db persist support, using @logseq/sqlite-wasm.

   This interface uses clj data format as input."
  (:require ["comlink" :as Comlink]
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
      (-> (p/let [_ (.init sqlite)]
            (ask-persist-permission!))
          (p/catch (fn [error]
                     (prn :debug "Can't init SQLite wasm")
                     (js/console.error error)
                     (notification/show! "It seems that OPFS is not supported on this browser, please upgrade it to the latest version or use another browser." :error)))))))

(defn <export-db!
  [repo data]
  (cond
    (util/electron?)
    (ipc/ipc :db-export repo data)

    ;; TODO: browser nfs-supported? auto backup

    ;;
    :else
    nil))

(defn- sqlite-error-handler
  [error]
  (if (= "NoModificationAllowedError"  (.-name error))
    (state/pub-event! [:show/multiple-tabs-error-dialog])
    (notification/show! [:div (str "SQLiteDB error: " error)] :error)))

(defrecord InBrowser []
  protocol/PersistentDB
  (<new [_this repo]
    (when-let [^js sqlite @*sqlite]
      (.createOrOpenDB sqlite repo)))

  (<list-db [_this]
    (when-let [^js sqlite @*sqlite]
      (-> (.listDB sqlite)
          (p/then (fn [result]
                    (bean/->clj result)))
          (p/catch sqlite-error-handler))))

  (<unsafe-delete [_this repo]
    (when-let [^js sqlite @*sqlite]
      (.unsafeUnlinkDB sqlite repo)))

  (<release-access-handles [_this repo]
    (when-let [^js sqlite @*sqlite]
      (.releaseAccessHandles sqlite repo)))

  (<transact-data [_this repo tx-data tx-meta]
    (let [^js sqlite @*sqlite
          tx-data' (pr-str tx-data)
          tx-meta' (pr-str tx-meta)]
      (p/do!
       (ipc/ipc :db-transact repo tx-data' tx-meta')
       (when sqlite (.transact sqlite repo tx-data' tx-meta'))
       nil)))

  (<fetch-initial-data [_this repo _opts]
    (when-let [^js sqlite @*sqlite]
      (-> (p/let [_ (.createOrOpenDB sqlite repo)]
            (.getInitialData sqlite repo))
          (p/catch sqlite-error-handler))))

  (<export-db [_this repo opts]
    (when-let [^js sqlite @*sqlite]
      (-> (p/let [data (.exportDB sqlite repo)]
            (when data
              (if (:return-data? opts)
                data
                (<export-db! repo data))))
          (p/catch (fn [error]
                     (prn :debug :save-db-error repo)
                     (js/console.error error)
                     (notification/show! [:div (str "SQLiteDB save error: " error)] :error) {})))))

  (<import-db [_this repo data]
    (when-let [^js sqlite @*sqlite]
      (-> (.importDb sqlite repo data)
          (p/catch (fn [error]
                     (prn :debug :import-db-error repo)
                     (js/console.error error)
                     (notification/show! [:div (str "SQLiteDB import error: " error)] :error) {}))))))
