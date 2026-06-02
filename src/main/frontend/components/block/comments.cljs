(ns frontend.components.block.comments
  (:require [clojure.string :as string]
            [dommy.core :as dom]
            [frontend.components.avatar :as avatar]
            [frontend.components.block.comments-model :as comments-model]
            [frontend.components.icon :as icon-component]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.format.block :as block]
            [frontend.handler.comments :as comments-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.paste :as paste-handler]
            [frontend.handler.reaction :as reaction-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn- comment-time-title
  [created-at]
  (when (number? created-at)
    (date/int->local-time-2 created-at)))

(defn- focus-comment-input!
  [input-id]
  (js/setTimeout
   #(some-> (gdom/getElement input-id)
            (.focus))
   0))

(defn- comment-editor-value
  [input-id]
  (some-> (gdom/getElement input-id)
          (gobj/get "value")))

(defn- closest-comments-area
  [target]
  (when-let [closest-fn (and target (gobj/get target "closest"))]
    (.call closest-fn target ".ls-comments-area")))

(defn- closest-editor-autocomplete
  [target]
  (when-let [closest-fn (and target (gobj/get target "closest"))]
    (.call closest-fn target "#ui__ac")))

(defn- inside-comments-area?
  [target]
  (boolean (closest-comments-area target)))

(defn- inside-editor-autocomplete?
  [target]
  (boolean (closest-editor-autocomplete target)))

(defn- activate-comment-editor!
  ([input-id block content container-id]
   (activate-comment-editor! input-id block content container-id true nil))
  ([input-id block content container-id sync-input?]
   (activate-comment-editor! input-id block content container-id sync-input? nil))
  ([input-id block content container-id sync-input? cursor-position]
   (state/set-state! :editor/block-refs #{})
   (state/set-state! :editor/block block)
   (state/set-editing-block-id! [(or container-id :comments-area) (:block/uuid block)])
   (state/set-state! :editor/container-id container-id)
   (state/set-state! :editor/content (or content "") :path-in-sub-atom (:block/uuid block))
   (state/set-state! :editor/last-key-code nil)
   (state/set-state! :editor/set-timestamp-block nil)
   (state/set-state! :editor/cursor-range nil)
   (when (number? cursor-position)
     (state/set-editor-last-pos! cursor-position))
   (when sync-input?
     (when-let [input (gdom/getElement input-id)]
       (util/set-change-value input (or content ""))))))

(defn- comment-box-editor-view
  [{:keys [active? editor-box editor-block input-id config focus-editor? draft
           placeholder container-id update-draft! asset-target-block submit!
           create-sibling-block! exit-comment-editor! activate-reply! draft']}]
  [:div.ls-comment-box-editor
   (if (and active? editor-box)
     (editor-box
      {:block editor-block
       :block-id (:block/uuid editor-block)
       :format :markdown}
      input-id
      (assoc config
             :comment-editor? true
             :comment-asset-target-block asset-target-block
             :skip-focus? (not focus-editor?)
             :editor-opts
             {:default-value draft
              :placeholder placeholder
              :aria-label placeholder
              :on-focus (fn [_e]
                          (activate-comment-editor! input-id
                                                    (assoc editor-block :block/title draft)
                                                    (or (comment-editor-value input-id) draft)
                                                    container-id))
              :on-blur (fn [_e]
                         (js/setTimeout
                          #(when-not (inside-comments-area? js/document.activeElement)
                             (exit-comment-editor!))
                          0))
              :on-pointer-down util/stop-propagation
              :on-change (fn [_e] (update-draft!))
              :on-key-up (fn [_e] (update-draft!))
              :on-paste (fn [e]
                          (when-not (comments-handler/paste-assets! asset-target-block e)
                            ((paste-handler/editor-on-paste! input-id) e)
                            (js/setTimeout update-draft! 0)))
              :on-key-down (fn [e]
                             (cond
                               (comments-model/comment-submit-shortcut? e (state/get-editor-action))
                               (if (comments-model/submittable-comment-content
                                    (or (comment-editor-value input-id) draft))
                                 (submit! e)
                                 (create-sibling-block! e))

                               (= "Escape" (util/ekey e))
                               (do
                                 (util/stop e)
                                 (exit-comment-editor!))))}))
     [:div.ls-comment-reply-placeholder
      {:role "button"
       :tab-index 0
       :on-pointer-down util/stop-propagation
       :on-click activate-reply!
       :on-key-down (fn [e]
                      (when (contains? #{"Enter" " "} (util/ekey e))
                        (activate-reply! e)))}
      (or draft' placeholder)])])

(defn- comment-box-actions
  [{:keys [content on-cancel submit!]}]
  [:div.ls-comment-box-actions
   (when on-cancel
     (shui/button
      {:size :sm
       :variant :ghost
       :on-pointer-down util/stop-propagation
       :on-click (fn [e]
                   (util/stop e)
                   (on-cancel))}
      (t :ui/cancel)))
   (shui/button
    {:size :sm
     :class "ls-comment-submit"
     :disabled (nil? content)
     :title (t :ui/submit)
     :aria-label (t :ui/submit)
     :on-pointer-down util/stop-propagation
     :on-click submit!}
    (shui/tabler-icon "send" {:size 16}))])

(defn- clear-comment-box-draft!
  [comments-block input-id set-draft!]
  (when comments-block
    (comments-model/clear-comment-draft! comments-block))
  (state/set-edit-content! input-id "")
  (set-draft! ""))

(defn- use-comment-box-outside-click!
  [active? editor-block exit-comment-editor!]
  (hooks/use-effect!
   (fn []
     (when active?
       (let [on-pointer-down (fn [e]
                               (when-not (or (inside-comments-area? (.-target e))
                                             (inside-editor-autocomplete? (.-target e)))
                                 (exit-comment-editor!)))]
         (.addEventListener js/document "pointerdown" on-pointer-down true)
         #(.removeEventListener js/document "pointerdown" on-pointer-down true))))
   [active? (:block/uuid editor-block)]))

(hsx/defc comment-box
  [{:keys [config comments-block comment-block initial-value placeholder on-submit on-cancel refocus-after-submit? focus-on-mount?]
    :or {refocus-after-submit? true
         focus-on-mount? false}}]
  (let [[draft-uuid] (hooks/use-state (random-uuid))
        [draft set-draft!] (hooks/use-state
                             (or initial-value
                                 (comments-model/saved-comment-draft comments-block)
                                 ""))
        draft' (when-not (string/blank? draft) draft)
        editor-block (or comment-block
                         (comments-model/comment-draft-block comments-block draft-uuid draft))
        input-id (str "edit-block-" (:block/uuid editor-block))
        editor-box (state/get-component :editor/box)
        container-id (:container-id config)
        initial-active? (or comment-block
                            focus-on-mount?
                            (comments-model/comments-block-current-page? comments-block (state/get-current-page)))
        [active? set-active!] (hooks/use-state initial-active?)
        [focus-editor? set-focus-editor!] (hooks/use-state focus-on-mount?)
        activate-reply! (fn [e]
                          (util/stop e)
                          (set-focus-editor! true)
                          (set-active! true))
        clear-comment-edit! (fn []
                              (when (= (:block/uuid (state/get-edit-block))
                                       (:block/uuid editor-block))
                                (state/clear-edit!)))
        exit-comment-editor! (fn []
                               (clear-comment-edit!)
                               (set-focus-editor! false)
                               (set-active! false)
                               (when on-cancel
                                 (on-cancel)))
        update-draft! (fn []
                        (let [value (or (comment-editor-value input-id) "")]
                          (activate-comment-editor! input-id
                                                    (assoc editor-block :block/title value)
                                                    value
                                                    container-id
                                                    false)
                          (when comments-block
                            (comments-model/save-comment-draft! comments-block value))
                          (set-draft! value)))
        _ (when (and active? focus-editor?)
            (activate-comment-editor! input-id
                                      (assoc editor-block :block/title draft)
                                      draft
                                      container-id
                                      true
                                      (comments-model/comment-edit-cursor-position draft)))
        content (comments-model/submittable-comment-content draft)
        create-sibling-block! (fn [e]
                                (util/stop e)
                                (when (and comments-block (nil? comment-block))
                                  (p/let [_ (comments-handler/create-sibling-block-after-comments! comments-block)]
                                    (clear-comment-box-draft! comments-block input-id set-draft!)
                                    (set-active! false)
                                    (set-focus-editor! false))))
        submit! (fn [e]
                  (util/stop e)
                  (let [content (comments-model/submittable-comment-content
                                 (or (comment-editor-value input-id) draft))]
                    (when content
                      (p/let [_ (on-submit content)]
                        (when refocus-after-submit?
                          (clear-comment-box-draft! comments-block input-id set-draft!)
                          (set-active! true)
                          (set-focus-editor! true)
                          (focus-comment-input! input-id))))))]
    (hooks/use-effect!
     (fn []
       clear-comment-edit!)
     [(:block/uuid editor-block)])
    (use-comment-box-outside-click! active? editor-block exit-comment-editor!)
    [:div.ls-comment-box
     (comment-box-editor-view
      {:active? active?
       :editor-box editor-box
       :editor-block editor-block
       :input-id input-id
       :config config
       :focus-editor? focus-editor?
       :draft draft
       :placeholder placeholder
       :container-id container-id
       :update-draft! update-draft!
       :asset-target-block (or comments-block (:block/parent comment-block))
       :submit! submit!
       :create-sibling-block! create-sibling-block!
       :exit-comment-editor! exit-comment-editor!
       :activate-reply! activate-reply!
       :draft' draft'})
     (comment-box-actions
      {:content content
       :on-cancel on-cancel
       :submit! submit!})]))

(defn- open-comment-reaction-picker!
  [comment-block e]
  (util/stop e)
  (let [target (.-currentTarget e)]
    (shui/popup-show!
     target
     (fn [{:keys [id]}]
       (icon-component/icon-search
        {:on-chosen (fn [_emoji-event emoji _keep-popup?]
                      (reaction-handler/toggle-reaction! (:block/uuid comment-block) (:id emoji))
                      (shui/popup-hide! id))
         :tabs [[:emoji (t :icon/tab-emojis)]]
         :default-tab :emoji
         :show-used? true
         :icon-value nil}))
     {:align :end
      :content-props {:class "ls-icon-picker"}})))

(defn- comment-display-block
  [comment-block]
  (let [comment-uuid (:block/uuid comment-block)]
    (merge comment-block
           (block/parse-title-and-body comment-uuid
                                       (get comment-block :block/format :markdown)
                                       (:block/title comment-block)))))

(hsx/defc comment-row-view
  [config comment-block *hide-block-refs? *show-query? {:keys [block-content-or-editor block-reactions]}]
  (let [[editing? set-editing!] (hooks/use-state false)
        {:keys [author avatar-src author-uuid body created-at]} (comments-model/comment-row comment-block)
        current-user-uuid (user-handler/user-uuid)
        show-author? (comments-model/comment-author-visible? current-user-uuid)
        comment-uuid (:block/uuid comment-block)
        edit-input-id (str "edit-block-" comment-uuid)
        parsed-block (comment-display-block comment-block)
        time-label (comments-model/comment-time-label created-at)
        time-title (comment-time-title created-at)
        actions (set (comments-model/comment-actions comment-block current-user-uuid))
        placeholder (t :block.comments/placeholder)]
    [:div.ls-comment-row
     (when show-author?
       (avatar/user-avatar
        {:class "ls-comment-avatar"
         :title author
         :name author
         :uuid author-uuid
         :avatar-src avatar-src}))
     [:div.ls-comment-main
      [:div.ls-comment-meta
       (when show-author?
         [:span.ls-comment-author author])
       (when time-label
         [:span.ls-comment-time {:title time-title} time-label])]
      (if editing?
        (comment-box
         {:config config
          :comment-block comment-block
          :initial-value body
          :placeholder placeholder
          :focus-on-mount? true
          :refocus-after-submit? false
          :on-cancel #(set-editing! false)
          :on-submit (fn [content]
                       (-> (comments-handler/save-comment! comment-block content)
                           (p/then (fn [_]
                                     (set-editing! false)))
                           (p/catch (fn [_error]
                                      (notification/show! (t :block.comments/save-error) :error)))))})
        [:div.ls-comment-body
         (block-content-or-editor
          config
          parsed-block
          {:edit-input-id edit-input-id
           :block-id comment-uuid
           :edit? false
           :refs-count nil
           :*hide-block-refs? *hide-block-refs?
           :hide-block-refs-count? true
           :*show-query? *show-query?})
         (block-reactions comment-block)])]
     (when-not config/publishing?
       [:div.ls-comment-actions
        (shui/button
         {:size :sm
          :variant :ghost
          :class "ls-comment-action"
          :title (t :command.editor/add-reaction)
          :aria-label (t :command.editor/add-reaction)
          :on-pointer-down util/stop-propagation
          :on-click #(open-comment-reaction-picker! comment-block %)}
         (shui/tabler-icon "mood-smile" {:size 14}))
        (when (contains? actions :edit)
          (shui/button
           {:size :sm
            :variant :ghost
            :class "ls-comment-action"
            :title (t :editor/click-to-edit)
            :aria-label (t :editor/click-to-edit)
            :on-pointer-down util/stop-propagation
            :on-click (fn [e]
                        (util/stop e)
                        (set-editing! true))}
           (shui/tabler-icon "edit" {:size 14})))
        (when (contains? actions :delete)
          (shui/button
           {:size :sm
            :variant :ghost
            :class "ls-comment-action ls-comment-delete"
            :title (t :ui/delete)
            :aria-label (t :ui/delete)
            :on-pointer-down util/stop-propagation
            :on-click (fn [e]
                        (util/stop e)
                        (comments-handler/delete-comment! comment-block))}
           (shui/tabler-icon "trash" {:size 14})))])]))

(hsx/defc add-comment-button
  [config comments-block {:keys [focus-on-mount?]}]
  (let [placeholder (t :block.comments/placeholder)]
    [:div.ls-comment-add
     (comment-box
      {:config config
       :comments-block comments-block
       :placeholder placeholder
       :focus-on-mount? focus-on-mount?
       :on-submit (fn [content]
                    (comments-handler/insert-comment! comments-block content))})]))

(defn- scroll-comments-list-to-bottom!
  [^js el]
  (set! (.-scrollTop el) (.-scrollHeight el)))

(defn- set-comment-thread-targets-hover!
  [comments-area hover?]
  (doseq [target (comments-model/comment-thread-target-blocks comments-area)
          :let [uuid (:block/uuid target)]
          :when uuid]
    (when-let [el (gdom/getElement (str "ls-block-" uuid))]
      (if hover?
        (dom/add-class! el "is-comment-thread-hovered")
        (dom/remove-class! el "is-comment-thread-hovered")))))

(hsx/defc comment-thread-targets-view
  [comments-area]
  (let [targets (comments-model/comment-thread-target-blocks comments-area)]
    (when (> (count targets) 1)
      [:div.ls-comments-targets
       (for [target targets]
         (let [uuid (:block/uuid target)
               reference (state/get-component :block/reference)]
           [:div.ls-comments-target
            {:key (str uuid)
             :data-block-id (str uuid)}
            (if reference
              (reference {} uuid)
              (string/trim (or (:block/title target) "")))]))])))

(defn- comments-area-title-editing?
  [config block]
  (let [block-uuid (:block/uuid block)
        container-id (:container-id config)
        editing-in-container? (state/use-sub-editing? [container-id block-uuid])
        editing-in-unknown-container? (state/use-sub-editing? [:unknown-container block-uuid])]
    (boolean
     (and block-uuid
          (or editing-in-container?
              editing-in-unknown-container?)))))

(defn- comments-area-title-view
  [config block editing? *hide-block-refs? *show-query? {:keys [block-content-or-editor]}]
  (let [block-uuid (:block/uuid block)
        edit-input-id (str "edit-block-" block-uuid)]
    (if (and editing? block-content-or-editor)
      [:div.ls-comments-title-editor
       (block-content-or-editor
        (assoc config :table-block-title? true)
        (merge block (block/parse-title-and-body block-uuid
                                                 (get block :block/format :markdown)
                                                 (:block/title block)))
        {:edit-input-id edit-input-id
         :block-id block-uuid
         :edit? true
         :refs-count nil
         :*hide-block-refs? *hide-block-refs?
         :hide-block-refs-count? true
         :*show-query? *show-query?})]
      [:button.ls-comments-label
       {:type "button"
        :title (t :editor/click-to-edit)
        :aria-label (t :editor/click-to-edit)
        :on-pointer-down util/stop
        :on-click (fn [e]
                    (util/stop e)
                    (comments-handler/edit-comments-area-title! block (:container-id config)))}
       (comments-model/comments-area-title block)])))

(hsx/defc comments-area-view
  [config block children collapsed? *hide-block-refs? *show-query? renderers {:keys [focus-editor? inline?]}]
  (let [*comments-list-ref (hooks/use-ref nil)
        [targets-open? set-targets-open!] (hooks/use-state false)
        title-editing? (comments-area-title-editing? config block)
        render-token (comments-model/comments-render-token children)
        summary (comments-model/comments-summary children)
        count (count children)]
    (hooks/use-effect!
     (fn []
       (when (and (not collapsed?)
                  (seq children))
         (js/requestAnimationFrame
          #(some-> (hooks/deref *comments-list-ref)
                   (scroll-comments-list-to-bottom!))))
       nil)
     [collapsed? render-token])
    [:div.ls-comments-area
     (cond-> {}
       inline? (assoc :class "ls-comments-area-inline")
       (comments-model/range-comments-area? block)
       (assoc :on-mouse-enter #(set-comment-thread-targets-hover! block true)
              :on-mouse-leave #(set-comment-thread-targets-hover! block false)
              :on-focus #(set-comment-thread-targets-hover! block true)
              :on-blur #(set-comment-thread-targets-hover! block false)))
     (if collapsed?
       [:button.ls-comments-summary
        {:type "button"
         :on-pointer-down util/stop
         :on-click (fn [e]
                     (util/stop e)
                     (comments-handler/expand-comments-area! block))}
        (comments-model/collapsed-comments-label summary)]
       [:<>
        [:div.ls-comments-header
         (comments-area-title-view config block title-editing? *hide-block-refs? *show-query? renderers)
         [:span.ls-comments-count count]
         (when (comments-model/comment-thread-targets-toggle-visible? block)
           [:button.ls-comments-targets-toggle
            {:type "button"
             :on-pointer-down util/stop
             :on-click (fn [e]
                         (util/stop e)
                         (set-targets-open! (not targets-open?)))}
            (t :block.comments/on-those-blocks)])]
        (when (comments-model/show-comment-thread-targets? block targets-open?)
          (comment-thread-targets-view block))
        (when (seq children)
          [:div.ls-comments-list
           {:ref *comments-list-ref}
           (for [comment-block children]
             ^{:key (str (:block/uuid comment-block))}
             [comment-row-view config comment-block *hide-block-refs? *show-query? renderers])])
        (add-comment-button config block {:focus-on-mount? focus-editor?})])]))
