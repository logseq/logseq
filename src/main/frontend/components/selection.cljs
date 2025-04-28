(ns frontend.components.selection
  "Block selection"
  (:require [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc action-bar
  [& {:keys [on-cut on-copy selected-blocks hide-dots? button-border?]
      :or {on-cut #(editor-handler/cut-selection-blocks true)}}]
  (let [selected-blocks (map (fn [block] (if (number? block) (db/entity block) block)) selected-blocks)
        on-copy (if (and selected-blocks (nil? on-copy))
                  #(editor-handler/copy-selection-blocks true {:selected-blocks selected-blocks})
                  (or on-copy #(editor-handler/copy-selection-blocks true)))
        button-opts {:variant :outline
                     :size :sm
                     :class (str "p-2 text-xs h-8"
                                 (when-not button-border?
                                   " !border-b-0"))}
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
                                 (state/clear-selection!)
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
                                                                            :select-opts {:show-new-when-not-exact-match? false}
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
                                                     {:content-props {:class "w-[280px] ls-context-menu-content"}
                                                      :as-dropdown? true})))
         (ui/icon "dots" {:size 13}))))]))
