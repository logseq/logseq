(ns frontend.components.query-table
  (:require [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.clock :as clock]
            [frontend.util.property :as property]
            [medley.core :as medley]
            [rum.core :as rum]))

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
        keys (if page? (distinct (concat keys [:created-at :updated-at])) keys)]
    keys))

(defn attach-clock-property
  [result]
  (let [ks [:block/properties :clock-time]
        result (map (fn [b]
                      (assoc-in b ks (or (clock/clock-summary (:block/body b) false) 0)))
                 result)]
    (if (every? #(zero? (get-in % ks)) result)
      (map #(medley/dissoc-in % ks) result)
      result)))

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
          result (if page? result (attach-clock-property result))
          clock-time-total (when-not page?
                             (->> (map #(get-in % [:block/properties :clock-time] 0) result)
                                  (apply +)))
          query-properties (some-> (get-in current-block [:block/properties :query-properties] "")
                                   (common-handler/safe-read-string "Parsing query properties failed"))
          keys (if (seq query-properties)
                 query-properties
                 (get-keys result page?))
          included-keys #{:created-at :updated-at}
          keys (distinct
                (if (some included-keys keys)
                  (concat (remove included-keys keys)
                          (filter included-keys keys)
                          included-keys)
                  keys))
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
          (let [key-name (if (and (= key :clock-time) (integer? clock-time-total))
                           (util/format "clock-time(total: %s)" (clock/minutes->days:hours:minutes
                                                                  clock-time-total))
                           (name key))]
            (sortable-title key-name key *sort-by-item *desc? (:block/uuid current-block))))
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
