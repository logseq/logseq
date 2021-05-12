(ns frontend.modules.shortcut.data-helper
  (:require [frontend.modules.shortcut.config :refer [default-config]]
            [lambdaisland.glogi :as log]
            [frontend.util :as util]
            [clojure.string :as str]
            [frontend.state :as state]))

(defn binding-map []
  (->> (vals default-config)
       (apply merge)
       (map (fn [[k {:keys [binding]}]]
              {k (or (state/get-shortcut k) binding)}))
       (into {})))

(defn- mod-key [shortcut]
  (str/replace shortcut #"(?i)mod"
               (if util/mac? "meta" "ctrl")))

(defn shortcut-binding
  [id]
  (let [shortcut (get (binding-map) id)]
    (cond
      (nil? shortcut)
      (log/error :shortcut/binding-not-found {:id id})

      (false? shortcut)
      (log/debug :shortcut/disabled {:id id})

      :else
      (->>
       (if (string? shortcut)
         [shortcut]
         shortcut)
       (mapv mod-key)))))

(defn binding-by-tag
  [tag]
  (let [keys (->> (vals default-config)
                  (apply merge)
                  (map (fn [[k {:keys [tags] :as v}]]
                         (when (and tags (tags tag)) k)))
                  (remove nil?))]
    (select-keys (binding-map) keys)))

#_
(defn decorate-namespace [k]
  (let [n (name k)
        ns (namespace k)]
    (keyword (str "shortcut." ns) n)))

(defn shortcut-map
  ([handler-id]
   (shortcut-map handler-id nil))
  ([handler-id state]
   (let [raw       (get default-config handler-id)
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
