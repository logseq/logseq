(ns frontend.components.all-pages
  "All pages"
  (:require [frontend.components.block :as component-block]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db.hooks :as db-hooks]
            [logseq.common.config :as common-config]
            [io.factorhouse.hsx.core :as hsx]))

(defn- columns
  []
  (->> [{:id :block/title
         :name (t :page/name)
         :cell (fn [_table row _column]
                 (component-block/page-cp {:show-non-exists-page? true
                                           :skip-async-load? true
                                           :with-tags? false} row))
         :type :string}
        {:id :block.temp/refs-count
         :name (t :page/backlinks)
         :cell (fn [_table row _column]
                 (or (:block.temp/refs-count row) 0))
         :type :number}]
       (remove nil?)
       vec))

(hsx/defc all-pages
  []
  (let [view-parent-uuid (db-hooks/use-resource [:page-identity common-config/views-page-name])
        columns' (views/build-columns {} (columns)
                                      {:with-object-name? false
                                       :with-id? false})]
    [:div.ls-all-pages.w-full.mx-auto
     (when view-parent-uuid
       (views/view {:view-parent-uuid view-parent-uuid
                    :view-feature-type :all-pages
                    :show-items-count? true
                    :columns columns'}))]))
