(ns frontend.components.rtc.indicator
  "RTC state indicator"
  (:require [clojure.pprint :as pprint]
            [frontend.common.missionary :as c.m]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.flows :as flows]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [rum.core :as rum]))

(comment
  (def rtc-state-schema
    [:enum :open :close]))

(defonce ^:private *detail-info
  (atom {:pending-local-ops 0
         :pending-asset-ops 0
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
    (let [canceler (c.m/run-task ::update-detail-info
                     (m/join
                      (constantly nil)
                      (update-log-task rtc-flows/rtc-download-log-flow :download-logs)
                      (update-log-task rtc-flows/rtc-upload-log-flow :upload-logs)
                      (update-log-task rtc-flows/rtc-misc-log-flow :misc-logs)
                      (m/reduce (fn [_ state]
                                  (swap! *detail-info assoc
                                         :pending-local-ops (:unpushed-block-update-count state)
                                         :pending-asset-ops (:pending-asset-ops-count state)
                                         :graph-uuid (:graph-uuid state)
                                         :local-tx (:local-tx state)
                                         :remote-tx (:remote-tx state)
                                         :rtc-state (if (:rtc-lock state) :open :close)))
                                rtc-flows/rtc-state-flow)))]
      (reset! *update-detail-info-canceler canceler))))
(run-task--update-detail-info)

(defn- asset-upload-download-progress-flow
  [repo]
  (->> (m/watch (get @state/state :rtc/asset-upload-download-progress))
       (m/eduction
        (keep #(get % repo))
        (dedupe))))

(rum/defc assets-progressing
  []
  (let [repo (state/get-current-repo)
        progress (hooks/use-flow-state (asset-upload-download-progress-flow repo))
        downloading (->>
                     (keep (fn [[id {:keys [direction loaded total]}]]
                             (when (and (= direction :download)
                                        (not= loaded total)
                                        (number? loaded) (number? total))
                               (when-let [block (db/entity [:block/uuid (uuid id)])]
                                 {:block block
                                  :percent (int (* 100 (/ loaded total)))}))) progress)
                     (sort-by (fn [{:keys [block]}] (:block/title block))))
        uploading (->> (keep (fn [[id {:keys [direction loaded total]}]]
                               (when (and (= direction :upload)
                                          (not= loaded total)
                                          (number? loaded) (number? total))
                                 (when-let [block (db/entity [:block/uuid (uuid id)])]
                                   {:block block
                                    :percent (int (* 100 (/ loaded total)))}))) progress)
                       (sort-by (fn [{:keys [block]}] (:block/title block))))]
    [:div.assets-sync-progress.flex.flex-col.gap-2
     (when (seq downloading)
       [:details
        [:summary
         (util/format "Downloading assets (%s)" (count downloading))]
        [:div.flex.flex-col.gap-1.text-sm
         (for [{:keys [block percent]} downloading]
           [:div.flex.flex-row.gap-1.items-center
            (ui/indicator-progress-pie percent)
            (:block/title block)])]])
     (when (seq uploading)
       [:details
        [:summary
         (util/format "Uploading assets (%s)" (count uploading))]
        [:div.flex.flex-col.gap-1.text-sm
         (for [{:keys [block percent]} uploading]
           [:div.flex.flex-row.gap-1.items-center
            (ui/indicator-progress-pie percent)
            (:block/title block)])]])]))

(rum/defc details
  [online?]
  (let [[expand-debug? set-expand-debug!] (hooks/use-state false)
        {:keys [graph-uuid local-tx remote-tx rtc-state
                download-logs upload-logs misc-logs pending-local-ops pending-server-ops]}
        (hooks/use-flow-state (m/watch *detail-info))]
    [:div.rtc-info.flex.flex-col.gap-1.p-2.text-gray-11
     [:div.font-medium.mb-2 (if online? "Online" "Offline")]
     [:div [:span.font-medium.mr-1 (or pending-local-ops 0)] "pending local changes"]
     ;; FIXME: pending-server-ops
     [:div [:span.font-medium.mr-1 (or pending-server-ops 0)] "pending server changes"]
     (assets-progressing)
     ;; FIXME: What's the type for downloaded log?
     (when-let [latest-log (some (fn [l] (when (contains? #{:rtc.log/push-local-update} (:type l)) l)) misc-logs)]
       (when-let [time (:created-at latest-log)]
         [:div.text-sm "Last synced time: "
          (.toLocaleString time)]))
     [:a.fade-link.text-sm {:on-click #(set-expand-debug! (not expand-debug?))}
      "More debug info"]
     (when expand-debug?
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
             with-out-str)]])
     (when-not (= rtc-state :open)
       [:div.mt-4
        (shui/button {:variant :default
                      :size :sm
                      :on-click (fn []
                                  (rtc-handler/<rtc-start! (state/get-current-repo)
                                                           {:stop-before-start? true}))}
                     "Start sync")])]))

(rum/defc indicator
  []
  (let [detail-info                 (hooks/use-flow-state (m/watch *detail-info))
        _                           (hooks/use-flow-state flows/current-login-user-flow)
        online?                     (hooks/use-flow-state flows/network-online-event-flow)
        rtc-state                   (:rtc-state detail-info)
        unpushed-block-update-count (:pending-local-ops detail-info)
        pending-asset-ops           (:pending-asset-ops detail-info)
        {:keys [local-tx remote-tx]} detail-info]
    [:div.cp__rtc-sync
     [:div.hidden {"data-testid" "rtc-tx"} (pr-str {:local-tx local-tx :remote-tx remote-tx})]
     [:div.cp__rtc-sync-indicator.flex.flex-row.items-center.gap-1
      (shui/button-ghost-icon :cloud
                              {:on-click #(shui/popup-show! (.-target %)
                                                            (details online?)
                                                            {:align "end"
                                                             :dropdown-menu? true})
                               :class (util/classnames [{:cloud true
                                                         :on (and online? (= :open rtc-state))
                                                         :idle (and online?
                                                                    (= :open rtc-state)
                                                                    (zero? unpushed-block-update-count)
                                                                    (zero? pending-asset-ops))
                                                         :queuing (pos? unpushed-block-update-count)}])})]]))

(def ^:private *accumulated-download-logs (atom []))
(when-not config/publishing?
  (c.m/run-background-task
   ::update-accumulated-download-logs
   (m/reduce
    (fn [_ log]
      (when log
        (if (= :download-completed (:sub-type log))
          (reset! *accumulated-download-logs [])
          (swap! *accumulated-download-logs (fn [logs] (take 20 (conj logs log)))))))
    rtc-flows/rtc-download-log-flow)))

(def ^:private *accumulated-upload-logs (atom []))
(when-not config/publishing?
  (c.m/run-background-task
   ::update-accumulated-upload-logs
   (m/reduce
    (fn [_ log]
      (when log
        (if (= :upload-completed (:sub-type log))
          (reset! *accumulated-upload-logs [])
          (swap! *accumulated-upload-logs (fn [logs] (take 20 (conj logs log)))))))
    rtc-flows/rtc-upload-log-flow)))

(defn- accumulated-logs-flow
  [*acc-logs]
  (->> (m/watch *acc-logs)
       (m/eduction
        (map (fn [logs]
               (when-let [first-log (first logs)]
                 (let [graph-uuid (:graph-uuid first-log)]
                   (take-while (fn [log] (= graph-uuid (:graph-uuid log))) logs))))))))

(rum/defc downloading-logs
  []
  (let [download-logs-flow (accumulated-logs-flow *accumulated-download-logs)
        download-logs (hooks/use-flow-state download-logs-flow)]
    (when (seq download-logs)
      [:div.capitalize.flex.flex-col.gap-1
       (for [log download-logs]
         [:div (:message log)])])))

(rum/defc uploading-logs
  []
  (let [upload-logs-flow (accumulated-logs-flow *accumulated-upload-logs)
        upload-logs (hooks/use-flow-state upload-logs-flow)]
    (when (seq upload-logs)
      [:div.capitalize.flex.flex-col.gap-1
       (for [log (reverse upload-logs)]
         [:div (:message log)])])))

(def ^:private downloading?-flow
  (->> rtc-flows/rtc-download-log-flow
       (m/eduction (map (fn [log] (not= :download-completed (:sub-type log)))))
       (c.m/continue-flow false)))

(rum/defc downloading-detail
  []
  (when (true? (hooks/use-flow-state downloading?-flow))
    (shui/button
     {:class   "opacity-50"
      :variant :ghost
      :size    :sm
      :on-click #(shui/popup-show! (.-target %)
                                   (downloading-logs)
                                   {:align "end"})}
     "Downloading...")))

(def ^:private upload?-flow
  (->> rtc-flows/rtc-upload-log-flow
       (m/eduction (map (fn [log] (not= :upload-completed (:sub-type log)))))
       (c.m/continue-flow false)))

(defn on-upload-finished-task
  [on-success]
  (let [task (->> rtc-flows/rtc-upload-log-flow
                  (m/reduce (fn [_ log]
                              (when (= :upload-completed (:sub-type log))
                                (on-success)))))]
    (task (fn []) (fn []))))

(rum/defc uploading-detail
  []
  (when (true? (hooks/use-flow-state upload?-flow))
    (shui/button
     {:class   "opacity-50"
      :variant :ghost
      :size    :sm
      :on-click #(shui/popup-show! (.-target %)
                                   (uploading-logs)
                                   {:align "end"})}
     "Uploading...")))
