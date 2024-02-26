(ns logseq.shui.resizable.core
  (:require [logseq.shui.util :as util]))

(def resizable-panel-group (util/lsui-wrap "ResizablePanelGroup"))
(def resizable-panel (util/lsui-wrap "ResizablePanel"))
(def resizable-handle (util/lsui-wrap "ResizableHandle"))