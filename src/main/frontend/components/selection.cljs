(ns frontend.components.selection
  "Block selection"
  (:require [frontend.components.block.comments-model :as comments-model]
            [frontend.components.icon :as icon-component]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.ui :as shui]))

(defn- batch-write-icon!
  [blocks icon]
  (if (nil? icon)
    ;; Clear: per-block removes, wrapped in one outliner transact! so all N
    ;; writes commit atomically — a partial failure would leave the selection
    ;; in a mixed state. The inner handler calls each open their own
    ;; transact!, but the macro short-circuits when an outer binding is
    ;; active, so this produces a single DB tx, undo step, and reactive
    ;; re-render.
    (ui-outliner-tx/transact!
     {:outliner-op :set-block-properties}
     (doseq [block blocks]
       (property-handler/remove-block-property! (:db/id block) :logseq.property/icon)))
    ;; Uniform value across blocks: single batch transaction
    (property-handler/batch-set-block-property!
     (map :db/id blocks)
     :logseq.property/icon
     (select-keys icon [:type :id :color]))))

(hsx/defc batch-set-icon-button
  "Action-bar button: open the icon picker and apply the pick to every
   selected block."
  [button-opts selected-blocks]
  (shui/button
   (assoc button-opts
          :on-pointer-down (fn [^js e]
                             (util/stop e)
                             (let [target (.-target e)]
                               (shui/popup-show!
                                target
                                (fn [{:keys [id]}]
                                  (icon-component/icon-search
                                   {:on-chosen (fn [_e icon-value keep-popup?]
                                                 (batch-write-icon! selected-blocks icon-value)
                                                 (when-not (true? keep-popup?)
                                                   (shui/popup-hide! id)
                                                   (state/pub-event! [:editor/hide-action-bar])))
                                    ;; Seed with the first selected block's own stored
                                    ;; icon so the picker opens showing its color/value.
                                    :icon-value (some-> selected-blocks first
                                                        (get :logseq.property/icon))
                                    :del-btn? false}))
                                {:align :start
                                 :id :ls-icon-picker
                                 :content-props {:class "ls-icon-picker"
                                                 :onEscapeKeyDown #(.preventDefault %)}}))))
   (ui/tooltip (ui/icon "mood-smile" {:size 13}) (t :context-menu/set-icon)
               {:trigger-props {:class "flex"}})))

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
        ;; set icon (batch)
          (batch-set-icon-button button-opts selected-blocks)
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
