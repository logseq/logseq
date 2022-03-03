(ns frontend.db.query-dsl
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.reader :as reader]
            [clojure.core]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.date :as date]
            [frontend.db.model :as model]
            [frontend.db.query-react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.db.rules :as rules]
            [frontend.template :as template]
            [frontend.text :as text]
            [frontend.util :as util]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]))


;; Query fields:

;; and
;; or
;; not
;; between
;;   Example: (between -7d +7d)
;;            (between created-at -1d today)
;;            (between last-modified-at -1d today)
;; [[page-ref]]
;; property (block)
;; task (block)
;; priority (block)
;; page
;; page-property (page)
;; page-tags (page)
;; all-page-tags
;; project (block, TBD)

;; Sort by (field, asc/desc):

;; created_at
;; last_modified_at

;; (sort-by last_modified_at asc)

(defonce remove-nil? (partial remove nil?))

(defn query-wrapper
  [where blocks?]
  (when where
    (let [q (if blocks?                   ; FIXME: it doesn't need to be either blocks or pages
              `[:find (~'pull ~'?b ~model/block-attrs)
                :in ~'$ ~'%
                :where]
              '[:find (pull ?p [*])
                :in $ %
                :where])
          result (if (coll? (first where))
                   (apply conj q where)
                   (conj q where))]
      (prn "Datascript query: " result)
      result)))

;; (between -7d +7d)
(defn- ->journal-day-int [input]
  (let [input (string/lower-case (name input))]
    (cond
      (= "today" input)
      (db-utils/date->int (t/today))

      (= "yesterday" input)
      (db-utils/date->int (t/yesterday))

      (= "tomorrow" input)
      (db-utils/date->int (t/plus (t/today) (t/days 1)))

      (text/page-ref? input)
      (let [input (-> (text/page-ref-un-brackets! input)
                      (string/replace ":" "")
                      (string/capitalize))]
        (when (date/valid-journal-title? input)
          (date/journal-title->int input)))

      :else
      (let [duration (util/parse-int (subs input 0 (dec (count input))))
            kind (last input)
            tf (case kind
                 "y" t/years
                 "m" t/months
                 "w" t/weeks
                 t/days)]
        (db-utils/date->int (t/plus (t/today) (tf duration)))))))

(defn- ->timestamp [input]
  (let [input (string/lower-case (name input))]
    (cond
      (= "now" input)
      (util/time-ms)

      (= "today" input)
      (tc/to-long (t/today))

      (= "yesterday" input)
      (tc/to-long (t/yesterday))

      (= "tomorrow" input)
      (tc/to-long (t/plus (t/today) (t/days 1)))

      (text/page-ref? input)
      (let [input (-> (text/page-ref-un-brackets! input)
                      (string/replace ":" "")
                      (string/capitalize))]
        (when (date/valid-journal-title? input)
          (date/journal-title->long input)))

      :else
      (let [duration (util/parse-int (subs input 0 (dec (count input))))
            kind (last input)
            tf (case kind
                 "y" t/years
                 "m" t/months
                 "w" t/weeks
                 "h" t/hours
                 "n" t/minutes          ; min
                 t/days)]
        (tc/to-long (t/plus (t/today) (tf duration)))))))

(defn uniq-symbol
  [counter prefix]
  (let [result (symbol (str prefix (when-not (zero? @counter)
                                     @counter)))]
    (swap! counter inc)
    result))

(defn- collect-vars
  [l]
  (let [vars (atom #{})]
    (walk/postwalk
     (fn [f]
       (when (and (symbol? f) (= \? (first (name f))))
         (swap! vars conj f))
       f)
     l)
    @vars))

;; TODO: Convert ->*query fns to rules
(defn ->property-query
  ([k v]
   (->property-query k v '?v))
  ([k v sym]
   [['?b :block/properties '?prop]
    [(list 'missing? '$ '?b :block/name)]
    [(list 'get '?prop (keyword k)) sym]
    (list
     'or
     [(list '= sym v)]
     [(list 'contains? sym v)]
     ;; For integer pages that aren't strings
     [(list 'contains? sym (str v))])]))

(defn- build-query-property-two-arg
  [e current-filter counter]
  (let [k (string/replace (name (nth e 1)) "_" "-")
        v (nth e 2)
        v (if-not (nil? v)
            (text/parse-property k v)
            v)
        v (if (coll? v) (first v) v)
        sym (if (= current-filter 'or)
              '?v
              (uniq-symbol counter "?v"))]
    (->property-query k v sym)))

(defn- build-query-and-or-not-result
  [fe clauses current-filter nested-and?]
  (cond
    (= fe 'not)
    (if (every? list? clauses)
      (cons fe (seq clauses))
      (let [clauses (if (coll? (first clauses))
                      (apply concat clauses)
                      clauses)
            clauses (if (and (= 1 (count clauses))
                             (= 'and (ffirst clauses)))
                      ;; unflatten
                      (rest (first clauses))
                      clauses)]
        (cons fe (seq clauses))))

    (coll? (first clauses))
    (cond
      (= current-filter 'not)
      (->> (apply concat clauses)
           (apply list fe))

      (or (= current-filter 'or)
          nested-and?)
      (if (list? (first clauses))
          (cons 'and clauses)
          (apply concat clauses))

      :else
      (->> (map (fn [result]
                  (if (list? result)
                    result
                    (let [result (if (vector? (ffirst result))
                                   (apply concat result)
                                   result)]
                      (cons 'and (seq result))))) clauses)
           (apply list fe)))

    :else
    (apply list fe clauses)))

(declare build-query)

(defn- build-query-and-or-not
  [repo e {:keys [current-filter vars] :as env} level fe]
  (let [raw-clauses (map (fn [form]
                           (build-query repo form (assoc env :current-filter fe) (inc level)))
                         (rest e))
        clauses (->> raw-clauses
                     (map :query)
                     remove-nil?
                     (distinct))
        nested-and? (and (= fe 'and) (= current-filter 'and))]
    (when (seq clauses)
      (let [result (build-query-and-or-not-result
                    fe clauses current-filter nested-and?)
            vars' (set/union (set @vars) (collect-vars result))
            query (cond
                    ;; TODO: more thoughts
                    (and (= current-filter 'and)
                         (= 'or fe)
                         (= #{'?b} vars'))
                    [(concat result [['?b]])]

                    nested-and?
                    result

                    (and (zero? level) (= 'and fe))
                    (if (list? (first clauses))
                      result
                      (distinct (apply concat clauses)))

                    (and (zero? level) (= 'or fe))
                    result

                    :else
                    [result])]
        (reset! vars vars')
        {:query query
         :rules (distinct (mapcat :rules raw-clauses))}))))

(defn- build-query-between-two-arg
  [e]
  (let [start (->journal-day-int (nth e 1))
         end (->journal-day-int (nth e 2))
         [start end] (sort [start end])]
    [['?b :block/page '?p]
     ['?p :block/journal? true]
     ['?p :block/journal-day '?d]
     [(list '>= '?d start)]
     [(list '<= '?d end)]]))

(defn- build-query-property-one-arg
  [e]
  (let [k (string/replace (name (nth e 1)) "_" "-")]
    [['?b :block/properties '?prop]
     [(list 'missing? '$ '?b :block/name)]
     [(list 'get '?prop (keyword k)) '?prop-v]
     [true]]))

(defn- build-query-todo
  [e]
  (let [markers (if (coll? (first (rest e)))
                  (first (rest e))
                  (rest e))]
    (when (seq markers)
      (let [markers (set (map (comp string/upper-case name) markers))]
        {:query (list 'task '?b markers)
         :rules [:task]}))))

(defn- build-query-priority
  [e]
  (let [priorities (if (coll? (first (rest e)))
                     (first (rest e))
                     (rest e))]
    (when (seq priorities)
      (let [priorities (set (map (comp string/upper-case name) priorities))]
        {:query (list 'priority '?b priorities)
         :rules [:priority]}))))

(defn- build-page-property
  [e]
  (let [[k v] (rest e)
        k (string/replace (name k) "_" "-")]
    (if (some? v)
      (let [v' (text/parse-property k v)
            val (if (coll? v') (first v') v')]
        {:query (list 'page-property '?p (keyword k) val)
         :rules [:page-property]})
      {:query (list 'has-page-property '?p (keyword k))
       :rules [:has-page-property]})))

(defn- build-query-page-tags
  [e]
  (let [tags (if (coll? (first (rest e)))
               (first (rest e))
               (rest e))
        tags (map (comp string/lower-case name) tags)]
    (when (seq tags)
      (let [tags (set (map (comp text/page-ref-un-brackets! string/lower-case name) tags))]
        {:query (list 'page-tags '?p tags)
         :rules [:page-tags]}))))

(defn- build-query-sort-by
  [e sort-by]
  (let [[k order] (rest e)
             order (if (and order (contains? #{:asc :desc}
                                             (keyword (string/lower-case (name order)))))
                     (keyword (string/lower-case (name order)))
                     :desc)
             k (-> (string/lower-case (name k))
                   (string/replace "_" "-"))
             get-value (cond
                         (= k "created-at")
                         :block/created-at

                         (= k "updated-at")
                         :block/updated-at

                         :else
                         #(get-in % [:block/properties k]))
             comp (if (= order :desc) >= <=)]
         (reset! sort-by
                 (fn [result]
                   (->> result
                        flatten
                        (clojure.core/sort-by get-value comp))))
         nil))

(defn ^:large-vars/cleanup-todo build-query
  ([repo e env]
   (build-query repo e (assoc env :vars (atom {})) 0))
  ([repo e {:keys [sort-by blocks? sample counter current-filter] :as env} level]
   ;; TODO: replace with multi-methods for extensibility.
   (let [fe (first e)
         fe (when fe (symbol (string/lower-case (name fe))))
         page-ref? (text/page-ref? e)]
     (when (or (and page-ref?
                    (not (contains? #{'page-property 'page-tags} (:current-filter env))))
               (contains? #{'between 'property 'todo 'task 'priority 'sort-by 'page} fe))
       (reset! blocks? true))
     (cond
       (nil? e)
       nil

       page-ref?
       (let [page-name (-> (text/page-ref-un-brackets! e)
                           (util/page-name-sanity-lc))]
         {:query [['?b :block/path-refs [:block/name page-name]]]})

       (string? e)                      ; block content full-text search, could be slow
       (do
         (reset! blocks? true)
         {:query
          [['?b :block/content '?content]
           [(list 'clojure.string/includes? '?content e)]]})

       (contains? #{'and 'or 'not} fe)
       (build-query-and-or-not repo e env level fe)

       (and (= 'between fe)
            (= 3 (count e)))
       {:query (build-query-between-two-arg e)}

       ;; (between created_at -1d today)
       (and (= 'between fe)
            (= 4 (count e)))
       (let [k (-> (second e)
                   (name)
                   (string/lower-case)
                   (string/replace "-" "_"))]
         (when (contains? #{"created_at" "last_modified_at"} k)
           (let [start (->timestamp (nth e 2))
                  end (->timestamp (nth e 3))]
             (when (and start end)
               (let [[start end] (sort [start end])
                     sym '?v]
                 {:query [['?b :block/properties '?prop]
                          [(list 'get '?prop k) sym]
                          [(list '>= sym start)]
                          [(list '< sym end)]]})))))

       (and (= 'property fe)
            (= 3 (count e)))
       {:query (build-query-property-two-arg e current-filter counter)}

       (and (= 'property fe)
            (= 2 (count e)))
       {:query (build-query-property-one-arg e)}

       (or (= 'todo fe) (= 'task fe))
       (build-query-todo e)

       (= 'priority fe)
       (build-query-priority e)

       (= 'sort-by fe)
       (build-query-sort-by e sort-by)

       (= 'page fe)
       (let [page-name (text/page-ref-un-brackets! (str (first (rest e))))
             page-name (util/page-name-sanity-lc page-name)]
         {:query [['?b :block/page [:block/name page-name]]]})

       (and (= 'namespace fe)
            (= 2 (count e)))
       (let [page-name (text/page-ref-un-brackets! (str (first (rest e))))
             page (util/page-name-sanity-lc page-name)]
         (when-not (string/blank? page)
           {:query [['?p :block/namespace '?parent]
                    ['?parent :block/name page]]}))

       (= 'page-property fe)
       (build-page-property e)

       (= 'page-tags fe)
       (build-query-page-tags e)

       (= 'all-page-tags fe)
       {:query (list 'all-page-tags '?p)
        :rules [:all-page-tags]}

       (= 'sample fe)
       (when-let [num (second e)]
         (when (integer? num)
           (reset! sample num))
         nil)

       :else
       nil))))

(defn- pre-transform
  [s]
  (some-> s
          (string/replace text/page-ref-re "\"[[$1]]\"")
          (string/replace text/between-re (fn [[_ x]]
                                            (->> (string/split x #" ")
                                                 (remove string/blank?)
                                                 (map (fn [x]
                                                        (if (or (contains? #{"+" "-"} (first x))
                                                                (and (util/safe-re-find #"\d" (first x))
                                                                     (some #(string/ends-with? x %) ["y" "m" "d" "h" "min"])))
                                                          (keyword (name x))
                                                          x)))
                                                 (string/join " ")
                                                 (util/format "(between %s)"))))))

(defn- add-bindings!
  [form q]
  (let [forms (set (flatten q))
        syms ['?b '?p 'not]
        [b? p? not?] (-> (set/intersection (set syms) forms)
                         (map syms))
        or? (contains? (set (flatten form)) 'or)]
    (cond
      not?
      (cond
        (and b? p?)
        (concat [['?b :block/uuid] ['?p :block/name] ['?b :block/page '?p]] q)

        b?
        (concat [['?b :block/uuid]] q)

        p?
        (concat [['?p :block/name]] q)

        :else
        q)

      or?
      (cond
        (->> (flatten form)
             (remove text/page-ref?)
             (some string?))            ; block full-text search
        (concat [['?b :block/content '?content]] [q])

        :else
        q)

      (and b? p?)
      (concat [['?b :block/page '?p]] q)

      :else
      q)))

(defn parse
  [repo s]
  (when (and (string? s)
             (not (string/blank? s)))
    (let [counter (atom 0)]
      (try
        (let [s (if (= \# (first s)) (util/format "[[%s]]" (subs s 1)) s)
              form (some-> s
                           (pre-transform)
                           (reader/read-string))]
          (if (symbol? form)
            (str form)
            (let [sort-by (atom nil)
                  blocks? (atom nil)
                  sample (atom nil)
                  {result :query rules :rules}
                  (when form (build-query repo form {:sort-by sort-by
                                                     :blocks? blocks?
                                                     :counter counter
                                                     :sample sample}))]
              (cond
                (and (nil? result) (string? form))
                form

                (string? result)
                result

                :else
                (let [result (when (seq result)
                               (let [key (if (coll? (first result))
                                           (keyword (ffirst result))
                                           (keyword (first result)))
                                     result (case key
                                              :and
                                              (rest result)

                                              result)]
                                 (add-bindings! form result)))]
                  {:query result
                   :rules (mapv rules/query-dsl-rules rules)
                   :sort-by @sort-by
                   :blocks? (boolean @blocks?)
                   :sample sample})))))
        (catch js/Error e
          (log/error :query-dsl/parse-error e))))))

(defn query
  ([query-string]
   (query (state/get-current-repo) query-string))
  ([repo query-string]
   (when (string? query-string)
     (let [query-string (template/resolve-dynamic-template! query-string)]
       (when-not (string/blank? query-string)
         (let [{:keys [query rules sort-by blocks? sample] :as result} (parse repo query-string)
               query (if (string? query) (string/trim query) query)
               full-text-query? (and (string? result)
                                     (not (string/includes? result " ")))]
           (if full-text-query?
             (if (= "\"" (first result) (last result))
               (subs result 1 (dec (count result)))
               result)
             (when-let [query (query-wrapper query blocks?)]
               (let [sort-by (or sort-by identity)
                     random-samples (if @sample
                                      (fn [col]
                                        (take @sample (shuffle col)))
                                      identity)
                     transform-fn (comp sort-by random-samples)]
                 (try
                   (react/react-query repo
                                      {:query query
                                       :query-string query-string
                                       :rules rules
                                       :throw-exception true}
                                      {:use-cache? false
                                       :transform-fn transform-fn})
                   (catch ExceptionInfo e
                     ;; Allow non-existent page queries to be ignored
                     (if (string/includes? (str (.-message e)) "Nothing found for entity")
                       (log/error :query-dsl-error e)
                       (throw e)))))))))))))

(defn custom-query
  [repo query-m query-opts]
  (when (seq (:query query-m))
    (let [query-string (pr-str (:query query-m))
          query-string (template/resolve-dynamic-template! query-string)
          {:keys [query sort-by blocks?]} (parse repo query-string)
          query (if (string? query) (string/trim query) query)]
      (when query
        (when-let [query (query-wrapper query blocks?)]
          (react/react-query repo
                             (merge
                              query-m
                              {:query query})
                             (merge
                              query-opts
                              (when sort-by
                                {:transform-fn sort-by}))))))))

(comment
  ;; {{query (and (page-property foo bar) [[hello]])}}

  (query "(and [[foo]] [[bar]])")

  (query "(or [[foo]] [[bar]])")

  (query "(not (or [[foo]] [[bar]]))")

  (query "(between -7d +7d)")

  (query "(between -7d today)")

  (query "(between created_at yesterday today)")

  (query "(and [[some page]] (property foo bar))")

  (query "(and [[some page]] (task now later))")

  (query "(and [[some page]] (priority A))")

  ;; nested query
  (query "(and [[baz]] (or [[foo]] [[bar]]))")

  (query "(and [[some page]] (sort-by created-at))")

  (query "(and (page-property foo bar) [[hello]])"))
