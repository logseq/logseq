(ns frontend.components.reference
  (:require [frontend.components.reference-filters :as filters]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db.hooks :as db-hooks]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.db.common.reference :as db-reference]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc references-aux
  [page-entity config]
  (let [filters (db-reference/get-filters page-entity)
        open-blocks-level (state/get-ref-open-blocks-level)
        reference-filter (fn [{:keys [ref-pages-count]}]
                           (shui/button
                            {:title (t :reference/page-filter)
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
     {:view-parent-uuid (:block/uuid page-entity)
      :view-feature-type :linked-references
      :show-items-count? true
      :additional-actions [reference-filter]
      :columns (views/build-columns config [] {:add-page-column? true})
      :config config
      :foldable-options (when (and (:linked-refs-section? config)
                                   (zero? open-blocks-level))
                          {:default-collapsed? true})})))

(hsx/defc references
  [page-uuid config]
  (let [page-entity (db-hooks/use-block page-uuid)
        refs-total-count (db-hooks/use-resource [:block-ref-count page-uuid])]
    (when (and page-entity
               (number? refs-total-count)
               (pos? refs-total-count))
      (ui/catch-error
       (ui/component-error
        "Linked References: Unexpected error.")
       [:div.references
        (references-aux page-entity (assoc config :refs-total-count refs-total-count))]))))

(hsx/defc unlinked-references
  [page-uuid config]
  (when-let [page-entity (db-hooks/use-block page-uuid)]
    (let [config (assoc config :highlight-query (:block/title page-entity))]
      [:div.unlinked-references
       (views/view
        {:view-parent-uuid page-uuid
         :view-feature-type :unlinked-references
         :columns (views/build-columns config [] {:add-page-column? true})
         :defer-resource? true
         :config config})])))
