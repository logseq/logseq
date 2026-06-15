(ns frontend.ui
  "Main ns for reusable components"
  (:require ["@emoji-mart/data" :as emoji-data]
            ["emoji-mart" :as emoji-mart]
            ["react-intersection-observer" :as react-intersection-observer]
            ["react" :as react]
            ["@sentry/react" :refer [ErrorBoundary]]
            ["react-textarea-autosize" :as TextareaAutosize]
            ["react-transition-group" :refer [CSSTransition]]
            ["react-virtuoso" :refer [Virtuoso VirtuosoGrid]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.date :as date]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.data-helper :as shortcut-dh]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [io.factorhouse.hsx.core :as hsx]
            [lambdaisland.glogi :as log]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.icon.v2 :as shui.icon.v2]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]))

(declare icon)
(declare tooltip)

(defn- normalize-react-props
  [opts]
  (bean/->js
   (cond-> (or opts {})
     (:class-name opts)
     (assoc :className (:class-name opts))

     true
     (dissoc :class-name))))

(defn- react-child
  [child]
  (cond
    (vector? child) (hsx/create-element child)
    :else child))

(defn- react-children
  [children]
  (->> children
       (mapcat (fn [child]
                 (cond
                   (nil? child) []
                   (and (sequential? child) (not (vector? child))) child
                   :else [child])))
       (remove nil?)
       (map react-child)))

(defn- react-element
  [component opts children]
  (apply react/createElement component (normalize-react-props opts) (react-children children)))

(defn css-transition [opts & children]
  (let [node-ref (or (:node-ref opts) (react/createRef))
        opts (assoc opts :nodeRef node-ref)
        children (map (fn [child]
                        (if (fn? child)
                          (fn [state]
                            (child state node-ref))
                          child))
                      children)]
    (react-element CSSTransition opts children)))

(defonce textarea-autosize (gobj/get TextareaAutosize "default"))

(hsx/defc textarea [opts & children]
  (into [:> textarea-autosize opts] children))

(hsx/defc virtualized-list [opts & children]
  (into [:> Virtuoso opts] children))

(hsx/defc virtualized-grid [opts & children]
  (into [:> VirtuosoGrid opts] children))

(hsx/defc error-boundary [opts & children]
  (into [:> ErrorBoundary opts] children))

(def useInView (gobj/get react-intersection-observer "useInView"))
(defonce _emoji-init-data ((gobj/get emoji-mart "init") #js {:data emoji-data}))

(defonce icon-size (if (mobile-util/native-platform?) 24 20))

(defn popup-exists? []
  (boolean (seq (shui-popup/get-popups))))

(defn dropdown-exists?
  []
  (some? (js/document.querySelector ".ui__popover-content, .ui__dropdown-menu-content, .ui__context-menu-content")))

(defn last-shui-preview-popup?
  []
  (= "ls-preview-popup"
     (some-> (shui-popup/get-last-popup) :content-props :class)))
(defn hide-popups-until-preview-popup!
  []
  (if (util/mobile?)
    (shui/popup-hide!)
    (while (and (popup-exists?)
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

(hsx/defc menu-background-color
  ([add-bgcolor-fn rm-bgcolor-fn]
   (menu-background-color ::unknown add-bgcolor-fn rm-bgcolor-fn))
  ([current-color add-bgcolor-fn rm-bgcolor-fn]
   (let [known-color? (not= current-color ::unknown)
         active-ring "0 0 0 2px var(--lx-gray-12, var(--ls-primary-text-color))"]
     [:div.flex.flex-row.justify-between.py-1.px-2.items-center
      [:div.flex.flex-row.justify-between.flex-1.mx-2.mt-2
       (for [color built-in-colors]
         [:a
          {:key (str "key-" color)
           :class "inline-flex items-center justify-center w-[30px] h-[30px]"
           :title (t (keyword "color" color))
           :on-click #(add-bgcolor-fn color)}
          [:div.heading-bg {:style {:background-color (str "var(--color-" color "-500)")
                                    :box-shadow (when (and known-color? (= current-color color))
                                                  active-ring)}}]])
       [:a
        {:title (t :ui/remove-background)
         :class "inline-flex items-center justify-center w-[30px] h-[30px]"
         :on-click rm-bgcolor-fn}
        [:div.heading-bg.remove {:style {:box-shadow (when (and known-color? (nil? current-color))
                                                       active-ring)}} "-"]]]])))

(hsx/defc ls-textarea
  [{:keys [on-change] :as props}]
  (let [*el (hooks/use-ref nil)
        skip-composition? (rfx/use-sub [:editor/action])
        on-composition (fn [e]
                         (if skip-composition?
                           (on-change e)
                           (case e.type
                             "compositionend" (do
                                                (state/set-editor-in-composition! false)
                                                (on-change e))
                             (state/set-editor-in-composition! true))))
        props (assoc props
                     :ref *el
                     "data-testid" "block editor"
                     :on-change (fn [e] (when-not (state/editor-in-composition?)
                                          (on-change e)))
                     :on-composition-start on-composition
                     :on-composition-update on-composition
                     :on-composition-end on-composition)]
    (hooks/use-effect!
     (fn []
       (let [^js el (hooks/deref *el)
             *mouse-point (volatile! nil)
             select-handler (fn []
                              (let [start (util/get-selection-start el)
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
             mouseup-handler (fn [e] (vreset! *mouse-point {:x (.-x e) :y (.-y e)}))]
         (when el
           (.addEventListener el "select" select-handler)
           (.addEventListener el "mouseup" mouseup-handler))
         #(do
            (when el
              (.removeEventListener el "select" select-handler)
              (.removeEventListener el "mouseup" mouseup-handler))
            (when-let [on-unmount (:on-unmount props)]
              (on-unmount)))))
     [])
    (textarea props)))

(hsx/defc dropdown-content-wrapper
  [dropdown-state close-fn content class style-opts node-ref]
  (let [class (or class
                  (util/hiccup->class "origin-top-right.absolute.right-0.mt-2"))
        k (hooks/use-memo #(inc (count (state/get-state :modal/dropdowns))) [])]
    (hooks/use-effect!
     (fn []
      (state/set-state! [:modal/dropdowns k] close-fn)
       #(state/update-state! :modal/dropdowns dissoc k))
     [])
    [:div.dropdown-wrapper.max-h-screen.overflow-y-auto
     {:style style-opts
      :ref node-ref
      :class (str class " "
                  (case dropdown-state
                    "entering" "transition ease-out duration-100 transform opacity-0 scale-95"
                    "entered" "transition ease-out duration-100 transform opacity-100 scale-100"
                    "exiting" "transition ease-in duration-75 transform opacity-100 scale-100"
                    "exited" "transition ease-in duration-75 transform opacity-0 scale-95"))}
     content]))

;; public exports
(hsx/defc dropdown
  [content-fn modal-content-fn
   & [{:keys [modal-class z-index trigger-class initial-open? *toggle-fn
              on-toggle]
       :or   {z-index 999}}]]
  (let [{:keys [open? open-atom close-fn open-fn toggle-fn]} (hooks/use-modal-state initial-open?)
        *root (hooks/use-ref nil)
        dropdown-state {:open? open-atom
                        :close-fn close-fn
                        :open-fn open-fn
                        :toggle-fn toggle-fn}
        _ (when (and (util/atom? *toggle-fn)
                     (nil? @*toggle-fn)
                     toggle-fn)
            (reset! *toggle-fn toggle-fn))
        modal-content (modal-content-fn dropdown-state)]
    (hooks/use-effect!
     (fn []
       (when (fn? on-toggle)
         (on-toggle open?)))
     [open?])
    (hooks/use-hide-on-esc-or-outside
     {:active? open?
      :root-ref *root
      :on-hide close-fn})
    [:div.relative.ui__dropdown-trigger {:class trigger-class
                                         :ref *root}
     (content-fn dropdown-state)
     (css-transition
      {:in open? :timeout 0}
      (fn [dropdown-state node-ref]
        (when open?
          (dropdown-content-wrapper dropdown-state close-fn modal-content modal-class {:z-index z-index} node-ref))))]))

;; `sequence` can be a list of symbols, a list of strings, or a string
;; If `shortcut-id` is provided, uses raw binding from shortcut system for data attribute matching
(defn render-keyboard-shortcut [sequence & {:keys [shortcut-id] :as opts}]
  (let [sequence (if (string? sequence)
                   (-> sequence ;; turn string into sequence
                       (string/trim)
                       (string/lower-case)
                       (string/split #" "))
                   sequence)
        ;; Get raw binding for data attribute matching
        raw-binding (if shortcut-id
                      (shortcut-dh/shortcut-binding shortcut-id)
                      (if (and (coll? sequence) (every? string? sequence))
                        sequence
                        (if (string? sequence)
                          [sequence]
                          sequence)))
        opts (merge {:aria-hidden? true
                     :raw-binding raw-binding} opts)]
    [:span.keyboard-shortcut
     (shui/shortcut sequence opts)]))

(def ^:private append-no-padding-class " no-padding")

(hsx/defc menu-link
  [{:keys [only-child? no-padding? class shortcut] :as options} child]
  (if only-child?
    [:div.menu-link
     (dissoc options :only-child?) child]
    [:a.flex.justify-between.menu-link
     (cond-> options
       (true? no-padding?)
       (assoc :class (str class append-no-padding-class))

       true
       (dissoc :no-padding?))

     [:span.flex-1 child]
     (when shortcut
       [:span.ml-1 (render-keyboard-shortcut shortcut)])]))

(defn checkbox
  [option]
  (let [on-change' (:on-change option)
        on-click' (:on-click option)
        option (cond-> (dissoc option :on-change :on-click)
                 (and on-click' (nil? on-change'))
                 (assoc :data-inputless true)

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
    (when-let [custom-theme (state/get-state [:ui/custom-theme (keyword theme)])]
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

(hsx/defc auto-complete
  [matched
   {:keys [on-chosen
           on-shift-chosen
           get-group-name
           empty-placeholder
           item-render
           class
           header
           grouped?]
    :as opts}]
  (let [*current-idx (hooks/use-memo #(atom 0) [])
        [current-idx] (hooks/use-atom *current-idx)
        shortcut-state {:matched matched
                        :opts opts
                        ::current-idx *current-idx}
        _ (shortcut/use-shortcut-handler! :shortcut.handler/auto-complete shortcut-state)
        *groups (atom #{})
        render-f (fn [matched]
                   (for [[idx item] matched]
                     (let [react-key (str idx)
                           choose! (fn [e]
                                     (util/stop e)
                                     (when-not (:disabled? item)
                                       (if (and (gobj/get e "shiftKey") on-shift-chosen)
                                         (on-shift-chosen item)
                                         (on-chosen item e))))
                           item-cp
                           [:div.menu-link-wrap
                            {:key react-key
                             ;; mouse-move event to indicate that cursor moved by user
                             :on-mouse-move  #(reset! *current-idx idx)
                             :on-click choose!}
                            (let [chosen? (= current-idx idx)]
                              (menu-link
                               {:id (str "ac-" react-key)
                                :tab-index "0"
                                :class (when chosen? "chosen")
                                :on-mouse-down util/stop
                                :on-click choose!}
                               (if item-render (item-render item chosen?) item)))]
                           group-name (and (fn? get-group-name) (get-group-name item))]
                       (if (and group-name (not (contains? @*groups group-name)))
                         (do
                           (swap! *groups conj group-name)
                           [:div
                            [:div.ui__ac-group-name group-name]
                            item-cp])
                         item-cp))))]
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
   (shui/switch
    (cond-> {:checked (boolean on?)
             :on-click on-click}
      small? (assoc :size "sm")))))

(defn keyboard-shortcut-from-config [shortcut-name & {:keys [pick-first?]}]
  (let [binding (shortcut-dh/shortcut-binding shortcut-name)]
    (cond
      (or (nil? binding) (false? binding)) nil
      (and pick-first? (coll? binding))    (first binding)
      :else (shortcut-utils/decorate-binding binding))))

(defn dropdown-shortcut
  "Renders a compact shui shortcut for use inside dropdown menu items.
   Accepts a shortcut config keyword (e.g. :editor/cut) or a raw binding
   string (e.g. \"shift+click\"). Returns nil for disabled/missing bindings."
  [shortcut-or-id]
  (let [binding (if (keyword? shortcut-or-id)
                  (let [b (shortcut-dh/shortcut-binding shortcut-or-id)]
                    (when (and b (not (false? b)))
                      (first b)))
                  shortcut-or-id)]
    (when binding
      [:span.ml-auto.pl-2
       (shui/shortcut binding {:glow? true})])))

(defn loading
  ([] (loading (t :ui/loading)))
  ([content] (loading content nil))
  ([content opts]
   [:div.flex.flex-row.items-center.inline.icon-loading
    [:span.icon.flex.items-center (svg/loader-fn opts)
     (when-not (string/blank? content)
       [:span.text.pl-2 content])]]))

(hsx/defc rotating-arrow
  [collapsed?]
  [:span
   {:class (if collapsed? "rotating-arrow collapsed" "rotating-arrow not-collapsed")}
   (svg/caret-right)])

(hsx/defc foldable-title
  [{:keys [on-pointer-down header title-trigger? collapsed?]}]
  (let [[control? set-control!] (hooks/use-state false)]
    [:div.ls-foldable-title.content
     [:div.flex-1.flex-row.foldable-title
      (cond-> {:on-mouse-over #(set-control! true)
               :on-mouse-out  #(set-control! false)}
        title-trigger?
        (assoc :on-pointer-down on-pointer-down
               :class "cursor"))
      [:div.flex.flex-row.items-center.ls-foldable-header.gap-1
       {:on-click (fn [^js e]
                    (let [^js target (.-target e)]
                      (when (some-> target (.closest ".as-toggle"))
                        (reset! collapsed? (not @collapsed?)))))}
       (let [style {:width 14 :height 16}]
         [:a.ls-foldable-title-control.block-control.opacity-50.hover:opacity-100
          (cond->
           {:style style}
            (not title-trigger?)
            (assoc :on-pointer-down on-pointer-down))
          [:span {:class (if (or control? @collapsed? (util/mobile?))
                           "control-show cursor-pointer"
                           "control-hide")}
           (rotating-arrow @collapsed?)]])
       (if (fn? header)
         (header @collapsed?)
         header)]]]))

(hsx/defc foldable
  [header content {:keys [title-trigger? on-pointer-down class
                          default-collapsed? init-collapsed]}]
  (let [collapsed? (hooks/use-memo #(atom (true? default-collapsed?)) [])
           render-content? (hooks/use-memo #(atom (not (true? default-collapsed?))) [])
           collapse-timeout (hooks/use-ref nil)
           [collapsed-value] (hooks/use-atom collapsed?)
           [render-content-value] (hooks/use-atom render-content?)
           transition-ms 200
           on-pointer-down (fn [e]
                             (util/stop e)
                             (let [next-collapsed? (not @collapsed?)]
                               (when-let [timeout-id (hooks/deref collapse-timeout)]
                                 (js/clearTimeout timeout-id)
                                 (hooks/set-ref! collapse-timeout nil))
                               (when (false? next-collapsed?)
                                 (reset! render-content? true))
                               (reset! collapsed? next-collapsed?)
                               (when (true? next-collapsed?)
                                 (hooks/set-ref!
                                  collapse-timeout
                                  (js/setTimeout
                                   (fn []
                                     (reset! render-content? false)
                                     (hooks/set-ref! collapse-timeout nil))
                                   transition-ms)))
                               (when on-pointer-down
                                 (on-pointer-down next-collapsed?))))]
       (hooks/use-effect!
        (fn []
          (when-let [f init-collapsed]
            (f collapsed?))
          #(when-let [timeout-id (hooks/deref collapse-timeout)]
             (js/clearTimeout timeout-id)))
        [])
       [:div.flex.flex-col
        {:class class}
        (foldable-title {:on-pointer-down on-pointer-down
                         :header header
                         :title-trigger? title-trigger?
                         :collapsed? collapsed?})
        ;; Don't stop propagation for the pointer down event to the high level content container.
        ;; That may cause the drag function to not work.
        [:div.ls-foldable-content
         {:class (when collapsed-value "is-collapsed")
          :aria-hidden (boolean collapsed-value)}
         [:div.ls-foldable-content-inner
          (if (fn? content)
            (when render-content-value (content))
            content)]]]))

(hsx/defc admonition
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

(hsx/defc catch-error
  [error-view view]
  (error-boundary
   {:fallback (fn [^js props]
                (let [error (.-error props)]
                  (if (fn? error-view) (error-view error) error-view)))
    :onError (fn [error _component-stack _event-id]
               (log/error :exception error))}
   view))

(hsx/defc catch-error-and-notify
  [error-view view]
  (error-boundary
   {:fallback (constantly error-view)
    :onError (fn [error _component-stack _event-id]
               (log/error :exception error)
               (notification/show!
                [:div.flex.flex-col.gap-2
                 [:div (t :ui/error-boundary-error (if (instance? js/Error error) (.-message error) (str error)))]
                 (when (instance? js/Error error) (str (.-stack error)))] :error))}
   view))

(hsx/defc block-error
  "Well styled error message for blocks"
  [title {:keys [content section-attrs]}]
  [:section.border.mt-1.p-1.cursor-pointer.block-content-fallback-ui.w-full
   section-attrs
   [:div.flex.justify-between.items-center.px-1
    [:h5.text-error.pb-1 title]
    [:a.text-xs.opacity-50.hover:opacity-80
     {:href "https://github.com/logseq/logseq/issues/new?labels=from:in-app&template=bug_report.yaml"
      :target "_blank"} (t :bug-report.issue/report-link)]]
   (when content [:pre.m-0.text-sm (str content)])])

(def component-error
  "Well styled error message for higher level components. Currently same as
  block-error but this could change"
  block-error)

(hsx/defc select
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

(hsx/defc radio-list
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

(hsx/defc checkbox-list
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

(hsx/defc tweet-embed
  [id]
  (let [theme (rfx/use-sub [:ui/theme])]
    [:iframe
     {:class "tweet-embed"
      :src (str "https://platform.twitter.com/embed/Tweet.html?id=" id
                (when (= theme "dark") "&theme=dark"))
      :style {:width "100%"
              :min-height 240
              :border 0}
      :loading "lazy"
      :allow "encrypted-media; picture-in-picture"
      :allow-full-screen true}]))

(def icon shui.icon.v2/root)

(hsx/defc button-inner
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
        children (cond-> []
                   icon'' (conj icon'')
                   text (conj text))]

    (apply shui/button props children)))

(defn button
  [text & {:keys []
           :as   opts}]
  (if (map? text)
    (button-inner nil text)
    (button-inner text opts)))

(hsx/defc point
  ([] (point "bg-red-600" 5 nil))
  ([klass size {:keys [class style] :as opts}]
   [:span.ui__point.overflow-hidden.rounded-full.inline-block
    (merge {:class (str (util/hiccup->class klass) " " class)
            :style (merge {:width size :height size} style)}
           (dissoc opts :style :class))]))

(hsx/defc with-shortcut
  [shortcut-key _position content & [title]]
  (let [shortcut-tooltip? (rfx/use-sub [:ui/shortcut-tooltip?])
        config            (state/config-for-repo (rfx/use-sub [:config])
                                                 (state/get-current-repo))
        enabled-tooltip?  (if (state/mobile?)
                            false
                            (get config :ui/enable-tooltip? true))
        binding           (when shortcut-key (shortcut-dh/shortcut-binding shortcut-key))
        first-binding     (when (and binding (not (false? binding))) (first binding))]
    (if (and enabled-tooltip? shortcut-tooltip?)
      (tooltip content
               (if title
                 [:div.flex.flex-col.items-start.gap-1
                  [:span.text-xs.opacity-80 title]
                  (when first-binding
                    (shui/shortcut first-binding {:glow? false}))]
                 (keyboard-shortcut-from-config shortcut-key))
               {:trigger-props {:as-child true}})
      content)))

(hsx/defc progress-bar
  [width]
  {:pre (integer? width)}
  [:div.w-full.rounded-full.h-2.5.animate-pulse.bg-gray-06-alpha
   [:div.bg-gray-09-alpha.h-2.5.rounded-full {:style {:width (str width "%")}
                                              :transition "width 1s"}]])

(hsx/defc progress-bar-with-label
  [width label-left label-right]
  {:pre (integer? width)}
  [:div
   [:div.flex.justify-between.mb-1
    [:span.text-base
     label-left]
    [:span.text-sm.font-medium
     label-right]]
   (progress-bar width)])

(hsx/defc lazy-loading-placeholder
  [height]
  [:div {:style {:height height}}])

(hsx/defc lazy-visible-inner
  [visible? content-fn ref fade-in? placeholder]
  (let [[set-ref rect] (hooks/use-bounding-client-rect)
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

(hsx/defc lazy-visible
  ([content-fn]
   (lazy-visible content-fn nil))
  ([content-fn {:keys [initial-state trigger-once? fade-in? root root-margin placeholder _debug-id]
                :or {initial-state false
                     trigger-once? true
                     fade-in? true
                     root nil
                     root-margin "100px 0px"}}]
   (let [[visible? set-visible!] (hooks/use-state initial-state)
         ^js inViewState (useInView #js {:initialInView initial-state
                                         :root root
                                         :rootMargin root-margin
                                         :triggerOnce trigger-once?
                                         :onChange (fn [in-view? _entry]
                                                     (set-visible! in-view?))})
         ref (.-ref inViewState)]
     (lazy-visible-inner visible? content-fn ref fade-in? placeholder))))

(hsx/defc menu-heading
  ([add-heading-fn auto-heading-fn rm-heading-fn]
   (menu-heading nil add-heading-fn auto-heading-fn rm-heading-fn))
  ([heading add-heading-fn auto-heading-fn rm-heading-fn]
   (let [font-icon-props {:font? true
                          :style {:align-items "center"
                                  :display "inline-flex"
                                  :font-size 18
                                  :height 18
                                  :justify-content "center"
                                  :line-height 1
                                  :width 18}}
         heading-button-style {:box-sizing "border-box"
                               :height 30
                               :padding 0
                               :width 30}]
     [:div.flex.flex-row.justify-between.pb-2.pt-1.px-2.items-center
      [:div.flex.flex-row.items-center.justify-between.flex-1.mx-2
       (for [i (range 1 7)]
         ^{:key (str "key-h-" i)}
         [button
          ""
          :icon (str "h-" i)
          :title (t :editor/heading i)
          :class (util/classnames ["to-heading-button" {:is-active (= heading i)}])
          :icon-props font-icon-props
          :on-click #(add-heading-fn i)
          :style heading-button-style
          :variant (when-not (= heading i) :ghost)
          :size :icon])
       (button
        ""
        :icon "h-auto"
        :class (util/classnames ["to-heading-button" {:is-active (true? heading)}])
        :title (t :editor/auto-heading)
        :icon-props {:extension? true}
        :on-click auto-heading-fn
        :style heading-button-style
        :variant (when-not (true? heading) :ghost)
        :size :icon)
       (button
        ""
        :icon "heading-off"
        :class "to-heading-button"
        :title (t :editor/remove-heading)
        :icon-props {:extension? true}
        :on-click rm-heading-fn
        :style heading-button-style
        :variant :ghost
        :size :icon)]])))

(hsx/defc tooltip
  [trigger tooltip-content & {:keys [portal? root-props trigger-props content-props]}]
  (shui/tooltip-provider
   (shui/tooltip (assoc root-props :key "tooltip")
                 (shui/tooltip-trigger (merge {:as-child true} trigger-props) trigger)
                 (if (not (false? portal?))
                   (shui/tooltip-portal
                    (shui/tooltip-content content-props tooltip-content))
                   (shui/tooltip-content content-props tooltip-content)))))

(hsx/defc DelDateButton
  [on-delete]
  (shui/button {:variant :outline :size :sm :class "del-date-btn" :on-click on-delete}
               (shui/tabler-icon "trash" {:size 15})))

(defonce month-values
  [:January :February :March :April :May
   :June :July :August :September :October
   :November :December])

(defn get-month-label
  [n]
  (when (number? n)
    (i18n/locale-format-date (js/Date. 2000 n 1) {:month "long"})))

(defn- day-picker-change-event
  [value]
  (let [^js e (js/Event. "change")]
    (js/Object.defineProperty e "target"
                              #js {:value #js {:value value}
                                   :enumerable true})
    e))

(hsx/defc date-year-month-select
  [{:keys [name className value onChange _children]}]
  (let [year? (or (= name "years")
                  (and (string? className)
                       (string/includes? className "year")))
        [year-value set-year-value!] (hooks/use-state (str value))]
    (hooks/use-effect!
     (fn []
       (set-year-value! (str value))
       nil)
     [value])
    [:div.months-years-nav {:class className}
     (if year?
       (shui/input
        {:on-change (fn [e]
                      (let [input-value (util/evalue e)]
                        (set-year-value! input-value)
                        (when (re-matches #"\d{4}" input-value)
                          (onChange (day-picker-change-event input-value)))))
         :on-focus (fn [e]
                     (some-> (.-target e) (.select)))
         :on-click (fn [e]
                     (some-> (.-target e) (.select)))
         :on-blur (fn [_]
                    (when-not (re-matches #"\d{4}" year-value)
                      (set-year-value! (str value))))
         :class "h-8 ml-2 !w-[5.75rem] !px-3 !py-0"
         :value year-value
         :type "number"
         :min 1
         :max 9999})

       (shui/dropdown-menu
                (shui/dropdown-menu-trigger
                 {:as-child true}
                 (shui/button {:variant :ghost
                               :class "!px-3 !py-0 h-8 !w-24 justify-start border border-input rounded-md"
                               :size :sm}
                              (get-month-label value)))
        (shui/dropdown-menu-content
         (for [[idx _month] (medley/indexed month-values)
               :let [label (get-month-label idx)]]
           (shui/dropdown-menu-checkbox-item
            {:checked (= value idx)
             :on-select (fn []
                          (onChange (day-picker-change-event idx)))}
            label)))))]))

(defn single-calendar
  [{:keys [del-btn? on-delete on-select on-day-click] :as opts}]
  (shui/calendar
   (merge
    {:mode "single"
     :weekStartsOn (mod (inc (state/get-start-of-week)) 7)
     :caption-layout "dropdown"
     :fromYear 1000
     :toYear 3000
     :formatters {:formatWeekdayName (fn [weekday _]
                                       (i18n/locale-format-date weekday {:weekday "short"}))}
     :components (cond-> {:Dropdown #(date-year-month-select (bean/bean %))}
                   del-btn? (assoc :Head #(DelDateButton on-delete)))
     :class-names {:root (when del-btn? "has-del-btn")}
     :on-day-key-down (fn [^js d _ ^js e]
                        (when (= "Enter" (.-key e))
                          (let [on-select' (or on-select on-day-click)]
                            (on-select' d))))}
    opts)))

(defn- get-current-hh-mm
  []
  (let [current-time-s (first (.split (.toTimeString (js/Date.)) " "))]
    (subs current-time-s 0 (- (count current-time-s) 3))))

(hsx/defc time-picker
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
    (t :ui/use-current-time))])

(hsx/defc nlp-calendar
  [{:keys [selected on-select on-day-click] :as opts}]
  (let [default-on-select (or on-select on-day-click)
        on-select' (if (:datetime? opts)
                     (fn [date value]
                       (let [value (or (and (string? value) value)
                                       (.-value (gdom/getElement "time-picker")))
                             [h m] (string/split value ":")]
                         (when (and date selected)
                           (.setHours date h m 0))
                         (default-on-select date)))
                     default-on-select)]
    [:div.ls-nlp-calendar
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
       :placeholder (t :ui/date-natural-language-placeholder)
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
                                (notification/show! (t :date/invalid-date-warning (pr-str value)) :warning)))))))})]))

(comment
  (hsx/defc skeleton
    []
    [:div.space-y-2
     (shui/skeleton {:class "h-8 w-1/3 mb-8"})
     (shui/skeleton {:class "h-6 w-full"})
     (shui/skeleton {:class "h-6 w-full"})]))

(hsx/defc indicator-progress-pie
  [percentage]
  (let [*el (hooks/use-ref nil)]
    (hooks/use-effect!
     #(when-let [^js el (hooks/deref *el)]
        (set! (.. el -style -backgroundImage)
              (util/format "conic-gradient(var(--ls-pie-fg-color) %s%, var(--ls-pie-bg-color) %s%)" percentage percentage)))
     [percentage])
    [:span.cp__rtc-sync-indicator-progress-pie {:ref *el}]))

(comment
  (hsx/defc emoji-picker
    [opts]
    (EmojiPicker. (assoc opts :data emoji-data))))
