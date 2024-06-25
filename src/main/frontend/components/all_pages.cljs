(ns frontend.components.all-pages
  "All pages"
  (:require [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [logseq.shui.table.core :as table]
            [clojure.string :as string]))

(def data
  [{:id "m5gr84i9" :amount 316 :status "success" :email "ken99@yahoo.com"}
   {:id "3u1reuv4" :amount 242 :status "success" :email "Abe45@gmail.com"}
   {:id "derv1ws0" :amount 837 :status "processing" :email "Monserrat44@gmail.com"}
   {:id "5kma53ae" :amount 874 :status "success" :email "Silas22@gmail.com"}
   {:id "bhqecj4p" :amount 721 :status "failed" :email "carmella@hotmail.com"}])

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

(def columns
  [{:id :select
    :name "Select"
    :header (fn [table _column] (header-checkbox table))
    :cell (fn [table row column] (row-checkbox table row column))
    :column-list? false}
   {:id :status
    :name "Status"
    :header "Status"
    :cell (fn [_table row column]
            (get row (:id column)))}
   {:id :email
    :name "Email"
    :header (fn [{:keys [column-toggle-sorting!]} column]
              (shui/button
               {:variant "ghost"
                :onClick #(column-toggle-sorting! column)}
               "Email"
               (ui/icon "arrows-up-down")))
    :cell (fn [_table row column]
            (get row (:id column)))}
   {:id :amount
    :name "Amount"
    :header (fn [_] "Amount")
    :cell (fn [_table row column]
            (let [amount (get row (:id column))
                  formatted (.format (js/Intl.NumberFormat. "en-US" #js {:style "currency" :currency "USD"}) amount)]
              formatted))}
   {:id :actions
    :column-list? false
    :cell (fn [_table row _column]
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
               {:onClick #(js/navigator.clipboard.writeText (:id row))}
               "Copy payment ID")
              (shui/dropdown-menu-separator)
              (shui/dropdown-menu-item
               "View customer")
              (shui/dropdown-menu-item
               "View payment details"))))}])

(rum/defc all-pages < rum/static
  []
  (let [[input set-input!] (rum/use-state "")
        [sorting set-sorting!] (rum/use-state [])
        [row-filter set-row-filter!] (rum/use-state nil)
        [visible-columns set-visible-columns!] (rum/use-state {})
        [row-selection set-row-selection!] (rum/use-state {})
        {:keys [column-visible? column-toggle-visiblity row-selected?]
         :as table} (table/table-option {:data data
                                         :columns columns
                                         :state {:sorting sorting
                                                 :row-filter row-filter
                                                 :row-selection row-selection
                                                 :visible-columns visible-columns}
                                         :data-fns {:set-sorting! set-sorting!
                                                    :set-visible-columns! set-visible-columns!
                                                    :set-row-selection! set-row-selection!}})]
    [:div.w-full
     [:div.flex.items-center.py-4
      (shui/input
       {:placeholder "Filter emails..."
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
                                             (when row (string/includes? (string/lower-case (:email row)) (string/lower-case value)))))))))
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
        (table/table
         (table/table-header
          (table/table-row
           (for [column columns']
             (table/table-head
              {:key (:id column)}
              (let [header-fn (:header column)]
                (if (fn? header-fn)
                  (header-fn table column)
                  header-fn))))))
         (table/table-body
          (let [rows (:rows table)]
            (if (pos? (count rows))
              (for [row rows]
                (table/table-row
                 {:key (str (:id row))
                  :data-state (when (row-selected? row) "selected")}
                 (for [column columns']
                   (let [id (str (:id row) "-" (:id column))
                         render (get column :cell)]
                     (table/table-cell
                      {:key id}
                      (render table row column))))))
              (table/table-row
               (table/table-cell
                {:colSpan (count columns)
                 :className "h-24 text-center"}
                "No results."))))))])
     (let [selected-rows-count (table/get-selection-rows-count row-selection (:rows table))
           rows-count (count (:rows table))]
       [:div.flex.items-center.justify-end.space-x-2.py-4
        [:div.flex-1.text-sm.text-muted-foreground
         (if (pos? selected-rows-count)
           (str selected-rows-count " of " rows-count " row(s) selected.")
           (str "Total: " rows-count))]])]))
