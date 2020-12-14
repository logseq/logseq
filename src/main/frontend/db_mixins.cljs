(ns frontend.db-mixins
  (:require
    [frontend.db.react :as db-react]))

(def query
  {:wrap-render
   (fn [render-fn]
     (fn [state]
       (binding [db-react/*query-component* (:rum/react-component state)]
         (render-fn state))))
   :will-unmount
   (fn [state]
     (db-react/remove-query-component! (:rum/react-component state))
     state)})
