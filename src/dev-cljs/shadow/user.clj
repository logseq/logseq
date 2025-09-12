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

;; Get the runtime id from http://localhost:9630/runtimes, pick the one which shows `browser-worker`
(defn worker-repl
  ([]
   (let [runtime-id (->> (api/repl-runtimes :db-worker)
                         (map :client-id)
                         first)]
     (api/repl :db-worker {:runtime-id runtime-id})))
  ([runtime-id]
   (api/repl :db-worker {:runtime-id runtime-id})))

(defn runtime-id-list
  [app]
  (->> (api/repl-runtimes app)
       (filter (fn [runtime] (= :browser-worker (:host runtime))))
       (map :client-id)))
