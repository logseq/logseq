(ns frontend.components.all-pages
  "All pages"
  (:require [frontend.components.block :as component-block]
            [frontend.components.views :as views]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.state :as state]
            [logseq.common.config :as common-config]
            [rum.core :as rum]))

(defn- columns
  []
  (->> [{:id :block/title
         :name (t :block/name)
         :cell (fn [_table row _column]
                 (component-block/page-cp {:show-non-exists-page? true
                                           :skip-async-load? true} row))
         :type :string}
        (when (not (config/db-based-graph? (state/get-current-repo)))
          {:id :block/type
           :name "Page type"
           :cell (fn [_table row _column]
                   (let [type (get row :block/type)]
                     [:div.capitalize type]))
           :type :string})
        {:id :block.temp/refs-count
         :name (t :page/backlinks)
         :cell (fn [_table row _column]
                 (:block.temp/refs-count row))
         :type :number}]
       (remove nil?)
       vec))

(rum/defc all-pages < rum/static
  []
  (let [columns' (views/build-columns {} (columns)
                                      {:with-object-name? false
                                       :with-id? false})]
    [:div.ls-all-pages.w-full.mx-auto
     (views/view {:view-parent (db/get-page common-config/views-page-name)
                  :view-feature-type :all-pages
                  :show-items-count? true
                  :columns columns'
                  :title-key :all-pages/table-title})]))
