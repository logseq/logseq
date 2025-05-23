(ns capacitor.components.nav-utils
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

(defn nav-length? []
  (some-> ^js @state/*nav-root (.getLength)))

(defn nav-to-block!
  [page-or-block opts]
  (nav-push! #(cc-blocks/page page-or-block opts)))

(defn nav-to-edit-block!
  [block opts]
  (nav-push! #(cc-blocks/edit-block-modal block opts)))
