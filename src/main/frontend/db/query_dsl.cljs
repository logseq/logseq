(ns frontend.db.query-dsl
  (:require [cljs.reader :as reader]
            [frontend.db.utils :as db-utils]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [clojure.string :as string]
            [frontend.db :as db]
            [cljs-time.core :as t]
            [frontend.util :as util]))

;; Query fields:

;; and
;; or
;; not
;; between
;; [[page-ref]]
;; property (block)
;; todo (block)
;; priority (block)
;; page-property (page, TBD)
;; project (block, TBD)

;; Sort by (field, asc/desc):

;; block-title
;; page-title
;; created-at
;; updated-at


(defonce remove-nil? (partial remove nil?))

(defn query-wrapper
  [where]
  (let [q '[:find (pull ?b [*])
            :where]
        result (if (coll? (first where))
                 (apply conj q where)
                 (conj q where))]
    (prn "Datascript query: " result)
    result))

;; (between -7d +7d)
(defn- ->date-int [input]
  (let [input (string/lower-case (name input))]
    (cond
      (= "today" input)
      (db-utils/date->int (t/today))

      (= "yesterday" input)
      (db-utils/date->int (t/yesterday))

      (= "tomorrow" input)
      (db-utils/date->int (t/plus (t/today) (t/days 1)))

      :else
      (let [duration (util/parse-int (subs input 0 (dec (count input))))
            kind (last input)
            tf (case kind
                 "y" t/years
                 "m" t/months
                 "w" t/weeks
                 t/days)]
        (db-utils/date->int (t/plus (t/today) (tf duration)))))))

(defn build-query
  ([e]
   (build-query e 0))
  ([e level]
   ;; TODO: replace with multi-methods for extensibility.
   (let [fe (first e)]
     (cond
       (nil? e)
       nil

       (contains? #{'and 'or} fe)
       (let [clauses (->> (map #(build-query % (inc level)) (rest e))
                          remove-nil?
                          (apply concat))]
         (when (seq clauses)
           (let [result (cons fe clauses)]
             (if (zero? level)
               result
               [result]))))

       (= 'not fe)                       ; or
       (let [clauses (->> (map build-query (rest e))
                          remove-nil?
                          (apply concat))]
         (when (seq clauses)
           (map #(list 'not %) clauses)))

       (and (= 'between fe)
            (= 3 (count e)))
       (let [start (->date-int (nth e 1))
             end (->date-int (nth e 2))
             [start end] (sort [start end])]
         [['?b :block/page '?p]
          ['?p :page/journal? true]
          ['?p :page/journal-day '?d]
          [(list '>= '?d start)]
          [(list '<= '?d end)]])

       (and (= 'property fe)
            (= 3 (count e)))
       [['?b :block/properties '?p]
        [(list 'get '?p (name (nth e 1))) '?v]
        [(list '= '?v (name (nth e 2)))]]

       (and (= 'todo fe))
       (let [markers (if (coll? (first (rest e)))
                       (first (rest e))
                       (rest e))]
         (when (seq markers)
           (let [markers (set (map name markers))]
             [['?b :block/marker '?marker]
              [(list 'contains? markers '?marker)]])))

       (and (= 'priority fe))
       (let [priorities (if (coll? (first (rest e)))
                          (first (rest e))
                          (rest e))]
         (when (seq priorities)
           (let [priorities (set (map (comp string/upper-case name) priorities))]
             [['?b :block/priority '?priority]
              [(list 'contains? priorities '?priority)]])))

       (and
        (string? e)
        (string/starts-with? e "[[")
        (string/ends-with? e "]]")) ; page reference
       (let [page-name (->>
                        (subs e 2 (- (count e) 2))
                        (string/lower-case))]
         (when (and (not (string/blank? page-name))
                    (some? (db-utils/entity [:page/name page-name])))
           [['?b :block/ref-pages [:page/name page-name]]]))

       :else
       nil))))

(def link-re #"\[\[(.*?)\]\]")

(defn parse
  [s]
  (when (and (string? s)
             (not (string/blank? s)))
    (try
      (let [s (string/replace s link-re "\"[[$1]]\"")
            result (some->
                    s
                    (reader/read-string)
                    (build-query))]
        (when (seq result)
          (let [key (if (coll? (first result))
                      (keyword (ffirst result))
                      (keyword (first result)))]
            (case key
              :and
              (rest result)

              :not
              (cons ['?b :block/uuid] result)

              :or
              [['?b :block/uuid] result]

              result))))
      (catch js/Error e
        (log/error :query-dsl/parse-error e)))))

(comment
  (require '[frontend.db :as db])

  (d/q
   (query-wrapper (parse "(and [[foo]] [[bar]])"))
   (db/get-conn))

  (d/q
   (query-wrapper (parse "(or [[foo]] [[bar]])"))
   (db/get-conn))

  (d/q
   (query-wrapper (parse "(not [[foo]])"))
   (db/get-conn))

  (d/q
   (query-wrapper (parse "(between :-7d :+7d)"))
   (db/get-conn))

  (d/q
   (query-wrapper (parse "(between :-7d :today)"))
   (db/get-conn))

  (d/q
   (query-wrapper (parse "(and [[some page]] (property foo bar))"))
   (db/get-conn))

  (d/q
   (query-wrapper (parse "(and [[some page]] (todo now later))"))
   (db/get-conn))

  (d/q
   (query-wrapper (parse "(and [[some page]] (priority A))"))
   (db/get-conn))

  ;; nested query
  (d/q
   (query-wrapper (parse "(and [[baz]] (or [[foo]] [[bar]]))"))
   (db/get-conn)))
