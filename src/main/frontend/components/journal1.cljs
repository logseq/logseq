(ns frontend.components.journal1
  (:require [frontend.modules.journal.core :as journal-core]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.db-mixins :as db-mixins]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.state :as outliner-state]
            [frontend.util :as util]
            [frontend.modules.outliner.tree-test :as tt]))

(def enter-key-code 13)
(def tab-key-code 9)

(def state
  (atom {:editor/current-node nil
         :outliner/node-number 10}))

(defn sub
  [ks]
  (if (coll? ks)
    (util/react (rum/cursor-in state ks))
    (util/react (rum/cursor state ks))))

(defn textarea-option
  [node]
  (let [old-block (:data node)
        content (:block/content old-block)]
    {:on-key-down
     (fn [e]
       (let [pressed-code (.-keyCode e)]
         (cond
           (= enter-key-code pressed-code)
           (do
             (.blur (.-target e))
             (.preventDefault e)
             (let [left-id (tree/-get-id node)
                   parent-id (tree/-get-parent-id node)
                   new-node-id (outliner-core/gen-block-id)
                   new-node
                   (outliner-core/block
                     {:block/id new-node-id
                      :block/left-id [:block/id left-id]
                      :block/parent-id [:block/id parent-id]
                      :block/content (str new-node-id)})]
               (tree/insert-node-as-sibling new-node node)))


           (= tab-key-code pressed-code)
           (do (.blur (.-target e))
               (let [parent-node (tree/-get-left node)]
                 (tree/move-subtree node parent-node nil)))

           :else
           :no-extra-operate)))


     :on-blur
     (fn [e]
       (let [value (util/evalue e)
             new-block (-> (assoc old-block :block/content value)
                         (outliner-core/block))]
         (tree/-save new-block)))
     :default-value content}))

(defn single-node-render
  [node]
  (let []
    [:div.single-node
     [:textarea (textarea-option node)]]))

(defn down-render
  [node children]
  [:div.down
   [:div [:textarea (textarea-option node)]]
   [:div.children
    children]])

(defn right-render
  [node-tree children]
  (if (empty? children)
    [:div.right node-tree]
    (into children [node-tree])))

(def root-parent-id 1)
(def root-left-id 1)

(rum/defc render-react-tree
  < rum/reactive
  [init-node]
  (let [num (sub :outliner/node-number)
        number (atom num)]
    (letfn [(render [node children]
              (when (tree/satisfied-inode? node)
                (let [node-tree (let [down (tree/-get-down node)]
                                  (if (and (tree/satisfied-inode? down)
                                        (pos? @number))
                                    (do (swap! number dec)
                                        (down-render node (render down nil)))
                                    (single-node-render node)))
                      right (tree/-get-right node)]
                  (let [new-children (right-render node-tree children)]
                    (if (and (tree/satisfied-inode? right)
                          (pos? @number))
                      (do (swap! number dec)
                          (render right new-children))
                      new-children)))))]

      (let [rs (render init-node nil)]
        ;;(cljs.pprint/pprint rs)
        rs))))

(rum/defc all-journals < rum/reactive db-mixins/query
  []
  (do (tt/build-db-records tt/node-tree)
      (let [init-node (outliner-state/get-block-and-ensure-position
                        root-parent-id root-left-id)]
        [:div.journal1
         (render-react-tree init-node)])))