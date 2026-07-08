(ns frontend.components.class
  (:require [frontend.components.block :as block]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn class-children-aux
  [children {:keys [default-collapsed?] :as opts}]
  (when (seq children)
    [:ul
     (for [child children]
       (let [title [:li.ml-2 (block/page-reference {:show-brackets? false
                                                    :show-unique-title? false} (:block/uuid child) nil)]]
         (if (seq (:class/children child))
           (ui/foldable
            title
            (class-children-aux (:class/children child) opts)
            {:default-collapsed? default-collapsed?})
           title)))]))

(defn- class-children-count
  [children]
  (->> children
       (mapcat #(tree-seq (comp seq :class/children) :class/children %))
       count))

(hsx/defc class-children
  [class]
  (let [[children-pages set-children-pages!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [children (db-async/<get-class-extends-children-tree (state/get-current-repo) (:db/id class))]
         (set-children-pages! children))
       nil)
     [(:db/id class)])
    (when (seq children-pages)
      (let [children-count (class-children-count children-pages)
            default-collapsed? (> children-count 30)]
        (ui/foldable
         [:div.font-medium.opacity-50
          (t :property/children-count children-count)]
         [:div.ml-1.mt-2 (class-children-aux children-pages {:default-collapsed? default-collapsed?})]
         {:default-collapsed? false
          :title-trigger? true})))))
