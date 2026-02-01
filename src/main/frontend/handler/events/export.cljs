(ns frontend.handler.events.export
  "Export events"
  (:require [frontend.handler.events :as events]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc indicator-progress < rum/reactive
  []
  (let [{:keys [total current-idx current-page label]} (state/sub :graph/exporting-state)
        label (or label "Exporting")
        left-label (if (and current-idx total (= current-idx total))
                     [:div.flex.flex-row.font-bold "Loading ..."]
                     [:div.flex.flex-row.font-bold
                      label
                      [:div.hidden.md:flex.flex-row
                       [:span.mr-1 ": "]
                       [:div.text-ellipsis-wrapper {:style {:max-width 300}}
                        current-page]]])
        width (js/Math.round (* (.toFixed (/ current-idx total) 2) 100))
        process (when (and total current-idx)
                  (str current-idx "/" total))]
    [:div.p-5
     (ui/progress-bar-with-label width left-label process)]))

(defmethod events/handle :dialog/export-zip [[_ label]]
  (shui/dialog-close!)
  (state/set-state! :graph/exporting :export-zip)
  (state/set-state! :graph/exporting-state {:total 100
                                            :current-idx 0
                                            :current-page label
                                            :label "Exporting"})
  (when-not (shui-dialog/get-modal :export-indicator)
    (shui/dialog-open! indicator-progress
                       {:id :export-indicator
                        :content-props
                        {:onPointerDownOutside #(.preventDefault %)
                         :onOpenAutoFocus #(.preventDefault %)}})))

(defmethod events/handle :dialog/close-export-zip [_]
  (state/set-state! :graph/exporting nil)
  (state/set-state! :graph/exporting-state nil)
  (shui/dialog-close! :export-indicator))
