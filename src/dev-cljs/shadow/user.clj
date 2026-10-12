(ns shadow.user
  (:require [shadow.cljs.devtools.api :as api]))

(defn cljs-repl
  []
  (api/watch :app)
  (api/repl :app))

(defn electron-repl
  []
  (api/watch :electron)
  (api/repl :electron))

(defn mobile-repl
  []
  (api/watch :mobile)
  (api/repl :mobile))

(defn worker-node-repl
  ([]
   (let [runtime-id (->> (api/repl-runtimes :db-worker-node)
                         (map :client-id)
                         first)]
     (api/repl :db-worker-node {:runtime-id runtime-id})))
  ([runtime-id]
   (api/repl :db-worker-node {:runtime-id runtime-id})))

(defn runtime-id-list
  [app]
  (->> (api/repl-runtimes app)
       (filter (fn [runtime] (= :browser-worker (:host runtime))))
       (map :client-id)))
