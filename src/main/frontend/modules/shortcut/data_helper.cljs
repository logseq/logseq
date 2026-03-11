(ns frontend.modules.shortcut.data-helper
  (:require [cljs-bean.core :as bean]
            [clojure.set :refer [rename-keys] :as set]
            [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]))

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
  (m-flatten-bindings-by-id @shortcut-config/*config (state/custom-shortcuts) true))

(defn get-bindings-keys-map
  []
  (m-flatten-bindings-by-key @shortcut-config/*config (state/custom-shortcuts)))

(defn get-bindings-ids-map
  []
  (m-flatten-bindings-by-id @shortcut-config/*config (state/custom-shortcuts) false))

(defn get-shortcut-desc
  [binding-map]
  (let [{:keys [id desc cmd]} binding-map
        desc (or desc (:desc cmd) (some-> id (shortcut-utils/decorate-namespace) (t)))]
    (if (or (nil? desc)
            (and (string? desc) (string/starts-with? desc "{Missing")))
      (str id) desc)))

(defn mod-key [shortcut]
  (when (string? shortcut)
    (string/replace shortcut #"(?i)mod"
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

(defn shortcut-item
  [id]
  (get (get-bindings-ids-map) id))

;; returns a vector to preserve order
(defn binding-by-category [name]
  (let [dict (get-bindings-ids-map)
        plugin? (= name :shortcut.category/plugins)]
    (->> (if plugin?
           (->> (keys dict) (filter #(string/starts-with? (str %) ":plugin.")))
           (shortcut-config/get-category-shortcuts name))
         (keep (fn [k] (when-let [m (get dict k)]
                         [k (assoc m :category name)])))
         (vec))))

(defn shortcuts-map-full
  []
  (->> (vals @shortcut-config/*config)
       (into {})))

(defn shortcuts-map-by-handler-id
  ([handler-id]
   (shortcuts-map-by-handler-id handler-id nil))
  ([handler-id state]
   (let [raw (get @shortcut-config/*config handler-id)
         raw' (into {} raw)
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
       before (reduce-kv (fn [r k f]
                           (assoc r k (before f (get raw' k))))
                         {})))))

;; if multiple bindings, gen seq for first binding only for now
(defn gen-shortcut-seq [id]
  (let [bindings (shortcut-binding id)]
    (if (false? bindings)
      []
      (-> bindings
          last
          (string/split #" |\+")))))

(defn binding-for-display [k binding]
  (let [tmp (cond
              (false? binding)
              (cond
                (and util/mac? (= k :editor/kill-line-after)) "ctrl k"
                (and util/mac? (= k :editor/beginning-of-block)) "ctrl a"
                (and util/mac? (= k :editor/end-of-block)) "ctrl e"
                (and util/mac? (= k :editor/backward-kill-word)) "opt delete"
                :else (t :keymap/disabled))

              (string? binding)
              (shortcut-utils/decorate-binding binding)

              :else
              (->> binding
                   (map shortcut-utils/decorate-binding)
                   (string/join " | ")))]

    ;; Display "cmd" rather than "meta" to the user to describe the Mac
    ;; mod key, because that's what the Mac keyboards actually say.
    (string/replace tmp "meta" "cmd")))

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

(defn- handlers-co-active?
  "Two handler groups conflict (can be active simultaneously) unless one is
   editing-only and the other is non-editing-only — those are mutually exclusive
   at runtime."
  [h1 h2]
  (let [editing-only     #{:shortcut.handler/editor-global
                           :shortcut.handler/block-editing-only}
        non-editing-only #{:shortcut.handler/global-non-editing-only}]
    (not (or (and (contains? editing-only h1) (contains? non-editing-only h2))
             (and (contains? non-editing-only h1) (contains? editing-only h2))))))

(defn get-conflicts-by-keys
  ([ks] (get-conflicts-by-keys ks :shortcut.handler/global-prevent-default {:group-global? true}))
  ([ks handler-id] (get-conflicts-by-keys ks handler-id {:group-global? true}))
  ([ks handler-id {:keys [exclude-ids group-global?]}]
   (let [global-handlers #{:shortcut.handler/editor-global
                           :shortcut.handler/global-non-editing-only
                           :shortcut.handler/global-prevent-default}
         ks-bindings (get-bindings-keys-map)
         handler-ids (should-be-included-to-global-handler handler-id)
         global? (when group-global? (seq (set/intersection global-handlers handler-ids)))]
     (->> (if (string? ks) [ks] ks)
          (map (fn [k]
                 (when-let [k' (shortcut-utils/undecorate-binding k)]
                   (let [input-binding (bean/->clj (shortcut-utils/safe-parse-string-binding k'))

                         same-leading-key?
                         (fn [[k' _]]
                           (when (sequential? input-binding)
                             (or (= input-binding k')
                                 (and (> (count k') (count input-binding))
                                      (= (first input-binding) (first k'))))))

                         into-conflict-refs
                         (fn [[k o]]
                           (when-let [{:keys [key refs]} o]
                             [k [key (reduce-kv (fn [r id handler-id']
                                                  (if (and
                                                       (not (contains? exclude-ids id))
                                                       (or (= handler-ids #{handler-id'})
                                                           (and (set? handler-ids) (contains? handler-ids handler-id'))
                                                           (and global?
                                                                (contains? global-handlers handler-id')
                                                                (every? #(handlers-co-active? % handler-id') handler-ids)
                                                                ;; For cross-handler conflicts, only exact key
                                                                ;; matches are blocking. Chord prefix matches
                                                                ;; (e.g., mod+c vs mod+c mod+s) live on separate
                                                                ;; handler instances and don't conflict at runtime.
                                                                (= input-binding k))))
                                                    (assoc r id handler-id')
                                                    r))
                                                {} refs)]]))]

                     [k' (->> ks-bindings
                              (filterv same-leading-key?)
                              (mapv into-conflict-refs)
                              (remove #(empty? (second (second %1))))
                              (into {}))]))))

          (remove #(empty? (vals (second %1))))
          (into {})))))

(def handler-display-labels
  {:shortcut.handler/block-editing-only      "editing mode"
   :shortcut.handler/editor-global           "editor"
   :shortcut.handler/global-prevent-default  "global"
   :shortcut.handler/global-non-editing-only "navigation"
   :shortcut.handler/misc                    "global"
   :shortcut.handler/pdf                     "PDF viewer"
   :shortcut.handler/auto-complete           "autocomplete"
   :shortcut.handler/cards                   "flashcards"
   :shortcut.handler/date-picker             "date picker"})

(defn get-cross-context-conflicts
  "Like get-conflicts-by-keys but returns conflicts from OTHER handler contexts only.
   Used for non-blocking amber warnings when a key is shared across contexts."
  [ks handler-id {:keys [exclude-ids]}]
  (let [global-handlers #{:shortcut.handler/editor-global
                          :shortcut.handler/global-non-editing-only
                          :shortcut.handler/global-prevent-default}
        ks-bindings (get-bindings-keys-map)
        caller-handlers (should-be-included-to-global-handler handler-id)
        caller-is-global? (seq (set/intersection global-handlers caller-handlers))]
    (->> (if (string? ks) [ks] ks)
         (map (fn [k]
                (when-let [k' (shortcut-utils/undecorate-binding k)]
                  (let [k-parsed (bean/->clj (shortcut-utils/safe-parse-string-binding k'))

                        same-leading-key?
                        (fn [[k' _]]
                          (when (sequential? k-parsed)
                            (or (= k-parsed k')
                                (and (> (count k') (count k-parsed))
                                     (= (first k-parsed) (first k'))))))

                        cross-context-ref
                        (fn [[k o]]
                          (when-let [{:keys [key refs]} o]
                            [k [key (reduce-kv
                                     (fn [r id handler-id']
                                       (if (and (not (contains? exclude-ids id))
                                                (not (contains? caller-handlers handler-id'))
                                                (not (and caller-is-global?
                                                          (contains? global-handlers handler-id'))))
                                         (assoc r id handler-id')
                                         r))
                                     {} refs)]]))]

                    [k' (->> ks-bindings
                             (filterv same-leading-key?)
                             (mapv cross-context-ref)
                             (remove #(empty? (second (second %))))
                             (into {}))]))))
         (remove #(empty? (vals (second %))))
         (into {}))))

(defn conflict-context-label
  "Get the human-readable context label for the first conflict in a conflicts map."
  [conflicts-map]
  (->> (for [[_ ks] conflicts-map
             v (vals ks)
             :let [refs (second v)]
             [_ handler-id'] refs]
         (get handler-display-labels handler-id'))
       (first)))

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

(defn shortcut-data-by-id [id]
  (let [binding (shortcut-binding id)
        data (-> (shortcuts-map-full) id)]
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
