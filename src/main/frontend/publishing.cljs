(ns frontend.publishing
  (:require [frontend.state :as state]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [rum.core :as rum]
            [frontend.handler.route :as route]
            [frontend.page :as page]
            [frontend.routes :as routes]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]
            [cljs.reader :as reader]
            [frontend.db.utils :as db-utils]
            [frontend.db.declares :as declares]))

;; The publishing site should be as thin as possible.
;; Both files and git libraries can be removed.
;; Maybe we can remove some handlers and components too.

;; There should be two publishing modes:
;; 1. Graph version, similar to logseq.com
;; 2. Traditional blog version, much faster to load
;; We might host the pages or blocks directly on logseq.com in the future.

;; How to publish?
;; 1. When you click a publish button, it'll downloads a zip which includes the
;;    html, css, javascript and other files (image, mp3, etc.), the serialized
;;    data should include all the public pages and blocks.
;; 2. Built-in sync with Github Pages, you should specify a Github repo for publishing.

(defn restore-from-transit-str!
  []
  (state/set-current-repo! "local")
  (when-let [data js/window.logseq_db]
    (let [data (js/JSON.stringify data)
          db-conn (d/create-conn db-schema/schema)
          _ (swap! declares/conns assoc "logseq-db/local" db-conn)
          db (db-utils/string->db data)]
      (reset! db-conn db))))

(defn restore-state!
  []
  (when-let [data js/window.logseq_state]
    (let [data (reader/read-string data)]
      (swap! state/state merge data))))

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
  (restore-from-transit-str!)
  (restore-state!)
  (start))

(defn stop []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (js/console.log "stop"))
