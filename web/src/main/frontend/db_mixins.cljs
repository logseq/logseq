(ns frontend.db-mixins
  (:require [frontend.db :as db]))

(defn clear-query-cache
  [key-f]
  {:will-unmount (fn [state]
                   (when-let [key (key-f state)]
                     (db/remove-q! key))
                   state)})
