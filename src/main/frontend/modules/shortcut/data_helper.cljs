(ns frontend.modules.shortcut.data-helper
  (:require [borkdude.rewrite-edn :as rewrite]
            [clojure.set :refer [rename-keys] :as set]
            [clojure.string :as str]
            [cljs-bean.core :as bean]
            [frontend.context.i18n :refer [t]]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.file :as file]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.config :as config-handler])
  (:import [goog.ui KeyboardShortcutHandler]))

(declare get-group)

;; function vals->bindings is too time-consuming. Here we cache the results.
(defn- flatten-bindings-by-id
  [config user-shortcuts binding-only?]
  (->> (vals config)
       (apply merge)
       (map (fn [[id {:keys [binding] :as opts}]]
              {id (if binding-only?
                    (get user-shortcuts id binding)
                    (assoc opts :user-binding (get user-shortcuts id)
                                :handler-id (get-group id)
                                :id id))}))
       (into {})))

(defn- flatten-bindings-by-key
  [config user-shortcuts]
  (reduce-kv
    (fn [r handler-id vs]
      (reduce-kv
        (fn [r id {:keys [binding]}]
          (if-let [ks (get user-shortcuts id binding)]
            (let [ks (if (sequential? ks) ks [ks])]
              (reduce (fn [a k]
                        (let [k (shortcut-utils/undecorate-binding k)
                              k' (shortcut-utils/safe-parse-string-binding k)
                              k' (bean/->clj k')]
                          (-> a
                              (assoc-in [k' :key] k)
                              (assoc-in [k' :refs id] handler-id)))) r ks))
            r)) r vs))
    {} config))

(def m-flatten-bindings-by-id
  (util/memoize-last flatten-bindings-by-id))

(def m-flatten-bindings-by-key
  (util/memoize-last flatten-bindings-by-key))

(defn get-bindings
  []
  (m-flatten-bindings-by-id @shortcut-config/*config (state/shortcuts) true))

(defn get-bindings-keys-map
  []
  (m-flatten-bindings-by-key @shortcut-config/*config (state/shortcuts)))

(defn get-bindings-ids-map
  []
  (m-flatten-bindings-by-id @shortcut-config/*config (state/shortcuts) false))

(defn get-shortcut-desc
  [binding-map]
  (let [{:keys [id desc cmd]} binding-map
        desc (or desc (:desc cmd) (some-> id (shortcut-utils/decorate-namespace) (t)))]
    (if (or (nil? desc)
            (and (string? desc) (str/starts-with? desc "{Missing")))
      (str id) desc)))

(defn mod-key [shortcut]
  (when (string? shortcut)
    (str/replace shortcut #"(?i)mod"
                 (if util/mac? "meta" "ctrl"))))

(defn shortcut-binding
  "override by user custom binding"
  [id]
  (let [shortcut (get (get-bindings) id)]
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

(defn shortcut-item
  [id]
  (get (get-bindings-ids-map) id))

;; returns a vector to preserve order
(defn binding-by-category [name]
  (let [dict (get-bindings-ids-map)
        plugin? (= name :shortcut.category/plugins)]
    (->> (if plugin?
           (->> (keys dict) (filter #(str/starts-with? (str %) ":plugin.")))
           (shortcut-config/get-category-shortcuts name))
         (mapv (fn [k] [k (assoc (get dict k) :category name)])))))

(defn shortcut-map
  ([handler-id]
   (shortcut-map handler-id nil))
  ([handler-id state]
   (let [raw (get @shortcut-config/*config handler-id)
         handler-m (->> raw
                        (map (fn [[k {:keys [fn]}]]
                               {k fn}))
                        (into {}))
         before (-> raw meta :before)]
     (cond->> handler-m
              state (reduce-kv (fn [r k handle-fn]
                                 (let [handle-fn' (if (volatile? state)
                                                    (fn [*state & args] (apply handle-fn (cons @*state args)))
                                                    handle-fn)]
                                   (assoc r k (partial handle-fn' state))))
                               {})
              before (reduce-kv (fn [r k v]
                                  (assoc r k (before v)))
                                {})))))

;; if multiple bindings, gen seq for first binding only for now
(defn gen-shortcut-seq [id]
  (let [bindings (shortcut-binding id)]
    (if (false? bindings)
      []
      (-> bindings
          first
          (str/split #" |\+")))))

(defn binding-for-display [k binding]
  (let [tmp (cond
              (false? binding)
              (cond
                (and util/mac? (= k :editor/kill-line-after)) "system default: ctrl+k"
                (and util/mac? (= k :editor/beginning-of-block)) "system default: ctrl+a"
                (and util/mac? (= k :editor/end-of-block)) "system default: ctrl+e"
                (and util/mac? (= k :editor/backward-kill-word)) "system default: opt+delete"
                :else (t :keymap/disabled))

              (string? binding)
              (shortcut-utils/decorate-binding binding)

              :else
              (->> binding
                   (map shortcut-utils/decorate-binding)
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
  (->> @shortcut-config/*config
       (filter (fn [[_ v]] (contains? v k)))
       (map key)
       (first)))

(defn should-be-included-to-global-handler
  [from-handler-id]
  (if (contains? #{:shortcut.handler/pdf} from-handler-id)
    #{from-handler-id :shortcut.handler/global-prevent-default}
    #{from-handler-id}))

(defn get-conflicts-by-keys
  ([ks] (get-conflicts-by-keys ks :shortcut.handler/global-prevent-default {:group-global? true}))
  ([ks handler-id] (get-conflicts-by-keys ks handler-id {:group-global? true}))
  ([ks handler-id {:keys [exclude-ids group-global?]}]
   (let [global-handlers #{:shortcut.handler/editor-global
                           :shortcut.handler/global-non-editing-only
                           :shortcut.handler/global-prevent-default
                           :shortcut.handler/misc}
         ks-bindings (get-bindings-keys-map)
         handler-ids (should-be-included-to-global-handler handler-id)
         global? (when group-global? (seq (set/intersection global-handlers handler-ids)))]
     (->> (if (string? ks) [ks] ks)
          (map (fn [k]
                 (when-let [k' (shortcut-utils/undecorate-binding k)]
                   (let [k (shortcut-utils/safe-parse-string-binding k')
                         k (bean/->clj k)

                         same-leading-key?
                         (fn [[k' _]]
                           (when (sequential? k)
                             (or (= k k')
                                 (and (> (count k') (count k))
                                      (= (first k) (first k'))))))

                         into-conflict-refs
                         (fn [[k o]]
                           (when-let [{:keys [key refs]} o]
                             [k [key (reduce-kv (fn [r id handler-id']
                                                  (if (and
                                                        (not (contains? exclude-ids id))
                                                        (or (= handler-ids #{handler-id'})
                                                            (and (set? handler-ids) (contains? handler-ids handler-id'))
                                                            (and global? (contains? global-handlers handler-id'))))
                                                    (assoc r id handler-id')
                                                    r)
                                                  ) {} refs)]]))]

                     [k' (->> ks-bindings
                              (filterv same-leading-key?)
                              (mapv into-conflict-refs)
                              (remove #(empty? (second (second %1))))
                              (into {}))]
                     ))))
          (remove #(empty? (vals (second %1))))
          (into {})))))

(defn parse-conflicts-from-binding
  [from-binding target]
  (when-let [from-binding (and (string? target)
                               (sequential? from-binding)
                               (seq from-binding))]
    (when-let [target (some-> target (mod-key) (shortcut-utils/safe-parse-string-binding) (bean/->clj))]
      (->> from-binding
           (filterv
             #(when-let [from (some-> % (mod-key) (shortcut-utils/safe-parse-string-binding) (bean/->clj))]
                (or (= from target)
                    (and (or (= (count from) 1)
                             (= (count target) 1))
                         (= (first target) (first from))))))))))

(defn potential-conflict? [shortcut-id]
  (if-not (shortcut-binding shortcut-id)
    false
    (let [handler-id (get-group shortcut-id)
          shortcut-m (shortcut-map handler-id)
          parse-shortcut #(try
                            (KeyboardShortcutHandler/parseStringShortcut %)
                            (catch :default e
                              (js/console.error "[shortcut/parse-error]" (str % " - " (.-message e)))))
          bindings (->> (shortcut-binding shortcut-id)
                        (map mod-key)
                        (map parse-shortcut)
                        (map js->clj))
          rest-bindings (->> (map key shortcut-m)
                             (remove #{shortcut-id})
                             (map shortcut-binding)
                             (filter vector?)
                             (mapcat identity)
                             (map mod-key)
                             (map parse-shortcut)
                             (map js->clj))]

      (some? (some (fn [b] (some #{b} rest-bindings)) bindings)))))

(defn shortcut-data-by-id [id]
  (let [binding (shortcut-binding id)
        data (->> (vals @shortcut-config/*config)
                  (into {})
                  id)]
    (assoc
      data
      :binding
      (binding-for-display id binding))))

(defn shortcuts->commands [handler-id]
  (let [m (get @shortcut-config/*config handler-id)]
    (->> m
         (map (fn [[id _]] (-> (shortcut-data-by-id id)
                               (assoc :id id :handler-id handler-id)
                               (rename-keys {:binding :shortcut
                                             :fn      :action})))))))
