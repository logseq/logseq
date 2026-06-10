(ns frontend.components.selection
  "Block selection"
  (:require [frontend.components.block.comments-model :as comments-model]
            [frontend.components.icon :as icon-component]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [io.factorhouse.hsx.core :as hsx]))

(defn- icon-data-for-block
  "Compute per-block icon-data. For avatar/text, replace the picker's
  preview-derived :value with initials derived from each block's own
  title — otherwise every batched row would show the first row's initials."
  [icon block]
  (when icon
    (let [block-title (:block/title block)]
      (cond
        (= :avatar (:type icon))
        (let [styling (select-keys (:data icon) [:backgroundColor :color :shape])]
          {:type :avatar
           :data (cond-> styling
                   block-title (assoc :value (icon-component/derive-avatar-initials block-title)))})

        (= :text (:type icon))
        (let [styling (select-keys (:data icon) [:color :alignment :mode])]
          {:type :text
           :data (cond-> styling
                   block-title (assoc :value (icon-component/derive-initials block-title)))})

        (= :image (:type icon))
        {:type :image :data (:data icon)}

        :else (select-keys icon [:type :id :color])))))

(defn- batch-write-icon!
  [blocks icon]
  (if (or (nil? icon) (contains? #{:avatar :text} (:type icon)))
    ;; Per-block writes (avatar/text need per-row initials; clear/nil applies
    ;; uniformly). Wrap the doseq in one outliner transact! so all N writes
    ;; commit atomically — partial-failure used to leave the selection in a
    ;; mixed state. The inner handler calls each open their own transact!,
    ;; but the macro short-circuits when an outer binding is active, so this
    ;; produces a single DB tx, undo step, and reactive re-render.
    (ui-outliner-tx/transact!
     {:outliner-op :set-block-properties}
     (doseq [block blocks]
       (if (nil? icon)
         (property-handler/remove-block-property! (:db/id block) :logseq.property/icon)
         (db-property-handler/set-block-property!
          (:db/id block)
          :logseq.property/icon
          (icon-data-for-block icon block)))))
    ;; Uniform value across blocks (icon, emoji, image): single batch transaction
    (property-handler/batch-set-block-property!
     (map :db/id blocks)
     :logseq.property/icon
     (icon-data-for-block icon (first blocks)))))

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
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [^js e]
                                   (util/stop e)
                                   (let [target (.-target e)
                                         first-title (some-> selected-blocks first :block/title)]
                                     (shui/popup-show!
                                      target
                                      (fn [{:keys [id]}]
                                        (icon-component/icon-search
                                         {:on-chosen (fn [_e icon-value keep-popup?]
                                                       (batch-write-icon! selected-blocks icon-value)
                                                       (when-not (true? keep-popup?)
                                                         (shui/popup-hide! id)
                                                         (state/pub-event! [:editor/hide-action-bar])))
                                          ;; Seed the picker with the first selected block's
                                          ;; *resolved* icon so icon-search's `:will-mount`
                                          ;; auto-routes to the right view: blocks that inherit
                                          ;; a class default-icon of type `:avatar` open the
                                          ;; asset-picker (avatar/image tabs), preserving the
                                          ;; existing shape so the user can just swap the
                                          ;; fallback icon. `get-node-icon` includes class
                                          ;; default-icon inheritance, so an instance row of
                                          ;; e.g. #Institution comes through as the inherited
                                          ;; avatar config rather than nil — which previously
                                          ;; left the picker on its default :icon-picker view
                                          ;; (the regular emoji/icon grid the user reported as
                                          ;; the wrong affordance).
                                          :icon-value (some-> selected-blocks first
                                                              icon-component/get-node-icon)
                                          :page-title first-title
                                          :del-btn? false
                                          :preview-target-db-ids (set (map :db/id selected-blocks))}))
                                      {:align :start
                                       :id :ls-icon-picker
                                       :content-props {:class "ls-icon-picker"
                                                       :onEscapeKeyDown #(.preventDefault %)}}))))
         (ui/tooltip (ui/icon "mood-smile" {:size 13}) (t :context-menu/set-icon)
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
