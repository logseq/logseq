(ns frontend.db-mixins
  (:require [frontend.db.react :as react]))

(def query
  {:wrap-render
   (fn [render-fn]
     (fn [state]
       (binding [react/*query-component* (:rum/react-component state)]
         (render-fn state))))
   :will-unmount
   (fn [state]
     (react/remove-query-component! (:rum/react-component state))
     state)})
