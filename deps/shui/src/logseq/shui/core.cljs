(ns logseq.shui.core
  (:require 
    [logseq.shui.button.v2 :as shui.button.v2]
    [logseq.shui.cmdk.v2 :as shui.cmdk.v2]
    [logseq.shui.context :as shui.context]
    [logseq.shui.table.v2 :as shui.table.v2]))

;; table component
(def table shui.table.v2/root)
(def table-v2 shui.table.v2/root)

;; button component 
(def button shui.button.v2/root)
(def button-v2 shui.button.v2/root)

;; cmdk 
(def cmdk shui.cmdk.v2/root)
(def cmdk-v2 shui.cmdk.v2/root)

;; context
(def make-context shui.context/make-context)
