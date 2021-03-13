(ns frontend.core
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.handler.route :as route]
            [frontend.page :as page]
            [frontend.routes :as routes]
            [frontend.spec]
            [frontend.log]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]
            [api]))

(defn set-router!
  []
  (rfe/start!
   (rf/router routes/routes nil)
   route/set-route-match!
   ;; set to false to enable HistoryAPI
   {:use-fragment true}))

(defn display-welcome-message
  []
  (js/console.log
   "
    Welcome to Logseq!
    If you encounter any problem, feel free to file an issue on GitHub (https://github.com/logseq/logseq)
    or join our Discord server (https://discord.gg/KpN4eHY).
    .____
    |    |    ____   ____  ______ ____  ______
    |    |   /  _ \\ / ___\\/  ___// __ \\/ ____/
    |    |__(  <_> ) /_/  >___ \\\\  ___< <_|  |
    |_______ \\____/\\___  /____  >\\___  >__   |
            \\/    /_____/     \\/     \\/   |__|
     "))

(defn start []
  (when-let [node (.getElementById js/document "root")]
    (set-router!)
    (rum/mount (page/current-page) node)
    (display-welcome-message)))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds

  (handler/start! start)

  ;; popup to notify user, could be toggled in settings
  ;; (handler/request-notifications-if-not-asked)

  ;; (handler/run-notify-worker!)
)

(defn stop []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (js/console.log "stop"))
