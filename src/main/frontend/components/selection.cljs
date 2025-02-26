(ns frontend.components.selection
  "Block selection"
  (:require [frontend.handler.editor :as editor-handler]
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
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                          :property-key "Tags"}])))
       (ui/icon "hash" {:size 14}))
     ;; set propertyo
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (state/pub-event! [:editor/new-property {:target (.-target e)}])))
       "Set property")
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (editor-handler/copy-selection-blocks true)))
       "Copy")
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (editor-handler/cut-selection-blocks true)))
       "Cut"))]))
