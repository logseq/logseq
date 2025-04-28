(ns capacitor.pages.utils
  (:require [capacitor.state :as state]
            [capacitor.pages.blocks :as page-blocks]
            [capacitor.components.ui :as ui]
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
    (.push #(page-blocks/page page-or-block opts))))

(defn nav-to-edit-block!
  [block opts]
  (some-> @state/*nav-root
    (.push #(page-blocks/edit-block-modal block opts))))
