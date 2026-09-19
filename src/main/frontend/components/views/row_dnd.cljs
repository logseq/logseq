(ns frontend.components.views.row-dnd
  "Handle-based dragging of virtualized table rows and group drop targets."
  (:require ["@dnd-kit/core" :refer [DndContext DragOverlay KeyboardSensor MouseSensor TouchSensor
                                    closestCenter pointerWithin useDroppable useSensor useSensors]]
            ["@dnd-kit/sortable" :refer [SortableContext sortableKeyboardCoordinates useSortable verticalListSortingStrategy]]
            ["@dnd-kit/utilities" :refer [CSS]]
            ["react" :as react]
            ["react-dom" :refer [createPortal]]
            [cljs-bean.core :as bean]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.notification :as notification]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [io.factorhouse.hsx.core :as hsx]
            [lambdaisland.glogi :as log]
            [logseq.shui.hooks :as hooks]
            [promesa.core :as p]))

(defonce ^:private row-context (react/createContext false))

(defn row-id [group row-uuid] (str (pr-str group) "/" row-uuid))

(defn- collision-detection
  [args]
  (if (.-pointerCoordinates ^js args)
    (pointerWithin args)
    (closestCenter args)))

(defn use-row
  [row group]
  (let [enabled? (react/useContext row-context)
        sortable (useSortable #js {:id (row-id group (:block/uuid row))
                                  :disabled (or (not enabled?) (state/editing?))
                                  :data #js {:rowUuid (:block/uuid row)
                                             :title (:block/title row)
                                             :group group}})]
    (when enabled?
      {:ref (.-setNodeRef sortable)
       :style {:transform ((.-toString (.-Transform CSS)) (.-transform sortable))
               :transition (.-transition sortable)
               :opacity (when (.-isDragging sortable) 0.35)}
       :handle (merge (bean/->clj (.-attributes sortable))
                      (bean/->clj (.-listeners sortable))
                      {:ref (.-setActivatorNodeRef sortable)
                       :data-table-row-drag-id (row-id group (:block/uuid row))})})))

(hsx/defc handle
  [props]
  [:button.table-row-drag-handle
   (merge props
          {:type "button"
           :data-table-row-drag true
           :aria-label (t :view.table/reorder-row)
           :title (t :view.table/drag-to-reorder)
           :on-click #(.stopPropagation %)})
   (ui/icon "grip-vertical" {:size 14})])

(hsx/defc group-target
  [group children]
  (let [enabled? (react/useContext row-context)
        droppable (useDroppable #js {:id (str "group/" (pr-str group))
                                    :disabled (not enabled?)
                                    :data #js {:group group}})]
    [:div {:ref (.-setNodeRef droppable)
           :data-table-drop-group (when enabled? (pr-str group))
           :class (when (.-isOver droppable) "bg-accent rounded")}
     children]))

(hsx/defc rows
  [group row-uuids children]
  [:> SortableContext {:items (bean/->js (mapv #(row-id group %) row-uuids))
                       :strategy verticalListSortingStrategy}
   children])

(defn drop-request
  [snapshot active over placement]
  (assoc snapshot
         :row-uuid (:row-uuid active)
         :source-group (:group active)
         :target-group (:group over)
         :anchor-uuid (:row-uuid over)
         :placement placement))

(defn- event-data [^js item]
  (let [^js data (some-> item .-data .-current)]
    {:row-uuid (.-rowUuid data) :group (.-group data) :title (.-title data)}))

(defn- drop-placement
  [snapshot active over ^js event]
  (cond
    (nil? (:row-uuid over)) :end
    (= (:group active) (:group over))
    (let [row-uuids (get-in snapshot [:rows (:group active)])]
      (if (> (.indexOf row-uuids (:row-uuid over)) (.indexOf row-uuids (:row-uuid active))) :after :before))
    :else
    (if (> (.. event -active -rect -current -translated -top) (.. event -over -rect -top)) :after :before)))

(defn- <commit-drop!
  [view-uuid request]
  (-> (ui-outliner-tx/transact!
       {:outliner-op :reorder-view-rows}
       (outliner-op/reorder-view-rows! view-uuid request))
      (p/catch (fn [error]
                 (log/error :table/reorder-failed error)
                 (when-not (= :notification (:type (ex-data error)))
                   (notification/show! (t :view.table/reorder-failed) :warning))))))

(defn- focus-dropped-row!
  [view-uuid {:keys [row-uuid target-group expected-order] :as request} remaining]
  (let [root (.querySelector js/document (str "[data-table-view-uuid='" view-uuid "']"))
        ready? (and root (not= (str (hash expected-order)) (.getAttribute root "data-table-sort-order")))
        handle-id (row-id target-group row-uuid)
        drag-handle (when ready?
                      (some #(when (= handle-id (.getAttribute % "data-table-row-drag-id")) %)
                            (array-seq (.querySelectorAll root "[data-table-row-drag]"))))
        focused (.-activeElement js/document)]
    ;; A changed resource can briefly unmount the table. Restore focus after its
    ;; saved order renders, unless the user has already focused another control.
    (when (or (= focused (.-body js/document))
              (.matches focused "[data-table-row-drag]"))
      (if drag-handle
        (.focus drag-handle)
        (when (pos? remaining)
          (js/requestAnimationFrame #(focus-dropped-row! view-uuid request (dec remaining))))))))

(hsx/defc root
  [view-uuid enabled? snapshot children]
  (let [[active set-active!] (hooks/use-state nil)
        [saving? set-saving!] (hooks/use-state false)
        [generation set-generation!] (hooks/use-state 0)
        origin (hooks/use-ref nil)
        revision (hash snapshot)
        sensors (useSensors
                 (useSensor MouseSensor #js {:activationConstraint #js {:distance 8}})
                 (useSensor TouchSensor #js {:activationConstraint #js {:delay 120 :tolerance 8}})
                 (useSensor KeyboardSensor #js {:coordinateGetter sortableKeyboardCoordinates}))
        cancel! (fn [] (set! (.-current origin) nil) (set-active! nil))]
    (hooks/use-effect!
     (fn []
       (when (.-current origin)
         (cancel!)
         (set-generation! inc)))
     [revision enabled?])
    [:> (.-Provider row-context) {:value enabled?}
     [:> DndContext
      {:key (str view-uuid "/" generation)
       :sensors sensors
       :collisionDetection collision-detection
       :accessibility {:screenReaderInstructions {:draggable (t :view.table/reorder-instructions)}
                       :announcements {:onDragStart (fn [_] (t :view.table/reorder-started))
                                       :onDragOver (fn [_] (t :view.table/reorder-position))
                                       :onDragEnd (fn [_] (t :view.table/reorder-ended))
                                       :onDragCancel (fn [_] (t :view.table/reorder-canceled))}}
       :onDragStart (fn [^js event]
                      (when (and enabled? (not saving?) (not (state/editing?)))
                        (let [source (event-data (.-active event))]
                          (set! (.-current origin) {:snapshot snapshot :source source})
                          (set-active! source))))
       :onDragCancel cancel!
       :onDragEnd (fn [^js event]
                    (when-let [{:keys [snapshot source]} (.-current origin)]
                      (when-let [target (.-over event)]
                        (let [destination (event-data target)
                              request (drop-request snapshot source destination
                                                    (drop-placement snapshot source destination event))
                              keyboard? (= "keydown" (.. event -activatorEvent -type))]
                          (set-saving! true)
                          (-> (<commit-drop! view-uuid request)
                              (p/then (fn []
                                        (when keyboard?
                                          (focus-dropped-row! view-uuid request 60))))
                              (p/finally #(set-saving! false))))))
                    (cancel!))}
      children
      (when (exists? js/document)
        (createPortal
         (hsx/create-element
          [:> DragOverlay {:dropAnimation nil}
           (when active
             [:div.table-row-drag-preview
              (ui/icon "grip-vertical" {:size 14})
              [:span (:title active)]])])
         (.-body js/document)))]]))
