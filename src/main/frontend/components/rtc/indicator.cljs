(ns frontend.components.rtc.indicator
  "RTC state indicator"
  (:require [clojure.pprint :as pprint]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.rtc-flows :as rtc-flows]
            [frontend.context.i18n :refer [locale-format-date t]]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(comment
  (def rtc-state-schema
    [:enum :open :close]))

(defonce ^:private *detail-logs
  (atom {:download-logs nil
         :upload-logs nil
         :misc-logs nil}))

(defn rtc-state->detail-info
  [state]
  {:pending-local-ops (:unpushed-block-update-count state)
   :pending-asset-ops (:pending-asset-ops-count state)
   :missing-asset-upload-files (:missing-asset-upload-files state)
   :pending-server-ops (or (:pending-server-ops-count state)
                           (when (and (number? (:remote-tx state))
                                      (number? (:local-tx state)))
                             (max 0 (- (:remote-tx state) (:local-tx state)))))
   :graph-uuid (:graph-uuid state)
   :local-tx (:local-tx state)
   :remote-tx (:remote-tx state)
   :local-checksum (:local-checksum state)
   :remote-checksum (:remote-checksum state)
   :rtc-state (if (:rtc-lock state) :open :close)})

(defn- update-detail-log!
  [k log]
  (when log
    (swap! *detail-logs update k (fn [logs] (take 5 (conj logs log))))))

(add-watch rtc-flows/rtc-download-log ::update-detail-download-log
           (fn [_ _ _ log] (update-detail-log! :download-logs log)))
(add-watch rtc-flows/rtc-upload-log ::update-detail-upload-log
           (fn [_ _ _ log] (update-detail-log! :upload-logs log)))
(add-watch rtc-flows/rtc-misc-log ::update-detail-misc-log
           (fn [_ _ _ log] (update-detail-log! :misc-logs log)))

(defn use-detail-info
  []
  (merge (rtc-state->detail-info (rfx/use-sub [:rtc/state]))
         (hooks/use-atom-value *detail-logs)))

(defn asset-transfer-counts
  [progress]
  (reduce-kv
   (fn [counts _id {:keys [direction loaded total]}]
     (if (and (contains? #{:upload :download} direction)
              (number? loaded)
              (number? total)
              (not= loaded total))
       (update counts direction inc)
       counts))
   {:upload 0
    :download 0}
   (or progress {})))

(defn asset-status-rows
  [{:keys [pending-asset-ops missing-asset-upload-files]
    transfer-counts :asset-transfer-counts}]
  (let [{:keys [upload download]} transfer-counts
        missing-count (count missing-asset-upload-files)
        pending-upload-count (max 0 (- (or pending-asset-ops 0) missing-count))]
    (cond-> []
      (pos? missing-count)
      (conj {:count missing-count
             :label-key :sync/missing-asset-files})

      (pos? pending-upload-count)
      (conj {:count pending-upload-count
             :label-key :sync/pending-asset-uploads})

      (pos? (or upload 0))
      (conj {:count upload
             :label-key :sync/assets-uploading})

      (pos? (or download 0))
      (conj {:count download
             :label-key :sync/assets-downloading}))))

(defn indicator-button-class
  [{:keys [online? rtc-state pending-local-ops pending-asset-ops pending-server-ops]}]
  (let [open? (and online? (= :open rtc-state))
        syncing? (and open? (pos? (or pending-server-ops 0)))
        idle? (and open?
                   (zero? (or pending-local-ops 0))
                   (zero? (or pending-asset-ops 0))
                   (zero? (or pending-server-ops 0)))
        queuing? (or (pos? (or pending-local-ops 0))
                     (pos? (or pending-asset-ops 0)))]
    (string/join " " (cond-> ["cloud"]
                       open? (conj "on")
                       syncing? (conj "syncing")
                       idle? (conj "idle")
                       queuing? (conj "queuing")))))

(defn- asset-status-label
  [label-key]
  (case label-key
    :sync/missing-asset-files (t :sync/missing-asset-files)
    :sync/pending-asset-uploads (t :sync/pending-asset-uploads)
    :sync/assets-uploading (t :sync/assets-uploading)
    :sync/assets-downloading (t :sync/assets-downloading)))

(hsx/defc missing-asset-files
  [files]
  (when (seq files)
    [:details.assets-missing-files
     [:summary
      (t :sync/missing-asset-files-count (count files))]
     [:div.flex.flex-col.gap-1.text-sm
      (for [{:keys [file]} files]
        [:div.flex.flex-row.gap-1.items-center
         {:key file}
         (ui/icon "alert-triangle" {:size 14})
         [:span.truncate file]])]]))

(hsx/defc assets-progressing
  [progress]
  (let [ids (->> progress
                 (keep (fn [[id {:keys [loaded total]}]]
                         (when (and (not= loaded total)
                                    (number? loaded) (number? total))
                           (uuid id))))
                 distinct
                 vec)
        [id->block set-id->block!] (hooks/use-state {})
        _ (hooks/use-effect!
           (fn []
             (p/let [results (db-async/<get-blocks (state/get-current-repo) ids {:children? false})]
               (set-id->block! (into {} (keep (fn [{:keys [block]}]
                                                (when-let [id (:block/uuid block)]
                                                  [id block]))
                                              results))))
             nil)
           [ids])
        downloading (->>
	                     (keep (fn [[id {:keys [direction loaded total]}]]
	                             (when (and (= direction :download)
	                                        (not= loaded total)
	                                        (number? loaded) (number? total))
	                               (when-let [block (get id->block (uuid id))]
	                                 {:block block
	                                  :percent (int (* 100 (/ loaded total)))}))) progress)
                     (sort-by (fn [{:keys [block]}] (:block/title block))))
        uploading (->> (keep (fn [[id {:keys [direction loaded total]}]]
	                               (when (and (= direction :upload)
	                                          (not= loaded total)
	                                          (number? loaded) (number? total))
	                                 (when-let [block (get id->block (uuid id))]
	                                   {:block block
	                                    :percent (int (* 100 (/ loaded total)))}))) progress)
                       (sort-by (fn [{:keys [block]}] (:block/title block))))]
    [:div.assets-sync-progress.flex.flex-col.gap-2
     (when (seq downloading)
       [:details
        [:summary
         (t :sync/assets-downloading-count (count downloading))]
        [:div.flex.flex-col.gap-1.text-sm
         (for [{:keys [block percent]} downloading]
           [:div.flex.flex-row.gap-1.items-center
            (ui/indicator-progress-pie percent)
            (:block/title block)])]])
     (when (seq uploading)
       [:details
        [:summary
         (t :sync/assets-uploading-count (count uploading))]
        [:div.flex.flex-col.gap-1.text-sm
         (for [{:keys [block percent]} uploading]
           [:div.flex.flex-row.gap-1.items-center
            (ui/indicator-progress-pie percent)
            (:block/title block)])]])]))

(hsx/defc details
  []
  (let [online? (rfx/use-sub [:network/online?])
        repo (state/get-current-repo)
        asset-progress (rfx/use-sub [:rtc/asset-upload-download-progress repo])
        [expand-debug? set-expand-debug!] (hooks/use-state false)
        show-checksums? (or config/dev? util/node-test?)
        detail-info (use-detail-info)
        {:keys [graph-uuid local-tx remote-tx local-checksum remote-checksum rtc-state
                download-logs upload-logs misc-logs pending-local-ops pending-asset-ops
                missing-asset-upload-files pending-server-ops]}
        detail-info
        asset-rows (asset-status-rows {:pending-asset-ops pending-asset-ops
                                       :missing-asset-upload-files missing-asset-upload-files
                                       :asset-transfer-counts (asset-transfer-counts asset-progress)})]
    [:div.rtc-info.flex.flex-col.gap-1.p-2.text-gray-11
     [:div.font-medium.mb-2 (t (if online? :sync/online :sync/offline))]
     [:div [:span.font-medium.mr-1 (or pending-local-ops 0)] (t :sync/pending-local-changes)]
     (for [{:keys [count label-key]} asset-rows]
       [:div {:key (name label-key)}
        [:span.font-medium.mr-1 count]
        (asset-status-label label-key)])
     ;; FIXME: pending-server-ops
     [:div [:span.font-medium.mr-1 (or pending-server-ops 0)] (t :sync/pending-server-changes)]
     (missing-asset-files missing-asset-upload-files)
     (assets-progressing asset-progress)
     ;; FIXME: What's the type for downloaded log?
     (when-let [latest-log (some (fn [l] (when (contains? #{:rtc.log/push-local-update} (:type l)) l)) misc-logs)]
       (when-let [time (:created-at latest-log)]
         [:div.text-sm (t :sync/last-synced-time-label (locale-format-date time))]))
     [:a.fade-link.text-sm {:on-click #(set-expand-debug! (not expand-debug?))}
      (t :sync/more-debug-info)]
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
               (and show-checksums? local-checksum) (assoc :local-checksum local-checksum)
               (and show-checksums? remote-checksum) (assoc :remote-checksum remote-checksum)
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
                     (t :sync/start-sync))])]))

(hsx/defc indicator
  []
  (let [detail-info                 (use-detail-info)
        _                           (rfx/use-sub [:auth/current-login-user])
        online?                     (rfx/use-sub [:network/online?])
        rtc-state                   (:rtc-state detail-info)
        unpushed-block-update-count (:pending-local-ops detail-info)
        pending-asset-ops           (:pending-asset-ops detail-info)
        pending-server-ops          (:pending-server-ops detail-info)
        {:keys [local-tx remote-tx]} detail-info]
    [:div.cp__rtc-sync
     [:div.hidden {"data-testid" "rtc-tx"} (pr-str {:local-tx local-tx :remote-tx remote-tx})]
     [:div.cp__rtc-sync-indicator.flex.flex-row.items-center.gap-1
      (shui/button-ghost-icon :cloud
                              {:on-click #(shui/popup-show! (.-target %)
                                                            (details)
                                                            {:align "end"
                                                             :dropdown-menu? true})
                               :class (indicator-button-class
                                       {:online? online?
                                        :rtc-state rtc-state
                                        :pending-local-ops unpushed-block-update-count
                                        :pending-asset-ops pending-asset-ops
                                        :pending-server-ops pending-server-ops})})]]))

(def ^:private *accumulated-download-logs (atom []))
(when-not config/publishing?
  (add-watch rtc-flows/rtc-download-log ::update-accumulated-download-logs
             (fn [_ _ _ log]
               (when log
                 (if (= :download-completed (:sub-type log))
                   (reset! *accumulated-download-logs [])
                   (swap! *accumulated-download-logs (fn [logs] (take 20 (conj logs log)))))))))

(def ^:private *accumulated-upload-logs (atom []))
(when-not config/publishing?
  (add-watch rtc-flows/rtc-upload-log ::update-accumulated-upload-logs
             (fn [_ _ _ log]
               (when log
                 (if (= :upload-completed (:sub-type log))
                   (reset! *accumulated-upload-logs [])
                   (swap! *accumulated-upload-logs (fn [logs] (take 20 (conj logs log)))))))))

(defn- current-graph-logs
  [logs]
  (when-let [first-log (first logs)]
    (let [graph-uuid (:graph-uuid first-log)]
      (take-while (fn [log] (= (str graph-uuid) (str (:graph-uuid log)))) logs))))

(defn- log-row-key
  [prefix idx log]
  (str prefix "-" (:graph-uuid log) "-" (:sub-type log) "-" (:message log) "-" idx))

(hsx/defc downloading-logs
  []
  (let [download-logs (current-graph-logs (hooks/use-atom-value *accumulated-download-logs))]
    (when (seq download-logs)
      [:div.flex.flex-col.gap-1
       (for [[idx log] (map-indexed vector download-logs)]
         ^{:key (log-row-key "download" idx log)}
         [:div (string/capitalize (:message log))])])))

(hsx/defc uploading-logs
  []
  (let [upload-logs (current-graph-logs (hooks/use-atom-value *accumulated-upload-logs))]
    (when (seq upload-logs)
      [:div.capitalize.flex.flex-col.gap-1
       (for [[idx log] (map-indexed vector (reverse upload-logs))]
         ^{:key (log-row-key "upload" idx log)}
         [:div (:message log)])])))

(def ^:private *downloading? (atom false))
(add-watch rtc-flows/rtc-download-log ::update-downloading?
           (fn [_ _ _ log]
             (reset! *downloading? (not= :download-completed (:sub-type log)))))

(hsx/defc downloading-detail
  []
  (when (true? (hooks/use-atom-value *downloading?))
    (shui/button
     {:class   "opacity-50"
      :variant :ghost
      :size    :sm
      :on-click #(shui/popup-show! (.-target %)
                                   (downloading-logs)
                                   {:align "end"})}
     (t :sync/downloading))))

(def ^:private *uploading? (atom false))
(add-watch rtc-flows/rtc-upload-log ::update-uploading?
           (fn [_ _ _ log]
             (reset! *uploading? (not= :upload-completed (:sub-type log)))))

(defn on-upload-finished-task
  [on-success]
  (let [watch-key (random-uuid)]
    (add-watch rtc-flows/rtc-upload-log watch-key
               (fn [_ _ _ log]
                 (when (= :upload-completed (:sub-type log))
                   (remove-watch rtc-flows/rtc-upload-log watch-key)
                   (on-success))))
    #(remove-watch rtc-flows/rtc-upload-log watch-key)))

(hsx/defc uploading-detail
  []
  (when (true? (hooks/use-atom-value *uploading?))
    (shui/button
     {:class   "opacity-50"
      :variant :ghost
      :size    :sm
      :on-click #(shui/popup-show! (.-target %)
                                   (uploading-logs)
                                   {:align "end"})}
     (t :sync/uploading))))
