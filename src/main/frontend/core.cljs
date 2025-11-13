(ns frontend.core
  "Entry ns for the mobile, browser and electron frontend apps"
  {:dev/always true}
  (:require ["react-dom/client" :as rdc]
            [frontend.background-tasks]
            [frontend.common-keywords]
            [frontend.components.plugins :as plugins]
            [frontend.config :as config]
            [frontend.fs.sync :as sync]
            [frontend.handler :as handler]
            [frontend.handler.db-based.rtc-background-tasks]
            [frontend.handler.db-based.vector-search-background-tasks]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.log]
            [frontend.page :as page]
            [frontend.routes :as routes]
            [frontend.spec]
            [lambdaisland.glogi :as log]
            [logseq.api]
            [logseq.db.frontend.kv-entity]
            [malli.dev.cljs :as md]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]))

(defn set-router!
  []
  (.addEventListener js/window "popstate" route-handler/restore-scroll-pos)
  (rfe/start!
   (rf/router (plugins/hook-custom-routes routes/routes) nil)
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

(defonce root (rdc/createRoot (.getElementById js/document "root")))

(defn ^:export start []
  (when config/dev?
    (md/start!))
  (set-router!)

  (.render ^js root (page/current-page))

  (display-welcome-message)
    ;; NO repo state here, better not add init logic here
  (when config/dev?
    (js/setTimeout #(sync/<sync-start) 1000)))

(comment
  (def d-entity-count (volatile! 0))
  (def ident->count (volatile! {}))
  (def time-sum (volatile! 0))
  (defn- setup-entity-profile!
    []
    (let [origin-d-entity d/entity]
      (set! d/entity (fn [& args]
                       (let [{r :result time :time} (util/with-time (apply origin-d-entity args))
                             k (last args)]
                         (vswap! d-entity-count inc)
                         (vswap! ident->count update k inc)
                         (vswap! time-sum #(+ time %))
                         (println @d-entity-count (:db/id r) k (get @ident->count k) @time-sum "ms")
                         r))))))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds

  ;; (setup-entity-profile!)
  (log/info ::init "App started")
  (handler/start! start))

(defn ^:export stop []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (handler/stop!)
  (when config/dev?
    (sync/<sync-stop))
  (js/console.log "stop"))

(defn ^:export delay-remount
  [delay]
  (js/setTimeout #(start) delay))
