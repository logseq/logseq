(ns frontend.components.hierarchy
  (:require [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.state :as state]
            [logseq.graph-parser.text :as text]
            [frontend.ui :as ui]
            [medley.core :as medley]
            [rum.core :as rum]
            [frontend.util :as util]
            [frontend.config :as config]))

(defn- get-relation
  "Get all parent pages along the namespace hierarchy path.
   If there're aliases, only use the first namespaced alias."
  [page]
  (when-let [page (or (text/get-nested-page-name page) page)]
    (let [repo (state/get-current-repo)
          aliases (db/get-page-alias-names repo page)
          all-page-names (conj aliases page)]
      (when-let [page (or (first (filter text/namespace-page? all-page-names))
                          (when (:block/_namespace (db/entity [:block/name (util/page-name-sanity-lc page)]))
                            page))]
        (let [namespace-pages (db/get-namespace-pages repo page)
              parent-routes (db-model/get-page-namespace-routes repo page)
              pages (->> (concat namespace-pages parent-routes)
                         (distinct)
                         (sort-by :block/name)
                         (map (fn [page]
                                (or (:block/original-name page) (:block/name page))))
                         (map #(string/split % "/")))
              page-namespace (db-model/get-page-namespace repo page)
              page-namespace (util/get-page-original-name page-namespace)]
          (cond
            (seq pages)
            {:namespaces pages
             :namespace-pages namespace-pages}

            page-namespace
            {:namespaces [(string/split page-namespace "/")]
             :namespace-pages namespace-pages}

            :else
            nil))))))

(rum/defc page-children
  [page-id parent-children-map namespace-page-map options]
  [:.ml-4.mb-2
   (->> (parent-children-map page-id)
        (sort-by #(get-in namespace-page-map [% :block/original-name]))
        (map #(let [child-name (get-in namespace-page-map [% :block/original-name])]
                (if (seq (parent-children-map %))
                  (ui/foldable (block/page-reference false child-name {} child-name)
                               (page-children % parent-children-map namespace-page-map options)
                               (select-keys options [:default-collapsed?]))
                  [:div
                   (block/page-reference false child-name {} child-name)]))))])

(rum/defc db-version-hierarchy
  [page namespace-pages]
  (let [parent-children-map (reduce (fn [acc m]
                                      (update acc
                                              (get-in m [:block/namespace :db/id])
                                              (fnil conj [])
                                              (:db/id m)))
                                    {}
                                    namespace-pages)
        namespace-page-map (into {} (map (juxt :db/id identity) namespace-pages))
        page-id (:db/id (db/entity [:block/name (util/page-name-sanity-lc page)]))
        ;; Expand children if there are about a page-ful of total blocks to display
        default-collapsed? (> (count namespace-pages) 30)]
    [:div.page-hierarchy.mt-6
     (ui/foldable
      [:h2.font-bold.opacity-30 (str "Hierarchy (" (count namespace-pages) ")")]
      [:div.p-4
       (page-children page-id parent-children-map namespace-page-map {:default-collapsed? default-collapsed?})]
      {:default-collapsed? false
       :title-trigger? true})]))

(rum/defc structures
  [page]
  (let [{:keys [namespaces namespace-pages]} (get-relation page)]
    (when (seq namespaces)
      (if (config/db-based-graph? (state/get-current-repo))
        (db-version-hierarchy page namespace-pages)
        [:div.page-hierarchy.mt-6
         (ui/foldable
          [:h2.font-bold.opacity-30 "Hierarchy"]
          [:ul.namespaces {:style {:margin "12px 24px"}}
           (for [namespace namespaces]
             [:li.my-2
              (->>
               (for [[idx page] (medley/indexed namespace)]
                 (when (and (string? page) page)
                   (let [full-page (->> (take (inc idx) namespace)
                                        util/string-join-path)]
                     (block/page-reference false
                                           full-page
                                           {}
                                           page))))
               (interpose [:span.mx-2.opacity-30 "/"]))])]
          {:default-collapsed? false
           :title-trigger? true})]))))
