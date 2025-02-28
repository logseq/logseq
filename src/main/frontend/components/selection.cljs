(ns frontend.components.selection
  "Block selection"
  (:require [frontend.components.content :as cp-content]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc action-bar
  []
  (let [button-opts {:variant :outline
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
                                                                          :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
       "Set property")
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (editor-handler/copy-selection-blocks true)
                                 (state/pub-event! [:editor/hide-action-bar])))
       "Copy")
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (editor-handler/cut-selection-blocks true)
                                 (state/pub-event! [:editor/hide-action-bar])))
       "Cut")
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (shui/popup-hide!)
                                 (shui/popup-show! e
                                                   (fn []
                                                     (cp-content/custom-context-menu-content))
                                                   {:on-before-hide state/dom-clear-selection!
                                                    :on-after-hide state/state-clear-selection!
                                                    :content-props {:class "w-[280px] ls-context-menu-content"}
                                                    :as-dropdown? true})))
       (ui/icon "dots" {:size 13})))]))
