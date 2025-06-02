(ns capacitor.nav
  (:require [capacitor.components.page :as page]
            [capacitor.state :as state]
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

(comment
  (defn nav-to-block!
    [page-or-block]
    (nav-push! #(page/page page-or-block))))
