(ns logseq.shui.select.core
  (:require [logseq.shui.util :as util]))

(def select (util/ui-wrap "Select"))
(def select-group (util/ui-wrap "SelectGroup"))
(def select-value (util/ui-wrap "SelectValue"))
(def select-trigger (util/ui-wrap "SelectTrigger"))
(def select-icon (util/ui-wrap "SelectIcon"))
(def select-content (util/ui-wrap "SelectContent"))
(def select-label (util/ui-wrap "SelectLabel"))
(def select-item (util/ui-wrap "SelectItem"))
(def select-separator (util/ui-wrap "SelectSeparator"))
(def select-scroll-up-button (util/ui-wrap "SelectScrollUpButton"))
(def select-scroll-down-button (util/ui-wrap "SelectScrollDownButton"))
