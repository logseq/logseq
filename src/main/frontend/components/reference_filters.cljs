(ns frontend.components.reference-filters
  "References filters"
  (:require [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.page :as page-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.db.common.reference :as db-reference]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]))

(defn- frequencies-sort
  [references]
  (sort-by second #(> %1 %2) references))

(hsx/defc ref-button
  [page filters ref-name ref-count]
  (let [lc-reference (string/lower-case ref-name)]
    (ui/button
	     [:span
	      ref-name
	      (when ref-count [:sup " " ref-count])]
	     :on-click (fn [e]
	                 (let [includes (set (map :block/name (:included filters)))
	                       excludes (set (map :block/name (:excluded filters)))
	                       included? (includes lc-reference)
	                       not-in-filters? (and (not included?) (not (excludes lc-reference)))
	                       shift? (.-shiftKey e)]
	                   (p/let [ref-page (state/<invoke-db-worker :thread-api/pull
	                                                             (state/get-current-repo)
	                                                             [:db/id]
	                                                             [:block/name lc-reference])]
	                     (page-handler/db-based-save-filter! page (:db/id ref-page)
	                                                         {:add? not-in-filters?
	                                                          :include? (if not-in-filters? (not shift?) included?)}))))
     :small? true
     :variant :outline)))

(defn filtered-refs
  [page filters filtered-references* virtual?]
  (let [filtered-references (if (:db/id (first filtered-references*))
                              (map (fn [e] [(:block/title e)]) filtered-references*)
                              filtered-references*)]
    (if (and (> (count filtered-references) 100)
             (not (false? virtual?)))
      (ui/virtualized-list
       {:style {:height 500
                :width 500
                :max-width 500}
        :total-count (count filtered-references)
        :compute-item-key (fn [idx]
                            (str "ref-button-" idx))
        :item-content (fn [idx]
                        (let [[ref-name ref-count] (util/nth-safe filtered-references idx)]
                          (ref-button page filters ref-name ref-count)))})
      [:div.flex.gap-2.flex-wrap.items-center
       {:style {:width 500
                :max-width 500}}
       (for [[ref-name ref-count] filtered-references]
         ^{:key (str "ref-" ref-name)}
         [ref-button page filters ref-name ref-count])])))

(hsx/defc filter-dialog-aux
  [page-entity references]
  (let [[filter-search set-filter-search!] (hooks/use-state "")
        [filtered-references set-filtered-references!] (hooks/use-state references)
        filters (db-reference/get-filters page-entity)
        {:keys [included excluded]} filters]
    (hooks/use-effect!
     (fn []
       (let [references (if (= filter-search "")
                          references
                          (->> (search/fuzzy-search references filter-search :limit 100 :extract-fn first)
                               frequencies-sort))]
         (set-filtered-references! references)))
     [(hooks/use-debounced-value filter-search 200)])
    [:div.ls-filters.filters
     [:div.sm:flex.sm:items-start
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-gray-200.text-gray-500.sm:mx-0.sm:h-10.sm:w-10
       (ui/icon "filter" {:size 20})]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left.pb-2
       [:h3#modal-headline.text-lg.leading-6.font-medium (t :reference.filter/title)]
       [:span.text-xs
        (t :reference.filter/directions)]]]
     (when (or (seq included) (seq excluded))
       [:div.cp__filters.mb-4.ml-2
        (when (seq included)
          [:div.flex.flex-row.flex-wrap.center-items
           [:div.mr-1.font-medium.py-1 (t :reference.filter/includes)]
           (filtered-refs page-entity filters included false)])
        (when (seq excluded)
          [:div.flex.flex-row.flex-wrap
           [:div.mr-1.font-medium.py-1 (t :reference.filter/excludes)]

           (filtered-refs page-entity filters excluded false)])])
     [:div.cp__filters-input-panel.flex.focus-within:bg-gray-03
      (ui/icon "search")
      [:input.cp__filters-input.w-full.bg-transparent
       {:placeholder (t :reference.filter/search-placeholder)
        :autofocus true
        :ref (fn [^js el] (when el
                            (-> (p/delay 32) (p/then #(.focus el)))))
        :on-change (fn [e]
                     (set-filter-search! (util/evalue e)))}]]
     (let [all-filters (set
                        (concat (map :block/name included)
                                (map :block/name excluded)))
           refs (remove (fn [[page _]] (all-filters (util/page-name-sanity-lc page)))
                        filtered-references)]
       (when (seq refs)
         [:div.mt-4
          (filtered-refs page-entity filters refs true)]))]))

(hsx/defc filter-dialog
  [page references]
  (filter-dialog-aux page references))
