(ns frontend.components.all-pages
  "All pages"
  (:require [frontend.components.block :as component-block]
            [frontend.components.page :as component-page]
            [frontend.components.views :as views]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.page :as page-handler]
            [frontend.hooks :as hooks]
            [frontend.state :as state]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- columns
  []
  (->> [{:id :block/title
         :name (t :block/name)
         :cell (fn [_table row _column]
                 (component-block/page-cp {} row))
         :type :string}
        (when (not (config/db-based-graph? (state/get-current-repo)))
          {:id :block/type
           :name "Page type"
           :cell (fn [_table row _column]
                   (let [type (get row :block/type)]
                     [:div.capitalize type]))
           :get-value (fn [row] (get row :block/type))
           :type :string})
        {:id :block.temp/refs-count
         :name (t :page/backlinks)
         :cell (fn [_table row _column] (:block.temp/refs-count row))
         :type :number}]
       (remove nil?)
       vec))

(defn- get-all-pages
  []
  (->> (page-handler/get-all-pages (state/get-current-repo))
       (map (fn [p] (assoc p :id (:db/id p))))))

(rum/defc all-pages < rum/static
  []
  (let [[data set-data!] (rum/use-state nil)
        columns' (views/build-columns {} (columns)
                                      {:with-object-name? false
                                       :with-id? false})]
    (hooks/use-effect!
     (fn []
       (when-let [^js worker @state/*db-worker]
         (p/let [result-str (.get-page-refs-count worker (state/get-current-repo))
                 result (ldb/read-transit-str result-str)
                 data (get-all-pages)
                 data (map (fn [row] (assoc row :block.temp/refs-count (get result (:db/id row) 0))) data)]
           (set-data! data))))
     [])
    [:div.ls-all-pages.w-full.mx-auto
     (views/view {:data data
                  :set-data! set-data!
                  :view-parent (db/get-page common-config/views-page-name)
                  :view-feature-type :all-pages
                  :show-items-count? true
                  :columns columns'
                  :on-delete-rows (fn [table selected-rows]
                                    (shui/dialog-open!
                                     (component-page/batch-delete-dialog
                                      selected-rows false
                                      (fn []
                                        (when-let [f (get-in table [:data-fns :set-row-selection!])]
                                          (f {}))
                                        (set-data! (get-all-pages))))))})]))
