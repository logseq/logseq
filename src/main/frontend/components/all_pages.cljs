(ns frontend.components.all-pages
  "All pages"
  (:require [clojure.string :as string]
            [frontend.components.block :as component-block]
            [frontend.components.views :as views]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [frontend.db :as db]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- columns
  [db]
  (let [db-based? (ldb/db-based-graph? db)]
    (->> [{:id :block/original-name
           :name "Page name"
           :cell (fn [_table row _column]
                   (component-block/page-cp {} row))
           :type :string}
          {:id :block/type
           :name "Type"
           :cell (fn [_table row _column] [:div.capitalize (string/join ", " (get row :block/type))])
           :get-value (fn [row] (string/join ", " (get row :block/type)))
           :type :string}
          (when db-based?
            {:id :block/tags
             :name "Tags"})
          {:id :block.temp/refs-count
           :name "Backlinks"
           :cell (fn [_table row _column] (:block.temp/refs-count row))
           :type :number}]
         (remove nil?)
         vec)))

(defn- get-all-pages
  []
  (->> (page-handler/get-all-pages (state/get-current-repo))
       (map (fn [p] (assoc p :id (:db/id p))))))

(rum/defc all-pages < rum/static
  []
  (let [[data set-data!] (rum/use-state (get-all-pages))
        columns (views/build-columns {} (columns (db/get-db))
                                     {:with-object-name? false})]
    (rum/use-effect!
     (fn []
       (when-let [^js worker @state/*db-worker]
         (p/let [result-str (.get-page-refs-count worker (state/get-current-repo))
                 result (ldb/read-transit-str result-str)
                 data (map (fn [row] (assoc row :block.temp/refs-count (get result (:db/id row) 0))) data)]
           (set-data! data))))
     [])
    [:div.ls-all-pages.max-w-fit.m-auto.w-full
     (views/view nil {:data data
                      :set-data! set-data!
                      :columns columns})]))

(comment
  (rum/defc all-pages < rum/static
   []
   (let [[input set-input!] (rum/use-state "")
         [sorting set-sorting!] (rum/use-state [{:id :block/updated-at, :asc? false}])
         [row-filter set-row-filter!] (rum/use-state nil)
         [visible-columns set-visible-columns!] (rum/use-state {:block/type false})
         [row-selection set-row-selection!] (rum/use-state {})
         [data set-data!] (rum/use-state (get-all-pages))
         _ (rum/use-effect!
            (fn []
              (when-let [^js worker @state/*db-worker]
                (p/let [result-str (.get-page-refs-count worker (state/get-current-repo))
                        result (ldb/read-transit-str result-str)
                        data (map (fn [row] (assoc row :block.temp/refs-count (get result (:db/id row) 0))) data)]
                  (set-data! data))))
            [])
         table (shui/table-option {:data data
                                   :columns columns
                                   :state {:sorting sorting
                                           :row-filter row-filter
                                           :row-selection row-selection
                                           :visible-columns visible-columns}
                                   :data-fns {:set-sorting! set-sorting!
                                              :set-visible-columns! set-visible-columns!
                                              :set-row-selection! set-row-selection!}})
         selected-rows (shui/table-get-selection-rows row-selection (:rows table))
         selected-rows-count (count selected-rows)
         selected? (pos? selected-rows-count)]
     [:div.w-full
      [:div.flex.items-center.pb-4.justify-between
       [:div.ml-1
        (when selected?
          (shui/button {:variant :destructive
                        :class "text-red-500"
                        :size :sm
                        :on-click #(shui/dialog-open!
                                    (component-page/batch-delete-dialog selected-rows false (fn [] (set-data! (get-all-pages)))))}
                       (ui/icon "trash-x")))]
       [:div.flex.items-center.gap-2
        (shui/input
         {:placeholder "Search pages"
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
                                               (when row
                                                 (pos? (fuzzy-search/score (string/lower-case value) (:block/name row))))))))))
          :class "max-w-sm !h-7 !py-0"})
        (columns-select columns table)]]
      (let [columns' (:columns table)
            rows (:rows table)]
        [:div.rounded-md.border
         (ui/virtualized-table
          {:custom-scroll-parent (gdom/getElement "main-content-container")
           :total-count (count rows)
           :fixedHeaderContent (fn [] (table-header table columns'))
           :components {:Table (fn [props]
                                 (shui/table {}
                                             (.-children props)))
                        :TableRow (fn [props] (table-row table rows columns' props))}})])

      (let [rows-count (count (:rows table))]
        [:div.flex.items-center.justify-end.space-x-2.py-4
         [:div.flex-1.text-sm.text-muted-foreground
          (if (pos? selected-rows-count)
            (str selected-rows-count " of " rows-count " row(s) selected.")
            (str "Total: " rows-count))]])])))
