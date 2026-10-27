(ns frontend.worker.query-dsl
  "Handles executing dsl queries a.k.a. simple queries"
  (:require ["chrono-node" :as chrono]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs.reader :as reader]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [goog.object :as gobj]
            [logseq.common.date :as common-date]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.query-dsl :as shared-query-dsl]
            [logseq.db.frontend.rules :as rules]
            [malli.core :as m]))

;; A query is a [[page]] ref, a full-text "string", or an operator form like
;; (between -7d +7d). query-operators lists every operator and its arguments.

;; Time helpers
;; ============
(def ^:private journal-title-formatters
  (common-date/journal-title-formatters nil))

(defn- valid-journal-title?
  [title]
  (common-date/valid-journal-title? title nil))

(defn- journal-title->int
  [title]
  (date-time-util/journal-title->int title journal-title-formatters))

(defn- journal-title->long
  [title]
  (date-time-util/journal-title-> title tc/to-long journal-title-formatters))

(def ^:private template-re #"<%([^%].*?)%>")

(def ^:private journal-title-formatter
  (tf/formatter date-time-util/default-journal-title-formatter))

(defn- journal-name
  [date-time]
  (tf/unparse journal-title-formatter date-time))

(defn- nld-parse
  [s]
  (when (string? s)
    ((gobj/get chrono "parseDate") s)))

(defn- current-time
  []
  (tf/unparse (tf/formatter "h:mm a") (t/now)))

(defn- variable-rules
  [{:keys [current-page-title today-day]}]
  (let [today-date (if today-day
                     (tc/from-long
                      (date-time-util/journal-day->ms today-day))
                     (t/today))
        today (journal-name today-date)]
    {"today" (page-ref/->page-ref today)
     "yesterday" (page-ref/->page-ref
                  (journal-name (t/minus today-date (t/days 1))))
     "tomorrow" (page-ref/->page-ref
                 (journal-name (t/plus today-date (t/days 1))))
     "time" (current-time)
     "current page" (page-ref/->page-ref (or current-page-title today))}))

(defn- resolve-dynamic-template
  [content opts]
  (let [rules (delay (variable-rules opts))]
    (string/replace content template-re
                    (fn [[_ match]]
                      (let [match (string/trim match)
                            match-key (string/lower-case match)]
                        (cond
                          (string/blank? match)
                          ""

                          (contains? @rules match-key)
                          (get @rules match-key)

                          :else
                          (if-let [parsed (nld-parse match)]
                            (page-ref/->page-ref
                             (journal-name (tc/from-date parsed)))
                            match)))))))

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
        (when (valid-journal-title? input)
          (journal-title->int input)))

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
        (when (valid-journal-title? input)
          (journal-title->long input)))

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

(def get-timestamp-property shared-query-dsl/get-timestamp-property)

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
      (let [markers' (set (map (comp string/lower-case name) markers))]
        {:query (list 'task '?b (set markers'))
         :rules [:task]}))))

(defn- build-priority
  [e]
  (let [priorities (if (coll? (first (rest e)))
                     (first (rest e))
                     (rest e))]
    (when (seq priorities)
      (let [priorities (set (map (comp string/lower-case name) priorities))]
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
  (reset! sample (second e))
  ;; blank b/c this post-process filter doesn't effect query
  {})

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

;; grammar
;; =======

(def ^:private name-like [:or :string :symbol :keyword])

(def ^:private page-name [:or [:string {:min 1}] :symbol :keyword :int :double])

(def ^:private property-value [:or :string :symbol :keyword :int :double :boolean :uuid])

(defn- journal-ref?
  "Mirrors the page-ref branch of ->journal-day-int and ->timestamp"
  [s]
  (and (page-ref/page-ref? s)
       (let [title (-> (page-ref/get-page-name s)
                       (string/replace ":" "")
                       (string/capitalize))]
         (and (valid-journal-title? title)
              (some? (journal-title->int title))))))

(defn- date-arg?
  "Whether x is one of words, a journal [[page]] or a duration with one of units"
  [words units x]
  (and (or (string? x) (symbol? x) (keyword? x))
       (let [s (string/lower-case (name x))]
         (or (contains? words s)
             (journal-ref? s)
             (some? (re-matches (re-pattern (str "[+-]?\\d+[" units "]")) s))))))

(def ^:private journal-date
  "What ->journal-day-int accepts"
  [:fn (partial date-arg? #{"today" "yesterday" "tomorrow"} "dwmy")])

(def ^:private timestamp
  "What ->timestamp accepts"
  [:fn (partial date-arg? #{"now" "today" "yesterday" "tomorrow"} "nhdwmy")])

(def ^:private query-operators
  "Every query operator: its arguments as a malli schema, the error naming them,
  how build-query translates it, and whether it queries blocks"
  (let [boolean-op (fn [fe]
                     {:args [:cat :any [:+ [:schema [:ref ::query]]]]
                      :error (str fe " needs one or more queries")
                      :build #(build-and-or-not %1 %2 %3 fe)})
        values (fn [value]
                 [:or
                  [:cat :any [:vector {:min 1} value]]
                  [:cat :any [:+ value]]])
        property (fn [fe env-f]
                   {:args [:cat :any name-like [:? property-value]]
                    :error (str fe " needs a property name and an optional value")
                    :build #(build-property %1 (env-f %2))
                    :block-query? true})
        ;; task is the new name and todo is the old one
        task {:args (values name-like)
              :error "task needs one or more statuses"
              :build (fn [e _ _] (build-task e))
              :block-query? true}]
    {:and (boolean-op 'and)
     :or (boolean-op 'or)
     :not (boolean-op 'not)
     :task task
     :todo task
     :priority {:args (values name-like)
                :error "priority needs one or more priorities"
                :build (fn [e _ _] (build-priority e))
                :block-query? true}
     :tags {:args (values name-like)
            :error "tags needs one or more tags"
            :build (fn [e _ _] (build-tags e))}
     :page {:args [:cat :any page-name]
            :error "page needs one page name"
            :build (fn [e _ _] (build-page e))
            :block-query? true}
     :property (property 'property identity)
     :private-property (property 'private-property #(assoc % :private-property? true))
     :between {:args [:or
                      [:cat :any journal-date journal-date]
                      [:cat :any [:fn #(some? (get-timestamp-property [nil %]))] timestamp [:? timestamp]]]
               :error "between needs two dates, or created-at or updated-at and one or two dates"
               :build (fn [e _ _] (build-between e))
               :block-query? true}
     :sample {:args [:cat :any [:int {:min 1}]]
              :error "sample needs a positive integer"
              :build (fn [e env _] (build-sample e (:sample env)))}}))

(defn- form-operator
  "The query-operators key of an operator form, e.g. :task for (TASK todo)"
  [form]
  (when (and (seq? form)
             (or (symbol? (first form)) (keyword? (first form))))
    (keyword (string/lower-case (name (first form))))))

(defn build-query
  "This fn converts a form/list in a query e.g. `(operator arg1 arg2)` to its datalog
  equivalent. This fn is called recursively on sublists for boolean operators
  `and`, `or` and `not`. This fn should return a map with :query and :rules or nil.
  The form must be valid against query-schema.

Some bindings in this fn:

* e - the list being processed
* op - the query operator e.g. `:property`"
  ([e env]
   (build-query e (assoc env :vars (atom {})) 0))
  ([e {:keys [form blocks? current-filter] :as env :or {blocks? (atom nil)}} level]
   ; {:post [(or (nil? %) (map? %))]}
   (let [op (form-operator e)
         {:keys [build block-query?]} (get query-operators op)
         page-ref? (page-ref/page-ref? e)]
     (when (or block-query?
               (and (not page-ref?) (string? e)))
       (reset! blocks? true))
     (cond
       (nil? e)
       nil

       (and (= :and op) (every? page-ref/page-ref? (rest e)))
       (build-query (concat e [(cons 'or (rest e))]) env level)

       page-ref?
       (if (or (= current-filter 'or) (= form e))
         (build-self-ref e)
         (build-page-ref e))

       (string? e)                      ; block content full-text search, could be slow
       (build-block-content e)

       :else
       (build e env level)))))

(def query-schema
  "Malli schema of the simple query grammar: a string is a [[page]] ref or a
  full-text search, a list is an operator form"
  [:schema
   {:registry
    {::query (into [:multi {:dispatch #(if (string? %) :string (form-operator %))}
                    [:string :string]]
                   (map (fn [[op {:keys [args]}]] [op args]))
                   query-operators)}}
   ::query])

(def ^:private explain-query (m/explainer query-schema))

(defn- explanation->message
  [{:keys [errors]}]
  (let [{:keys [type path value]} (first errors)]
    (if (= ::m/invalid-dispatch-value type)
      (str (pr-str value) " is not a query form")
      ;; the innermost operator whose arguments failed
      (some #(:error (get query-operators %)) (rseq path)))))

(defn validate-query!
  "Throws when form, a read simple query, is outside the query grammar"
  [form]
  (when-let [explanation (explain-query form)]
    (throw (ex-info (str "Invalid query: " (explanation->message explanation))
                    {:query (pr-str form)}))))

;; parse fns
;; =========

(def pre-transform shared-query-dsl/pre-transform)

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

(def simplify-query shared-query-dsl/simplify-query)
(def custom-readers shared-query-dsl/custom-readers)
(defn parse
  [s db {:keys [cards?]}]
  (when (and (string? s)
             (not (string/blank? s)))
    (binding [*current-db* db]
      (let [s (if (= \# (first s)) (page-ref/->page-ref (subs s 1)) s)
            form (some->> s
                          (pre-transform)
                          (reader/read-string custom-readers))
            _ (validate-query! form)
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
            rule-names (if (contains? (set rules) :page-ref)
                         (conj (set rules) :self-ref)
                         (set rules))
            rules' (extract-rules rule-names)]
        {:query result'
         :rules rules'
         :rule-names rule-names
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
   (let [q' (resolve-dynamic-template q options)]
     (parse q' db options))))

(def ^:private query-result-watch-attrs
  #{:block/uuid :block/title :block/name :block/parent})

(def ^:private attr-watch-safe-rules
  #{:between :block-content :page})

(defn query-watch-dependencies
  "Return attribute-level dependencies for a DSL query when its rules are safe to inspect.

  Queries that rely on dynamic class or property semantics remain opaque and keep the
  graph-level dependency until those semantics have their own invalidation keys."
  [query-string db options]
  (if (or (not (string? query-string))
          (string/blank? query-string)
          (common-util/wrapped-by-quotes? query-string))
    {:attrs #{} :opaque? true}
    (let [{query* :query :keys [rule-names rules]} (parse-query query-string db options)
          safe? (every? attr-watch-safe-rules rule-names)
          forms (tree-seq coll? seq [query* rules])
          attrs (into query-result-watch-attrs
                      (keep (fn [form]
                              (when (and (vector? form)
                                         (<= 2 (count form))
                                         (qualified-keyword? (second form)))
                                (second form)))
                      forms))]
      {:attrs attrs
       :opaque? (or (not safe?) (empty? query*))})))

(def db-block-attrs
  "Block attributes for db graph queries"
  ;; only needs :db/id for query/view
  [:db/id])

(defn- sample-results
  [result sample]
  (if (and sample (pos-int? sample))
    (take sample (shuffle result))
    result))

(defn- with-raw-title
  [value]
  (if (and (map? value)
           (contains? value :block/title)
           (not (contains? value :block/raw-title)))
    (assoc value :block/raw-title (:block/title value))
    value))

(defn- query-result-tuples
  [result]
  (let [tuples (cond
                 (contains? result :tuples)
                 (:tuples result)

                 :else
                 result)]
    (mapv (fn [tuple]
            (mapv with-raw-title
                  (cond
                    (vector? tuple)
                    tuple

                    (map? tuple)
                    [tuple]

                    (and (object? tuple) (number? (.-length ^js tuple)))
                    (vec (array-seq tuple))

                    (seqable? tuple)
                    (vec tuple)

                    :else
                    [tuple])))
          tuples)))

(defn execute-query
  [query-string db {:keys [cards? block-attrs] :as opts}]
  (when (and (string? query-string) (not= "\"\"" query-string))
    (let [{query* :query :keys [rules sample]} (parse-query query-string db opts)
          query* (if cards?
                   (let [card-ids (set (db-class/card-class-ids db))]
                     (common-util/concat-without-nil
                      [['?b :block/tags '?t]
                       [(list 'contains? card-ids '?t)]]
                      (if (coll? (first query*)) query* [query*])))
                   query*)]
      (when-let [query' (some-> query* (query-wrapper {:blocks? true
                                                       :block-attrs block-attrs}))]
        (-> (d/q query' db rules)
            query-result-tuples
            (sample-results (some-> sample deref)))))))

(defn execute-custom-query
  [query-m db {:keys [block-attrs]}]
  (when (seq (:query query-m))
    (let [query-string (resolve-dynamic-template (pr-str (:query query-m)) {})
          {query* :query :keys [blocks? rules]} (parse query-string db {})]
      (when-let [query' (some-> query* (query-wrapper {:blocks? blocks?
                                                       :block-attrs block-attrs}))]
        (query-result-tuples (d/q query' db rules))))))

(comment
  (parse "(and [[foo]] [[bar]])" nil {}))
