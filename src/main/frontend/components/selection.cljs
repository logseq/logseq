(ns frontend.components.selection
  "Block selection"
  (:require [frontend.components.icon :as icon-component]
            [frontend.db :as db]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defn- icon-data-for-block
  "Compute per-block icon-data. For avatar/text, replace the picker's
  preview-derived :value with initials derived from each block's own
  title — otherwise every batched row would show the first row's initials."
  [icon block]
  (when icon
    (let [block-title (:block/title block)]
      (cond
        (= :avatar (:type icon))
        (let [colors (select-keys (:data icon) [:backgroundColor :color])]
          {:type :avatar
           :data (cond-> colors
                   block-title (assoc :value (icon-component/derive-avatar-initials block-title)))})

        (= :text (:type icon))
        (let [colors (select-keys (:data icon) [:color])]
          {:type :text
           :data (cond-> colors
                   block-title (assoc :value (icon-component/derive-initials block-title)))})

        (= :image (:type icon))
        {:type :image :data (:data icon)}

        :else (select-keys icon [:type :id :color])))))

(defn- batch-write-icon!
  [blocks icon]
  (if (or (nil? icon) (contains? #{:avatar :text} (:type icon)))
    ;; Per-block writes (avatar/text need per-row initials; clear/nil applies uniformly)
    (doseq [block blocks]
      (if (nil? icon)
        (property-handler/remove-block-property! (:db/id block) :logseq.property/icon)
        (db-property-handler/set-block-property!
         (:db/id block)
         :logseq.property/icon
         (icon-data-for-block icon block))))
    ;; Uniform value across blocks (icon, emoji, image): single batch transaction
    (property-handler/batch-set-block-property!
     (map :db/id blocks)
     :logseq.property/icon
     (icon-data-for-block icon (first blocks)))))

(rum/defc action-bar < rum/reactive
  [& {:keys [on-cut on-copy selected-blocks hide-dots? button-border? view-parent]
      :or {on-cut #(editor-handler/cut-selection-blocks true)}}]
  (when-not (or (state/sub :search/mode)
                (state/sub :ui/show-property-dialog?))
    (let [selected-blocks (map (fn [block] (if (number? block) (db/entity block) block)) selected-blocks)
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
         (ui/tooltip (ui/icon "hash" {:size 13}) "Set tag"
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
                                          :icon-value nil
                                          :page-title first-title
                                          :del-btn? false}))
                                      {:align :start
                                       :id :ls-icon-picker
                                       :content-props {:class "ls-icon-picker"
                                                       :onEscapeKeyDown #(.preventDefault %)}}))))
         (ui/tooltip (ui/icon "mood-smile" {:size 13}) "Set icon"
                     {:trigger-props {:class "flex"}}))
        (shui/button
         (assoc button-opts
                :on-pointer-down (fn [e]
                                   (util/stop e)
                                   (on-copy)
                                   (state/clear-selection!)
                                   (state/pub-event! [:editor/hide-action-bar])))
         "Copy")
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
                                   (state/pub-event! [:editor/new-property {:target (.-target e)
                                                                            :selected-blocks selected-blocks
                                                                            :remove-property? true
                                                                            :select-opts {:show-new-when-not-exact-match? false}
                                                                            :on-dialog-close #(state/pub-event! [:editor/hide-action-bar])}])))
         "Unset property")
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
           (ui/icon "dots" {:size 13}))))])))
