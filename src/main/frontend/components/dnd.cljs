(ns frontend.components.dnd
  (:require ["@dnd-kit/core" :refer [DndContext closestCenter MouseSensor useSensor useSensors]]
            ["@dnd-kit/sortable" :refer [useSortable arrayMove SortableContext verticalListSortingStrategy horizontalListSortingStrategy] :as sortable]
            ["@dnd-kit/utilities" :refer [CSS]]
            [cljs-bean.core :as bean]
            [frontend.rum :as r]
            [frontend.state :as state]
            [logseq.shui.hooks :as hooks]
            [rum.core :as rum]))

(def dnd-context (r/adapt-class DndContext))
(def sortable-context (r/adapt-class SortableContext))
;; (def drag-overlay (r/adapt-class DragOverlay))

(rum/defc non-sortable-item
  [props children]
  [:div props children])

(rum/defc sortable-item
  [props children]
  (let [sortable (useSortable #js {:id (:id props)})
        attributes (.-attributes sortable)
        listeners (.-listeners sortable)
        set-node-ref (.-setNodeRef sortable)
        transform (.-transform sortable)
        transition (.-transition sortable)
        style #js {:transform ((.-toString (.-Transform CSS)) transform)
                   :transition transition}]
    [:div (merge
           {:ref set-node-ref
            :style style}
           (bean/->clj attributes)
           (bean/->clj listeners)
           (dissoc props :id))
     children]))

(rum/defc items
  [col* {:keys [on-drag-end parent-node vertical? sort-by-inner-element?]
         :or {vertical? true}}]
  (assert (every? :id col*))
  (when (some #(nil? (:id %)) col*)
    (js/console.error "dnd-kit items without id")
    (prn :col col*))
  (let [col (filter :id col*)
        ids (mapv :id col)
        items' (bean/->js ids)
        id->item (zipmap ids col)
        [items-state set-items] (rum/use-state items')
        _ (hooks/use-effect! (fn [] (set-items items')) [col])
        [_active-id set-active-id] (rum/use-state nil)
        sensors (useSensors (useSensor MouseSensor (bean/->js {:activationConstraint {:distance 8}})))
        dnd-opts {:sensors sensors
                  :collisionDetection closestCenter
                  :onDragStart (fn [^js event]
                                 (when-not (state/editing?)
                                   (set-active-id (.-id ^js (.-active event)))))
                  :onDragEnd (fn [^js event]
                               (let [active-id (.-id ^js (.-active event))
                                     over-id (.-id ^js (.-over event))]
                                 (when active-id
                                   (when-not (= active-id over-id)
                                     (let [old-index (.indexOf ids active-id)
                                           new-index (.indexOf ids over-id)
                                           new-items (arrayMove items-state old-index new-index)]
                                       (when (fn? on-drag-end)
                                         (let [new-values (->> (map (fn [id]
                                                                      (let [item (id->item id)]
                                                                        (if (map? item) (:value item) item)))
                                                                    new-items)
                                                               (remove nil?)
                                                               vec)]
                                           (if (not= (count new-values) (count ids))
                                             (do
                                               (js/console.error "Dnd length not matched: ")
                                               {:old-items items-state
                                                :new-items new-items})
                                             (do
                                               (set-items new-items)
                                               (on-drag-end new-values {:active-id active-id
                                                                        :over-id over-id
                                                                        :direction (if (> new-index old-index)
                                                                                     :down
                                                                                     :up)}))))))))
                                 (set-active-id nil)))}
        sortable-opts {:items items-state
                       :strategy (if vertical?
                                   verticalListSortingStrategy
                                   horizontalListSortingStrategy)}
        children (for [item col]
                   (let [id (str (:id item))
                         prop (merge
                               (:prop item)
                               {:key id :id id})]
                     (cond
                       sort-by-inner-element?
                       [:div {:key id} (:content item)]

                       (:disabled? item)
                       (rum/with-key (non-sortable-item prop (:content item)) id)
                       :else
                       (rum/with-key (sortable-item prop (:content item)) id))))
        children' (if parent-node
                    [parent-node {:key "parent-node"} children]
                    children)]
    (dnd-context
     dnd-opts
     (sortable-context sortable-opts children')
     ;; (createPortal
     ;;  (drag-overlay
     ;;   (when active-id
     ;;     (sortable-item {:key active-id
     ;;                     :id active-id}
     ;;                    (:content (first (filter (fn [{:keys [id]}] (= id active-id)) items))))))
     ;;  js/document.body)
     )))
