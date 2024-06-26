(ns frontend.components.all-pages
  "All pages"
  (:require [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [clojure.string :as string]
            [frontend.components.block :as component-block]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]))

;; columns:
;; page name, tags, backlinks, created at updated at
;; default sort: updated at

(defn header-checkbox [{:keys [selected-all? selected-some? toggle-selected-all!]}]
  (shui/checkbox
   {:checked (or selected-all? (and selected-some? "indeterminate"))
    :on-checked-change toggle-selected-all!
    :aria-label "Select all"}))

(defn row-checkbox [{:keys [row-selected? row-toggle-selected!]} row _column]
  (shui/checkbox
   {:checked (row-selected? row)
    :on-checked-change (fn [v] (row-toggle-selected! row v))
    :aria-label "Select row"}))

(defn- header-cp
  [{:keys [column-toggle-sorting!]} column]
  (shui/button
   {:variant "ghost"
    :onClick #(column-toggle-sorting! column)}
   (:name column)
   (ui/icon "arrows-up-down")))

(defn- default-cell-cp
  [_table row column]
  (str (get row (:id column))))

(defn- timestamp-cell-cp
  [_table row column]
  (some-> (get row (:id column))
          date/int->local-time-2))

(def columns
  [{:id :select
    :name "Select"
    :header (fn [table _column] (header-checkbox table))
    :cell (fn [table row column] (row-checkbox table row column))
    :column-list? false}
   {:id :block/original-name
    :name "Page name"
    :header header-cp
    :cell (fn [_table row _column]
            (component-block/page-cp {} row))}
   ;; {:id :block/type
   ;;  :name "Type"
   ;;  :header header-cp
   ;;  :cell (fn [_table row _column] (string/join ", " (get row :block/type)))
   ;;  :get-value (fn [row] (string/join ", " (get row :block/type)))}
   {:id :block/tags
    :name "Tags"
    :header header-cp
    :cell (fn [_table row _column]
            (component-block/tags {} row))
    :get-value (fn [row] (string/join ", " (map :block/original-name (get row :block/tags))))}
   {:id :block/created-at
    :name "Created At"
    :header header-cp
    :cell timestamp-cell-cp}
   {:id :block/updated-at
    :name "Updated At"
    :header header-cp
    :cell timestamp-cell-cp}])

(rum/defc all-pages < rum/static
  []
  (let [[input set-input!] (rum/use-state "")
        [sorting set-sorting!] (rum/use-state [])
        [row-filter set-row-filter!] (rum/use-state nil)
        [visible-columns set-visible-columns!] (rum/use-state {})
        [row-selection set-row-selection!] (rum/use-state {})
        data (db/get-all-pages (state/get-current-repo))
        {:keys [column-visible? column-toggle-visiblity row-selected?]
         :as table} (shui/table-option {:data data
                                        :columns columns
                                        :state {:sorting sorting
                                                :row-filter row-filter
                                                :row-selection row-selection
                                                :visible-columns visible-columns}
                                        :data-fns {:set-sorting! set-sorting!
                                                   :set-visible-columns! set-visible-columns!
                                                   :set-row-selection! set-row-selection!}})]
    [:div.w-full
     [:h1.title (t :all-pages)]

     [:div.flex.items-center.py-4
      (shui/input
       {:placeholder "Search page..."
        :value input
        :onChange (fn [e]
                    (let [value (util/evalue e)]
                      (set-input! value)
                      (set-row-filter! (fn []
                                           ;; Returns a fn here.
                                           ;; https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react
                                         (fn [row]
                                           (if (string/blank? value)
                                             true
                                             (when row (string/includes? (:block/name row) (string/lower-case value)))))))))
        :className "max-w-sm"})
      (shui/dropdown-menu
       (shui/dropdown-menu-trigger
        {:asChild true}
        (shui/button
         {:variant "outline" :className "ml-auto"}
         "Columns"
         (ui/icon "chevron-down")))
       (shui/dropdown-menu-content
        {:align "end"}
        (for [column (remove #(false? (:column-list? %)) columns)]
          (shui/dropdown-menu-checkbox-item
           {:key (str (:id column))
            :className "capitalize"
            :checked (column-visible? column)
            :onCheckedChange #(column-toggle-visiblity column %)}
           (:name column)))))]
     (let [columns' (:columns table)]
       [:div.rounded-md.border
        (shui/table
         (shui/table-header
          (shui/table-row
           (for [column columns']
             (shui/table-head
              {:key (:id column)}
              (let [header-fn (:header column)]
                (if (fn? header-fn)
                  (header-fn table column)
                  header-fn))))))
         (shui/table-body
          (let [rows (:rows table)]
            (if (pos? (count rows))
              (for [row rows]
                (shui/table-row
                 {:key (str (:db/id row))
                  :data-state (when (row-selected? row) "selected")}
                 (for [column columns']
                   (let [id (str (:db/id row) "-" (:id column))
                         render (get column :cell)]
                     (shui/table-cell
                      {:key id}
                      (render table row column))))))
              (shui/table-row
               (shui/table-cell
                {:colSpan (count columns)
                 :className "h-24 text-center"}
                "No results."))))))])
     (let [selected-rows-count (shui/table-get-selection-rows-count row-selection (:rows table))
           rows-count (count (:rows table))]
       [:div.flex.items-center.justify-end.space-x-2.py-4
        [:div.flex-1.text-sm.text-muted-foreground
         (if (pos? selected-rows-count)
           (str selected-rows-count " of " rows-count " row(s) selected.")
           (str "Total: " rows-count))]])]))
