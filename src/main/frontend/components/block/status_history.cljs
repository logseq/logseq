(ns frontend.components.block.status-history
  (:require [frontend.components.icon :as icon-component]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db.hooks :as db-hooks]
            [frontend.util.clock :as clock]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc status-history-row
  [{:keys [created-at status-uuid]}]
  (let [{status-title :block/title :as status} (db-hooks/use-block status-uuid)]
    (when status
      [:div.flex.flex-row.gap-1.items-center.text-sm.justify-between
       [:div.flex.flex-row.gap-1.items-center
        (icon-component/get-node-icon-cp status {:size 14 :color? true})
        [:div status-title]]
       [:div (date/int->local-time-2 created-at)]])))

(hsx/defc status-history-cp
  [status-history]
  (let [[sort-desc? set-sort-desc!] (hooks/use-state true)]
    [:div.p-2.text-muted-foreground.text-sm.max-h-96
     [:div.font-medium.mb-2.flex.flex-row.gap-2.items-center
      [:div (t :block/status-history)]
      (shui/button-ghost-icon (if sort-desc? :arrow-down :arrow-up)
                              {:title (t :block/sort-order)
                               :class "text-muted-foreground !h-4 !w-4"
                               :icon-props {:size 14}
                               :on-click #(set-sort-desc! (not sort-desc?))})]
     [:div.flex.flex-col.gap-1
      (for [item (if sort-desc? (reverse status-history) status-history)]
        ^{:key (str (:status-uuid item) "-" (:created-at item))}
        (status-history-row item))]]))

(hsx/defc task-spent-time-cp
  [block]
  (let [resource (db-hooks/use-resource [:block-task-time (:block/uuid block)])
        history (:history resource)
        seconds (:seconds resource)]
    (when (and seconds (pos? seconds))
      [:div.text-sm.time-spent.ml-1
       (shui/button
        {:variant :ghost
         :size :sm
         :class "text-muted-foreground !py-0 !px-1 h-6 font-normal"
         :on-click (fn [e]
                     (shui/popup-show! (.-target e)
                                       (fn [] (status-history-cp history))
                                       {:align :end}))}
        (clock/seconds->days:hours:minutes:seconds seconds))])))
