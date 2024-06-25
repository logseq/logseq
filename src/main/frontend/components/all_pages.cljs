(ns frontend.components.all-pages
  "All pages"
  (:require [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [cljs-bean.core :refer [->js ->clj]]
            [frontend.util :as util]
            [goog.object :as gobj]
            [frontend.ui :as ui]))

(def useReactTable (gobj/get shui/tanStackReact "useReactTable"))
(def getCoreRowModel (gobj/get shui/tanStackReact "getCoreRowModel"))
(def getSortedRowModel (gobj/get shui/tanStackReact "getSortedRowModel"))
(def getFilteredRowModel (gobj/get shui/tanStackReact "getFilteredRowModel"))
(def getPaginationRowModel (gobj/get shui/tanStackReact "getPaginationRowModel"))
(def flexRender (gobj/get shui/tanStackReact "flexRender"))


(def data
  [{:id "m5gr84i9" :amount 316 :status "success" :email "ken99@yahoo.com"}
   {:id "3u1reuv4" :amount 242 :status "success" :email "Abe45@gmail.com"}
   {:id "derv1ws0" :amount 837 :status "processing" :email "Monserrat44@gmail.com"}
   {:id "5kma53ae" :amount 874 :status "success" :email "Silas22@gmail.com"}
   {:id "bhqecj4p" :amount 721 :status "failed" :email "carmella@hotmail.com"}])

(defn header-checkbox [^js table]
  (shui/checkbox
   {:checked (or (.getIsAllPageRowsSelected table)
                 (and (.getIsSomePageRowsSelected table) "indeterminate"))
    :on-checked-change #(.toggleAllPageRowsSelected table %)
    :aria-label "Select all"}))

(defn row-checkbox [^js row]
  (shui/checkbox
   {:checked (.getIsSelected row)
    :on-checked-change (fn [v] (.toggleSelected row v))
    :aria-label "Select row"}))

(def columns
  [{:id "select"
    :header (fn [opts] (header-checkbox (.-table opts)))
    :cell (fn [opts] (row-checkbox (.-row opts)))
    :enableSorting false
    :enableHiding false}
   {:accessorKey "status"
    :header "Status"
    :cell (fn [^js opts]
            (.getValue (.-row opts) "status"))}
   {:accessorKey "email"
    :header (fn [^js opts]
              (shui/button
               {:variant "ghost"
                :onClick #(.toggleSorting ^js (.-column opts) (= "asc" (.getIsSorted ^js (.-column opts))))}
               "Email"
               (ui/icon "arrows-up-down")))
    :cell (fn [opts] (.getValue (.-row opts) "email"))}
   {:accessorKey "amount"
    :header (fn [_opts] "Amount")
    :cell (fn [opts]
            (let [amount (.getValue (.-row opts) "amount")
                  formatted (.format (js/Intl.NumberFormat. "en-US" #js {:style "currency" :currency "USD"}) amount)]
              formatted))}
   {:id "actions"
    :enableHiding false
    :cell (fn [opts]
            (let [payment (.-original (.-row opts))]
              (shui/dropdown-menu
               (shui/dropdown-menu-trigger
                {:asChild true}
                (shui/button
                 {:variant "ghost" :className "h-8 w-8 p-0"}
                 [:span.sr-only "Open menu"]
                 (ui/icon "dots")))
               (shui/dropdown-menu-content
                (shui/dropdown-menu-label
                 "Actions")
                (shui/dropdown-menu-item
                 {:onClick #(js/navigator.clipboard.writeText (.-id payment))}
                 "Copy payment ID")
                (shui/dropdown-menu-separator)
                (shui/dropdown-menu-item
                 "View customer")
                (shui/dropdown-menu-item
                 "View payment details")))))}])

(rum/defc all-pages < rum/static
  []
  (let [[sorting set-sorting!] (rum/use-state #js [])
        [column-filters set-column-filters!] (rum/use-state #js [])
        [column-visibility set-column-visibility!] (rum/use-state #js {})
        [row-selection set-row-selection!] (rum/use-state #js {})
        ^js table (useReactTable #js {:columns (->js columns)
                                      :data (->js data)
                                      :state (->js
                                              {:sorting sorting
                                               :columnFilters column-filters
                                               :columnVisibility column-visibility
                                               :rowSelection row-selection})
                                      :getCoreRowModel (getCoreRowModel)
                                      :getSortedRowModel (getSortedRowModel)
                                      :getFilteredRowModel (getFilteredRowModel)
                                      :getPaginationRowModel (getPaginationRowModel)
                                      :onSortingChange set-sorting!
                                      :onColumnFiltersChange set-column-filters!
                                      :onColumnVisibilityChange set-column-visibility!
                                      :onRowSelectionChange set-row-selection!})]
    [:div.w-full
     [:div.flex.items-center.py-4
      (shui/input
       {:placeholder "Filter emails..."
        :value (or
                (when-let [^js column (.getColumn table "email")]
                  (try
                    (str (.getFilterValue column))
                    (catch :default _
                      nil)))
                "")
        :onChange (fn [e]
                    (when-let [^js column (.getColumn table "email")]
                      (.setFilterValue column (util/evalue e))))
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
        (for [^js column (.getAllColumns table)]
          (shui/dropdown-menu-checkbox-item
           {:key (.-id column)
            :className "capitalize"
            :checked (.getIsVisible column)
            :onCheckedChange #(.toggleVisibility column %)}
           (.-id column)))))]
     [:div.rounded-md.border
      (shui/table
       (shui/table-header
        (for [^js headerGroup (.getHeaderGroups table)]
          (shui/table-row
           {:key (.-id headerGroup)}
           (for [^js header (.-headers headerGroup)]
             (shui/table-head
              {:key (.-id header)}
              (when-not (.-isPlaceholder header)
                (flexRender
                 (-> header .-column .-columnDef .-header)
                 (.getContext header))))))))
       (shui/table-body
        (let [^js rows (.-rows (.getRowModel table))]
          (if (pos? (count rows))
            (for [^js row rows]
              (shui/table-row
               {:key (.-id row)
                :data-state (when (.getIsSelected row) "selected")}
               (for [^js cell (.getVisibleCells row)]
                 (shui/table-cell
                  {:key (.-id cell)}
                  (flexRender
                   (-> cell .-column .-columnDef .-cell)
                   (.getContext cell))))))
            (shui/table-row
             (shui/table-cell
              {:colSpan (count columns)
               :className "h-24 text-center"}
              "No results."))))))]
     [:div.flex.items-center.justify-end.space-x-2.py-4
      [:div.flex-1.text-sm.text-muted-foreground
       (let [selected-rows (.-rows ^js (.getFilteredSelectedRowModel table))
             filter-rows (.-rows ^js (.getFilteredRowModel table))]
         (str (count selected-rows)
              " of "
              (count filter-rows) " row(s) selected."))]
      [:div.space-x-2
       (shui/button {:variant "outline"
                     :size "sm"
                     :onClick #(.previousPage table)
                     :disabled (not (.getCanPreviousPage table))}
                    "Previous")
       (shui/button {:variant "outline"
                     :size "sm"
                     :onClick #(.nextPage table)
                     :disabled (not (.getCanNextPage table))}
                    "Next")]]]))
