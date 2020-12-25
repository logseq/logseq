(ns frontend.db.query-dsl
  (:require [cljs.reader :as reader]
            [frontend.db.utils :as db-utils]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.query-custom :as query-custom]
            [cljs-time.core :as t]
            [frontend.util :as util]
            [medley.core :as medley]))

;; Query fields:

;; and
;; or
;; not
;; between
;; [[page-ref]]
;; property (block)
;; todo (block)
;; priority (block)
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
  ([e env]
   (build-query e env 0))
  ([e {:keys [sort-by blocks?] :as env} level]
   ;; TODO: replace with multi-methods for extensibility.
   (let [fe (first e)
         page-ref? (and
                    (string? e)
                    (string/starts-with? e "[[")
                    (string/ends-with? e "]]"))]
     (when (or page-ref?
               (contains? #{'between 'property 'todo 'priority 'sort-by} fe))
       (reset! blocks? true))
     (cond
       (nil? e)
       nil

       page-ref?
       (let [page-name (->>
                        (subs e 2 (- (count e) 2))
                        (string/lower-case))]
         (when (and (not (string/blank? page-name))
                    (some? (db-utils/entity [:page/name page-name])))
           [['?b :block/ref-pages [:page/name page-name]]]))

       (contains? #{'and 'or} fe)
       (let [clauses (->> (map #(build-query % env (inc level)) (rest e))
                          remove-nil?
                          (apply concat))]
         (when (seq clauses)
           (let [result (cons fe clauses)]
             (if (zero? level)
               result
               [result]))))

       (= 'not fe)
       (let [clauses (->> (map #(build-query % env) (rest e))
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
           (do
             (reset! sort-by
                     (fn [result]
                       (->> result
                            flatten
                            (clojure.core/sort-by #(get-in % [:block/properties k])
                                                  (if :desc >= <=)))))
             nil)))

       (= 'page-property fe)
       (let [[k v] (rest e)]
         [['?p :page/properties '?prop]
          [(list 'get '?prop (keyword (nth e 1))) '?v]
          [(list '= '?v (name (nth e 2)))]])

       (= 'page-tags fe)
       (let [tags (if (coll? (first (rest e)))
                    (first (rest e))
                    (rest e))]
         (when (seq tags)
           (let [tags (set (map (comp string/lower-case name) tags))]
             [['?p :page/tags '?t]
              ['?t :tag/name '?tag]
              [(list 'contains? tags '?tag)]])))

       (= 'all-page-tags fe)
       [['?t :tag/name '?tag]
        ['?p :page/name '?tag]]

       :else
       nil))))

(def link-re #"\[\[(.*?)\]\]")

(defn parse
  [s]
  (when (and (string? s)
             (not (string/blank? s)))
    (try
      (let [form (some-> (string/replace s link-re "\"[[$1]]\"")
                         (reader/read-string))

            sort-by (atom nil)
            blocks? (atom nil)
            result (when form (build-query form {:sort-by sort-by
                                                 :blocks? blocks?}))
            result (when (seq result)
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

                         result)))]
        {:query result
         :sort-by @sort-by
         :blocks? (boolean @blocks?)})
      (catch js/Error e
        (log/error :query-dsl/parse-error e)))))

(defn query
  [query-string]
  (when query-string
    (let [{:keys [query sort-by blocks?]} (parse query-string)]
      (when query
        (let [query (query-wrapper query blocks?)]
          (query-custom/react-query {:query query}
                                    (if sort-by
                                      {:transform-fn sort-by})))))))

(comment
  ;; {{query (and (page-property foo bar) [[hello]])}}

  (query "(and [[foo]] [[bar]])")

  (query "(or [[foo]] [[bar]])")

  (query "(not [[foo]])")

  (query "(between :-7d :+7d)")

  (query "(between :-7d :today)")

  (query "(and [[some page]] (property foo bar))")

  (query "(and [[some page]] (todo now later))")

  (query "(and [[some page]] (priority A))")

  ;; nested query
  (query "(and [[baz]] (or [[foo]] [[bar]]))")

  (query "(and [[some page]] (sort-by created-at))")

  (query "(and (page-property foo bar) [[hello]])"))
