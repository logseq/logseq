(ns frontend.modules.shortcut.data-helper
  (:require [borkdude.rewrite-edn :as rewrite]
            [clojure.string :as str]
            [clojure.set :refer [rename-keys]]
            [frontend.config :as cfg]
            [frontend.db :as db]
            [frontend.handler.file :as file]
            [frontend.modules.shortcut.config :as config]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [frontend.handler.common :as common-handler])
  (:import [goog.ui KeyboardShortcutHandler]))

(defonce default-binding
  (->> (vals config/default-config)
       (into {})
       (map (fn [[k {:keys [binding]}]]
              {k binding}))
       (into {})))

(defn- mod-key [shortcut]
  (str/replace shortcut #"(?i)mod"
               (if util/mac? "meta" "ctrl")))

(defn shortcut-binding
  [id]
  (let [shortcut (get (state/shortcuts) id
                      (get default-binding id))]
    (cond
      (nil? shortcut)
      (log/error :shortcut/binding-not-found {:id id})

      (false? shortcut)
      (do
        (log/debug :shortcut/disabled {:id id})
        false)

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
                  (map (fn [[k _]]
                         {k {:binding (shortcut-binding k)}}))
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
      (str/replace "open-square-bracket" "[")
      (str/replace "close-square-bracket" "]")
      (str/lower-case)))

;; if multiple bindings, gen seq for first binding only for now
(defn gen-shortcut-seq [id]
  (let [bindings (shortcut-binding id)]
    (if (false? bindings)
      []
      (-> bindings
          first
          (str/split  #" |\+")))))

(defn binding-for-display [k binding]
  (let [tmp (cond
              (false? binding)
              (cond
                (and util/mac? (= k :editor/kill-line-after))    "disabled (system default: ctrl+k)"
                (and util/mac? (= k :editor/beginning-of-block)) "disabled (system default: ctrl+a)"
                (and util/mac? (= k :editor/end-of-block))       "disabled (system default: ctrl+e)"
                (and util/mac? (= k :editor/backward-kill-word)) "disabled (system default: opt+delete)"
                :else "disabled")

              (string? binding)
              (decorate-binding binding)

              :else
              (->> binding
                   (map decorate-binding)
                   (str/join " | ")))]

    ;; Display "cmd" rather than "meta" to the user to describe the Mac
    ;; mod key, because that's what the Mac keyboards actually say.
    (clojure.string/replace tmp "meta" "cmd")))


(defn remove-shortcut [k]
  (let [repo (state/get-current-repo)
        path (cfg/get-config-path)]
    (when-let [content (db/get-file-no-sub path)]
      (let [result (try
                     (rewrite/parse-string content)
                     (catch js/Error e
                       (println "Parsing config file failed: ")
                       (js/console.dir e)
                       {}))
            new-result (rewrite/update
                        result
                        :shortcuts
                        #(dissoc (rewrite/sexpr %) k))]
        (let [new-content (str new-result)]
          (common-handler/reset-config! repo new-content)
          (file/set-file-content! repo path new-content))))))

(defn get-group
  "Given shortcut key, return handler group
  eg: :editor/new-line -> :shortcut.handler/block-editing-only"
  [k]
  (->> config/default-config
       (filter (fn [[_ v]] (contains? v k)))
       (map key)
       (first)))

(defn potential-confilct? [k]
  (if-not (shortcut-binding k)
    false
    (let [handler-id    (get-group k)
          shortcut-m    (shortcut-map handler-id)
          bindings      (->> (shortcut-binding k)
                            (map mod-key)
                            (map KeyboardShortcutHandler/parseStringShortcut)
                            (map js->clj))
          rest-bindings (->> (map key shortcut-m)
                             (remove #{k})
                             (map shortcut-binding)
                             (filter vector?)
                             (mapcat identity)
                             (map mod-key)
                             (map KeyboardShortcutHandler/parseStringShortcut)
                             (map js->clj))]

      (some? (some (fn [b] (some #{b} rest-bindings)) bindings)))))

(defn shortcut-data-by-id [id]
  (let [binding (shortcut-binding id)
        data    (->> (vals config/default-config)
                     (into  {})
                     id)]
    (when binding
      (assoc
       data
       :binding
       (binding-for-display id binding)))))

(defn shortcuts->commands [handler-id]
  (let [m (get config/default-config handler-id)]
    (->> m
         (map (fn [[id _]] (-> (shortcut-data-by-id id)
                               (assoc :id id)
                               (rename-keys {:binding :shortcut
                                             :fn      :action})))))))
