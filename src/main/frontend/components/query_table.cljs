(ns frontend.components.query-table
  (:require [frontend.components.svg :as svg]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.clock :as clock]
            [frontend.util.property :as property]
            [frontend.format.block :as block]
            [medley.core :as medley]
            [rum.core :as rum]
            [frontend.modules.outliner.tree :as tree]))

;; Util fns
;; ========
(defn- attach-clock-property
  [result]
  (let [ks [:block/properties :clock-time]
        result (map (fn [b]
                      (let [b (block/parse-title-and-body b)]
                        (assoc-in b ks (or (clock/clock-summary (:block/body b) false) 0))))
                    result)]
    (if (every? #(zero? (get-in % ks)) result)
      (map #(medley/dissoc-in % ks) result)
      result)))

(defn- sort-by-fn [sort-by-column item]
  (case sort-by-column
    :created-at
    (:block/created-at item)
    :updated-at
    (:block/updated-at item)
    :block
    (:block/content item)
    :page
    (:block/name item)
    (get-in item [:block/properties sort-by-column])))

(defn- locale-compare
  "Use locale specific comparison for strings and general comparison for others."
  [x y]
    (if (and (number? x) (number? y))
      (< x y)
      (.localeCompare (str x) (str y) (state/sub :preferred-language) #js {:numeric true})))

(defn- sort-result [result {:keys [sort-by-column sort-desc? sort-nlp-date?]}]
  (if (some? sort-by-column)
    (let [comp-fn (if sort-desc? #(locale-compare %2 %1) locale-compare)]
      (sort-by (fn [item]
                 (block/normalize-block (sort-by-fn sort-by-column item) sort-nlp-date?))
               comp-fn
               result))
    result))

(defn- get-sort-state
  "Return current sort direction and column being sorted, respectively
  :sort-desc? and :sort-by-column. :sort-by-column is nil if no sorting is to be
  done"
  [current-block]
  (let [p-desc? (get-in current-block [:block/properties :query-sort-desc])
        desc? (if (some? p-desc?) p-desc? true)
        p-sort-by (keyword (get-in current-block [:block/properties :query-sort-by]))
        ;; Starting with #6105, we started putting properties under namespaces.
        nlp-date? (get-in current-block [:block/properties :logseq.query/nlp-date])
        sort-by-column (or (some-> p-sort-by keyword)
                         (if (query-dsl/query-contains-filter? (:block/content current-block) "sort-by")
                           nil
                           :updated-at))]
    {:sort-desc? desc?
     :sort-by-column sort-by-column
     :sort-nlp-date? nlp-date?}))

;; Components
;; ==========
(rum/defc sortable-title
  [title column {:keys [sort-by-column sort-desc?]} block-id]
  [:th.whitespace-nowrap
   [:a {:on-click (fn []
                    (editor-handler/set-block-property! block-id :query-sort-by (name column))
                    (editor-handler/set-block-property! block-id :query-sort-desc (not sort-desc?)))}
    [:div.flex.items-center
     [:span.mr-1 title]
     (when (= sort-by-column column)
       [:span
        (if sort-desc? (svg/caret-down) (svg/caret-up))])]]])

(defn get-keys
  "Get keys for a query table result, which are the columns in a table"
  [result page?]
  (let [keys (->> (distinct (mapcat keys (map :block/properties result)))
                  (remove (property/built-in-properties))
                  (remove #{:template}))
        keys (if page? (cons :page keys) (cons :block keys))
        keys (if page? (distinct (concat keys [:created-at :updated-at])) keys)]
    keys))

(defn- get-columns [current-block result {:keys [page?]}]
  (let [query-properties (some-> (get-in current-block [:block/properties :query-properties] "")
                                 (common-handler/safe-read-string "Parsing query properties failed"))
        columns (if (seq query-properties)
                  query-properties
                  (get-keys result page?))
        included-columns #{:created-at :updated-at}]
    (distinct
     (if (some included-columns columns)
       (concat (remove included-columns columns)
               (filter included-columns columns)
               included-columns)
       columns))))

;; Table rows are called items
(rum/defcs result-table < rum/reactive
  (rum/local false ::select?)
  [state config current-block result {:keys [page?]} map-inline page-cp ->elem inline-text]
  (when current-block
    (let [result (tree/filter-top-level-blocks result)
          select? (get state ::select?)
          ;; remove templates
          result (remove (fn [b] (some? (get-in b [:block/properties :template]))) result)
          result (if page? result (attach-clock-property result))
          clock-time-total (when-not page?
                             (->> (map #(get-in % [:block/properties :clock-time] 0) result)
                                  (apply +)))
          columns (get-columns current-block result {:page? page?})
          ;; Sort state needs to be in sync between final result and sortable title
          ;; as user needs to know if there result is sorted
          sort-state (get-sort-state current-block)
          result' (sort-result result sort-state)]
      [:div.overflow-x-auto {:on-mouse-down (fn [e] (.stopPropagation e))
                             :style {:width "100%"}
                             :class (when-not page? "query-table")}
       [:table.table-auto
        [:thead
         [:tr.cursor
          (for [column columns]
            (let [title (if (and (= column :clock-time) (integer? clock-time-total))
                             (util/format "clock-time(total: %s)" (clock/seconds->days:hours:minutes:seconds
                                                                   clock-time-total))
                             (name column))]
              (sortable-title title column sort-state (:block/uuid current-block))))]]
        [:tbody
         (for [item result']
           (let [format (:block/format item)]
             [:tr.cursor
              (for [column columns]
                (let [value (case column
                              :page
                              [:string (or (:block/original-name item)
                                           (:block/name item))]

                              :block       ; block title
                              (let [content (:block/content item)
                                    {:block/keys [title]} (block/parse-title-and-body
                                                           (:block/uuid item)
                                                           (:block/format item)
                                                           (:block/pre-block? item)
                                                           content)]
                                (if (seq title)
                                  [:element (->elem :div (map-inline config title))]
                                  [:string content]))

                              :created-at
                              [:string (when-let [created-at (:block/created-at item)]
                                         (date/int->local-time-2 created-at))]

                              :updated-at
                              [:string (when-let [updated-at (:block/updated-at item)]
                                         (date/int->local-time-2 updated-at))]

                              [:string (get-in item [:block/properties-text-values column])])]
                  [:td.whitespace-nowrap {:on-mouse-down (fn [] (reset! select? false))
                                          :on-mouse-move (fn [] (reset! select? true))
                                          :on-mouse-up (fn []
                                                         (when-not @select?
                                                           (state/sidebar-add-block!
                                                            (state/get-current-repo)
                                                            (:db/id item)
                                                            :block-ref)))}
                   (when value
                     (if (= :element (first value))
                       (second value)
                       (let [value (second value)]
                         (if (coll? value)
                           (let [vals (for [item value]
                                        (page-cp {} {:block/name item}))]
                             (interpose [:span ", "] vals))
                           (cond
                             (boolean? value) (str value)
                             (string? value) (if-let [page (db/entity [:block/name (util/page-name-sanity-lc value)])]
                                               (page-cp {} page)
                                               (inline-text format value))
                             :else value)))))]))]))]]])))
