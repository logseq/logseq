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

;; Get the runtime id from http://localhost:9630/runtimes, pick the one which shows `browser-worker`
(defn worker-repl
  ([]
   (when-let [runtime-id (->> (api/repl-runtimes :app)
                              (filter (fn [runtime] (= :browser-worker (:host runtime))))
                              first
                              :client-id)]
     (prn :worker-runtime-id runtime-id)
     (worker-repl runtime-id)))
  ([runtime-id]
   (assert runtime-id "runtime-id shouldn't be empty")
   (api/repl :app {:runtime-id runtime-id})))

(defn runtime-id-list
  []
  (->> (api/repl-runtimes :app)
       (filter (fn [runtime] (= :browser-worker (:host runtime))))
       (map :client-id)))
