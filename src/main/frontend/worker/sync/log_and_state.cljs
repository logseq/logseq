(ns frontend.worker.sync.log-and-state
  "Fns to generate rtc related logs"
  (:require [frontend.worker.shared-service :as shared-service]
            [logseq.common.defkeywords :refer [defkeywords]]
            [malli.core :as ma]))

(def ^:private *rtc-log (atom nil))

(def ^:private rtc-log-type-schema
  (vec
   (concat
    [:enum]
    (take-nth
     2
     (defkeywords
       :rtc.log/upload {:doc "rtc log type for upload-graph."}
       :rtc.log/download {:doc "rtc log type for upload-graph."}
       :rtc.asset.log/upload-assets {:doc "upload local assets to remote"}
       :rtc.asset.log/download-assets {:doc "download assets from remote"}
       :rtc.asset.log/remove-assets {:doc "remove remote assets"}
       :rtc.asset.log/asset-too-large {:doc "asset is too large to upload"}
       :rtc.asset.log/initial-download-missing-assets {:doc "download assets if not exists in rtc-asset-sync initial phase"})))))

(def ^:private rtc-log-type-validator (ma/validator rtc-log-type-schema))

(defn rtc-log
  [type m]
  {:pre [(map? m) (rtc-log-type-validator type)]}
  (reset! *rtc-log (assoc m :type type :created-at (js/Date.)))
  nil)

;;; subscribe-logs, push to frontend
;;; TODO: refactor by using c.m/run-background-task
(defn- subscribe-logs
  []
  (remove-watch *rtc-log :subscribe-logs)
  (add-watch *rtc-log :subscribe-logs
             (fn [_ _ _ n] (when n (shared-service/broadcast-to-clients! :rtc-log n)))))
(subscribe-logs)
