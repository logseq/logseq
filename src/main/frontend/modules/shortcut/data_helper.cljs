(ns frontend.modules.shortcut.data-helper
  (:require [clojure.string :as str]
            [frontend.modules.shortcut.config :as config]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]))
(defonce binding-map
  (->> (vals config/default-config)
       (apply merge)
       (map (fn [[k {:keys [binding]}]]
              {k (or (state/get-shortcut k) binding)}))
       (into {})))

(defn- mod-key [shortcut]
  (str/replace shortcut #"(?i)mod"
               (if util/mac? "meta" "ctrl")))

(defn shortcut-binding
  [id]
  (let [shortcut (get binding-map id)]
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

;; returns a vector to preserve order
(defn binding-by-category [name]
  (let [dict (->> (vals config/default-config)
                  (apply merge)
                  (map (fn [[k {:keys [i18n]}]]
                         {k {:binding (get binding-map k)
                             :i18n    i18n}}))
                  (into {}))]
    (->> (config/category name)
         (mapv (fn [k] [k (k dict)])))))

(defn shortcut-map
  ([handler-id]
   (shortcut-map handler-id nil))
  ([handler-id state]
   (let [raw       (get config/default-config handler-id)
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

(defn decorate-namespace [k]
  (let [n (name k)
        ns (namespace k)]
    (keyword (str "shortcut." ns) n)))

(defn desc-helper []
  (->> (vals config/default-config)
       (apply merge)
       (map (fn [[k {:keys [desc]}]]
              {(decorate-namespace k) desc}))
       (into {})))

(defn category-helper []
  (->> config/category
       (map (fn [[k v]]
              {k (:doc (meta v))}))
       (into {})))

(defn decorate-binding [binding]
  (-> binding
      (str/replace "mod" (if util/mac? "cmd" "ctrl"))
      (str/replace "alt" (if util/mac? "opt" "alt"))
      (str/replace "shift+/" "?")
      (str/lower-case)))

(defn binding-for-display [k binding]
  (cond
    (false? binding)
    (cond
      (and util/mac? (= k :editor/kill-line-after))
      "disabled (system default: ctrl+k)"
      (and util/mac? (= k :editor/beginning-of-block))
      "disabled (system default: ctrl+a)"
      (and util/mac? (= k :editor/end-of-block))
      "disabled (system default: ctrl+e)"
      (and util/mac? (= k :editor/backward-kill-word))
      "disabled (system default: opt+delete)"
      :else
      "disabled")

    (string? binding)
    (decorate-binding binding)

    :else
    (->> binding
         (map decorate-binding)
         (str/join " | "))))
