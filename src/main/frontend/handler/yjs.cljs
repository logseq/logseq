(ns frontend.handler.yjs
  (:require [frontend.state :as state]
            [frontend.modules.outliner.yjs :as outliner-yjs]
            ["y-websocket" :as y-ws]
            ["yjs" :as y]))

(defn sync-current-page! []
  (let [page-name (state/get-current-page)]
    (outliner-yjs/start-sync-page page-name)
    (println "sync current page:" page-name)))

(defn current-page-syncing? []
  (let [page-name (state/get-current-page)]
    (outliner-yjs/page-syncing? page-name)))


(defonce server-address (atom nil))
(defonce server-roomname (atom nil))
(defonce username-to-display (atom nil))
(defonce server-conn (atom nil))

(defn setup-sync-server! [address roomname username]
  (when (and (seq address) (seq roomname) (seq username))
    (println "setup-sync-server! " address roomname username)
    (when @server-conn
      (.disconnect @server-conn))
    (.destroy @outliner-yjs/doc-remote)
    (.destroy @outliner-yjs/doc-local)
    (reset! outliner-yjs/doc-remote (y/Doc.))
    (reset! outliner-yjs/doc-local (y/Doc.))
    (reset! server-conn (y-ws/WebsocketProvider. address roomname @outliner-yjs/doc-remote))))


(defn server-connected? []
  (and (some? @server-conn)
       (.-wsconnected @server-conn)))
