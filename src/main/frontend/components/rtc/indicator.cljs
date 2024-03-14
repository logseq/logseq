(ns frontend.components.rtc.indicator
  "RTC state indicator"
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]
            [frontend.state :as state]
            [frontend.util :as util]))

(rum/defc details
  [{:keys [unpushed-block-update-count]}]
  [:div.cp__rtc-sync-details.text-sm
   (cond
     (zero? unpushed-block-update-count)
     "All local changes have been synced."
     (pos? unpushed-block-update-count)
     (str "Unsaved local changes: " unpushed-block-update-count))])

(rum/defc indicator < rum/reactive
  []
  (let [_                       (state/sub :auth/id-token)
        online?                 (state/sub :network/online?)
        {:keys [rtc-state unpushed-block-update-count] :as state}
        (state/sub :rtc/state)]
    [:div.cp__rtc-sync
     [:div.cp__rtc-sync-indicator
      [:a.button.cloud
       {:on-click #(shui/popup-show! (.-target %)
                                     (details state)
                                     {:align "end"})
        :class    (util/classnames [{:on (and online? (= :open rtc-state))
                                     :idle (and online? (= :open rtc-state) (zero? unpushed-block-update-count))
                                     :queuing (pos? unpushed-block-update-count)}])}
       [:span.flex.items-center
        (ui/icon "cloud" {:size ui/icon-size})]]]]))
