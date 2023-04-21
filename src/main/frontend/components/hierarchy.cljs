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
            [frontend.util :as util]))

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
            pages

            page-namespace
            [(string/split page-namespace "/")]

            :else
            nil))))))

(rum/defc structures
  [page]
  (let [namespaces (get-relation page)]
    (when (seq namespaces)
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
         :title-trigger? true})])))
