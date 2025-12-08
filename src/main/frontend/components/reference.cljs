(ns frontend.components.reference
  (:require [frontend.common.missionary :as c.m]
            [frontend.components.reference-filters :as filters]
            [frontend.components.views :as views]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.db.common.reference :as db-reference]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [rum.core :as rum]))

(rum/defc references-aux
  [page-entity config]
  (let [filters (db-reference/get-filters (db/get-db) page-entity)
        reference-filter (fn [{:keys [ref-pages-count]}]
                           (shui/button
                            {:title "Page filter"
                             :variant "ghost"
                             :class "text-muted-foreground !px-1"
                             :size :sm
                             :on-click (fn [e]
                                         (shui/popup-show! (.-target e)
                                                           (fn []
                                                             [:div.p-4
                                                              (filters/filter-dialog page-entity ref-pages-count)])
                                                           {:align "end"}))}
                            (ui/icon "filter-cog"
                                     {:class (cond
                                               (and (empty? (:included filters)) (empty? (:excluded filters)))
                                               ""

                                               (and (seq (:included filters)) (empty? (:excluded filters)))
                                               "text-success"

                                               (and (empty? (:included filters)) (seq (:excluded filters)))
                                               "text-error"
                                               :else
                                               "text-warning")})))]
    (views/view
     {:view-parent page-entity
      :view-feature-type :linked-references
      :show-items-count? true
      :additional-actions [reference-filter]
      :columns (views/build-columns config [] {})
      :config config})))

(rum/defc references-cp < rum/reactive db-mixins/query
  [entity config]
  (let [block (db/sub-block (:db/id entity))]
    (references-aux block config)))

(rum/defc references
  [entity config]
  (when-let [id (:db/id entity)]
    (let [[refs-total-count set-refs-total-count!] (hooks/use-state (:refs-count config))]
      (hooks/use-effect!
       #(c.m/run-task*
         (m/sp
           (when-not (:refs-count config)
             (let [result (c.m/<? (db-async/<get-block-refs-count (state/get-current-repo) id))]
               (set-refs-total-count! result)))))
       [])
      (when (> refs-total-count 0)
        (ui/catch-error
         (ui/component-error (if (config/db-based-graph? (state/get-current-repo))
                               "Linked References: Unexpected error."
                               "Linked References: Unexpected error. Please re-index your graph first."))
         [:div.references
          (references-cp entity (assoc config :refs-total-count refs-total-count))])))))

(rum/defc unlinked-references
  [entity config]
  (when-let [id (:db/id entity)]
    (let [[has-references? set-has-references!] (hooks/use-state nil)]
      (hooks/use-effect!
       #(c.m/run-task*
         (m/sp
           (let [result (c.m/<? (state/<invoke-db-worker :thread-api/block-refs-check
                                                         (state/get-current-repo) id {:unlinked? true}))]
             (set-has-references! result))))
       [])
      (when has-references?
        [:div.unlinked-references
         (views/view
          {:view-parent entity
           :view-feature-type :unlinked-references
           :columns (views/build-columns config [] {})
           :foldable-options {:default-collapsed? true}
           :config config})]))))
