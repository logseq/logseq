(ns frontend.components.reference
  (:require [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.content :as content]
            [frontend.components.editor :as editor]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.model :as model-db]
            [frontend.handler.block :as block-handler]
            [frontend.handler.page :as page-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(defn- frequencies-sort
  [references]
  (sort-by second #(> %1 %2) references))

(rum/defcs filter-dialog-inner < rum/reactive (rum/local "" ::filterSearch)
  [state filters-atom _close-fn references page-name]
  (let [filter-search (get state ::filterSearch)
        filtered-references  (frequencies-sort
                              (if (= @filter-search "")
                                references
                                (search/fuzzy-search references @filter-search :limit 500 :extract-fn first)))]
    [:div.ls-filters.filters
     [:div.sm:flex.sm:items-start
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-gray-200.text-gray-500.sm:mx-0.sm:h-10.sm:w-10
       (ui/icon "filter" {:style {:fontSize 20}})]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left.pb-2
       [:h3#modal-headline.text-lg.leading-6.font-medium "Filter"]
       [:span.text-xs
        "Click to include and shift-click to exclude. Click again to remove."]]]
     [:div.cp__filters-input-panel.flex
      (ui/icon "search")
      [:input.cp__filters-input.w-full
       {:placeholder (t :linked-references/filter-search)
        :auto-focus true
        :on-change (fn [e]
                     (reset! filter-search (util/evalue e)))}]]
     (when (seq filtered-references)
       (let [filters (rum/react filters-atom)]
         [:div.mt-5.sm:mt-4.sm:flex.sm.gap-1.flex-wrap
          (for [[ref-name ref-count] filtered-references]
            (when ref-name
              (let [lc-reference (string/lower-case ref-name)
                    filtered (get filters lc-reference)
                    color (condp = filtered
                            true "text-green-400"
                            false "text-red-400"
                            nil)]
                [:button.border.rounded.px-1.mb-1.mr-1.select-none
                 {:key ref-name :class color :style {:border-color "currentColor"}
                  :on-click (fn [e]
                              (swap! filters-atom #(if (nil? (get filters lc-reference))
                                                     (assoc % lc-reference (not (.-shiftKey e)))
                                                     (dissoc % lc-reference)))
                              (page-handler/save-filter! page-name @filters-atom))}
                 ref-name [:sub " " ref-count]])))]))]))

(defn filter-dialog
  [filters-atom references page-name]
  (fn [close-fn]
    (filter-dialog-inner filters-atom close-fn references page-name)))

(rum/defc block-linked-references < rum/reactive db-mixins/query
  [block-id]
  (let [ref-blocks (db/get-block-referenced-blocks block-id)
        ref-hiccup (block/->hiccup ref-blocks
                                   {:id (str block-id)
                                    :ref? true
                                    :breadcrumb-show? true
                                    :group-by-page? true
                                    :editor-box editor/box}
                                   {})]
    [:div.references-blocks
     (content/content block-id
                      {:hiccup ref-hiccup})]))

(rum/defc references-inner < rum/reactive db-mixins/query
  [page-name block-id filters *filtered-ref-blocks ref-pages]
  [:div.references-blocks
   (let [ref-blocks (if block-id
                      (db/get-block-referenced-blocks block-id)
                      (db/get-page-referenced-blocks page-name))
         filtered-ref-blocks (if block-id
                               ref-blocks
                               (block-handler/get-filtered-ref-blocks ref-blocks filters ref-pages))
         ref-hiccup (block/->hiccup filtered-ref-blocks
                                    {:id page-name
                                     :ref? true
                                     :breadcrumb-show? true
                                     :group-by-page? true
                                     :editor-box editor/box
                                     :filters filters}
                                    {})]
     (reset! *filtered-ref-blocks filtered-ref-blocks)
     (content/content page-name {:hiccup ref-hiccup}))])

(rum/defc references-cp
  [repo page-entity page-name block-id filters-atom filter-state n-ref]
  (let [threshold (state/get-linked-references-collapsed-threshold)
        default-collapsed? (>= n-ref threshold)
        filters (when (seq filter-state)
                  (-> (group-by second filter-state)
                      (update-vals #(map first %))))
        *filtered-ref-blocks (atom nil)
        *collapsed? (atom nil)
        ref-pages (when-not block-id
                    (block-handler/get-blocks-refed-pages repo page-entity))]
    (ui/foldable
     [:div.flex.flex-row.flex-1.justify-between.items-center
      [:h2.font-bold.opacity-50 (str n-ref " Linked Reference"
                                     (when (> n-ref 1) "s"))]
      [:a.filter.fade-link
       {:title "Filter"
        :on-mouse-over (fn [_e]
                         (when @*collapsed? ; collapsed
                           ;; expand
                           (reset! @*collapsed? false)))
        :on-mouse-down (fn [e]
                         (util/stop-propagation e))
        :on-click (fn []
                    (let [ref-pages (map :block/original-name ref-pages)
                          references (frequencies ref-pages)]
                      (state/set-modal! (filter-dialog filters-atom references page-name)
                                        {:center? true})))}
       (ui/icon "filter" {:class (cond
                                   (empty? filter-state)
                                   ""
                                   (every? true? (vals filter-state))
                                   "text-green-400"
                                   (every? false? (vals filter-state))
                                   "text-red-400"
                                   :else
                                   "text-yellow-400")
                          :style {:fontSize 24}})]]

     (fn []
       (references-inner page-name block-id filters *filtered-ref-blocks ref-pages))

     {:default-collapsed? default-collapsed?
      :title-trigger? true
      :init-collapsed (fn [collapsed-atom]
                        (reset! *collapsed? collapsed-atom))})))

(rum/defcs references* < rum/reactive db-mixins/query
  {:init (fn [state]
           (let [page-name (first (:rum/args state))
                 filters (when page-name
                           (atom (page-handler/get-filters (string/lower-case page-name))))]
             (assoc state ::filters filters)))}
  [state page-name]
  (when page-name
    (let [page-name (string/lower-case page-name)
          page-entity (db/entity [:block/name page-name])
          repo (state/get-current-repo)
          filters-atom (get state ::filters)
          filter-state (rum/react filters-atom)
          block-id (parse-uuid page-name)
          id (if block-id
               (:db/id (db/pull [:block/uuid block-id]))
               (:db/id page-entity))
          n-ref (model-db/get-linked-references-count id)]
      (when (or (seq filter-state) (> n-ref 0))
        [:div.references.flex-1.flex-row
         [:div.content.pt-6
          (references-cp repo page-entity page-name block-id
                         filters-atom filter-state n-ref)]]))))

(rum/defc references
  [page-name]
  (ui/catch-error
   (ui/component-error "Linked References: Unexpected error. Please re-index your graph first.")
   (ui/lazy-visible
    (fn []
      (references* page-name))
    {:trigger-once? true
     :debug-id (str page-name " references")})))

(rum/defcs unlinked-references-aux
  < rum/reactive db-mixins/query
  {:wrap-render
   (fn [render-fn]
     (fn [state]
       (reset! (second (:rum/args state))
               (apply +
                      (for [[_ rfs]
                            (db/get-page-unlinked-references
                             (first (:rum/args state)))]
                        (count rfs))))
       (render-fn state)))}
  [state page-name _n-ref]
  (let [ref-blocks (db/get-page-unlinked-references page-name)]
    [:div.references-blocks
     (let [ref-hiccup (block/->hiccup ref-blocks
                                      {:id (str page-name "-unlinked-")
                                       :ref? true
                                       :group-by-page? true
                                       :editor-box editor/box}
                                      {})]
       (content/content page-name
                        {:hiccup ref-hiccup}))]))

(rum/defcs unlinked-references < rum/reactive
  (rum/local nil ::n-ref)
  [state page-name]
  (let [n-ref (get state ::n-ref)]
    (when page-name
      (let [page-name (string/lower-case page-name)]
        [:div.references.mt-6.flex-1.flex-row
         [:div.content.flex-1
          (ui/foldable
           [:h2.font-bold {:style {:opacity "0.3"}}
            (if @n-ref
              (str @n-ref " Unlinked Reference" (when (> @n-ref 1)
                                                  "s"))
              "Unlinked References")]
           (fn [] (unlinked-references-aux page-name n-ref))
           {:default-collapsed? true
            :title-trigger? true})]]))))
