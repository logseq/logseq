(ns capacitor.handler
  (:require [cljs-bean.core :as bean]
            ;[electron.ipc :as ipc]
            [electron.listener :as el]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.db.react :as react]
            [frontend.db.restore :as db-restore]
            [frontend.error :as error]
            [capacitor.events :as events]
            ;[frontend.handler.events :as events]
            ;[frontend.handler.file-based.events]
            ;[frontend.handler.file-based.file :as file-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin-config :as plugin-config-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.test :as test]
            ;[frontend.handler.ui :as ui-handler]
            ;[frontend.handler.user :as user-handler]
            [frontend.idb :as idb]
            ;[frontend.mobile.core :as mobile]
            ;[frontend.mobile.util :as mobile-util]
            ;[frontend.modules.shortcut.core :as shortcut]
            [frontend.persist-db :as persist-db]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.persist-var :as persist-var]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- set-global-error-notification!
  []
  (when-not config/dev?
    (set! js/window.onerror
      (fn [message, _source, _lineno, _colno, error]
        (when-not (error/ignored? message)
          (js/console.error message)
          (log/error :exception error))))))

;(defn- watch-for-date!
;  []
;  (let [f (fn []
;            (let [repo (state/get-current-repo)]
;              (when (or
;                      (config/db-based-graph? repo)
;                      (and (not (state/nfs-refreshing?))
;                        (not (contains? (:file/unlinked-dirs @state/state)
;                               (config/get-repo-dir repo)))))
;                ;; Don't create the journal file until user writes something
;                (page-handler/create-today-journal!))))]
;    (f)
;    (js/setInterval f 5000)))

(defn restore-and-setup!
  [repo]
  (when repo
    (-> (p/let [_ (db-restore/restore-graph! repo)]
          (repo-config-handler/start {:repo repo}))
      (p/then
        (fn []
          ;; try to load custom css only for current repo
          ;(ui-handler/add-style-if-exists!)

          (->
            (p/do!
              (when (config/global-config-enabled?)
                (global-config-handler/start {:repo repo}))
              (when (config/plugin-config-enabled?)
                (plugin-config-handler/start)))
            (p/finally
              (fn []
                ;; install after config is restored
                ;(shortcut/refresh!)

                (state/set-db-restoring! false))))))
      (p/then
        (fn []
          (js/console.log "db restored, setting up repo hooks")

          ;(state/pub-event! [:modal/nfs-ask-permission])

          (page-handler/init-commands!)

          ;(watch-for-date!)
          ;(when (and (not (config/db-based-graph? repo)) (util/electron?))
          ;  (file-handler/watch-for-current-graph-dir!))
          ))
      (p/catch (fn [error]
                 (log/error :exception error))))))

(defn- handle-connection-change
  [e]
  (let [online? (= (gobj/get e "type") "online")]
    (state/set-online! online?)))

(defn set-network-watcher!
  []
  (js/window.addEventListener "online" handle-connection-change)
  (js/window.addEventListener "offline" handle-connection-change))

;(defn- get-system-info
;  []
;  (when (util/electron?)
;    (p/let [info (ipc/ipc :system/info)]
;      (state/set-state! :system/info (bean/->clj info)))))

(defn start!
  [render]

  (idb/start)
  ;(get-system-info)
  (set-global-error-notification!)

  ;(user-handler/restore-tokens-from-localstorage)
  (state/set-db-restoring! true)

  (render)

  (i18n/start)

  (state/set-online! js/navigator.onLine)
  (set-network-watcher!)

  (-> (util/indexeddb-check?)
    (p/catch (fn [_e]
               (notification/show! "Sorry, it seems that your browser doesn't support IndexedDB, we recommend to use latest Chrome(Chromium) or Firefox(Non-private mode)." :error false)
               (state/set-indexedb-support! false))))

  (react/run-custom-queries-when-idle!)

  (events/run!)

  (p/do!
    ;(when (mobile-util/native-platform?)
    ;  (mobile/mobile-preinit))
    (-> (p/let [_ (db-browser/start-db-worker!)
                repos (repo-handler/get-repos)
                _ (state/set-repos! repos)
                ;_ (mobile-util/hide-splash) ;; hide splash as early as ui is stable
                repo (or (state/get-current-repo) (:url (first repos)))
                _ (if (empty? repos)
                    (repo-handler/new-db! config/demo-repo)
                    (restore-and-setup! repo))]
          (when (util/electron?)
            (persist-db/run-export-periodically!))
          ;(when (mobile-util/native-platform?)
          ;  (state/restore-mobile-theme!))
          )
      (p/catch (fn [e]
                 (js/console.error "Error while restoring repos: " e)))
      (p/finally (fn []
                   (state/set-db-restoring! false))))

    (util/<app-wake-up-from-sleep-loop (atom false))

    (persist-var/load-vars)))

(defn stop! []
  (prn "stop!"))
