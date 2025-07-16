(ns mobile.core
  "Mobile core"
  (:require ["react-dom/client" :as rdc]
            [frontend.background-tasks]
            [frontend.components.page :as page]
            [frontend.handler :as fhandler]
            [frontend.handler.db-based.rtc-background-tasks]
            [frontend.handler.route :as route-handler]
            [frontend.util :as util]
            [mobile.components.app :as app]
            [mobile.events]
            [mobile.init :as init]
            [mobile.state :as state]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]))

(defonce ^js root (rdc/createRoot (.getElementById js/document "root")))

(defn ^:export render!
  []
  (.render root (app/main)))

(def routes
  [["/page/:name"
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
             (state/set-modal! {:open? true
                                :block {:block/uuid page-uuid}}))))
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
  (set-router!)
  (init/init!)
  (fhandler/start! render!))

(defn ^:export stop! []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (prn "[capacitor-new] stop!"))
