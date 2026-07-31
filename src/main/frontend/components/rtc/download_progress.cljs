(ns frontend.components.rtc.download-progress
  (:require [frontend.components.rtc.indicator :as indicator]
            [frontend.context.i18n :refer [t]]
            [frontend.mobile.util :as mobile-util]
            [logseq.shui.ui :as shui]))

(defn- content
  [graph-name]
  [:div.flex.flex-col.items-center.justify-center.gap-4
   [:div (t :sync/downloading-graph graph-name)]
   (indicator/downloading-logs)])

(defn show!
  [graph-name]
  (if (mobile-util/native-platform?)
    (shui/popup-show!
     nil
     #(content graph-name)
     {:id :download-rtc-graph})
    (shui/dialog-open!
     #(content graph-name)
     {:id :download-rtc-graph
      :content-props
      {:onPointerDownOutside #(.preventDefault %)
       :onOpenAutoFocus #(.preventDefault %)}})))

(defn hide!
  []
  (if (mobile-util/native-platform?)
    (shui/popup-hide! :download-rtc-graph)
    (shui/dialog-close! :download-rtc-graph)))
