(ns backend.core
  (:require [backend.config :as config]
            [backend.system :as system]
            [taoensso.timbre :as timbre]
            [taoensso.timbre.appenders.core :as appenders]
            [com.stuartsierra.component :as component]))

(defn set-logger!
  [log-path]
  (timbre/merge-config! (cond->
                          {:appenders {:spit (appenders/spit-appender {:fname log-path})}}
                          config/production?
                          (assoc :output-fn (partial timbre/default-output-fn {:stacktrace-fonts {}})))))

(defn start []
  (System/setProperty "https.protocols" "TLSv1.2,TLSv1.1,SSLv3")
  (set-logger! (:log-path config/config))

  (let [system (system/new-system config/config)]
    (component/start system))
  (println "server running in port 3000"))
