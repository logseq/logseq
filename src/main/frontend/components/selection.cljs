(ns frontend.components.selection
  "Block selection"
  (:require [frontend.components.block.comments-model :as comments-model]
            [frontend.db.async :as db-async]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn show-comment-action?
  [outliner? comment-targets]
  (boolean
   (and outliner?
        (seq comment-targets))))

(defn- unset-property-event
  [target selected-blocks view-parent]
  [:editor/new-property {:target target
                         :selected-blocks selected-blocks
                         :view-parent view-parent
                         :remove-property? true
                         :select-opts {:show-new-when-not-exact-match? false}
                         :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])

(hsx/defc action-group
  [{:keys [on-cut on-copy selected-blocks hide-dots? button-border? view-parent outliner?]
    :or {on-cut #(editor-handler/cut-selection-blocks true)
         outliner? true}}]
  (let [search-mode (rfx/use-sub [:search/mode])
        property-dialog? (rfx/use-sub [:ui/show-property-dialog?])
        selected-block-ids (if (seq selected-blocks)
                             (keep #(when (number? %) %) selected-blocks)
                             (state/get-selection-block-ids))
        direct-selected-blocks (when (seq selected-blocks)
                                 (remove number? selected-blocks))
        [loaded-selected-blocks set-loaded-selected-blocks!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [results (db-async/<get-blocks (state/get-current-repo) selected-block-ids)]
         (set-loaded-selected-blocks! (vec (keep :block results))))
       nil)
     [selected-block-ids])
    (when-not (or search-mode property-dialog?)
    (let [selected-blocks (seq (concat direct-selected-blocks loaded-selected-blocks))
          comment-targets (comments-model/comment-target-blocks selected-blocks)
          on-copy (if (and selected-blocks (nil? on-copy))
                    #(editor-handler/copy-selection-blocks true {:selected-blocks selected-blocks})
                    (or on-copy #(editor-handler/copy-selection-blocks true)))
          button-opts {:variant :outline
                       :size :sm
                       :class (str "selection-action-button -ml-px h-8 rounded-none border-border bg-background px-2 py-0 text-xs first:ml-0 first:rounded-l-md last:rounded-r-md"
                                   (when-not button-border?
                                     " !border-b-0"))}]
      (shui/toolbar-group
       {:class "selection-action-group !gap-0"}
        ;; set tag
        (shui/toolbar-button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (state/pub-event! [:editor/new-property {:target (.-currentTarget e)
                                                                            :selected-blocks selected-blocks
                                                                            :property-key "Tags"
                                                                            :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
         (ui/tooltip (ui/icon "hash" {:size 13}) (t :property/set-tags)
                     {:trigger-props {:class "flex"}}))
        (when (show-comment-action? outliner? comment-targets)
          (shui/toolbar-button
           (assoc button-opts
                  :on-pointer-down (fn [e]
                                     (util/stop e)
                                     (comments-handler/add-comment-to-blocks! comment-targets)))
           (ui/tooltip (ui/icon "message-circle" {:size 13}) (t :block.comments/add-comment)
                       {:trigger-props {:class "flex"}})))
        (shui/toolbar-button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (on-copy)
                                   (state/clear-selection!)
                                   (state/pub-event! [:editor/hide-action-bar])))
         (t :ui/copy))
        (shui/toolbar-button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (state/pub-event! [:editor/new-property {:target (.-currentTarget e)
                                                                            :selected-blocks selected-blocks
                                                                            :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
         (t :property/set-property))
        (shui/toolbar-button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (state/pub-event! (unset-property-event (.-target e)
                                                                          selected-blocks
                                                                          view-parent))))
         (t :property/unset-property))
        (when-not (contains? #{:logseq.class/Page} (:db/ident view-parent))
          (shui/toolbar-button
           (assoc button-opts
                  :on-pointer-down (fn [e]
                                     (util/stop e)
                                     (on-cut)
                                     (state/pub-event! [:editor/hide-action-bar])))
           (ui/icon "trash" {:size 13})))
        (when-not hide-dots?
          (shui/toolbar-button
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
           (ui/icon "dots" {:size 13}))))))))

(hsx/defc action-bar
  [& [opts]]
  (shui/toolbar
   {:class "selection-action-bar !gap-0"}
   (action-group (or opts {}))))
