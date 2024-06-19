(ns frontend.components.rtc.indicator
  "RTC state indicator"
  (:require [fipp.edn :as fipp]
            [frontend.common.missionary-util :as c.m]
            [frontend.components.rtc.flows :as rtc-flows]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [rum.core :as rum]))

(comment
  (def rtc-state-schema
    [:enum :downloading :uploading :open :error]))

(defonce ^:private *detail-info
  (atom {:pending-local-ops 0     ;TODO: mock now, will update later
         :graph-uuid #uuid "c9424ea4-5aab-4957-a2bf-423631862259" ;TODO: mock for now
         :local-tx 233                  ;TODO: mock for now
         :rtc-state :open      ;TODO: mock for now, `rtc-state-schema`
         :download-logs nil
         :upload-logs nil
         :misc-logs nil}))

(defonce ^:private *update-detail-info-canceler (atom nil))
(defn- run-task--update-detail-info
  []
  (when-let [canceler @*update-detail-info-canceler]
    (canceler)
    (reset! *update-detail-info-canceler nil))
  (letfn [(update-log-task [flow k]
            (m/reduce
             (fn [_ log]
               (when log
                 (swap! *detail-info update k (fn [logs] (take 5 (conj logs log))))))
             flow))]
    (let [canceler (c.m/run-task
                    (m/join
                     (constantly nil)
                     (update-log-task rtc-flows/rtc-download-log-flow :download-logs)
                     (update-log-task rtc-flows/rtc-upload-log-flow :upload-logs)
                     (update-log-task rtc-flows/rtc-misc-log-flow :misc-logs))
                    ::update-detail-info)]
      (reset! *update-detail-info-canceler canceler))))
(run-task--update-detail-info)

(rum/defc details < rum/reactive
  []
  (let [{:keys [download-logs upload-logs misc-logs]} (rum/react *detail-info)]
    [:pre.select-text
     (-> (cond-> {}
           download-logs (assoc :download download-logs)
           upload-logs (assoc :upload upload-logs)
           misc-logs (assoc :misc misc-logs))
         (fipp/pprint {:width 20})
         with-out-str)]))

(rum/defc indicator < rum/reactive
  []
  (let [detail-info                 (rum/react *detail-info)
        _                           (state/sub :auth/id-token)
        online?                     (state/sub :network/online?)
        uploading?                  (= :uploading (:rtc-state detail-info))
        downloading?                (= :downloading (:rtc-state detail-info))
        rtc-state                   (:rtc-state detail-info)
        unpushed-block-update-count (:pending-local-ops detail-info)
        {:keys [graph-uuid]}        (state/sub :rtc/state)]
    (when (or graph-uuid downloading?)
      (if downloading?
        (shui/button
         {:variant :ghost
          :size    :sm}
         "Downloading...")
        (when (and graph-uuid (= graph-uuid (ldb/get-graph-rtc-uuid (db/get-db))))
          [:div.cp__rtc-sync
           [:div.cp__rtc-sync-indicator
            [:a.button.cloud
             {:on-click #(shui/popup-show! (.-target %)
                                           (details)
                                           {:align "end"})
              :class    (util/classnames [{:on      (and online? (= :open rtc-state))
                                           :idle    (and online? (= :open rtc-state) (zero? unpushed-block-update-count)
                                                         (not uploading?)
                                                         (not downloading?))
                                           :queuing (or uploading? downloading? (pos? unpushed-block-update-count))}])}
             [:span.flex.items-center
              (ui/icon "cloud" {:size ui/icon-size})]]]])))))
