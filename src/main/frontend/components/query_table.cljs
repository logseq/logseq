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
;; ================
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

(defn- sort-by-fn [sort-by-item item]
  (case sort-by-item
    :created-at
    (:block/created-at item)
    :updated-at
    (:block/updated-at item)
    :block
    (:block/content item)
    :page
    (:block/name item)
    (get-in item [:block/properties sort-by-item])))

(defn- desc?
  [*desc? p-desc?]
  (cond
    (some? @*desc?)
    @*desc?
    (some? p-desc?)
    p-desc?
    :else
    true))

(defn- get-sort-state
  "Return current sort direction and column (item) being sorted, respectively
  :sort-desc? and :sort-by-item. :sort-by-item is nil if no sorting is to be
  done"
  [state current-block]
  (let [*sort-by-item (get state ::sort-by-item)
        *desc? (get state ::desc?)
        p-desc? (get-in current-block [:block/properties :query-sort-desc])
        desc? (desc? *desc? p-desc?)
        p-sort-by (keyword (get-in current-block [:block/properties :query-sort-by]))
        sort-by-item (or @*sort-by-item
                         (some-> p-sort-by keyword)
                         (if (query-dsl/query-contains-filter? (:block/content current-block) "sort-by")
                           nil
                           :updated-at))]
    {:sort-desc? desc?
     :sort-by-item sort-by-item}))

(defn- sort-result [result {:keys [sort-by-item sort-desc?]}]
  (if (some? sort-by-item)
    (let [comp (if sort-desc? > <)]
      (sort-by (fn [item]
                 (block/normalize-block (sort-by-fn sort-by-item item)))
               comp
               result))
    result))

;; Components and public fns
;; =========================
(rum/defc sortable-title
  [title key state {:keys [sort-by-item sort-desc?]} block-id]
  (let [*sort-by-item (get state ::sort-by-item)
        *desc? (get state ::desc?)]
    [:th.whitespace-nowrap
     [:a {:on-click (fn []
                      ;; The two local state atom changes have no effect on
                      ;; preserving state. Consider deleting?
                      (reset! *sort-by-item key)
                      (swap! *desc? not)
                      (editor-handler/set-block-property! block-id :query-sort-by (name key))
                      (editor-handler/set-block-property! block-id :query-sort-desc (not sort-desc?)))}
     [:div.flex.items-center
      [:span.mr-1 title]
      (when (= sort-by-item key)
        [:span
         (if sort-desc? (svg/caret-down) (svg/caret-up))])]]]))

(defn get-keys
  [result page?]
  (let [keys (->> (distinct (mapcat keys (map :block/properties result)))
                  (remove (property/built-in-properties))
                  (remove #{:template}))
        keys (if page? (cons :page keys) (cons :block keys))
        keys (if page? (distinct (concat keys [:created-at :updated-at])) keys)]
    keys))

;; We refer to rows and columns in a table as keys and items.
;; TODO: Rename key(s) naming as it conflict with core fns
(rum/defcs result-table < rum/reactive
  (rum/local nil ::sort-by-item)
  (rum/local nil ::desc?)
  (rum/local false ::select?)
  [state config current-block result {:keys [page?]} map-inline page-cp ->elem inline-text]
  (when current-block
    (let [result (tree/filter-top-level-blocks result)
          select? (get state ::select?)
          sort-state (get-sort-state state current-block)
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
          result (sort-result result sort-state)]
      [:div.overflow-x-auto {:on-mouse-down (fn [e] (.stopPropagation e))
                             :style {:width "100%"}
                             :class (when-not page? "query-table")}
       [:table.table-auto
        [:thead
         [:tr.cursor
          (for [key keys]
            (let [key-name (if (and (= key :clock-time) (integer? clock-time-total))
                             (util/format "clock-time(total: %s)" (clock/minutes->days:hours:minutes
                                                                   clock-time-total))
                             (name key))]
              (sortable-title key-name key state sort-state (:block/uuid current-block))))]]
        [:tbody
         (for [item result]
           (let [format (:block/format item)]
             [:tr.cursor
              (for [key keys]
                (let [value (case key
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

                              [:string (get-in item [:block/properties key])])]
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
