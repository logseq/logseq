(ns frontend.core
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.page :as page]
            [frontend.routes :as routes]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]))

(defn set-router!
  []
  (rfe/start!
   (rf/router routes/routes {})
   handler/set-route-match!
   ;; set to false to enable HistoryAPI
   {:use-fragment false}))

(defn start []
  (rum/mount
             (page/current-page)
             (.getElementById js/document "root"))
  (set-router!))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds

  ;; (handler/get-me)

  (handler/listen-to-resize)

  ;; popup to notify user, could be toggled in settings
  ;; (handler/request-notifications-if-not-asked)

  ;; (handler/run-notify-worker!)

  (start))

(defn stop []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (js/console.log "stop"))
