(ns frontend.handler.db-based.rtc-background-tasks
  "Background tasks related to RTC"
  (:require [cljs-time.core :as t]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- add-watch-when-not-publishing!
  [atom' key' f]
  (when-not config/publishing?
    (remove-watch atom' key')
    (add-watch atom' key' (fn [_ _ _ value] (f value)))))

(add-watch-when-not-publishing!
 rtc-flows/rtc-try-restart
 ::restart-rtc-to-reconnect
 (fn [{:keys [graph-uuid t]}]
   (when (and graph-uuid t
              (= graph-uuid (ldb/get-graph-rtc-uuid (db/get-db)))
              (> 5000 (- (common-util/time-ms) t)))
     (log/info :trying-to-restart-rtc graph-uuid :t (t/now))
     (rtc-handler/<rtc-start! (state/get-current-repo) :stop-before-start? false))))

(add-watch-when-not-publishing!
 rtc-flows/logout
 ::stop-rtc-if-needed
 (fn [event]
   (when (= :logout event)
     (log/info :try-to-stop-rtc-if-needed :logout)
     (rtc-handler/<rtc-stop!))))

(add-watch-when-not-publishing!
 rtc-flows/trigger-start-rtc
 ::auto-start-rtc-if-possible
 (fn [[start-reason repo]]
   (log/info :try-to-start-rtc [start-reason repo])
   (p/do! (rtc-handler/<rtc-start! (or repo (state/get-current-repo))))))
