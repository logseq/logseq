(ns capacitor.pages.utils
  (:require [capacitor.state :as state]
            [capacitor.pages.blocks :as page-blocks]))

(defn nav-to-block!
  [page-or-block opts]
  (some-> @state/*nav-root
    (.push #(page-blocks/page page-or-block opts))))

(defn nav-to-edit-block!
  [block opts]
  (some-> @state/*nav-root
    (.push #(page-blocks/edit-block-modal block opts))))
