(ns logseq.outliner.template
  "Template with variables"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]))

(def ^:private template-re #"<%([^%].*?)%>")

(defn- current-time
  []
  (let [d (js/Date.)
        locale (some-> js/globalThis (aget "navigator") (aget "language"))]
    (.toLocaleTimeString d locale (clj->js {:hour "2-digit"
                                            :minute "2-digit"
                                            :hourCycle "h23"}))))

(defn- date-with-day-offset
  [offset-days]
  (let [d (js/Date.)]
    (.setHours d 0 0 0 0)
    (.setDate d (+ (.getDate d) offset-days))
    d))

(defn- date->journal-day
  [^js/Date date]
  (let [year (.getFullYear date)
        month (inc (.getMonth date))
        day (.getDate date)
        month' (if (< month 10) (str "0" month) (str month))
        day' (if (< day 10) (str "0" day) (str day))]
    (js/parseInt (str year month' day') 10)))

(defn- journal-title
  [db offset-days]
  (let [journal-day (date->journal-day (date-with-day-offset offset-days))]
    (or (d/q '[:find ?title .
               :in $ ?journal-day
               :where
               [?p :block/journal-day ?journal-day]
               [?p :block/title ?title]]
             db journal-day)
        (str journal-day))))

(defn- target-page-title
  [target]
  (cond
    (ldb/page? target)
    (:block/title target)

    :else
    (get-in target [:block/page :block/title])))

(defn- variable-rules
  [db target]
  (let [today (journal-title db 0)
        current-page (or (target-page-title target) today)]
    {"today" (page-ref/->page-ref today)
     "yesterday" (page-ref/->page-ref (journal-title db -1))
     "tomorrow" (page-ref/->page-ref (journal-title db 1))
     "time" (current-time)
     "current page" (page-ref/->page-ref current-page)}))

(defn- resolve-string
  [content rules]
  (string/replace content template-re
                  (fn [[_ match]]
                    (let [match' (string/trim match)
                          lowered (string/lower-case match')]
                      (cond
                        (string/blank? match')
                        ""

                        (contains? rules lowered)
                        (or (get rules lowered) "")

                        :else
                        match')))))

(defn- normalize-block
  [block]
  (cond-> (into {} block)
    (:db/id block)
    (assoc :db/id (:db/id block))))

(defn- resolve-field
  [value rules]
  (if (string? value)
    (resolve-string value rules)
    value))

(defn- resolve-properties-text-values
  [value rules]
  (if (map? value)
    (reduce-kv (fn [m k v]
                 (assoc m k (resolve-field v rules)))
               {}
               value)
    value))

(defn- resolve-block
  [block rules]
  (cond-> block
    (contains? block :block/title)
    (update :block/title resolve-field rules)

    (contains? block :block/raw-title)
    (update :block/raw-title resolve-field rules)

    (contains? block :block/properties-text-values)
    (update :block/properties-text-values resolve-properties-text-values rules)))

(defn resolve-dynamic-template-blocks
  [db target blocks]
  (let [rules (variable-rules db target)]
    (mapv (fn [block]
            (-> block
                normalize-block
                (resolve-block rules)))
          blocks)))
