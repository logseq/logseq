(ns logseq.shui.ui
  (:require [logseq.shui.util :as util]
            [logseq.shui.icon.v2 :as icon-v2]
            [logseq.shui.toaster.core :as toaster]
            [cljs-bean.core :as bean]))

(def button (util/lsui-wrap "Button" {:static? false}))
(def slider (util/lsui-wrap "Slider"))
(def tabler-icon icon-v2/root)

(def dropdown-menu (util/lsui-wrap "DropdownMenu"))
(def dropdown-menu-content (util/lsui-wrap "DropdownMenuContent"))
(def dropdown-menu-group (util/lsui-wrap "DropdownMenuGroup"))
(def dropdown-menu-item (util/lsui-wrap "DropdownMenuItem"))
(def dropdown-menu-checkbox-item (util/lsui-wrap "DropdownMenuCheckboxItem"))
(def dropdown-menu-radio-group (util/lsui-wrap "DropdownMenuRadioGroup"))
(def dropdown-menu-radio-item (util/lsui-wrap "DropdownMenuRadioItem"))
(def dropdown-menu-label (util/lsui-wrap "DropdownMenuLabel"))
(def dropdown-menu-separator (util/lsui-wrap "DropdownMenuSeparator"))
(def dropdown-menu-trigger (util/lsui-wrap "DropdownMenuTrigger"))
(def dropdown-menu-shortcut (util/lsui-wrap "DropdownMenuShortcut"))
(def dropdown-menu-portal (util/lsui-wrap "DropdownMenuPortal"))
(def dropdown-menu-sub (util/lsui-wrap "DropdownMenuSub"))
(def dropdown-menu-sub-content (util/lsui-wrap "DropdownMenuSubContent"))
(def dropdown-menu-sub-trigger (util/lsui-wrap "DropdownMenuSubTrigger"))

(def toast! toaster/toast!)
