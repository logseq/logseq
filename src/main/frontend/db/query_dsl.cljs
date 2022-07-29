(ns frontend.db.query-dsl
  "Handles executing dsl queries a.k.a. simple queries"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.reader :as reader]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.state :as state]
            [frontend.date :as date]
            [frontend.db.model :as model]
            [frontend.db.query-react :as query-react]
            [frontend.db.utils :as db-utils]
            [logseq.db.rules :as rules]
            [frontend.template :as template]
            [logseq.graph-parser.text :as text]
            [frontend.util.text :as text-util]
            [frontend.util :as util]))


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

;; (between -7d +7d)

;; Time helpers
;; ============
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
      (let [duration (parse-long (subs input 0 (dec (count input))))
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
      (let [duration (parse-long (subs input 0 (dec (count input))))
            kind (last input)
            tf (case kind
                 "y" t/years
                 "m" t/months
                 "w" t/weeks
                 "h" t/hours
                 "n" t/minutes          ; min
                 t/days)]
        (tc/to-long (t/plus (t/today) (tf duration)))))))

;; Boolean operator utils: and, or, not
;; ======================
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

(defn- build-and-or-not-result
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
      (cons 'and clauses)

      (or (= current-filter 'or)
          nested-and?)
      (cons 'and clauses)

      :else
      (->> clauses
           (map (fn [result]
                  (if (list? result)
                    result
                    (let [result (if (vector? (ffirst result))
                                   (apply concat result)
                                   result)]
                      (cons 'and (seq result))))))
           (apply list fe)))

    :else
    (apply list fe clauses)))

(declare build-query)

(defonce remove-nil? (partial remove nil?))

(defn- build-and-or-not
  [e {:keys [current-filter vars] :as env} level fe]
  (let [raw-clauses (map (fn [form]
                           (build-query form (assoc env :current-filter fe) (inc level)))
                         (rest e))
        clauses (->> raw-clauses
                     (map :query)
                     remove-nil?
                     (distinct))
        nested-and? (and (= fe 'and) (= current-filter 'and))]
    (when (seq clauses)
      (let [result (build-and-or-not-result
                    fe clauses current-filter nested-and?)
            vars' (set/union (set @vars) (collect-vars result))
            query (cond
                    nested-and?
                    result

                    (and (zero? level) (contains? #{'and 'or} fe))
                    result

                    (and (= 'not fe) (some? current-filter))
                    result

                    :else
                    [result])]
        (reset! vars vars')
        {:query query
         :rules (distinct (mapcat :rules raw-clauses))}))))

;; build-query fns
;; ===============
(defn- build-between-two-arg
  [e]
  (let [start (->journal-day-int (nth e 1))
         end (->journal-day-int (nth e 2))
         [start end] (sort [start end])]
    {:query (list 'between '?b start end)
     :rules [:between]}))

(defn- build-between-three-arg
  [e]
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
                     [(list '< sym end)]]}))))))

(defn- build-between
  [e]
  (cond
    (= 3 (count e))
    (build-between-two-arg e)

    ;; (between created_at -1d today)
    (= 4 (count e))
    (build-between-three-arg e)))

(defn- build-property-two-arg
  [e]
  (let [k (string/replace (name (nth e 1)) "_" "-")
        v (nth e 2)
        v (if-not (nil? v)
            (text/parse-property k v (state/get-config))
            v)
        v (if (coll? v) (first v) v)]
    {:query (list 'property '?b (keyword k) v)
     :rules [:property]}))

(defn- build-property-one-arg
  [e]
  (let [k (string/replace (name (nth e 1)) "_" "-")]
    {:query (list 'has-property '?b (keyword k))
     :rules [:has-property]}))

(defn- build-property [e]
  (cond
    (= 3 (count e))
    (build-property-two-arg e)

    (= 2 (count e))
    (build-property-one-arg e)))

(defn- build-task
  [e]
  (let [markers (if (coll? (first (rest e)))
                  (first (rest e))
                  (rest e))]
    (when (seq markers)
      (let [markers (set (map (comp string/upper-case name) markers))]
        {:query (list 'task '?b markers)
         :rules [:task]}))))

(defn- build-priority
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
      (let [v' (text/parse-property k v (state/get-config))
            val (if (coll? v') (first v') v')]
        {:query (list 'page-property '?p (keyword k) val)
         :rules [:page-property]})
      {:query (list 'has-page-property '?p (keyword k))
       :rules [:has-page-property]})))

(defn- build-page-tags
  [e]
  (let [tags (if (coll? (first (rest e)))
               (first (rest e))
               (rest e))
        tags (map (comp string/lower-case name) tags)]
    (when (seq tags)
      (let [tags (set (map (comp text/page-ref-un-brackets! string/lower-case name) tags))]
        {:query (list 'page-tags '?p tags)
         :rules [:page-tags]}))))

(defn- build-all-page-tags
  []
  {:query (list 'all-page-tags '?p)
   :rules [:all-page-tags]} )

(defn- build-sample
  [e sample]
  (when-let [num (second e)]
    (when (integer? num)
      (reset! sample num)
      {:query [['?p :block/uuid]]})))

(defn- build-sort-by
  [e sort-by_]
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
         (reset! sort-by_
                 (fn [result]
                   (->> result
                        flatten
                        (sort-by get-value comp))))
         nil))

(defn- build-page
  [e]
  (let [page-name (text/page-ref-un-brackets! (str (first (rest e))))
        page-name (util/page-name-sanity-lc page-name)]
    {:query (list 'page '?b page-name)
     :rules [:page]}))

(defn- build-namespace
  [e]
  (let [page-name (text/page-ref-un-brackets! (str (first (rest e))))
        page (util/page-name-sanity-lc page-name)]
    (when-not (string/blank? page)
      {:query (list 'namespace '?p page)
       :rules [:namespace]})))

(defn- build-page-ref
  [e]
  (let [page-name (-> (text/page-ref-un-brackets! e)
                      (util/page-name-sanity-lc))]
    {:query (list 'page-ref '?b page-name)
     :rules [:page-ref]}))

(defn- build-block-content [e]
  {:query (list 'block-content '?b e)
   :rules [:block-content]})

(defn build-query
  "This fn converts a form/list in a query e.g. `(operator arg1 arg2)` to its datalog
  equivalent. This fn is called recursively on sublists for boolean operators
  `and`, `or` and `not`. This fn should return a map with :query and :rules or nil.

Some bindings in this fn:

* e - the list being processed
* fe - the query operator e.g. `property`"
  ([e env]
   (build-query e (assoc env :vars (atom {})) 0))
  ([e {:keys [sort-by blocks? sample] :as env :or {blocks? (atom nil)}} level]
   ; {:post [(or (nil? %) (map? %))]}
   (let [fe (first e)
         fe (when fe (symbol (string/lower-case (name fe))))
         page-ref? (text/page-ref? e)]
     (when (or (and page-ref?
                    (not (contains? #{'page-property 'page-tags} (:current-filter env))))
               (contains? #{'between 'property 'todo 'task 'priority 'sort-by 'page} fe)
               (and (not page-ref?) (string? e)))
       (reset! blocks? true))
     (cond
       (nil? e)
       nil

       page-ref?
       (build-page-ref e)

       (string? e)                      ; block content full-text search, could be slow
       (build-block-content e)

       (contains? #{'and 'or 'not} fe)
       (build-and-or-not e env level fe)

       (= 'between fe)
       (build-between e)

       (= 'property fe)
       (build-property e)

       ;; task is the new name and todo is the old one
       (or (= 'todo fe) (= 'task fe))
       (build-task e)

       (= 'priority fe)
       (build-priority e)

       (= 'sort-by fe)
       (build-sort-by e sort-by)

       (= 'page fe)
       (build-page e)

       (= 'namespace fe)
       (build-namespace e)

       (= 'page-property fe)
       (build-page-property e)

       (= 'page-tags fe)
       (build-page-tags e)

       (= 'all-page-tags fe)
       (build-all-page-tags)

       (= 'sample fe)
       (build-sample e sample)

       :else
       nil))))

;; parse fns
;; =========

(defn- pre-transform
  [s]
  (some-> s
          (string/replace text/page-ref-re "\"[[$1]]\"")
          (string/replace text-util/between-re
                          (fn [[_ x]]
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
  [s]
  (when (and (string? s)
             (not (string/blank? s)))
    (let [s (if (= \# (first s)) (util/format "[[%s]]" (subs s 1)) s)
          form (some-> s
                       (pre-transform)
                       (reader/read-string))
          sort-by (atom nil)
          blocks? (atom nil)
          sample (atom nil)
          {result :query rules :rules}
          (when form (build-query form {:sort-by sort-by
                                        :blocks? blocks?
                                        :sample sample}))
          result' (when (seq result)
                    (let [key (if (coll? (first result))
                                ;; Only queries for this branch are not's like:
                                ;; [(not (page-ref ?b "page 2"))]
                                (keyword (ffirst result))
                                (keyword (first result)))]
                      (add-bindings! form
                                     (if (= key :and) (rest result) result))))]
      {:query result'
       :rules (mapv rules/query-dsl-rules rules)
       :sort-by @sort-by
       :blocks? (boolean @blocks?)
       :sample sample})))

;; Main fns
;; ========

(defn query-wrapper
  [where blocks?]
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
    result))

(defn query
  "Runs a dsl query with query as a string. Primary use is from '{{query }}'"
  [repo query-string]
  (when (and (string? query-string) (not= "\"\"" query-string))
    (let [query-string' (template/resolve-dynamic-template! query-string)
          {:keys [query rules sort-by blocks? sample]} (parse query-string')]
      (when-let [query' (some-> query (query-wrapper blocks?))]
        (let [sort-by (or sort-by identity)
              random-samples (if @sample
                               (fn [col]
                                 (take @sample (shuffle col)))
                               identity)
              transform-fn (comp sort-by random-samples)]
          (query-react/react-query repo
                                   {:query query'
                                    :query-string query-string
                                    :rules rules}
                                   {:use-cache? false
                                    :transform-fn transform-fn}))))))

(defn custom-query
  "Runs a dsl query with query as a seq. Primary use is from advanced query"
  [repo query-m query-opts]
  (when (seq (:query query-m))
    (let [query-string (template/resolve-dynamic-template! (pr-str (:query query-m)))
          {:keys [query sort-by blocks? rules]} (parse query-string)]
      (when-let [query' (some-> query (query-wrapper blocks?))]
        (query-react/react-query repo
                           (merge
                            query-m
                            {:query query'
                             :rules rules})
                           (merge
                            query-opts
                            (when sort-by
                              {:transform-fn sort-by})))))))

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
