(ns frontend.modules.shortcut.data-helper
  (:require [borkdude.rewrite-edn :as rewrite]
            [clojure.string :as str]
            [clojure.set :refer [rename-keys]]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.file :as file]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.config :as config-handler])
  (:import [goog.ui KeyboardShortcutHandler]))

;; function vals->bindings is too time-consuming. Here we cache the results.
(defn- flatten-key-bindings
  [config]
  (->> config
       (into {})
       (map (fn [[k {:keys [binding]}]]
              {k binding}))
       (into {})))

(def m-flatten-key-bindings (util/memoize-last flatten-key-bindings))

(defn get-bindings
  []
  (m-flatten-key-bindings (vals @shortcut-config/config)))

(defn- mod-key [shortcut]
  (str/replace shortcut #"(?i)mod"
               (if util/mac? "meta" "ctrl")))

(defn shortcut-binding
  [id]
  (let [shortcut (get (state/shortcuts) id
                      (get (get-bindings) id))]
    (cond
      (nil? shortcut)
      (log/warn :shortcut/binding-not-found {:id id})

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

(defn shortcut-cmd
  [id]
  (get @shortcut-config/*shortcut-cmds id))

;; returns a vector to preserve order
(defn binding-by-category [name]
  (let [dict    (->> (vals @shortcut-config/config)
                     (apply merge)
                     (map (fn [[k _]]
                            {k {:binding (shortcut-binding k)}}))
                     (into {}))
        plugin? (= name :shortcut.category/plugins)]
    (->> (if plugin?
           (->> (keys dict) (filter #(str/starts-with? (str %) ":plugin.")))
           (shortcut-config/category name))
         (mapv (fn [k] [k (k dict)])))))

(defn shortcut-map
  ([handler-id]
   (shortcut-map handler-id nil))
  ([handler-id state]
   (let [raw       (get @shortcut-config/config handler-id)
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
    (keyword (str "command." ns) n)))

(defn decorate-binding [binding]
  (-> (if (string? binding) binding (str/join "+"  binding))
      (str/replace "mod" (if util/mac? "⌘" "ctrl"))
      (str/replace "alt" (if util/mac? "opt" "alt"))
      (str/replace "shift+/" "?")
      (str/replace "left" "←")
      (str/replace "right" "→")
      (str/replace "shift" "⇧")
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
                (and util/mac? (= k :editor/kill-line-after))    "system default: ctrl+k"
                (and util/mac? (= k :editor/beginning-of-block)) "system default: ctrl+a"
                (and util/mac? (= k :editor/end-of-block))       "system default: ctrl+e"
                (and util/mac? (= k :editor/backward-kill-word)) "system default: opt+delete"
                :else "disabled")

              (string? binding)
              (decorate-binding binding)

              :else
              (->> binding
                   (map decorate-binding)
                   (str/join " | ")))]

    ;; Display "cmd" rather than "meta" to the user to describe the Mac
    ;; mod key, because that's what the Mac keyboards actually say.
    (str/replace tmp "meta" "cmd")))

;; Given the displayed binding, prepare it to be put back into config.edn
(defn binding-for-storage [binding]
  (str/replace binding "cmd" "meta"))

(defn remove-shortcut [k]
  (let [repo (state/get-current-repo)
        path (config/get-repo-config-path)]
    (when-let [result (some-> (db/get-file path)
                              (config-handler/parse-repo-config))]
      (when-let [new-content (and (:shortcuts result)
                                  (-> (rewrite/update
                                        result
                                        :shortcuts
                                        #(dissoc (rewrite/sexpr %) k))
                                      (str)))]
        (repo-config-handler/set-repo-config-state! repo new-content)
        (file/set-file-content! repo path new-content)))))

(defn get-group
  "Given shortcut key, return handler group
  eg: :editor/new-line -> :shortcut.handler/block-editing-only"
  [k]
  (->> @shortcut-config/config
       (filter (fn [[_ v]] (contains? v k)))
       (map key)
       (first)))

(defn potential-conflict? [k]
  (if-not (shortcut-binding k)
    false
    (let [handler-id    (get-group k)
          shortcut-m    (shortcut-map handler-id)
          parse-shortcut #(try
                           (KeyboardShortcutHandler/parseStringShortcut %)
                           (catch :default e
                             (js/console.error "[shortcut/parse-error]" (str % " - " (.-message e)))))
          bindings      (->> (shortcut-binding k)
                             (map mod-key)
                             (map parse-shortcut)
                             (map js->clj))
          rest-bindings (->> (map key shortcut-m)
                             (remove #{k})
                             (map shortcut-binding)
                             (filter vector?)
                             (mapcat identity)
                             (map mod-key)
                             (map parse-shortcut)
                             (map js->clj))]

      (some? (some (fn [b] (some #{b} rest-bindings)) bindings)))))

(defn shortcut-data-by-id [id]
  (let [binding (shortcut-binding id)
        data    (->> (vals @shortcut-config/config)
                     (into  {})
                     id)]
    (assoc
      data
      :binding
      (binding-for-display id binding))))

(defn shortcuts->commands [handler-id]
  (let [m (get @shortcut-config/config handler-id)]
    (->> m
         (map (fn [[id _]] (-> (shortcut-data-by-id id)
                               (assoc :id id :handler-id handler-id)
                               (rename-keys {:binding :shortcut
                                             :fn      :action})))))))
