(ns frontend.components.query-table
  (:require [frontend.components.svg :as svg]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.format.block :as block]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor.property :as editor-property]
            [frontend.shui :refer [get-shui-component-version make-shui-context]]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.clock :as clock]
            [frontend.util.property :as property]
            [logseq.shui.core :as shui]
            [medley.core :as medley]
            [rum.core :as rum]
            [logseq.graph-parser.text :as text]))

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

(defn- sort-by-fn [sort-by-column item {:keys [page?]}]
  (case sort-by-column
    :created-at
    (:block/created-at item)
    :updated-at
    (:block/updated-at item)
    :block
    (:block/content item)
    :page
    (if page? (:block/name item) (get-in item [:block/page :block/name]))
    (get-in item [:block/properties sort-by-column])))

(defn- locale-compare
  "Use locale specific comparison for strings and general comparison for others."
  [x y]
  (if (and (number? x) (number? y))
    (< x y)
    (.localeCompare (str x) (str y) (state/sub :preferred-language) #js {:numeric true})))

(defn- sort-result [result {:keys [sort-by-column sort-desc? sort-nlp-date? page?]}]
  (if (some? sort-by-column)
    (let [comp-fn (if sort-desc? #(locale-compare %2 %1) locale-compare)]
      (sort-by (fn [item]
                 (block/normalize-block (sort-by-fn sort-by-column item {:page? page?})
                                        sort-nlp-date?))
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
                    (editor-property/set-block-property! block-id :query-sort-by (name column))
                    (editor-property/set-block-property! block-id :query-sort-desc (not sort-desc?)))}
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
        keys (if page? (cons :page keys) (concat '(:block :page) keys))
        keys (if page? (distinct (concat keys [:created-at :updated-at])) keys)]
    keys))

(defn get-columns [current-block result {:keys [page?]}]
  (let [query-properties (some-> (get-in current-block [:block/properties :query-properties] "")
                                 (common-handler/safe-read-string "Parsing query properties failed"))
        query-properties (if page? (remove #{:block} query-properties) query-properties)
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

(defn- build-column-value
  "Builds a column's tuple value for a query table given a row, column and
  options"
  [row column {:keys [page? ->elem map-inline comma-separated-property?]}]
  (case column
    :page
    [:string (if page?
               (or (:block/original-name row)
                   (:block/name row))
               (or (get-in row [:block/page :block/original-name])
                   (get-in row [:block/page :block/name])))]

    :block       ; block title
    (let [content (:block/content row)
          uuid (:block/uuid row)
          {:block/keys [title]} (block/parse-title-and-body
                                 (:block/uuid row)
                                 (:block/format row)
                                 (:block/pre-block? row)
                                 content)]
      (if (seq title)
        [:element (->elem :div (map-inline {:block/uuid uuid} title))]
        [:string content]))

    :created-at
    [:string (when-let [created-at (:block/created-at row)]
               (date/int->local-time-2 created-at))]

    :updated-at
    [:string (when-let [updated-at (:block/updated-at row)]
               (date/int->local-time-2 updated-at))]

    [:string (if comma-separated-property?
               ;; Return original properties since comma properties need to
               ;; return collections for display purposes
               (get-in row [:block/properties column])
               (or (get-in row [:block/properties-text-values column])
                   ;; Fallback to original properties for page blocks
                   (get-in row [:block/properties column])))]))

(defn build-column-text [row column]
  (case column 
    :page  (or (get-in row [:block/page :block/original-name])
               (get-in row [:block/original-name])
               (get-in row [:block/content]))
    :block (or (get-in row [:block/original-name]) 
               (get-in row [:block/content])) 
           (or (get-in row [:block/properties column])
               (get-in row [:block/properties-text-values column])
               (get-in row [(keyword :block column)]))))

(rum/defcs result-table < rum/reactive
  (rum/local false ::select?)
  (rum/local false ::mouse-down?)
  [state config current-block result {:keys [page?]} map-inline page-cp ->elem inline-text inline]
  (when current-block
    (let [select? (get state ::select?)
          *mouse-down? (::mouse-down? state)
          result' (if page? result (attach-clock-property result))
          clock-time-total (when-not page?
                             (->> (map #(get-in % [:block/properties :clock-time] 0) result')
                                  (apply +)))
          columns (get-columns current-block result' {:page? page?})
          ;; Sort state needs to be in sync between final result and sortable title
          ;; as user needs to know if there result is sorted
          sort-state (get-sort-state current-block)
          sort-result (sort-result result (assoc sort-state :page? page?))
          property-separated-by-commas? (partial text/separated-by-commas? (state/get-config))
          table-version (get-shui-component-version :table config)
          result-as-text (for [row sort-result]
                           (for [column columns] 
                             (build-column-text row column)))
          render-column-value (fn [row-format cell-format value]
                                (cond 
                                  ;; elements should be rendered as they are provided
                                  (= :element cell-format) value
                                  ;; collections are treated as a comma separated list of page-cps
                                  (coll? value) (->> (map #(page-cp {} {:block/name %}) value)
                                                     (interpose [:span ", "]))
                                  ;; boolean values need to first be stringified
                                  (boolean? value) (str value) 
                                  ;; string values will attempt to be rendered as pages, falling back to 
                                  ;; inline-text when no page entity is found
                                  (string? value) (if-let [page (db/entity [:block/name (util/page-name-sanity-lc value)])]
                                                    (page-cp {} page)
                                                    (inline-text row-format value))
                                  ;; anything else should just be rendered as provided
                                  :else value))]
                      
      (case table-version
        2 (shui/table-v2 {:data (conj [[columns]] result-as-text)} 
                         (make-shui-context config inline))
        1 [:div.overflow-x-auto {:on-mouse-down (fn [e] (.stopPropagation e))
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
             (for [row sort-result]
               (let [format (:block/format row)]
                 [:tr.cursor
                  (for [column columns]
                    (let [value (build-column-value row
                                                    column
                                                    {:page? page?
                                                     :->elem ->elem
                                                     :map-inline map-inline
                                                     :config config
                                                     :comma-separated-property? (property-separated-by-commas? column)})]
                      [:td.whitespace-nowrap {:on-mouse-down (fn []
                                                               (reset! *mouse-down? true)
                                                               (reset! select? false))
                                              :on-mouse-move (fn [] (reset! select? true))
                                              :on-mouse-up (fn []
                                                             (when (and @*mouse-down? (not @select?))
                                                               (state/sidebar-add-block!
                                                                (state/get-current-repo)
                                                                (:db/id row)
                                                                :block-ref)
                                                               (reset! *mouse-down? false)))}
                       (when value
                         (apply render-column-value format value))]))]))]]]))))
