(ns frontend.components.all-pages
  "All pages"
  (:require [frontend.components.block :as component-block]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [logseq.common.config :as common-config]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
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
  (let [[view-parent set-view-parent!] (hooks/use-state nil)
        columns' (views/build-columns {} (columns)
                                      {:with-object-name? false
                                       :with-id? false})]
    (hooks/use-effect!
     (fn []
       (p/let [page (db-async/<get-block (state/get-current-repo) common-config/views-page-name {:children? false})]
         (set-view-parent! page))
       nil)
     [])
    [:div.ls-all-pages.w-full.mx-auto
     (when view-parent
       (views/view {:view-parent view-parent
                    :view-feature-type :all-pages
                    :show-items-count? true
                    :columns columns'}))]))
