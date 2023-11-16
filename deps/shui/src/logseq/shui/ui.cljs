(ns logseq.shui.ui
  (:require [logseq.shui.util :as util]
            [logseq.shui.icon.v2 :as icon-v2]
            [cljs-bean.core :as bean]))

(def ui-wrap (partial util/component-wrap js/window.LSUI))

(def button (ui-wrap "Button" {:static? false}))
(def slider (ui-wrap "Slider"))
(def tabler-icon icon-v2/root)

(def dropdown-menu (ui-wrap "DropdownMenu"))
(def dropdown-menu-content (ui-wrap "DropdownMenuContent"))
(def dropdown-menu-group (ui-wrap "DropdownMenuGroup"))
(def dropdown-menu-item (ui-wrap "DropdownMenuItem"))
(def dropdown-menu-checkbox-item (ui-wrap "DropdownMenuCheckboxItem"))
(def dropdown-menu-radio-group (ui-wrap "DropdownMenuRadioGroup"))
(def dropdown-menu-radio-item (ui-wrap "DropdownMenuRadioItem"))
(def dropdown-menu-label (ui-wrap "DropdownMenuLabel"))
(def dropdown-menu-separator (ui-wrap "DropdownMenuSeparator"))
(def dropdown-menu-trigger (ui-wrap "DropdownMenuTrigger"))
(def dropdown-menu-shortcut (ui-wrap "DropdownMenuShortcut"))
(def dropdown-menu-portal (ui-wrap "DropdownMenuPortal"))
(def dropdown-menu-sub (ui-wrap "DropdownMenuSub"))
(def dropdown-menu-sub-content (ui-wrap "DropdownMenuSubContent"))
(def dropdown-menu-sub-trigger (ui-wrap "DropdownMenuSubTrigger"))

(def toaster-installer (ui-wrap "Toaster"))
(defn use-toast []
  (when-let [^js js-toast (js/window.LSUI.useToast)]
    (let [toast-fn! (.-toast js-toast)
          dismiss! (.-dismiss js-toast)]
      [(fn [s]
         (let [^js s (bean/->js s)]
           (toast-fn! s)))
       dismiss!])))
