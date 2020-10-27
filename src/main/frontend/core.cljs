(ns frontend.core
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.handler.route :as route]
            [frontend.page :as page]
            [frontend.routes :as routes]
            [frontend.util :as util]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]))

(defn set-router!
  []
  (rfe/start!
   (rf/router routes/routes {})
   route/set-route-match!
   ;; set to false to enable HistoryAPI
   {:use-fragment false}))

(defn start []
  (when-let [node (.getElementById js/document "root")]
    (set-router!)
    (rum/mount (page/current-page) node)))

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
