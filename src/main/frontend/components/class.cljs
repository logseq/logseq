(ns frontend.components.class
  (:require [frontend.components.block :as block]
            [frontend.db.model :as model]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]))

(defn class-children-aux
  [class {:keys [default-collapsed?] :as opts}]
  (let [children (->> (:logseq.property.class/_extends class)
                      ;; Disallow parent cycles
                      (remove #(= (:db/id class) (:db/id %))))]
    (when (seq children)
      [:ul
       (for [child (sort-by :block/title children)]
         (let [title [:li.ml-2 (block/page-reference {:show-brackets? false} (:block/uuid child) nil)]]
           (if (seq (:logseq.property.class/_extends child))
             (ui/foldable
              title
              (class-children-aux child opts)
              {:default-collapsed? default-collapsed?})
             title)))])))

(rum/defc class-children
  [class]
  (when (seq (:logseq.property.class/_extends class))
    (let [children-pages (set (model/get-structured-children (state/get-current-repo) (:db/id class)))
          ;; Expand children if there are about a pageful of total blocks to display
          default-collapsed? (> (count children-pages) 30)]
      (ui/foldable
       [:div.font-medium.opacity-50
        (str "Children (" (count children-pages) ")")]
       [:div.ml-1.mt-2 (class-children-aux class {:default-collapsed? default-collapsed?})]
       {:default-collapsed? false
        :title-trigger? true}))))
