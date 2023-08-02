(ns logseq.shui.core
  (:require 
    [logseq.shui.button.v2 :as shui.button.v2]
    [logseq.shui.cmdk.v2 :as shui.cmdk.v2]
    [logseq.shui.context :as shui.context]
    [logseq.shui.icon.v2 :as shui.icon.v2]
    [logseq.shui.list-item.v1 :as shui.list-item.v1]
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

;; icon 
(def icon shui.icon.v2/root)
(def icon-v2 shui.icon.v2/root)

;; list-item 
(def list-item shui.list-item.v1/root)
(def list-item-v1 shui.list-item.v1/root)

;; context
(def make-context shui.context/make-context)
