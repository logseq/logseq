(ns frontend.db.query-dsl
  (:require [cljs.reader :as reader]
            [frontend.db.utils :as db-utils]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.text :as text]
            [frontend.db.query-custom :as query-custom]
            [frontend.date :as date]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.util :as util]
            [medley.core :as medley]
            [clojure.walk :as walk]
            [clojure.core]
            [clojure.set :as set]))

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
;; todo (block)
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
  (let [q (if blocks?                   ; FIXME: it doesn't need to be either blocks or pages
            '[:find (pull ?b [*])
              :where]
            '[:find (pull ?p [*])
              :where])
        result (if (coll? (first where))
                 (apply conj q where)
                 (conj q where))]
    (prn "Datascript query: " result)
    result))

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

(defn build-query
  ([repo e env]
   (build-query repo e env 0))
  ([repo e {:keys [sort-by blocks? counter current-filter] :as env} level]
   ;; TODO: replace with multi-methods for extensibility.
   (let [fe (first e)
         page-ref? (text/page-ref? e)]
     (when (or (and page-ref?
                    (not (contains? #{'page-property 'page-tags} (:current-filter env))))
               (contains? #{'between 'property 'todo 'priority 'sort-by 'page} fe))
       (reset! blocks? true))
     (cond
       (nil? e)
       nil

       page-ref?
       (let [page-name (-> (text/page-ref-un-brackets! e)
                           (string/lower-case))]
         (when (and (not (string/blank? page-name))
                    (some? (db-utils/entity repo [:page/name page-name])))
           [['?b :block/ref-pages [:page/name page-name]]]))

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
                          (if (= current-filter 'not)
                            (->> (apply concat clauses)
                                 (apply list fe))
                            (->> (map #(cons 'and (seq %)) clauses)
                                 (apply list fe)))

                          :else
                          (apply list fe clauses))]
             (cond
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
          ['?p :page/journal? true]
          ['?p :page/journal-day '?d]
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
       (let [v (some-> (name (nth e 2))
                       (text/page-ref-un-brackets!))
             sym (if (= current-filter 'or)
                   '?v
                   (uniq-symbol counter "?v"))]
         [['?b :block/properties '?prop]
          [(list 'get '?prop (name (nth e 1))) sym]
          (list
           'or
           [(list '= sym v)]
           [(list 'contains? sym v)])])

       (and (= 'property fe)
            (= 2 (count e)))
       [['?b :block/properties '?prop]
        [(list 'get '?prop (name (nth e 1)))]]

       (= 'todo fe)
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
                   (string/replace "-" "_"))]
         (when (contains? #{"created_at" "last_modified_at"} k)
           (let [comp (if (= order :desc) >= <=)]
             (reset! sort-by
                     (fn [result]
                       (->> result
                            flatten
                            (clojure.core/sort-by #(get-in % [:block/properties k])
                                                  comp))))
             nil)))

       (= 'page fe)
       (let [page-name (string/lower-case (first (rest e)))]
         [['?b :block/page [:page/name page-name]]])

       (= 'page-property fe)
       (let [[k v] (rest e)]
         (if v
           (let [v (some->> (name (nth e 2))
                            (text/page-ref-un-brackets!))
                 sym '?v]
             [['?p :page/properties '?prop]
              [(list 'get '?prop (keyword (nth e 1))) sym]
              (list
               'or
               [(list '= sym v)]
               [(list 'contains? sym v)])])
           [['?p :page/properties '?prop]
            [(list 'get '?prop (keyword (nth e 1)))]]))

       (= 'page-tags fe)
       (do
         (let [tags (if (coll? (first (rest e)))
                      (first (rest e))
                      (rest e))
               tags (map (comp string/lower-case name) tags)]
           (when (seq tags)
             (let [tags (set (map (comp text/page-ref-un-brackets! string/lower-case name) tags))]
               [['?p :page/tags '?t]
                ['?t :page/name '?tag]
                [(list 'contains? tags '?tag)]]))))

       (= 'all-page-tags fe)
       [['?e :page/tags '?p]]

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
                                                                (and (re-find #"\d" (first x))
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
        (concat [['?b :block/uuid] ['?p :page/name] ['?b :block/page '?p]] q)

        b?
        (concat [['?b :block/uuid]] q)

        p?
        (concat [['?p :page/name]] q)

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
                           (reader/read-string))
              sort-by (atom nil)
              blocks? (atom nil)
              result (when form (build-query repo form {:sort-by sort-by
                                                        :blocks? blocks?
                                                        :counter counter}))
              result (when (seq result)
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
           :blocks? (boolean @blocks?)})
        (catch js/Error e
          (log/error :query-dsl/parse-error e))))))

(defn query
  [repo query-string]
  (when query-string
    (let [{:keys [query sort-by blocks?]} (parse repo query-string)]
      (when query
        (let [query (query-wrapper query blocks?)]
          (query-custom/react-query repo
                                    {:query query}
                                    (if sort-by
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

  (query "(and [[some page]] (todo now later))")

  (query "(and [[some page]] (priority A))")

  ;; nested query
  (query "(and [[baz]] (or [[foo]] [[bar]]))")

  (query "(and [[some page]] (sort-by created-at))")

  (query "(and (page-property foo bar) [[hello]])"))
