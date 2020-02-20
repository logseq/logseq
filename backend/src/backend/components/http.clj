(ns backend.components.http
  (:require [com.stuartsierra.component :as component]
            [io.pedestal.http :as http]))

(defn test?
  [service-map]
  (= :test (:env service-map)))

(defrecord Server [service-map service]
  component/Lifecycle
  (start [this]
    (prn "service-map: " service-map)
    (if service
      this
      (cond-> service-map
        true                      http/create-server
        (not (test? service-map)) http/start
        true                      ((partial assoc this :service)))))
  (stop [this]
    (when (and service (not (test? service-map)))
      (http/stop service))
    (assoc this :service nil)))

(defn new-server
  []
  (map->Server {}))
