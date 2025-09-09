(ns frontend.ui
  "Main ns for reusable components"
  (:require ["@emoji-mart/data" :as emoji-data]
            ["@logseq/react-tweet-embed" :as react-tweet-embed]
            ["emoji-mart" :as emoji-mart]
            ["react-intersection-observer" :as react-intersection-observer]
            ["react-textarea-autosize" :as TextareaAutosize]
            ["react-transition-group" :refer [CSSTransition TransitionGroup]]
            ["react-virtuoso" :refer [Virtuoso VirtuosoGrid]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.mixins :as mixins]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.rum :as r]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.icon.v2 :as shui.icon.v2]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

(declare icon)
(declare tooltip)

(defonce transition-group (r/adapt-class TransitionGroup))
(defonce css-transition (r/adapt-class CSSTransition))
(defonce textarea (r/adapt-class (gobj/get TextareaAutosize "default")))
(defonce virtualized-list (r/adapt-class Virtuoso))
(defonce virtualized-grid (r/adapt-class VirtuosoGrid))

(def ReactTweetEmbed (r/adapt-class react-tweet-embed))
(def useInView (gobj/get react-intersection-observer "useInView"))
(defonce _emoji-init-data ((gobj/get emoji-mart "init") #js {:data emoji-data}))
;; (def EmojiPicker (r/adapt-class (gobj/get Picker "default")))

(defonce icon-size (if (mobile-util/native-platform?) 24 20))

(defn shui-popups? [] (some-> (shui-popup/get-popups) (count) (> 0)))
(defn last-shui-preview-popup?
  []
  (= "ls-preview-popup"
     (some-> (shui-popup/get-last-popup) :content-props :class)))
(defn hide-popups-until-preview-popup!
  []
  (if (util/mobile?)
    (shui/popup-hide!)
    (while (and (shui-popups?)
                (not (last-shui-preview-popup?)))
      (shui/popup-hide!))))

(def built-in-colors
  ["yellow"
   "red"
   "pink"
   "green"
   "blue"
   "purple"
   "gray"])

(defn ->block-background-color
  [color]
  (if (some #{color} built-in-colors)
    (str "var(--ls-highlight-color-" color ")")
    color))

(defn built-in-color?
  [color]
  (some #{color} built-in-colors))

(rum/defc menu-background-color
  [add-bgcolor-fn rm-bgcolor-fn]
  [:div.flex.flex-row.justify-between.py-1.px-2.items-center
   [:div.flex.flex-row.justify-between.flex-1.mx-2.mt-2
    (for [color built-in-colors]
      [:a
       {:key (str "key-" color)
        :title (t (keyword "color" color))
        :on-click #(add-bgcolor-fn color)}
       [:div.heading-bg {:style {:background-color (str "var(--color-" color "-500)")}}]])
    [:a
     {:title (t :remove-background)
      :on-click rm-bgcolor-fn}
     [:div.heading-bg.remove "-"]]]])

(rum/defc ls-textarea
  < rum/reactive
  {:did-mount (fn [state]
                (let [^js el (rum/dom-node state)
                      *mouse-point (volatile! nil)]
                  (doto el
                    (.addEventListener "select"
                                       #(let [start (util/get-selection-start el)
                                              end (util/get-selection-end el)]
                                          (when (and start end)
                                            (when-let [e (and (not= start end)
                                                              (let [caret-pos (cursor/get-caret-pos el)]
                                                                {:caret caret-pos
                                                                 :start start :end end
                                                                 :text  (. (.-value el) substring start end)
                                                                 :point (select-keys (or @*mouse-point caret-pos) [:x :y])}))]
                                              (plugin-handler/hook-plugin-editor :input-selection-end (bean/->js e))
                                              (vreset! *mouse-point nil)))))
                    (.addEventListener "mouseup" #(vreset! *mouse-point {:x (.-x %) :y (.-y %)}))))
                state)
   :will-unmount (fn [state]
                   (when-let [on-unmount (:on-unmount (first (:rum/args state)))]
                     (on-unmount))
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
                     "data-testid" "block editor"
                     :on-change (fn [e] (when-not (state/editor-in-composition?)
                                          (on-change e)))
                     :on-composition-start on-composition
                     :on-composition-update on-composition
                     :on-composition-end on-composition)]
    (textarea props)))

(rum/defc dropdown-content-wrapper
  < {:did-mount    (fn [state]
                     (let [k (inc (count (state/sub :modal/dropdowns)))
                           args (:rum/args state)]
                       (state/set-state! [:modal/dropdowns k] (second args))
                       (assoc state ::k k)))
     :will-unmount (fn [state]
                     (state/update-state! :modal/dropdowns #(dissoc % (::k state)))
                     state)}
  [dropdown-state _close-fn content class style-opts]
  (let [class (or class
                  (util/hiccup->class "origin-top-right.absolute.right-0.mt-2"))]
    [:div.dropdown-wrapper.max-h-screen.overflow-y-auto
     {:style style-opts
      :class (str class " "
                  (case dropdown-state
                    "entering" "transition ease-out duration-100 transform opacity-0 scale-95"
                    "entered" "transition ease-out duration-100 transform opacity-100 scale-100"
                    "exiting" "transition ease-in duration-75 transform opacity-100 scale-100"
                    "exited" "transition ease-in duration-75 transform opacity-0 scale-95"))}
     content]))

;; public exports
(rum/defcs dropdown < (mixins/modal :open?)
  {:init (fn [state]
           (let [opts (if (map? (last (:rum/args state)))
                        (last (:rum/args state))
                        (->> (drop 2 (:rum/args state))
                             (partition 2)
                             (map vec)
                             (into {})))]
             (when (:initial-open? opts)
               (reset! (:open? state) true))
             (let [on-toggle (:on-toggle opts)]
               (when (fn? on-toggle)
                 (add-watch (:open? state) ::listen-open-value
                            (fn [_ _ _ _]
                              (on-toggle @(:open? state)))))))
           state)}
  [state content-fn modal-content-fn
   & [{:keys [modal-class z-index trigger-class _initial-open? *toggle-fn
              _on-toggle]
       :or   {z-index 999}}]]
  (let [{:keys [open?]} state
        _ (when (and (util/atom? *toggle-fn)
                     (nil? @*toggle-fn)
                     (:toggle-fn state))
            (reset! *toggle-fn (:toggle-fn state)))
        modal-content (modal-content-fn state)
        close-fn (:close-fn state)]
    [:div.relative.ui__dropdown-trigger {:class trigger-class}
     (content-fn state)
     (css-transition
      {:in @open? :timeout 0}
      (fn [dropdown-state]
        (when @open?
          (dropdown-content-wrapper dropdown-state close-fn modal-content modal-class {:z-index z-index}))))]))

;; `sequence` can be a list of symbols, a list of strings, or a string
(defn render-keyboard-shortcut [sequence & {:as opts}]
  (let [sequence (if (string? sequence)
                   (-> sequence ;; turn string into sequence
                       (string/trim)
                       (string/lower-case)
                       (string/split #" "))
                   sequence)]
    [:span.keyboard-shortcut
     (shui/shortcut sequence opts)]))

(rum/defc menu-link
  [{:keys [only-child? no-padding? class shortcut] :as options} child]
  (if only-child?
    [:div.menu-link
     (dissoc options :only-child?) child]
    [:a.flex.justify-between.menu-link
     (cond-> options
       (true? no-padding?)
       (assoc :class (str class " no-padding"))

       true
       (dissoc :no-padding?))

     [:span.flex-1 child]
     (when shortcut
       [:span.ml-1 (render-keyboard-shortcut shortcut {:interactive? false})])]))

(rum/defc dropdown-with-links
  [content-fn links
   {:keys [outer-header outer-footer links-header links-footer] :as opts}]

  (dropdown
   content-fn
   (fn [{:keys [close-fn]}]
     (let [links-children
           (let [links (if (fn? links) (links) links)
                 links (remove nil? links)]
             (for [{icon' :icon :keys [options title key hr hover-detail item _as-link?]} links]
               (let [new-options
                     (merge options
                            (cond->
                             {:title    hover-detail
                              :on-click (fn [e]
                                          (when-not (false? (when-let [on-click-fn (:on-click options)]
                                                              (on-click-fn e)))
                                            (close-fn)))}
                              key
                              (assoc :key key)))
                     child (if hr
                             nil
                             (or item
                                 [:div.flex.items-center
                                  (when icon' icon')
                                  [:div.title-wrap {:style {:margin-right "8px"
                                                            :margin-left  "4px"}} title]]))]
                 (if hr
                   [:hr.menu-separator {:key (or key "dropdown-hr")}]
                   (rum/with-key
                     (menu-link new-options child)
                     title)))))

           wrapper-children
           [:.menu-links-wrapper
            (when links-header links-header)
            links-children
            (when links-footer links-footer)]]

       (if (or outer-header outer-footer)
         [:.menu-links-outer
          outer-header wrapper-children outer-footer]
         wrapper-children)))
   opts))

(declare button)
(rum/defc notification-content
  [state content status uid]
  (when (and content status)
    (let [svg
          (if (keyword? status)
            (case status
              :success
              (icon "circle-check" {:class "text-success" :size "20"})

              :warning
              (icon "alert-circle" {:class "text-warning" :size "20"})

              :error
              (icon "circle-x" {:class "text-error" :size "20"})

              (icon "info-circle" {:class "text-indigo-500" :size "20"}))
            status)]
      [:div.ui__notifications-content
       {:class (str "notification-" (name (or status :info)))
        :style
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
                                            :overflow-y "auto"
                                            :overflow-x "hidden"}}
         [:div.p-4
          [:div.flex.items-start
           [:div.flex-shrink-0.pt-2
            svg]
           [:div.ml-3.w-0.flex-1.pt-2

            [:div.text-sm.leading-5.font-medium.whitespace-pre-line {:style {:margin 0}}
             content]]
           [:div.flex-shrink-0.flex {:style {:margin-top -9
                                             :margin-right -18}}
            (button
             {:button-props {"aria-label" "Close"}
              :variant :ghost
              :class "hover:bg-transparent hover:text-foreground scale-90"
              :on-click (fn []
                          (notification/clear! uid))
              :icon "x"})]]]]]])))

(declare button)

(rum/defc notification-clear-all
  []
  [:div.ui__notifications-content
   [:div.pointer-events-auto.notification-clear
    (button (t :notification/clear-all)
            :intent "logseq"
            :on-click (fn []
                        (notification/clear-all!)))]])

(rum/defc notification < rum/reactive
  []
  (let [contents (state/sub :notification/contents)]
    (transition-group
     {:class-name "notifications ui__notifications"}
     (let [notifications (map (fn [el]
                                (let [k (first el)
                                      v (second el)]
                                  (css-transition
                                   {:timeout 100
                                    :key     (name k)}
                                   (fn [state]
                                     (notification-content state (:content v) (:status v) k)))))
                              contents)
           clear-all (when (> (count contents) 1)
                       (css-transition
                        {:timeout 100
                         :k       "clear-all"}
                        (fn [_state]
                          (notification-clear-all))))
           items (if clear-all (cons clear-all notifications) notifications)]
       (doall items)))))

(rum/defc humanity-time-ago
  [input opts]
  (let [time-fn (fn []
                  (try
                    (util/human-time input)
                    (catch :default e
                      (js/console.error e)
                      input)))
        [time set-time] (rum/use-state (time-fn))]

    (hooks/use-effect!
     (fn []
       (let [timer (js/setInterval
                    #(set-time (time-fn)) (* 1000 30))]
         #(js/clearInterval timer)))
     [])

    [:span.ui__humanity-time (merge {} opts) time]))

(defn checkbox
  [option]
  (let [on-change' (:on-change option)
        on-click' (:on-click option)
        option (cond-> (dissoc option :on-change :on-click)
                 (or on-change' on-click')
                 (assoc :on-click
                        (fn [^js e]
                          (some-> on-click' (apply [e]))
                          (let [checked? (= (.-state (.-dataset (.-target e))) "checked")]
                            (set! (. (.-target e) -checked) (not checked?))
                            (some-> on-change' (apply [e]))))))]
    (shui/checkbox
     (merge option
            {:disabled (or (:disabled option) config/publishing?)}))))

(defn main-node
  []
  (util/app-scroll-container-node))

(defn focus-element
  [element]
  (when-let [element ^js (gdom/getElement element)]
    (.focus element)))

(defn get-dynamic-style-node
  []
  (js/document.getElementById "dynamic-style-scope"))

(defn inject-document-devices-envs!
  []
  (let [^js cl (.-classList js/document.documentElement)]
    (when config/publishing? (.add cl "is-publish-mode"))
    (when util/mac? (.add cl "is-mac"))
    (when util/win32? (.add cl "is-win32"))
    (when util/linux? (.add cl "is-linux"))
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
      (doseq [[event function]
              [["persist-zoom-level" #(storage/set :zoom-level %)]
               ["restore-zoom-level" #(when-let [zoom-level (storage/get :zoom-level)] (js/window.apis.setZoomLevel zoom-level))]
               ["full-screen" #(do (js-invoke cl (if (= % "enter") "add" "remove") "is-fullscreen")
                                   (state/set-state! :electron/window-fullscreen? (= % "enter")))]
               ["maximize" #(state/set-state! :electron/window-maximized? %)]]]
        (.on js/window.apis event function))

      (p/then (ipc/ipc :getAppBaseInfo) #(let [{:keys [isFullScreen isMaximized]} (js->clj % :keywordize-keys true)]
                                           (when isFullScreen
                                             (.add cl "is-fullscreen")
                                             (state/set-state! :electron/window-fullscreen? true))
                                           (when isMaximized (state/set-state! :electron/window-maximized? true)))))))

(defn inject-dynamic-style-node!
  []
  (let [style (get-dynamic-style-node)]
    (if (nil? style)
      (let [node (js/document.createElement "style")]
        (set! (.-id node) "dynamic-style-scope")
        (.appendChild js/document.head node))
      style)))

(defn apply-custom-theme-effect! [theme]
  (when config/lsp-enabled?
    (when-let [custom-theme (state/sub [:ui/custom-theme (keyword theme)])]
      ;; If the name is nil, the user has not set a custom theme (initially {:mode light/dark}).
      ;; The url is not used because the default theme does not have an url.
      (if (some? (:name custom-theme))
        (js/LSPluginCore.selectTheme (bean/->js custom-theme)
                                     (bean/->js {:emit false}))
        (state/set-state! :plugin/selected-theme (:url custom-theme))))))

(defn setup-system-theme-effect!
  []
  (let [^js schemaMedia (js/window.matchMedia "(prefers-color-scheme: dark)")]
    (try (.addEventListener schemaMedia "change" state/sync-system-theme!)
         (catch :default _error
           (.addListener schemaMedia state/sync-system-theme!)))
    (state/sync-system-theme!)
    #(try (.removeEventListener schemaMedia "change" state/sync-system-theme!)
          (catch :default _error
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

(defn setup-viewport-listeners! []
  (when-let [^js vw (gobj/get js/window "visualViewport")]
    (let [handler #(state/set-state! :ui/viewport {:width (.-width vw) :height (.-height vw) :scale (.-scale vw)})]
      (.addEventListener js/window.visualViewport "resize" handler)
      (handler)
      #(.removeEventListener js/window.visualViewport "resize" handler))))

(rum/defcs auto-complete <
  (rum/local 0 ::current-idx)
  (shortcut/mixin* :shortcut.handler/auto-complete)
  [state
   matched
   {:keys [on-chosen
           on-shift-chosen
           get-group-name
           empty-placeholder
           item-render
           class
           header
           grouped?]}]
  (let [*current-idx (get state ::current-idx)
        *groups (atom #{})
        render-f (fn [matched]
                   (for [[idx item] matched]
                     (let [react-key (str idx)
                           item-cp
                           [:div.menu-link-wrap
                            {:key react-key
                             ;; mouse-move event to indicate that cursor moved by user
                             :on-mouse-move  #(reset! *current-idx idx)}
                            (let [chosen? (= @*current-idx idx)]
                              (menu-link
                               {:id (str "ac-" react-key)
                                :tab-index "0"
                                :class (when chosen? "chosen")
                                ;; TODO: should have more tests on touch devices
                                        ;:on-pointer-down #(util/stop %)
                                :on-click (fn [e]
                                            (util/stop e)
                                            (when-not (:disabled? item)
                                              (if (and (gobj/get e "shiftKey") on-shift-chosen)
                                                (on-shift-chosen item)
                                                (on-chosen item e))))}
                               (if item-render (item-render item chosen?) item)))]]

                       (let [group-name (and (fn? get-group-name) (get-group-name item))]
                         (if (and group-name (not (contains? @*groups group-name)))
                           (do
                             (swap! *groups conj group-name)
                             [:div
                              [:div.ui__ac-group-name group-name]
                              item-cp])
                           item-cp)))))]
    [:div#ui__ac {:class class}
     (if (seq matched)
       [:div#ui__ac-inner.hide-scrollbar
        (when header header)
        (if grouped?
          (let [*idx (atom -1)
                inc-idx #(swap! *idx inc)]
            (for [[group matched] (group-by :group matched)]
              (let [matched' (doall (map (fn [item] [(inc-idx) item]) matched))]
                (if group
                  [:div
                   [:div.ui__ac-group-name group]
                   (render-f matched')]
                  (render-f matched')))))
          (render-f (medley/indexed matched)))]
       (when empty-placeholder
         empty-placeholder))]))

(defn toggle
  ([on? on-click] (toggle on? on-click false))
  ([on? on-click small?]
   [:a.ui__toggle {:on-click on-click
                   :class (if small? "is-small" "")
                   :tab-index "0"
                   :on-key-down (fn [e] (when (and e (= (.-key e) "Enter"))
                                          (util/stop e)
                                          (on-click e)))}
    [:span.wrapper.transition-colors.ease-in-out.duration-200
     {:aria-checked (if on? "true" "false"), :tab-index "0", :role "checkbox"
      :class        (if on? "ui__toggle-background-on" "ui__toggle-background-off")}
     [:span.switcher.transform.transition.ease-in-out.duration-200
      {:class       (if on? (if small? "translate-x-4" "translate-x-5") "translate-x-0")
       :aria-hidden "true"}]]]))

(defn keyboard-shortcut-from-config [shortcut-name & {:keys [pick-first?]}]
  (let [built-in-binding (:binding (get shortcut-config/all-built-in-keyboard-shortcuts shortcut-name))
        custom-binding  (when (state/custom-shortcuts) (get (state/custom-shortcuts) shortcut-name))
        binding         (or custom-binding built-in-binding)]
    (if (and pick-first? (coll? binding))
      (first binding)
      (shortcut-utils/decorate-binding binding))))

(defn loading
  ([] (loading (t :loading)))
  ([content] (loading content nil))
  ([content opts]
   [:div.flex.flex-row.items-center.inline.icon-loading
    [:span.icon.flex.items-center (svg/loader-fn opts)
     (when-not (string/blank? content)
       [:span.text.pl-2 content])]]))

(rum/defc rotating-arrow
  [collapsed?]
  [:span
   {:class (if collapsed? "rotating-arrow collapsed" "rotating-arrow not-collapsed")}
   (svg/caret-right)])

(rum/defcs foldable-title <
  (rum/local false ::control?)
  [state {:keys [on-pointer-down header title-trigger? collapsed?]}]
  (let [control? (get state ::control?)]
    [:div.ls-foldable-title.content
     [:div.flex-1.flex-row.foldable-title (cond->
                                           {:on-mouse-over #(reset! control? true)
                                            :on-mouse-out  #(reset! control? false)}
                                            title-trigger?
                                            (assoc :on-pointer-down on-pointer-down
                                                   :class "cursor"))
      [:div.flex.flex-row.items-center.ls-foldable-header.gap-1
       {:on-click (fn [^js e]
                    (let [^js target (.-target e)]
                      (when (some-> target (.closest ".as-toggle"))
                        (reset! collapsed? (not @collapsed?)))))}
       (when-not (mobile-util/native-platform?)
         (let [style {:width 14 :height 16}]
           [:a.ls-foldable-title-control.block-control.opacity-50.hover:opacity-100
            (cond->
             {:style style}
              (not title-trigger?)
              (assoc :on-pointer-down on-pointer-down))
            [:span {:class (if (or @control? @collapsed?) "control-show cursor-pointer" "control-hide")}
             (rotating-arrow @collapsed?)]]))
       (if (fn? header)
         (header @collapsed?)
         header)]]]))

(rum/defcs foldable < db-mixins/query rum/reactive
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
  [state header content {:keys [title-trigger? on-pointer-down class
                                _default-collapsed? _init-collapsed]}]
  (let [collapsed? (get state ::collapsed?)
        on-pointer-down (fn [e]
                          (util/stop e)
                          (swap! collapsed? not)
                          (when on-pointer-down
                            (on-pointer-down @collapsed?)))]
    [:div.flex.flex-col
     {:class class}
     (foldable-title {:on-pointer-down on-pointer-down
                      :header header
                      :title-trigger? title-trigger?
                      :collapsed? collapsed?})
     ;; Don't stop propagation for the pointer down event to the high level content container.
     ;; That may cause the drag function to not work.
     [:div {:class (if @collapsed? "hidden" "initial")}
      (if (fn? content)
        (if (not @collapsed?) (content) nil)
        content)]]))

(rum/defc admonition
  [type content]
  (let [type (name type)]
    (when-let [icon' (case (string/lower-case type)
                       "note" svg/note
                       "tip" svg/tip
                       "important" svg/important
                       "caution" svg/caution
                       "warning" svg/warning
                       "pinned" svg/pinned
                       nil)]
      [:div.flex.flex-row.admonitionblock.align-items {:class type}
       [:div.pr-4.admonition-icon.flex.flex-col.justify-center
        {:title (string/capitalize type)} (icon')]
       [:div.ml-4.text-lg
        content]])))

(rum/defcs catch-error
  < {:did-catch
     (fn [state error _info]
       (log/error :exception error)
       (assoc state ::error error))}
  [{error ::error, c :rum/react-component} error-view view]
  (if (some? error)
    (if (fn? error-view) (error-view error) error-view)
    view))

(rum/defcs catch-error-and-notify
  < {:did-catch
     (fn [state error _info]
       (log/error :exception error)
       (notification/show!
        [:div.flex.flex-col.gap-2
         [:div (str "Error caught by UI!\n " error)]
         (str (.-stack error))] `:error)
       (assoc state ::error error))}
  [{error ::error, c :rum/react-component} error-view view]
  (if (some? error)
    error-view
    view))

(rum/defc block-error
  "Well styled error message for blocks"
  [title {:keys [content section-attrs]}]
  [:section.border.mt-1.p-1.cursor-pointer.block-content-fallback-ui.w-full
   section-attrs
   [:div.flex.justify-between.items-center.px-1
    [:h5.text-error.pb-1 title]
    [:a.text-xs.opacity-50.hover:opacity-80
     {:href "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"
      :target "_blank"} "report issue"]]
   (when content [:pre.m-0.text-sm (str content)])])

(def component-error
  "Well styled error message for higher level components. Currently same as
  block-error but this could change"
  block-error)

(rum/defc select
  ([options on-change]
   (select options on-change {}))
  ([options on-change select-options]
   [:select.pl-6.block.text-base.leading-6.border-gray-300.focus:outline-none.focus:shadow-outline-blue.focus:border-blue-300.sm:text-sm.sm:leading-5
    (merge
     {:class     "form-select"
      :on-change (fn [e]
                   (let [value (util/evalue e)]
                     (on-change e value)))}
     select-options)
    (for [{:keys [label value selected disabled]
           :or {selected false disabled false}} options]
      [:option (cond->
                {:key   label
                 :value (or value label)} ;; NOTE: value might be an empty string, `or` is safe here
                 disabled
                 (assoc :disabled disabled)
                 selected
                 (assoc :selected selected))
       label])]))

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

(rum/defcs slider < rum/reactive
  {:init (fn [state]
           (assoc state ::value (atom (first (:rum/args state)))))}
  [state _default-value {max' :max :keys [min on-change]}]
  (let [*value (::value state)
        value (rum/react *value)
        value' (int value)]
    (assert (int? value'))
    [:input.cursor-pointer
     {:type      "range"
      :value     value'
      :min       min
      :max       max'
      :style     {:width "100%"}
      :on-change #(let [value (util/evalue %)]
                    (reset! *value value))
      :on-pointer-up #(let [value (util/evalue %)]
                        (on-change value))}]))

(rum/defcs tweet-embed < rum/reactive
  (rum/local true :loading?)
  [state id]
  (let [*loading? (:loading? state)]
    [:div
     (when @*loading? [:span.flex.items-center [svg/loading " loading"]])
     (ReactTweetEmbed
      {:id                    id
       :class                 "contents"
       :options               {:theme (when (= (state/sub :ui/theme) "dark") "dark")}
       :on-tweet-load-success #(reset! *loading? false)})]))

(def icon shui.icon.v2/root)

(rum/defc button-inner
  [text & {icon' :icon :keys [theme background variant href size class intent small? icon-props disabled? button-props]
           :or   {small? false}
           :as   opts}]
  (let [button-props (merge
                      (dissoc opts
                              :theme :background :href :variant :class :intent :small? :icon :icon-props :disabled? :button-props)
                      button-props)
        props (merge {:variant (cond
                                 (= theme :gray) :ghost
                                 (= background "gray") :secondary
                                 (= background "red") :destructive
                                 (= intent "link") :ghost
                                 :else (or variant :default))
                      :href    href
                      :size    (if small? :xs (or size :sm))
                      :icon    icon'
                      :class   (if (and (string? background)
                                        (not (contains? #{"gray" "red"} background)))
                                 (str class " primary-" background) class)
                      :muted   disabled?}
                     button-props)

        icon'' (when icon' (shui/tabler-icon icon' icon-props))
        href? (not (string/blank? href))
        text (cond
               href? [:a {:href href :target "_blank"
                          :style {:color "inherit"}} text]
               :else text)
        children [icon'' text]]

    (shui/button props children)))

(defn button
  [text & {:keys []
           :as   opts}]
  (if (map? text)
    (button-inner nil text)
    (button-inner text opts)))

(rum/defc point
  ([] (point "bg-red-600" 5 nil))
  ([klass size {:keys [class style] :as opts}]
   [:span.ui__point.overflow-hidden.rounded-full.inline-block
    (merge {:class (str (util/hiccup->class klass) " " class)
            :style (merge {:width size :height size} style)}
           (dissoc opts :style :class))]))

(rum/defc with-shortcut < rum/reactive
  < {:key-fn (fn [key pos] (str "shortcut-" key pos))}
  [shortcut-key _position content]
  (let [shortcut-tooltip? (state/sub :ui/shortcut-tooltip?)
        enabled-tooltip? (state/enable-tooltip?)]
    (if (and enabled-tooltip? shortcut-tooltip?)
      (tooltip content
               [:div.text-sm.font-medium (keyboard-shortcut-from-config shortcut-key)]
               {:trigger-props {:as-child true}})
      content)))

(rum/defc progress-bar
  [width]
  {:pre (integer? width)}
  [:div.w-full.rounded-full.h-2.5.animate-pulse.bg-gray-06-alpha
   [:div.bg-gray-09-alpha.h-2.5.rounded-full {:style {:width (str width "%")}
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
  [height]
  [:div {:style {:height height}}])

(rum/defc lazy-visible-inner
  [visible? content-fn ref fade-in? placeholder]
  (let [[set-ref rect] (r/use-bounding-client-rect)
        placeholder-height (or (when rect (.-height rect)) 24)]
    [:div.lazy-visibility {:ref ref}
     [:div {:ref set-ref}
      (if visible?
        (when (fn? content-fn)
          (if fade-in?
            [:div.fade-enter
             {:ref #(when-let [^js cls (and % (.-classList %))]
                      (.add cls "fade-enter-active"))}
             (content-fn)]
            (content-fn)))
        (or placeholder (lazy-loading-placeholder placeholder-height)))]]))

(rum/defc lazy-visible
  ([content-fn]
   (lazy-visible content-fn nil))
  ([content-fn {:keys [initial-state trigger-once? fade-in? root-margin placeholder _debug-id]
                :or {initial-state false
                     trigger-once? true
                     fade-in? true
                     root-margin 100}}]
   (let [[visible? set-visible!] (rum/use-state initial-state)
         inViewState (useInView #js {:initialInView initial-state
                                     :rootMargin (str root-margin "px")
                                     :triggerOnce trigger-once?
                                     :onChange (fn [in-view? _entry]
                                                 (set-visible! in-view?))})
         ref (.-ref inViewState)]
     (lazy-visible-inner visible? content-fn ref fade-in? placeholder))))

(rum/defc menu-heading
  ([add-heading-fn auto-heading-fn rm-heading-fn]
   (menu-heading nil add-heading-fn auto-heading-fn rm-heading-fn))
  ([heading add-heading-fn auto-heading-fn rm-heading-fn]
   [:div.flex.flex-row.justify-between.pb-2.pt-1.px-2.items-center
    [:div.flex.flex-row.justify-between.flex-1.px-1
     (for [i (range 1 7)]
       (rum/with-key (button
                      ""
                      :disabled? (and (some? heading) (= heading i))
                      :icon (str "h-" i)
                      :title (t :heading i)
                      :class "to-heading-button"
                      :on-click #(add-heading-fn i)
                      :intent "link"
                      :small? true)
         (str "key-h-" i)))
     (button
      ""
      :icon "h-auto"
      :disabled? (and (some? heading) (true? heading))
      :icon-props {:extension? true}
      :class "to-heading-button"
      :title (t :auto-heading)
      :on-click auto-heading-fn
      :intent "link"
      :small? true)
     (button
      ""
      :icon "heading-off"
      :disabled? (and (some? heading) (not heading))
      :icon-props {:extension? true}
      :class "to-heading-button"
      :title (t :remove-heading)
      :on-click rm-heading-fn
      :intent "link"
      :small? true)]]))

(rum/defc tooltip
  [trigger tooltip-content & {:keys [portal? root-props trigger-props content-props]}]
  (shui/tooltip-provider
   (shui/tooltip root-props
                 (shui/tooltip-trigger (merge {:as-child true} trigger-props) trigger)
                 (if (not (false? portal?))
                   (shui/tooltip-portal
                    (shui/tooltip-content content-props tooltip-content))
                   (shui/tooltip-content content-props tooltip-content)))))

(rum/defc DelDateButton
  [on-delete]
  (shui/button {:variant :outline :size :sm :class "del-date-btn" :on-click on-delete}
               (shui/tabler-icon "trash" {:size 15})))

(defonce month-values
  [:January :February :March :April :May
   :June :July :August :September :October
   :November :December])

(defn get-month-label
  [n]
  (some->> n (nth month-values)
           (name)))

(rum/defc date-year-month-select
  [{:keys [name value onChange _children]}]
  [:div.months-years-nav
   (if (= name "years")
     (shui/input
      {:on-change (fn [v] (when v (onChange v)))
       :class "h-6 ml-2 !w-auto !px-2"
       :value value
       :type "number"
       :min 1
       :max 9999})

     (shui/dropdown-menu
      (shui/dropdown-menu-trigger
       {:as-child true}
       (shui/button {:variant :ghost
                     :class "!px-2 !py-0 h-6 border border-input rounded-md"
                     :size :sm}
                    (get-month-label value)))
      (shui/dropdown-menu-content
       (for [[idx month] (medley/indexed month-values)
             :let [label (clojure.core/name month)]]
         (shui/dropdown-menu-checkbox-item
          {:checked (= value idx)
           :on-select (fn []
                        (let [^js e (js/Event. "change")]
                          (js/Object.defineProperty e "target"
                                                    #js {:value #js {:value idx} :enumerable true})
                          (onChange e)))}
          label)))))])

(defn single-calendar
  [{:keys [del-btn? on-delete on-select on-day-click] :as opts}]
  (shui/calendar
   (merge
    {:mode "single"
     :caption-layout "dropdown-buttons"
     :fromYear 1000
     :toYear 3000
     :components (cond-> {:Dropdown #(date-year-month-select (bean/bean %))}
                   del-btn? (assoc :Head #(DelDateButton on-delete)))
     :class-names {:months "" :root (when del-btn? "has-del-btn")}
     :on-day-key-down (fn [^js d _ ^js e]
                        (when (= "Enter" (.-key e))
                          (let [on-select' (or on-select on-day-click)]
                            (on-select' d))))}
    opts)))

(defn- get-current-hh-mm
  []
  (let [current-time-s (first (.split (.toTimeString (js/Date.)) " "))]
    (subs current-time-s 0 (- (count current-time-s) 3))))

(rum/defc time-picker
  [{:keys [on-change default-value]}]
  [:div.flex.flex-row.items-center.gap-2.mx-3.mb-3
   (shui/input
    {:id "time-picker"
     :type "time"
     :class "!py-0 !w-max !h-8"
     :default-value (or default-value "00:00")
     :on-blur (fn [e]
                (on-change (util/evalue e)))})
   (shui/button
    {:variant :ghost
     :size :sm
     :class "text-muted-foreground"
     :on-click (fn []
                 (let [value (get-current-hh-mm)]
                   (set! (.-value (gdom/getElement "time-picker")) value)
                   (on-change value)))}
    "Use current time")])

(rum/defc nlp-calendar
  [{:keys [selected on-select on-day-click] :as opts}]
  (let [default-on-select (or on-select on-day-click)
        on-select' (if (:datetime? opts)
                     (fn [date value]
                       (let [value (or (and (string? value) value)
                                       (.-value (gdom/getElement "time-picker")))]
                         (let [[h m] (string/split value ":")]
                           (when (and date selected)
                             (.setHours date h m 0))
                           (default-on-select date))))
                     default-on-select)]
    [:div.flex.flex-col.gap-2.relative
     (single-calendar (assoc opts :on-select on-select'))
     (when (:datetime? opts)
       (time-picker (cond->
                     {:on-change (fn [value] (on-select' selected value))}
                      selected
                      (assoc :default-value (str (util/zero-pad (.getHours selected))
                                                 ":"
                                                 (util/zero-pad (.getMinutes selected)))))))

     (shui/input
      {:type "text"
       :placeholder "e.g. Next week"
       :class "mx-3 mb-3"
       :style {:width "initial"
               :tab-index -1}
       :auto-complete (if (util/chrome?) "chrome-off" "off")
       :on-mouse-down util/stop-propagation
       :on-key-down (fn [e]
                      (when (= "Enter" (util/ekey e))
                        (let [value (util/evalue e)]
                          (when-not (string/blank? value)
                            (let [result (date/nld-parse value)]
                              (if-let [date (and result (doto (goog.date.DateTime.) (.setTime (.getTime result))))]
                                (let [on-select' (or (:on-select opts) (:on-day-click opts))]
                                  (on-select' date))
                                (notification/show! (str (pr-str value) " is not a valid date. Please try again") :warning)))))))})]))

(comment
  (rum/defc skeleton
    []
    [:div.space-y-2
     (shui/skeleton {:class "h-8 w-1/3 mb-8"})
     (shui/skeleton {:class "h-6 w-full"})
     (shui/skeleton {:class "h-6 w-full"})]))

(rum/defc indicator-progress-pie
  [percentage]
  (let [*el (rum/use-ref nil)]
    (hooks/use-effect!
     #(when-let [^js el (rum/deref *el)]
        (set! (.. el -style -backgroundImage)
              (util/format "conic-gradient(var(--ls-pie-fg-color) %s%, var(--ls-pie-bg-color) %s%)" percentage percentage)))
     [percentage])
    [:span.cp__file-sync-indicator-progress-pie {:ref *el}]))

(comment
  (rum/defc emoji-picker
    [opts]
    (EmojiPicker. (assoc opts :data emoji-data))))
