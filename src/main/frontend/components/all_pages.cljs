(ns frontend.components.all-pages
  "All pages"
  (:require [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [cljs-bean.core :refer [->js ->clj]]
            [frontend.util :as util]
            [goog.object :as gobj]))

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
    :on-checked-change #(.toggleSelected row %)
    :aria-label "Select row"}))

(def columns
  [{:id "select"
    :header (fn [opts] (header-checkbox (.-table opts)))
    :cell (fn [opts] (row-checkbox (.-row opts)))
    :enableSorting false
    :enableHiding false}
   {:id "status"
    :header "Status"
    :cell (fn [^js opts] [:div.capitalize (.-status (.-original (.-row opts)))])}
   {:id "email"
    :header (fn [^js opts]
              (shui/button
               {:variant "ghost"
                :onClick #(.toggleSorting ^js (.-column opts) (= "asc" (.getIsSorted ^js (.-column opts))))}
               "Email"
               ;; [:> ArrowUpDown {:className "ml-2 h-4 w-4"}]
                ))
    :cell (fn [opts] [:div.lowercase (.-email (.-original (.-row opts)))])}
   {:id "amount"
    :header (fn [] [:div.text-right "Amount"])
    :cell (fn [opts]
            (let [amount (.-amount (.-original (.-row opts)))
                  formatted (.format (js/Intl.NumberFormat. "en-US" #js {:style "currency" :currency "USD"}) amount)]
              [:div.text-right.font-medium formatted]))}
   {:id "actions"
    :enableHiding false
    :cell (fn [opts]
            (let [payment (.-original (.-row opts))]
              (shui/dropdown-menu
               (shui/dropdown-menu-trigger {:asChild true}
                (shui/button
                 {:variant "ghost" :className "h-8 w-8 p-0"}
                 [:span.sr-only "Open menu"]
                 ;; [:> MoreHorizontal {:className "h-4 w-4"}]
                  ))
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

(rum/defc all-pages
  []
  (let [[sorting set-sorting!] (rum/use-state {})
        [column-filters set-column-filters!] (rum/use-state {})
        [column-visibility set-column-visibility!] (rum/use-state {})
        [row-selection set-row-selection!] (rum/use-state {})
        ^js table (useReactTable #js {:options #js {}
                                      :columns (clj->js columns)
                                      :data (clj->js data)
                                      :state (clj->js
                                              {:sorting sorting
                                               :columnFilters column-filters
                                               :columnVisibility column-visibility
                                               :rowSelection row-selection})
                                      :getCoreRowModel getCoreRowModel
                                      :getSortedRowModel getSortedRowModel
                                      :getFilteredRowModel getFilteredRowModel
                                      :getPaginationRowModel getPaginationRowModel
                                      :onSortingChange (fn [new-sorting] (set-sorting! (->clj new-sorting)))
                                      :onColumnFiltersChange (fn [new-filters] (set-column-filters! (->clj new-filters)))
                                      :onColumnVisibilityChange (fn [new-visibility] (set-column-visibility! (->clj new-visibility)))
                                      :onRowSelectionChange (fn [new-selection] (set-row-selection! (->clj new-selection)))})]
    [:div.w-full
     [:div.flex.items-center.py-4
      (shui/input
       {:placeholder "Filter emails..."
        :value (or
                (when-let [^js column (.getColumn table "email")]
                  (try
                    (.getFilterValue column)
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
         ;; [:> ChevronDown {:className "ml-2 h-4 w-4"}]
         ))
       (shui/dropdown-menu-content
        {:align "end"}
        (for [^js column (.getAllColumns table)]
          (rum/with-key
            (shui/dropdown-menu-checkbox-item
             {:key (.-id column)
              :className "capitalize"
              :checked (.getIsVisible column)
              :onCheckedChange #(.toggleVisibility column (not (.getIsVisible column)))})
            (.-id column)))))]
     [:div.rounded-md.border
      (shui/table
       (shui/table-header
        (for [headerGroup (.getHeaderGroups table)]
          (rum/with-key
            (shui/table-row
             (for [^js header (.-headers headerGroup)]
               (rum/with-key
                 (shui/table-head
                  (when-not (.-isPlaceholder header)
                    (flexRender
                     (-> header .-column .-columnDef .-header)
                     (.getContext header))))
                 (.-id header))))
            (.-id headerGroup))))
       (shui/table-body
        (let [^js rows (.-rows (.getRowModel table))]
          (if (pos? (count rows))
            (for [^js row rows]
              (rum/with-key
                (shui/table-row
                 {:data-state (when (.getIsSelected row) "selected")}
                 (for [^js cell (.getVisibleCells row)]
                   (rum/with-key
                     (shui/table-cell
                      (flexRender
                       (-> cell .-column .-columnDef .-cell)
                       (.getContext cell)))
                     (.-id cell))))
                (.-id row)))
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
