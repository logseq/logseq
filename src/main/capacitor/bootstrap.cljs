(ns capacitor.bootstrap
  (:require [cljs-bean.core :as bean]
            [electron.listener :as el]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.db.react :as react]
            [frontend.db.restore :as db-restore]
            [frontend.error :as error]
            [capacitor.events :as events]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.plugin-config :as plugin-config-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.test :as test]
            [frontend.idb :as idb]
            [frontend.persist-db :as persist-db]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.persist-var :as persist-var]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn restore-and-setup!
  [repo]
  (when repo
    (-> (p/let [_ (db-restore/restore-graph! repo)]
          (repo-config-handler/start {:repo repo}))
      (p/then
        (fn []
          (js/console.log "db restored, setting up repo hooks")

          ; skip initialize ui commands
          ;(page-handler/init-commands!)
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
  ;(set-global-error-notification!)

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
    (-> (p/let [_ (db-browser/start-db-worker!)
                repos (repo-handler/get-repos)
                _ (state/set-repos! repos)
                ;_ (mobile-util/hide-splash) ;; hide splash as early as ui is stable
                repo (or (state/get-current-repo) (:url (first repos)))
                _ (if (empty? repos)
                    (repo-handler/new-db! config/demo-repo)
                    (restore-and-setup! repo))]

          (prn :debug-start-repos repos)
          ;(when (util/electron?)
          ;  (persist-db/run-export-periodically!))
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
