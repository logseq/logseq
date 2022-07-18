(ns frontend.components.reference
  (:require [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.content :as content]
            [frontend.components.editor :as editor]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
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
    [:div.filters
     [:div.sm:flex.sm:items-start
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-gray-200.text-gray-500.sm:mx-0.sm:h-10.sm:w-10
       (ui/icon "filter" {:style {:fontSize 20}})]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left.pb-2
       [:h3#modal-headline.text-lg.leading-6.font-medium "Filter"]
       [:span.text-xs
        "Click to include and shift-click to exclude. Click again to remove."]]]
     [:div.cp__filters-input-panel.flex (ui/icon "search") [:input.cp__filters-input.w-full
                                                            {:placeholder (t :linked-references/filter-search)
                                                             :auto-focus true
                                                             :on-change (fn [e]
                                                                          (reset! filter-search (util/evalue e)))}]]
     (when (seq filtered-references)
       (let [filters (rum/react filters-atom)]
         [:div.mt-5.sm:mt-4.sm:flex.sm.gap-1.flex-wrap
          (for [[ref-name ref-count] filtered-references]
            (let [lc-reference (string/lower-case ref-name)
                  filtered (get filters lc-reference)
                  color (condp = filtered
                          true "text-green-400"
                          false "text-red-400"
                          nil)]
              [:button.border.rounded.px-1.mb-1.mr-1.select-none {:key ref-name :class color :style {:border-color "currentColor"}
                                                                  :on-click (fn [e]
                                                                              (swap! filters-atom #(if (nil? (get filters lc-reference))
                                                                                                     (assoc % lc-reference (not (.-shiftKey e)))
                                                                                                     (dissoc % lc-reference)))
                                                                              (page-handler/save-filter! page-name @filters-atom))}
               ref-name [:sub " " ref-count]]))]))]))

(defn filter-dialog
  [filters-atom references page-name]
  (fn [close-fn]
    (filter-dialog-inner filters-atom close-fn references page-name)))

(rum/defc block-linked-references < rum/reactive db-mixins/query
  [block-id]
  (let [refed-blocks-ids (model-db/get-referenced-blocks-ids (str block-id))]
    (when (seq refed-blocks-ids)
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
                          {:hiccup ref-hiccup})]))))

(defn- scheduled-or-deadlines?
  [page-name]
  (and (date/valid-journal-title? (string/capitalize page-name))
       (not (true? (state/scheduled-deadlines-disabled?)))
       (= (string/lower-case page-name) (string/lower-case (date/journal-name)))))

(rum/defcs references* < rum/reactive db-mixins/query
  (rum/local nil ::n-ref)
  {:init (fn [state]
           (let [page-name (first (:rum/args state))
                 filters (when page-name
                           (atom (page-handler/get-filters (string/lower-case page-name))))]
             (assoc state ::filters filters)))}
  [state page-name refed-blocks-ids]
  (when page-name
    (let [page-name (string/lower-case page-name)
          repo (state/get-current-repo)
          threshold (state/get-linked-references-collapsed-threshold)
          *n-ref (::n-ref state)
          n-ref (or (rum/react *n-ref) (count refed-blocks-ids))
          default-collapsed? (>= (count refed-blocks-ids) threshold)
          filters-atom (get state ::filters)
          filter-state (rum/react filters-atom)
          block-id (parse-uuid page-name)
          page-name (string/lower-case page-name)
          scheduled-or-deadlines (when (scheduled-or-deadlines? page-name)
                                   (db/get-date-scheduled-or-deadlines (string/capitalize page-name)))]
      (when (or (seq refed-blocks-ids)
                (seq scheduled-or-deadlines)
                (seq filter-state))
        [:div.references.flex-1.flex-row
         [:div.content.pt-6
          (when (seq scheduled-or-deadlines)
            (ui/foldable
             [:h2.font-bold.opacity-50 "SCHEDULED AND DEADLINE"]
             [:div.references-blocks.mb-6
              (let [ref-hiccup (block/->hiccup scheduled-or-deadlines
                                               {:id (str page-name "-agenda")
                                                :ref? true
                                                :group-by-page? true
                                                :editor-box editor/box}
                                               {})]
                (content/content page-name {:hiccup ref-hiccup}))]
             {:title-trigger? true}))

          (when (seq refed-blocks-ids)
            (ui/foldable
             [:div.flex.flex-row.flex-1.justify-between.items-center
              [:h2.font-bold.opacity-50 (str n-ref " Linked Reference"
                                             (when (> n-ref 1) "s"))]
              [:a.filter.fade-link
               {:title "Filter"
                :on-mouse-down (fn [e] (util/stop-propagation e))
                :on-click (fn []
                            (let [ref-blocks (if block-id
                                               (db/get-block-referenced-blocks block-id {:filter? true})
                                               (db/get-page-referenced-blocks page-name {:filter? true}))
                                  references (db/get-page-linked-refs-refed-pages repo page-name)
                                  references (->>
                                              (concat ref-blocks references)
                                              (remove nil?)
                                              (frequencies))]
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
               (let [ref-blocks (if block-id
                                  (db/get-block-referenced-blocks block-id)
                                  (db/get-page-referenced-blocks page-name))
                     filters (when (seq filter-state)
                               (-> (group-by second filter-state)
                                   (update-vals #(map first %))))
                     filtered-ref-blocks (block-handler/filter-blocks repo ref-blocks filters true)
                     n-ref (apply +
                                  (for [[_ rfs] filtered-ref-blocks]
                                    (count rfs)))]
                 (reset! *n-ref n-ref)
                 [:div.references-blocks
                  (let [ref-hiccup (block/->hiccup filtered-ref-blocks
                                                   {:id page-name
                                                    :ref? true
                                                    :breadcrumb-show? true
                                                    :group-by-page? true
                                                    :editor-box editor/box
                                                    :filters filters}
                                                   {})]
                    (content/content page-name
                                     {:hiccup ref-hiccup}))]))

             {:default-collapsed? default-collapsed?
              :title-trigger? true}))]]))))

(rum/defc references < rum/reactive db-mixins/query
  [page-name]
  (let [refed-blocks-ids (when page-name (model-db/get-referenced-blocks-ids page-name))]
    (when (or (seq refed-blocks-ids)
              (scheduled-or-deadlines? page-name))
      (ui/catch-error
       (ui/component-error "Linked References: Unexpected error")
       (ui/lazy-visible
        (fn []
          (references* page-name refed-blocks-ids))
        (str "ref-" page-name))))))

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