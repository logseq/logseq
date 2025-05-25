(ns capacitor.nav
  (:require [capacitor.state :as state]
            [capacitor.components.page :as page]
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
  (nav-push! #(page/page page-or-block opts)))
