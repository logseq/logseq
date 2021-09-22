(ns frontend.ui
  (:require [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :as i18n]
            [frontend.handler.notification :as notification-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.rum :as r]
            [frontend.state :as state]
            [frontend.ui.date-picker]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            ["react-resize-context" :as Resize]
            ["react-textarea-autosize" :as TextareaAutosize]
            ["react-tippy" :as react-tippy]
            ["react-transition-group" :refer [CSSTransition TransitionGroup]]
            ["react-tweet-embed" :as react-tweet-embed]
            [rum.core :as rum]))

(defonce transition-group (r/adapt-class TransitionGroup))
(defonce css-transition (r/adapt-class CSSTransition))
(defonce textarea (r/adapt-class (gobj/get TextareaAutosize "default")))
(def resize-provider (r/adapt-class (gobj/get Resize "ResizeProvider")))
(def resize-consumer (r/adapt-class (gobj/get Resize "ResizeConsumer")))
(def Tippy (r/adapt-class (gobj/get react-tippy "Tooltip")))
(def ReactTweetEmbed (r/adapt-class react-tweet-embed))

(rum/defc ls-textarea < rum/reactive
  [{:keys [on-change] :as props}]
  (let [skip-composition? (or
                           (state/sub :editor/show-page-search?)
                           (state/sub :editor/show-block-search?)
                           (state/sub :editor/show-template-search?))
        on-composition (fn [e]
                         (if skip-composition?
                           (on-change e)
                           (case e.type
                             "compositionend" (do
                                                (state/set-editor-in-composition! false)
                                                (on-change e))
                             (state/set-editor-in-composition! true))))
        props (assoc props
                     :on-change (fn [e] (when-not (state/editor-in-composition?)
                                          (on-change e)))
                     :on-composition-start on-composition
                     :on-composition-update on-composition
                     :on-composition-end on-composition)]
    (textarea props)))

(rum/defc dropdown-content-wrapper [state content class]
  (let [class (or class
                  (util/hiccup->class "origin-top-right.absolute.right-0.mt-2.rounded-md.shadow-lg"))]
    [:div.dropdown-wrapper
     {:class (str class " "
                  (case state
                    "entering" "transition ease-out duration-100 transform opacity-0 scale-95"
                    "entered" "transition ease-out duration-100 transform opacity-100 scale-100"
                    "exiting" "transition ease-in duration-75 transform opacity-100 scale-100"
                    "exited" "transition ease-in duration-75 transform opacity-0 scale-95"))}
     content]))

;; public exports
(rum/defcs dropdown < (mixins/modal :open?)
  [state content-fn modal-content-fn
   & [{:keys [modal-class z-index]
       :or   {z-index 999}
       :as   opts}]]
  (let [{:keys [open? toggle-fn]} state
        modal-content (modal-content-fn state)]
    [:div.ml-1.relative {:style {:z-index z-index}}
     (content-fn state)
     (css-transition
      {:in @open? :timeout 0}
      (fn [dropdown-state]
        (when @open?
          (dropdown-content-wrapper dropdown-state modal-content modal-class))))]))

(rum/defc menu-link
  [options child]
  [:a.block.px-4.py-2.text-sm.transition.ease-in-out.duration-150.cursor.menu-link
   options
   child])

(rum/defc dropdown-with-links
  [content-fn links {:keys [modal-class links-header links-footer z-index] :as opts}]
  (dropdown
   content-fn
   (fn [{:keys [close-fn] :as state}]
     [:div.py-1.rounded-md.shadow-xs
      (when links-header links-header)
      (for [{:keys [options title icon hr]} (if (fn? links) (links) links)]
        (let [new-options
              (assoc options
                     :on-click (fn [e]
                                 (when-let [on-click-fn (:on-click options)]
                                   (on-click-fn e))
                                 (close-fn)))
              child (if hr
                      [:hr.my-1]
                      [:div
                       {:style {:display "flex" :flex-direction "row"}}
                       [:div {:style {:margin-right "8px"}} title]])]
          (rum/with-key
            (menu-link new-options child)
            title)))
      (when links-footer links-footer)])
   opts))

(defn button
  [text & {:keys [background href class intent on-click small? large?]
           :or {small? false large? false}
           :as   option}]
  (let [klass (when-not intent ".bg-indigo-600.hover:bg-indigo-700.focus:border-indigo-700.active:bg-indigo-700")
        klass (if background (string/replace klass "indigo" background) klass)
        klass (if small? (str klass ".px-2.py-1") klass)
        klass (if large? (str klass ".text-base") klass)]
    (if href
      [:a.ui__button.is-link
       (merge
        {:type  "button"
         :class (str (util/hiccup->class klass) " " class)}
        (dissoc option :background :class :small?))
       text]
      [:button.ui__button
       (merge
        {:type  "button"
         :class (str (util/hiccup->class klass) " " class)}
        (dissoc option :background :class :small?))
       text])))

(rum/defc notification-content
  [state content status uid]
  (when (and content status)
    (let [[color-class svg]
          (case status
            :success
            ["text-gray-900 dark:text-gray-300 "
             [:svg.h-6.w-6.text-green-400
              {:stroke "currentColor", :viewBox "0 0 24 24", :fill "none"}
              [:path
               {:d               "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                :stroke-width    "2"
                :stroke-linejoin "round"
                :stroke-linecap  "round"}]]]
            :warning
            ["text-gray-900 dark:text-gray-300 "
             [:svg.h-6.w-6.text-yellow-500
              {:stroke "currentColor", :viewBox "0 0 24 24", :fill "none"}
              [:path
               {:d               "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                :stroke-width    "2"
                :stroke-linejoin "round"
                :stroke-linecap  "round"}]]]

            ["text-red-500"
             [:svg.h-6.w-6.text-red-500
              {:view-box "0 0 20 20", :fill "currentColor"}
              [:path
               {:clip-rule "evenodd"
                :d
                "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                :fill-rule "evenodd"}]]])]
      [:div.ui__notifications-content
       {:style {:z-index (if (or (= state "exiting")
                                 (= state "exited"))
                           -1
                           99)
                :top     "3.2em"}}
       [:div.max-w-sm.w-full.shadow-lg.rounded-lg.pointer-events-auto.notification-area
        {:class (case state
                  "entering" "transition ease-out duration-300 transform opacity-0 translate-y-2 sm:translate-x-0"
                  "entered" "transition ease-out duration-300 transform translate-y-0 opacity-100 sm:translate-x-0"
                  "exiting" "transition ease-in duration-100 opacity-100"
                  "exited" "transition ease-in duration-100 opacity-0")}
        [:div.rounded-lg.shadow-xs {:style {:max-height "calc(100vh - 200px)"
                                            :overflow-y "scroll"
                                            :overflow-x "hidden"}}
         [:div.p-4
          [:div.flex.items-start
           [:div.flex-shrink-0
            svg]
           [:div.ml-3.w-0.flex-1
            [:div.text-sm.leading-5.font-medium {:style {:margin 0}
                                                 :class color-class}
             content]]
           [:div.ml-4.flex-shrink-0.flex
            [:button.inline-flex.text-gray-400.focus:outline-none.focus:text-gray-500.transition.ease-in-out.duration-150
             {:on-click (fn []
                          (notification-handler/clear! uid))}
             [:svg.h-5.w-5
              {:fill "currentColor", :view-Box "0 0 20 20"}
              [:path
               {:clip-rule "evenodd"
                :d
                "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                :fill-rule "evenodd"}]]]]]]]]])))

(rum/defc notification < rum/reactive
  []
  (let [contents (state/sub :notification/contents)]
    (transition-group
     {:class-name "notifications ui__notifications"}
     (doall (map (fn [el]
                   (let [k (first el)
                         v (second el)]
                     (css-transition
                      {:timeout 100
                       :key     (name k)}
                      (fn [state]
                        (notification-content state (:content v) (:status v) k)))))
                 contents)))))

(defn checkbox
  [option]
  [:input.form-checkbox.h-4.w-4.transition.duration-150.ease-in-out
   (merge {:type "checkbox"} option)])

(defn badge
  [text option]
  [:span.inline-flex.items-center.px-2.5.py-0.5.rounded-full.text-xs.font-medium.leading-4.bg-purple-100.text-purple-800
   option
   text])

;; scroll
(defn get-doc-scroll-top []
  (.-scrollTop js/document.documentElement))

(defn main-node
  []
  (gdom/getElement "main-content"))

(defn get-scroll-top []
  (.-scrollTop (main-node)))

(defn get-dynamic-style-node
  []
  (js/document.getElementById "dynamic-style-scope"))

(defn inject-document-devices-envs!
  []
  (let [cl (.-classList js/document.documentElement)]
    (when util/mac? (.add cl "is-mac"))
    (when util/win32? (.add cl "is-win32"))
    (when (util/electron?) (.add cl "is-electron"))
    (when (util/ios?) (.add cl "is-ios"))
    (when (util/mobile?) (.add cl "is-mobile"))
    (when (util/safari?) (.add cl "is-safari"))
    (when (util/electron?)
      (js/window.apis.on "full-screen" #(js-invoke cl (if (= % "enter") "add" "remove") "is-fullscreen")))))

(defn inject-dynamic-style-node!
  []
  (let [style (get-dynamic-style-node)]
    (if (nil? style)
      (let [node (js/document.createElement "style")]
        (set! (.-id node) "dynamic-style-scope")
        (.appendChild js/document.head node))
      style)))

(defn setup-patch-ios-fixed-bottom-position!
  "fix a common issue about ios webpage viewport
   when soft keyboard setup"
  []
  (when (and
         (util/ios?)
         (not (nil? js/window.visualViewport)))
    (let [viewport js/visualViewport
          style (get-dynamic-style-node)
          sheet (.-sheet style)
          raf-pending? (atom false)
          set-raf-pending! #(reset! raf-pending? %)
          handler
          (fn []
            (when-not @raf-pending?
              (let [f (fn []
                        (set-raf-pending! false)
                        (let [vh (+ (.-offsetTop viewport) (.-height viewport))
                              rule (.. sheet -rules (item 0))
                              set-top #(set! (.. rule -style -top) (str % "px"))]
                          (set-top vh)))]
                (set-raf-pending! true)
                (js/window.requestAnimationFrame f))))]
      (.insertRule sheet ".fix-ios-fixed-bottom {bottom:unset !important; transform: translateY(-100%); top: 100vh;}")
      (.addEventListener viewport "resize" handler)
      (.addEventListener viewport "scroll" handler)
      (fn []
        (.removeEventListener viewport "resize" handler)
        (.removeEventListener viewport "scroll" handler)))))

(defn setup-system-theme-effect!
  []
  (let [^js schemaMedia (js/window.matchMedia "(prefers-color-scheme: dark)")]
    (.addEventListener schemaMedia "change" state/sync-system-theme!)
    (state/sync-system-theme!)
    #(.removeEventListener schemaMedia "change" state/sync-system-theme!)))

(defn set-global-active-keystroke [val]
  (.setAttribute js/document.body "data-active-keystroke" val))

(defn setup-active-keystroke! []
  (let [active-keystroke (atom #{})
        handle-global-keystroke (fn [down? e]
                                  (let [handler (if down? conj disj)
                                        keystroke e.key]
                                    (swap! active-keystroke handler keystroke))
                                  (set-global-active-keystroke (apply str (interpose "+" (vec @active-keystroke)))))
        keydown-handler (partial handle-global-keystroke true)
        keyup-handler (partial handle-global-keystroke false)
        clear-all #(do (set-global-active-keystroke "")
                       (reset! active-keystroke #{}))]
    (.addEventListener js/window "keydown" keydown-handler)
    (.addEventListener js/window "keyup" keyup-handler)
    (.addEventListener js/window "blur" clear-all)
    (.addEventListener js/window "visibilitychange" clear-all)
    (fn []
      (.removeEventListener js/window "keydown" keydown-handler)
      (.removeEventListener js/window "keyup" keyup-handler)
      (.removeEventListener js/window "blur" clear-all)
      (.removeEventListener js/window "visibilitychange" clear-all))))

(defn on-scroll
  [node on-load on-top-reached]
  (let [full-height (gobj/get node "scrollHeight")
        scroll-top (gobj/get node "scrollTop")
        client-height (gobj/get node "clientHeight")
        bottom-reached? (<= (- full-height scroll-top client-height) 100)
        top-reached? (= scroll-top 0)]
    (when (and bottom-reached? on-load)
      (on-load))
    (when (and top-reached? on-top-reached)
      (on-top-reached))))

(defn attach-listeners
  "Attach scroll and resize listeners."
  [state]

  (let [list-element-id (first (:rum/args state))
        opts (-> state :rum/args (nth 2))
        node (js/document.getElementById list-element-id)
        debounced-on-scroll (util/debounce 500 #(on-scroll
                                                 node
                                                 (:on-load opts) ; bottom reached
                                                 (:on-top-reached opts)))]
    (mixins/listen state node :scroll debounced-on-scroll)))

(rum/defcs infinite-list <
  (mixins/event-mixin attach-listeners)
  "Render an infinite list."
  [state list-element-id body {:keys [on-load has-more on-top-reached]}]
  (rum/with-context [[t] i18n/*tongue-context*]
    (rum/fragment
     body
     (when has-more
       [:a.fade-link.text-link.font-bold.text-4xl
        {:on-click on-load}
        (t :page/earlier)]))))

(rum/defcs auto-complete <
  (rum/local 0 ::current-idx)
  (shortcut/mixin :shortcut.handler/auto-complete)
  [state
   matched
   {:keys [on-chosen
           on-shift-chosen
           get-group-name
           empty-div
           item-render
           class]}]
  (let [current-idx (get state ::current-idx)]
    [:div#ui__ac {:class class}
     (if (seq matched)
       [:div#ui__ac-inner.hide-scrollbar
        (for [[idx item] (medley/indexed matched)]
          [:<>
           {:key idx}
           (let [item-cp
                 [:div {:key idx}
                  (let [chosen? (= @current-idx idx)]
                    (menu-link
                     {:id            (str "ac-" idx)
                      :class         (when chosen? "chosen")
                      :on-mouse-enter #(reset! current-idx idx)
                      :on-mouse-down (fn [e]
                                       (util/stop e)
                                       (if (and (gobj/get e "shiftKey") on-shift-chosen)
                                         (on-shift-chosen item)
                                         (on-chosen item)))}
                     (if item-render (item-render item chosen?) item)))]]

             (if get-group-name
               (if-let [group-name (get-group-name item)]
                 [:div
                  [:div.ui__ac-group-name group-name]
                  item-cp]
                 item-cp)

               item-cp))])]
       (when empty-div
         empty-div))]))

(def datepicker frontend.ui.date-picker/date-picker)

(defn toggle
  ([on? on-click] (toggle on? on-click false))
  ([on? on-click small?]
   [:a.ui__toggle {:on-click on-click
                   :class (if small? "is-small" "")}
    [:span.wrapper.transition-colors.ease-in-out.duration-200
     {:aria-checked (if on? "true" "false"), :tab-index "0", :role "checkbox"
      :class        (if on? "bg-indigo-600" "bg-gray-300")}
     [:span.switcher.transform.transition.ease-in-out.duration-200
      {:class       (if on? (if small? "translate-x-4" "translate-x-5") "translate-x-0")
       :aria-hidden "true"}]]]))

;; `sequence` can be a list of symbols or strings
(defn keyboard-shortcut [sequence]
  [:span.keyboard-shortcut
   (map-indexed (fn [i key]
                  [:code {:key i}
                   ;; Display "cmd" rather than "meta" to the user to describe the Mac
                   ;; mod key, because that's what the Mac keyboards actually say.
                   (if (or (= :meta key) (= "meta" key))
                     (util/meta-key-name)
                     (name key))])
                sequence)])

(defonce modal-show? (atom false))
(rum/defc modal-overlay
  [state close-fn]
  [:div.ui__modal-overlay
   {:class (case state
             "entering" "ease-out duration-300 opacity-0"
             "entered" "ease-out duration-300 opacity-100"
             "exiting" "ease-in duration-200 opacity-100"
             "exited" "ease-in duration-200 opacity-0")
    :on-click close-fn}
   [:div.absolute.inset-0.opacity-75]])

(rum/defc modal-panel-content <
  mixins/component-editing-mode
  [panel-content close-fn]
  (panel-content close-fn))

(rum/defc modal-panel
  [show? panel-content transition-state close-fn fullscreen? close-btn?]
  [:div.ui__modal-panel.transform.transition-all.sm:min-w-lg.sm
   {:class (case transition-state
             "entering" "ease-out duration-300 opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
             "entered" "ease-out duration-300 opacity-100 translate-y-0 sm:scale-100"
             "exiting" "ease-in duration-200 opacity-100 translate-y-0 sm:scale-100"
             "exited" "ease-in duration-200 opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95")}
   [:div.absolute.top-0.right-0.pt-2.pr-2
    (when close-btn?
      [:a.ui__modal-close.opacity-60.hover:opacity-100
       {:aria-label "Close"
        :type       "button"
        :on-click   close-fn}
       [:svg.h-6.w-6
        {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
        [:path
         {:d               "M6 18L18 6M6 6l12 12"
          :stroke-width    "2"
          :stroke-linejoin "round"
          :stroke-linecap  "round"}]]])]

   (when show?
     [:div {:class (if fullscreen? "" "panel-content")}
      (modal-panel-content panel-content close-fn)])])

(rum/defc modal < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      :on-hide (fn []
                 (some->
                  (.querySelector (rum/dom-node state) "button.ui__modal-close")
                  (.click)))
      :outside? false)
     (mixins/on-key-down
      state
      {;; enter
       13 (fn [state e]
            (some->
             (.querySelector (rum/dom-node state) "button.ui__modal-enter")
             (.click)))})))
  []
  (let [modal-panel-content (state/sub :modal/panel-content)
        fullscreen? (state/sub :modal/fullscreen?)
        close-btn? (state/sub :modal/close-btn?)
        show? (boolean modal-panel-content)
        close-fn (fn []
                   (state/close-modal!)
                   (state/close-settings!))
        modal-panel-content (or modal-panel-content (fn [close] [:div]))]
    [:div.ui__modal
     {:style {:z-index (if show? 100 -1)}}
     (css-transition
      {:in show? :timeout 0}
      (fn [state]
        (modal-overlay state close-fn)))
     (css-transition
      {:in show? :timeout 0}
      (fn [state]
        (modal-panel show? modal-panel-content state close-fn fullscreen? close-btn?)))]))

(defn make-confirm-modal
  [{:keys [tag title sub-title sub-checkbox? on-cancel on-confirm]
    :or {on-cancel #()}
    :as opts}]
  (fn [close-fn]
    (rum/with-context [[t] i18n/*tongue-context*]
      (let [*sub-checkbox-selected (and sub-checkbox? (atom []))]
        [:div.ui__confirm-modal
         {:class (str "is-" tag)}
         [:div.sm:flex.sm:items-start
          [:div.mx-auto.flex-shrink-0.flex.items-center.justify-center.h-12.w-12.rounded-full.bg-red-100.sm:mx-0.sm:h-10.sm:w-10
           [:svg.h-6.w-6.text-red-600
            {:stroke "currentColor", :view-box "0 0 24 24", :fill "none"}
            [:path
             {:d
              "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              :stroke-width    "2"
              :stroke-linejoin "round"
              :stroke-linecap  "round"}]]]
          [:div.mt-3.text-center.sm:mt-0.sm:ml-4.sm:text-left
           [:h2.headline.text-lg.leading-6.font-medium
            (if (keyword? title) (t title) title)]
           [:label.sublabel
            (when sub-checkbox?
              (checkbox
               {:default-value false
                :on-change     (fn [e]
                                 (let [checked (.. e -target -checked)]
                                   (reset! *sub-checkbox-selected [checked])))}))
            [:h3.subline.text-gray-400
             (if (keyword? sub-title)
               (t sub-title)
               sub-title)]]]]

         [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
          [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
           [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
            {:type     "button"
             :on-click #(and (fn? on-confirm)
                             (on-confirm % {:close-fn close-fn
                                            :sub-selected (and *sub-checkbox-selected @*sub-checkbox-selected)}))}
            (t :yes)]]
          [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
           [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
            {:type     "button"
             :on-click (comp on-cancel close-fn)}
            (t :cancel)]]]]))))

(defn loading
  [content]
  [:div.flex.flex-row.items-center
   [:span.icon.flex.items-center svg/loading]
   [:span.text.pl-2 content]])

(rum/defc rotating-arrow
  [collapsed?]
  [:span
   {:class (if collapsed? "rotating-arrow collapsed" "rotating-arrow not-collapsed")}
   (svg/caret-right)])

(rum/defcs foldable <
  (rum/local false ::control?)
  (rum/local false ::collapsed?)
  {:will-mount (fn [state]
                 (let [args (:rum/args state)]
                   (when (true? (:default-collapsed? (last args)))
                     (reset! (get state ::collapsed?) true)))
                 state)}
  [state header content {:keys [default-collapsed? title-trigger?]}]
  (let [control? (get state ::control?)
        collapsed? (get state ::collapsed?)
        on-mouse-down (fn [e]
                        (util/stop e)
                        (swap! collapsed? not))]
    [:div.flex.flex-col
     [:div.content
      [:div.flex-1.flex-row.foldable-title (cond->
                                            {:on-mouse-over #(reset! control? true)
                                             :on-mouse-out  #(reset! control? false)}
                                             title-trigger?
                                             (assoc :on-mouse-down on-mouse-down
                                                    :class "cursor"))
       [:div.flex.flex-row.items-center
        [:a.block-control.opacity-50.hover:opacity-100.mr-2
         (cond->
          {:style    {:width       14
                      :height      16
                      :margin-left -24}}
           (not title-trigger?)
           (assoc :on-mouse-down on-mouse-down))
         [:span {:class (if @control? "control-show" "control-hide")}
          (rotating-arrow @collapsed?)]]
        (if (fn? header)
          (header @collapsed?)
          header)]]]
     [:div {:class (if @collapsed? "hidden" "initial")
            :on-mouse-down (fn [e] (.stopPropagation e))}
      (if (fn? content)
        (if (not @collapsed?) (content) nil)
        content)]]))

(defn admonition
  [type content]
  (let [type (name type)]
    (when-let [icon (case (string/lower-case type)
                      "note" svg/note
                      "tip" svg/tip
                      "important" svg/important
                      "caution" svg/caution
                      "warning" svg/warning
                      "pinned" svg/pinned
                      nil)]
      [:div.flex.flex-row.admonitionblock.align-items {:class type}
       [:div.pr-4.admonition-icon.flex.flex-col.justify-center
        {:title (string/upper-case type)} (icon)]
       [:div.ml-4.text-lg
        content]])))

(rum/defcs catch-error
  < {:did-catch
     (fn [state error info]
       (js/console.dir error)
       (assoc state ::error error))}
  [{error ::error, c :rum/react-component} error-view view]
  (if (some? error)
    (do
      (log/error :exception error)
      error-view)
    view))

(rum/defc select
  [options on-change class]
  [:select.mt-1.block.px-3.text-base.leading-6.border-gray-300.focus:outline-none.focus:shadow-outline-blue.focus:border-blue-300.sm:text-sm.sm:leading-5.ml-4
   {:class     (or class "form-select")
    :style     {:padding "0 0 0 12px"}
    :on-change (fn [e]
                 (let [value (util/evalue e)]
                   (on-change value)))}
   (for [{:keys [label value selected]} options]
     [:option (cond->
               {:key   label
                :value (or value label)}
                selected
                (assoc :selected selected))
      label])])

(rum/defcs tippy < rum/static
  (rum/local false ::mounted?)
  [state {:keys [fixed-position? open?] :as opts} child]
  (let [*mounted? (::mounted? state)
        mounted? @*mounted?
        manual (not= open? nil)]
    (Tippy (->
            (merge {:arrow true
                    :sticky true
                    :theme "customized"
                    :disabled (not (state/enable-tooltip?))
                    :unmountHTMLWhenHide true
                    :open (if manual open? @*mounted?)
                    :trigger (if manual "manual" "mouseenter focus")
                    ;; See https://github.com/tvkhoa/react-tippy/issues/13
                    :popperOptions (if fixed-position?
                                     {:modifiers {:flip {:enabled false}
                                                  :hide {:enabled false}
                                                  :preventOverflow {:enabled false}}}
                                     {})
                    :onShow #(reset! *mounted? true)
                    :onHide #(reset! *mounted? false)}
                   opts)
            (assoc :html (if (or open? mounted?)
                           (try
                             (when-let [html (:html opts)]
                               (if (fn? html)
                                 (html)
                                 [:div.pr-3.py-1
                                  html]))
                             (catch js/Error e
                               (log/error :exception e)
                               [:div]))
                           [:div {:key "tippy"} ""])))
           child)))

(defn slider
  [default-value {:keys [min max on-change]}]
  [:input.cursor-pointer
   {:type  "range"
    :value (int default-value)
    :min   min
    :max   max
    :style {:width "100%"}
    :on-change #(let [value (util/evalue %)]
                  (on-change value))}])

(rum/defcs tweet-embed < (rum/local true :loading?)
  [state id]
  (let [*loading? (:loading? state)]
    [:div [(when @*loading? [:span.flex.items-center [svg/loading " ... loading"]])
           (ReactTweetEmbed
            {:id                    id
             :class                 "contents"
             :options               {:theme (when (= (state/sub :ui/theme) "dark") "dark")}
             :on-tweet-load-success #(reset! *loading? false)})]]))
