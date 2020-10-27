(ns frontend.db-mixins
  (:require [frontend.db :as db]
            [rum.core :as rum]))

(def query
  {:wrap-render
   (fn [render-fn]
     (fn [state]
       (binding [db/*query-component* (:rum/react-component state)]
         (render-fn state))))
   :will-unmount
   (fn [state]
     (db/remove-query-component! (:rum/react-component state))
     state)})
