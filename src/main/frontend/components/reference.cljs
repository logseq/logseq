(ns frontend.components.reference
  (:require [frontend.common.missionary :as c.m]
            [frontend.components.block :as block]
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
            [logseq.db.common.view :as db-view]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [promesa.core :as p]
            [rum.core :as rum]))

;; TODO: merge both page and block linked refs
(rum/defc block-linked-references-aux < rum/reactive db-mixins/query
  [e]
  (let [block-id (:block/uuid e)
        ref-blocks (-> (db/get-referenced-blocks (:db/id e))
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
                          {:hiccup ref-hiccup})]))))

(rum/defc block-linked-references
  [block-id]
  (when-let [e (db/entity [:block/uuid block-id])]
    (let [[loading? set-loading!] (hooks/use-state true)]
      (hooks/use-effect!
       (fn []
         (p/do!
          (db-async/<get-block-refs (state/get-current-repo) (:db/id e))
          (set-loading! false)))
       [])
      (when-not loading?
        (block-linked-references-aux e)))))

(rum/defc references-cp
  [page-entity config]
  (let [filters (db-view/get-filters (db/get-db) page-entity)
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
      :additional-actions [reference-filter]
      :columns (views/build-columns config [] {})
      :config config})))

(rum/defc references
  [entity config]
  (when-let [id (:db/id entity)]
    (let [[has-references? set-has-references!] (hooks/use-state nil)]
      (hooks/use-effect!
       #(c.m/run-task*
         (m/sp
           (let [result (c.m/<? (state/<invoke-db-worker :thread-api/block-refs-check
                                                         (state/get-current-repo) id {}))]
             (set-has-references! result))))
       [])
      (when has-references?
        (ui/catch-error
         (ui/component-error (if (config/db-based-graph? (state/get-current-repo))
                               "Linked References: Unexpected error."
                               "Linked References: Unexpected error. Please re-index your graph first."))
         (references-cp entity config))))))

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
        (views/view
         {:view-parent entity
          :view-feature-type :unlinked-references
          :columns (views/build-columns config [] {})
          :foldable-options {:default-collapsed? true}
          :config config})))))
