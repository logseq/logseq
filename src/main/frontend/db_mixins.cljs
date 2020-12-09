(ns frontend.db-mixins
  (:require
            [frontend.db.react-queries :as react-queries]))

(def query
  {:wrap-render
   (fn [render-fn]
     (fn [state]
       (binding [react-queries/*query-component* (:rum/react-component state)]
         (render-fn state))))
   :will-unmount
   (fn [state]
     (react-queries/remove-query-component! (:rum/react-component state))
     state)})
