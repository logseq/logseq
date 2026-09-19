(ns frontend.components.all-pages
  "All pages"
  (:require [clojure.string :as string]
            [frontend.components.views :as views]
            [frontend.context.i18n :refer [t]]
            [frontend.db.hooks :as db-hooks]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [io.factorhouse.hsx.core :as hsx]
            [reitit.frontend.easy :as rfe]))

(defn- untitled-page-title?
  "Pages with a blank title or a UUID title are shown as Untitled elsewhere."
  [title]
  (or (string/blank? title)
      (util/uuid-string? title)))

(defn- page-title-cell
  [row]
  (let [title (some-> (:block/title row) str)
        untitled? (untitled-page-title? title)
        display-title (if untitled? (t :ui/untitled) title)
        href-name (some-> (or (:block/uuid row) (:block/name row)) str)]
    [:div.flex.h-full.min-w-0.items-center
     [:a.page-ref.truncate
      (cond-> {:title display-title
               :data-ref href-name}
        href-name (assoc :href (rfe/href :page {:name href-name}))
        untitled? (assoc :class "opacity-50"))
      display-title]]))

(defn- columns
  []
  (->> [{:id :block/title
         :name (t :page/name)
         :cell (fn [_table row _column] (page-title-cell row))
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
