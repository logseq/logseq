(ns logseq.shui.components
  (:require
   ["@base-ui/react/alert-dialog" :refer [AlertDialog] :rename {AlertDialog AlertDialogPrimitive}]
   ["@base-ui/react/checkbox" :refer [Checkbox] :rename {Checkbox CheckboxPrimitive}]
   ["@base-ui/react/context-menu" :refer [ContextMenu] :rename {ContextMenu ContextMenuPrimitive}]
   ["@base-ui/react/dialog" :refer [Dialog] :rename {Dialog DialogPrimitive}]
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
   ["@base-ui/react/toggle" :refer [Toggle] :rename {Toggle TogglePrimitive}]
   ["@base-ui/react/toggle-group" :refer [ToggleGroup] :rename {ToggleGroup ToggleGroupPrimitive}]
   ["@base-ui/react/tooltip" :refer [Tooltip] :rename {Tooltip TooltipPrimitive}]
   ["@hookform/resolvers/yup" :refer [yupResolver]]
   ["lucide-react" :refer [Check ChevronDown ChevronRight ChevronUp Circle X]]
   ["react" :as react]
   ["react-day-picker" :refer [DayPicker]]
   ["react-hook-form" :refer [Controller FormProvider useForm useFormContext]]
   ["yup" :as yup]
   [clojure.string :as string]
   [goog.object :as gobj]
   [io.factorhouse.hsx.core :as hsx]))

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
(def ToastRoot (gobj/get ToastPrimitive "Root"))
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

(defn- prop-name
  [v]
  (cond
    (nil? v) nil
    (keyword? v) (name v)
    :else (str v)))

(defn cn
  [& xs]
  (->> xs
       flatten
       (remove #(or (nil? %) (false? %) (= "" %)))
       (map prop-name)
       (string/join " ")))

(defn- with-class-props
  [^js props base-class extra-class]
  (let [props' (copy-props props)]
    (set-prop! props' "className" (cn base-class extra-class (prop props "className")))
    props'))

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

(defn- forward-part
  ([component base-class]
   (forward-part component base-class nil))
  ([component base-class extra-class-fn]
   (react/forwardRef
    (fn [^js props ref]
      (let [as-child? (true? (prop props "asChild"))
            render-child (when as-child? (only-child (prop props "children")))
            props' (with-class-props props base-class (some-> extra-class-fn (apply [props])))]
        (when ref (set-prop! props' "ref" ref))
        (when as-child?
          (clean-props! props' "asChild" "children")
          (set-prop! props' "render" render-child))
        (react/createElement component props'))))))

(defn- composed-popup
  [portal positioner popup base-class & {:keys [extra-class-fn]}]
  (react/forwardRef
   (fn [^js props ref]
     (let [positioner-props (copy-props props)
           popup-props (with-class-props props base-class (some-> extra-class-fn (apply [props])))
           children (prop props "children")]
       (adapt-focus-props! popup-props)
       (when ref (set-prop! popup-props "ref" ref))
       (doseq [k ["className" "children" "withoutAnimation" "position"]]
         (js-delete positioner-props k))
       (doseq [k ["side" "align" "sideOffset" "alignOffset" "collisionPadding" "anchor" "positionMethod"]]
         (js-delete popup-props k))
       (react/createElement
        portal nil
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
       "solid" "bg-primary/90 hover:bg-primary/100 active:opacity-90 text-primary-foreground hover:text-primary-foreground as-solid"
       "destructive" "bg-destructive/90 hover:bg-destructive/100 active:opacity-90 text-destructive-foreground hover:text-destructive-foreground as-destructive"
       "outline" "border bg-background hover:bg-accent hover:text-accent-foreground active:opacity-80 as-outline"
       "secondary" "bg-secondary/70 text-secondary-foreground hover:bg-secondary/100 active:opacity-80 as-secondary"
       "ghost" "hover:bg-secondary/70 hover:text-secondary-foreground active:opacity-80 as-ghost"
       "link" "text-primary underline-offset-4 hover:underline active:opacity-80 as-link"
       "bg-primary/90 hover:bg-primary/100 active:opacity-90 text-primary-foreground hover:text-primary-foreground as-classic")
     (case size
       "md" "h-9 px-4 rounded-md py-2"
       "lg" "h-11 text-base rounded-md px-8"
       "sm" "h-7 rounded px-3 py-1"
       "xs" "h-6 text-xs rounded px-3"
       "icon" "h-10 w-10"
       "h-10 px-4 py-2"))))

(def Button
  (react/forwardRef
   (fn [^js props ref]
     (let [as-child? (true? (prop props "asChild"))
           props' (copy-props props)
           class-name (cn (with-button-classes props) (prop props "className"))]
       (clean-props! props' "variant" "size")
       (set-prop! props' "className" class-name)
       (when ref (set-prop! props' "ref" ref))
       (if as-child?
         (let [child (only-child (prop props "children"))]
           (clean-props! props' "asChild" "children")
           (react/cloneElement child props'))
         (do
           (clean-props! props' "asChild")
           (react/createElement "button" props')))))))

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
(def Input (forward-dom "input" "ui__input flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"))
(def Textarea (forward-dom "textarea" "ui__textarea flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"))
(def Label (forward-dom "label" "ui__label text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"))
(def Separator (forward-part SeparatorPrimitive "ui__separator shrink-0 bg-border data-[orientation=horizontal]:h-[1px] data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-[1px]"))
(def Avatar (forward-dom "span" "ui__avatar relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full"))
(def AvatarImage (forward-dom "img" "ui__avatar-image aspect-square h-full w-full"))
(def AvatarFallback (forward-dom "span" "ui__avatar-fallback flex h-full w-full items-center justify-center rounded-full bg-muted"))
(def Calendar (forward-part DayPicker "ui__calendar p-3"))

(def Checkbox
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__checkbox peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[checked]:text-primary-foreground" nil)
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
              (react/createElement Check #js {:className "h-4 w-4"}))))
         (react/createElement
          CheckboxRootPart props'
          (react/createElement CheckboxIndicatorPart nil
                               (react/createElement Check #js {:className "h-4 w-4"}))))))))

(def Switch
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__switch peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-input" nil)]
       (when ref (set-prop! props' "ref" ref))
       (react/createElement
        SwitchRootPart props'
        (react/createElement SwitchThumbPart #js {:className "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[checked]:translate-x-5 data-[unchecked]:translate-x-0"}))))))

(def RadioGroup (forward-part RadioGroupPrimitive "ui__radio-group grid gap-2"))
(def RadioGroupItem
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__radio-group-item aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" nil)]
       (when ref (set-prop! props' "ref" ref))
       (react/createElement
        RadioRootPart props'
        (react/createElement RadioIndicatorPart #js {:className "flex items-center justify-center"}
                             (react/createElement Circle #js {:className "h-2.5 w-2.5 fill-current text-current"})))))))

(def Slider (forward-part SliderRootPart "ui__slider relative flex w-full touch-none select-none items-center"))
(def SliderTrack (forward-part SliderTrackPart "ui__slider-track relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"))
(def SliderRange (forward-part SliderIndicatorPart "ui__slider-range absolute h-full bg-primary"))
(def SliderThumb (forward-part SliderThumbPart "ui__slider-thumb block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"))

(def DropdownMenu (forward-part MenuRootPart nil))
(def DropdownMenuTrigger (forward-part MenuTriggerPart nil))
(def DropdownMenuArrow (forward-part MenuArrowPart nil))
(def DropdownMenuGroup (forward-part MenuGroupPart nil))
(def DropdownMenuPortal MenuPortalPart)
(def DropdownMenuSub MenuSubmenuRootPart)
(def DropdownMenuRadioGroup MenuRadioGroupPart)
(def DropdownMenuContent
  (composed-popup MenuPortalPart MenuPositionerPart MenuPopupPart
                  "ui__dropdown-menu-content z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[open]:animate-in"))
(def DropdownMenuSubContent
  (composed-popup MenuPortalPart MenuPositionerPart MenuPopupPart
                  "ui__dropdown-menu-sub-content z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[open]:animate-in"))
(def DropdownMenuItem (forward-part MenuItemPart "ui__dropdown-menu-item relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"))
(def DropdownMenuCheckboxItem
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__dropdown-menu-checkbox-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" nil)
           children (prop props "children")]
       (when ref (set-prop! props' "ref" ref))
       (clean-props! props' "children")
       (react/createElement
        MenuCheckboxItemPart props'
        (react/createElement "span" #js {:className "absolute left-2 flex h-3.5 w-3.5 items-center justify-center"}
                             (react/createElement MenuCheckboxItemIndicatorPart nil
                                                  (react/createElement Check #js {:className "h-4 w-4"})))
        children)))))
(def DropdownMenuRadioItem
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__dropdown-menu-radio-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" nil)
           children (prop props "children")]
       (when ref (set-prop! props' "ref" ref))
       (clean-props! props' "children")
       (react/createElement
        MenuRadioItemPart props'
        (react/createElement "span" #js {:className "absolute left-2 flex h-3.5 w-3.5 items-center justify-center"}
                             (react/createElement MenuRadioItemIndicatorPart nil
                                                  (react/createElement Circle #js {:className "h-2 w-2 fill-current"})))
        children)))))
(def DropdownMenuLabel (forward-part MenuGroupLabelPart "ui__dropdown-menu-label px-2 py-1.5 text-sm font-semibold"))
(def DropdownMenuSeparator (forward-part MenuSeparatorPart "ui__dropdown-menu-separator -mx-1 my-1 h-px bg-muted"))
(def DropdownMenuShortcut (forward-dom "span" "ui__dropdown-menu-shortcut ml-auto text-xs opacity-60"))
(def DropdownMenuSubTrigger
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__dropdown-menu-sub-trigger flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[open]:bg-accent" (when (prop props "inset") "pl-8"))
           children (prop props "children")]
       (when ref (set-prop! props' "ref" ref))
       (clean-props! props' "inset" "children")
       (react/createElement MenuSubmenuTriggerPart props'
                            children
                            (react/createElement ChevronRight #js {:className "ml-auto h-4 w-4"}))))))

(def ContextMenu (forward-part ContextMenuRootPart nil))
(def ContextMenuTrigger (forward-part ContextMenuTriggerPart nil))
(def ContextMenuGroup (forward-part ContextMenuGroupPart nil))
(def ContextMenuPortal ContextMenuPortalPart)
(def ContextMenuSub ContextMenuSubmenuRootPart)
(def ContextMenuRadioGroup ContextMenuRadioGroupPart)
(def ContextMenuContent
  (composed-popup ContextMenuPortalPart ContextMenuPositionerPart ContextMenuPopupPart
                  "ui__context-menu-content z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"))
(def ContextMenuSubContent
  (composed-popup ContextMenuPortalPart ContextMenuPositionerPart ContextMenuPopupPart
                  "ui__context-menu-sub-content z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"))
(def ContextMenuItem (forward-part ContextMenuItemPart "ui__context-menu-item relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"))
(def ContextMenuCheckboxItem (forward-part ContextMenuCheckboxItemPart "ui__context-menu-checkbox-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"))
(def ContextMenuRadioItem (forward-part ContextMenuRadioItemPart "ui__context-menu-radio-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"))
(def ContextMenuLabel (forward-part ContextMenuGroupLabelPart "ui__context-menu-label px-2 py-1.5 text-sm font-semibold"))
(def ContextMenuSeparator (forward-part ContextMenuSeparatorPart "ui__context-menu-separator -mx-1 my-1 h-px bg-muted"))
(def ContextMenuShortcut DropdownMenuShortcut)
(def ContextMenuSubTrigger DropdownMenuSubTrigger)

(def Popover (forward-part PopoverRootPart nil))
(def PopoverTrigger (forward-part PopoverTriggerPart nil))
(def PopoverArrow (forward-part PopoverArrowPart nil))
(def PopoverClose (forward-part PopoverClosePart nil))
(def PopoverContent
  (composed-popup PopoverPortalPart PopoverPositionerPart PopoverPopupPart
                  "ui__popover-content z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none"))
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
           popup-props (with-class-props props "ui__dialog-content relative z-50 grid w-full max-w-2xl lg:max-w-3xl gap-4 border sm:rounded-lg bg-background p-6 shadow-lg duration-200" nil)
           children (prop props "children")]
       (adapt-focus-props! popup-props)
       (when ref (set-prop! popup-props "ref" ref))
       (clean-props! popup-props "overlayProps" "children")
       (react/createElement
        DialogPortalPart nil
        (react/createElement DialogBackdropPart (with-class-props overlay-props "ui__dialog-overlay fixed inset-0 z-50 bg-background/90 flex justify-center items-center" nil))
        (react/createElement DialogPopupPart popup-props
                             children
                             (react/createElement DialogClosePart #js {:className "ui__dialog-close absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"}
                                                  (react/createElement X #js {:className "h-4 w-4"}))))))))
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
           popup-props (with-class-props props "ui__alert-dialog-content fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg" nil)]
       (adapt-focus-props! popup-props)
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

(def Select (forward-part SelectRootPart nil))
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
     (let [positioner-props (copy-props props)
           popup-props (with-class-props props "ui__select-content relative z-[60] max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md" nil)
           children (prop props "children")]
       (when ref (set-prop! popup-props "ref" ref))
       (doseq [k ["className" "children" "position"]]
         (js-delete positioner-props k))
       (set-prop! positioner-props "className" "z-[60]")
       (set-prop! positioner-props "style" (js/Object.assign #js {} (prop positioner-props "style") #js {:zIndex 60}))
       (set-prop! popup-props "style" (js/Object.assign #js {} (prop popup-props "style") #js {:zIndex 60}))
       (doseq [k ["side" "align" "sideOffset" "alignOffset" "collisionPadding" "positionMethod"]]
         (js-delete popup-props k))
       (react/createElement
        SelectPositionerPart positioner-props
        (react/createElement
         SelectPopupPart popup-props
         (react/createElement SelectScrollUpArrowPart #js {:className "ui__select-up-button flex cursor-default items-center justify-center py-1"}
                              (react/createElement ChevronUp #js {:className "h-4 w-4"}))
         (react/createElement SelectListPart #js {:className "p-1"} children)
         (react/createElement SelectScrollDownArrowPart #js {:className "ui__select-down-button flex cursor-default items-center justify-center py-1"}
                              (react/createElement ChevronDown #js {:className "h-4 w-4"}))))))))
(def SelectItem
  (react/forwardRef
   (fn [^js props ref]
     (let [props' (with-class-props props "ui__select-item relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" nil)
           children (prop props "children")]
       (when ref (set-prop! props' "ref" ref))
       (clean-props! props' "children")
       (react/createElement
        SelectItemPart props'
	        (react/createElement "span" #js {:className "absolute left-2 flex h-3.5 w-3.5 items-center justify-center"}
	                             (react/createElement SelectItemIndicatorPart nil
	                                                  (react/createElement Check #js {:className "h-4 w-4"})))
	        (react/createElement SelectItemTextPart nil
	                             (react/createElement "span" nil children)))))))

(def Tooltip (forward-part TooltipRootPart nil))
(def TooltipTrigger (forward-part TooltipTriggerPart nil))
(def TooltipPortal TooltipPortalPart)
(def TooltipContent
  (composed-popup TooltipPortalPart TooltipPositionerPart TooltipPopupPart
                  "ui__tooltip-content z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md"))
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
           props' (with-class-props props "ui__form-item space-y-2" nil)]
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
      (set-prop! props "timeout" (if (and (js/Number.isInteger duration) (<= duration 0))
                                   (* 1000 120)
                                   duration)))
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
              icon (prop data "icon")]
          (react/createElement
           ToastRoot #js {:key (.-id toast)
                          :toast toast
                          :className (cn "ui__toast group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border bg-background p-6 pr-8 shadow-lg"
                                         (when icon "has-variant-icon")
                                         variant
                                         (prop data "className"))}
           (react/createElement
            "div" #js {:className "grid gap-1"}
            icon
            (when (.-title toast)
              (react/createElement ToastTitle #js {:className "text-sm font-semibold"}))
            (when (.-description toast)
              (react/createElement ToastDescription #js {:className "text-sm opacity-90"})))
           action
           (when-let [action-props (.-actionProps toast)]
             (react/createElement "button" action-props))
           (react/createElement ToastClose #js {:className "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"}
                                (react/createElement X #js {:className "h-4 w-4"})))))
      (array-seq toasts)))))

(def Toaster
  (react/forwardRef
   (fn [_props _ref]
     (react/createElement
      ToastProvider #js {:toastManager toast-manager}
      (react/createElement
       ToastPortal nil
       (react/createElement
        ToastViewport #js {:className "ui__toaster-viewport fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]"}
        (react/createElement ToastList nil)))))))

(def registry
  #js {"Button" Button
       "Link" Link
       "ButtonGroup" ButtonGroup
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
