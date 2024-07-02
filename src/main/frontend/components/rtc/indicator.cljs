(ns frontend.components.rtc.indicator
  "RTC state indicator"
  (:require [cljs-time.core :as t]
            [frontend.common.missionary-util :as c.m]
            [frontend.components.rtc.flows :as rtc-flows]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [rum.core :as rum]
            [clojure.pprint :as pprint]))

(comment
  (def rtc-state-schema
    [:enum :open :close]))

(defonce ^:private *detail-info
  (atom {:pending-local-ops 0
         :graph-uuid nil
         :local-tx nil
         :remote-tx nil
         :rtc-state :open
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
                     (update-log-task rtc-flows/rtc-misc-log-flow :misc-logs)
                     (m/reduce (fn [_ state]
                                 (swap! *detail-info assoc
                                        :pending-local-ops (:unpushed-block-update-count state)
                                        :graph-uuid (:graph-uuid state)
                                        :local-tx (:local-tx state)
                                        :remote-tx (:remote-tx state)
                                        :rtc-state (if (:rtc-lock state) :open :close)))
                               rtc-flows/rtc-state-flow))
                    ::update-detail-info)]
      (reset! *update-detail-info-canceler canceler))))
(run-task--update-detail-info)

(rum/defcs details < rum/reactive
  (rum/local false ::expand-debug-info?)
  [state online?]
  (let [*expand-debug? (::expand-debug-info? state)
        {:keys [graph-uuid local-tx remote-tx rtc-state
                download-logs upload-logs misc-logs pending-local-ops pending-server-ops]}
        (rum/react *detail-info)]
    [:div.rtc-info.flex.flex-col.gap-1.p-2.text-gray-11
     [:div.font-medium.mb-2 (if online? "Online" "Offline")]
     [:div [:span.font-medium.mr-1 (or pending-local-ops 0)] "pending local changes"]
     ;; FIXME: pending-server-ops
     [:div [:span.font-medium.mr-1 (or pending-server-ops 0)] "pending server changes"]
     ;; FIXME: What's the type for downloaded log?
     (when-let [latest-log (some (fn [l] (when (contains? #{:rtc.log/push-local-update} (:type l)) l)) misc-logs)]
       (when-let [time (:created-at latest-log)]
         [:div.text-sm "Last synced time: "
          (.toLocaleString time)]))
     [:a.fade-link.text-sm {:on-click #(swap! *expand-debug? not)}
      "More debug info"]
     (when @*expand-debug?
       [:div.rtc-info-debug
        [:pre.select-text
         (-> (cond-> {:pending-local-ops pending-local-ops}
               download-logs (assoc :download download-logs)
               upload-logs (assoc :upload upload-logs)
               misc-logs (assoc :misc misc-logs)
               graph-uuid (assoc :graph-uuid graph-uuid)
               local-tx (assoc :local-tx local-tx)
               remote-tx (assoc :remote-tx remote-tx)
               rtc-state (assoc :rtc-state rtc-state))
             pprint/pprint
             with-out-str)]])]))

(defn- downloading?
  [detail-info]
  (when-let [{:keys [created-at sub-type]} (first (:download-logs detail-info))]
    (and (not= :download-completed sub-type)
         (> 600 ;; 10min
            (/ (- (t/now) created-at) 1000)))))

(defn- uploading?
  [detail-info]
  (when-let [{:keys [created-at sub-type]} (first (:upload-logs detail-info))]
    (and (not= :upload-completed sub-type)
         (> 600
            (/ (- (t/now) created-at) 1000)))))


(rum/defc indicator < rum/reactive
          []
          (let [detail-info                 (rum/react *detail-info)
                _                           (state/sub :auth/id-token)
                online?                     (state/sub :network/online?)
                uploading?                  (uploading? detail-info)
                downloading?                (downloading? detail-info)
                rtc-state                   (:rtc-state detail-info)
                unpushed-block-update-count (:pending-local-ops detail-info)]
            [:div.cp__rtc-sync
             [:div.cp__rtc-sync-indicator.flex.flex-row.items-center.gap-1
              (when downloading?
                (shui/button
                 {:class   "opacity-50"
                  :variant :ghost
                  :size    :sm}
                 "Downloading..."))
              (when uploading?
                (shui/button
                 {:class   "opacity-50"
                  :variant :ghost
                  :size    :sm}
                 "Uploading..."))
              [:a.button.cloud
               {:on-click #(shui/popup-show! (.-target %)
                                             (details online?)
                                             {:align "end"})
                :class    (util/classnames [{:on      (and online? (= :open rtc-state))
                                             :idle    (and online? (= :open rtc-state) (zero? unpushed-block-update-count))
                                             :queuing (pos? unpushed-block-update-count)}])}
               [:span.flex.items-center
                (ui/icon "cloud" {:size ui/icon-size})]]]]))
