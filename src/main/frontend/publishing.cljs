(ns frontend.publishing
  "Entry ns for publishing build. Provides frontend for publishing single page
  application"
  (:require [frontend.state :as state]
            [frontend.colors :as colors]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [rum.core :as rum]
            [frontend.handler.route :as route-handler]
            [frontend.page :as page]
            [clojure.string :as string]
            [frontend.routes :as routes]
            [frontend.context.i18n :as i18n]
            [reitit.frontend :as rf]
            [reitit.frontend.easy :as rfe]
            [cljs.reader :as reader]
            [frontend.components.block :as block]
            [frontend.components.editor :as editor]
            [frontend.components.page :as page-component]
            [frontend.components.reference :as reference]
            [frontend.components.whiteboard :as whiteboard]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.handler.events :as events]
            [frontend.handler.command-palette :as command-palette]))

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
;; 2. Built-in sync with GitHub Pages, you should specify a GitHub repo for publishing.

(defn- unescape-html
  [text]
  (-> text
      (string/replace "logseq____&amp;" "&")
      (string/replace "logseq____&lt;" "<")
      (string/replace "logseq____&gt;" ">")
      (string/replace "logseq____&quot;" "\"")
      (string/replace "logseq____&apos;" "'")))

(defn restore-from-transit-str!
  []
  ;; Client sets repo name (and graph type) based on what was written in app state
  (let [repo-name (-> @state/state :config keys first)]
    (state/set-current-repo! repo-name)

    (when-let [data js/window.logseq_db]
      (let [data (unescape-html data)
            db-conn (d/create-conn (conn/get-schema (state/get-current-repo)))
            _ (swap! db/conns assoc (str "logseq-db/" repo-name) db-conn)
            db (db/string->db data)]
        (reset! db-conn db)))))

(defn restore-state!
  []
  (when-let [data js/window.logseq_state]
    (let [data (reader/read-string data)]
      (swap! state/state merge data))))

(defn set-router!
  []
  (rfe/start!
   (rf/router routes/routes {})
   route-handler/set-route-match!
   ;; set to false to enable HistoryAPI
   {:use-fragment true}))

(defn start []
  (when-let [node (.getElementById js/document "root")]
    (set-router!)
    (rum/mount (page/current-page) node)))

(defn- register-components-fns!
  []
  (state/set-page-blocks-cp! page-component/page)
  (state/set-component! :block/linked-references reference/block-linked-references)
  (state/set-component! :whiteboard/tldraw-preview whiteboard/tldraw-preview)
  (state/set-component! :block/single-block block/single-block-cp)
  (state/set-component! :editor/box editor/box)
  (command-palette/register-global-shortcut-commands))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds
  (register-components-fns!)
  ;; Set :preferred-lang as some components depend on it
  (i18n/start)
  (restore-state!)
  (when-let [radix-color (state/get-color-accent)]
    (colors/set-radix radix-color))
  (restore-from-transit-str!)
  (shortcut/refresh!)
  (events/run!)
  (start))

(defn stop []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (js/console.log "stop"))
