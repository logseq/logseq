(ns mobile.core
  "Mobile core"
  (:require ["react-dom/client" :as rdc]
            [frontend.background-tasks]
            [frontend.components.page :as page]
            [frontend.db.async :as db-async]
            [frontend.handler :as fhandler]
            [frontend.handler.db-based.rtc-background-tasks]
            [frontend.state :as state]
            [frontend.util :as util]
            [mobile.components.app :as app]
            [mobile.events]
            [mobile.init :as init]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]))

(defonce ^js root (rdc/createRoot (.getElementById js/document "root")))

(defn ^:export render!
  []
  (.render root (app/main)))

(def routes
  [["/"
    {:name :home}]
   ["/page/:name"
    {:name :page
     :view (fn [route-match]
             (page/page-cp (assoc route-match :current-page? true)))}]])

(defn set-router!
  []
  (rfe/start!
   (rf/router routes nil)
   (fn [route]
     (when (= :page (get-in route [:data :name]))
       (let [id-str (get-in route [:path-params :name])]
         (when (util/uuid-string? id-str)
           (let [page-uuid (uuid id-str)
                 repo (state/get-current-repo)]
             (when (and repo page-uuid)
               (p/let [entity (db-async/<get-block repo page-uuid
                                                   {:children? false
                                                    :skip-refresh? true})]
                 (when entity
                   (mobile-state/open-block-modal! entity)))))))))

   ;; set to false to enable HistoryAPI
   {:use-fragment true}))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds
  (prn "[Mobile] init!")
  (set-router!)
  (init/init!)
  (fhandler/start! render!))

(defn ^:export stop! []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (prn "[Mobile] stop!"))
