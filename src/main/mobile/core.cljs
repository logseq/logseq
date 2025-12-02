(ns mobile.core
  "Mobile core"
  (:require ["react-dom/client" :as rdc]
            [clojure.string :as string]
            [frontend.background-tasks]
            [frontend.handler :as fhandler]
            [frontend.handler.db-based.rtc-background-tasks]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [mobile.components.app :as app]
            [mobile.components.selection-toolbar :as selection-toolbar]
            [mobile.events]
            [mobile.init :as init]
            [mobile.navigation :as mobile-nav]
            [mobile.routes :refer [routes] :as mobile-routes]
            [mobile.state :as mobile-state]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]))

(defn- alert*
  [content status timeout]
  (if (string? content)
    (mobile-util/alert {:title content
                        :type (or (when (keyword? status) (name status)) "info")
                        :duration timeout
                        :position "top"})
    (log/warn ::native-alert-non-string {:content content})))

(defn- alert
  "Native mobile alert replacement for `frontend.handler.notification/show!`."
  ([content]
   (alert content :info nil nil nil nil))
  ([content status]
   (alert content status nil nil nil nil))
  ([content status clear?]
   (alert content status clear? nil nil nil))
  ([content status clear? uid]
   (alert content status clear? uid nil nil))
  ([content status clear? uid timeout]
   (alert content status clear? uid timeout nil))
  ([content status _clear? _uid timeout _close-cb]
   (alert* content status timeout)))

(set! notification/show! alert)

(set! notification/clear!
      (fn [_]
        (mobile-util/hide-alert)))

(set! notification/clear-all!
      (fn [_]
        (mobile-util/hide-alert)))

(defonce ^js root (rdc/createRoot (.getElementById js/document "root")))

(defn ^:export render!
  []
  (.render root (app/main)))

(defonce ^:private *route-timeout (atom nil))
(defn set-router!
  []
  (let [router (rf/router routes nil)]
    (rfe/start!
     router
     (fn [route]
       (when (state/get-edit-block)
         (state/clear-edit!))
       (selection-toolbar/close-selection-bar!)
       (let [route-name (get-in route [:data :name])
             path (-> js/location .-hash (string/replace-first #"^#" ""))
             pop? (= :pop @mobile-nav/navigation-source)
             timeout @*route-timeout]
         (when timeout
           (js/clearTimeout timeout))
         (mobile-nav/notify-route-change!
          {:route {:to route-name
                   :path-params (:path-params route)
                   :query-params (:query-params route)}
           :path path})

         (if pop?
           (route-handler/set-route-match! route)
           (reset! *route-timeout
                   (js/setTimeout #(route-handler/set-route-match! route) 200)))))

     ;; set to false to enable HistoryAPI
     {:use-fragment true})))

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
