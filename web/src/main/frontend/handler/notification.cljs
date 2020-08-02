(ns frontend.handler.notification
  (:require [frontend.state :as state]))

(defn clear!
  [e]
  (swap! state/state assoc
         :notification/show? false
         :notification/content nil
         :notification/status nil))

(defn show!
  ([content status]
   (show! content status true))
  ([content status clear?]
   (swap! state/state assoc
          :notification/show? true
          :notification/content content
          :notification/status status)

   (when clear?
     (js/setTimeout clear! 3000))))
