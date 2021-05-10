(ns frontend.modules.shortcut.data-helper
  (:require [frontend.modules.shortcut.data :refer [data]]))

(defn binding-map []
  (->> (vals data)
       (apply merge)
       (map (fn [[k {:keys [binding]}]]
              {k binding}))
       (into {})))

(defn shortcut-map
  ([handler-id]
   (shortcut-map handler-id nil))
  ([handler-id state]
   (let [raw       (get data handler-id)
         handler-m (->> raw
                        (map (fn [[k {:keys [fn]}]]
                               {k fn}))
                        (into {}))
         before    (-> raw meta :before)]
     (cond->> handler-m
       state  (reduce-kv (fn [r k handle-fn]
                           (assoc r k (partial handle-fn state)))
                         {})
       before (reduce-kv (fn [r k v]
                           (assoc r k (before v)))
                         {})))))
