(ns frontend.components.all-pages
  "All pages"
  (:require [frontend.components.block :as component-block]
            [frontend.components.page :as component-page]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [frontend.hooks :as hooks]))

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
  (let [pages (->> (page-handler/get-all-pages (state/get-current-repo))
                   (map (fn [p] (assoc p :id (:db/id p)))))]
    (if (config/db-based-graph? (state/get-current-repo))
      pages
      ;; FIXME: Remove when bug with page named 'page with #tag' is fixed
      (let [buggy-pages (remove :block/type pages)]
        (when (seq buggy-pages)
          (js/console.error "The following pages aren't displayed because they don't have a :block/type" buggy-pages))
        (filter :block/type pages)))))

(rum/defc all-pages < rum/static
  []
  (let [db (db/get-db)
        [data set-data!] (rum/use-state nil)
        [loading? set-loading!] (rum/use-state true)
        columns' (views/build-columns {} (columns)
                                      {:with-object-name? false
                                       :with-id? false})
        view-entity (first (ldb/get-all-pages-views db))]
    (hooks/use-effect!
     (fn []
       (when-let [^js worker @state/*db-worker]
         (p/let [result-str (.get-page-refs-count worker (state/get-current-repo))
                 result (ldb/read-transit-str result-str)
                 data (get-all-pages)
                 data (map (fn [row] (assoc row :block.temp/refs-count (get result (:db/id row) 0))) data)]
           (set-data! data)
           (set-loading! false))))
     [])
    [:div.ls-all-pages.w-full.mx-auto
     (if loading?
       (ui/skeleton)
       (views/view view-entity {:data data
                                :set-data! set-data!
                                :title-key :all-pages/table-title
                                :columns columns'
                                :on-delete-rows (fn [table selected-rows]
                                                  (shui/dialog-open!
                                                   (component-page/batch-delete-dialog
                                                    selected-rows false
                                                    (fn []
                                                      (when-let [f (get-in table [:data-fns :set-row-selection!])]
                                                        (f {}))
                                                      (set-data! (get-all-pages))))))}))]))
