(ns frontend.db-mixins
  "Rum mixins that depend on db"
  (:require [frontend.db.react :as react]))

(def query
  {:init
   (fn [state]
     (assoc state :reactive-queries (atom #{})))
   :wrap-render
   (fn [render-fn]
     (fn [state]
       (binding [react/*query-component* (:rum/react-component state)
                 react/*reactive-queries* (:reactive-queries state)]
         (render-fn state))))
   :will-unmount
   (fn [state]
     (react/remove-query-component! (:rum/react-component state))
     state)})
