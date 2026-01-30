(ns frontend.db.query-dsl
  "Handles executing dsl queries a.k.a. simple queries"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.reader :as reader]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.date :as date]
            [frontend.db.conn :as db-conn]
            [frontend.db.query-react :as query-react]
            [frontend.template :as template]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.rules :as rules]))

;; Query fields:

;; Operators:
;; and
;; or
;; not

;; Filters:
;; between
;;   Example: (between -7d +7d)
;;            (between created-at -1d today)
;;            (between updated-at -1d today)
;; [[page-ref]]
;; property (block)
;; task (block)
;; priority (block)
;; page
;; sample
;; full-text-search ""

;; Time helpers
;; ============
(defn- ->journal-day-int [input]
  (let [input (string/lower-case (name input))]
    (cond
      (= "today" input)
      (date-time-util/date->int (t/today))

      (= "yesterday" input)
      (date-time-util/date->int (t/yesterday))

      (= "tomorrow" input)
      (date-time-util/date->int (t/plus (t/today) (t/days 1)))

      (page-ref/page-ref? input)
      (let [input (-> (page-ref/get-page-name input)
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
        (date-time-util/date->int (t/plus (t/today) (tf duration)))))))

(defn- ->timestamp [input]
  (let [input (string/lower-case (name input))]
    (cond
      (= "now" input)
      (common-util/time-ms)

      (= "today" input)
      (tc/to-long (t/today))

      (= "yesterday" input)
      (tc/to-long (t/yesterday))

      (= "tomorrow" input)
      (tc/to-long (t/plus (t/today) (t/days 1)))

      (page-ref/page-ref? input)
      (let [input (-> (page-ref/get-page-name input)
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
        (tc/to-long (t/plus (t/now) (tf duration)))))))

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
           (mapcat (fn [result]
                     (cond
                       ;; rule like (task ?b #{"NOW"})
                       (list? result)
                       [result]
                       ;; datalog clause like [[?b :block/uuid]]
                       (vector? result)
                       result
                       :else
                       [(cons 'and (seq result))])))
           (apply list fe)))

    :else
    (apply list fe clauses)))

(declare build-query)

(defonce remove-nil? (partial remove nil?))

(defn- not-clause? [c]
  (and (seq? c) (= 'not (first c))))

(defn- distinct-preserve-order [xs]
  (let [seen (volatile! #{})]
    (reduce (fn [acc x]
              (if (contains? @seen x)
                acc
                (do (vswap! seen conj x)
                    (conj acc x))))
            [] xs)))

(defn- build-and-or-not
  [e {:keys [current-filter vars] :as env} level fe]
  (let [raw-clauses (map (fn [form]
                           (build-query form (assoc env :current-filter fe) (inc level)))
                         (rest e))

        ;; preserve order (no hash-order surprises)
        clauses (->> raw-clauses
                     (map :query)
                     remove-nil?
                     (distinct-preserve-order))

        ;; for (and ...), ensure any (not ...) comes AFTER positive binders
        clauses (if (= fe 'and)
                  (let [[nots others] (reduce (fn [[ns os] c]
                                                (if (not-clause? c)
                                                  [(conj ns c) os]
                                                  [ns (conj os c)]))
                                              [[] []]
                                              clauses)]
                    (concat others nots))
                  clauses)

        nested-and? (and (= fe 'and) (= current-filter 'and))]

    (when (seq clauses)
      (let [result (build-and-or-not-result fe clauses current-filter nested-and?)
            vars'  (set/union (set @vars) (collect-vars result))
            query  (cond
                     nested-and? result
                     (and (zero? level) (contains? #{'and 'or} fe)) result
                     (and (= 'not fe) (some? current-filter)) result
                     :else [result])]
        (reset! vars vars')
        {:query query
         :rules (distinct (mapcat :rules raw-clauses))}))))

;; build-query fns
;; ===============

;; Current DB when query is run
(def ^:dynamic *current-db*
  nil)

(defn- resolve-timestamp-property
  [e]
  (let [k (second e)]
    (when (or (keyword? k) (symbol? k) (string? k))
      (let [k' (-> k
                   (name)
                   (string/lower-case)
                   (string/replace "_" "-")
                   keyword)]
        (if (db-property/property? k')
          k'
          (case k'
            :created-at
            :block/created-at
            :updated-at
            :block/updated-at
            nil))))))

(defn get-timestamp-property
  [e]
  (when-let [k (resolve-timestamp-property e)]
    (when (keyword? k)
      k)))

(defn- build-journal-between-two-arg
  [e]
  (let [start (->journal-day-int (nth e 1))
        end (->journal-day-int (nth e 2))
        [start end] (sort [start end])]
    {:query (list 'between '?b start end)
     :rules [:between]}))

(defn- db-based-build-between-three-arg
  [e]
  (when-let [k (get-timestamp-property e)]
    (let [start (->timestamp (nth e 2))
          end (->timestamp (nth e 3))]
      (when (and start end)
        (let [[start end] (sort [start end])
              sym '?v]
          {:query [['?b k sym]
                   [(list '>= sym start)]
                   [(list '< sym end)]]})))))

(defn- db-based-build-between-two-arg
  [e]
  (db-based-build-between-three-arg (concat e ['now])))

(defn- build-between
  [e]
  (cond
    (= 3 (count e))
    (let [k (get-timestamp-property e)]
      (if k
        (db-based-build-between-two-arg e)
        (build-journal-between-two-arg e)))

    ;; (between created_at -1d today)
    (= 4 (count e))
    (db-based-build-between-three-arg e)))

(defn ->db-property-value
  "Parses property values for DB graphs"
  [k v]
  (let [v' (if (symbol? v) (str v) v)]
    (cond (string? v')
          (if (string/starts-with? v' "#")
            (subs v' 1)
            (or (page-ref/get-page-name v') v'))
          ;; Convert number pages to string
          (and (double? v) (= :node (:logseq.property/type (d/entity *current-db* k))))
          (str v)
          :else
          v')))

(defn- ->db-keyword-property
  "Returns property db-ident given case sensitive property names for db graphs"
  [property-name]
  (if (qualified-keyword? property-name)
    property-name
    (or (some->> (name property-name)
                 (d/q '[:find [(pull ?b [:db/ident]) ...]
                        :in $ ?title
                        :where [?b :block/tags :logseq.class/Property] [?b :block/title ?title]]
                      *current-db*)
                 first
                 :db/ident)
        ;; Don't return nil as that incorrectly matches all properties
        ::no-property-found)))

(defn- build-property-two-arg
  [e {:keys [private-property?]}]
  (let [k (->db-keyword-property (nth e 1))
        v (nth e 2)
        v' (->db-property-value k v)
        property (when (qualified-keyword? k)
                   (d/entity *current-db* k))
        ref-type? (= :db.type/ref (:db/valueType property))
        default-value (if ref-type?
                        (when-let [value (:logseq.property/default-value property)]
                          (or (:block/title value)
                              (:logseq.property/value value)))
                        (:logseq.property/scalar-default-value property))
        default-value? (and (some? v') (= default-value v'))
        rule (if private-property?
               (cond
                 (and ref-type? default-value?)
                 :private-ref-property-with-default
                 ref-type?
                 :private-ref-property
                 default-value?
                 :private-scalar-property-with-default
                 :else
                 :private-scalar-property)
               (cond
                 (and ref-type? default-value?)
                 :ref-property-with-default
                 ref-type?
                 :ref-property
                 default-value?
                 :scalar-property-with-default
                 :else
                 :scalar-property))]
    {:query (list (symbol (name rule)) '?b k v')
     :rules [rule]}))

(defn- build-property-one-arg
  [e {:keys [private-property?]}]
  (let [k (->db-keyword-property (nth e 1))]
    (if private-property?
      {:query (list 'has-private-simple-query-property '?b k)
       :rules [:has-private-simple-query-property]}
      {:query (list 'has-simple-query-property '?b k)
       :rules [:has-simple-query-property]})))

(defn- build-property [e env]
  (cond
    (= 3 (count e))
    (build-property-two-arg e env)

    (= 2 (count e))
    (build-property-one-arg e env)))

(defn- build-task
  [e]
  (let [markers (if (coll? (first (rest e)))
                  (first (rest e))
                  (rest e))]
    (when (seq markers)
      (let [markers' (set (map (comp common-util/capitalize-all name) markers))]
        {:query (list 'task '?b (set markers'))
         :rules [:task]}))))

(defn- build-priority
  [e]
  (let [priorities (if (coll? (first (rest e)))
                     (first (rest e))
                     (rest e))]
    (when (seq priorities)
      (let [priorities (set (map (comp string/capitalize name) priorities))]
        {:query (list 'priority '?b priorities)
         :rules [:priority]}))))

(defn- build-tags
  [e]
  (let [tags (if (coll? (first (rest e)))
               (first (rest e))
               (rest e))
        tags (map name tags)]
    (when (seq tags)
      (let [tags (set (map (comp page-ref/get-page-name!) tags))]
        {:query (list 'tags
                      '?b
                      (->> tags
                           (mapcat (fn [tag-name]
                                     (when-let [tag-id (if (common-util/uuid-string? tag-name)
                                                         [:block/uuid (uuid tag-name)]
                                                         (first (ldb/page-exists? *current-db* tag-name #{:logseq.class/Tag})))]
                                       (when-let [tag (d/entity *current-db* tag-id)]
                                         (->> (db-class/get-structured-children *current-db* (:db/id tag))
                                              (cons (:db/id tag)))))))
                           set))
         :rules [:tags]}))))

(defn- build-sample
  [e sample]
  (when-let [num (second e)]
    (when (integer? num)
      (reset! sample num)
      ;; blank b/c this post-process filter doesn't effect query
      {})))

(defn- build-page
  [e]
  (let [page-name (page-ref/get-page-name! (str (first (rest e))))
        page-name (common-util/page-name-sanity-lc page-name)]
    {:query (list 'page '?b page-name)
     :rules [:page]}))

(defn- build-page-ref
  [e]
  (let [page-name (-> (page-ref/get-page-name! e)
                      (common-util/page-name-sanity-lc))
        page (ldb/get-page *current-db* page-name)]
    (when page
      {:query (list 'page-ref '?b (:db/id page))
       :rules [:page-ref]})))

(defn- build-self-ref
  [e]
  (let [page-name (-> (page-ref/get-page-name! e)
                      (common-util/page-name-sanity-lc))
        page (ldb/get-page *current-db* page-name)]
    (when page
      {:query (list 'self-ref '?b (:db/id page))
       :rules [:self-ref]})))

(defn- build-block-content [e]
  {:query (list 'block-content '?b e)
   :rules [:block-content]})

(defn- datalog-clause?
  [e]
  (and
   (coll? e)
   (or
    (list? (first e))
    (and (>= (count e) 2)
         (or
          ;; variable
          (string/starts-with? (str (first e)) "?")
          ;; function
          (list? (first e)))))))

(defn build-query
  "This fn converts a form/list in a query e.g. `(operator arg1 arg2)` to its datalog
  equivalent. This fn is called recursively on sublists for boolean operators
  `and`, `or` and `not`. This fn should return a map with :query and :rules or nil.

Some bindings in this fn:

* e - the list being processed
* fe - the query operator e.g. `property`"
  ([e env]
   (build-query e (assoc env :vars (atom {})) 0))
  ([e {:keys [form blocks? sample current-filter] :as env :or {blocks? (atom nil)}} level]
   ; {:post [(or (nil? %) (map? %))]}
   (let [fe (first e)
         fe (when fe
              (cond
                (list? fe)
                fe
                (or (symbol? fe) (keyword? fe))
                (symbol (string/lower-case (name fe)))
                :else
                (string/lower-case (str fe))))
         page-ref? (page-ref/page-ref? e)]
     (when (or
            (contains? #{'between 'property 'private-property 'todo 'task 'priority 'page} fe)
            (and (not page-ref?) (string? e)))
       (reset! blocks? true))
     (cond
       (nil? e)
       nil

       (datalog-clause? e)
       {:query [e]
        :rules []}

       (and (= fe 'and) (every? page-ref/page-ref? (rest e)))
       (build-query (concat e [(cons 'or (rest e))]) env level)

       page-ref?
       (if (or (= current-filter 'or) (= form e))
         (build-self-ref e)
         (build-page-ref e))

       (string? e)                      ; block content full-text search, could be slow
       (build-block-content e)

       (contains? #{'and 'or 'not} fe)
       (build-and-or-not e env level fe)

       (= 'between fe)
       (build-between e)

       (= 'property fe)
       (build-property e env)

       (= 'private-property fe)
       (build-property e (assoc env :private-property? true))

       ;; task is the new name and todo is the old one
       (or (= 'todo fe) (= 'task fe))
       (build-task e)

       (= 'priority fe)
       (build-priority e)

       (= 'page fe)
       (build-page e)

       (= 'sample fe)
       (build-sample e sample)

       (= 'tags fe)
       (build-tags e)

       :else
       nil))))

;; parse fns
;; =========

(defonce tag-placeholder "~~~tag-placeholder~~~")
(defn pre-transform
  [s]
  (if (common-util/wrapped-by-quotes? s)
    s
    (let [quoted-page-ref (fn [matches]
                            (let [match' (string/replace (second matches) "#" tag-placeholder)]
                              (str "\"" page-ref/left-brackets match' page-ref/right-brackets "\"")))]
      (some-> s
              (string/replace #"\"?\[\[(.*?)\]\]\"?" quoted-page-ref)
              (string/replace #"\(between ([^\)]+)\)"
                              (fn [[_ x]]
                                (->> (string/split x #" ")
                                     (remove string/blank?)
                                     (map (fn [x]
                                            (if (or (contains? #{"+" "-"} (first x))
                                                    (and (common-util/safe-re-find #"\d" (first x))
                                                         (some #(string/ends-with? x %) ["y" "m" "d" "h" "min"])))
                                              (keyword (name x))
                                              x)))
                                     (string/join " ")
                                     (common-util/format "(between %s)"))))
              (string/replace #"\"[^\"]+\"" (fn [s] (string/replace s "#" tag-placeholder)))
              (string/replace " #" " #tag ")
              (string/replace #"^#" "#tag ")
              (string/replace tag-placeholder "#")))))

(defn- lvar? [x]
  (and (symbol? x) (= \? (first (name x)))))

(defn- collect-vars-by-polarity
  "Returns {:pos #{?vars} :neg #{?vars}}.
   Vars inside (not ...) are counted as negative."
  [form]
  (let [pos (volatile! #{})
        neg (volatile! #{})]
    (letfn [(walk* [x positive?]
              (cond
                (lvar? x)
                (vswap! (if positive? pos neg) conj x)

                (and (seq? x) (= 'not (first x)))
                (doseq [c (rest x)] (walk* c false))

                (sequential? x)
                (doseq [c x] (walk* c positive?))

                (map? x)
                (do (doseq [k (keys x)] (walk* k positive?))
                    (doseq [v (vals x)] (walk* v positive?)))

                :else nil))]
      (walk* form true)
      {:pos @pos :neg @neg})))

(defn- add-bindings!
  [q]
  (let [{:keys [pos neg]} (collect-vars-by-polarity q)

        appears?      (fn [v] (or (contains? pos v) (contains? neg v)))
        needs-domain? (fn [v] (and (appears? v) (not (contains? pos v))))

        b-need? (needs-domain? '?b)
        p-need? (needs-domain? '?p)

        ;; CASE 1: both needed → link them, do NOT enumerate all blocks
        bindings
        (cond
          (and b-need? p-need?)
          [['?b :block/page '?p]]

          ;; CASE 2: only ?b needed → last-resort domain (true global negation)
          b-need?
          [['?b :block/uuid]
           '[(missing? $ ?b :logseq.property/built-in?)]]

          ;; CASE 3: only ?p needed
          p-need?
          [['?p :block/name]]

          ;; CASE 4: both already positive → optional link (cheap + useful)
          (and (contains? pos '?b) (contains? pos '?p))
          [['?b :block/page '?p]]

          :else
          nil)]
    (if (seq bindings)
      (concat bindings q)   ;; IMPORTANT: bindings FIRST
      q)))

(defn simplify-query
  [query]
  (if (string? query)
    query
    (walk/postwalk
     (fn [f]
       (if (and
            (coll? f)
            (contains? #{'and 'or} (first f))
            (= 2 (count f)))
         (second f)
         f))
     query)))

(def custom-readers {:readers {'tag (fn [x] (page-ref/->page-ref x))}})
(defn parse
  [s db {:keys [cards?]}]
  (when (and (string? s)
             (not (string/blank? s)))
    (binding [*current-db* db]
     (let [s (if (= \# (first s)) (page-ref/->page-ref (subs s 1)) s)
           form (some->> s
                         (pre-transform)
                         (reader/read-string custom-readers))
           sort-by (atom nil)
           blocks? (atom nil)
           sample (atom nil)
           form (simplify-query form)
           {result :query rules :rules}
           (when form (build-query form {:form form
                                         :sort-by sort-by
                                         :blocks? blocks?
                                         :sample sample
                                         :cards? cards?}))
           result' (when (seq result)
                     (let [key (if (coll? (first result))
                                ;; Only queries for this branch are not's like:
                                ;; [(not (page-ref ?b "page 2"))]
                                 (keyword (ffirst result))
                                 (keyword (first result)))]
                       (add-bindings! (if (= key :and) (rest result) result))))
           extract-rules (fn [rules]
                           (rules/extract-rules rules/db-query-dsl-rules rules {:deps rules/rules-dependencies}))
           rules' (let [rules' (if (contains? (set rules) :page-ref)
                                 (conj (set rules) :self-ref)
                                 rules)]
                    (extract-rules rules'))]
       {:query result'
        :rules rules'
        :sort-by @sort-by
        :blocks? (boolean @blocks?)
        :sample sample}))))

;; Main fns
;; ========

(defn query-wrapper
  [where {:keys [blocks? block-attrs]}]
  (let [block-attrs (or block-attrs '[*])
        q (if blocks?                   ; FIXME: it doesn't need to be either blocks or pages
            `[:find (~'pull ~'?b ~block-attrs)
              :in ~'$ ~'%
              :where]
            '[:find (pull ?p [*])
              :in $ %
              :where])]
    (if (coll? (first where))
      (apply conj q where)
      (conj q where))))

(defn parse-query
  ([q db] (parse-query q db {}))
  ([q db options]
   (let [q' (template/resolve-dynamic-template! q)]
     (parse q' db options))))

(defn pre-transform-query
  [q]
  (let [q' (template/resolve-dynamic-template! q)]
    (pre-transform q')))

(def db-block-attrs
  "Block attributes for db graph queries"
  ;; only needs :db/id for query/view
  [:db/id])

(defn query
  "Runs a dsl query with query as a string. Primary use is from '/query' or '{{query }}'"
  ([repo query-string]
   (query repo query-string {}))
  ([repo query-string query-opts]
   (when (and (string? query-string) (not= "\"\"" query-string))
     (let [db (db-conn/get-db)
           {query* :query :keys [rules sample]} (parse-query query-string db {:cards? (:cards? query-opts)})
           query* (if (:cards? query-opts)
                    (let [card-id (:db/id (d/entity db :logseq.class/Card))]
                      (common-util/concat-without-nil
                       [['?b :block/tags card-id]]
                       (if (coll? (first query*)) query* [query*])))
                    query*)
           blocks? true]
       (when-let [query' (some-> query* (query-wrapper {:blocks? blocks?
                                                        :block-attrs db-block-attrs}))]
         (let [random-samples (if (and sample @sample)
                                (fn [col]
                                  (take @sample (shuffle col)))
                                identity)
               sort-by' identity
               transform-fn (comp sort-by' random-samples)]
           (last (query-react/react-query repo
                                          {:query query'
                                           :query-string query-string
                                           :rules rules}
                                          (merge
                                           {:transform-fn transform-fn}
                                           query-opts)))))))))

(defn custom-query
  "Runs a dsl query with query as a seq. Primary use is from advanced query"
  [repo query-m query-opts]
  (when (seq (:query query-m))
    (let [db (db-conn/get-db)
          query-string (template/resolve-dynamic-template! (pr-str (:query query-m)))
          {query* :query :keys [sort-by blocks? rules]} (parse query-string db {})]
      (when-let [query' (some-> query* (query-wrapper {:blocks? blocks?
                                                       :block-attrs db-block-attrs}))]
        (last (query-react/react-query repo
                                       (merge
                                        query-m
                                        {:query query'
                                         :rules rules})
                                       (merge
                                        query-opts
                                        (when sort-by
                                          {:transform-fn identity}))))))))

(comment
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
  (query "(and [[baz]] (or [[foo]] [[bar]]))"))
