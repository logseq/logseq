(ns frontend.components.reference
  (:require [frontend.components.block :as block]
            [frontend.components.content :as content]
            [frontend.components.editor :as editor]
            [frontend.components.reference-filters :as filters]
            [frontend.components.views :as views]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.db.frontend.view :as db-view]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

;; TODO: merge both page and block linked refs
(rum/defc block-linked-references < rum/reactive db-mixins/query
  {:init (fn [state]
           (when-let [e (db/entity [:block/uuid (first (:rum/args state))])]
             (db-async/<get-block-refs (state/get-current-repo) (:db/id e)))
           state)}
  [block-id]
  (when-let [e (db/entity [:block/uuid block-id])]
    (when-not (state/sub-async-query-loading (str (:db/id e) "-refs"))
      (let [ref-blocks (-> (db/get-referenced-blocks (:db/id e))
                           db-utils/group-by-page)]
        (when (> (count ref-blocks) 0)
          (let [ref-hiccup (block/->hiccup ref-blocks
                                           {:id (str block-id)
                                            :ref? true
                                            :breadcrumb-show? true
                                            :group-by-page? true
                                            :editor-box editor/box}
                                           {})]
            [:div.references-blocks
             (content/content block-id
                              {:hiccup ref-hiccup})]))))))

(rum/defc references-cp
  [page-entity]
  (let [filters (db-view/get-filters (db/get-db) page-entity (config/db-based-graph?))
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
                                                              (filters/filter-dialog page-entity filters ref-pages-count)])
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
      :additional-actions [reference-filter]
      :columns (views/build-columns {} [] {})})))

(rum/defc references < rum/reactive db-mixins/query
  [entity]
  (ui/catch-error
   (ui/component-error (if (config/db-based-graph? (state/get-current-repo))
                         "Linked References: Unexpected error."
                         "Linked References: Unexpected error. Please re-index your graph first."))
   (when-let [block-entity (db/sub-block (:db/id entity))]
     (references-cp block-entity))))

(rum/defc unlinked-references
  [page]
  (when page
    (views/view
     {:view-parent page
      :view-feature-type :unlinked-references
      :columns (views/build-columns {} [] {})
      :foldable-options {:default-collapsed? true}})))
