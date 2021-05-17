(ns frontend.components.reference
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.block :as block]
            [frontend.ui :as ui]
            [frontend.components.content :as content]
            [frontend.date :as date]
            [frontend.components.editor :as editor]
            [frontend.db-mixins :as db-mixins]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.components.svg :as svg]
            [frontend.handler.page :as page-handler]
            [frontend.handler.block :as block-handler]
            [medley.core :as medley]))

(rum/defc filter-dialog-inner < rum/reactive
  [filters-atom close-fn references page-name]
  [:div.filters
   [:div.sm:flex.sm:items-start
    [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-gray-200.text-gray-500.sm:mx-0.sm:h-10.sm:w-10
     (svg/filter-icon)]
    [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
     [:h3#modal-headline.text-lg.leading-6.font-medium "Filter"]
     [:span.text-xs
      "Click to include and shift-click to exclude. Click again to remove."]]]
   (when (seq references)
     (let [filters (rum/react filters-atom)]
       [:div.mt-5.sm:mt-4.sm:flex.sm.gap-1.flex-wrap
       (for [reference references]
         (let [lc-reference (string/lower-case reference)
               filtered (get filters lc-reference)
               color (condp = filtered
                       true "text-green-400"
                       false "text-red-400"
                       nil)]
           [:button.border.rounded.px-1.mb-1.mr-1 {:key reference :class color :style {:border-color "currentColor"}
                                                   :on-click (fn [e]
                                                               (swap! filters-atom #(if (nil? (get filters lc-reference))
                                                                                      (assoc % lc-reference (not (.-shiftKey e)))
                                                                                      (dissoc % lc-reference)))
                                                               (page-handler/save-filter! page-name @filters-atom))}
            reference]))]))])

(defn filter-dialog
  [filters-atom references page-name]
  (fn [close-fn]
    (filter-dialog-inner filters-atom close-fn references page-name)))

(rum/defcs references < rum/reactive
  {:init (fn [state]
           (let [page-name (first (:rum/args state))
                 filters (when page-name
                           (atom (page-handler/get-filters (string/lower-case page-name))))]
             (assoc state ::filters filters)))}
  [state page-name marker? priority?]
  (when page-name
    (let [filters-atom (get state ::filters)
          block? (util/uuid-string? page-name)
          block-id (and block? (uuid page-name))
          page-name (string/lower-case page-name)
          journal? (date/valid-journal-title? (string/capitalize page-name))
          repo (state/get-current-repo)
          ref-blocks (cond
                       block-id
                       (db/get-block-referenced-blocks block-id)
                       :else
                       (db/get-page-referenced-blocks page-name))
          ref-pages (map (comp :block/original-name first) ref-blocks)
          scheduled-or-deadlines (if (and journal?
                                          (not (true? (state/scheduled-deadlines-disabled?)))
                                          (= page-name (string/lower-case (date/journal-name))))
                                   (db/get-date-scheduled-or-deadlines (string/capitalize page-name))
                                   nil)
          references (db/get-page-linked-refs-refed-pages repo page-name)
          references (->> (concat ref-pages references)
                          (remove nil?)
                          (distinct))
          filter-state (rum/react filters-atom)
          filters (when (seq filter-state)
                    (->> (group-by second filter-state)
                         (medley/map-vals #(map first %))))
          filtered-ref-blocks (block-handler/filter-blocks repo ref-blocks filters true)
          n-ref (count filtered-ref-blocks)]
      (when (or (> n-ref 0)
                (seq scheduled-or-deadlines)
                (seq filter-state))
        [:div.references.mt-6.flex-1.flex-row
         [:div.content
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
                (content/content page-name
                                 {:hiccup ref-hiccup}))]))

          (when (or (> n-ref 0)
                    (seq filter-state))
            (ui/foldable
             [:div.flex.flex-row.flex-1.justify-between
              [:h2.font-bold.opacity-50 (let []
                                          (str n-ref " Linked Reference"
                                               (if (> n-ref 1) "s")))]
              [:a.opacity-50.hover:opacity-100
               {:title "Filter"
                :on-click #(state/set-modal! (filter-dialog filters-atom references page-name))}
               (svg/filter-icon (cond
                                  (empty? filter-state) nil
                                  (every? true? (vals filter-state)) "text-green-400"
                                  (every? false? (vals filter-state)) "text-red-400"
                                  :else "text-yellow-400"))]]

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
                                 {:hiccup ref-hiccup}))]))]]))))

(rum/defcs unlinked-references-aux
  < rum/reactive db-mixins/query
  [state page-name n-ref]
  (let [ref-blocks (db/get-page-unlinked-references page-name)]
    (when (nil? @n-ref) (reset! n-ref (count ref-blocks)))
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
              (str @n-ref " Unlinked Reference" (if (> @n-ref 1)
                                                  "s"))
              "Unlinked References")]
           (fn [] (unlinked-references-aux page-name n-ref))
           true)]]))))
