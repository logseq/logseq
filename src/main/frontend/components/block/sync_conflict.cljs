(ns frontend.components.block.sync-conflict
  (:require [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.handler.notification :as notification]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- sync-conflict-attr-label
  [attr]
  (case attr
    :block/title (t :property.built-in/title)
    (name attr)))

(defn- visible-sync-conflicts
  [block conflicts]
  (->> conflicts
       (remove (fn [{:keys [attr value]}]
                 (= value (get block attr))))
       vec))

(hsx/defc sync-conflict-item
  [{:keys [id attr value created-at]}]
  [:div.border.rounded.p-3 {:key id}
   [:div.flex.flex-row.items-center.justify-between.gap-3.mb-2.text-xs.text-muted-foreground
    [:span (sync-conflict-attr-label attr)]
    [:span (date/int->local-time-2 created-at)]]
   [:pre.whitespace-pre-wrap.text-sm.bg-muted.p-2.rounded.max-h-64.overflow-auto value]
   [:div.flex.justify-end.mt-2
    (shui/button
     {:variant :secondary
      :size :sm
      :on-click (fn []
                  (util/copy-to-clipboard! value)
                  (notification/show! (t :notification/copied) :success))}
     (t :ui/copy))]])

(hsx/defc sync-conflicts-popup
  [conflicts on-mark-resolved]
  [:div.p-3.w-96
   {:style {:max-width "90vw"}}
   [:h2.text-lg.font-medium.mb-2 (t :sync/conflicts-title)]
   [:p.text-sm.text-muted-foreground.mb-3
    (t :sync/conflicts-description)]
   [:div.flex.flex-col.gap-3
    (for [conflict conflicts]
      (sync-conflict-item conflict))]
   [:div.flex.justify-end.mt-3
    (ui/button (t :sync/mark-conflicts-resolved)
               :on-click on-mark-resolved)]])

(hsx/defc sync-conflicts-warning-button
  [block]
  (let [repo (state/get-current-repo)
        block-id (:block/uuid block)
        conflicts (rfx/use-sub [:sync/block-conflicts repo (str block-id)])
        visible-conflicts (visible-sync-conflicts block conflicts)]
    (when (seq visible-conflicts)
      (ui/tooltip
       (shui/button
        {:variant :secondary
         :size :sm
         :title (t :sync/show-conflicts)
         :class "ls-sync-conflict-warning ls-small-icon px-1 !py-0 h-5"
         :on-click (fn [e]
                     (util/stop e)
                     (shui/popup-show! (.-target e)
                                       (fn []
                                         (sync-conflicts-popup
                                          visible-conflicts
                                          (fn []
                                            (p/let [_ (state/<invoke-db-worker
                                                       :thread-api/db-sync-clear-block-conflicts
                                                       repo
                                                       block-id)]
                                              (shui/popup-hide!)))))
                                       {:align :end}))}
        (ui/icon "alert-triangle" {:size 14}))
       [:div (t :sync/show-conflicts)]))))
