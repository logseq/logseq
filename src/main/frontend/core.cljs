(ns frontend.core
  "Entry ns for the mobile, browser and electron frontend apps"
  {:dev/always true}
  (:require ["react-dom/client" :as rdc]
            [frontend.background-tasks]
            [frontend.common-keywords]
            [frontend.components.plugins :as plugins]
            [frontend.config :as config]
            [frontend.handler :as handler]
            [frontend.handler.db-based.rtc-background-tasks]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.log]
            [frontend.page :as page]
            [frontend.rfx :as rfx]
            [frontend.routes :as routes]
            [frontend.runtime.globals :as runtime-globals]
            [frontend.spec]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.api]
            [logseq.db.frontend.kv-entity]
            [malli.dev.cljs :as md]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]))

(defn- build-router
  []
  (rf/router (plugins/hook-custom-routes routes/routes) nil))

(defn- on-navigate
  [route]
  (route-handler/set-route-match! route)
  (plugin-handler/hook-plugin-app
   :route-changed (select-keys route [:template :path :parameters])))

(defn refresh-router!
  "Rebuilds the reitit router so route renderers registered by plugins after
   the app started take effect. Safe to call repeatedly; `rfe/start!` stops the
   previous history instance internally."
  []
  (rfe/start!
   (build-router)
   on-navigate
   ;; set to false to enable HistoryAPI
   {:use-fragment true}))

(defonce ^:private *popstate-installed? (atom false))

(defn set-router!
  []
  (when (compare-and-set! *popstate-installed? false true)
    (.addEventListener js/window "popstate" route-handler/restore-scroll-pos))
  (refresh-router!)
  (plugin-handler/set-route-renderer-refresh-fn! refresh-router!))

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

(defonce ^:private *css-hot-reload-installed? (atom false))

(defn- app-style-link
  []
  (some
   (fn [^js link]
     (let [url (js/URL. (.-href link))]
       (when (contains? #{"css/style.css" "static/css/style.css"}
                        (subs (.-pathname url) 1))
         link)))
   (array-seq (.querySelectorAll js/document "link[rel~='stylesheet']"))))

(defn- stylesheet-signature
  [^js link]
  (some-> (.-href link)
          (js/fetch #js {:method "HEAD" :cache "no-store"})
          (.then (fn [^js response]
                   (let [headers (.-headers response)]
                     (str (.get headers "last-modified")
                          ":"
                          (.get headers "content-length")))))))

(defn- refresh-stylesheet!
  [^js link]
  (let [url (js/URL. (.-href link))]
    (.set (.-searchParams url) "v" (str (js/Date.now)))
    (set! (.-href link) (str url))))

(defn- install-css-hot-reload! []
  (when (and config/dev?
             (compare-and-set! *css-hot-reload-installed? false true))
    (let [*signature (atom nil)
          *reload-timeout (atom nil)]
      (js/setInterval
       (fn []
         (when-let [link (app-style-link)]
           (-> (stylesheet-signature link)
               (.then
                (fn [signature]
                  (when (seq signature)
                    (if (nil? @*signature)
                      (reset! *signature signature)
                      (when (not= signature @*signature)
                        (reset! *signature signature)
                        (when @*reload-timeout
                          (js/clearTimeout @*reload-timeout))
                        (reset! *reload-timeout
                                (js/setTimeout
                                 #(refresh-stylesheet! link)
                                 300)))))))
               (.catch #(js/console.warn "CSS hot reload check failed" %)))))
       1000))))

(defn ^:export start []
  (when-not (util/capacitor?)
    (when config/dev?
      (md/start!)
      (install-css-hot-reload!))
    (set-router!)

    (.render ^js root (rfx/provider (page/current-page)))

    (display-welcome-message)))

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
  (runtime-globals/install!)
  (log/info ::init "App started")
  (handler/start! start))

(defn ^:export stop []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (js/console.log "stop"))

(defn ^:export delay-remount
  [delay]
  (js/setTimeout #(start) delay))
