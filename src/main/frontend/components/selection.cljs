(ns frontend.components.selection
  "Block selection"
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc action-bar
  [& {:keys [on-cut on-copy selected-blocks]
      :or {on-cut #(editor-handler/cut-selection-blocks true)}}]
  (let [on-copy (if (and selected-blocks (nil? on-copy))
                  #(editor-handler/copy-selection-blocks true {:selected-blocks selected-blocks})
                  (or on-copy #(editor-handler/copy-selection-blocks true)))
        button-opts {:variant :outline
                     :size :sm
                     :class "px-2 py-0 text-xs text-muted-foreground"}]
    [:div.selection-action-bar
     (shui/button-group
      ;; set tag
      (ui/tooltip
       (shui/button
        (assoc button-opts
               :on-pointer-down (fn [e]
                                  (util/stop e)
                                  (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                           :selected-blocks selected-blocks
                                                                           :property-key "Tags"
                                                                           :show-select-only? true
                                                                           :hide-property-key? true
                                                                           :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
        (ui/icon "hash" {:size 13}))
       "Set tag")
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                          :selected-blocks selected-blocks
                                                                          :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
       "Set property")
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (on-copy)
                                 (state/pub-event! [:editor/hide-action-bar])))
       "Copy")
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (on-cut)
                                 (state/pub-event! [:editor/hide-action-bar])))
       "Cut")
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (shui/popup-hide!)
                                 (shui/popup-show! e
                                                   (fn []
                                                     (state/get-component :selection/context-menu))
                                                   {:on-before-hide state/dom-clear-selection!
                                                    :on-after-hide state/state-clear-selection!
                                                    :content-props {:class "w-[280px] ls-context-menu-content"}
                                                    :as-dropdown? true})))
       (ui/icon "dots" {:size 13})))]))
