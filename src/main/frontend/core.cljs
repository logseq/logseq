(ns frontend.core
  "Entry ns for the mobile, browser and electron frontend apps"
  {:dev/always true}
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.page :as page]
            [frontend.routes :as routes]
            [frontend.spec]
            [frontend.log]
            [frontend.util.persist-var :as persist-var]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]
            [logseq.api]
            [frontend.fs.sync :as sync]
            [frontend.config :as config]
            [malli.dev.cljs :as md]))

(defn set-router!
  []
  (rfe/start!
   (rf/router routes/routes nil)
   (fn [route]
     (route-handler/set-route-match! route)
     (plugin-handler/hook-plugin-app
      :route-changed (select-keys route [:template :path :parameters])))

   ;; set to false to enable HistoryAPI
   {:use-fragment true}))

(defn display-welcome-message
  []
  (js/console.log
   "
    Welcome to Logseq!
    If you encounter any problem, feel free to file an issue on GitHub (https://github.com/logseq/logseq)
    or join our forum (https://discuss.logseq.com).
    .____
    |    |    ____   ____  ______ ____  ______
    |    |   /  _ \\ / ___\\/  ___// __ \\/ ____/
    |    |__(  <_> ) /_/  >___ \\\\  ___< <_|  |
    |_______ \\____/\\___  /____  >\\___  >__   |
            \\/    /_____/     \\/     \\/   |__|
     "))

(defn start []
  (when config/dev?
    (md/start!))
  (when-let [node (.getElementById js/document "root")]
    (set-router!)
    (rum/mount (page/current-page) node)
    (display-welcome-message)
    (persist-var/load-vars)
    (when config/dev?
      (js/setTimeout #(sync/<sync-start) 1000))))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds

  (plugin-handler/setup!
   #(handler/start! start)))

(defn stop []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (handler/stop!)
  (when config/dev?
    (sync/<sync-stop))
  (js/console.log "stop"))
