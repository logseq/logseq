(ns capacitor.core
  (:require ["react-dom/client" :as rdc]
            [capacitor.app :as app]
            [capacitor.components.nav-utils :as cc-utils]
            [frontend.components.page :as page]
            [frontend.components.user.login :as login]
            ;[capacitor.bootstrap :as bootstrap]
            [frontend.handler :as fhandler]
            [frontend.handler.route :as route-handler]
            [frontend.util :as util]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]))

(set! (. js/window -isCapacitorNew) true)
(defonce ^js root (rdc/createRoot (.getElementById js/document "root")))

(defn ^:export render!
  []
  (.render root (app/main)))

(def routes
  [["/login"
    {:name :user-login
     :view login/page}]

   ["/page/:name"
    {:name :page
     :view (fn [route-match]
             (page/page-cp (assoc route-match :current-page? true)))}]])

(defn set-router!
  []
  (.addEventListener js/window "popstate" route-handler/restore-scroll-pos)
  (rfe/start!
   (rf/router routes nil)
   (fn [route]
     (route-handler/set-route-match! route)
     (case (get-in route [:data :name])
       :page
       (let [id-str (get-in route [:path-params :name])]
         (when (util/uuid-string? id-str)
           (let [page-uuid (uuid id-str)]
             (cc-utils/nav-to-block! {:block/uuid page-uuid} nil))))
       :user-login
       nil
       nil))

   ;; set to false to enable HistoryAPI
   {:use-fragment true}))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds
  (prn "[capacitor-new] init!")
  ;(bootstrap/start! render!)
  (set-router!)
  (fhandler/start! render!))

(defn ^:export stop! []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (prn "[capacitor-new] stop!"))
