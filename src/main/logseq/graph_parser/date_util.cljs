(ns logseq.graph-parser.date-util
  "Date utilities that only depend on core fns and cljs-time. These are a subset of
ones from frontend.date"
  (:require [cljs-time.format :as tf]
            [clojure.string :as string]
            [logseq.graph-parser.util :as util]
            ; [frontend.state :as state]
            ))

(defn format
  [date]
  (when-let [formatter-string "MMM do, yyyy" #_(state/get-date-formatter)]
    (tf/unparse (tf/formatter formatter-string) date)))

;; (tf/parse (tf/formatter "dd.MM.yyyy") "2021Q4") => 20040120T000000
(defn safe-journal-title-formatters
  []
  (->> [#_(state/get-date-formatter)"MMM do, yyyy" "yyyy-MM-dd" "yyyy_MM_dd"]
       (remove string/blank?)
       distinct))

(defn journal-title->
  ([journal-title then-fn]
   (journal-title-> journal-title then-fn (safe-journal-title-formatters)))
  ([journal-title then-fn formatters]
   (when-not (string/blank? journal-title)
     (when-let [time (->> (map
                            (fn [formatter]
                              (try
                                (tf/parse (tf/formatter formatter) (util/capitalize-all journal-title))
                                (catch js/Error _e
                                  nil)))
                            formatters)
                          (filter some?)
                          first)]
       (then-fn time)))))

(defn journal-title->int
  [journal-title]
  (when journal-title
    (let [journal-title (util/capitalize-all journal-title)]
      (journal-title-> journal-title #(util/parse-int (tf/unparse (tf/formatter "yyyyMMdd") %))))))

(defn int->journal-title
  [day]
  (when day
    (format (tf/parse (tf/formatter "yyyyMMdd") (str day)))))
