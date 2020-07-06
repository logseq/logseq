(ns frontend.sentry
  (:require ["@sentry/react" :as sentry]
            [goog.object :as gobj]))

(defn init!
  []
  ((gobj/get sentry "init")
   #js {:dsn "https://636e9174ffa148c98d2b9d3369661683@o416451.ingest.sentry.io/5311485"}))
