(ns mobile.core
  "Mobile core"
  (:require ["react-dom/client" :as rdc]
            [frontend.background-tasks]
            [frontend.components.imports :as imports]
            [frontend.db.async :as db-async]
            [frontend.handler :as fhandler]
            [frontend.handler.db-based.rtc-background-tasks]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.shui.ui :as shui]
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
    {:name :page}]
   ["/graphs"
    {:name :graphs}]
   ["/import"
    {:name :import}]])

(defn set-router!
  []
  (rfe/start!
   (rf/router routes nil)
   (fn [route]
     (let [route-name (get-in route [:data :name])]
       (case route-name
         :page
         (let [id-str (get-in route [:path-params :name])]
           (when (util/uuid-string? id-str)
             (let [page-uuid (uuid id-str)
                   repo (state/get-current-repo)]
               (when (and repo page-uuid)
                 (p/let [entity (db-async/<get-block repo page-uuid
                                                     {:children? false
                                                      :skip-refresh? true})]
                   (when entity
                     ;; close sidebar
                     (when (mobile-state/left-sidebar-open?)
                       (mobile-state/close-left-sidebar!))
                     (when (state/get-edit-block)
                       (state/clear-edit!))
                     (when (mobile-state/quick-add-open?)
                       (mobile-state/close-popup!))
                     (mobile-state/open-block-modal! entity)))))))

         :graphs
         (mobile-state/redirect-to-tab! "settings")

         :import
         (shui/popup-show! nil (fn []
                                 (imports/importer {}))
                           {:id :import})

         nil)))

   ;; set to false to enable HistoryAPI
   {:use-fragment true}))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds
  (prn "[Mobile] init!")
  (log/add-handler mobile-state/log-append!)
  (set-router!)
  (init/init!)
  (fhandler/start! render!))

(defn ^:export stop! []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (prn "[Mobile] stop!"))
