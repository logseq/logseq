(ns frontend.handler
  (:require [cljs-bean.core :as bean]
            [electron.ipc :as ipc]
            [electron.listener :as el]
            [frontend.components.editor :as editor]
            [frontend.components.page :as page]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [frontend.handler.common :as common-handler]
            [frontend.handler.events :as events]
            [frontend.handler.file :as file-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.command-palette :as command-palette]
            [frontend.idb :as idb]
            [frontend.modules.instrumentation.core :as instrument]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.search :as search]
            [frontend.search.db :as search-db]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.version :as version]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.ui :as ui]
            [frontend.error :as error]
            [frontend.util.pool :as pool]))

(defn set-global-error-notification!
  []
  (set! js/window.onerror
        (fn [message, source, lineno, colno, error]
          (when-not (error/ignored? message)
            (js/console.error error)
            ;; (notification/show!
            ;;  (str "message=" message "\nsource=" source "\nlineno=" lineno "\ncolno=" colno "\nerror=" error)
            ;;  :error
            ;;  ;; Don't auto-hide
            ;;  false)
            ))))

(defn- watch-for-date!
  []
  (let [f (fn []
            (when-not (state/nfs-refreshing?)
              ;; Don't create the journal file until user writes something
              (page-handler/create-today-journal!))
            (when-let [repo (state/get-current-repo)]
              (when (and (search-db/empty? repo)
                         (state/input-idle? repo))
                (search/rebuild-indices!))))]
    (f)
    (js/setInterval f 5000)))

(defn store-schema!
  []
  (storage/set :db-schema (assoc db-schema/schema
                                 :db/version db-schema/version)))

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

(defn restore-and-setup!
  [me repos logged? old-db-schema]
  (let [interval (atom nil)
        inner-fn (fn []
                   (when (and @interval js/window.pfs)
                     (js/clearInterval @interval)
                     (reset! interval nil)
                     (-> (p/all (db/restore!
                                 (assoc me :repos repos)
                                 old-db-schema
                                 (fn [repo]
                                   (file-handler/restore-config! repo false))))
                         (p/then
                          (fn []
                            ;; try to load custom css only for current repo
                            (ui-handler/add-style-if-exists!)

                            ;; install after config is restored
                            (shortcut/refresh!)

                            (cond
                              (and (not logged?)
                                   (not (seq (db/get-files config/local-repo)))
                                   ;; Not native local directory
                                   (not (some config/local-db? (map :url repos))))
                              (repo-handler/setup-local-repo-if-not-exists!)

                              :else
                              (state/set-db-restoring! false))

                            (store-schema!)

                            (state/pub-event! [:modal/nfs-ask-permission])

                            (page-handler/init-commands!)

                            (when (seq (:repos me))
                              ;; FIXME: handle error
                              (common-handler/request-app-tokens!
                               (fn []
                                 (repo-handler/clone-and-pull-repos me))
                               (fn []
                                 (js/console.error "Failed to request GitHub app tokens."))))

                            (watch-for-date!)
                            (file-handler/watch-for-local-dirs!)
                            ;; (when-not (state/logged?)
                            ;;   (state/pub-event! [:after-db-restore repos]))
                            ))
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

(defn- get-repos
  []
  (let [logged? (state/logged?)
        me (state/get-me)]
    (p/let [nfs-dbs (idb/get-nfs-dbs)
            nfs-dbs (map (fn [db]
                           {:url db :nfs? true}) nfs-dbs)]
      (cond
        logged?
        (concat
         nfs-dbs
         (:repos me))

        (seq nfs-dbs)
        nfs-dbs

        :else
        [{:url config/local-repo
          :example? true}]))))

(defn on-load-events
  []
  (set! js/window.onload
        (fn []
          (instrument/init))))

(defn clear-cache!
  []
  (p/let [_ (idb/clear-local-storage-and-idb!)
          _ (when (util/electron?)
              (ipc/ipc "clearCache"))]
    (js/setTimeout #(js/window.location.reload %) 3000)))

(defn- register-components-fns!
  []
  (state/set-page-blocks-cp! page/page-blocks-cp)
  (state/set-editor-cp! editor/box)
  (command-palette/register-global-shortcut-commands))

(defn start!
  [render]
  (set-global-error-notification!)
  (let [db-schema (storage/get :db-schema)
        {:keys [me logged? repos]} (get-me-and-repos)]
    (when me (state/set-state! :me me))
    (register-components-fns!)
    (state/set-db-restoring! true)
    (render)
    (on-load-events)
    (set-network-watcher!)

    (util/indexeddb-check?
     (fn [_error]
       (notification/show! "Sorry, it seems that your browser doesn't support IndexedDB, we recommend to use latest Chrome(Chromium) or Firefox(Non-private mode)." :error false)
       (state/set-indexedb-support! false)))

    (events/run!)

    (p/let [repos (get-repos)]
      (state/set-repos! repos)
      (restore-and-setup! me repos logged? db-schema))

    (reset! db/*sync-search-indice-f search/sync-search-indice!)
    (db/run-batch-txs!)
    (file-handler/run-writes-chan!)
    (pool/init-parser-pool!)
    (when (util/electron?)
      (el/listen!))))

(defn stop! []
  (prn "stop!"))
