(ns logseq.shui.ui
  (:require [logseq.shui.util :as util]
            [logseq.shui.icon.v2 :as icon-v2]
            [logseq.shui.toaster.core :as toaster-core]
            [logseq.shui.form.core :as form-core]))

(def button (util/lsui-wrap "Button" {:static? false}))
(def tabler-icon icon-v2/root)

(def alert (util/lsui-wrap "Alert"))
(def alert-title (util/lsui-wrap "AlertTitle"))
(def alert-description (util/lsui-wrap "AlertDescription"))
(def slider (util/lsui-wrap "Slider"))
(def badge (util/lsui-wrap "Badge"))
(def input (util/lsui-wrap "Input"))

(def form form-core/form)
(def form-item form-core/form-item)
(def form-label form-core/form-label)
(def form-description form-core/form-description)
(def form-message form-core/form-message)
(def form-field form-core/form-field)
(def form-control form-core/form-control)

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

(def toast! toaster-core/toast!)
(def toast-dismiss! toaster-core/dismiss!)
