(ns frontend.db-mixins
  (:require [frontend.db :as db]))

(defn clear-query-cache
  [key-f]
  {:will-unmount
   (fn [state]
     ;; FIXME: Each component should has a unique id, and each query id should
     ;; corresponds to a vector of those subscribed components, only remove
     ;; the query when there's no subscribed components.

     ;; (when-let [key (key-f state)]
     ;;   (db/remove-q! key))
     state)})
