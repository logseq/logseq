(ns frontend.components.hierarchy
  (:require [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.text :as text]
            [frontend.ui :as ui]
            [medley.core :as medley]
            [rum.core :as rum]))

;; FIXME: use block/namespace to get the relation
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
    (when (and (seq namespaces)
               (not (and (= 1
                            (count namespaces)
                            (count (first namespaces)))
                         (not (string/includes? (ffirst namespaces) "/")))))
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
        {:default-collapsed? true})])))
