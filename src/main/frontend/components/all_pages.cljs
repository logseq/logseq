(ns frontend.components.all-pages
  "All pages"
  (:require [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db.hooks :as db-hooks]
            [logseq.common.config :as common-config]
            [io.factorhouse.hsx.core :as hsx]
            [reitit.frontend.easy :as rfe]))

(defn- page-title-cell
  [row]
  (let [title (some-> (:block/title row) str)
        page-name (or (:block/uuid row) (:block/name row) title)]
    [:div.flex.h-full.min-w-0.items-center
     [:a.page-ref.truncate
      {:href (rfe/href :page {:name page-name})
       :title title}
      title]]))

(hsx/defc page-refs-count-cell
  "Backlinks count cell. Rows whose count exceeded the worker's bounded scan
   arrive without :block.temp/refs-count; those fetch the exact count through
   the shared :block-ref-count resource only while the cell is mounted."
  [row]
  (let [bundled (:block.temp/refs-count row)
        fetched (:value (db-hooks/use-resource-snapshot
                         (when (and (nil? bundled) (:block/uuid row))
                           [:block-ref-count (:block/uuid row)])))]
    (or bundled fetched 0)))

(defn- columns
  []
  (->> [{:id :block/title
         :name (t :page/name)
         :cell (fn [_table row _column] (page-title-cell row))
         :type :string}
        {:id :block.temp/refs-count
         :name (t :page/backlinks)
         :cell (fn [_table row _column]
                 [page-refs-count-cell row])
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
