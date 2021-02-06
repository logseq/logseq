(ns frontend.handler
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.config :as config]
            [frontend.storage :as storage]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.date :as date]
            [frontend.search :as search]
            [frontend.search.db :as search-db]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.web.nfs :as nfs]
            [frontend.fs.watcher-handler :as fs-watcher-handler]
            [frontend.ui :as ui]
            [goog.object :as gobj]
            [frontend.idb :as idb]
            [lambdaisland.glogi :as log]
            [frontend.handler.common :as common-handler]
            [electron.listener :as el]))

(defn- watch-for-date!
  []
  (let [f (fn []
            (when-not (state/nfs-refreshing?)
              (repo-handler/create-today-journal!))
            (when-let [repo (state/get-current-repo)]
              (when (and (search-db/empty? repo)
                         (state/input-idle? repo))
                (search/rebuild-indices!))))]
    (f)
    (js/setInterval f 5000)))

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

(defn restore-and-setup!
  [me repos logged?]
  (let [interval (atom nil)
        inner-fn (fn []
                   (when (and @interval js/window.pfs)
                     (js/clearInterval @interval)
                     (reset! interval nil)
                     (-> (p/all (db/restore! (assoc me :repos repos)
                                             (fn [repo]
                                               (file-handler/restore-config! repo false)
                                               (ui-handler/add-style-if-exists!))))
                         (p/then
                          (fn []
                            (cond
                              (and (not logged?)
                                   (not (seq (db/get-files config/local-repo)))
                                   ;; Not native local directory
                                   (not (some config/local-db? (map :url repos))))
                              (repo-handler/setup-local-repo-if-not-exists!)

                              :else
                              (state/set-db-restoring! false))
                            (if false   ; FIXME: incompatible changes
                              (notification/show!
                               [:p "Database schema changed, please export your notes as a zip file, and re-index your repos."]
                               :warning
                               false)
                              (store-schema!))

                            (nfs/ask-permission-if-local?)

                            (page-handler/init-commands!)
                            (when (seq (:repos me))
                              ;; FIXME: handle error
                              (common-handler/request-app-tokens!
                               (fn []
                                 (repo-handler/clone-and-pull-repos me))
                               (fn []
                                 (js/console.error "Failed to request GitHub app tokens."))))

                            (watch-for-date!)
                            (file-handler/watch-for-local-dirs!)))
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
    (reset! db/*sync-search-indice-f search/sync-search-indice!)
    (db/run-batch-txs!)
    (file-handler/run-writes-chan!)
    (editor-handler/periodically-save!)
    (when (util/electron?)
      (el/listen!))))
