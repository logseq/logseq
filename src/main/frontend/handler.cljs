(ns frontend.handler
  (:require [frontend.state :as state]

            [frontend.db-schema :as db-schema]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.config :as config]
            [frontend.storage :as storage]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.date :as date]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.web.nfs :as nfs]
            [frontend.ui :as ui]
            [goog.object :as gobj]
            [frontend.helper :as helper]
            [frontend.idb :as idb]
            [lambdaisland.glogi :as log]
            [frontend.db.simple :as db-simple]
            [frontend.handler.utils :as h-utils]
            [frontend.db.declares :as declares]
            [frontend.db.utils :as db-utils]
            [datascript.core :as d]
            [cljs.core.async :as async]))

(defn- watch-for-date!
  []
  (js/setInterval (fn []
                    (when-not (state/nfs-refreshing?)
                      (repo-handler/create-today-journal!))) 1000))

(defn store-schema!
  []
  (storage/set :db-schema db-schema/schema))

(defn schema-changed?
  []
  (when-let [schema (storage/get :db-schema)]
    (not= schema db-schema/schema)))

(defn- get-me-and-repos
  []
  (let [me (and js/window.user (bean/->clj js/window.user))
        logged? (:name me)
        repos (if logged?
                (:repos me)
                [{:url config/local-repo}])]
    {:me me
     :logged? logged?
     :repos repos}))

(declare restore-and-setup!)

(defn clear-stores-and-refresh!
  []
  (p/let [_ (idb/clear-local-storage-and-idb!)]
    (let [{:keys [me logged? repos]} (get-me-and-repos)]
      (js/window.location.reload))))

(defn- restore!
  [{:keys [repos] :as me} restore-config-handler]
  (let [logged? (:name me)]
    (doall
      (for [{:keys [url]} repos]
        (let [repo url

              db-name (declares/datascript-files-db repo)
              db-conn (d/create-conn db-schema/files-db-schema)]
          (swap! declares/conns assoc db-name db-conn)
          (p/let [stored (-> (idb/get-item db-name)
                             (p/then (fn [result]
                                       result))
                             (p/catch (fn [error]
                                        nil)))
                  _ (when stored
                      (let [stored-db (db-utils/string->db stored)
                            attached-db (d/db-with stored-db [(db-utils/me-tx stored-db me)])]
                        (declares/reset-conn! db-conn attached-db)))
                  db-name (declares/datascript-db repo)
                  db-conn (d/create-conn db-schema/schema)
                  _ (d/transact! db-conn [{:schema/version db-schema/version}])
                  _ (swap! declares/conns assoc db-name db-conn)
                  stored (idb/get-item db-name)
                  _ (if stored
                      (let [stored-db (db-utils/string->db stored)
                            attached-db (d/db-with stored-db [(db-utils/me-tx stored-db me)])]
                        (declares/reset-conn! db-conn attached-db))
                      (when logged?
                        (d/transact! db-conn [(db-utils/me-tx (d/db db-conn) me)])))]
            (restore-config-handler repo)
            (h-utils/listen-and-persist! repo)))))))

(defn restore-and-setup!
  [me repos logged?]
  (let [interval (atom nil)
        inner-fn (fn []
                   (when (and @interval js/window.pfs)
                     (js/clearInterval @interval)
                     (reset! interval nil)
                     (-> (p/all (restore! (assoc me :repos repos)
                                  (fn [repo]
                                    (file-handler/restore-config! repo false)
                                    (ui-handler/add-style-if-exists!))))
                         (p/then
                          (fn []
                            (cond
                              (and (not logged?)
                                   (not (seq (db-simple/get-files config/local-repo)))
                                   ;; Not native local directory
                                   (not (some config/local-db? (map :url repos))))
                              (repo-handler/setup-local-repo-if-not-exists!)

                              :else
                              (state/set-db-restoring! false))
                            (if (schema-changed?)
                              (do
                                (notification/show!
                                 [:p "Database schema changed, your notes will be exported as zip files, your repos will be re-indexed then."]
                                 :warning
                                 false)
                                (let [export-repos (for [repo repos]
                                                     (when-let [url (:url repo)]
                                                       (println "Export repo: " url)
                                                       (export-handler/export-repo-as-zip! url)))]
                                  (-> (p/all export-repos)
                                      (p/then (fn []
                                                (store-schema!)
                                                (js/setTimeout clear-stores-and-refresh! 5000)))
                                      (p/catch (fn [error]
                                                 (log/error :export/zip {:error error
                                                                         :repos repos}))))))
                              (store-schema!))

                            (nfs/ask-permission-if-local?)

                            (page-handler/init-commands!)
                            (if (seq (:repos me))
                              ;; FIXME: handle error
                              (helper/request-app-tokens!
                               (fn []
                                 (repo-handler/clone-and-pull-repos me))
                               (fn []
                                 (js/console.error "Failed to request GitHub app tokens."))))

                            (watch-for-date!)))
                         (p/catch (fn [error]
                                    (log/error :db/restore-failed error))))))]
    ;; clear this interval
    (let [interval-id (js/setInterval inner-fn 50)]
      (reset! interval interval-id))))

(defn- handle-connection-change
  [e]
  (let [online? (= (gobj/get e "type") "online")]
    (state/set-online! online?)))

(defn set-network-watcher!
  []
  (js/window.addEventListener "online" handle-connection-change)
  (js/window.addEventListener "offline" handle-connection-change))

(defn- run-batch-txs!
  []
  (let [chan (state/get-db-batch-txs-chan)]
    (async/go-loop []
      (let [f (async/<! chan)]
        (f))
      (recur))
    chan))

(defn start!
  [render]
  (let [{:keys [me logged? repos]} (get-me-and-repos)]
    (when me (state/set-state! :me me))
    (state/set-db-restoring! true)
    (render)

    (set-network-watcher!)

    (util/indexeddb-check?
     (fn [_error]
       (notification/show! "Sorry, it seems that your browser doesn't support IndexedDB, we recommend to use latest Chrome(Chromium) or Firefox(Non-private mode)." :error false)
       (state/set-indexedb-support! false)))

    (p/let [nfs-dbs (idb/get-nfs-dbs)
            nfs-dbs (map (fn [db]
                           {:url db :nfs? true}) nfs-dbs)]
      (let [repos (cond
                    logged?
                    (concat
                     nfs-dbs
                     (:repos me))

                    (seq nfs-dbs)
                    nfs-dbs

                    :else
                    [{:url config/local-repo
                      :example? true}])]
        (state/set-repos! repos)
        (restore-and-setup! me repos logged?)))
    (run-batch-txs!)
    (file-handler/run-writes-chan!)
    (editor-handler/periodically-save!)))
