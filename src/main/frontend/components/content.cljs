(ns frontend.components.content
  (:require [rum.core :as rum]
            [frontend.db :as db]
            [frontend.format :as format]
            [frontend.format.protocol :as protocol]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export-handler]
            [frontend.handler.image :as image-handler]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [dommy.core :as d]
            [clojure.string :as string]
            [cljs.pprint :as pprint]
            [frontend.handler.notification :as notification]
            [frontend.components.editor :as editor]
            [frontend.context.i18n :as i18n]
            [frontend.text :as text]
            [frontend.handler.page :as page-handler]))

(defn- set-format-js-loading!
  [format value]
  (when format
    (swap! state/state assoc-in [:format/loading format] value)))

(defn- lazy-load
  [format]
  (let [format (format/normalize format)]
    (when-let [record (format/get-format-record format)]
      (when-not (protocol/loaded? record)
        (set-format-js-loading! format true)
        (protocol/lazyLoad record
                           (fn [result]
                             (set-format-js-loading! format false)))))))

(defn lazy-load-js
  [state]
  (when-let [format (:format (last (:rum/args state)))]
    (let [loader? (contains? config/html-render-formats format)]
      (when loader?
        (when-not (format/loaded? format)
          (lazy-load format))))))

(rum/defc custom-context-menu-content
  []
  [:div#custom-context-menu
   [:div.py-1.rounded-md.bg-base-3.shadow-xs
    (ui/menu-link
     {:key "cut"
      :on-click #(editor-handler/cut-selection-blocks true)}
     "Cut")
    (ui/menu-link
     {:key "copy"
      :on-click editor-handler/copy-selection-blocks}
     "Copy")
    (ui/menu-link
     {:key "make-todos"
      :on-click editor-handler/bulk-make-todos}
     (str "Make " (state/get-preferred-todo) "s"))]])

;; FIXME: Make it configurable
(def block-background-colors
  ["#533e7d"
   "#497d46"
   "#787f97"
   "#978626"
   "#49767b"
   "#264c9b"
   "#793e3e"])

(defonce *including-parent? (atom nil))

(rum/defc template-checkbox
  [including-parent?]
  [:div.flex.flex-row
   [:span.text-medium.mr-2 "Including the parent block in the template?"]
   (ui/toggle including-parent?
              #(swap! *including-parent? not))])

(rum/defcs block-template < rum/reactive
  (rum/local false ::edit?)
  (rum/local "" ::input)
  {:will-unmount (fn [state]
                   (reset! *including-parent? nil)
                   state)}
  [state block-id]
  (let [edit? (get state ::edit?)
        input (get state ::input)
        including-parent? (rum/react *including-parent?)
        block-id (if (string? block-id) (uuid block-id) block-id)
        block (db/entity [:block/uuid block-id])
        has-children? (seq (:block/children block))]
    (when (and (nil? including-parent?) has-children?)
      (reset! *including-parent? true))

    (if @edit?
      (do
        (state/clear-edit!)
        [:div.px-4.py-2 {:on-click (fn [e] (util/stop e))}
         [:p "What's the template's name?"]
         [:input#new-template.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
          {:auto-focus true
           :on-change (fn [e]
                        (reset! input (util/evalue e)))}]
         (when has-children?
           (template-checkbox including-parent?))
         (ui/button "Submit"
                    :on-click (fn []
                                (let [title (string/trim @input)]
                                  (when (not (string/blank? title))
                                    (if (page-handler/template-exists? title)
                                      (notification/show!
                                       [:p "Template already exists!"]
                                       :error)
                                      (do
                                        (editor-handler/set-block-property! block-id "template" title)
                                        (when (false? including-parent?)
                                          (editor-handler/set-block-property! block-id "including-parent" false))
                                        (state/hide-custom-context-menu!)))))))])
      (ui/menu-link
       {:key "Make template"
        :on-click (fn [e]
                    (util/stop e)
                    (reset! edit? true))}
       "Make template"))))

(rum/defc block-context-menu-content
  [target block-id]
  (rum/with-context [[t] i18n/*tongue-context*]
    (when-let [block (db/entity [:block/uuid block-id])]
      (let [properties (:block/properties block)
            heading (get properties "heading")
            heading? (= heading "true")]
        [:div#custom-context-menu
         [:div.py-1.rounded-md.bg-base-3.shadow-xs
          [:div.flex-row.flex.justify-between.py-4.pl-2
           [:div.flex-row.flex.justify-between
            (for [color block-background-colors]
              [:a.m-2.shadow-sm
               {:on-click (fn [_e]
                            (editor-handler/set-block-property! block-id "background_color" color))}
               [:div.heading-bg {:style {:background-color color}}]])]
           [:a.text-sm
            {:title (t :remove-background)
             :style {:margin-right 14
                     :margin-top 4}
             :on-click (fn [_e]
                         (editor-handler/remove-block-property! block-id "background_color"))}
            "Clear"]]
          (ui/menu-link
           {:key "Convert heading"
            :on-click (fn [_e]
                        (if heading?
                          (editor-handler/remove-block-property! block-id "heading")
                          (editor-handler/set-block-as-a-heading! block-id true)))}
           (if heading?
             "Convert back to a block"
             "Convert to a heading"))

          (let [empty-properties? (not (text/contains-properties? (:block/content block)))
                all-hidden? (text/properties-hidden? (:block/properties block))]
            (when (or empty-properties? all-hidden?)
              (ui/menu-link
               {:key "Add a property"
                :on-click (fn [_e]
                            (when-let [block-node (util/rec-get-block-node target)]
                              (let [block-dom-id (gobj/get block-node "id")
                                    edit-input-id (string/replace block-dom-id "ls-block" "edit-block")
                                    content (:block/content block)
                                    content (cond
                                              empty-properties?
                                              (text/rejoin-properties content {"" ""} {:remove-blank? false})
                                              all-hidden?
                                              (let [idx (string/index-of content "\n:END:")]
                                                (str
                                                 (subs content 0 idx)
                                                 "\n:: "
                                                 (subs content idx)))
                                              :else
                                              content)
                                    content-without-level (text/remove-level-spaces content (:block/format block))
                                    pos (string/index-of content-without-level ": \n:END:")]
                                (editor-handler/edit-block! block
                                                            pos
                                                            (:block/format block)
                                                            edit-input-id
                                                            (cond-> {:custom-content content}
                                                              all-hidden?
                                                              (assoc :custom-properties
                                                                     (assoc (:block/properties block) "" "")))))))}
               "Add a property")))

          (ui/menu-link
           {:key "Open in sidebar"
            :on-click (fn [_e]
                        (editor-handler/open-block-in-sidebar! block-id))}
           "Open in sidebar")

          (ui/menu-link
           {:key "Copy block ref"
            :on-click (fn [_e]
                        (editor-handler/copy-block-ref! block-id #(str "((" % "))")))}
           "Copy block ref")

          (block-template block-id)

          ;; (ui/menu-link
          ;;  {:key "Make template"
          ;;   :on-click (fn [_e]
          ;;               (editor-handler/copy-block-ref! block-id))}
          ;;  "Make template")

          (ui/menu-link
           {:key "Copy as text"
            :on-click (fn [_e]
                        (export-handler/copy-block! block-id))}
           "Copy as TEXT")

          (ui/menu-link
           {:key "Copy as JSON"
            :on-click (fn [_e]
                        (export-handler/copy-block-as-json! block-id))}
           "Copy as JSON")

          (ui/menu-link
           {:key "Cut"
            :on-click (fn [_e]
                        (editor-handler/cut-block! block-id))}
           "Cut")

          (when (state/sub [:ui/developer-mode?])
            (ui/menu-link
             {:key "(Dev) Show block data"
              :on-click (fn []
                          (let [block-data (with-out-str (pprint/pprint (db/pull [:block/uuid block-id])))]
                            (println block-data)
                            (notification/show!
                             [:div
                              [:pre.code block-data]
                              [:br]
                              (ui/button "Copy to clipboard"
                                         :on-click #(.writeText js/navigator.clipboard block-data))]
                             :success
                             false)))}
             "(Dev) Show block data"))]]))))

(rum/defc hiccup-content < rum/static
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "mouseup"
                    (fn [e]
                      (when-not (state/in-selection-mode?)
                        (when-let [blocks (seq (util/get-selected-nodes "ls-block"))]
                          (let [blocks (remove nil? blocks)
                                blocks (remove #(d/has-class? % "dummy") blocks)]
                            (when (seq blocks)
                              (doseq [block blocks]
                                (d/add-class! block "selected noselect"))
                              ;; TODO: We delay this so the following "click" event won't clear the selections.
                              ;; Needs more thinking.
                              (js/setTimeout #(state/set-selection-blocks! blocks)
                                             200)))))))

     (mixins/listen state js/window "contextmenu"
                    (fn [e]
                      (let [target (gobj/get e "target")
                            block-id (d/attr target "blockid")]
                        (cond
                          (and block-id (util/uuid-string? block-id))
                          (do
                            (util/stop e)
                            (let [client-x (gobj/get e "clientX")
                                  client-y (gobj/get e "clientY")
                                  scroll-y (util/cur-doc-top)]
                              (state/show-custom-context-menu! (block-context-menu-content target (cljs.core/uuid block-id)))
                              (when-let [context-menu (d/by-id "custom-context-menu")]
                                (d/set-style! context-menu
                                              :left (str client-x "px")
                                              :top (str (+ scroll-y client-y) "px")))))

                          (and (state/in-selection-mode?)
                               (seq (state/get-selection-blocks)))
                          (do
                            (util/stop e)
                            (let [client-x (gobj/get e "clientX")
                                  client-y (gobj/get e "clientY")
                                  scroll-y (util/cur-doc-top)]
                              (state/show-custom-context-menu! (custom-context-menu-content))
                              (when-let [context-menu (d/by-id "custom-context-menu")]
                                (d/set-style! context-menu
                                              :left (str client-x "px")
                                              :top (str (+ scroll-y client-y) "px")))))

                          :else
                          nil))))))
  [id {:keys [hiccup] :as option}]
  [:div {:id id}
   (if hiccup
     hiccup
     [:div.text-gray-500.cursor "Click to edit"])])

(rum/defc non-hiccup-content < rum/reactive
  [id content on-click on-hide config format]
  (let [edit? (state/sub [:editor/editing? id])
        loading (state/sub :format/loading)]
    (if edit?
      (editor/box {:on-hide on-hide
                   :format format}
                  id
                  config)
      (let [format (format/normalize format)
            loading? (get loading format)
            markup? (contains? config/html-render-formats format)
            on-click (fn [e]
                       (when-not (util/link? (gobj/get e "target"))
                         (util/stop e)
                         (editor-handler/reset-cursor-range! (gdom/getElement (str id)))
                         (state/set-edit-content! id content)
                         (state/set-edit-input-id! id)
                         (when on-click
                           (on-click e))))]
        (cond
          (and markup? loading?)
          [:div "loading ..."]

          :else                       ; other text formats
          [:pre.cursor.content.pre-white-space
           {:id id
            :on-click on-click}
           (if (string/blank? content)
             [:div.text-gray-500.cursor "Click to edit"]
             content)])))))

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
  {:will-mount (fn [state]
                 (lazy-load-js state)
                 state)
   :did-mount (fn [state]
                (set-draw-iframe-style!)
                (image-handler/render-local-images!)
                state)
   :did-update (fn [state]
                 (set-draw-iframe-style!)
                 (lazy-load-js state)
                 (image-handler/render-local-images!)
                 state)}
  [state id {:keys [format
                    config
                    hiccup
                    content
                    on-click
                    on-hide]
             :as option}]
  (let [in-selection-mode? (state/sub :selection/mode)
        selected-blocks (state/sub :selection/blocks)]
    (if hiccup
      [:div
       (hiccup-content id option)]
      (let [format (format/normalize format)]
        (non-hiccup-content id content on-click on-hide config format)))))
