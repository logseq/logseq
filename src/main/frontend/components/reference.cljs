(ns frontend.components.reference
  (:require [frontend.components.reference-filters :as filters]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.db.common.reference :as db-reference]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]
            [promesa.core :as p]))

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
                                         (let [target (.-target e)]
                                           (p/let [ref-pages-count (or ref-pages-count
                                                                       (state/<invoke-db-worker
                                                                        :thread-api/get-linked-reference-page-count
                                                                        (state/get-current-repo)
                                                                        (:db/id page-entity)))]
                                             (shui/popup-show! target
                                                               (fn []
                                                                 [:div.p-4
                                                                  (filters/filter-dialog page-entity ref-pages-count)])
                                                               {:align "end"}))))}
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
      :config config
      :foldable-options (when (and (:linked-refs-section? config)
                                   (zero? open-blocks-level))
                          {:default-collapsed? true})})))

(hsx/defc references-cp
  [entity config]
  (let [block (db/sub-block (:db/id entity))]
       (references-aux block config)))

(hsx/defc references
  [entity config]
  (when-let [id (:db/id entity)]
    (let [[refs-total-count set-refs-total-count!] (hooks/use-state nil)]
      (hooks/use-effect!
       (fn []
         (let [cancelled? (volatile! false)]
           (set-refs-total-count! nil)
           (p/let [refs-count (or (:refs-count config)
                                  (db-async/<get-block-refs-count (state/get-current-repo) id))]
             (when-not @cancelled?
               (set-refs-total-count! refs-count)))
           #(vreset! cancelled? true)))
       [id (:refs-count config)])
      (when (pos? (or refs-total-count 0))
        (ui/catch-error
         (ui/component-error
          "Linked References: Unexpected error.")
         [:div.references
          (references-cp entity (assoc config :refs-total-count refs-total-count))])))))

(hsx/defc unlinked-references
  [entity config]
  (when-let [id (:db/id entity)]
    (let [[has-references? set-has-references!] (hooks/use-state nil)]
      (hooks/use-effect!
       (fn []
         (p/let [result (state/<invoke-db-worker :thread-api/block-refs-check
                                                 (state/get-current-repo) id {:unlinked? true})]
           (set-has-references! result)))
       [])
      (when has-references?
        (let [config (assoc config :highlight-query (:block/title entity))]
          [:div.unlinked-references
           (views/view
            {:view-parent entity
             :view-feature-type :unlinked-references
             :columns (views/build-columns config [] {})
             :foldable-options {:default-collapsed? true}
             :config config})])))))
