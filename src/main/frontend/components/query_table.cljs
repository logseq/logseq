(ns frontend.components.query-table
  (:require [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.util.property :as property]
            [frontend.db :as db]
            [frontend.date :as date]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]))

;; TODO: extract to table utils
(defn- sort-result-by
  [by-item desc? result]
  (let [comp (if desc? > <)]
    (sort-by by-item comp result)))

(rum/defc sortable-title
  [title key by-item desc? block-id]
  [:th.whitespace-nowrap
   [:a {:on-click (fn []
                    (reset! by-item key)
                    (swap! desc? not)
                    (when block-id
                      (when key
                        (editor-handler/set-block-property! block-id :query-sort-by (name key)))
                      (editor-handler/set-block-property! block-id :query-sort-desc @desc?)))}
    [:div.flex.items-center
     [:span.mr-1 title]
     (when (= @by-item key)
       [:span
        (if @desc? (svg/caret-down) (svg/caret-up))])]]])

(defn get-keys
  [result page?]
  (let [keys (->> (distinct (mapcat keys (map :block/properties result)))
                  (remove (property/built-in-properties))
                  (remove #{:template}))
        keys (if page? (cons :page keys) (cons :block keys))
        keys (if page? (concat keys [:created-at :updated-at]) keys)]
    keys))

(rum/defcs result-table < rum/reactive
  (rum/local nil ::sort-by-item)
  (rum/local nil ::desc?)
  (rum/local false ::select?)
  [state config current-block result {:keys [page?]} map-inline page-cp ->elem inline-text]
  (when current-block
    (let [p-sort-by (keyword (get-in current-block [:block/properties :query-sort-by]))
          p-desc? (get-in current-block [:block/properties :query-sort-desc])
          select? (get state ::select?)
          *sort-by-item (get state ::sort-by-item)
          *desc? (get state ::desc?)
          sort-by-item (or @*sort-by-item (some-> p-sort-by keyword) :updated-at)
          desc? (cond
                  (some? @*desc?)
                  @*desc?
                  (some? p-desc?)
                  p-desc?
                  :else
                  true)
          editor-box (get config :editor-box)
          ;; remove templates
          result (remove (fn [b] (some? (get-in b [:block/properties :template]))) result)
          query-properties (some-> (get-in current-block [:block/properties :query-properties] "")
                                   (common-handler/safe-read-string "Parsing query properties failed"))
          keys (if (seq query-properties)
                 query-properties
                 (get-keys result page?))
          keys (if (some #{:created-at :updated-at} keys)
                 (concat
                  (remove #{:created-at :updated-at} keys)
                  (filter #{:created-at :updated-at} keys))
                 keys)
          sort-by-fn (fn [item]
                       (let [key sort-by-item]
                         (case key
                           :created-at
                           (:block/created-at item)
                           :updated-at
                           (:block/updated-at item)
                           :block
                           (:block/content item)
                           :page
                           (:block/name item)
                           (get-in item [:block/properties key]))))
          result (sort-result-by sort-by-fn desc? result)]
      [:div.overflow-x-auto {:on-mouse-down (fn [e] (.stopPropagation e))
                             :style {:width "100%"}}
       [:table.table-auto
        (for [key keys]
          (sortable-title (name key) key *sort-by-item *desc? (:block/uuid current-block)))
        (for [item result]
          (let [format (:block/format item)
                edit-input-id (str "edit-block-" (:id config) "-" (:block/uuid item))
                heading-level (:block/heading-level item)]
            [:tr.cursor
             (for [key keys]
               (let [value (case key
                             :page
                             [:string (or (:block/original-name item)
                                          (:block/name item))]

                             :block       ; block title
                             (let [title (:block/title item)]
                               (if (seq title)
                                 [:element (->elem :div (map-inline config title))]
                                 [:string (:block/content item)]))

                             :created-at
                             [:string (when-let [created-at (:block/created-at item)]
                                        (date/int->local-time-2 created-at))]

                             :updated-at
                             [:string (when-let [updated-at (:block/updated-at item)]
                                        (date/int->local-time-2 updated-at))]

                             [:string (get-in item [:block/properties key])])]
                 [:td.whitespace-nowrap {:on-mouse-down (fn [] (reset! select? false))
                                         :on-mouse-move (fn [] (reset! select? true))
                                         :on-mouse-up (fn []
                                                        (when-not @select?
                                                          (state/sidebar-add-block!
                                                           (state/get-current-repo)
                                                           (:db/id item)
                                                           :block-ref
                                                           {:block item})))}
                  (when value
                    (if (= :element (first value))
                      (second value)
                      (let [value (second value)]
                        (if (coll? value)
                          (let [vals (for [item value]
                                       (page-cp {} {:block/name item}))]
                            (interpose [:span ", "] vals))
                          (if (not (string? value))
                            value
                            (if-let [page (db/entity [:block/name (string/lower-case value)])]
                              (page-cp {} page)
                              (inline-text format value)))))))]))]))]])))
