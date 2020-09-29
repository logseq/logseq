(ns frontend.publishing
  (:require [frontend.state :as state]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [rum.core :as rum]
            [frontend.handler.route :as route]
            [frontend.page :as page]
            [frontend.routes :as routes]
            [frontend.util :as util]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]))

;; The publishing site should be as thin as possible.
;; Both files and git libraries can be removed.
;; Maybe we can remove some handlers and components too.

(defn restore-from-transit-str!
  []
  (state/set-current-repo! "local")
  (when-let [data js/window.logseq_db]
    (let [db-conn (d/create-conn db-schema/schema)
          _ (swap! db/conns assoc "local" db-conn)
          db (string->db logseq_db)]
      (reset! db-conn db))))

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

  (db/restore-from-transit-str!)
  (start))

(defn stop []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (js/console.log "stop"))
