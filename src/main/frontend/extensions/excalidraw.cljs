(ns frontend.extensions.excalidraw
  (:require [cljs-bean.core :as bean]
            ;; NOTE: Always use production build of excalidraw
            ;; See-also: https://github.com/excalidraw/excalidraw/pull/3330
            ["@excalidraw/excalidraw/dist/excalidraw.production.min" :as Excalidraw]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.draw :as draw-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.rum :as r]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.extensions.draw :as draw-common]
            [goog.object :as gobj]
            [rum.core :as rum]))

(def excalidraw (r/adapt-class (gobj/get Excalidraw "default")))
(def serialize-as-json (gobj/get Excalidraw "serializeAsJSON"))

(defn- update-draw-content-width
  [state]
  (when-let [el ^js (rum/dom-node state)]
    (loop [el (.querySelector el ".draw-wrap")]
      (cond
        (or (nil? el) (undefined? el) (undefined? (.-classList el)))
        nil

        (..  el -classList (contains "block-content"))
        (let [width (.-clientWidth el)]
          (reset! (::draw-width state) width))

        :else
        (recur (.-parentNode el))))
    state))

(rum/defcs draw-inner < rum/reactive
  (rum/local 800 ::draw-width)
  (rum/local true ::zen-mode?)
  (rum/local false ::view-mode?)
  (rum/local false ::grid-mode?)
  (rum/local nil ::elements)
  {:did-mount update-draw-content-width
   :did-update update-draw-content-width}
  [state data option]
  (let [*draw-width (get state ::draw-width)
        *zen-mode? (get state ::zen-mode?)
        *view-mode? (get state ::view-mode?)
        *grid-mode? (get state ::grid-mode?)
        wide-mode? (state/sub :ui/wide-mode?)
        *elements (get state ::elements)
        {:keys [file block-uuid]} option]
    (when data
      [:div.overflow-hidden {:on-mouse-down (fn [e] (util/stop e))}
       [:div.my-1 {:style {:font-size 10}}
        [:a.mr-2 {:on-click ui-handler/toggle-wide-mode!}
         (util/format "Wide Mode (%s)" (if wide-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(swap! *zen-mode? not)}
         (util/format "Zen Mode (%s)" (if @*zen-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(swap! *view-mode? not)}
         (util/format "View Mode (%s)" (if @*view-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(swap! *grid-mode? not)}
         (util/format "Grid Mode (%s)" (if @*view-mode? "ON" "OFF"))]
        [:a.mr-2 {:on-click #(when-let [block (db/pull [:block/uuid block-uuid])]
                               (editor-handler/edit-block! block :max block-uuid))}
         "Edit Block"]]
       [:div.draw-wrap
        {:on-mouse-down (fn [e]
                          (util/stop e)
                          (state/set-block-component-editing-mode! true))
         :on-blur #(state/set-block-component-editing-mode! false)
         :style {:width  @*draw-width
                 :height (if wide-mode? 650 500)}}
        (excalidraw
         (merge
          {:on-change (fn [elements app-state]
                        (when-not (or (= "down" (gobj/get app-state "cursorButton"))
                                      (gobj/get app-state "draggingElement")
                                      (gobj/get app-state "editingElement")
                                      (gobj/get app-state "editingGroupId")
                                      (gobj/get app-state "editingLinearElement"))
                          (let [elements->clj (bean/->clj elements)]
                            (when (and (seq elements->clj)
                                       (not= elements->clj @*elements)) ;; not= requires clj collections
                              (reset! *elements elements->clj)
                              (draw-handler/save-draw!
                               file
                               (serialize-as-json elements app-state))))))

           :zen-mode-enabled @*zen-mode?
           :view-mode-enabled @*view-mode?
           :grid-mode-enabled @*grid-mode?
           :initial-data data}))]])))

(rum/defc draw
  [option]
  (draw-common/draw-wrapper option draw-inner))
