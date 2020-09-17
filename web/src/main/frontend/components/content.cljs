(ns frontend.components.content
  (:require [rum.core :as rum]
            [frontend.db :as db]
            [frontend.format :as format]
            [frontend.format.protocol :as protocol]
            [frontend.handler :as handler]
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
            [frontend.components.svg :as svg]
            [frontend.context.i18n :as i18n]
            [frontend.text :as text]))

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
  [:div#custom-context-menu.w-48.rounded-md.shadow-lg.transition.ease-out.duration-100.transform.opacity-100.scale-100.enter-done.absolute {:style {:z-index 2}}
   [:div.py-1.rounded-md.bg-base-3.shadow-xs
    (ui/menu-link
     {:key "cut"
      :on-click editor-handler/cut-selection-blocks}
     "Cut")
    (ui/menu-link
     {:key "copy"
      :on-click editor-handler/copy-selection-blocks}
     "Copy")
    (ui/menu-link
     {:key "make-todos"
      :on-click editor-handler/bulk-make-todos}
     (str "Make " (state/get-preferred-todo) "s"))]])

(def block-background-colors
  ["rgb(83, 62, 125)"
   "rgb(73, 125, 70)"
   "rgb(120, 127, 151)"
   "rgb(151, 134, 38)"
   "rgb(73, 118, 123)"
   "rgb(38, 76, 155)"
   "rgb(121, 62, 62)"])

(rum/defc block-context-menu-content
  [target block-id]
  (rum/with-context [[t] i18n/*tongue-context*]
    (when-let [block (db/entity [:block/uuid block-id])]
      (let [properties (:block/properties block)
            heading (get properties "heading")
            heading? (= heading "true")]
        [:div#custom-context-menu.w-64.rounded-md.shadow-lg.transition.ease-out.duration-100.transform.opacity-100.scale-100.enter-done.absolute {:style {:z-index 2}}
         [:div.py-1.rounded-md.bg-base-3.shadow-xs
          [:div.flex-row.flex.justify-between.py-4.pl-2
           [:div.flex-row.flex.justify-between
            (for [color block-background-colors]
              [:a.m-2.shadow-sm
               {:on-click (fn [_e]
                            (editor-handler/set-block-property! block-id "background_color" color))}
               [:div.heading-bg {:style {:background-color color}}]])]
           [:a {:title (t :remove-background)
                :style {:margin-right 16
                        :margin-top 1}
                :on-click (fn [_e]
                            (editor-handler/remove-block-property! block-id "background_color"))}
            svg/close]]
          (ui/menu-link
           {:key "Convert heading"
            :on-click (fn [_e]
                        (editor-handler/set-block-as-a-heading! block-id (not heading?)))}
           (if heading?
             "Convert back to a block"
             "Convert to a heading"))

          (when-not (text/contains-properties? (:block/content block))
            (ui/menu-link
             {:key "Add a property"
              :on-click (fn [_e]
                          (when-let [block-node (util/rec-get-block-node target)]
                            (let [block-dom-id (gobj/get block-node "id")
                                  edit-input-id (string/replace block-dom-id "ls-block" "edit-block")
                                  content (-> (:block/content block)
                                              (text/rejoin-properties {"" ""} false))
                                  content-without-level (text/remove-level-spaces content (:block/format block))
                                  pos (string/index-of content-without-level ": \n:END:")]
                              (editor-handler/edit-block! (db/touch block)
                                                          pos
                                                          (:block/format block)
                                                          edit-input-id
                                                          content))))}
             "Add a property"))

          (ui/menu-link
           {:key "Open in sidebar"
            :on-click (fn [_e]
                        (editor-handler/open-block-in-sidebar! block-id))}
           "Open in sidebar")

          (ui/menu-link
           {:key "Copy block ref"
            :on-click (fn [_e]
                        (editor-handler/copy-block-ref! block-id))}
           "Copy block ref")

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
             "(Dev) Show block data")
            )]]))))

;; TODO: content could be changed
;; Also, keyboard bindings should only be activated after
;; blocks were already selected.
(defn- cut-blocks-and-clear-selections!
  [_]
  (editor-handler/cut-selection-blocks)
  (editor-handler/clear-selection! nil))

(rum/defc hidden-selection < rum/reactive
  (mixins/keyboard-mixin (util/->system-modifier "ctrl+c")
                         (fn [_]
                           (editor-handler/copy-selection-blocks)
                           (editor-handler/clear-selection! nil)))
  (mixins/keyboard-mixin (util/->system-modifier "ctrl+x") cut-blocks-and-clear-selections!)
  (mixins/keyboard-mixin "backspace" cut-blocks-and-clear-selections!)
  (mixins/keyboard-mixin "delete" cut-blocks-and-clear-selections!)
  []
  [:div#selection.hidden])

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
                                  client-y (gobj/get e "clientY")]
                              (state/show-custom-context-menu! (block-context-menu-content target (cljs.core/uuid block-id)))
                              (when-let [context-menu (d/by-id "custom-context-menu")]
                                (d/set-style! context-menu
                                              :left (str client-x "px")
                                              :top (str client-y "px")))))

                          (and (state/in-selection-mode?)
                               (seq (state/get-selection-blocks)))
                          (do
                            (util/stop e)
                            (let [client-x (gobj/get e "clientX")
                                  client-y (gobj/get e "clientY")]
                              (state/show-custom-context-menu! (custom-context-menu-content))
                              (when-let [context-menu (d/by-id "custom-context-menu")]
                                (d/set-style! context-menu
                                              :left (str client-x "px")
                                              :top (str client-y "px")))))

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
                   :format format} id)
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

          markup?
          (let [html (format/to-html content format config)]
            (if (string/blank? html)
              [:div.cursor.content
               {:id id
                :on-click on-click}
               [:div.text-gray-500.cursor "Click to edit"]]
              [:div.cursor.content
               {:id id
                :on-click on-click
                :dangerouslySetInnerHTML {:__html html}}]))

          :else                       ; other text formats
          [:pre.cursor.content
           {:id id
            :on-click on-click}
           (if (string/blank? content)
             [:div.text-gray-500.cursor "Click to edit"]
             content)])))))

(defn- set-fixed-width!
  []
  (when (> (gobj/get js/window "innerWidth") 1024)
    (let [blocks (d/by-class "ls-block")]
      (doseq [block blocks]
        (if (and
             (not (d/sel1 block "img"))
             (not (d/sel1 block "iframe")))
          (d/add-class! block "fixed-width")
          (d/remove-class! block "fixed-width"))))))

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
                (set-fixed-width!)
                (set-draw-iframe-style!)
                (image-handler/render-local-images!)
                state)
   :did-update (fn [state]
                 (set-fixed-width!)
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
       (hiccup-content id option)
       (when (and in-selection-mode? (seq selected-blocks))
         (hidden-selection))]
      (let [format (format/normalize format)]
        (non-hiccup-content id content on-click on-hide config format)))))
