(ns frontend.ui
  (:require [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.notification :as notification-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.rum :as r]
            [frontend.state :as state]
            [frontend.ui.date-picker]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.handler.plugin :as plugin-handler]
            [cljs-bean.core :as bean]
            [goog.dom :as gdom]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.data-helper :as shortcut-helper]
            [promesa.core :as p]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            [electron.ipc :as ipc]
            ["react-resize-context" :as Resize]
            ["react-textarea-autosize" :as TextareaAutosize]
            ["react-tippy" :as react-tippy]
            ["react-transition-group" :refer [CSSTransition TransitionGroup]]
            ["@logseq/react-tweet-embed" :as react-tweet-embed]
            ["react-intersection-observer" :as react-intersection-observer]
            [rum.core :as rum]
            [frontend.db-mixins :as db-mixins]
            [frontend.mobile.util :as mobile-util]
            [goog.functions :refer [debounce]]))

(defonce transition-group (r/adapt-class TransitionGroup))
(defonce css-transition (r/adapt-class CSSTransition))
(defonce textarea (r/adapt-class (gobj/get TextareaAutosize "default")))
(def resize-provider (r/adapt-class (gobj/get Resize "ResizeProvider")))
(def resize-consumer (r/adapt-class (gobj/get Resize "ResizeConsumer")))
(def Tippy (r/adapt-class (gobj/get react-tippy "Tooltip")))
(def ReactTweetEmbed (r/adapt-class react-tweet-embed))
(def useInView (gobj/get react-intersection-observer "useInView"))

(defn reset-ios-whole-page-offset!
  []
  (and (util/ios?)
       (util/safari?)
       (js/window.scrollTo 0 0)))

(defonce icon-size (if (mobile-util/native-platform?) 23 20))

(rum/defc ls-textarea
  < rum/reactive
  {:did-mount (fn [state]
                (let [^js el (rum/dom-node state)]
                  (. el addEventListener "mouseup"
                     #(let [start (util/get-selection-start el)
                            end (util/get-selection-end el)]
                        (when (and start end)
                          (when-let [e (and (not= start end)
                                            {:caret (cursor/get-caret-pos el)
                                             :start start :end end
                                             :text  (. (.-value el) substring start end)
                                             :point {:x (.-x %) :y (.-y %)}})]

                            (plugin-handler/hook-plugin-editor :input-selection-end (bean/->js e)))))))
                state)}
  [{:keys [on-change] :as props}]
  (let [skip-composition? (state/sub :editor/action)
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
   & [{:keys [modal-class z-index trigger-class]
       :or   {z-index 999}}]]
  (let [{:keys [open?]} state
        modal-content (modal-content-fn state)]
    [:div.relative.ui__dropdown-trigger {:style {:z-index z-index} :class trigger-class}
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
  [content-fn links {:keys [links-header links-footer] :as opts}]
  (dropdown
   content-fn
   (fn [{:keys [close-fn]}]
     [:div.py-1.rounded-md.shadow-xs
      (when links-header links-header)
      (for [{:keys [options title icon hr hover-detail item]} (if (fn? links) (links) links)]
        (let [new-options
              (merge options
                     {:title    hover-detail
                      :on-click (fn [e]
                                  (when-not (false? (when-let [on-click-fn (:on-click options)]
                                                      (on-click-fn e)))
                                    (close-fn)))})
              child (if hr
                      nil
                      (or item
                          [:div.flex.items-center
                           (when icon icon)
                           [:div {:style {:margin-right "8px"
                                          :margin-left  "4px"}} title]]))]
          (if hr
            [:hr.my-1 {:key "dropdown-hr"}]
            (rum/with-key
              (menu-link new-options child)
              title))))
      (when links-footer links-footer)])
   opts))

(defn button
  [text & {:keys [background href class intent on-click small? large?]
           :or {small? false large? false}
           :as   option}]
  (let [klass (when-not intent ".bg-indigo-600.hover:bg-indigo-700.focus:border-indigo-700.active:bg-indigo-700.text-center")
        klass (if background (string/replace klass "indigo" background) klass)
        klass (if small? (str klass ".px-2.py-1") klass)
        klass (if large? (str klass ".text-base") klass)]
    [:button.ui__button
     (merge
      {:type  "button"
       :class (str (util/hiccup->class klass) " " class)}
      (dissoc option :background :class :small? :large?)
      (when href
        {:on-click (fn []
                     (util/open-url href)
                     (when (fn? on-click) (on-click)))}))
     text]))

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
       {:style
        (when (or (= state "exiting")
                  (= state "exited"))
          {:z-index -1})}
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
            [:div.text-sm.leading-5.font-medium.whitespace-pre-line {:style {:margin 0}
                                                                     :class color-class}
             content]]
           [:div.ml-4.flex-shrink-0.flex
            [:button.inline-flex.text-gray-400.focus:outline-none.focus:text-gray-500.transition.ease-in-out.duration-150.notification-close-button
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

(defn main-node
  []
  (gdom/getElement "main-content-container"))

(defn get-scroll-top []
  (.-scrollTop (main-node)))

(defn get-dynamic-style-node
  []
  (js/document.getElementById "dynamic-style-scope"))

(defn inject-document-devices-envs!
  []
  (let [^js cl (.-classList js/document.documentElement)]
    (when util/mac? (.add cl "is-mac"))
    (when util/win32? (.add cl "is-win32"))
    (when (util/electron?) (.add cl "is-electron"))
    (when (util/ios?) (.add cl "is-ios"))
    (when (util/mobile?) (.add cl "is-mobile"))
    (when (util/safari?) (.add cl "is-safari"))
    (when (mobile-util/native-ios?) (.add cl "is-native-ios"))
    (when (mobile-util/native-android?) (.add cl "is-native-android"))
    (when (mobile-util/native-iphone?) (.add cl "is-native-iphone"))
    (when (mobile-util/native-iphone-without-notch?) (.add cl "is-native-iphone-without-notch"))
    (when (mobile-util/native-ipad?) (.add cl "is-native-ipad"))
    (when (util/electron?)
      (js/window.apis.on "full-screen" #(js-invoke cl (if (= % "enter") "add" "remove") "is-fullscreen"))
      (p/then (ipc/ipc :getAppBaseInfo) #(let [{:keys [isFullScreen]} (js->clj % :keywordize-keys true)]
                                           (and isFullScreen (.add cl "is-fullscreen")))))))

(defn inject-dynamic-style-node!
  []
  (let [style (get-dynamic-style-node)]
    (if (nil? style)
      (let [node (js/document.createElement "style")]
        (set! (.-id node) "dynamic-style-scope")
        (.appendChild js/document.head node))
      style)))

(defn apply-custom-theme-effect! [theme]
  (when plugin-handler/lsp-enabled?
    (when-let [custom-theme (state/sub [:ui/custom-theme (keyword theme)])]
      (when-let [url (:url custom-theme)]
        (js/LSPluginCore.selectTheme (bean/->js custom-theme)
                                     (bean/->js {:emit true}))
        (state/set-state! :plugin/selected-theme url)))))

(defn setup-system-theme-effect!
  []
  (let [^js schemaMedia (js/window.matchMedia "(prefers-color-scheme: dark)")]
    (try (.addEventListener schemaMedia "change" state/sync-system-theme!)
         (catch js/Error _error
           (.addListener schemaMedia state/sync-system-theme!)))
    (state/sync-system-theme!)
    #(try (.removeEventListener schemaMedia "change" state/sync-system-theme!)
          (catch js/Error _error
            (.removeListener schemaMedia state/sync-system-theme!)))))

(defn set-global-active-keystroke [val]
  (.setAttribute js/document.body "data-active-keystroke" val))

(defn setup-active-keystroke! []
  (let [active-keystroke (atom #{})
        heads #{:shift :alt :meta :control}
        handle-global-keystroke (fn [down? e]
                                  (let [handler (if down? conj disj)
                                        keystroke e.key]
                                    (swap! active-keystroke handler keystroke))
                                  (when (contains? heads (keyword (util/safe-lower-case e.key)))
                                    (set-global-active-keystroke (string/join "+" @active-keystroke))))
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

(defonce last-scroll-top (atom 0))

(defn scroll-down?
  []
  (let [scroll-top (get-scroll-top)
        down? (>= scroll-top @last-scroll-top)]
    (reset! last-scroll-top scroll-top)
    down?))

(defn bottom-reached?
  [node threshold]
  (let [full-height (gobj/get node "scrollHeight")
        scroll-top (gobj/get node "scrollTop")
        client-height (gobj/get node "clientHeight")]
    (<= (- full-height scroll-top client-height) threshold)))

(defn on-scroll
  [node {:keys [on-load on-top-reached threshold bottom-reached]
         :or {threshold 500}}]
  (let [scroll-top (gobj/get node "scrollTop")
        bottom-reached? (if (fn? bottom-reached)
                          (bottom-reached)
                          (bottom-reached? node threshold))
        top-reached? (= scroll-top 0)
        down? (scroll-down?)]
    (when (and down? bottom-reached? on-load)
      (on-load))
    (when (and (not down?) top-reached? on-top-reached)
      (on-top-reached))))

(defn attach-listeners
  "Attach scroll and resize listeners."
  [state]
  (let [list-element-id (first (:rum/args state))
        opts (-> state :rum/args (nth 2))
        node (js/document.getElementById list-element-id)
        debounced-on-scroll (debounce #(on-scroll node opts) 100)]
    (mixins/listen state node :scroll debounced-on-scroll)))

(rum/defcs infinite-list <
  (mixins/event-mixin attach-listeners)
  "Render an infinite list."
  [state _list-element-id body {:keys [on-load has-more more more-class]
                                :or {more-class "text-sm"}}]
  [:div
   body
   (when has-more
     [:div.w-full.p-4
      [:a.fade-link.text-link.font-bold
       {:on-click on-load
        :class more-class}
       (or more (t :page/earlier))]])])

(rum/defcs auto-complete <
  (rum/local 0 ::current-idx)
  (shortcut/mixin :shortcut.handler/auto-complete)
  [state
   matched
   {:keys [on-chosen
           on-shift-chosen
           get-group-name
           empty-placeholder
           item-render
           class
           header]}]
  (let [current-idx (get state ::current-idx)]
    [:div#ui__ac {:class class}
     (if (seq matched)
       [:div#ui__ac-inner.hide-scrollbar
        (when header header)
        (for [[idx item] (medley/indexed matched)]
          [:<>
           {:key idx}
           (let [item-cp
                 [:div {:key idx}
                  (let [chosen? (= @current-idx idx)]
                    (menu-link
                     {:id            (str "ac-" idx)
                      :class         (when chosen? "chosen")
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
       (when empty-placeholder
         empty-placeholder))]))

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

;; `sequence` can be a list of symbols, a list of strings, or a string
(defn render-keyboard-shortcut [sequence]
  (let [sequence (if (string? sequence)
                   (-> sequence ;; turn string into sequence
                       (string/trim)
                       (string/lower-case)
                       (string/split  #" |\+"))
                   sequence)]
    [:span.keyboard-shortcut
     (map-indexed (fn [i key]
                    [:code {:key i}
                   ;; Display "cmd" rather than "meta" to the user to describe the Mac
                   ;; mod key, because that's what the Mac keyboards actually say.
                     (if (or (= :meta key) (= "meta" key))
                       (util/meta-key-name)
                       (name key))])
                  sequence)]))

(defn keyboard-shortcut-from-config [shortcut-name]
  (let [default-binding (:binding (get shortcut-config/all-default-keyboard-shortcuts shortcut-name))
        custom-binding  (when (state/shortcuts) (get (state/shortcuts) shortcut-name))
        binding         (or custom-binding default-binding)]
    (shortcut-helper/decorate-binding binding)))

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
    (when-not (false? close-btn?)
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
       13 (fn [state _e]
            (some->
             (.querySelector (rum/dom-node state) "button.ui__modal-enter")
             (.click)))})))
  []
  (let [modal-panel-content (state/sub :modal/panel-content)
        fullscreen? (state/sub :modal/fullscreen?)
        close-btn? (state/sub :modal/close-btn?)
        show? (state/sub :modal/show?)
        label (state/sub :modal/label)
        close-fn (fn []
                   (state/close-modal!)
                   (state/close-settings!))
        modal-panel-content (or modal-panel-content (fn [_close] [:div]))]
    [:div.ui__modal
     {:style {:z-index (if show? 999 -1)}
      :label label}
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
    :or {on-cancel #()}}]
  (fn [close-fn]
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
          (t :cancel)]]]])))

(rum/defc sub-modal < rum/reactive
  []
  (when-let [modals (seq (state/sub :modal/subsets))]
    (for [[idx modal] (medley/indexed modals)]
      (let [id (:modal/id modal)
            modal-panel-content (:modal/panel-content modal)
            close-btn? (:modal/close-btn? modal)
            show? (:modal/show? modal)
            label (:modal/label modal)
            close-fn (fn []
                       (state/close-sub-modal! id))
            modal-panel-content (or modal-panel-content (fn [_close] [:div]))]
        [:div.ui__modal.is-sub-modal
         {:style {:z-index (if show? (+ 999 idx) -1)}
          :label label}
         (css-transition
          {:in show? :timeout 0}
          (fn [state]
            (modal-overlay state close-fn)))
         (css-transition
          {:in show? :timeout 0}
          (fn [state]
            (modal-panel show? modal-panel-content state close-fn false close-btn?)))]))))

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

(rum/defcs foldable < db-mixins/query rum/reactive
  (rum/local false ::control?)
  (rum/local false ::collapsed?)
  {:will-mount (fn [state]
                 (let [args (:rum/args state)]
                   (when (true? (:default-collapsed? (last args)))
                     (reset! (get state ::collapsed?) true)))
                 state)
   :did-mount (fn [state]
                (when-let [f (:init-collapsed (last (:rum/args state)))]
                  (f (::collapsed? state)))
                state)}
  [state header content {:keys [title-trigger? on-mouse-down
                                _default-collapsed? _init-collapsed]}]
  (let [control? (get state ::control?)
        collapsed? (get state ::collapsed?)
        on-mouse-down (fn [e]
                        (util/stop e)
                        (swap! collapsed? not)
                        (when on-mouse-down
                          (on-mouse-down @collapsed?)))]
    [:div.flex.flex-col
     [:div.content
      [:div.flex-1.flex-row.foldable-title (cond->
                                            {:on-mouse-over #(reset! control? true)
                                             :on-mouse-out  #(reset! control? false)}
                                             title-trigger?
                                             (assoc :on-mouse-down on-mouse-down
                                                    :class "cursor"))
       [:div.flex.flex-row.items-center
        (when-not (mobile-util/native-platform?)
          [:a.block-control.opacity-50.hover:opacity-100.mr-2
           (cond->
            {:style    {:width       14
                        :height      16
                        :margin-left -30}}
             (not title-trigger?)
             (assoc :on-mouse-down on-mouse-down))
           [:span {:class (if (or @control? @collapsed?) "control-show cursor-pointer" "control-hide")}
            (rotating-arrow @collapsed?)]])
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
     (fn [state error _info]
       (log/error :exception error)
       (assoc state ::error error))}
  [{error ::error, c :rum/react-component} error-view view]
  (if (some? error)
    error-view
    view))

(rum/defcs catch-error-and-notify
  < {:did-catch
     (fn [state error _info]
       (log/error :exception error)
       (notification-handler/show!
        (str "Error caught by UI!\n " error)
        :error)
       (assoc state ::error error))}
  [{error ::error, c :rum/react-component} error-view view]
  (if (some? error)
    error-view
    view))

(rum/defc block-error
  "Well styled error message for blocks"
  [title {:keys [content section-attrs]}]
  [:section.border.mt-1.p-1.cursor-pointer.block-content-fallback-ui
   section-attrs
   [:div.flex.justify-between.items-center.px-1
    [:h5.text-red-600.pb-1 title]
    [:a.text-xs.opacity-50.hover:opacity-80
     {:href "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"
      :target "_blank"} "report issue"]]
   (when content [:pre.m-0.text-sm content])])

(def component-error
  "Well styled error message for higher level components. Currently same as
  block-error but this could change"
  block-error)

(rum/defc select
  [options on-change class]
  [:select.mt-1.block.text-base.leading-6.border-gray-300.focus:outline-none.focus:shadow-outline-blue.focus:border-blue-300.sm:text-sm.sm:leading-5.ml-1.sm:ml-4.w-12.sm:w-20
   {:class     (or class "form-select")
    :style     {:padding "0 0 0 6px"}
    :on-change (fn [e]
                 (let [value (util/evalue e)]
                   (on-change value)))}
   (for [{:keys [label value selected]} options]
     [:option (cond->
               {:key   label
                :default-value (or value label)}
                selected
                (assoc :selected selected))
      label])])

(rum/defc radio-list
  [options on-change class]

  [:div.ui__radio-list
   {:class class}
   (for [{:keys [label value selected]} options]
     [:label
      {:key (str "radio-list-" label)}
      [:input.form-radio
       {:value value
        :type "radio"
        :on-change #(on-change (util/evalue %))
        :checked selected}]
      label])])

(rum/defc checkbox-list
  [options on-change class]

  (let [checked-vals
        (->> options (filter :selected) (map :value) (into #{}))

        on-item-change
        (fn [^js e]
          (let [^js target (.-target e)
                checked? (.-checked target)
                value (.-value target)]

            (on-change
             (into []
                   (if checked?
                     (conj checked-vals value)
                     (disj checked-vals value))))))]

    [:div.ui__checkbox-list
     {:class class}
     (for [{:keys [label value selected]} options]
       [:label
        {:key (str "check-list-" label)}
        [:input.form-checkbox
         {:value value
          :type  "checkbox"
          :on-change on-item-change
          :checked selected}]
        label])]))

(rum/defcs tippy < rum/reactive
  (rum/local false ::mounted?)
  [state {:keys [fixed-position? open? in-editor?] :as opts} child]
  (let [*mounted? (::mounted? state)
        manual (not= open? nil)
        edit-id (ffirst (state/sub :editor/editing?))
        editing-node (when edit-id (gdom/getElement edit-id))
        editing? (some? editing-node)
        scrolling? (state/sub :ui/scrolling?)
        open? (if manual open? @*mounted?)
        disabled? (boolean
                   (or
                    (and in-editor?
                         ;; editing in non-preview containers or scrolling
                         (not (util/rec-get-tippy-container editing-node))
                         (or editing? scrolling?))
                    (not (state/enable-tooltip?))))]
    (Tippy (->
            (merge {:arrow true
                    :sticky true
                    :delay 600
                    :theme "customized"
                    :disabled disabled?
                    :unmountHTMLWhenHide true
                    :open (if disabled? false open?)
                    :trigger (if manual "manual" "mouseenter focus")
                    ;; See https://github.com/tvkhoa/react-tippy/issues/13
                    :popperOptions {:modifiers {:flip {:enabled (not fixed-position?)}
                                                :hide {:enabled false}
                                                :preventOverflow {:enabled false}}}
                    :onShow #(reset! *mounted? true)
                    :onHide #(reset! *mounted? false)}
                   opts)
            (assoc :html (or
                          (when open?
                            (try
                              (when-let [html (:html opts)]
                                (if (fn? html)
                                  (html)
                                  [:div.px-2.py-1
                                   html]))
                              (catch js/Error e
                                (log/error :exception e)
                                [:div])))
                          [:div {:key "tippy"} ""])))
           (rum/fragment {:key "tippy-children"} child))))

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

(defn icon
  ([class] (icon class nil))
  ([class opts]
   [:i (merge {:class (str "ti ti-" class
                           (when (:class opts)
                             (str " " (string/trim (:class opts)))))}
              (dissoc opts :class))]))

(rum/defc with-shortcut < rum/reactive
  [shortcut-key position content]
  (let [tooltip? (state/sub :ui/shortcut-tooltip?)]
    (if tooltip?
      (tippy
       {:html [:div.text-sm.font-medium (keyboard-shortcut-from-config shortcut-key)]
        :interactive true
        :position    position
        :theme       "monospace"
        :delay       [1000, 100]
        :arrow       true}
       content)
      content)))

(rum/defc progress-bar
  [width]
  {:pre (integer? width)}
  [:div.w-full.bg-indigo-200.rounded-full.h-2.5.animate-pulse
   [:div.bg-indigo-600.h-2.5.rounded-full {:style {:width (str width "%")}
                                           :transition "width 1s"}]])

(rum/defc progress-bar-with-label
  [width label-left label-right]
  {:pre (integer? width)}
  [:div
   [:div.flex.justify-between.mb-1
    [:span.text-base
     label-left]
    [:span.text-sm.font-medium
     label-right]]
   (progress-bar width)])

(rum/defc lazy-loading-placeholder
  []
  [:div.shadow.rounded-md.p-4.w-full.mx-auto.mb-5.fade-in {:style {:height 88}}
   [:div.animate-pulse.flex.space-x-4
    [:div.flex-1.space-y-3.py-1
     [:div.h-2.bg-base-4.rounded]
     [:div.space-y-3
      [:div.grid.grid-cols-3.gap-4
       [:div.h-2.bg-base-4.rounded.col-span-2]
       [:div.h-2.bg-base-4.rounded.col-span-1]]
      [:div.h-2.bg-base-4.rounded]]]]])

(rum/defcs lazy-visible-inner
  [state visible? content-fn ref]
  [:div.lazy-visibility
   {:ref ref
    :style {:min-height 24}}
   (if visible?
     (when (fn? content-fn)
       [:div.fade-enter
        {:ref #(when-let [^js cls (and % (.-classList %))]
                 (.add cls "fade-enter-active"))}
        (content-fn)])
     (lazy-loading-placeholder))])

(rum/defc lazy-visible
  ([content-fn]
   (lazy-visible content-fn nil))
  ([content-fn {:keys [trigger-once? _debug-id]
                :or {trigger-once? false}}]
   (if (or (util/mobile?) (mobile-util/native-platform?))
     (content-fn)
     (let [[visible? set-visible!] (rum/use-state false)
           [last-changed-time set-last-changed-time!] (rum/use-state nil)
           inViewState (useInView #js {:rootMargin "100px"
                                       :triggerOnce trigger-once?
                                       :onChange (fn [in-view? entry]
                                                   (let [self-top (.-top (.-boundingClientRect entry))
                                                         time' (util/time-ms)]
                                                     (when (and
                                                            (or (and (not visible?) in-view?)
                                                                ;; hide only the components below the current top for better ux
                                                                (and visible? (not in-view?) (> self-top 0)))
                                                            (or (nil? last-changed-time)
                                                                (and (some? last-changed-time)
                                                                     (> (- time' last-changed-time) 50))))
                                                       (set-last-changed-time! time')
                                                       (set-visible! in-view?))))})
           ref (.-ref inViewState)]
       (lazy-visible-inner visible? content-fn ref)))))
