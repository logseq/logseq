(ns frontend.components.property
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [clojure.string :as string]
            [frontend.handler.property :as property-handler]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.mixins :as mixins]
            [rum.core :as rum]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [frontend.search :as search]
            [frontend.components.search.highlight :as highlight]
            [frontend.components.svg :as svg]))

(defn- add-property
  [entity k *new-property?]
  (when-not (string/blank? k)
    (property-handler/add-property! (:db/id entity) k)
    (reset! *new-property? false)))

(rum/defc search-item-render
  [search-q content]
  [:div.font-medium
   (highlight/highlight-exact-query content search-q)])

(rum/defcs property-input < (rum/local nil ::q)
  [state entity *new-property?]
  (let [*q (::q state)
        result (when-not (string/blank? @*q)
                 (search/property-search @*q))]
    [:div
     [:div.ls-property-add.grid.grid-cols-4.gap-4.flex.flex-row.items-center
      [:input#add-property.form-input.block.col-span-1.focus:outline-none
       {:placeholder "Property key"
        :auto-focus true
        :on-change (fn [e]
                     (reset! *q (util/evalue e)))
        :on-blur (fn [_e]
                   (add-property entity @*q *new-property?))
        :on-key-down (fn [e]
                       (case (util/ekey e)
                         "Enter"
                         (add-property entity @*q *new-property?)

                         "Escape"
                         (reset! *new-property? false)

                         nil))}]
      [:a.close.ml-2 {:on-mouse-down #(do
                                        (reset! *q nil)
                                        (reset! *new-property? false))}
       svg/close]]
     (ui/auto-complete
      result
      {:class "search-results"
       :on-chosen #(add-property entity % *new-property?)
       :item-render #(search-item-render @*q %)})]))

(rum/defcs properties-area <
  (rum/local false ::new-property?)
  rum/reactive
  [state entity properties {:keys [page-cp inline-text]}]
  (let [*new-property? (::new-property? state)
        editor-box (state/get-component :editor/box)]
    [:div.ls-properties-area
     (when (seq properties)
       [:table.table-auto.m-0
        [:tbody
         (for [[k v] properties]
           (when-let [property (db/pull [:block/uuid k])]
             (when-let [property-key (:block/original-name property)]
               (let [editor-id (str "property-" (:db/id entity) "-" property-key)
                     editing? (state/sub [:editor/editing? editor-id])]
                 [:tr
                  [:td.property-key.p-0 {:style {:width 160}} ;FIXME: auto responsive
                   (page-cp {} {:block/name property-key})]

                  [:td.property-value.p-0
                   (let [block (assoc entity :editing-property property)
                         dom-id (str "ls-property-" k)]
                     (if editing?
                       (editor-box {:format :markdown
                                    :block block} editor-id {})
                       [:div.flex.flex-1.property-value-content
                        {:id dom-id
                         :on-click (fn []
                                     (let [cursor-range (util/caret-range (gdom/getElement dom-id))]
                                       (state/set-editing! editor-id (str v) block cursor-range)))}
                        (when-not (string/blank? (str v))
                          (inline-text {} :markdown (str v)))]))]]))))]])

     (if @*new-property?
       (property-input entity *new-property?)
       [:div.flex-1.flex-col.rounded-sm
        {:on-click (fn []
                     (reset! *new-property? true))}
        [:div.flex.flex-row
         [:div.block {:style {:height      20
                              :width       20}}
          [:a.add-button-link.block {:style {:margin-left -4}}
           (ui/icon "circle-plus")]]]])]))

(defn properties
  [entity block-components-m]
  (let [namespace (:block/namespace entity)
        namespace-properties (when namespace
                               (:block/properties (db/entity (:db/id namespace))))
        properties (merge
                    namespace-properties
                    (:block/properties entity))]
    (properties-area entity properties block-components-m)))

(defn composed-properties
  [entity refs block-components-m]
  (let [namespaces (map :block/namespace (distinct refs))
        namespace-properties (->>
                              namespaces
                              (map
                                (fn [namespace]
                                  (:block/properties (db/entity (:db/id namespace))))))
        refs-properties (map
                          (fn [ref]
                            (:block/properties (db/entity (:db/id ref))))
                          refs)
        property-maps (concat namespace-properties
                              refs-properties
                              [(:block/properties entity)])
        properties (apply merge property-maps)]
    (properties-area entity properties block-components-m)))
