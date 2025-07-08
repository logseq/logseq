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
   (when-let [runtime-id (->> (api/repl-runtimes :app)
                              (filter (fn [runtime] (= :browser-worker (:host runtime))))
                              (map :client-id)
                              (apply max))]
     (worker-repl runtime-id)))
  ([runtime-id-or-which]
   (assert runtime-id-or-which "runtime-id shouldn't be empty")
   (if
    (number? runtime-id-or-which)
     (do (prn :worker-runtime-id runtime-id-or-which)
         (api/repl :app {:runtime-id runtime-id-or-which}))
     (let [runtime-ids (->> (api/repl-runtimes :app)
                            (filter (fn [runtime] (= :browser-worker (:host runtime))))
                            (map :client-id))
           runtime-id (apply (if (= :old runtime-id-or-which) min max) runtime-ids)]
       (worker-repl runtime-id)))))

(defn mobile-worker-repl
  []
  (when-let [runtime-id (->> (api/repl-runtimes :mobile)
                             (filter (fn [runtime] (= :browser-worker (:host runtime))))
                             (map :client-id)
                             (apply max))]
    (api/repl :mobile {:runtime-id runtime-id})))

(defn runtime-id-list
  [app]
  (->> (api/repl-runtimes app)
       (filter (fn [runtime] (= :browser-worker (:host runtime))))
       (map :client-id)))
