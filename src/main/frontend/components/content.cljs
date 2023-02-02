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
            [frontend.handler.image :as image-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.common.developer :as dev-common-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
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
   (ui/menu-link
    {:key "cut"
     :on-click #(editor-handler/cut-selection-blocks true)}
    "Cut"
    nil)
   (ui/menu-link
    {:key      "delete"
     :on-click #(do (editor-handler/delete-selection %)
                    (state/hide-custom-context-menu!))}
    "Delete"
    nil)
   (ui/menu-link
    {:key "copy"
     :on-click editor-handler/copy-selection-blocks}
    "Copy"
    nil)
   (ui/menu-link
    {:key "copy as"
     :on-click (fn [_]
                 (let [block-uuids (editor-handler/get-selected-toplevel-block-uuids)]
                   (state/set-modal!
                    #(export/export-blocks block-uuids))))}
    "Copy as..."
    nil)
   (ui/menu-link
    {:key "copy block refs"
     :on-click editor-handler/copy-block-refs}
    "Copy block refs"
    nil)
   (ui/menu-link
    {:key "copy block embeds"
     :on-click editor-handler/copy-block-embeds}
    "Copy block embeds"
    nil)

   [:hr.menu-separator]

   (ui/menu-link
    {:key "cycle todos"
     :on-click editor-handler/cycle-todos!}
    "Cycle todos"
    nil)])

(defonce *template-including-parent? (atom nil))

(rum/defc template-checkbox
  [template-including-parent?]
  [:div.flex.flex-row.w-auto.items-center
   [:p.text-medium.mr-2 "Including the parent block in the template?"]
   (ui/toggle template-including-parent?
              #(swap! *template-including-parent? not))])

(rum/defcs block-template < rum/reactive
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
          [:p "What's the template's name?"]
          [:input#new-template.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
           {:auto-focus true
            :on-change (fn [e]
                         (reset! input (util/evalue e)))}]
          (when has-children?
            (template-checkbox template-including-parent?))
          (ui/button "Submit"
                     :on-click (fn []
                                 (let [title (string/trim @input)]
                                   (when (not (string/blank? title))
                                     (if (page-handler/template-exists? title)
                                       (notification/show!
                                        [:p "Template already exists!"]
                                        :error)
                                       (do
                                         (editor-handler/set-block-property! block-id :template title)
                                         (when (false? template-including-parent?)
                                           (editor-handler/set-block-property! block-id :template-including-parent false))
                                         (state/hide-custom-context-menu!)))))))]
         [:hr.menu-separator]])
      (ui/menu-link
       {:key "Make a Template"
        :on-click (fn [e]
                    (util/stop e)
                    (reset! edit? true))}
       "Make a Template"
       nil))))

(rum/defc ^:large-vars/cleanup-todo block-context-menu-content
  [_target block-id]
    (when-let [block (db/entity [:block/uuid block-id])]
      (let [format (:block/format block)
            heading (-> block :block/properties :heading)]
        [:.menu-links-wrapper
         [:div.flex.flex-row.justify-between.py-1.px-2.items-center
          [:div.flex.flex-row.justify-between.flex-1.mx-2.mt-2
           (for [color ui/block-background-colors]
             [:a.shadow-sm
              {:title (t (keyword "color" color))
               :on-click (fn [_e]
                           (editor-handler/set-block-property! block-id "background-color" color))}
              [:div.heading-bg {:style {:background-color (str "var(--color-" color "-500)")}}]])
           [:a.shadow-sm
            {:title    (t :remove-background)
             :on-click (fn [_e]
                         (editor-handler/remove-block-property! block-id "background-color"))}
            [:div.heading-bg.remove "-"]]]]

         [:div.flex.flex-row.justify-between.pb-2.pt-1.px-2.items-center
          [:div.flex.flex-row.justify-between.flex-1.px-1
           (for [i (range 1 7)]
             (ui/button
              ""
              :disabled (= heading i)
              :icon (str "h-" i)
              :title (t :heading i)
              :class "to-heading-button"
              :on-click (fn [_e]
                          (editor-handler/set-heading! block-id format i))
              :intent "link"
              :small? true))
           (ui/button
            ""
            :icon "h-auto"
            :disabled (= heading true)
            :icon-props {:extension? true}
            :class "to-heading-button"
            :title (t :auto-heading)
            :on-click (fn [_e]
                        (editor-handler/set-heading! block-id format true))
            :intent "link"
            :small? true)
           (ui/button
            ""
            :icon "heading-off"
            :disabled (not heading)
            :icon-props {:extension? true}
            :class "to-heading-button"
            :title (t :remove-heading)
            :on-click (fn [_e]
                        (editor-handler/remove-heading! block-id format))
            :intent "link"
            :small? true)]]

         [:hr.menu-separator]

         (ui/menu-link
          {:key      "Open in sidebar"
           :on-click (fn [_e]
                       (editor-handler/open-block-in-sidebar! block-id))}
          (t :content/open-in-sidebar)
          ["⇧" "click"])

         [:hr.menu-separator]

         (ui/menu-link
          {:key      "Copy block ref"
           :on-click (fn [_e]
                       (editor-handler/copy-block-ref! block-id block-ref/->block-ref))}
          (t :content/copy-block-ref)
          nil)

         (ui/menu-link
          {:key      "Copy block embed"
           :on-click (fn [_e]
                       (editor-handler/copy-block-ref! block-id #(util/format "{{embed ((%s))}}" %)))}
          (t :content/copy-block-emebed)
          nil)

         ;; TODO Logseq protocol mobile support
         (when (util/electron?)
           (ui/menu-link
            {:key      "Copy block URL"
             :on-click (fn [_e]
                         (let [current-repo (state/get-current-repo)
                               tap-f (fn [block-id]
                                       (url-util/get-logseq-graph-uuid-url nil current-repo block-id))]
                           (editor-handler/copy-block-ref! block-id tap-f)))}
            "Copy block URL"
            nil))

         (ui/menu-link
          {:key      "Copy as"
           :on-click (fn [_]
                       (state/set-modal! #(export/export-blocks [block-id])))}
          "Copy as..."
          nil)

         (ui/menu-link
          {:key      "Cut"
           :on-click (fn [_e]
                       (editor-handler/cut-block! block-id))}
          "Cut"
          nil)

         (ui/menu-link
          {:key      "delete"
           :on-click #(editor-handler/delete-block-aux! block true)}
          "Delete"
          nil)

         [:hr.menu-separator]

         (block-template block-id)

         (cond
           (srs/card-block? block)
           (ui/menu-link
            {:key      "Preview Card"
             :on-click #(srs/preview (:db/id block))}
            "Preview Card"
            nil)
           (state/enable-flashcards?)
           (ui/menu-link
            {:key      "Make a Card"
             :on-click #(srs/make-block-a-card! block-id)}
            "Make a Flashcard"
            nil)
           :else
           nil)

         [:hr.menu-separator]

         (ui/menu-link
          {:key      "Expand all"
           :on-click (fn [_e]
                       (editor-handler/expand-all! block-id))}
          "Expand all"
          nil)

         (ui/menu-link
          {:key      "Collapse all"
           :on-click (fn [_e]
                       (editor-handler/collapse-all! block-id {}))}
          "Collapse all"
          nil)

         (when (state/sub [:plugin/simple-commands])
           (when-let [cmds (state/get-plugins-commands-with-type :block-context-menu-item)]
             (for [[_ {:keys [key label] :as cmd} action pid] cmds]
               (ui/menu-link
                {:key      key
                 :on-click #(commands/exec-plugin-simple-command!
                             pid (assoc cmd :uuid block-id) action)}
                label
                nil))))

         (when (state/sub [:ui/developer-mode?])
           (ui/menu-link
            {:key      "(Dev) Show block data"
             :on-click (fn []
                         (dev-common-handler/show-entity-data [:block/uuid block-id]))}
            "(Dev) Show block data"
            nil))

         (when (state/sub [:ui/developer-mode?])
           (ui/menu-link
            {:key      "(Dev) Show block AST"
             :on-click (fn []
                         (let [block (db/pull [:block/uuid block-id])]
                           (dev-common-handler/show-content-ast (:block/content block) (:block/format block))))}
            "(Dev) Show block AST"
            nil))])))

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
                    :block-ref))}
      "Open in sidebar"
      ["⇧" "click"])
     (ui/menu-link
      {:key "copy"
       :on-click (fn [] (editor-handler/copy-current-ref block-ref-id))}
      "Copy this reference"
      nil)
     (ui/menu-link
      {:key "delete"
       :on-click (fn [] (editor-handler/delete-current-ref! block block-ref-id))}
      "Delete this reference"
      nil)
     (ui/menu-link
      {:key "replace-with-text"
       :on-click (fn [] (editor-handler/replace-ref-with-text! block block-ref-id))}
      "Replace with text"
      nil)
     (ui/menu-link
      {:key "replace-with-embed"
       :on-click (fn [] (editor-handler/replace-ref-with-embed! block block-ref-id))}
      "Replace with embed"
      nil)]))

(rum/defc page-title-custom-context-menu-content
  [page]
  (when-not (string/blank? page)
    (let [page-menu-options (page-menu/page-menu page)]
      [:.menu-links-wrapper
       (for [{:keys [title options]} page-menu-options]
         (rum/with-key
           (ui/menu-link options title nil)
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
                            block-id (d/attr target "blockid")
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
                              (util/select-highlight! [block]))
                            (common-handler/show-custom-context-menu!
                             e
                             (block-context-menu-content target (uuid block-id))))

                          :else
                          nil))))))
  [id {:keys [hiccup]}]
  [:div {:id id}
   (if hiccup
     hiccup
     [:div.cursor "Click to edit"])])

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
           [:div.cursor "Click to edit"]
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
