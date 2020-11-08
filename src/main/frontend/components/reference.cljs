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
            [frontend.filtering :as filtering]))

(rum/defc filter-dialog-inner < rum/reactive
  [close-fn references page-name]
  (let [filter-state (page-handler/get-filter page-name)]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-gray-200.text-gray-500.sm:mx-0.sm:h-10.sm:w-10
       (svg/filter-icon)]
      [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium.text-gray-900 "Filter"]
       [:span.text-xs
        "Click to include and shift-click to exclude. Click again to remove."]]]
     [:div.mt-5.sm:mt-4.sm:flex.sm.gap-1.flex-wrap
      (for [reference references]
        (let [filtered (get (rum/react filter-state) reference)
              color (condp = filtered
                      true "text-green-500"
                      false "text-red-500"
                      nil)]
          [:button.border.rounded.px-1 {:key reference :class color :style {:border-color "currentColor"}
                                        :on-click (fn [e]
                                                    (swap! filter-state #(if (nil? (get @filter-state reference))
                                                                           (assoc % reference (not (.-shiftKey e)))
                                                                           (dissoc % reference)))
                                                    (page-handler/save-filter! page-name @filter-state))}
           reference]))]]))

(defn filter-dialog
  [references page-name]
  (fn [close-fn]
    (filter-dialog-inner close-fn references page-name)))

(rum/defc references < rum/reactive
  [page-name marker? priority?]
  (when page-name
    (let [block? (util/uuid-string? page-name)
          block-id (and block? (uuid page-name))
          page-name (string/lower-case page-name)
          journal? (date/valid-journal-title? (string/capitalize page-name))
          ref-blocks (cond
                       priority?
                       (db/get-blocks-by-priority (state/get-current-repo) page-name)

                       marker?
                       (db/get-marker-blocks (state/get-current-repo) page-name)
                       block-id
                       (db/get-block-referenced-blocks block-id)
                       :else
                       (db/get-page-referenced-blocks page-name))
          scheduled-or-deadlines (if journal?
                                   (db/get-date-scheduled-or-deadlines (string/capitalize page-name))
                                   nil)
          references (remove #{page-name} (distinct (flatten (map filtering/get-nested-block-references (flatten (map val ref-blocks))))))
          filter-state (rum/react (page-handler/get-filter page-name))
          filtered-ref-blocks (map #(filtering/filter-ref-block % filter-state) ref-blocks)
          n-ref (count ref-blocks)]
      (when (or (> n-ref 0)
                (seq scheduled-or-deadlines))
        [:div.references.mt-6.flex-1.flex-row
         [:div.content
          (when (seq scheduled-or-deadlines)
            (ui/foldable
             [:h2.font-bold.opacity-50 (let []
                                         "SCHEDULED AND DEADLINE")]
             [:div.references-blocks.mb-6
              (let [ref-hiccup (block/->hiccup scheduled-or-deadlines
                                               {:id (str page-name "-agenda")
                                                :start-level 2
                                                :ref? true
                                                :group-by-page? true
                                                :editor-box editor/box}
                                               {})]
                (content/content page-name
                                 {:hiccup ref-hiccup}))]))

          (ui/foldable
           [:div.flex.flex-row.flex-1.justify-between
            [:h2.font-bold.opacity-50 (let []
                                        (str n-ref " Linked References"))]
            [:a {:title "Filter"
                 :on-click #(state/set-modal! (filter-dialog references page-name))}
              (svg/filter-icon (cond
                                 (empty? filter-state) nil
                                 (every? true? (vals filter-state)) "text-green-500"
                                 (every? false? (vals filter-state)) "text-red-500"
                                 :else "text-yellow-200"))]]
           [:div.references-blocks
            (let [ref-hiccup (block/->hiccup filtered-ref-blocks
                                             {:id page-name
                                              :start-level 2
                                              :ref? true
                                              :breadcrumb-show? true
                                              :group-by-page? true
                                              :editor-box editor/box
                                              :filter-state filter-state}
                                             {})]
              (content/content page-name
                               {:hiccup ref-hiccup}))])]]))))

(rum/defcs unlinked-references-aux
  < rum/reactive db-mixins/query
  {:will-mount (fn [state]
                 (let [[page-name n-ref] (:rum/args state)
                       ref-blocks (db/get-page-unlinked-references page-name)]
                   (reset! n-ref (count ref-blocks))
                   (assoc state ::ref-blocks ref-blocks)))}
  [state page-name n-ref]
  (let [ref-blocks (::ref-blocks state)]
    [:div.references-blocks
     (let [ref-hiccup (block/->hiccup ref-blocks
                                      {:id (str page-name "-unlinked-")
                                       :start-level 2
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
              (str @n-ref " Unlinked References")
              "Unlinked References")]
           (fn [] (unlinked-references-aux page-name n-ref))
           true)]]))))
