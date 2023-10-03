(ns frontend.components.dnd
  (:require ["react-beautiful-dnd" :refer [Droppable Draggable DragDropContext]]
            [frontend.rum :as r]
            [rum.core :as rum]
            [cljs-bean.core :as bean]
            [medley.core :as medley]))

(def droppable (r/adapt-class Droppable))
(def draggable (r/adapt-class Draggable))
(def drag-drop-context (r/adapt-class DragDropContext))

(rum/defc drag-content
  [item provided _snapshot opts]
  (let [child-opts (merge {:ref (.-innerRef provided)}
                          (bean/->clj (.-draggableProps provided))
                          (bean/->clj (.-dragHandleProps provided))
                          (:child-opts opts))]
    [(:child-node opts)
     (assoc child-opts :key (str (:droppable-id opts) "-" (:id item)))
     (:content item)]))

(rum/defc drop-content
  [col provided _snapshot opts]
  (let [parent-opts (merge {:ref (.-innerRef provided)}
                           (bean/->clj (.-droppableProps provided))
                           (:parent-opts opts))]
    [(:parent-node opts)
     parent-opts
     (for [[idx item] (medley/indexed col)]
       (draggable
        {:draggableId (str (:id item))
         :key (str (:id item))
         :index idx}
        (fn [provided snapshot]
          (drag-content item provided snapshot opts))))
     (.-placeholder provided)]))

(rum/defc items
  [col {:keys [droppable-id on-drag-end
               parent-node child-node
               parent-opts child-opts]
        :or {parent-node :div
             child-node :div}
        :as opts}]
  (drag-drop-context
   {:on-drag-end (fn [result-js]
                   (let [result (bean/->clj result-js)]
                     (on-drag-end result)))}

   (droppable
    {:droppableId droppable-id}
    (fn [provided snapshot]
      (drop-content col provided snapshot opts)))))
