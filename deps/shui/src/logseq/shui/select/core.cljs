(ns logseq.shui.select.core
  (:require [rum.core :as rum]
            [daiquiri.interpreter :refer [interpret]]
            [logseq.shui.util :as util]
            [cljs-bean.core :as bean]))

(def select (util/lsui-wrap "Select"))
(def select-group (util/lsui-wrap "SelectGroup"))
(def select-value (util/lsui-wrap "SelectValue"))
(def select-trigger (util/lsui-wrap "SelectTrigger"))
(def select-content (util/lsui-wrap "SelectContent"))
(def select-label (util/lsui-wrap "SelectLabel"))
(def select-item (util/lsui-wrap "SelectItem"))
(def select-separator (util/lsui-wrap "SelectSeparator"))
(def select-scroll-up-button (util/lsui-wrap "SelectScrollUpButton"))
(def select-scroll-down-button (util/lsui-wrap "SelectScrollDownButton"))
