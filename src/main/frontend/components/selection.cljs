(ns frontend.components.selection
  "Block selection"
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [frontend.config :as config]))

(rum/defc action-bar
  [& {:keys [on-cut on-copy selected-blocks hide-dots? button-border?]
      :or {on-cut #(editor-handler/cut-selection-blocks true)}}]
  (let [on-copy (if (and selected-blocks (nil? on-copy))
                  #(editor-handler/copy-selection-blocks true {:selected-blocks selected-blocks
                                                               :page-title-only? true})
                  (or on-copy #(editor-handler/copy-selection-blocks true)))
        button-opts {:variant :outline
                     :size :sm
                     :class (str "px-2 py-1 text-xs text-muted-foreground"
                                 (when-not button-border?
                                   "border-y-0"))}
        db-graph? (config/db-based-graph?)]
    [:div.selection-action-bar
     (shui/button-group
      ;; set tag
      (when db-graph?
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                            :selected-blocks selected-blocks
                                                                            :property-key "Tags"
                                                                            :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
         (ui/tooltip (ui/icon "hash" {:size 13}) "Set tag"
                     {:trigger-props {:class "flex"}})))
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (on-copy)
                                 (state/pub-event! [:editor/hide-action-bar])))
       "Copy")
      (when db-graph?
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                            :selected-blocks selected-blocks
                                                                            :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
         "Set property"))
      (when db-graph?
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                            :selected-blocks selected-blocks
                                                                            :remove-property? true
                                                                            :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
         "Unset property"))
      (shui/button
       (assoc button-opts
              :on-pointer-down (fn [e]
                                 (util/stop e)
                                 (on-cut)
                                 (state/pub-event! [:editor/hide-action-bar])))
       (ui/icon "trash" {:size 13}))
      (when-not hide-dots?
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (shui/popup-hide!)
                                   (shui/popup-show! e
                                                     (fn [{:keys [id]}]
                                                       [:div {:on-click #(shui/popup-hide! id)
                                                              :data-keep-selection true}
                                                        ((state/get-component :selection/context-menu))])
                                                     {:on-before-hide state/dom-clear-selection!
                                                      :on-after-hide state/state-clear-selection!
                                                      :content-props {:class "w-[280px] ls-context-menu-content"}
                                                      :as-dropdown? true})))
         (ui/icon "dots" {:size 13}))))]))
