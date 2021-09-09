(ns frontend.components.content
  (:require [cljs.pprint :as pprint]
            [clojure.string :as string]
            [dommy.core :as d]
            [frontend.commands :as commands]
            [frontend.components.editor :as editor]
            [frontend.components.export :as export]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.db :as db]
            [frontend.extensions.srs :as srs]
            [frontend.format :as format]
            [frontend.format.protocol :as protocol]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.image :as image-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [rum.core :as rum]))

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
     {:key "copy as"
      :on-click (fn [_]
                  (let [block-uuids (editor-handler/get-selected-toplevel-block-uuids)]
                    (state/set-modal!
                     #(export/export-blocks block-uuids))))}
     "Copy as")]])

;; FIXME: Make it configurable
(def block-background-colors
  ["#533e7d"
   "#497d46"
   "#787f97"
   "#978626"
   "#49767b"
   "#264c9b"
   "#793e3e"])

(defonce *template-including-parent? (atom nil))

(rum/defc template-checkbox
  [template-including-parent?]
  [:div.flex.flex-row
   [:span.text-medium.mr-2 "Including the parent block in the template?"]
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
        [:div.px-4.py-2 {:on-click (fn [e] (util/stop e))}
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
                                        (state/hide-custom-context-menu!)))))))])
      (ui/menu-link
       {:key "Make template"
        :on-click (fn [e]
                    (util/stop e)
                    (reset! edit? true))}
       "Make template"))))

(rum/defc block-context-menu-content
  [target block-id]

  (let [*el-ref (rum/use-ref nil)]

    (rum/use-effect!
     (fn []
       (let [^js el (rum/deref *el-ref)
             {:keys [x y]} (util/calc-delta-rect-offset el js/document.documentElement)]
         (set! (.. el -style -transform)
               (str "translate3d(" (if (neg? x) x 0) "px," (if (neg? y) (- y 10) 0) "px" ",0)")))
       #())
     [])

    (rum/with-context [[t] i18n/*tongue-context*]
      (when-let [block (db/entity [:block/uuid block-id])]
        (let [properties (:block/properties block)
              heading? (true? (:heading properties))]
          [:div#custom-context-menu
           {:ref *el-ref}
           [:div.py-1.rounded-md.bg-base-3.shadow-xs
            [:div.flex-row.flex.justify-between.py-4.pl-2
             [:div.flex-row.flex.justify-between
              (for [color block-background-colors]
                [:a.m-2.shadow-sm
                 {:on-click (fn [_e]
                              (editor-handler/set-block-property! block-id "background-color" color))}
                 [:div.heading-bg {:style {:background-color color}}]])]
             [:a.text-sm
              {:title    (t :remove-background)
               :style    {:margin-right 14
                          :margin-top   4}
               :on-click (fn [_e]
                           (editor-handler/remove-block-property! block-id "background-color"))}
              "Clear"]]

            (ui/menu-link
             {:key      "Convert heading"
              :on-click (fn [_e]
                          (if heading?
                            (editor-handler/remove-block-property! block-id :heading)
                            (editor-handler/set-block-property! block-id :heading true)))}
             (if heading?
               "Convert back to a block"
               "Convert to a heading"))

            (ui/menu-link
             {:key      "Open in sidebar"
              :on-click (fn [_e]
                          (editor-handler/open-block-in-sidebar! block-id))}
             "Open in sidebar")

            (ui/menu-link
             {:key      "Copy block ref"
              :on-click (fn [_e]
                          (editor-handler/copy-block-ref! block-id #(str "((" % "))")))}
             "Copy block ref")

            (block-template block-id)

            (ui/menu-link
             {:key      "Copy as"
              :on-click (fn [_]
                          (state/set-modal! #(export/export-blocks [block-id])))}
             "Copy as")

            (if (srs/card-block? block)
              (ui/menu-link
               {:key      "Preview Card"
                :on-click #(srs/preview [(db/pull [:block/uuid block-id])])}
               "Preview Card")
              (ui/menu-link
               {:key      "Make a Card"
                :on-click #(srs/make-block-a-card! block-id)}
               "Make a Card"))

            (ui/menu-link
             {:key      "Cut"
              :on-click (fn [_e]
                          (editor-handler/cut-block! block-id))}
             "Cut")

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
               "(Dev) Show block data"))]])))))

(rum/defc block-ref-custom-context-menu-content
  [block block-ref-id]
  (when (and block block-ref-id)
    [:div#custom-context-menu
     [:div.py-1.rounded-md.bg-base-3.shadow-xs
      (ui/menu-link
       {:key "open-in-sidebar"
        :on-click (fn []
                    (let [block (db/pull [:block/uuid block-ref-id])]
                      (state/sidebar-add-block!
                       (state/get-current-repo)
                       block-ref-id
                       :block-ref
                       {:block block}))                    )}
       "Open in sidebar")
      (ui/menu-link
       {:key "copy"
        :on-click (fn [] (editor-handler/copy-current-ref block-ref-id))}
       "Copy this reference")
      (ui/menu-link
       {:key "delete"
        :on-click (fn [] (editor-handler/delete-current-ref! block block-ref-id))}
       "Delete this reference")
      (ui/menu-link
       {:key "replace-with-text"
        :on-click (fn [] (editor-handler/replace-ref-with-text! block block-ref-id))}
       "Replace with text")
      (ui/menu-link
       {:key "replace-with-embed"
        :on-click (fn [] (editor-handler/replace-ref-with-embed! block block-ref-id))}
       "Replace with embed")]]))

;; TODO: content could be changed
;; Also, keyboard bindings should only be activated after
;; blocks were already selected.
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
                              (util/select-highlight! blocks)
                              ;; TODO: We delay this so the following "click" event won't clear the selections.
                              ;; Needs more thinking.
                              (js/setTimeout #(state/set-selection-blocks! blocks)
                                             200)))))))

     (mixins/listen state js/window "contextmenu"
                    (fn [e]
                      (let [target (gobj/get e "target")
                            block-id (d/attr target "blockid")
                            {:keys [block block-ref]} (state/sub :block-ref/context)]
                        (cond
                          block-ref
                          (do
                            (common-handler/show-custom-context-menu!
                            e
                            (block-ref-custom-context-menu-content block block-ref))
                            (state/set-state! :block-ref/context nil))

                          (state/selection?)
                          (common-handler/show-custom-context-menu!
                           e
                           (custom-context-menu-content))

                          (and block-id (util/uuid-string? block-id))
                          (common-handler/show-custom-context-menu!
                           e
                           (block-context-menu-content target (cljs.core/uuid block-id)))

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
  (if hiccup
    [:div
     (hiccup-content id option)]
    (let [format (format/normalize format)]
      (non-hiccup-content id content on-click on-hide config format))))
