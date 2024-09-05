(ns frontend.components.class
  (:require [frontend.components.block :as block]
            [frontend.db.model :as model]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]))

(defn class-children-aux
  [class {:keys [default-collapsed?] :as opts}]
  (let [children (->> (:logseq.property/_parent class)
                      ;; Disallow parent cycles
                      (remove #(= (:db/id class) (:db/id %))))]
    (when (seq children)
      [:ul
       (for [child (sort-by :block/title children)]
         (let [title [:li.ml-2 (block/page-reference false (:block/title child) {:show-brackets? false} nil)]]
           (if (seq (:logseq.property/_parent child))
             (ui/foldable
              title
              (class-children-aux child opts)
              {:default-collapsed? default-collapsed?})
             title)))])))

(rum/defc class-children
  [class]
  (when (seq (:logseq.property/_parent class))
    (let [children-pages (set (model/get-structured-children (state/get-current-repo) (:db/id class)))
          ;; Expand children if there are about a pageful of total blocks to display
          default-collapsed? (> (count children-pages) 30)]
      [:div.mt-4
       (ui/foldable
        [:h2.font-medium "Children (" (count children-pages) ")"]
        [:div.mt-2.ml-1 (class-children-aux class {:default-collapsed? default-collapsed?})]
        {:default-collapsed? false
         :title-trigger? true})])))
