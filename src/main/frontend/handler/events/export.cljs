(ns frontend.handler.events.export
  "Export events"
  (:require-macros [frontend.handler.events.macros :refer [defevent!]])
  (:require [frontend.handler.events :as events]
            [frontend.context.i18n :refer [t]]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc indicator-progress
  []
  (let [{:keys [total current-idx current-page label]} (rfx/use-sub [:graph/exporting-state])
        label (or label (t :export/exporting))
        left-label (if (and current-idx total (= current-idx total))
                     [:div.flex.flex-row.font-bold (t :ui/loading)]
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

(defevent! :dialog/export-zip [[_ label]]
  (shui/dialog-close!)
  (state/set-state! :graph/exporting :export-zip)
  (state/set-state! :graph/exporting-state {:total 100
                                            :current-idx 0
                                            :current-page label
                                            :label (t :export/exporting)})
  (when-not (shui-dialog/get-dialog :export-indicator)
    (shui/dialog-open! indicator-progress
                       {:id :export-indicator
                        :content-props
                        {:onPointerDownOutside #(.preventDefault %)
                         :onOpenAutoFocus #(.preventDefault %)}})))

(defevent! :dialog/close-export-zip [_]
  (state/set-state! :graph/exporting nil)
  (state/set-state! :graph/exporting-state nil)
  (shui/dialog-close! :export-indicator))
