(ns frontend.components.table.core
  "Generic table row and cell rendering for Logseq views."
  (:require [dommy.core :as dom]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]))

(defn get-column-size
  "Returns the rendered pixel width for `column` using table resize state."
  [column sized-columns]
  (let [id (:id column)
        size (get sized-columns id)]
    (cond
      (= id :id)
      48

      (number? size)
      size

      (= id :logseq.property/query)
      400

      :else
      (case id
        :select 32
        :add-property 32
        (:block/title :block/name) 360
        (:block/created-at :block/updated-at) 160
        180))))

(hsx/defc lazy-table-cell
  [cell-render-f cell-placeholder]
  (let [^js state (ui/useInView #js {:rootMargin "0px"})
        in-view? (.-inView state)]
    [:div.h-full
     {:ref (.-ref state)}
     (if in-view?
       (cell-render-f)
       cell-placeholder)]))

(defn- activate-cell-editor
  [node]
  (when-let [trigger (dom/sel1 node ".jtrigger")]
    (state/clear-selection!)
    (.click trigger)))

(defn- column-cell-editable?
  "Returns the explicit editability declared by a table column."
  [column row]
  (let [editable? (:editable? column)]
    (cond
      (fn? editable?)
      (editable? row column)

      (some? editable?)
      (boolean editable?)

      :else
      true)))

(defn- navigate-to-cell
  "Moves keyboard focus from `cell` in `direction`."
  [e cell direction]
  (util/stop e)
  (let [row (util/rec-get-node cell "ls-table-row")
        cells (dom/sel row ".ls-table-cell")
        idx (.indexOf cells cell)
        rows-container (util/rec-get-node row "ls-table-rows")
        rows (dom/sel rows-container ".ls-table-row")
        row-idx (.indexOf rows row)
        container-left (.-left (.getBoundingClientRect rows-container))
        next-cell (case direction
                    :left (if (> idx 1)
                            (nth cells (dec idx))
                            (let [prev-row (when (> row-idx 0)
                                             (nth rows (dec row-idx)))]
                              (when prev-row
                                (let [cells (dom/sel prev-row ".ls-table-cell")]
                                  (last cells)))))
                    :right (if (< idx (dec (count cells)))
                             (nth cells (inc idx))
                             (let [next-row (when (< row-idx (dec (count rows)))
                                              (nth rows (inc row-idx)))]
                               (when next-row
                                 (let [cells (dom/sel next-row ".ls-table-cell")]
                                   (second cells)))))
                    :up (let [prev-row (when (> row-idx 0)
                                         (nth rows (dec row-idx)))]
                          (when prev-row
                            (let [cells (dom/sel prev-row ".ls-table-cell")]
                              (nth cells idx))))
                    :down (let [next-row (when (< row-idx (dec (count rows)))
                                           (nth rows (inc row-idx)))]
                            (when next-row
                              (let [cells (dom/sel next-row ".ls-table-cell")]
                                (nth cells idx)))))]
    (when next-cell
      (let [next-cell-left (.-left (.getBoundingClientRect next-cell))]
        (state/clear-selection!)
        (dom/add-class! next-cell "selected")
        (.focus next-cell)
        (when (< next-cell-left container-left)
          (.scrollIntoView next-cell #js {:inline "center"
                                          :block "nearest"}))))))

(hsx/defc table-cell-container
  [cell-opts body]
  (let [*ref (hooks/use-ref nil)
        editable? (not (false? (:editable? cell-opts)))
        cell-opts (dissoc cell-opts :editable?)]
    (shui/table-cell
     (assoc cell-opts
            :tabIndex 0
            :ref *ref
            :on-click (fn [e]
                        (when (and editable?
                                   (not (dom/has-class? (.-target e) "jtrigger")))
                          (activate-cell-editor (hooks/deref *ref))))
            :on-key-down (fn [e]
                           (let [container (hooks/deref *ref)]
                             (case (util/ekey e)
                               "Escape"
                               (do
                                 (if (util/input? (.-target e))
                                   (do
                                     (state/exit-editing-and-set-selected-blocks! [container])
                                     (.focus container))
                                   (do
                                     (dom/remove-class! container "selected")
                                     (let [row (util/rec-get-node container "ls-table-row")]
                                       (state/exit-editing-and-set-selected-blocks! [row]))))
                                 (util/stop e))
                               "Enter"
                               (do
                                 (if (util/input? (.-target e))
                                   (do
                                     (state/exit-editing-and-set-selected-blocks! [container])
                                     (.focus container))
                                   (when editable?
                                     (activate-cell-editor container)))
                                 (util/stop e))
                               "ArrowUp"
                               (navigate-to-cell e container :up)
                               "ArrowDown"
                               (navigate-to-cell e container :down)
                               "ArrowLeft"
                               (navigate-to-cell e container :left)
                               "ArrowRight"
                               (navigate-to-cell e container :right)
                               nil))))
     body)))

(hsx/defc table-row-inner
  [{:keys [row-selected?] :as table} row props {:keys [show-add-property? scrolling?]}]
  (let [*ref (hooks/use-ref nil)
        pinned-columns (get-in table [:state :pinned-columns])
        unpinned (get-in table [:state :unpinned-columns])
        unpinned-columns (if show-add-property?
                           (conj (vec unpinned)
                                 {:id :add-property
                                  :cell (fn [_table _row _column])})
                           unpinned)
        sized-columns (get-in table [:state :sized-columns])
        row-cell-f (fn [column {:keys [_lazy?]}]
                     (let [id (str (:id row) "-" (:id column))
                           width (get-column-size column sized-columns)
                           select? (= (:id column) :select)
                           index? (= (:id column) :id)
                           add-property? (= (:id column) :add-property)
                           style {:width width :min-width width}
                           cell-opts (cond-> {:key id
                                              :select? select?
                                              :add-property? add-property?
                                              :editable? (column-cell-editable? column row)
                                              :style style}
                                       index?
                                       (assoc :class "ls-table-index-cell"))
                           cell-placeholder (table-cell-container cell-opts nil)]
                       (if (and scrolling? (not (:block/title row)))
                         cell-placeholder
                         (when-let [render (get column :cell)]
                           (lazy-table-cell
                            (fn []
                              (table-cell-container
                               cell-opts (render table row column style)))
                            cell-placeholder)))))]
    (shui/table-row
     (merge
      props
      (cond-> {:key (str (:db/id row))
               :tabIndex 0
               :ref *ref
               :data-state (when (row-selected? row) "selected")
               :data-id (:db/id row)
               :blockid (str (:block/uuid row))
               :on-pointer-down (fn [_e] (db-async/<get-block (state/get-current-repo) (:db/id row) {:children? false}))
               :on-key-down (fn [e]
                              (let [container (hooks/deref *ref)]
                                (when (dom/has-class? container "selected")
                                  (case (util/ekey e)
                                    "Enter"
                                    (do
                                      (state/sidebar-add-block! (state/get-current-repo) (:db/id row) :block)
                                      (state/clear-selection!)
                                      (util/stop e))
                                    "ArrowLeft"
                                    (do
                                      (when-let [cell (->> (dom/sel container ".ls-table-cell")
                                                           (remove (fn [node]
                                                                     (some? (dom/sel1 node ".ui__checkbox"))))
                                                           first)]
                                        (state/clear-selection!)
                                        (dom/add-class! cell "selected")
                                        (.focus cell))
                                      (util/stop e))
                                    "ArrowRight"
                                    (do
                                      (when-let [cell (->> (dom/sel container ".ls-table-cell")
                                                           (remove (fn [node]
                                                                     (some? (dom/sel1 node ".ui__checkbox"))))
                                                           last)]
                                        (state/clear-selection!)
                                        (dom/remove-class! container "selected")
                                        (dom/add-class! cell "selected")
                                        (.focus cell))
                                      (util/stop e))
                                    "Escape"
                                    (do
                                      (state/clear-selection!)
                                      (util/stop e))
                                    nil))))}
        (:asset-table/nested? row)
        (assoc :data-asset-table-nested true)))
     (when (seq pinned-columns)
       [:div.sticky-columns.flex.flex-row
        (map #(row-cell-f % {}) pinned-columns)])
     (when (seq unpinned-columns)
       [:div.flex.flex-row
        (map #(row-cell-f % {:lazy? true}) unpinned-columns)]))))
