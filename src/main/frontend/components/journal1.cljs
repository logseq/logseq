(ns frontend.components.journal1
  (:require [frontend.modules.journal.core :as journal-core]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.db-mixins :as db-mixins]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.state :as outliner-state]
            [frontend.util :as util]
            [frontend.modules.outliner.generator :as tg]
            [frontend.modules.outliner.tree-test :as tt]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]))

(def enter-key-code 13)
(def tab-key-code 9)
(def up-key-code 38)
(def down-key-code 40)

(defonce state
  (atom {:editor/current-node  nil
         :outliner/node-number 10}))

(defn sub
  [ks]
  (if (coll? ks)
    (util/react (rum/cursor-in state ks))
    (util/react (rum/cursor state ks))))

(defn update-node-num
  [num]
  (swap! state assoc :outliner/node-number num))

;;; helpers
(defn textarea-focus!
  [block-id]
  (.focus
   (.querySelector js/document
                   (str "[data-bid='" block-id "'] > textarea"))))

;;; handlers
(defn set-current-node
  [node]
  (swap! state assoc :editor/current-node node))

(defn on-bullet-zoom
  "zoom in/out bullet"
  [node]
  (js/console.log "[zoom in/out] " (:data node)))

(defn on-block-focus!
  ([delta] (on-block-focus! (:editor/current-node @state) delta))
  ([node delta]
   ;; TODO: should get up/down block id by tree API !
   (when-let [bid (:block/id (:data node))]
     (let [js-bids (.map (.from js/Array (.querySelectorAll js/document "[data-bid]")) #(.. ^js % -dataset -bid))
           current-index-of (.indexOf js-bids (.toString bid))]
       (when-not (= -1 current-index-of)
         (if-let [bid (aget js-bids (+ delta current-index-of))]
           (textarea-focus! bid)))))))

(defn block-save-with-content
  [block content]
  (let [new-block (-> (assoc block :block/content content)
                      (outliner-core/block))]
    (tree/-save new-block)))

(defn block-indent
  [block-node]
  (let [parent-node (tree/-get-left block-node)]
    (tree/move-subtree block-node parent-node nil)))

(defn block-new
  [block-node]
  (let [left-id (tree/-get-id block-node)
        parent-id (tree/-get-parent-id block-node)
        new-node-id (outliner-core/gen-block-id)
        new-node
        (outliner-core/block
         {:block/id        new-node-id
          :block/left-id   [:block/id left-id]
          :block/parent-id [:block/id parent-id]
          :block/content   ""})]
    (tree/insert-node-as-sibling new-node block-node)
    (set-current-node new-node)))

;;; components
(rum/defc current-node-observer
  [current-node]
  (rum/use-effect!
   (fn []
     (when-let [block (:data current-node)]
       (js/setTimeout
        #(textarea-focus! (:block/id block))
        16)
       #()))
   [current-node])
  [:span {:key 0}])

;;; FIXME: node should be associated with block Atom data
;;; FIXME: for reactivity ?
(defn node-render
  [node]
  (let [old-block (:data node)
        bid (:block/id old-block)
        content (:block/content old-block)]
    [:div.block-node {:key bid :data-bid bid}
     [:span.bullet {:on-click #(on-bullet-zoom node)}]
     [:textarea
      {:on-key-down   (fn [^js/MouseEvent e]
                        (let [pressed-code (.-keyCode e)]
                          (cond
                            ;; create
                            (= enter-key-code pressed-code)
                            (do
                              (.blur (.-target e))
                              (block-new node)
                              (.preventDefault e))

                            ;; update
                            (= tab-key-code pressed-code)
                            (do (.blur (.-target e))
                                (block-indent node))

                            ;; up
                            (= up-key-code pressed-code)
                            (on-block-focus! -1)

                            ;; down
                            (= down-key-code pressed-code)
                            (on-block-focus! 1)

                            :else
                            (js/console.debug "[KEY]" pressed-code))))
       :on-focus      #(set-current-node node)
       :on-blur       #(let [value (util/evalue %)]
                         (set-current-node nil)
                         (block-save-with-content old-block value))
       :default-value content}]]))

(defn down-render
  [node children]
  (if (some? children)
    [:div.blocks
     (node-render node)
     [:div.children children]]

    [:div.blocks
     (node-render node)]))

(defn right-render
  [node-tree children]
  (if (empty? children)
    [node-tree]
    (into children [node-tree])))

(def root-parent-id 1)
(def root-left-id 1)

(defn render
  [number node children]
  (when (tree/satisfied-inode? node)
    (let [node-tree (let [down (tree/-get-down node)]
                      (if (and (tree/satisfied-inode? down)
                            (pos? @number))
                        (do (swap! number dec)
                            (down-render node (render number down nil)))
                        (down-render node nil)))
          right (tree/-get-right node)]
      (let [new-children (right-render node-tree children)]
        (if (and (tree/satisfied-inode? right)
              (pos? @number))
          (do (swap! number dec)
              (render number right new-children))
          new-children)))))

(rum/defcs render-react-tree* <
  {:did-mount (fn [state]
                (let [[init-node] (:rum/args state)]
                  (js/setTimeout #(set-current-node init-node) 10))
                state)}
  rum/reactive
  [state init-node]
  (let [num (sub :outliner/node-number)
        current-node (sub :editor/current-node)
        number (atom num)]
    [:div.page
     (rum/with-key (current-node-observer current-node)
       (str "current-" (tree/-get-id init-node)))
     (render number init-node nil)]))

(rum/defc all-journals < rum/reactive db-mixins/query
  []
  (do
    ;(tg/generate-random-tree 1000)
    ;(tg/generate-random-block 10e4)
    (tt/build-db-records tt/node-tree)
    (let [init-node (outliner-state/get-block-and-ensure-position
                      "1" "1")]
        [:div.journal1
         (rum/with-key (render-react-tree* init-node)
           (str "id-" (tree/-get-id init-node)))])))