(ns frontend.components.reference
  (:require [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.content :as content]
            [frontend.components.editor :as editor]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.utils :as db-utils]
            [frontend.db.model :as model-db]
            [frontend.handler.block :as block-handler]
            [frontend.handler.page :as page-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.modules.outliner.tree :as tree]))

(defn- frequencies-sort
  [references]
  (sort-by second #(> %1 %2) references))

(defn filtered-refs
  [page-name filters filters-atom filtered-references]
  [:div.flex.gap-1.flex-wrap
   (for [[ref-name ref-count] filtered-references]
     (when ref-name
       (let [lc-reference (string/lower-case ref-name)]
         (ui/button
           [:span
            ref-name
            (when ref-count [:sup " " ref-count])]
           :on-click (fn [e]
                       (swap! filters-atom #(if (nil? (get filters lc-reference))
                                              (assoc % lc-reference (not (.-shiftKey e)))
                                              (dissoc % lc-reference)))
                       (page-handler/save-filter! page-name @filters-atom))
           :small? true
           :intent "border-link"
           :key ref-name))))])

(rum/defcs filter-dialog-inner < rum/reactive (rum/local "" ::filterSearch)
  [state filters-atom *references page-name]
  (let [filter-search (get state ::filterSearch)
        references (rum/react *references)
        filtered-references  (frequencies-sort
                              (if (= @filter-search "")
                                references
                                (search/fuzzy-search references @filter-search :limit 500 :extract-fn first)))
        filters (rum/react filters-atom)
        includes (keep (fn [[page include?]]
                         (let [page' (model-db/get-page-original-name page)]
                           (when include? [page'])))
                       filters)
        excludes (keep (fn [[page include?]]
                         (let [page' (model-db/get-page-original-name page)]
                           (when-not include? [page'])))
                       filters)]
    [:div.ls-filters.filters
     [:div.sm:flex.sm:items-start
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-gray-200.text-gray-500.sm:mx-0.sm:h-10.sm:w-10
       (ui/icon "filter" {:size 20})]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left.pb-2
       [:h3#modal-headline.text-lg.leading-6.font-medium "Filter"]
       [:span.text-xs
        "Click to include and shift-click to exclude. Click again to remove."]]]
     (when (seq filters)
       [:div.cp__filters.mb-4.ml-2
        (when (seq includes)
          [:div.flex.flex-row.flex-wrap.center-items
           [:div.mr-1.font-medium.py-1 "Includes: "]
           (filtered-refs page-name filters filters-atom includes)])
        (when (seq excludes)
          [:div.flex.flex-row.flex-wrap
           [:div.mr-1.font-medium.py-1 "Excludes: " ]
           (filtered-refs page-name filters filters-atom excludes)])])
     [:div.cp__filters-input-panel.flex
      (ui/icon "search")
      [:input.cp__filters-input.w-full
       {:placeholder (t :linked-references/filter-search)
        :auto-focus true
        :on-change (fn [e]
                     (reset! filter-search (util/evalue e)))}]]
     (let [all-filters (set (keys filters))
           refs (remove (fn [[page _]] (all-filters (util/page-name-sanity-lc page)))
                        filtered-references)]
       (when (seq refs)
         [:div.mt-4
          (filtered-refs page-name filters filters-atom refs)]))]))

(defn filter-dialog
  [filters-atom *references page-name]
  (fn []
    (filter-dialog-inner filters-atom *references page-name)))

(rum/defc block-linked-references < rum/reactive db-mixins/query
  [block-id]
  (let [e (db/entity [:block/uuid block-id])
        page? (some? (:block/name e))
        ref-blocks (if page?
                     (-> (db/get-page-referenced-blocks (:block/name e))
                         db-utils/group-by-page)
                     (db/get-block-referenced-blocks block-id))
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

(rum/defc references-inner
  [page-name filters filtered-ref-blocks]
  [:div.references-blocks
   (let [ref-hiccup (block/->hiccup filtered-ref-blocks
                                    {:id page-name
                                     :ref? true
                                     :breadcrumb-show? true
                                     :group-by-page? true
                                     :editor-box editor/box
                                     :filters filters}
                                    {})]
     (content/content page-name {:hiccup ref-hiccup}))])

(rum/defc references-cp
  [page-name filters filters-atom filter-state total filter-n filtered-ref-blocks *ref-pages]
  (let [threshold (state/get-linked-references-collapsed-threshold)
        default-collapsed? (>= total threshold)
        *collapsed? (atom nil)]
    (ui/foldable
     [:div.flex.flex-row.flex-1.justify-between.items-center
      [:h2.font-medium (str
                        (when (seq filters)
                          (str filter-n " of "))
                        total
                        " Linked Reference"
                        (when (> total 1) "s"))]
      [:a.filter.fade-link
       {:title "Filter"
        :on-mouse-over (fn [_e]
                         (when @*collapsed? ; collapsed
                           ;; expand
                           (reset! @*collapsed? false)))
        :on-mouse-down (fn [e]
                         (util/stop-propagation e))
        :on-click (fn []
                    (state/set-modal! (filter-dialog filters-atom *ref-pages page-name)
                                      {:center? true}))}
       (ui/icon "filter" {:class (cond
                                   (empty? filter-state)
                                   "opacity-60 hover:opacity-100"
                                   (every? true? (vals filter-state))
                                   "text-success"
                                   (every? false? (vals filter-state))
                                   "text-error"
                                   :else
                                   "text-warning")
                          :size  22})]]

     (fn []
       (references-inner page-name filters filtered-ref-blocks))

     {:default-collapsed? default-collapsed?
      :title-trigger? true
      :init-collapsed (fn [collapsed-atom]
                        (reset! *collapsed? collapsed-atom))})))

(defn- get-filtered-children
  [block parent->blocks]
  (let [children (get parent->blocks (:db/id block))]
    (set
     (loop [blocks children
            result (vec children)]
       (if (empty? blocks)
         result
         (let [fb (first blocks)
               children (get parent->blocks (:db/id fb))]
           (recur
            (concat children (rest blocks))
            (conj result fb))))))))

(rum/defc sub-page-properties-changed < rum/static
  [page-name v filters-atom]
  (rum/use-effect!
    (fn []
      (reset! filters-atom
              (page-handler/get-filters (util/page-name-sanity-lc page-name))))
    [page-name v filters-atom])
  [:<>])

(rum/defcs references* < rum/reactive db-mixins/query
  (rum/local nil ::ref-pages)
  {:init (fn [state]
           (let [page-name (first (:rum/args state))
                 filters (when page-name (atom nil))]
             (assoc state ::filters filters)))}
  [state page-name]
  (when page-name
    (let [page-name (util/page-name-sanity-lc page-name)
          page-props-v (state/sub-page-properties-changed page-name)
          *ref-pages (::ref-pages state)
          repo (state/get-current-repo)
          filters-atom (get state ::filters)
          filter-state (rum/react filters-atom)
          ref-blocks (db/get-page-referenced-blocks page-name)
          page-id (:db/id (db/entity repo [:block/name page-name]))
          aliases (db/page-alias-set repo page-name)
          aliases-exclude-self (set (remove #{page-id} aliases))
          top-level-blocks (filter (fn [b] (some aliases (set (map :db/id (:block/refs b))))) ref-blocks)
          top-level-blocks-ids (set (map :db/id top-level-blocks))
          filters (when (seq filter-state)
                    (-> (group-by second filter-state)
                        (update-vals #(map first %))))
          filtered-ref-blocks (->> (block-handler/filter-blocks ref-blocks filters)
                                   (block-handler/get-filtered-ref-blocks-with-parents ref-blocks))
          total (count top-level-blocks)
          filtered-top-blocks (filter (fn [b] (top-level-blocks-ids (:db/id b))) filtered-ref-blocks)
          filter-n (count filtered-top-blocks)
          parent->blocks (group-by (fn [x] (:db/id (x :block/parent))) filtered-ref-blocks)
          result (->> (group-by :block/page filtered-top-blocks)
                      (map (fn [[page blocks]]
                             (let [blocks (sort-by (fn [b] (not= (:db/id page) (:db/id (:block/parent b)))) blocks)
                                   result (map (fn [block]
                                                 (let [filtered-children (get-filtered-children block parent->blocks)
                                                       refs (when-not (contains? top-level-blocks-ids (:db/id (:block/parent block)))
                                                              (block-handler/get-blocks-refed-pages aliases (cons block filtered-children)))
                                                       block' (assoc (tree/block-entity->map block) :block/children filtered-children)]
                                                   [block' refs])) blocks)
                                   blocks' (map first result)
                                   page' (if (contains? aliases-exclude-self (:db/id page))
                                           {:db/id (:db/id page)
                                            :block/alias? true
                                            :block/journal-day (:block/journal-day page)}
                                           page)]
                               [[page' blocks'] (mapcat second result)]))))
          filtered-ref-blocks' (map first result)
          ref-pages (->>
                     (mapcat second result)
                     (map :block/original-name)
                     frequencies)]
      (reset! *ref-pages ref-pages)
      (when (or (seq filter-state) (> filter-n 0))
        [:div.references.page-linked.flex-1.flex-row
         (sub-page-properties-changed page-name page-props-v filters-atom)
         [:div.content.pt-6
          (references-cp page-name filters filters-atom filter-state total filter-n filtered-ref-blocks' *ref-pages)]]))))

(rum/defc references
  [page-name]
  (ui/catch-error
   (ui/component-error "Linked References: Unexpected error. Please re-index your graph first.")
   (ui/lazy-visible
    (fn []
      (references* page-name))
    {:debug-id (str page-name " references")})))

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
        [:div.references.page-unlinked.mt-6.flex-1.flex-row
         [:div.content.flex-1
          (ui/foldable
           [:h2.font-medium
            (if @n-ref
              (str @n-ref " Unlinked Reference" (when (> @n-ref 1)
                                                  "s"))
              "Unlinked References")]
           (fn [] (unlinked-references-aux page-name n-ref))
           {:default-collapsed? true
            :title-trigger? true})]]))))
