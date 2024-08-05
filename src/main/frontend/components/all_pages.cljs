(ns frontend.components.all-pages
  "All pages"
  (:require [frontend.components.block :as component-block]
            [frontend.components.page :as component-page]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [frontend.db :as db]
            [promesa.core :as p]
            [rum.core :as rum]
            [logseq.shui.ui :as shui]))

(defn- columns
  [db]
  (let [db-based? (ldb/db-based-graph? db)]
    (->> [{:id :block/title
           :name (t :block/name)
           :cell (fn [_table row _column]
                   (component-block/page-cp {} row))
           :type :string}
          {:id :block/type
           :name "Type"
           :cell (fn [_table row _column]
                   (let [type (get row :block/type)]
                     [:div.capitalize (if (= type "class") "tag" type)]))
           :get-value (fn [row] (get row :block/type))
           :type :string}
          (when db-based?
            {:id :block/tags
             :name "Tags"})
          {:id :block.temp/refs-count
           :name (t :page/backlinks)
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
  (let [db (db/get-db)
        [data set-data!] (rum/use-state (get-all-pages))
        columns (views/build-columns {} (columns db)
                                     {:with-object-name? false})
        view-entity (first (ldb/get-all-pages-views db))]
    (rum/use-effect!
     (fn []
       (when-let [^js worker @state/*db-worker]
         (p/let [result-str (.get-page-refs-count worker (state/get-current-repo))
                 result (ldb/read-transit-str result-str)
                 data (map (fn [row] (assoc row :block.temp/refs-count (get result (:db/id row) 0))) data)]
           (set-data! data))))
     [])
    [:div.ls-all-pages.w-full
     (views/view view-entity {:data data
                              :set-data! set-data!
                              :title-key :all-pages/table-title
                              :columns columns
                              :on-delete-rows (fn [table selected-rows]
                                                (shui/dialog-open!
                                                 (component-page/batch-delete-dialog
                                                  selected-rows false
                                                  (fn []
                                                    (when-let [f (get-in table [:data-fns :set-row-selection!])]
                                                      (f {}))
                                                    (set-data! (get-all-pages))))))})]))
