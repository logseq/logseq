(ns capacitor.pages.utils
  (:require [capacitor.state :as state]
            [capacitor.pages.blocks :as page-blocks]))

(defn nav-to-block!
  [page-or-block]
  (some-> @state/*nav-root
    (.push #(page-blocks/page page-or-block))))
