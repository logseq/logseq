(ns frontend.components.selection
  "Block selection"
  (:require [frontend.components.block.comments-model :as comments-model]
            [frontend.db :as db]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(defn show-comment-action?
  [outliner? comment-targets]
  (boolean
   (and outliner?
        (seq comment-targets))))

(hsx/defc action-bar
  [& {:keys [on-cut on-copy selected-blocks hide-dots? button-border? view-parent outliner?]
      :or {on-cut #(editor-handler/cut-selection-blocks true)
           outliner? true}}]
  (let [search-mode (state/use-sub :search/mode)
        property-dialog? (state/use-sub :ui/show-property-dialog?)]
    (when-not (or search-mode property-dialog?)
    (let [selected-blocks (or (seq selected-blocks)
                              (seq (keep #(db/entity [:block/uuid %]) (state/get-selection-block-ids))))
          selected-blocks (map (fn [block] (if (number? block) (db/entity block) block)) selected-blocks)
          comment-targets (comments-model/comment-target-blocks selected-blocks)
          on-copy (if (and selected-blocks (nil? on-copy))
                    #(editor-handler/copy-selection-blocks true {:selected-blocks selected-blocks})
                    (or on-copy #(editor-handler/copy-selection-blocks true)))
          button-opts {:variant :outline
                       :size :sm
                       :class (str "p-2 text-xs h-8"
                                   (when-not button-border?
                                     " !border-b-0"))}]
      [:div.selection-action-bar
       (shui/button-group
        ;; set tag
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                            :selected-blocks selected-blocks
                                                                            :property-key "Tags"
                                                                            :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
         (ui/tooltip (ui/icon "hash" {:size 13}) (t :property/set-tags)
                     {:trigger-props {:class "flex"}}))
        (when (show-comment-action? outliner? comment-targets)
          (shui/button
           (assoc button-opts
                  :on-pointer-down (fn [e]
                                     (util/stop e)
                                     (comments-handler/add-comment-to-blocks! comment-targets)))
           (ui/tooltip (ui/icon "message-circle" {:size 13}) (t :block.comments/add-comment)
                       {:trigger-props {:class "flex"}})))
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (on-copy)
                                   (state/clear-selection!)
                                   (state/pub-event! [:editor/hide-action-bar])))
         (t :ui/copy))
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                            :selected-blocks selected-blocks
                                                                            :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
         (t :property/set-property))
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                            :selected-blocks selected-blocks
                                                                            :remove-property? true
                                                                            :select-opts {:show-new-when-not-exact-match? false}
                                                                            :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
         (t :property/unset-property))
        (when-not (contains? #{:logseq.class/Page} (:db/ident view-parent))
          (shui/button
           (assoc button-opts
                  :on-pointer-down (fn [e]
                                     (util/stop e)
                                     (on-cut)
                                     (state/pub-event! [:editor/hide-action-bar])))
           (ui/icon "trash" {:size 13})))
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
           (ui/icon "dots" {:size 13}))))]))))
