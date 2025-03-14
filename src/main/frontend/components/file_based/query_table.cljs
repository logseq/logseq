(ns frontend.components.file-based.query-table
  (:require [frontend.components.svg :as svg]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.format.block :as block]
            [frontend.handler.common :as common-handler]
            [frontend.handler.file-based.property :as file-property-handler]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.file-based.clock :as clock]
            [logseq.graph-parser.text :as text]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

;; Util fns
;; ========
(defn- attach-clock-property
  [result]
  ;; FIXME: Look up by property id if still supporting clock-time
  (let [ks [:block/properties :clock-time]
        result (map (fn [b]
                      (let [b (block/parse-title-and-body b)]
                        (assoc-in b ks (or (clock/clock-summary (:block.temp/ast-body b) false) 0))))
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
    (:block/title item)
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
  (let [properties (:block/properties current-block)
        p-desc? (:query-sort-desc properties)
        desc? (if (some? p-desc?) p-desc? true)
        properties (:block/properties current-block)
        query-sort-by (:query-sort-by properties)
        ;; Starting with #6105, we started putting properties under namespaces.
        nlp-date? (:logseq.query/nlp-date properties)
        sort-by-column (or (keyword query-sort-by)
                           (if (query-dsl/query-contains-filter? (:block/title current-block) "sort-by")
                             nil
                             :updated-at))]
    {:sort-desc? desc?
     :sort-by-column sort-by-column
     :sort-nlp-date? nlp-date?}))

;; Components
;; ==========
(rum/defc sortable-title
  [title column {:keys [sort-by-column sort-desc?]} block-id]
  (let [repo (state/get-current-repo)]
    [:th.whitespace-nowrap
     [:a {:on-click (fn []
                      (p/do!
                       (property-handler/set-block-property! repo block-id
                                                             :query-sort-by
                                                             (name column))
                       (property-handler/set-block-property! repo block-id
                                                             :query-sort-desc
                                                             (not sort-desc?))))}
      [:div.flex.items-center
       [:span.mr-1 title]
       (when (= sort-by-column column)
         [:span
          (if sort-desc? (svg/caret-down) (svg/caret-up))])]]]))

(defn get-all-columns-for-result
  "Gets all possible columns for a given result. Property names are keywords"
  [result page?]
  (let [hidden-properties (conj (file-property-handler/built-in-properties) :template)
        prop-keys* (->> (distinct (mapcat keys (map :block/properties result)))
                        (remove hidden-properties))
        prop-keys (cond-> (if page? (cons :page prop-keys*) (concat '(:block :page) prop-keys*))
                    page?
                    (concat [:created-at :updated-at]))]
    prop-keys))

(defn get-columns [current-block result {:keys [page?]}]
  (let [properties (:block/properties current-block)
        query-properties (some-> (:query-properties properties)
                                 (common-handler/safe-read-string "Parsing query properties failed"))
        query-properties (if page? (remove #{:block} query-properties) query-properties)
        columns (if (seq query-properties)
                  query-properties
                  (get-all-columns-for-result result page?))]
    (distinct columns)))

(defn- build-column-value
  "Builds a column's tuple value for a query table given a row, column and
  options"
  [row column {:keys [page? ->elem map-inline comma-separated-property?]}]
  (case column
    :page
    [:string (if page?
               (or (:block/title row)
                   (:block/name row))
               (or (get-in row [:block/page :block/title])
                   (get-in row [:block/page :block/name])))]

    :block       ; block title
    (let [content (:block/title row)
          uuid (:block/uuid row)
          {:block/keys [title]} (block/parse-title-and-body
                                 (:block/uuid row)
                                 (get row :block/format :markdown)
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

    [:string
     (if comma-separated-property?
         ;; Return original properties since comma properties need to
         ;; return collections for display purposes
       (get-in row [:block/properties column])
       (or (get-in row [:block/properties-text-values column])
             ;; Fallback to original properties for page blocks
           (get-in row [:block/properties column])))]))

(defn- render-column-value
  [{:keys [row-block row-format cell-format value]} page-cp inline-text]
  (cond
    ;; elements should be rendered as they are provided
    (= :element cell-format) value
    (coll? value) (->> (map #(page-cp {} {:block/name %}) value)
                       (interpose [:span ", "]))
    ;; boolean values need to first be stringified
    (boolean? value) (str value)
    ;; string values will attempt to be rendered as pages, falling back to
    ;; inline-text when no page entity is found
    (string? value) (if-let [page (and (string? value) (db/get-page value))]
                      (page-cp {} page)
                      (inline-text row-block row-format value))
    ;; anything else should just be rendered as provided
    :else value))

(rum/defcs result-table-v1 < rum/reactive
  (rum/local false ::select?)
  (rum/local false ::mouse-down?)
  [state config current-block sort-result' sort-state columns {:keys [page?]} map-inline page-cp ->elem inline-text]
  (let [select? (get state ::select?)
        *mouse-down? (::mouse-down? state)
        clock-time-total (when-not page?
                           (->> (map #(get-in % [:block/properties :clock-time] 0) sort-result')
                                (apply +)))
        property-separated-by-commas? (partial text/separated-by-commas? (state/get-config))]
    [:div.overflow-x-auto {:on-pointer-down (fn [e] (.stopPropagation e))
                           :style {:width "100%"}
                           :class "query-table"}
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
       (for [row sort-result']
         (let [format (get row :block/format :markdown)]
           [:tr.cursor
            (for [column columns]
              (let [[cell-format value] (build-column-value row
                                                            column
                                                            {:page? page?
                                                             :->elem ->elem
                                                             :map-inline map-inline
                                                             :config config
                                                             :comma-separated-property? (property-separated-by-commas? column)})]
                [:td.whitespace-nowrap
                 {:data-key (pr-str column)
                  :on-pointer-down (fn []
                                     (reset! *mouse-down? true)
                                     (reset! select? false))
                  :on-mouse-move (fn [] (reset! select? true))
                  :on-pointer-up (fn []
                                   (when (and @*mouse-down? (not @select?))
                                     (state/sidebar-add-block!
                                      (state/get-current-repo)
                                      (:db/id row)
                                      :block-ref)
                                     (reset! *mouse-down? false)))}
                 (when (some? value)
                   (render-column-value {:row-block row
                                         :row-format format
                                         :cell-format cell-format
                                         :value value}
                                        page-cp
                                        inline-text))]))]))]]]))

(rum/defc result-table < rum/reactive
  [config current-block result {:keys [page?] :as options} map-inline page-cp ->elem inline-text]
  (when current-block
    (let [result' (if page? result (attach-clock-property result))
          columns (get-columns current-block result' {:page? page?})
          ;; Sort state needs to be in sync between final result and sortable title
          ;; as user needs to know if there result is sorted
          sort-state (get-sort-state current-block)
          sort-result' (sort-result result' (assoc sort-state :page? page?))]
      (result-table-v1 config current-block sort-result' sort-state columns options map-inline page-cp ->elem inline-text))))
