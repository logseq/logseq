(ns logseq.graph-parser.util.db
  "Db util fns that are useful for the frontend and nbb-logseq. This may be used
  by the graph-parser soon but if not, it should be in its own library"
  (:require [cljs-time.core :as t]
            [logseq.graph-parser.date-time-util :as date-time-util]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [datascript.core :as d]
            [clojure.string :as string]))

(defn date-at-local-ms
  "Returns the milliseconds representation of the provided time, in the local timezone.
For example, if you run this function at 10pm EDT in the EDT timezone on May 31st,
it will return 1622433600000, which is equivalent to Mon May 31 2021 00 :00:00."
  ([hours mins secs millisecs]
   (date-at-local-ms (.now js/Date) hours mins secs millisecs))
  ([date hours mins secs millisecs]
   (.setHours (js/Date. date) hours mins secs millisecs)))

(defn date->int
  "Given a date object, returns its journal page integer"
  [date]
  (parse-long
   (string/replace (date-time-util/ymd date) "/" "")))

(defn old->new-relative-date-format [input]
  (let [count (re-find #"^\d+" (name input))
        plus-minus (if (re-find #"after" (name input)) "+" "-")
        ms? (string/ends-with? (name input) "-ms")]
    (keyword :today (str plus-minus count "d" (if ms? "-ms" "")))))

(comment
  (old->new-relative-date-format "1d")
  (old->new-relative-date-format "1d-before")
  (old->new-relative-date-format "1d-after")
  (old->new-relative-date-format "1d-before-ms")
  (old->new-relative-date-format "1d-after-ms")
  (old->new-relative-date-format "1w-after-ms"))

(defn keyword-input-dispatch [input]
  (cond 
    (#{:current-page :current-block :parent-block :today :yesterday :tomorrow :right-now-ms} input) input
    (re-find #"^[+-]\d+[dwmy](-ms)?$" (name input)) :relative-date
    (re-find #"^\d+d(-before|-after|-before-ms|-after-ms)?$" (name input)) :DEPRECATED-relative-date
    (= :start-of-today-ms input) :DEPRECATED-start-of-today-ms 
    (= :end-of-today-ms input) :DEPRECATED-end-of-today-ms))
(defmulti resolve-keyword-input (fn [_db input _opts] (keyword-input-dispatch input))) 

(defmethod resolve-keyword-input :DEPRECATED-relative-date [db input opts]
  ;; This handles all of the cases covered by the following:
  ;; :Xd, :Xd-before, :Xd-before-ms, :Xd-after, :Xd-after-ms
  (resolve-keyword-input db (old->new-relative-date-format input) opts))

(defmethod resolve-keyword-input :DEPRECATED-start-of-today-ms [db _ opts]
  (resolve-keyword-input db :today/-0d-ms opts))

(defmethod resolve-keyword-input :DEPRECATED-end-of-today-ms [db _ opts] 
  (resolve-keyword-input db :today/+0d-ms opts))

(defmethod resolve-keyword-input :current-page [_ _ {:keys [current-page-fn]}]
  ;; TODO: handle current-page-fn not being provided
  (some-> (current-page-fn) string/lower-case))

(defmethod resolve-keyword-input :current-block [db _ {:keys [current-block-uuid]}]
  ;; TODO: handle current-block-uuid not being provided
  (:db/id (d/entity db [:block/uuid current-block-uuid])))

(defmethod resolve-keyword-input :parent-block [db _ {:keys [current-block-uuid]}]
  ;; TODO: handle current-block-uuid not being provided
  (:db/id (:block/parent (d/entity db [:block/uuid current-block-uuid]))))

(defmethod resolve-keyword-input :today [_ _ _]
  (date->int (t/today)))

(defmethod resolve-keyword-input :yesterday [_ _ _]
  (date->int (t/minus (t/today) (t/days 1))))

(defmethod resolve-keyword-input :tomorrow [_ _ _]
  (date->int (t/plus (t/today) (t/days 1))))

(defmethod resolve-keyword-input :right-now-ms [_ _ _]
  (date-time-util/time-ms))

(defmethod resolve-keyword-input :relative-date [db input opts]
  (let [relative-to (case (or (namespace input) "today")
                      "today" (t/today)
                      "journal" nil
                      "query" nil
                      "current" nil)
        [_ offset-direction offset offset-unit offset-ms?] (re-find #"^([+-])(\d+)([dwmy])(-ms)?$" (name input))
        offset-fn (case offset-direction "+" t/plus "-" t/minus)
        offset-amount (parse-long offset) 
        offset-unit-fn (case offset-unit
                         "d" t/days
                         "w" t/weeks
                         "m" t/months
                         "y" t/years)
        offset-hour (case offset-direction "+" 24 "-" 0)]
    (if offset-ms?
      (date-at-local-ms (offset-fn relative-to (offset-unit-fn offset-amount)) offset-hour 0 0 0)
      (date->int (offset-fn relative-to (offset-unit-fn offset-amount))))))

(defn resolve-input
  "Main fn for resolving advanced query :inputs"
  [db input {:keys [current-block-uuid current-page-fn]
             :or {current-page-fn (constantly nil)}}]
  (cond
    (keyword? input) 
    (try 
      (resolve-keyword-input db input {:current-block-uuid current-block-uuid
                                       :current-page-fn current-page-fn})
      (catch js/Error e
        (println "Error resolving input" input e)
        input))
    
    (and (string? input) (page-ref/page-ref? input))
    (-> (page-ref/get-page-name input)
        (string/lower-case))

    :else
    input))
