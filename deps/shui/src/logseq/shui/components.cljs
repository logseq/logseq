(ns logseq.shui.components
  (:require
   ["@base-ui/react/alert-dialog" :refer [AlertDialog] :rename {AlertDialog AlertDialogPrimitive}]
   ["@base-ui/react/avatar" :refer [Avatar] :rename {Avatar AvatarPrimitive}]
   ["@base-ui/react/button" :refer [Button] :rename {Button ButtonPrimitive}]
   ["@base-ui/react/checkbox" :refer [Checkbox] :rename {Checkbox CheckboxPrimitive}]
   ["@base-ui/react/context-menu" :refer [ContextMenu] :rename {ContextMenu ContextMenuPrimitive}]
   ["@base-ui/react/dialog" :refer [Dialog] :rename {Dialog DialogPrimitive}]
   ["@base-ui/react/input" :refer [Input] :rename {Input InputPrimitive}]
   ["@base-ui/react/menu" :refer [Menu] :rename {Menu MenuPrimitive}]
   ["@base-ui/react/popover" :refer [Popover] :rename {Popover PopoverPrimitive}]
   ["@base-ui/react/radio" :refer [Radio] :rename {Radio RadioPrimitive}]
   ["@base-ui/react/radio-group" :refer [RadioGroup] :rename {RadioGroup RadioGroupPrimitive}]
   ["@base-ui/react/select" :refer [Select] :rename {Select SelectPrimitive}]
   ["@base-ui/react/separator" :refer [Separator] :rename {Separator SeparatorPrimitive}]
   ["@base-ui/react/slider" :refer [Slider] :rename {Slider SliderPrimitive}]
   ["@base-ui/react/switch" :refer [Switch] :rename {Switch SwitchPrimitive}]
   ["@base-ui/react/tabs" :refer [Tabs] :rename {Tabs TabsPrimitive}]
   ["@base-ui/react/toast" :refer [Toast] :rename {Toast ToastPrimitive}]
   ["@base-ui/react/toolbar" :refer [Toolbar] :rename {Toolbar ToolbarPrimitive}]
   ["@base-ui/react/toggle" :refer [Toggle] :rename {Toggle TogglePrimitive}]
   ["@base-ui/react/toggle-group" :refer [ToggleGroup] :rename {ToggleGroup ToggleGroupPrimitive}]
   ["@base-ui/react/tooltip" :refer [Tooltip] :rename {Tooltip TooltipPrimitive}]
   ["@hookform/resolvers/yup" :refer [yupResolver]]
   ["@tabler/icons-react" :refer [IconCheck IconChevronDown IconChevronLeft IconChevronRight IconChevronUp IconCircle IconX]]
   ["react" :as react]
   ["react-day-picker" :refer [DayPicker]]
   ["react-hook-form" :refer [Controller FormProvider useForm useFormContext]]
   ["yup" :as yup]
   [clojure.string :as string]
   [goog.object :as gobj]))

(defn- primitive-part
  [primitive k]
  (or (gobj/get primitive k)
      (throw (js/Error. (str "Missing Base UI primitive part: " k)))))

(def AlertDialogBackdropPart (primitive-part AlertDialogPrimitive "Backdrop"))
(def AlertDialogDescriptionPart (primitive-part AlertDialogPrimitive "Description"))
(def AlertDialogPopupPart (primitive-part AlertDialogPrimitive "Popup"))
(def AlertDialogPortalPart (primitive-part AlertDialogPrimitive "Portal"))
(def AlertDialogRootPart (primitive-part AlertDialogPrimitive "Root"))
(def AlertDialogTitlePart (primitive-part AlertDialogPrimitive "Title"))
(def AlertDialogTriggerPart (primitive-part AlertDialogPrimitive "Trigger"))
(def AvatarFallbackPart (primitive-part AvatarPrimitive "Fallback"))
(def AvatarImagePart (primitive-part AvatarPrimitive "Image"))
(def AvatarRootPart (primitive-part AvatarPrimitive "Root"))
(def CheckboxIndicatorPart (primitive-part CheckboxPrimitive "Indicator"))
(def CheckboxRootPart (primitive-part CheckboxPrimitive "Root"))
(def ContextMenuCheckboxItemPart (primitive-part ContextMenuPrimitive "CheckboxItem"))
(def ContextMenuGroupPart (primitive-part ContextMenuPrimitive "Group"))
(def ContextMenuGroupLabelPart (primitive-part ContextMenuPrimitive "GroupLabel"))
(def ContextMenuItemPart (primitive-part ContextMenuPrimitive "Item"))
(def ContextMenuPopupPart (primitive-part ContextMenuPrimitive "Popup"))
(def ContextMenuPortalPart (primitive-part ContextMenuPrimitive "Portal"))
(def ContextMenuPositionerPart (primitive-part ContextMenuPrimitive "Positioner"))
(def ContextMenuRadioGroupPart (primitive-part ContextMenuPrimitive "RadioGroup"))
(def ContextMenuRadioItemPart (primitive-part ContextMenuPrimitive "RadioItem"))
(def ContextMenuRootPart (primitive-part ContextMenuPrimitive "Root"))
(def ContextMenuSeparatorPart (primitive-part ContextMenuPrimitive "Separator"))
(def ContextMenuSubmenuRootPart (primitive-part ContextMenuPrimitive "SubmenuRoot"))
(def ContextMenuTriggerPart (primitive-part ContextMenuPrimitive "Trigger"))
(def DialogBackdropPart (primitive-part DialogPrimitive "Backdrop"))
(def DialogClosePart (primitive-part DialogPrimitive "Close"))
(def DialogDescriptionPart (primitive-part DialogPrimitive "Description"))
(def DialogPopupPart (primitive-part DialogPrimitive "Popup"))
(def DialogPortalPart (primitive-part DialogPrimitive "Portal"))
(def DialogRootPart (primitive-part DialogPrimitive "Root"))
(def DialogTitlePart (primitive-part DialogPrimitive "Title"))
(def DialogTriggerPart (primitive-part DialogPrimitive "Trigger"))
(def MenuArrowPart (primitive-part MenuPrimitive "Arrow"))
(def MenuCheckboxItemPart (primitive-part MenuPrimitive "CheckboxItem"))
(def MenuCheckboxItemIndicatorPart (primitive-part MenuPrimitive "CheckboxItemIndicator"))
(def MenuGroupPart (primitive-part MenuPrimitive "Group"))
(def MenuGroupLabelPart (primitive-part MenuPrimitive "GroupLabel"))
(def MenuItemPart (primitive-part MenuPrimitive "Item"))
(def MenuPopupPart (primitive-part MenuPrimitive "Popup"))
(def MenuPortalPart (primitive-part MenuPrimitive "Portal"))
(def MenuPositionerPart (primitive-part MenuPrimitive "Positioner"))
(def MenuRadioGroupPart (primitive-part MenuPrimitive "RadioGroup"))
(def MenuRadioItemPart (primitive-part MenuPrimitive "RadioItem"))
(def MenuRadioItemIndicatorPart (primitive-part MenuPrimitive "RadioItemIndicator"))
(def MenuRootPart (primitive-part MenuPrimitive "Root"))
(def MenuSeparatorPart (primitive-part MenuPrimitive "Separator"))
(def MenuSubmenuRootPart (primitive-part MenuPrimitive "SubmenuRoot"))
(def MenuSubmenuTriggerPart (primitive-part MenuPrimitive "SubmenuTrigger"))
(def MenuTriggerPart (primitive-part MenuPrimitive "Trigger"))
(def PopoverArrowPart (primitive-part PopoverPrimitive "Arrow"))
(def PopoverClosePart (primitive-part PopoverPrimitive "Close"))
(def PopoverPopupPart (primitive-part PopoverPrimitive "Popup"))
(def PopoverPortalPart (primitive-part PopoverPrimitive "Portal"))
(def PopoverPositionerPart (primitive-part PopoverPrimitive "Positioner"))
(def PopoverRootPart (primitive-part PopoverPrimitive "Root"))
(def PopoverTriggerPart (primitive-part PopoverPrimitive "Trigger"))
(def RadioIndicatorPart (primitive-part RadioPrimitive "Indicator"))
(def RadioRootPart (primitive-part RadioPrimitive "Root"))
(def SelectGroupPart (primitive-part SelectPrimitive "Group"))
(def SelectGroupLabelPart (primitive-part SelectPrimitive "GroupLabel"))
(def SelectIconPart (primitive-part SelectPrimitive "Icon"))
(def SelectItemPart (primitive-part SelectPrimitive "Item"))
(def SelectItemIndicatorPart (primitive-part SelectPrimitive "ItemIndicator"))
(def SelectItemTextPart (primitive-part SelectPrimitive "ItemText"))
(def SelectListPart (primitive-part SelectPrimitive "List"))
(def SelectPopupPart (primitive-part SelectPrimitive "Popup"))
(def SelectPortalPart (primitive-part SelectPrimitive "Portal"))
(def SelectPositionerPart (primitive-part SelectPrimitive "Positioner"))
(def SelectRootPart (primitive-part SelectPrimitive "Root"))
(def SelectScrollDownArrowPart (primitive-part SelectPrimitive "ScrollDownArrow"))
(def SelectScrollUpArrowPart (primitive-part SelectPrimitive "ScrollUpArrow"))
(def SelectSeparatorPart (primitive-part SelectPrimitive "Separator"))
(def SelectTriggerPart (primitive-part SelectPrimitive "Trigger"))
(def SelectValuePart (primitive-part SelectPrimitive "Value"))
(def SliderIndicatorPart (primitive-part SliderPrimitive "Indicator"))
(def SliderRootPart (primitive-part SliderPrimitive "Root"))
(def SliderThumbPart (primitive-part SliderPrimitive "Thumb"))
(def SliderTrackPart (primitive-part SliderPrimitive "Track"))
(def SwitchRootPart (primitive-part SwitchPrimitive "Root"))
(def SwitchThumbPart (primitive-part SwitchPrimitive "Thumb"))
(def TabsListPart (primitive-part TabsPrimitive "List"))
(def TabsPanelPart (primitive-part TabsPrimitive "Panel"))
(def TabsRootPart (primitive-part TabsPrimitive "Root"))
(def TabsTabPart (primitive-part TabsPrimitive "Tab"))
(def ToolbarButtonPart (primitive-part ToolbarPrimitive "Button"))
(def ToolbarGroupPart (primitive-part ToolbarPrimitive "Group"))
(def ToolbarInputPart (primitive-part ToolbarPrimitive "Input"))
(def ToolbarLinkPart (primitive-part ToolbarPrimitive "Link"))
(def ToolbarRootPart (primitive-part ToolbarPrimitive "Root"))
(def ToolbarSeparatorPart (primitive-part ToolbarPrimitive "Separator"))
(def TooltipArrowPart (primitive-part TooltipPrimitive "Arrow"))
(def TooltipPopupPart (primitive-part TooltipPrimitive "Popup"))
(def TooltipPortalPart (primitive-part TooltipPrimitive "Portal"))
(def TooltipPositionerPart (primitive-part TooltipPrimitive "Positioner"))
(def TooltipProviderPart (primitive-part TooltipPrimitive "Provider"))
(def TooltipRootPart (primitive-part TooltipPrimitive "Root"))
(def TooltipTriggerPart (primitive-part TooltipPrimitive "Trigger"))

(def ToastProvider (gobj/get ToastPrimitive "Provider"))
(def ToastPortal (gobj/get ToastPrimitive "Portal"))
(def ToastViewport (gobj/get ToastPrimitive "Viewport"))
(def ToastPositioner (gobj/get ToastPrimitive "Positioner"))
(def ToastRoot (gobj/get ToastPrimitive "Root"))
(def ToastContent (gobj/get ToastPrimitive "Content"))
(def ToastTitle (gobj/get ToastPrimitive "Title"))
(def ToastDescription (gobj/get ToastPrimitive "Description"))
(def ToastClose (gobj/get ToastPrimitive "Close"))
(def createToastManager (gobj/get ToastPrimitive "createToastManager"))
(def useToastManagerImpl (gobj/get ToastPrimitive "useToastManager"))

(defn- prop
  [^js props k]
  (gobj/get props k))

(defn- set-prop!
  [^js props k v]
  (gobj/set props k v)
  props)

(defn- copy-props
  [^js props]
  (js/Object.assign #js {} (or props #js {})))

(defn- clean-props!
  [^js props & ks]
  (doseq [k ks]
    (js-delete props k))
  props)

(defn- adapt-focus-props!
  [^js props]
  (when (and (nil? (prop props "initialFocus"))
             (some? (prop props "onOpenAutoFocus")))
    (set-prop! props "initialFocus" false))
  (when (and (nil? (prop props "finalFocus"))
             (some? (prop props "onCloseAutoFocus")))
    (set-prop! props "finalFocus" false))
  (clean-props! props "onOpenAutoFocus" "onCloseAutoFocus"))

(defn- clean-radix-popup-props!
  [^js props]
  (clean-props! props "onEscapeKeyDown" "onPointerDownOutside"))

(def ^:private portal-prop-names
  ["container" "keepMounted"])

(def ^:private positioner-prop-names
  ["align"
   "alignItemWithTrigger"
   "alignOffset"
   "anchor"
   "collisionAvoidance"
   "collisionBoundary"
   "collisionPadding"
   "disableAnchorTracking"
   "positionMethod"
   "side"
   "sideOffset"
   "sticky"])

(defn- copy-named-props
  [^js props prop-names]
  (let [props' #js {}]
    (doseq [k prop-names
            :let [v (prop props k)]
            :when (some? v)]
      (set-prop! props' k v))
    props'))

(defn- merge-object-props!
  [^js props & sources]
  (doseq [source sources
          :when source]
    (js/Object.assign props source))
  props)

(defn- apply-default-collision-avoidance!
  [^js props]
  (set-prop! props "collisionAvoidance"
             (merge-object-props! #js {:fallbackAxisSide "none"}
                                  (prop props "collisionAvoidance"))))

(defn- prop-name
  [v]
  (cond
    (nil? v) nil
    (keyword? v) (name v)
    :else (str v)))

(defn- variant-split-index
  [class-name]
  (let [length (count class-name)]
    (loop [idx 0
           bracket-depth 0
           split-idx nil]
      (if (< idx length)
        (let [ch (.charAt class-name idx)]
          (cond
            (= ch "[") (recur (inc idx) (inc bracket-depth) split-idx)
            (= ch "]") (recur (inc idx) (max 0 (dec bracket-depth)) split-idx)
            (and (= ch ":") (zero? bracket-depth)) (recur (inc idx) bracket-depth idx)
            :else (recur (inc idx) bracket-depth split-idx)))
        split-idx))))

(defn- utility-conflict
  [class-name]
  (let [split-idx (variant-split-index class-name)
        variant-prefix (if split-idx (subs class-name 0 (inc split-idx)) "")
        utility (if split-idx (subs class-name (inc split-idx)) class-name)
        important? (string/starts-with? utility "!")
        utility (cond-> utility important? (subs 1))
        group (cond
                (re-matches #"^-?h-.+" utility) "h"
                (re-matches #"^-?min-h-.+" utility) "min-h"
                (re-matches #"^-?max-h-.+" utility) "max-h"
                (re-matches #"^-?w-.+" utility) "w"
                (re-matches #"^-?min-w-.+" utility) "min-w"
                (re-matches #"^-?max-w-.+" utility) "max-w"
                (re-matches #"^-?p-.+" utility) "p"
                (re-matches #"^-?px-.+" utility) "px"
                (re-matches #"^-?py-.+" utility) "py"
                (re-matches #"^-?pt-.+" utility) "pt"
                (re-matches #"^-?pr-.+" utility) "pr"
                (re-matches #"^-?pb-.+" utility) "pb"
                (re-matches #"^-?pl-.+" utility) "pl")]
    (when group
      {:key (str variant-prefix group)
       :important? important?})))

(defn- merge-classes
  [classes]
  (:classes
   (reduce
    (fn [{:keys [classes indexes important?] :as state} class-name]
      (if-let [{key :key current-important? :important?} (utility-conflict class-name)]
        (if-let [idx (get indexes key)]
          (if (and (get important? key) (not current-important?))
            state
            {:classes (conj (assoc classes idx nil) class-name)
             :indexes (assoc indexes key (count classes))
             :important? (assoc important? key current-important?)})
          {:classes (conj classes class-name)
           :indexes (assoc indexes key (count classes))
           :important? (assoc important? key current-important?)})
        (update state :classes conj class-name)))
    {:classes []
     :indexes {}
     :important? {}}
    classes)))

(defn cn
  [& xs]
  (->> xs
       flatten
       (remove #(or (nil? %) (false? %) (= "" %)))
       (map prop-name)
       (mapcat #(string/split % #"\s+"))
       (remove string/blank?)
       merge-classes
       (remove nil?)
       (string/join " ")))

(defn- with-class-props
  [^js props base-class extra-class]
  (let [props' (copy-props props)]
    (set-prop! props' "className" (cn base-class extra-class (prop props "className")))
    props'))

(defn- adapt-menu-item-props!
  [^js props]
  (when-let [on-select (prop props "onSelect")]
    (when (nil? (prop props "onClick"))
      (set-prop! props "onClick" on-select))
    (clean-props! props "onSelect"))
  props)

(defn- native-event
  [^js event]
  (or (some-> event (.-nativeEvent)) event))

(defn- event-target
  [^js event]
  (let [^js native-event (native-event event)]
    (or (some-> event (.-target))
        (some-> native-event (.-target))
        (some-> event (.-currentTarget))
        (some-> native-event (.-currentTarget)))))

(defn- input-target?
  [target]
  (and (instance? js/Element target)
       (or (instance? js/HTMLInputElement target)
           (instance? js/HTMLTextAreaElement target)
           (instance? js/HTMLSelectElement target)
           (some? (.closest target "[contenteditable='true']")))))

(defn- prevent-base-ui-handler!
  [^js event]
  (when (fn? (.-preventBaseUIHandler event))
    (.preventBaseUIHandler event)))

(defn- popup-key-down-handler
  [handler]
  (fn [^js event]
    (some-> handler (apply [event]))
    (when (input-target? (event-target event))
      (prevent-base-ui-handler! event))))

(def ^:private popup-scroll-style
  #js {:maxHeight "var(--available-height)"
       :overflowY "auto"
       :overflowX "hidden"})

(defn- popup-normal-style
  []
  (doto (merge-object-props! #js {:fontSize "1rem"
                                  :lineHeight 1.5}
                             popup-scroll-style)
    (set-prop! "--ls-page-title-size" "1rem")))

(defn- forward-dom
  ([tag base-class]
   (forward-dom tag base-class nil))
  ([tag base-class extra-class-fn]
   (react/forwardRef
    (fn [^js props ref]
      (let [props' (with-class-props props base-class (some-> extra-class-fn (apply [props])))]
        (when ref (set-prop! props' "ref" ref))
        (react/createElement tag props'))))))

(defn- child-array
  [children]
  (react/Children.toArray children))

(defn- only-child
  [children]
  (first (array-seq (child-array children))))

(defn- own-prop?
  [^js props k]
  (and props (gobj/containsKey props k)))

(defn- select-item-entry
  [^js props]
  (doto #js {}
    (set-prop! "value" (prop props "value"))
    (set-prop! "label" (prop props "children"))))

(defn- infer-select-items
  [children]
  (letfn [(infer [children]
            (mapcat
             (fn [child]
               (if (react/isValidElement child)
                 (let [props (prop child "props")]
                   (if (own-prop? props "value")
                     [(select-item-entry props)]
                     (infer (prop props "children"))))
                 []))
             (array-seq (child-array children))))]
    (seq (infer children))))

(defn- as-child?
  [^js props]
  (true? (or (prop props "asChild")
             (prop props "as-child"))))

(defn- forward-part
  ([component base-class]
   (forward-part component base-class nil))
  ([component base-class extra-class-fn]
   (react/forwardRef
    (fn [^js props ref]
      (let [as-child? (as-child? props)
            render-child (when as-child? (only-child (prop props "children")))
            props' (with-class-props props base-class (some-> extra-class-fn (apply [props])))]
        (when ref (set-prop! props' "ref" ref))
        (when as-child?
          (clean-props! props' "asChild" "as-child" "children")
          (set-prop! props' "render" render-child))
        (react/createElement component props'))))))

(defn- composed-popup
  [portal positioner popup base-class & {:keys [extra-class-fn]}]
  (react/forwardRef
   (fn [^js props ref]
     (let [portal-props (merge-object-props! (copy-named-props props portal-prop-names)
                                             (prop props "portalProps"))
           positioner-props (merge-object-props! (copy-named-props props positioner-prop-names)
                                                 (prop props "positionerProps"))
           popup-props (with-class-props props
                         (cn base-class "outline-none focus:outline-none focus-visible:outline-none")
                         (some-> extra-class-fn (apply [props])))
           on-key-down (prop popup-props "onKeyDown")
           children (prop props "children")]
       (set-prop! positioner-props "style"
                  (merge-object-props! #js {:zIndex 99999} (prop positioner-props "style")))
       (apply-default-collision-avoidance! positioner-props)
       (set-prop! popup-props "style"
                  (merge-object-props! (popup-normal-style) (prop popup-props "style")))
       (set-prop! popup-props "onKeyDown" (popup-key-down-handler on-key-down))
       (adapt-focus-props! popup-props)
       (clean-radix-popup-props! popup-props)
       (when ref (set-prop! popup-props "ref" ref))
       (doseq [k (concat portal-prop-names
                         positioner-prop-names
                         ["portalProps" "positionerProps"
                          "children" "withoutAnimation" "position"])]
         (js-delete popup-props k))
       (react/createElement
        portal portal-props
        (react/createElement
         positioner positioner-props
         (react/createElement popup popup-props children)))))))

(defn- with-button-classes
  [^js props]
  (let [variant (or (prop-name (prop props "variant")) "default")
        size (or (prop-name (prop props "size")) "default")]
    (cn
     "ui__button inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm gap-1 font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none"
     (case variant
       "default" "bg-primary/90 hover:bg-primary/100 active:opacity-90 text-primary-foreground hover:text-primary-foreground as-solid"
       "solid" "bg-primary/90 hover:bg-primary/100 active:opacity-90 text-primary-foreground hover:text-primary-foreground as-solid"
       "destructive" "bg-destructive/90 hover:bg-destructive/100 active:opacity-90 text-destructive-foreground hover:text-destructive-foreground as-destructive"
       "outline" "border bg-background hover:bg-accent hover:text-accent-foreground active:opacity-80 as-outline"
       "secondary" "bg-secondary/70 text-secondary-foreground hover:bg-secondary/100 active:opacity-80 as-secondary"
       "ghost" "hover:bg-secondary/70 hover:text-secondary-foreground active:opacity-80 as-ghost"
       "text" "hover:bg-secondary/70 hover:text-secondary-foreground active:opacity-80 as-text"
       "link" "text-primary underline-offset-4 hover:underline active:opacity-80 as-link"
       "")
     (case size
       "md" "h-9 px-4 rounded-md py-2"
       "lg" "h-11 text-base rounded-md px-8"
       "sm" "h-7 rounded px-3 py-1"
       "xs" "h-6 text-xs rounded px-3"
       "icon" "box-content h-6 w-6 p-1 overflow-hidden"
       "h-10 px-4 py-2"))))

(defn- button-like
  [component ^js props ref]
  (let [as-child? (as-child? props)
        props' (copy-props props)
        class-name (cn (with-button-classes props) (prop props "className"))]
    (clean-props! props' "variant" "size")
    (set-prop! props' "className" class-name)
    (when ref (set-prop! props' "ref" ref))
    (if as-child?
      (let [child (only-child (prop props "children"))]
        (clean-props! props' "asChild" "as-child" "children")
        (set-prop! props' "render" child)
        (when (nil? (prop props "nativeButton"))
          (set-prop! props' "nativeButton" false))
        (react/createElement component props'))
      (do
        (clean-props! props' "asChild" "as-child")
        (react/createElement component props')))))

(def Button
  (react/forwardRef
   (fn [^js props ref]
     (button-like ButtonPrimitive props ref))))

(def ToolbarButton
  (react/forwardRef
   (fn [^js props ref]
     (button-like ToolbarButtonPart props ref))))

(def Link (forward-dom "a" "ui__link"))
(def ButtonGroup (forward-dom "div" "ui__button-group inline-flex items-center gap-1"))

(def Alert (forward-dom "div" "ui__alert relative w-full rounded-lg border p-4"))
(def AlertTitle (forward-dom "h5" "ui__alert-title mb-1 font-medium leading-none tracking-tight"))
(def AlertDescription (forward-dom "div" "ui__alert-description text-sm [&_p]:leading-relaxed"))
(def Badge (forward-dom "div" "ui__badge inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"))
(def Skeleton (forward-dom "div" "ui__skeleton animate-pulse rounded-md bg-muted"))
(def Card (forward-dom "div" "ui__card rounded-lg border bg-card text-card-foreground shadow-sm"))
(def CardHeader (forward-dom "div" "ui__card-header flex flex-col space-y-1.5 p-6"))
(def CardTitle (forward-dom "h3" "ui__card-title text-2xl font-semibold leading-none tracking-tight"))
(def CardDescription (forward-dom "p" "ui__card-description text-sm text-muted-foreground"))
(def CardContent (forward-dom "div" "ui__card-content p-6 pt-0"))
(def CardFooter (forward-dom "div" "ui__card-footer flex items-center p-6 pt-0"))
(def Input (forward-part InputPrimitive "ui__input flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"))
(def Textarea (forward-dom "textarea" "ui__textarea flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"))
(def Label (forward-dom "label" "ui__label text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"))
(def Separator (forward-part SeparatorPrimitive "ui__separator shrink-0 bg-border data-[orientation=horizontal]:h-[1px] data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-[1px]"))
(def Avatar (forward-part AvatarRootPart "ui__avatar relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full"))
(def AvatarImage (forward-part AvatarImagePart "ui__avatar-image aspect-square h-full w-full"))
(def AvatarFallback (forward-part AvatarFallbackPart "ui__avatar-fallback flex h-full w-full items-center justify-center rounded-full bg-muted"))
(defn- CalendarChevron
  [^js props]
  (let [orientation (prop props "orientation")
        class-name (cn "h-4 w-4 text-foreground" (prop props "className"))]
    (react/createElement
     (case orientation
       "left" IconChevronLeft
       "up" IconChevronUp
       "down" IconChevronDown
       IconChevronRight)
     #js {:className class-name
          :size 16
          :style #js {:width 16
                      :height 16}
          :aria-hidden true})))

(def Calendar
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__calendar p-3" nil)
           class-names (merge-object-props!
                        #js {:months "relative flex flex-col sm:flex-row space-y-4 sm:space-y-0"
                             :month "rdp-month w-max space-y-3"
                             :month_caption "flex justify-start pt-1 relative items-center w-[276px]"
                             :caption_label "text-sm font-medium"
                             :dropdowns "flex items-center justify-start gap-2"
                             :months_dropdown "rdp-dropdown_month"
                             :years_dropdown "rdp-dropdown_year"
                             :dropdown_root "relative flex h-8 items-center rounded-md border border-input bg-background px-2"
                             :dropdown "absolute inset-0 z-[2] w-full opacity-0 cursor-pointer"
                             :nav "absolute left-[200px] top-1 z-10 flex items-center gap-1"
                             :button_previous (cn (with-button-classes #js {:variant "outline"})
                                                  "h-8 w-9 bg-transparent !p-0 !px-0 !py-0 opacity-80 hover:opacity-100")
                             :button_next (cn (with-button-classes #js {:variant "outline"})
                                              "h-8 w-9 bg-transparent !p-0 !px-0 !py-0 opacity-80 hover:opacity-100")
                             :month_grid "w-max border-collapse space-y-1"
                             :weekdays "hidden"
                             :weekday "text-muted-foreground rounded-md w-9 text-center font-normal text-[0.8rem]"
                             :week "flex w-max mt-1 gap-1"
                             :day "h-9 w-9 flex shrink-0 items-center justify-center text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
                             :day_button (cn (with-button-classes #js {:variant "ghost"})
                                             "h-9 w-9 p-0 font-normal aria-selected:opacity-100")
                             :range_end "day-range-end"
                             :selected "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground [&>button:focus]:bg-primary [&>button:focus]:text-primary-foreground"
                             :today "[&>button]:bg-accent [&>button]:text-accent-foreground"
                             :outside "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30"
                             :disabled "text-muted-foreground opacity-50"
                             :range_middle "aria-selected:bg-accent aria-selected:text-accent-foreground"
                             :hidden "invisible"}
                        (prop props "classNames"))
           components (merge-object-props! #js {:Chevron CalendarChevron}
                                           (prop props "components"))
           style (js/Object.assign #js {:maxWidth "100%"} (prop props "style"))]
       (when ref (set-prop! props' "ref" ref))
       (when (nil? (prop props' "showOutsideDays"))
         (set-prop! props' "showOutsideDays" true))
       (set-prop! props' "classNames" class-names)
       (set-prop! props' "components" components)
       (set-prop! props' "style" style)
       (react/createElement DayPicker props')))))
(def Toolbar (forward-part ToolbarRootPart "ui__toolbar flex items-center gap-1"))
(def ToolbarGroup (forward-part ToolbarGroupPart "ui__toolbar-group inline-flex items-center gap-1"))
(def ToolbarInput (forward-part ToolbarInputPart "ui__toolbar-input"))
(def ToolbarLink (forward-part ToolbarLinkPart "ui__toolbar-link"))
(def ToolbarSeparator (forward-part ToolbarSeparatorPart "ui__toolbar-separator shrink-0 bg-border data-[orientation=horizontal]:h-[1px] data-[orientation=horizontal]:w-5 data-[orientation=vertical]:h-5 data-[orientation=vertical]:w-[1px]"))

(def Checkbox
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__checkbox peer h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[checked]:text-primary-foreground" nil)
           checked? (true? (prop props "checked"))
           disabled? (true? (prop props "disabled"))]
       (when ref (set-prop! props' "ref" ref))
       (if (true? (prop props "data-inputless"))
         (do
           (clean-props! props' "checked" "data-inputless")
           (set-prop! props' "role" "checkbox")
           (set-prop! props' "aria-checked" checked?)
           (set-prop! props' "data-state" (if checked? "checked" "unchecked"))
           (set-prop! props' "data-checked" (when checked? ""))
           (set-prop! props' "data-disabled" (when disabled? ""))
           (react/createElement
            "span" props'
            (when checked?
              (react/createElement IconCheck #js {:className "h-4 w-4"}))))
         (do
           (set-prop! props' "render" (react/createElement "button"))
           (set-prop! props' "nativeButton" true)
           (react/createElement
            CheckboxRootPart props'
            (react/createElement CheckboxIndicatorPart nil
                                 (react/createElement IconCheck #js {:className "h-4 w-4"})))))))))

(def Switch
  (react/forwardRef
   (fn [^js props ref]
     (let [size (or (prop-name (prop props "size")) "default")
           small? (= size "sm")
           props' (with-class-props props
                    (cn "ui__switch peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:justify-end data-[checked]:bg-primary data-[unchecked]:justify-start data-[unchecked]:bg-input pr-[1px] pl-[1px]"
                        (if small? "h-4.5 w-8" "h-6 w-11"))
                    nil)]
       (clean-props! props' "size")
       (when ref (set-prop! props' "ref" ref))
       (react/createElement
        SwitchRootPart props'
        (react/createElement SwitchThumbPart #js {:className (cn "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform"
                                                                 (if small?
                                                                   "h-3 w-3"
                                                                   "h-5 w-5"))}))))))

(def RadioGroup (forward-part RadioGroupPrimitive "ui__radio-group grid gap-2"))
(def RadioGroupItem
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__radio-group-item aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center" nil)]
       (when ref (set-prop! props' "ref" ref))
       (react/createElement
        RadioRootPart props'
        (react/createElement RadioIndicatorPart #js {:className "flex items-center justify-center"}
                             (react/createElement IconCircle #js {:className "h-2.5 w-2.5 fill-current text-current"})))))))

(def Slider (forward-part SliderRootPart "ui__slider relative flex w-full touch-none select-none items-center"))
(def SliderTrack (forward-part SliderTrackPart "ui__slider-track relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"))
(def SliderRange (forward-part SliderIndicatorPart "ui__slider-range absolute h-full bg-primary"))
(def SliderThumb (forward-part SliderThumbPart "ui__slider-thumb block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"))

(def DropdownMenu (forward-part MenuRootPart nil))
(def DropdownMenuTrigger (forward-part MenuTriggerPart nil))
(def DropdownMenuArrow (forward-part MenuArrowPart nil))
(def DropdownMenuGroup (forward-part MenuGroupPart nil))
(def DropdownMenuPortal MenuPortalPart)

(def ^:private menu-content-selector
  ".ui__dropdown-menu-content, .ui__dropdown-menu-sub-content, .ui__context-menu-content, .ui__context-menu-sub-content")

(def ^:private submenu-content-selector
  ".ui__dropdown-menu-sub-content, .ui__context-menu-sub-content")

(def ^:private submenu-internal-close-reasons
  #{"trigger-hover" "focus-out"})

(defn- event-related-target
  [^js event-details]
  (let [event (some-> event-details (.-event))
        native-event (or (some-> event (.-nativeEvent)) event)]
    (or (some-> event (.-relatedTarget))
        (some-> native-event (.-relatedTarget))
        (some-> event (.-toElement))
        (some-> native-event (.-toElement)))))

(defn- content-target?
  [selector target]
  (and (instance? js/Element target)
       (some? (.closest target selector))))

(defn- menu-content-target?
  [target]
  (content-target? menu-content-selector target))

(defn- submenu-content-target?
  [target]
  (content-target? submenu-content-selector target))

(defn- submenu-retained-target?
  [reason target]
  (case reason
    "trigger-hover" (submenu-content-target? target)
    "focus-out" (menu-content-target? target)
    false))

(defn- submenu-internal-close?
  [open? ^js event-details]
  (let [reason (some-> event-details (.-reason))]
    (and (false? open?)
         (contains? submenu-internal-close-reasons reason)
         (submenu-retained-target? reason (event-related-target event-details)))))

(defn- menu-sub
  [component]
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (copy-props props)
           on-open-change (prop props "onOpenChange")]
       (when ref (set-prop! props' "ref" ref))
       (set-prop! props' "onOpenChange"
                  (fn [open? event-details]
                    (if (submenu-internal-close? open? event-details)
                      (some-> event-details (.cancel))
                      (when (fn? on-open-change)
                        (on-open-change open? event-details)))))
       (react/createElement component props')))))

(def DropdownMenuSub (menu-sub MenuSubmenuRootPart))
(def DropdownMenuRadioGroup MenuRadioGroupPart)
(def DropdownMenuContent
  (composed-popup MenuPortalPart MenuPositionerPart MenuPopupPart
                  "ui__dropdown-menu-content z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[open]:animate-in"))
(def DropdownMenuSubContent
  (composed-popup MenuPortalPart MenuPositionerPart MenuPopupPart
                  "ui__dropdown-menu-sub-content z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[open]:animate-in"))
(def DropdownMenuItem
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__dropdown-menu-item relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50" nil)]
       (adapt-menu-item-props! props')
       (when ref (set-prop! props' "ref" ref))
       (react/createElement MenuItemPart props')))))
(def DropdownMenuCheckboxItem
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__dropdown-menu-checkbox-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50" nil)
           children (prop props "children")]
       (when ref (set-prop! props' "ref" ref))
       (clean-props! props' "children")
       (react/createElement
        MenuCheckboxItemPart props'
        (react/createElement "span" #js {:className "absolute left-2 flex h-3.5 w-3.5 items-center justify-center"}
                             (react/createElement MenuCheckboxItemIndicatorPart nil
                                                  (react/createElement IconCheck #js {:className "h-4 w-4"})))
        children)))))
(def DropdownMenuRadioItem
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__dropdown-menu-radio-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50" nil)
           children (prop props "children")]
       (when ref (set-prop! props' "ref" ref))
       (clean-props! props' "children")
       (react/createElement
        MenuRadioItemPart props'
        (react/createElement "span" #js {:className "absolute left-2 flex h-3.5 w-3.5 items-center justify-center"}
                             (react/createElement MenuRadioItemIndicatorPart nil
                                                  (react/createElement IconCircle #js {:className "h-2 w-2 fill-current"})))
        children)))))
(def DropdownMenuLabel
  (forward-dom "div" "ui__dropdown-menu-label px-2 py-1.5 text-sm font-semibold"))
(def DropdownMenuSeparator (forward-part MenuSeparatorPart "ui__dropdown-menu-separator -mx-1 my-1 h-px bg-muted"))
(def DropdownMenuShortcut (forward-dom "span" "ui__dropdown-menu-shortcut ml-auto text-xs opacity-60"))
(def DropdownMenuSubTrigger
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__dropdown-menu-sub-trigger flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted data-[open]:bg-muted" (when (prop props "inset") "pl-8"))
           children (prop props "children")]
       (when ref (set-prop! props' "ref" ref))
       (clean-props! props' "inset" "children")
       (react/createElement MenuSubmenuTriggerPart props'
                            children
                            (react/createElement IconChevronRight #js {:className "ml-auto h-4 w-4"}))))))

(def ContextMenu (forward-part ContextMenuRootPart nil))
(def ContextMenuTrigger (forward-part ContextMenuTriggerPart nil))
(def ContextMenuGroup (forward-part ContextMenuGroupPart nil))
(def ContextMenuPortal ContextMenuPortalPart)
(def ContextMenuSub (menu-sub ContextMenuSubmenuRootPart))
(def ContextMenuRadioGroup ContextMenuRadioGroupPart)
(def ContextMenuContent
  (composed-popup ContextMenuPortalPart ContextMenuPositionerPart ContextMenuPopupPart
                  "ui__context-menu-content z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none focus:outline-none focus-visible:outline-none"))
(def ContextMenuSubContent
  (composed-popup ContextMenuPortalPart ContextMenuPositionerPart ContextMenuPopupPart
                  "ui__context-menu-sub-content z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-lg outline-none focus:outline-none focus-visible:outline-none"))
(def ContextMenuItem (forward-part ContextMenuItemPart "ui__context-menu-item relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"))
(def ContextMenuCheckboxItem (forward-part ContextMenuCheckboxItemPart "ui__context-menu-checkbox-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"))
(def ContextMenuRadioItem (forward-part ContextMenuRadioItemPart "ui__context-menu-radio-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"))
(def ContextMenuLabel
  (forward-dom "div" "ui__context-menu-label px-2 py-1.5 text-sm font-semibold"))
(def ContextMenuSeparator (forward-part ContextMenuSeparatorPart "ui__context-menu-separator -mx-1 my-1 h-px bg-muted"))
(def ContextMenuShortcut DropdownMenuShortcut)
(def ContextMenuSubTrigger DropdownMenuSubTrigger)

(def Popover (forward-part PopoverRootPart nil))
(def PopoverTrigger (forward-part PopoverTriggerPart nil))
(def PopoverArrow (forward-part PopoverArrowPart nil))
(def PopoverClose (forward-part PopoverClosePart nil))
(def PopoverContent
  (composed-popup PopoverPortalPart PopoverPositionerPart PopoverPopupPart
                  "ui__popover-content z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none"))
(def PopoverRemoveScroll (forward-dom "div" nil))

(def Dialog (forward-part DialogRootPart nil))
(def DialogPortal DialogPortalPart)
(def DialogOverlay (forward-part DialogBackdropPart "ui__dialog-overlay fixed inset-0 z-50 bg-background/90 flex justify-center items-center"))
(def DialogClose (forward-part DialogClosePart nil))
(def DialogTrigger (forward-part DialogTriggerPart nil))
(def DialogContent
  (react/forwardRef
   (fn [^js props ref]
      (let [overlay-props (or (prop props "overlayProps") #js {})
           popup-props (with-class-props props "ui__dialog-content fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl lg:max-w-3xl gap-4 border sm:rounded-lg bg-background p-6 shadow-lg transition-transform duration-200" nil)
           children (prop props "children")
           show-close? (not (false? (prop props "data-close-btn")))]
       (adapt-focus-props! popup-props)
       (clean-radix-popup-props! popup-props)
       (set-prop! popup-props "style" (js/Object.assign #js {} (prop popup-props "style") #js {:transform "translate(-50%, -50%) scale(calc(1 - var(--nested-dialogs, 0) * 0.03))"}))
       (when ref (set-prop! popup-props "ref" ref))
       (clean-props! popup-props "overlayProps" "children")
       (react/createElement
        DialogPortalPart nil
        (react/createElement DialogBackdropPart (with-class-props overlay-props "ui__dialog-overlay fixed inset-0 z-50 bg-background/90 flex justify-center items-center" nil))
        (react/createElement DialogPopupPart popup-props
                             children
                             (when show-close?
                               (react/createElement DialogClosePart #js {:className "ui__dialog-close absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"}
                                                    (react/createElement IconX #js {:className "h-4 w-4"})))))))))
(def DialogHeader (forward-dom "div" "ui__dialog-header flex flex-col space-y-1.5 text-center sm:text-left"))
(def DialogFooter (forward-dom "div" "ui__dialog-footer flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"))
(def DialogTitle (forward-part DialogTitlePart "ui__dialog-title text-lg font-semibold leading-none tracking-tight"))
(def DialogDescription (forward-part DialogDescriptionPart "ui__dialog-description text-sm text-muted-foreground"))

(def AlertDialog (forward-part AlertDialogRootPart nil))
(def AlertDialogPortal AlertDialogPortalPart)
(def AlertDialogOverlay (forward-part AlertDialogBackdropPart "ui__alert-dialog-overlay fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"))
(def AlertDialogTrigger (forward-part AlertDialogTriggerPart nil))
(def AlertDialogContent
  (react/forwardRef
   (fn [^js props ref]
     (let [overlay-props (or (prop props "overlayProps") #js {})
           popup-props (with-class-props props "ui__alert-dialog-content fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg" nil)]
       (adapt-focus-props! popup-props)
       (set-prop! popup-props "style" (js/Object.assign #js {} (prop popup-props "style") #js {:transform "translate(-50%, -50%)"}))
       (when ref (set-prop! popup-props "ref" ref))
       (clean-props! popup-props "overlayProps")
       (react/createElement
        AlertDialogPortalPart nil
        (react/createElement AlertDialogBackdropPart (with-class-props overlay-props "ui__alert-dialog-overlay fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" nil))
        (react/createElement AlertDialogPopupPart popup-props))))))
(def AlertDialogHeader (forward-dom "div" "ui__alert-dialog-header flex flex-col space-y-2 text-center sm:text-left"))
(def AlertDialogFooter (forward-dom "div" "ui__alert-dialog-footer flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"))
(def AlertDialogTitle (forward-part AlertDialogTitlePart "ui__alert-dialog-title text-lg font-semibold"))
(def AlertDialogDescription (forward-part AlertDialogDescriptionPart "ui__alert-dialog-description text-sm text-muted-foreground"))
(def AlertDialogAction Button)
(def AlertDialogCancel
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (copy-props props)]
       (set-prop! props' "variant" "outline")
       (set-prop! props' "className" (cn "mt-2 sm:mt-0" (prop props "className")))
       (when ref (set-prop! props' "ref" ref))
       (react/createElement Button props')))))

(def Select
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (copy-props props)]
       (when ref (set-prop! props' "ref" ref))
       (when-not (own-prop? props' "items")
         (when-let [items (infer-select-items (prop props "children"))]
           (set-prop! props' "items" (to-array items))))
       (react/createElement SelectRootPart props')))))
(def SelectGroup (forward-part SelectGroupPart nil))
(def SelectValue (forward-part SelectValuePart nil))
(def SelectTrigger (forward-part SelectTriggerPart "ui__select-trigger flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"))
(def SelectIcon (forward-part SelectIconPart nil))
(def SelectLabel (forward-part SelectGroupLabelPart "ui__select-label py-1.5 pl-8 pr-2 text-sm font-semibold"))
(def SelectSeparator (forward-part SelectSeparatorPart "ui__select-separator -mx-1 my-1 h-px bg-muted"))
(def SelectScrollUpButton (forward-part SelectScrollUpArrowPart "ui__select-up-button flex cursor-default items-center justify-center py-1"))
(def SelectScrollDownButton (forward-part SelectScrollDownArrowPart "ui__select-down-button flex cursor-default items-center justify-center py-1"))
(def SelectContent
  (react/forwardRef
   (fn [^js props ref]
     (let [portal-props (merge-object-props! (copy-named-props props portal-prop-names)
                                             (prop props "portalProps"))
           positioner-props (merge-object-props! (copy-named-props props positioner-prop-names)
                                                 (prop props "positionerProps"))
           popup-props (with-class-props props "ui__select-content relative z-[99999] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md" nil)
           children (prop props "children")]
       (when ref (set-prop! popup-props "ref" ref))
       (set-prop! positioner-props "className" (cn "z-[99999]" (prop positioner-props "className")))
       (set-prop! positioner-props "style" (js/Object.assign #js {} #js {:zIndex 99999} (prop positioner-props "style")))
       (apply-default-collision-avoidance! positioner-props)
       (set-prop! popup-props "style"
                  (js/Object.assign #js {}
                                    popup-scroll-style
                                    #js {:display "flex"
                                         :flexDirection "column"}
                                    (prop popup-props "style")
                                    #js {:zIndex 99999}))
       (doseq [k (concat portal-prop-names
                         positioner-prop-names
                         ["portalProps" "positionerProps"
                          "children" "position"])]
         (js-delete popup-props k))
       (react/createElement
        SelectPortalPart portal-props
        (react/createElement
         SelectPositionerPart positioner-props
         (react/createElement
          SelectPopupPart popup-props
          (react/createElement SelectScrollUpArrowPart #js {:className "ui__select-up-button flex cursor-default items-center justify-center py-1"}
                               (react/createElement IconChevronUp #js {:className "h-4 w-4"}))
          (react/createElement SelectListPart #js {:className "p-1"
                                                   :style #js {:flex "1 1 auto"
                                                               :minHeight 0
                                                               :maxHeight "100%"
                                                               :overflowY "auto"
                                                               :overflowX "hidden"}}
                               children)
          (react/createElement SelectScrollDownArrowPart #js {:className "ui__select-down-button flex cursor-default items-center justify-center py-1"}
                               (react/createElement IconChevronDown #js {:className "h-4 w-4"})))))))))
(def SelectItem
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__select-item relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50" nil)
           children (prop props "children")]
       (when ref (set-prop! props' "ref" ref))
       (clean-props! props' "children")
       (set-prop! props' "render"
                  (fn [^js item-props ^js state]
                    (react/createElement
                     "div" item-props
                     (when (.-selected state)
                       (react/createElement
                        "span"
                        #js {:className "absolute left-2 top-1/2 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center"}
                        (react/createElement IconCheck #js {:className "h-4 w-4"})))
                     (react/createElement SelectItemTextPart nil
                                          (react/createElement "span" nil children)))))
       (react/createElement
        SelectItemPart props')))))

(def Tooltip (forward-part TooltipRootPart nil))
(def TooltipTrigger (forward-part TooltipTriggerPart nil))
(def TooltipPortal TooltipPortalPart)
(def TooltipContent
  (react/forwardRef
   (fn [^js props ref]
     (let [portal-props (merge-object-props! (copy-named-props props portal-prop-names)
                                             (prop props "portalProps"))
           positioner-props (merge-object-props! (copy-named-props props positioner-prop-names)
                                                 (prop props "positionerProps"))
           popup-props (with-class-props props "ui__tooltip-content z-50 rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md" nil)
           children (prop props "children")]
       (set-prop! positioner-props "style"
                  (merge-object-props! #js {:zIndex 99999} (prop positioner-props "style")))
       (apply-default-collision-avoidance! positioner-props)
       (set-prop! popup-props "style"
                  (merge-object-props! #js {} popup-scroll-style (prop popup-props "style")))
       (adapt-focus-props! popup-props)
       (clean-radix-popup-props! popup-props)
       (when ref (set-prop! popup-props "ref" ref))
       (doseq [k (concat portal-prop-names
                         positioner-prop-names
                         ["portalProps" "positionerProps"
                          "children" "withoutAnimation" "position"])]
         (js-delete popup-props k))
       (react/createElement
        TooltipPortalPart portal-props
        (react/createElement
         TooltipPositionerPart positioner-props
         (react/createElement
          TooltipPopupPart popup-props
          children
          (react/createElement TooltipArrowPart
                               #js {:className "ui__tooltip-arrow h-2 w-2 rotate-45 border bg-popover data-[side=top]:-bottom-1 data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1"}))))))))
(def TooltipProvider TooltipProviderPart)
(def TooltipArrow (forward-part TooltipArrowPart nil))

(def Tabs (forward-part TabsRootPart nil))
(def TabsList (forward-part TabsListPart "ui__tabs-list inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"))
(def TabsTrigger (forward-part TabsTabPart "ui__tabs-trigger inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm"))
(def TabsContent (forward-part TabsPanelPart "ui__tabs-content mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"))
(def Toggle (forward-part TogglePrimitive "ui__toggle inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-accent data-[pressed]:text-accent-foreground"))
(def ToggleGroup (forward-part ToggleGroupPrimitive "ui__toggle-group flex items-center justify-center gap-1"))
(def ToggleGroupItem Toggle)

(def Form FormProvider)
(def FormItemContext (react/createContext #js {}))
(def FormFieldContext (react/createContext #js {}))
(def FormField
  (fn [^js props]
    (react/createElement
     FormFieldContext.Provider #js {:value #js {:name (prop props "name")}}
     (react/createElement Controller props))))

(defn useFormField []
  (let [field-context (react/useContext FormFieldContext)
        item-context (react/useContext FormItemContext)
        methods (useFormContext)
        field-state (.getFieldState methods (prop field-context "name") (.-formState methods))
        id (or (prop item-context "id") (str "ui-form-" (random-uuid)))]
    (js/Object.assign
     #js {:id id
          :name (prop field-context "name")
          :formItemId (str id "-form-item")
          :formDescriptionId (str id "-form-item-description")
          :formMessageId (str id "-form-item-message")}
     field-state)))

(def FormItem
  (react/forwardRef
   (fn [^js props ref]
     (let [id (react/useId)
           props' (with-class-props props "ui__form-item" nil)]
       (when ref (set-prop! props' "ref" ref))
       (react/createElement
        FormItemContext.Provider #js {:value #js {:id id}}
        (react/createElement "div" props'))))))

(def FormLabel
  (react/forwardRef
   (fn [^js props ref]
     (let [state (useFormField)
           error (prop state "error")
           props' (with-class-props props "ui__form-label" (when error "text-destructive"))]
       (set-prop! props' "htmlFor" (prop state "formItemId"))
       (when ref (set-prop! props' "ref" ref))
       (react/createElement Label props')))))

(def FormControl
  (react/forwardRef
   (fn [^js props ref]
     (let [state (useFormField)
           error (prop state "error")
           child (only-child (prop props "children"))
           child-props #js {:id (prop state "formItemId")
                            :aria-describedby (if error
                                                (str (prop state "formDescriptionId") " " (prop state "formMessageId"))
                                                (prop state "formDescriptionId"))
                            :aria-invalid (boolean error)}]
       (when ref (set-prop! child-props "ref" ref))
       (react/cloneElement child child-props)))))

(def FormDescription
  (react/forwardRef
   (fn [^js props ref]
     (let [state (useFormField)
           props' (with-class-props props "ui__form-description text-sm text-muted-foreground" nil)]
       (set-prop! props' "id" (prop state "formDescriptionId"))
       (when ref (set-prop! props' "ref" ref))
       (react/createElement "p" props')))))

(def FormMessage
  (react/forwardRef
   (fn [^js props ref]
     (let [state (useFormField)
           error (prop state "error")
           body (or (some-> error (prop "message") str) (prop props "children"))]
       (when body
         (let [props' (with-class-props props "ui__form-message text-sm font-medium text-destructive" nil)]
           (set-prop! props' "id" (prop state "formMessageId"))
           (when ref (set-prop! props' "ref" ref))
           (clean-props! props' "children")
           (react/createElement "p" props' body)))))))

(def toast-manager (createToastManager))
(defn genToastId [] (str (random-uuid)))
(defn- normalize-toast-options
  ([^js options]
   (normalize-toast-options options true))
  ([^js options include-id?]
  (let [props (copy-props options)
        id (prop options "id")
        toast-id (or id (genToastId))
        variant (prop options "variant")
        duration (prop options "duration")
        action (prop options "action")
        icon (prop options "icon")
        class-name (prop options "className")
        on-dismiss (prop options "onDismiss")
        data (js/Object.assign #js {} (or (prop options "data") #js {}))]
    (doseq [k ["variant" "duration" "action" "icon" "className" "onDismiss" "open" "onOpenChange"]]
      (js-delete props k))
    (when include-id?
      (set-prop! props "id" toast-id))
    (when variant
      (set-prop! props "type" variant)
      (set-prop! data "variant" variant))
    (when duration
      (set-prop! props "timeout" duration))
    (when action (set-prop! data "action" action))
    (when icon (set-prop! data "icon" icon))
    (when class-name (set-prop! data "className" class-name))
    (when on-dismiss
      (set-prop! props "onClose" #(on-dismiss toast-id)))
    (set-prop! props "data" data)
    props)))

(defn- add-toast
  [^js options]
  (let [props (normalize-toast-options options)
        id (.add toast-manager props)]
    #js {:id id
         :dismiss #(.close toast-manager id)
         :update #(.update toast-manager id (normalize-toast-options %))}))

(defn useToast []
  #js {:toast add-toast
       :dismiss #(.close toast-manager %)
       :update #(.update toast-manager %1 (normalize-toast-options %2 false))})
(defn- ToastList []
  (let [^js manager (useToastManagerImpl)
        toasts (.-toasts manager)]
    (into-array
     (map
      (fn [^js toast]
        (let [data (.-data toast)
              variant (or (.-type toast) (prop data "variant"))
              action (prop data "action")
              icon (prop data "icon")
              title? (not (string/blank? (.-title toast)))]
          (react/createElement
           ToastRoot #js {:key (.-id toast)
                          :toast toast
                          :className (cn "ui__toast group pointer-events-auto"
                                         variant
                                         (prop data "className"))}
           (react/createElement
            ToastContent #js {:className (str "ui__toast-content " (when-not title? "untitled"))
                              :data-base-ui-swipe-ignore "true"}
            (react/createElement
             "div" #js {:className "ui__toast-header"}
              (when title? icon)
              (react/createElement ToastClose #js {:className "ui__toast-close"}
                                  (react/createElement IconX #js {:className "h-4 w-4"})))
            (react/createElement
             "div" #js {:className "ui__toast-body"}
             (react/createElement
              "div" #js {:className "ui__toast-text"}
              (if-let [title (.-title toast)]
                (react/createElement ToastTitle #js {:className "ui__toast-title"} title) icon)
              (when-let [description (.-description toast)]
                (react/createElement ToastDescription #js {:className "ui__toast-description"} description)))
             action
             (when-let [action-props (.-actionProps toast)]
               (react/createElement "button" action-props)))))))
      (array-seq toasts)))))

(def Toaster
  (react/forwardRef
   (fn [_props _ref]
     (react/createElement
      ToastProvider #js {:toastManager toast-manager}
      (react/createElement
       ToastPortal nil
       (react/createElement
        ToastViewport #js {:className "ui__toaster-viewport"}
        (react/createElement ToastList nil)))))))

(def registry
  #js {"Button" Button
       "Link" Link
       "ButtonGroup" ButtonGroup
       "Toolbar" Toolbar
       "ToolbarGroup" ToolbarGroup
       "ToolbarButton" ToolbarButton
       "ToolbarInput" ToolbarInput
       "ToolbarLink" ToolbarLink
       "ToolbarSeparator" ToolbarSeparator
       "Alert" Alert
       "AlertTitle" AlertTitle
       "AlertDescription" AlertDescription
       "Badge" Badge
       "Skeleton" Skeleton
       "Card" Card
       "CardHeader" CardHeader
       "CardTitle" CardTitle
       "CardDescription" CardDescription
       "CardContent" CardContent
       "CardFooter" CardFooter
       "Input" Input
       "Textarea" Textarea
       "Label" Label
       "Separator" Separator
       "Calendar" Calendar
       "Avatar" Avatar
       "AvatarImage" AvatarImage
       "AvatarFallback" AvatarFallback
       "Checkbox" Checkbox
       "Switch" Switch
       "RadioGroup" RadioGroup
       "RadioGroupItem" RadioGroupItem
       "Slider" Slider
       "SliderTrack" SliderTrack
       "SliderRange" SliderRange
       "SliderThumb" SliderThumb
       "DropdownMenu" DropdownMenu
       "DropdownMenuTrigger" DropdownMenuTrigger
       "DropdownMenuArrow" DropdownMenuArrow
       "DropdownMenuContent" DropdownMenuContent
       "DropdownMenuItem" DropdownMenuItem
       "DropdownMenuCheckboxItem" DropdownMenuCheckboxItem
       "DropdownMenuRadioItem" DropdownMenuRadioItem
       "DropdownMenuLabel" DropdownMenuLabel
       "DropdownMenuSeparator" DropdownMenuSeparator
       "DropdownMenuShortcut" DropdownMenuShortcut
       "DropdownMenuGroup" DropdownMenuGroup
       "DropdownMenuPortal" DropdownMenuPortal
       "DropdownMenuSub" DropdownMenuSub
       "DropdownMenuSubContent" DropdownMenuSubContent
       "DropdownMenuSubTrigger" DropdownMenuSubTrigger
       "DropdownMenuRadioGroup" DropdownMenuRadioGroup
       "ContextMenu" ContextMenu
       "ContextMenuTrigger" ContextMenuTrigger
       "ContextMenuContent" ContextMenuContent
       "ContextMenuItem" ContextMenuItem
       "ContextMenuCheckboxItem" ContextMenuCheckboxItem
       "ContextMenuRadioItem" ContextMenuRadioItem
       "ContextMenuLabel" ContextMenuLabel
       "ContextMenuSeparator" ContextMenuSeparator
       "ContextMenuShortcut" ContextMenuShortcut
       "ContextMenuGroup" ContextMenuGroup
       "ContextMenuPortal" ContextMenuPortal
       "ContextMenuSub" ContextMenuSub
       "ContextMenuSubContent" ContextMenuSubContent
       "ContextMenuSubTrigger" ContextMenuSubTrigger
       "ContextMenuRadioGroup" ContextMenuRadioGroup
       "Popover" Popover
       "PopoverTrigger" PopoverTrigger
       "PopoverContent" PopoverContent
       "PopoverArrow" PopoverArrow
       "PopoverClose" PopoverClose
       "PopoverRemoveScroll" PopoverRemoveScroll
       "Dialog" Dialog
       "DialogPortal" DialogPortal
       "DialogOverlay" DialogOverlay
       "DialogClose" DialogClose
       "DialogTrigger" DialogTrigger
       "DialogContent" DialogContent
       "DialogHeader" DialogHeader
       "DialogFooter" DialogFooter
       "DialogTitle" DialogTitle
       "DialogDescription" DialogDescription
       "AlertDialog" AlertDialog
       "AlertDialogPortal" AlertDialogPortal
       "AlertDialogOverlay" AlertDialogOverlay
       "AlertDialogTrigger" AlertDialogTrigger
       "AlertDialogContent" AlertDialogContent
       "AlertDialogHeader" AlertDialogHeader
       "AlertDialogFooter" AlertDialogFooter
       "AlertDialogTitle" AlertDialogTitle
       "AlertDialogDescription" AlertDialogDescription
       "AlertDialogAction" AlertDialogAction
       "AlertDialogCancel" AlertDialogCancel
       "Select" Select
       "SelectGroup" SelectGroup
       "SelectValue" SelectValue
       "SelectTrigger" SelectTrigger
       "SelectContent" SelectContent
       "SelectLabel" SelectLabel
       "SelectItem" SelectItem
       "SelectIcon" SelectIcon
       "SelectSeparator" SelectSeparator
       "SelectScrollUpButton" SelectScrollUpButton
       "SelectScrollDownButton" SelectScrollDownButton
       "Tooltip" Tooltip
       "TooltipTrigger" TooltipTrigger
       "TooltipPortal" TooltipPortal
       "TooltipContent" TooltipContent
       "TooltipProvider" TooltipProvider
       "TooltipArrow" TooltipArrow
       "Tabs" Tabs
       "TabsList" TabsList
       "TabsTrigger" TabsTrigger
       "TabsContent" TabsContent
       "Toggle" Toggle
       "ToggleGroup" ToggleGroup
       "ToggleGroupItem" ToggleGroupItem
       "Form" Form
       "FormField" FormField
       "FormItem" FormItem
       "FormLabel" FormLabel
       "FormControl" FormControl
       "FormDescription" FormDescription
       "FormMessage" FormMessage
       "Toaster" Toaster
       "useToast" useToast
       "genToastId" genToastId
       "useForm" useForm
       "useFormContext" useFormContext
       "useFormField" useFormField
       "yupResolver" yupResolver
       "yup" yup})

;; export registry to global scope `window.LSUI` for dynamic component rendering in Logseq
(set! (.-LSUI js/window) registry)
