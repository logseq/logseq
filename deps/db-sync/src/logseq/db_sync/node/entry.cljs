(ns logseq.db-sync.node.entry
  (:require [logseq.db-sync.node.config :as config]
            [logseq.db-sync.node.server :as server]
            [promesa.core :as p]))

(defonce ^:private *server (atom nil))

(defn main [& _args]
  (let [cfg (config/normalize-config {})]
    (js/console.log "Starting Logseq sync...")
    (-> (server/start! cfg)
        (p/then (fn [result]
                  (reset! *server result)
                  (js/console.log (str "Logseq sync listening on port " (:port result)))))
        (p/catch (fn [error]
                   (js/console.error "Logseq sync failed to start" error))))))
