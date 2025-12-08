(ns frontend.components.file-based.hierarchy
  (:require [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.db :as db]
            [frontend.db.file-based.model :as file-model]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.graph-parser.text :as text]
            [medley.core :as medley]
            [rum.core :as rum]))

(defn- get-relation
  "Get all parent pages along the namespace hierarchy path.
   If there're aliases, only use the first namespaced alias."
  [page]
  (when-let [page (or (text/get-nested-page-name page) page)]
    (let [repo (state/get-current-repo)
          page-entity (db/get-page page)
          aliases (when-let [page-id (:db/id page-entity)]
                    (db/get-page-alias-names repo page-id))
          all-page-names (conj aliases page)]
      (when-let [page (or (first (filter text/namespace-page? all-page-names))
                          (when (:block/_namespace (db/entity [:block/name (util/page-name-sanity-lc page)]))
                            page))]
        (let [namespace-pages (file-model/get-namespace-pages repo page)
              parent-routes (file-model/get-page-namespace-routes repo page)
              pages (->> (concat namespace-pages parent-routes)
                         (distinct)
                         (sort-by :block/name)
                         (map (fn [page]
                                (or (:block/title page) (:block/name page))))
                         (map #(string/split % "/")))
              page-namespace (file-model/get-page-namespace repo page)
              page-namespace (util/get-page-title page-namespace)]
          (cond
            (seq pages)
            {:namespaces pages
             :namespace-pages namespace-pages}

            page-namespace
            {:namespaces [(string/split page-namespace "/")]
             :namespace-pages namespace-pages}

            :else
            nil))))))

(rum/defc structures
  [page]
  (let [{:keys [namespaces]} (get-relation page)]
    (when (seq namespaces)
      [:div.page-hierarchy
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
                   (block/page-reference {} full-page page))))
             (interpose [:span.mx-2.opacity-30 "/"]))])]
        {:default-collapsed? false
         :title-trigger? true})])))
