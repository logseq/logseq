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

(def ^:private journal-variable-offsets
  {"today" 0
   "yesterday" -1
   "tomorrow" 1})

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

(defn- journal-page
  [db offset-days]
  (let [journal-day (date->journal-day (date-with-day-offset offset-days))]
    (when-let [page-id (d/q '[:find ?p .
                              :in $ ?journal-day
                              :where
                              [?p :block/journal-day ?journal-day]]
                            db journal-day)]
      (d/entity db page-id))))

(defn- journal-page-or-title
  [db offset-days]
  (or (journal-page db offset-days)
      (journal-title db offset-days)))

(defn- target-page
  [target]
  (cond
    (ldb/page? target)
    target

    :else
    (:block/page target)))

(defn- page-ref-for
  [page-or-title]
  (page-ref/->page-ref
   (if-let [page-uuid (:block/uuid page-or-title)]
     page-uuid
     page-or-title)))

(defn- dynamic-template-matches
  [content]
  (when (string? content)
    (map (comp string/lower-case string/trim second)
         (re-seq template-re content))))

(defn- block-template-contents
  [block]
  (concat
   [(:block/title block) (:block/raw-title block)]
   (when (map? (:block/properties-text-values block))
     (vals (:block/properties-text-values block)))))

(defn dynamic-template-journal-days
  [blocks]
  (->> blocks
       (mapcat block-template-contents)
       (mapcat dynamic-template-matches)
       (keep journal-variable-offsets)
       (map #(date->journal-day (date-with-day-offset %)))
       distinct
       vec))

(defn- variable-rules
  [db target]
  (let [today (journal-page-or-title db 0)
        current-page (or (target-page target) today)]
    {"today" (page-ref-for today)
     "yesterday" (page-ref-for (journal-page-or-title db -1))
     "tomorrow" (page-ref-for (journal-page-or-title db 1))
     "time" (current-time)
     "current page" (page-ref-for current-page)}))

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
