(ns frontend.components.reference-filters
  "References filters"
  (:require [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.page :as page-handler]
            [frontend.search :as search]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.db :as db]
            [datascript.impl.entity :as de]))

(defn- frequencies-sort
  [references]
  (sort-by second #(> %1 %2) references))

(defn filtered-refs
  [page filters filtered-references*]
  [:div.flex.gap-2.flex-wrap.items-center
   (let [filtered-references (if (de/entity? (first filtered-references*))
                               (map (fn [e] [(:block/title e)]) filtered-references*)
                               filtered-references*)] <
        (for [[ref-name ref-count] filtered-references]
          (when ref-name
            (let [lc-reference (string/lower-case ref-name)]
              (ui/button
               [:span
                ref-name
                (when ref-count [:sup " " ref-count])]
               :on-click (fn [e]
                           (let [db-based? (config/db-based-graph? (state/get-current-repo))
                                 includes (set (map :block/name (:included filters)))
                                 excludes (set (map :block/name (:excluded filters)))
                                 included? (includes lc-reference)
                                 not-in-filters? (and (not included?) (not (excludes lc-reference)))
                                 shift? (.-shiftKey e)]
                             (if db-based?
                               (page-handler/db-based-save-filter! page (:db/id (db/get-page lc-reference))
                                                                   {:add? not-in-filters?
                                                                    :include? (if not-in-filters? (not shift?) included?)})
                               (let [filters-m (->> (concat (map #(vector % true) includes) (map #(vector % false) excludes))
                                                    (into {}))
                                     filters' (if not-in-filters?
                                                (assoc filters-m lc-reference (not shift?))
                                                (dissoc filters-m lc-reference))]
                                 (page-handler/file-based-save-filter! page filters')))))
               :small? true
               :variant :outline
               :key ref-name)))))])

(rum/defcs filter-dialog < rum/reactive (rum/local "" ::filterSearch)
  [state page-entity *filters *references]
  (let [filters (rum/react *filters)
        filter-search (get state ::filterSearch)
        references (rum/react *references)
        filtered-references  (frequencies-sort
                              (if (= @filter-search "")
                                references
                                (search/fuzzy-search references @filter-search :limit 500 :extract-fn first)))
        {:keys [included excluded]} filters]
    [:div.ls-filters.filters
     [:div.sm:flex.sm:items-start
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-gray-200.text-gray-500.sm:mx-0.sm:h-10.sm:w-10
       (ui/icon "filter" {:size 20})]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left.pb-2
       [:h3#modal-headline.text-lg.leading-6.font-medium (t :linked-references/filter-heading)]
       [:span.text-xs
        (t :linked-references/filter-directions)]]]
     (when (or (seq included) (seq excluded))
       [:div.cp__filters.mb-4.ml-2
        (when (seq included)
          [:div.flex.flex-row.flex-wrap.center-items
           [:div.mr-1.font-medium.py-1 (t :linked-references/filter-includes)]
           (filtered-refs page-entity filters included)])
        (when (seq excluded)
          [:div.flex.flex-row.flex-wrap
           [:div.mr-1.font-medium.py-1 (t :linked-references/filter-excludes)]

           (filtered-refs page-entity filters excluded)])])
     [:div.cp__filters-input-panel.flex.focus-within:bg-gray-03
      (ui/icon "search")
      [:input.cp__filters-input.w-full.bg-transparent
       {:placeholder (t :linked-references/filter-search)
        :autofocus true
        :ref (fn [^js el] (when el
                            (-> (p/delay 32) (p/then #(.focus el)))))
        :on-change (fn [e]
                     (reset! filter-search (util/evalue e)))}]]
     (let [all-filters (set
                        (concat (map :block/name included)
                                (map :block/name excluded)))
           refs (remove (fn [[page _]] (all-filters (util/page-name-sanity-lc page)))
                        filtered-references)]
       (when (seq refs)
         [:div.mt-4
          (filtered-refs page-entity filters refs)]))]))
