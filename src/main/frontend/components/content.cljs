(ns frontend.components.content
  (:require [cljs-time.coerce :as tc]
            [cljs.pprint :as pp]
            [clojure.string :as string]
            [dommy.core :as d]
            [frontend.commands :as commands]
            [frontend.components.editor :as editor]
            [frontend.components.export :as export]
            [frontend.components.page-menu :as page-menu]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.extensions.srs :as srs]
            [frontend.handler.common.developer :as dev-common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]
            [frontend.util :as util]
            [frontend.util.url :as url-util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [promesa.core :as p]
            [rum.core :as rum]
            [logseq.db :as ldb]))

;; TODO i18n support

(rum/defc custom-context-menu-content
  []
  (let [repo (state/get-current-repo)
        db-based? (config/db-based-graph? repo)]
    [:<>
     (ui/menu-background-color #(property-handler/batch-set-block-property! repo
                                                                            (state/get-selection-block-ids)
                                                                            (pu/get-pid :logseq.property/background-color)
                                                                            %)
                               #(property-handler/batch-remove-block-property! repo
                                                                               (state/get-selection-block-ids)
                                                                               (pu/get-pid :logseq.property/background-color)))
     (ui/menu-heading #(editor-handler/batch-set-heading! (state/get-selection-block-ids) %)
                      #(editor-handler/batch-set-heading! (state/get-selection-block-ids) true)
                      #(editor-handler/batch-remove-heading! (state/get-selection-block-ids)))

     (shui/dropdown-menu-separator)

     (shui/dropdown-menu-item
      {:key "cut"
       :on-click #(editor-handler/cut-selection-blocks true)}
      (t :editor/cut)
      (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/cut)))

     (shui/dropdown-menu-item
      {:key "delete"
       :on-click #(do (editor-handler/delete-selection %)
                      (state/hide-custom-context-menu!))}

      (t :editor/delete-selection)
      (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/delete)))

     (shui/dropdown-menu-item
      {:key "copy"
       :on-click editor-handler/copy-selection-blocks}
      (t :editor/copy)
      (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/copy)))

     (shui/dropdown-menu-item
      {:key "copy as"
       :on-pointer-down (fn [e]
                          (util/stop-propagation e)
                          (let [block-uuids (state/get-selection-block-ids)]
                            (shui/popup-hide!)
                            (shui/dialog-open!
                             #(export/export-blocks block-uuids {:whiteboard? false}))))}
      (t :content/copy-export-as))

     (shui/dropdown-menu-item
      {:key "copy block refs"
       :on-click editor-handler/copy-block-refs}
      (t :content/copy-block-ref))

     (when-not db-based?
       (shui/dropdown-menu-item
        {:key "copy block embeds"
         :on-click editor-handler/copy-block-embeds}
        (t :content/copy-block-emebed)))

     (shui/dropdown-menu-separator)

     (when (state/enable-flashcards?)
       (shui/dropdown-menu-item
        {:key "Make a Card"
         :on-click #(srs/batch-make-cards!)}
        (t :context-menu/make-a-flashcard)))

     (shui/dropdown-menu-item
      {:key "Toggle number list"
       :on-click #(state/pub-event! [:editor/toggle-own-number-list (state/get-selection-block-ids)])}
      (t :context-menu/toggle-number-list))

     (shui/dropdown-menu-item
      {:key "cycle todos"
       :on-click editor-handler/cycle-todos!}
      (t :editor/cycle-todo)
      (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/cycle-todo)))

     (shui/dropdown-menu-separator)

     (shui/dropdown-menu-item
      {:key "Expand all"
       :on-click editor-handler/expand-all-selection!}
      (t :editor/expand-block-children)
      (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/expand-block-children)))

     (shui/dropdown-menu-item
      {:key "Collapse all"
       :on-click editor-handler/collapse-all-selection!}
      (t :editor/collapse-block-children)
      (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/collapse-block-children)))]))

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
        has-children? (seq (:block/_parent block))
        repo (state/get-current-repo)]
    (when (and (nil? template-including-parent?) has-children?)
      (reset! *template-including-parent? true))

    (if @edit?
      (let [submit! (fn []
                      (let [title (string/trim @input)]
                        (when (not (string/blank? title))
                          (p/let [exists? (page-handler/<template-exists? title)]
                            (if exists?
                              (notification/show!
                                [:p (t :context-menu/template-exists-warning)]
                                :error)
                              (p/do!
                                (property-handler/set-block-property! repo block-id (pu/get-pid :logseq.property/template) title)
                                (when (false? template-including-parent?)
                                  (property-handler/set-block-property! repo block-id
                                    (pu/get-pid :logseq.property/template-including-parent)
                                    false))
                                (shui/popup-hide!)))))))]
        (state/clear-edit!)
        [:<>
         [:div.px-4.py-2.text-sm {:on-click (fn [e] (util/stop e))}
          [:p (t :context-menu/input-template-name)]
          [:input#new-template.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
           {:auto-focus true
            :on-key-down (fn [e]
                           (util/stop-propagation e)
                           (when (and (= "Enter" (util/ekey e))
                                   (not (string/blank? (util/trim-safe @input))))
                             (submit!)))
            :on-change (fn [e]
                         (reset! input (util/evalue e)))}]
          (when has-children?
            (template-checkbox template-including-parent?))
          (ui/button (t :submit) :on-click submit!)]
         (shui/dropdown-menu-separator)])
      (shui/dropdown-menu-item
        {:key "Make a Template"
        :on-click (fn [e]
                    (util/stop e)
                    (reset! edit? true))}
       (t :context-menu/make-a-template)))))

(rum/defc ^:large-vars/cleanup-todo block-context-menu-content <
  shortcut/disable-all-shortcuts
  [_target block-id]
  (let [repo (state/get-current-repo)
        db? (config/db-based-graph? repo)]
    (when-let [block (db/entity [:block/uuid block-id])]
      (let [properties (:block/properties block)
            heading (or (pu/lookup properties :logseq.property/heading)
                        false)]
        [:<>
         (ui/menu-background-color #(property-handler/set-block-property! repo block-id
                                                                          (pu/get-pid :logseq.property/background-color)
                                                                          %)
                                   #(property-handler/remove-block-property! repo block-id
                                                                             (pu/get-pid :logseq.property/background-color)))

         (ui/menu-heading heading
                          #(editor-handler/set-heading! block-id %)
                          #(editor-handler/set-heading! block-id true)
                          #(editor-handler/remove-heading! block-id))

         (shui/dropdown-menu-separator)

         (shui/dropdown-menu-item
          {:key      "Open in sidebar"
           :on-click (fn [_e]
                       (editor-handler/open-block-in-sidebar! block-id))}
          (t :content/open-in-sidebar)
          (shui/dropdown-menu-shortcut "⇧+click"))

         (shui/dropdown-menu-separator)

         (shui/dropdown-menu-item
          {:key      "Copy block ref"
           :on-click (fn [_e]
                       (editor-handler/copy-block-ref! block-id
                                                       (if db? page-ref/->page-ref block-ref/->block-ref)))}
          (t :content/copy-block-ref))

         (when-not db?
           (shui/dropdown-menu-item
            {:key      "Copy block embed"
             :on-click (fn [_e]
                         (editor-handler/copy-block-ref! block-id
                                                         (if db?
                                                           block-ref/->block-ref
                                                           #(util/format "{{embed ((%s))}}" %))))}
            (t :content/copy-block-emebed)))

         ;; TODO Logseq protocol mobile support
         (when (util/electron?)
           (shui/dropdown-menu-item
            {:key      "Copy block URL"
             :on-click (fn [_e]
                         (let [current-repo (state/get-current-repo)
                               tap-f (fn [block-id]
                                       (url-util/get-logseq-graph-uuid-url nil current-repo block-id))]
                           (editor-handler/copy-block-ref! block-id tap-f)))}
            (t :content/copy-block-url)))

         (shui/dropdown-menu-item
          {:key      "Copy as"
           :on-click (fn [_]
                       (shui/dialog-open!
                        #(export/export-blocks [block-id] {:whiteboard? false})))}
          (t :content/copy-export-as))

         (shui/dropdown-menu-item
          {:key "Cut"
           :on-click (fn [_e]
                       (editor-handler/cut-block! block-id))}
          (t :editor/cut)
          (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/cut)))

         (shui/dropdown-menu-item
          {:key "delete"
           :on-click #(editor-handler/delete-block-aux! block)}
          (t :editor/delete-selection)
          (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/delete)))

         (shui/dropdown-menu-separator)

         (when-not db?
           (block-template block-id))

         (cond
           (srs/card-block? block)
           (shui/dropdown-menu-item
            {:key      "Preview Card"
             :on-click #(srs/preview (:db/id block))}
            (t :context-menu/preview-flashcard))
           (state/enable-flashcards?)
           (shui/dropdown-menu-item
            {:key      "Make a Card"
             :on-click #(srs/make-block-a-card! block-id)}
            (t :context-menu/make-a-flashcard))
           :else
           nil)

         (shui/dropdown-menu-item
          {:key "Toggle number list"
           :on-click #(state/pub-event! [:editor/toggle-own-number-list (state/get-selection-block-ids)])}
          (t :context-menu/toggle-number-list))

         (shui/dropdown-menu-separator)

         (shui/dropdown-menu-item
          {:key "Expand all"
           :on-click (fn [_e]
                       (editor-handler/expand-all! block-id))}
          (t :editor/expand-block-children)
          (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/expand-block-children)))

         (shui/dropdown-menu-item
          {:key "Collapse all"
           :on-click (fn [_e]
                       (editor-handler/collapse-all! block-id {}))}
          (t :editor/collapse-block-children)
          (shui/dropdown-menu-shortcut (ui/keyboard-shortcut-from-config :editor/collapse-block-children)))

         (when (state/sub [:plugin/simple-commands])
           (when-let [cmds (state/get-plugins-commands-with-type :block-context-menu-item)]
             (for [[_ {:keys [key label] :as cmd} action pid] cmds]
               (shui/dropdown-menu-item
                {:key      key
                 :on-click #(commands/exec-plugin-simple-command!
                             pid (assoc cmd :uuid block-id) action)}
                label))))

         (when (state/sub [:ui/developer-mode?])
           [:<>
            (shui/dropdown-menu-separator)
            (shui/dropdown-menu-sub
             (shui/dropdown-menu-sub-trigger
              "Developer tools")

             (shui/dropdown-menu-sub-content
              (shui/dropdown-menu-item
               {:key "(Dev) Show block data"
                :on-click (fn []
                            (dev-common-handler/show-entity-data [:block/uuid block-id]))}
               (t :dev/show-block-data))
              (shui/dropdown-menu-item
               {:key "(Dev) Show block AST"
                :on-click (fn []
                            (let [block (db/pull [:block/uuid block-id])]
                              (dev-common-handler/show-content-ast (:block/title block) (:block/format block))))}
               (t :dev/show-block-ast))
              (shui/dropdown-menu-item
               {:key "(Dev) Show block content history"
                :on-click
                (fn []
                  (let [^object worker @db-browser/*worker
                        token (state/get-auth-id-token)
                        graph-uuid (ldb/get-graph-rtc-uuid (db/get-db))]
                    (p/let [result (.rtc-get-block-content-versions2 worker token graph-uuid (str block-id))
                            blocks-versions (ldb/read-transit-str result)]
                      (prn :Dev-show-block-content-history)
                      (doseq [[block-uuid versions] blocks-versions]
                        (prn :block-uuid block-uuid)
                        (pp/print-table [:content :created-at]
                                        (map (fn [version]
                                               {:created-at (tc/from-long (* (:created-at version) 1000))
                                                :content (:value version)})
                                             versions))))))}

               "(Dev) Show block content history")))])]))))

(rum/defc block-ref-custom-context-menu-content
  [block block-ref-id]
  (when (and block block-ref-id)
    [:<>
     (shui/dropdown-menu-item
      {:key "open-in-sidebar"
       :on-click (fn []
                   (state/sidebar-add-block!
                    (state/get-current-repo)
                    block-ref-id
                    :block-ref))}
      (t :content/open-in-sidebar)
      (shui/dropdown-menu-shortcut ["⇧+click"]))
     (shui/dropdown-menu-item
      {:key "copy"
       :on-click (fn [] (editor-handler/copy-current-ref block-ref-id))}
      (t :content/copy-ref))
     (shui/dropdown-menu-item
      {:key "delete"
       :on-click (fn [] (editor-handler/delete-current-ref! block block-ref-id))}
      (t :content/delete-ref))
     (shui/dropdown-menu-item
      {:key "replace-with-text"
       :on-click (fn [] (editor-handler/replace-ref-with-text! block block-ref-id))}
      (t :content/replace-with-text))
     (shui/dropdown-menu-item
      {:key "replace-with-embed"
       :on-click (fn [] (editor-handler/replace-ref-with-embed! block block-ref-id))}
      (t :content/replace-with-embed))]))

(rum/defc page-title-custom-context-menu-content
  [page]
  (when page
    (let [page-menu-options (page-menu/page-menu page)]
      [:<>
       (for [{:keys [title options]} page-menu-options]
         (shui/dropdown-menu-item options title))])))

;; TODO: content could be changed
;; Also, keyboard bindings should only be activated after
;; blocks were already selected.
(rum/defc hiccup-content < rum/static
  [id {:keys [hiccup]}]
  [:div {:id id}
   (if hiccup
     hiccup
     [:div.cursor (t :content/click-to-edit)])])

(rum/defc non-hiccup-content < rum/reactive
  [id content on-click on-hide config format]
  (let [edit? (state/sub-editing? id)]
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
                state)
   :did-update (fn [state]
                 (set-draw-iframe-style!)
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
    ;; TODO: remove this
    (let [format (common-util/normalize-format format)]
      (non-hiccup-content id content on-click on-hide config format))))
