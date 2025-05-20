(ns capacitor.components.utils
  (:require [capacitor.state :as state]
            [capacitor.components.blocks :as cc-blocks]
            [cljs-bean.core :as bean]))

;; https://ionicframework.com/docs/api/nav#push
(defn nav-push!
  [component & opts]
  (some-> @state/*nav-root
    (.push component (bean/->js opts))))

(defn nav-pop! []
  (some-> @state/*nav-root (.pop)))

(defn nav-to-block!
  [page-or-block opts]
  (some-> @state/*nav-root
    (.push #(cc-blocks/page page-or-block opts))))

(defn nav-to-edit-block!
  [block opts]
  (some-> @state/*nav-root
    (.push #(cc-blocks/edit-block-modal block opts))))
