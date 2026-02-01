(ns frontend.components.progress
  (:require [frontend.state :as state]
            [rum.core :as rum]))

(defn- progress-bar
  [width]
  [:div.w-full.rounded-full.h-2\.5.animate-pulse.bg-gray-06-alpha
   [:div.bg-gray-09-alpha.h-2\.5.rounded-full {:style {:width (str width "%")}
                                              :transition "width 1s"}]])

(rum/defc progress-indicator < rum/reactive
  []
  (let [{:keys [total current-idx current-page label]} (state/sub :graph/importing-state)
        label (or label "Processing")
        width (js/Math.round (* (.toFixed (/ (or current-idx 0) (max 1 total)) 2) 100))]
    [:div.p-5
     [:div.flex.justify-between.mb-1
      [:span.text-base label]
      [:span.text-sm.font-medium (when (and total current-idx)
                                   (str current-idx "/" total))]]
     [:div.text-xs.opacity-70.mb-2 current-page]
     (progress-bar width)]))
