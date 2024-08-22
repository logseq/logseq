(ns logseq.shui.core
  (:require
    [logseq.shui.context :as shui.context]
    [logseq.shui.icon.v2 :as shui.icon.v2]
    [logseq.shui.list-item.v1 :as shui.list-item.v1]
    [logseq.shui.table.v2 :as shui.table.v2]
    [logseq.shui.shortcut.v1 :as shui.shortcut.v1]))

;; table component
(def table shui.table.v2/root)
(def table-v2 shui.table.v2/root)

;; shortcut
(def shortcut shui.shortcut.v1/root)

;; icon
(def icon shui.icon.v2/root)

;; list-item
(def list-item shui.list-item.v1/root)
(def list-item-v1 shui.list-item.v1/root)

;; context
(def make-context shui.context/make-context)
