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
            [frontend.template :as template]
            [frontend.text :as text]
            [frontend.util :as util]
            [frontend.util.property :as property]
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
                :where]
              '[:find (pull ?p [*])
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

(defn build-query
  ([repo e env]
   (build-query repo e (assoc env :vars (atom {})) 0))
  ([repo e {:keys [sort-by blocks? counter current-filter vars] :as env} level]
   ;; TODO: replace with multi-methods for extensibility.
   (let [fe (first e)
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
                           (string/lower-case))]
         [['?b :block/path-refs [:block/name page-name]]])

       (contains? #{'and 'or 'not} fe)
       (let [clauses (->> (map (fn [form]
                                 (build-query repo form (assoc env :current-filter fe) (inc level)))
                            (rest e))
                          remove-nil?
                          (distinct))]
         (when (seq clauses)
           (let [result (cond
                          (= fe 'not)
                          (let [clauses (if (coll? (first clauses))
                                          (apply concat clauses)
                                          clauses)
                                clauses (if (and (= 1 (count clauses))
                                                 (= 'and (ffirst clauses)))
                                          ;; unflatten
                                          (rest (first clauses))
                                          clauses)]
                            (cons fe (seq clauses)))

                          (coll? (first clauses))
                          (cond
                            (= current-filter 'not)
                            (->> (apply concat clauses)
                                 (apply list fe))

                            (= current-filter 'or)
                            (apply concat clauses)

                            :else
                            (->> (map (fn [result]
                                        (let [result (if (vector? (ffirst result))
                                                       (apply concat result)
                                                       result)]
                                          (cons 'and (seq result)))) clauses)
                                 (apply list fe)))

                          :else
                          (apply list fe clauses))
                 vars' (set/union (set @vars) (collect-vars result))]
             (reset! vars vars')
             (cond
               ;; TODO: more thoughts
               (and (= current-filter 'and)
                    (= 'or fe)
                    (= #{'?b} vars'))
               [(concat result [['?b]])]

               (and (zero? level) (= 'and fe))
               (distinct (apply concat clauses))

               (and (zero? level) (= 'or fe))
               result

               :else
               [result]))))

       (and (= 'between fe)
            (= 3 (count e)))
       (let [start (->journal-day-int (nth e 1))
             end (->journal-day-int (nth e 2))
             [start end] (sort [start end])]
         [['?b :block/page '?p]
          ['?p :block/journal? true]
          ['?p :block/journal-day '?d]
          [(list '>= '?d start)]
          [(list '<= '?d end)]])

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
                 [['?b :block/properties '?prop]
                  [(list 'get '?prop k) sym]
                  [(list '>= sym start)]
                  [(list '< sym end)]])))))

       (and (= 'property fe)
            (= 3 (count e)))
       (let [k (string/replace (name (nth e 1)) "_" "-")
             v (nth e 2)
             v (if-not (nil? v)
                 (property/parse-property k v)
                 v)
             v (if (coll? v) (first v) v)
             sym (if (= current-filter 'or)
                   '?v
                   (uniq-symbol counter "?v"))]
         [['?b :block/properties '?prop]
          [(list 'missing? '$ '?b :block/name)]
          [(list 'get '?prop (keyword k)) sym]
          (list
           'or
           [(list '= sym v)]
           [(list 'contains? sym v)])])

       (and (= 'property fe)
            (= 2 (count e)))
       (let [k (string/replace (name (nth e 1)) "_" "-")]
         [['?b :block/properties '?prop]
          [(list 'missing? '$ '?b :block/name)]
          [(list 'get '?prop (keyword k)) '?prop-v]
          [true]])

       (or (= 'todo fe) (= 'task fe))
       (let [markers (if (coll? (first (rest e)))
                       (first (rest e))
                       (rest e))]
         (when (seq markers)
           (let [markers (set (map (comp string/upper-case name) markers))]
             [['?b :block/marker '?marker]
              [(list 'contains? markers '?marker)]])))

       (= 'priority fe)
       (let [priorities (if (coll? (first (rest e)))
                          (first (rest e))
                          (rest e))]
         (when (seq priorities)
           (let [priorities (set (map (comp string/upper-case name) priorities))]
             [['?b :block/priority '?priority]
              [(list 'contains? priorities '?priority)]])))

       (= 'sort-by fe)
       (let [[k order] (rest e)
             order (if (and order (contains? #{:asc :desc}
                                             (keyword (string/lower-case (name order)))))
                     (keyword (string/lower-case (name order)))
                     :desc)
             k (-> (string/lower-case (name k))
                   (string/replace "_" "-"))]
         (let [get-value (cond
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

       (= 'page fe)
       (let [page-name (string/lower-case (str (first (rest e))))
             page-name (text/page-ref-un-brackets! page-name)]
         [['?b :block/page [:block/name page-name]]])

       (and (= 'namespace fe)
            (= 2 (count e)))
       (let [page-name (string/lower-case (str (first (rest e))))
             page (text/page-ref-un-brackets! page-name)]
         (when-not (string/blank? page)
           [['?p :block/namespace '?parent]
            ['?parent :block/name page]]))

       (= 'page-property fe)
       (let [[k v] (rest e)
             k (string/replace (name k) "_" "-")]
         (if-not (nil? v)
           (let [v (property/parse-property k v)
                 v (if (coll? v) (first v) v)
                 sym '?v]
             [['?p :block/name]
              ['?p :block/properties '?prop]
              [(list 'get '?prop (keyword k)) sym]
              (list
               'or
               [(list '= sym v)]
               [(list 'contains? sym v)])])
           [['?p :block/name]
            ['?p :block/properties '?prop]
            [(list 'get '?prop (keyword k)) '?prop-v]
            [true]]))

       (= 'page-tags fe)
       (do
         (let [tags (if (coll? (first (rest e)))
                      (first (rest e))
                      (rest e))
               tags (map (comp string/lower-case name) tags)]
           (when (seq tags)
             (let [tags (set (map (comp text/page-ref-un-brackets! string/lower-case name) tags))]
               (let [sym-1 (uniq-symbol counter "?t")
                     sym-2 (uniq-symbol counter "?tag")]
                 [['?p :block/tags sym-1]
                  [sym-1 :block/name sym-2]
                  [(list 'contains? tags sym-2)]])))))

       (= 'all-page-tags fe)
       [['?e :block/tags '?p]]

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
  [q]
  (let [syms ['?b '?p 'not]
        [b? p? not?] (-> (set/intersection (set syms) (set (flatten q)))
                         (map syms))]
    (if not?
      (cond
        (and b? p?)
        (concat [['?b :block/uuid] ['?p :block/name] ['?b :block/page '?p]] q)

        b?
        (concat [['?b :block/uuid]] q)

        p?
        (concat [['?p :block/name]] q)

        :else
        q)
      q)))

(defn parse
  [repo s]
  (when (and (string? s)
             (not (string/blank? s)))
    (let [counter (atom 0)]
      (try
        (let [form (some-> s
                           (pre-transform)
                           (reader/read-string))]
          (if (symbol? form)
            (str form)
            (let [sort-by (atom nil)
                  blocks? (atom nil)
                  result (when form (build-query repo form {:sort-by sort-by
                                                            :blocks? blocks?
                                                            :counter counter}))]
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
                                (add-bindings! result)))]
                 {:query result
                  :sort-by @sort-by
                  :blocks? (boolean @blocks?)})))))
        (catch js/Error e
          (log/error :query-dsl/parse-error e))))))

(defn query
  [repo query-string]
  (when (string? query-string)
    (let [query-string (template/resolve-dynamic-template! query-string)]
      (when-not (string/blank? query-string)
        (let [{:keys [query sort-by blocks?] :as result} (parse repo query-string)]
          (if (and (string? result) (not (string/includes? result " ")))
            (if (= "\"" (first result) (last result))
              (subs result 1 (dec (count result)))
              result)
            (when-let [query (query-wrapper query blocks?)]
              (react/react-query repo
                                 {:query query
                                  :query-string query-string}
                                 (cond->
                                   {:use-cache? false}
                                   sort-by
                                   (assoc :transform-fn sort-by))))))))))

(defn custom-query
  [repo query-m query-opts]
  (when (seq (:query query-m))
    (let [query-string (pr-str (:query query-m))
          query-string (template/resolve-dynamic-template! query-string)
          {:keys [query sort-by blocks?]} (parse repo query-string)]
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
