(ns frontend.components.dnd
  (:require ["react-beautiful-dnd" :refer [Droppable Draggable DragDropContext]]
            [frontend.rum :as r]
            [rum.core :as rum]
            [cljs-bean.core :as bean]
            [medley.core :as medley]
            [goog.object :as gobj]))

(def droppable (r/adapt-class Droppable))
(def draggable (r/adapt-class Draggable))
(def drag-drop-context (r/adapt-class DragDropContext))

(rum/defc drag-content
  [item provided _snapshot]
  (let [opts (merge {:ref (.-innerRef provided)}
                    (bean/->clj (.-draggableProps provided))
                    (bean/->clj (.-dragHandleProps provided)))]
    [:div opts
     (:content item)]))

(rum/defc drop-content
  [col provided _snapshot]
  (let [opts (merge {:ref (.-innerRef provided)}
                    (bean/->clj (.-droppableProps provided)))]
    [:div opts
     (for [[idx item] (medley/indexed col)]
       (draggable
        {:draggableId (:id item)
         :index idx}
        (fn [provided snapshot]
          (drag-content item provided snapshot))))
     (.-placeholder provided)]))

(rum/defc items
  [col {:keys [droppable-id on-drag-end]}]
  (drag-drop-context
   {:on-drag-end (fn [result-js]
                   (let [result (bean/->clj result-js)]
                     (prn :debug :on-drag-end result)
                     (on-drag-end result)))}

   (droppable
    {:droppableId droppable-id}
    (fn [provided snapshot]
      (drop-content col provided snapshot)))))
