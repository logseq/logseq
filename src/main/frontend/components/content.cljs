(ns frontend.components.content
  (:require [clojure.string :as string]
            [dommy.core :as d]
            [frontend.commands :as commands]
            [frontend.components.editor :as editor]
            [frontend.components.page-menu :as page-menu]
            [frontend.components.export :as export]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.extensions.srs :as srs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.editor.property :as editor-property]
            [frontend.handler.image :as image-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.common.developer :as dev-common-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.modules.shortcut.core :as shortcut]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [frontend.util.url :as url-util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [rum.core :as rum]))

;; TODO i18n support

(rum/defc custom-context-menu-content
  []
  [:.menu-links-wrapper
   (ui/menu-background-color #(editor-property/batch-add-block-property! (state/get-selection-block-ids) :background-color %)
                             #(editor-property/batch-remove-block-property! (state/get-selection-block-ids) :background-color))

   (ui/menu-heading #(editor-handler/batch-set-heading! (state/get-selection-block-ids) %)
                    #(editor-handler/batch-set-heading! (state/get-selection-block-ids) true)
                    #(editor-handler/batch-remove-heading! (state/get-selection-block-ids)))

   [:hr.menu-separator]

   (ui/menu-link
    {:key "cut"
     :on-click #(editor-handler/cut-selection-blocks true)
     :shortcut (ui/keyboard-shortcut-from-config :editor/cut)}
    (t :editor/cut))
   (ui/menu-link
    {:key "delete"
     :on-click #(do (editor-handler/delete-selection %)
                    (state/hide-custom-context-menu!))
     :shortcut (ui/keyboard-shortcut-from-config :editor/delete)}
    (t :editor/delete-selection))
   (ui/menu-link
    {:key "copy"
     :on-click editor-handler/copy-selection-blocks
     :shortcut (ui/keyboard-shortcut-from-config :editor/copy)}
    (t :editor/copy))
   (ui/menu-link
    {:key "copy as"
     :on-click (fn [_]
                 (let [block-uuids (editor-handler/get-selected-toplevel-block-uuids)]
                   (state/set-modal!
                    #(export/export-blocks block-uuids {:whiteboard? false}))))}
    (t :content/copy-export-as))
   (ui/menu-link
    {:key "copy block refs"
     :on-click editor-handler/copy-block-refs}
    (t :content/copy-block-ref))
   (ui/menu-link
    {:key "copy block embeds"
     :on-click editor-handler/copy-block-embeds}
    (t :content/copy-block-emebed))

   [:hr.menu-separator]

   (when (state/enable-flashcards?)
     (ui/menu-link
      {:key "Make a Card"
       :on-click #(srs/batch-make-cards!)}
      (t :context-menu/make-a-flashcard)))

   (ui/menu-link
     {:key "Toggle number list"
      :on-click #(state/pub-event! [:editor/toggle-own-number-list (state/get-selection-block-ids)])}
     (t :context-menu/toggle-number-list))

   (ui/menu-link
    {:key "cycle todos"
     :on-click editor-handler/cycle-todos!
     :shortcut (ui/keyboard-shortcut-from-config :editor/cycle-todo)}
    (t :editor/cycle-todo))

   [:hr.menu-separator]

   (ui/menu-link
    {:key "Expand all"
     :on-click editor-handler/expand-all-selection!
     :shortcut (ui/keyboard-shortcut-from-config :editor/expand-block-children)}
    (t :editor/expand-block-children))

   (ui/menu-link
    {:key "Collapse all"
     :on-click editor-handler/collapse-all-selection!
     :shortcut (ui/keyboard-shortcut-from-config :editor/collapse-block-children)}
    (t :editor/collapse-block-children))])

(defonce *template-including-parent? (atom nil))

(rum/defc template-checkbox
  [template-including-parent?]
  [:div.flex.flex-row.w-auto.items-center
   [:p.text-medium.mr-2 (t :context-menu/template-include-parent-block)]
   (ui/toggle template-including-parent?
              #(swap! *template-including-parent? not))])

(rum/defcs block-template < rum/reactive
  shortcut/disable-all-shortcuts
  (rum/local false ::edit?)
  (rum/local "" ::input)
  {:will-unmount (fn [state]
                   (reset! *template-including-parent? nil)
                   state)}
  [state block-id]
  (let [edit? (get state ::edit?)
        input (get state ::input)
        template-including-parent? (rum/react *template-including-parent?)
        block-id (if (string? block-id) (uuid block-id) block-id)
        block (db/entity [:block/uuid block-id])
        has-children? (seq (:block/_parent block))]
    (when (and (nil? template-including-parent?) has-children?)
      (reset! *template-including-parent? true))

    (if @edit?
      (do
        (state/clear-edit!)
        [:<>
         [:div.px-4.py-2.text-sm {:on-click (fn [e] (util/stop e))}
          [:p (t :context-menu/input-template-name)]
          [:input#new-template.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
           {:auto-focus true
            :on-change (fn [e]
                         (reset! input (util/evalue e)))}]
          (when has-children?
            (template-checkbox template-including-parent?))
          (ui/button (t :submit)
                     :on-click (fn []
                                 (let [title (string/trim @input)]
                                   (when (not (string/blank? title))
                                     (if (page-handler/template-exists? title)
                                       (notification/show!
                                        [:p (t :context-menu/template-exists-warning)]
                                        :error)
                                       (do
                                         (editor-property/set-block-property! block-id :template title)
                                         (when (false? template-including-parent?)
                                           (editor-property/set-block-property! block-id :template-including-parent false))
                                         (state/hide-custom-context-menu!)))))))]
         [:hr.menu-separator]])
      (ui/menu-link
       {:key "Make a Template"
        :on-click (fn [e]
                    (util/stop e)
                    (reset! edit? true))}
       (t :context-menu/make-a-template)))))

(rum/defc ^:large-vars/cleanup-todo block-context-menu-content <
  shortcut/disable-all-shortcuts
  [_target block-id]
    (when-let [block (db/entity [:block/uuid block-id])]
      (let [heading (-> block :block/properties :heading (or false))]
        [:.menu-links-wrapper
         (ui/menu-background-color #(editor-property/set-block-property! block-id :background-color %)
                                   #(editor-property/remove-block-property! block-id :background-color))

         (ui/menu-heading heading
                          #(editor-handler/set-heading! block-id %)
                          #(editor-handler/set-heading! block-id true)
                          #(editor-handler/remove-heading! block-id))

         [:hr.menu-separator]

         (ui/menu-link
          {:key      "Open in sidebar"
           :on-click (fn [_e]
                       (editor-handler/open-block-in-sidebar! block-id))
           :shortcut ["⇧+click"]}
          (t :content/open-in-sidebar))

         [:hr.menu-separator]

         (ui/menu-link
          {:key      "Copy block ref"
           :on-click (fn [_e]
                       (editor-handler/copy-block-ref! block-id block-ref/->block-ref))}
          (t :content/copy-block-ref))

         (ui/menu-link
          {:key      "Copy block embed"
           :on-click (fn [_e]
                       (editor-handler/copy-block-ref! block-id #(util/format "{{embed ((%s))}}" %)))}
          (t :content/copy-block-emebed))

         ;; TODO Logseq protocol mobile support
         (when (util/electron?)
           (ui/menu-link
            {:key      "Copy block URL"
             :on-click (fn [_e]
                         (let [current-repo (state/get-current-repo)
                               tap-f (fn [block-id]
                                       (url-util/get-logseq-graph-uuid-url nil current-repo block-id))]
                           (editor-handler/copy-block-ref! block-id tap-f)))}
            (t :content/copy-block-url)))

         (ui/menu-link
          {:key      "Copy as"
           :on-click (fn [_]
                       (state/set-modal! #(export/export-blocks [block-id] {:whiteboard? false})))}
          (t :content/copy-export-as))

         (ui/menu-link
          {:key      "Cut"
           :on-click (fn [_e]
                       (editor-handler/cut-block! block-id))
           :shortcut (ui/keyboard-shortcut-from-config :editor/cut)}
          (t :editor/cut))

         (ui/menu-link
          {:key      "delete"
           :on-click #(editor-handler/delete-block-aux! block true)
           :shortcut (ui/keyboard-shortcut-from-config :editor/delete)}
          (t :editor/delete-selection))

         [:hr.menu-separator]

         (block-template block-id)

         (cond
           (srs/card-block? block)
           (ui/menu-link
            {:key      "Preview Card"
             :on-click #(srs/preview (:db/id block))}
            (t :context-menu/preview-flashcard))
           (state/enable-flashcards?)
           (ui/menu-link
            {:key      "Make a Card"
             :on-click #(srs/make-block-a-card! block-id)}
            (t :context-menu/make-a-flashcard))
           :else
           nil)

         (ui/menu-link
           {:key "Toggle number list"
            :on-click #(state/pub-event! [:editor/toggle-own-number-list (state/get-selection-block-ids)])}
           (t :context-menu/toggle-number-list))

         [:hr.menu-separator]

         (ui/menu-link
          {:key      "Expand all"
           :on-click (fn [_e]
                       (editor-handler/expand-all! block-id))
           :shortcut (ui/keyboard-shortcut-from-config :editor/expand-block-children)}
          (t :editor/expand-block-children))

         (ui/menu-link
          {:key      "Collapse all"
           :on-click (fn [_e]
                       (editor-handler/collapse-all! block-id {}))
           :shortcut (ui/keyboard-shortcut-from-config :editor/collapse-block-children)}
          (t :editor/collapse-block-children))

         (when (state/sub [:plugin/simple-commands])
           (when-let [cmds (state/get-plugins-commands-with-type :block-context-menu-item)]
             (for [[_ {:keys [key label] :as cmd} action pid] cmds]
               (ui/menu-link
                {:key      key
                 :on-click #(commands/exec-plugin-simple-command!
                             pid (assoc cmd :uuid block-id) action)}
                label))))

         (when (state/sub [:ui/developer-mode?])
           (ui/menu-link
            {:key      "(Dev) Show block data"
             :on-click (fn []
                         (dev-common-handler/show-entity-data [:block/uuid block-id]))}
            (t :dev/show-block-data)))

         (when (state/sub [:ui/developer-mode?])
           (ui/menu-link
            {:key      "(Dev) Show block AST"
             :on-click (fn []
                         (let [block (db/pull [:block/uuid block-id])]
                           (dev-common-handler/show-content-ast (:block/content block) (:block/format block))))}
            (t :dev/show-block-ast)))])))

(rum/defc block-ref-custom-context-menu-content
  [block block-ref-id]
  (when (and block block-ref-id)
    [:.menu-links-wrapper
     (ui/menu-link
      {:key "open-in-sidebar"
       :on-click (fn []
                   (state/sidebar-add-block!
                    (state/get-current-repo)
                    block-ref-id
                    :block-ref))
       :shortcut ["⇧+click"]}
      (t :content/open-in-sidebar))
     (ui/menu-link
      {:key "copy"
       :on-click (fn [] (editor-handler/copy-current-ref block-ref-id))}
      (t :content/copy-ref))
     (ui/menu-link
      {:key "delete"
       :on-click (fn [] (editor-handler/delete-current-ref! block block-ref-id))}
      (t :content/delete-ref))
     (ui/menu-link
      {:key "replace-with-text"
       :on-click (fn [] (editor-handler/replace-ref-with-text! block block-ref-id))}
      (t :content/replace-with-text))
     (ui/menu-link
      {:key "replace-with-embed"
       :on-click (fn [] (editor-handler/replace-ref-with-embed! block block-ref-id))}
      (t :content/replace-with-embed))]))

(rum/defc page-title-custom-context-menu-content
  [page]
  (when-not (string/blank? page)
    (let [page-menu-options (page-menu/page-menu page)]
      [:.menu-links-wrapper
       (for [{:keys [title options]} page-menu-options]
         (rum/with-key
           (ui/menu-link options title)
           title))])))

;; TODO: content could be changed
;; Also, keyboard bindings should only be activated after
;; blocks were already selected.
(rum/defc hiccup-content < rum/static
  (mixins/event-mixin
   (fn [state]
     ;; fixme: this mixin will register global event listeners on window
     ;; which might cause unexpected issues
     (mixins/listen state js/window "contextmenu"
                    (fn [e]
                      (let [target (gobj/get e "target")
                            block-el (.closest target ".bullet-container[blockid]")
                            block-id (some-> block-el (.getAttribute "blockid"))
                            {:keys [block block-ref]} (state/sub :block-ref/context)
                            {:keys [page]} (state/sub :page-title/context)]
                        (cond
                          page
                          (do
                            (common-handler/show-custom-context-menu!
                             e
                             (page-title-custom-context-menu-content page))
                            (state/set-state! :page-title/context nil))

                          block-ref
                          (do
                            (common-handler/show-custom-context-menu!
                             e
                             (block-ref-custom-context-menu-content block block-ref))
                            (state/set-state! :block-ref/context nil))

                          (and (state/selection?) (not (d/has-class? target "bullet")))
                          (common-handler/show-custom-context-menu!
                           e
                           (custom-context-menu-content))

                          (and block-id (parse-uuid block-id))
                          (let [block (.closest target ".ls-block")]
                            (when block
                              (state/clear-selection!)
                              (state/conj-selection-block! block :down))
                            (common-handler/show-custom-context-menu!
                             e
                             (block-context-menu-content target (uuid block-id))))

                          :else
                          nil))))))
  [id {:keys [hiccup]}]
  [:div {:id id}
   (if hiccup
     hiccup
     [:div.cursor (t :content/click-to-edit)])])

(rum/defc non-hiccup-content < rum/reactive
  [id content on-click on-hide config format]
  (let [edit? (state/sub [:editor/editing? id])]
    (if edit?
      (editor/box {:on-hide on-hide
                   :format format}
                  id
                  config)
      (let [on-click (fn [e]
                       (when-not (util/link? (gobj/get e "target"))
                         (util/stop e)
                         (editor-handler/reset-cursor-range! (gdom/getElement (str id)))
                         (state/set-edit-content! id content)
                         (state/set-edit-input-id! id)
                         (when on-click
                           (on-click e))))]
        [:pre.cursor.content.pre-white-space
         {:id id
          :on-click on-click}
         (if (string/blank? content)
           [:div.cursor (t :content/click-to-edit)]
           content)]))))

(defn- set-draw-iframe-style!
  []
  (let [width (gobj/get js/window "innerWidth")]
    (when (>= width 1024)
      (let [draws (d/by-class "draw-iframe")
            width (- width 200)]
        (doseq [draw draws]
          (d/set-style! draw :width (str width "px"))
          (let [height (max 700 (/ width 2))]
            (d/set-style! draw :height (str height "px")))
          (d/set-style! draw :margin-left (str (- (/ (- width 570) 2)) "px")))))))

(rum/defcs content < rum/reactive
  {:did-mount (fn [state]
                (set-draw-iframe-style!)
                (image-handler/render-local-images!)
                state)
   :did-update (fn [state]
                 (set-draw-iframe-style!)
                 (image-handler/render-local-images!)
                 state)}
  [state id {:keys [format
                    config
                    hiccup
                    content
                    on-click
                    on-hide]
             :as option}]
  (if hiccup
    [:div
     (hiccup-content id option)]
    (let [format (gp-util/normalize-format format)]
      (non-hiccup-content id content on-click on-hide config format))))
