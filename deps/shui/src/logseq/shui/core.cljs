(ns logseq.shui.core
  (:require
    [logseq.shui.button.v2 :as shui.button.v2]
    [logseq.shui.context :as shui.context]
    [logseq.shui.dialog.v1 :as shui.dialog.v1]
    [logseq.shui.icon.v2 :as shui.icon.v2]
    [logseq.shui.list-item.v1 :as shui.list-item.v1]
    [logseq.shui.table.v2 :as shui.table.v2]
    [logseq.shui.shortcut.v1 :as shui.shortcut.v1]))

;; table component
(def table shui.table.v2/root)
(def table-v2 shui.table.v2/root)

;; shortcut
(def shortcut shui.shortcut.v1/root)
(def shortcut-v1 shui.shortcut.v1/root)

;; button component
(def button shui.button.v2/root)
(def button-v2 shui.button.v2/root)

;; icon
(def icon shui.icon.v2/root)
(def icon-v2 shui.icon.v2/root)
(def tabler-icon shui.icon.v2/tabler-icon)

;; list-item
(def list-item shui.list-item.v1/root)
(def list-item-v1 shui.list-item.v1/root)

;; dialog
(def dialog shui.dialog.v1/root)
(def dialog-v1 shui.dialog.v1/root)

;; context
(def make-context shui.context/make-context)
