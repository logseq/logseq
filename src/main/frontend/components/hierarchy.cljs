(ns frontend.components.hierarchy
  (:require [frontend.search :as search]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [medley.core :as medley]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.text :as text]))

(defn get-relation
  [page]
  (when (text/namespace-page? page)
    (->> (db/get-namespace-pages (state/get-current-repo) page)
         (map (fn [page]
                (or (:block/original-name page) (:block/name page))))
         (map #(string/split % #"/"))
         (remove #(= % [page]))
         (sort))))

(rum/defc structures
  [page]
  (let [namespaces (get-relation page)]
    (when (seq namespaces)
      [:div.page-hierachy.mt-6
       (ui/foldable
        [:h2.font-bold.opacity-30 "Hierarchy"]
        [:ul.namespaces {:style {:margin "12px 24px"}}
         (for [namespace namespaces]
           [:li.my-2
            (->>
             (for [[idx page] (medley/indexed namespace)]
               (when (and (string? page) page)
                 (let [full-page (->> (take (inc idx) namespace)
                                      (string/join "/"))]
                   (block/page-reference false
                                         full-page
                                         {}
                                         page))))
             (interpose [:span.mx-2.opacity-30 "/"]))])]
        true)])))
