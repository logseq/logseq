(ns frontend.core
  (:require [rum.core :as rum]
            [frontend.git :as git]
            [frontend.fs :as fs]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler :as handler]
            [frontend.routes :as routes]
            [frontend.page :as page]
            [frontend.api :as api]))

(defn start []
  (rum/mount (page/current-page)
             (.getElementById js/document "root")))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds
  (handler/get-me)

  (handler/load-from-disk)

  (when (:cloned? @state/state)
    (handler/initial-db!)
    (handler/periodically-pull)
    (handler/periodically-push-tasks))

  (handler/listen-to-resize)

  ;; (handler/request-notifications-if-not-asked)

  ;; (handler/run-notify-worker!)

  (start))

(defn stop []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (js/console.log "stop"))
