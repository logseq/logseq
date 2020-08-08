(ns frontend.components.content
  (:require [rum.core :as rum]
            [frontend.format :as format]
            [frontend.format.protocol :as protocol]
            [frontend.handler :as handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export :as export-handler]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.state :as state]
            [frontend.mixins :as mixins]
            [frontend.ui :as ui]
            [frontend.config :as config]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [dommy.core :as d]
            [clojure.string :as string]
            [frontend.components.editor :as editor]))

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
      :on-click editor-handler/cut-selection-headings}
     "Cut")
    (ui/menu-link
     {:key "copy"
      :on-click editor-handler/copy-selection-headings}
     "Copy")]])

(rum/defc heading-context-menu-content
  [heading-id]
  [:div#custom-context-menu.w-48.rounded-md.shadow-lg.transition.ease-out.duration-100.transform.opacity-100.scale-100.enter-done.absolute {:style {:z-index 2}}
   [:div.py-1.rounded-md.bg-base-3.shadow-xs
    (ui/menu-link
     {:key "Copy block ref"
      :on-click (fn [_e]
                  (editor-handler/copy-block-ref! heading-id))}
     "Copy block ref")
    (ui/menu-link
     {:key "Focus on block"
      :on-click (fn [_e]
                  (editor-handler/focus-on-block! heading-id))}
     "Focus on block")
    (ui/menu-link
     {:key "Open in sidebar"
      :on-click (fn [_e]
                  (editor-handler/open-heading-in-sidebar! heading-id))}
     "Open in sidebar")
    (ui/menu-link
     {:key "Cut"
      :on-click (fn [_e]
                  (editor-handler/cut-heading! heading-id))}
     "Cut")
    (ui/menu-link
     {:key "Copy"
      :on-click (fn [_e]
                  (export-handler/copy-heading! heading-id))}
     "Copy")
    (ui/menu-link
     {:key "Copy as JSON"
      :on-click (fn [_e]
                  (export-handler/copy-heading-as-json! heading-id))}
     "Copy as JSON")]])

;; TODO: content could be changed
;; Also, keyboard bindings should only be activated after
;; headings were already selected.
(defn- cut-headings-and-clear-selections!
  [_]
  (editor-handler/cut-selection-headings)
  (editor-handler/clear-selection! nil))

(rum/defc hidden-selection < rum/reactive
  (mixins/keyboard-mixin "ctrl+c"
                         (fn [_]
                           (editor-handler/copy-selection-headings)
                           (editor-handler/clear-selection! nil)))
  (mixins/keyboard-mixin "ctrl+x" cut-headings-and-clear-selections!)
  (mixins/keyboard-mixin "backspace" cut-headings-and-clear-selections!)
  (mixins/keyboard-mixin "delete" cut-headings-and-clear-selections!)
  []
  [:div#selection.hidden])

(rum/defc hiccup-content < rum/static
  (mixins/event-mixin
   (fn [state]
     (mixins/listen state js/window "mouseup"
                    (fn [e]
                      (when-not (state/in-selection-mode?)
                        (when-let [headings (seq (util/get-selected-nodes "ls-heading"))]
                          (let [headings (remove nil? headings)
                                headings (remove #(d/has-class? % "dummy") headings)]
                            (when (seq headings)
                              (doseq [heading headings]
                                (d/add-class! heading "selected noselect"))
                              ;; TODO: We delay this so the following "click" event won't clear the selections.
                              ;; Needs more thinking.
                              (js/setTimeout #(state/set-selection-headings! headings)
                                             200)))))))

     (mixins/listen state js/window "click"
                    (fn [e]
                      ;; hide context menu
                      (state/hide-custom-context-menu!)

                      ;; enable scroll
                      (let [main (d/by-id "main-content")]
                        (d/remove-class! main "overflow-hidden")
                        (d/add-class! main "overflow-y-auto"))

                      (editor-handler/clear-selection! e)))

     (mixins/listen state js/window "contextmenu"
                    (fn [e]
                      (let [target (gobj/get e "target")
                            heading-id (d/attr target "headingid")]
                        (cond
                          (and heading-id (util/uuid-string? heading-id))
                          (do
                            (util/stop e)
                            (let [client-x (gobj/get e "clientX")
                                  client-y (gobj/get e "clientY")]
                              (let [main (d/by-id "main-content")]
                                ;; disable scroll
                                (d/remove-class! main "overflow-y-auto")
                                (d/add-class! main "overflow-hidden"))

                              (state/show-custom-context-menu! (heading-context-menu-content (cljs.core/uuid heading-id)))
                              (when-let [context-menu (d/by-id "custom-context-menu")]
                                (d/set-style! context-menu
                                              :left (str client-x "px")
                                              :top (str client-y "px")))))

                          (state/in-selection-mode?)
                          (do
                            (util/stop e)
                            (let [client-x (gobj/get e "clientX")
                                  client-y (gobj/get e "clientY")]
                              (let [main (d/by-id "main-content")]
                                ;; disable scroll
                                (d/remove-class! main "overflow-y-auto")
                                (d/add-class! main "overflow-hidden"))

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
    (let [headings (d/by-class "ls-heading")]
      (doseq [heading headings]
        (if (and (not (d/sel1 heading "img"))
                 (not (d/sel1 heading "iframe")))
          (d/add-class! heading "fixed-width")
          (d/remove-class! heading "fixed-width"))))))

(rum/defcs content < rum/reactive
  {:will-mount (fn [state]
                 (lazy-load-js state)
                 state)
   :did-mount (fn [state]
                (set-fixed-width!)
                state)
   :did-update (fn [state]
                 (set-fixed-width!)
                 (lazy-load-js state)
                 state)}
  [state id {:keys [format
                    config
                    hiccup
                    content
                    on-click
                    on-hide]
             :as option}]
  (let [in-selection-mode? (state/sub :selection/mode)]
    (if hiccup
      [:div
       (hiccup-content id option)
       (when in-selection-mode?
         (hidden-selection))]
      (let [format (format/normalize format)]
        (non-hiccup-content id content on-click on-hide config format)))))
