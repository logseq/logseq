(ns logseq.shui.core
  (:require 
    [logseq.shui.table.v2 :as shui.table.v2]
    [logseq.shui.context :as shui.context]))

;; table component
(def table shui.table.v2/root)
(def table-v2 shui.table.v2/root)

;; context
(def make-context shui.context/make-context)
