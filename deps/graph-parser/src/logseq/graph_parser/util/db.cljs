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

(defn get-relative-date [input]
  (case (or (namespace input) "today")
    "today" (t/today)))

(defn get-offset-date [relative-date direction amount unit]
  (let [offset-fn (case direction "+" t/plus "-" t/minus)
        offset-amount (parse-long amount) 
        offset-unit-fn (case unit
                         "d" t/days
                         "w" t/weeks
                         "m" t/months
                         "y" t/years)]
    (offset-fn (offset-fn relative-date (offset-unit-fn offset-amount)))))

(defn get-ts-units 
  "There are currently several time suffixes being used in inputs:
  - ms: milliseconds, will return a time relative to the direction the date is being adjusted
  - start: will return the time at the start of the day [00:00:00.000]
  - end: will return the time at the end of the day [23:59:59.999]
  - HHMM: will return the specified time at the turn of the minute [HH:MM:00.000]
  - HHMMSS: will return the specified time at the turm of the second [HH:MM:SS.000]
  - HHMMSSmmm: will return the specified time at the turn of the millisecond [HH:MM:SS.mmm]
  
  The latter three will be capped to the maximum allowed for each unit so they will always be valid times"
  [offset-direction offset-time]
  (case offset-time 
    "ms" (if (= offset-direction "+") [23 59 59 999] [0 0 0 0]) 
    "start" [0 0 0 0] 
    "end" [23 59 59 999] 
    ;; if it's not a matching string, then assume it is HHMM
    (let [[h1 h2 m1 m2 s1 s2 ms1 ms2 ms3] (str offset-time "000000000")]
      [(min 23  (parse-long (str h1 h2))) 
       (min 59  (parse-long (str m1 m2)))
       (min 59  (parse-long (str s1 s2)))
       (min 999 (parse-long (str ms1 ms2 ms3)))])))

(defn keyword-input-dispatch [input]
  (cond 
    (#{:current-page :query-page :current-block :parent-block :today :yesterday :tomorrow :right-now-ms} input) input

    (re-find #"^[+-]\d+[dwmy]?$" (name input)) :relative-date
    (re-find #"^[+-]\d+[dwmy]-(ms|start|end|\d{2}|\d{4}|\d{6}|\d{9})?$" (name input)) :relative-date-time

    (= :start-of-today-ms input) :today-time 
    (= :end-of-today-ms input) :today-time
    (re-find #"^today-(start|end|\d{2}|\d{4}|\d{6}|\d{9})$" (name input)) :today-time

    (re-find #"^\d+d(-before|-after|-before-ms|-after-ms)?$" (name input)) :DEPRECATED-relative-date))

(defmulti resolve-keyword-input (fn [_db input _opts] (keyword-input-dispatch input))) 

(defmethod resolve-keyword-input :current-page [_ _ {:keys [current-page-fn]}]
  (when current-page-fn
    (some-> (current-page-fn) string/lower-case)))

(defmethod resolve-keyword-input :query-page [db _ {:keys [current-block-uuid]}]
  (when-let [current-block (and current-block-uuid (d/entity db [:block/uuid current-block-uuid]))]
    (get-in current-block [:block/page :block/name])))

(defmethod resolve-keyword-input :current-block [db _ {:keys [current-block-uuid]}]
  (when current-block-uuid
    (:db/id (d/entity db [:block/uuid current-block-uuid]))))

(defmethod resolve-keyword-input :parent-block [db _ {:keys [current-block-uuid]}]
  (when current-block-uuid
    (:db/id (:block/parent (d/entity db [:block/uuid current-block-uuid])))))

(defmethod resolve-keyword-input :today [_ _ _]
  (date->int (t/today)))

(defmethod resolve-keyword-input :yesterday [_ _ _]
  (date->int (t/minus (t/today) (t/days 1))))

(defmethod resolve-keyword-input :tomorrow [_ _ _]
  (date->int (t/plus (t/today) (t/days 1))))

(defmethod resolve-keyword-input :right-now-ms [_ _ _]
  (date-time-util/time-ms))

;; today-time returns an epoch int 
(defmethod resolve-keyword-input :today-time [_db input _opts]
  (let [[hh mm ss ms] (case input 
                        :start-of-today-ms [0 0 0 0]
                        :end-of-today-ms [23 59 59 999]
                        (get-ts-units nil (subs (name input) 6)))]
    (date-at-local-ms (t/today) hh mm ss ms))) 

;; relative-date returns a YYYMMDD string 
(defmethod resolve-keyword-input :relative-date [_ input _]
  (let [relative-to (get-relative-date input)
        [_ offset-direction offset offset-unit] (re-find #"^([+-])(\d+)([dwmy])$" (name input))
        offset-date (get-offset-date relative-to offset-direction offset offset-unit)]
    (date->int offset-date)))

;; relative-date-time returns an epoch int
(defmethod resolve-keyword-input :relative-date-time [_ input _]
  (let [relative-to (get-relative-date input)
        [_ offset-direction offset offset-unit ts] (re-find #"^([+-])(\d+)([dwmy])-(ms|start|end|\d{2,9})$" (name input))
        offset-date (get-offset-date relative-to offset-direction offset offset-unit)
        [hh mm ss ms] (get-ts-units offset-direction ts)]
    (date-at-local-ms offset-date hh mm ss ms))) 

(defmethod resolve-keyword-input :DEPRECATED-relative-date [db input opts]
  ;; This handles all of the cases covered by the following:
  ;; :Xd, :Xd-before, :Xd-before-ms, :Xd-after, :Xd-after-ms
  (resolve-keyword-input db (old->new-relative-date-format input) opts))

(defmethod resolve-keyword-input :default [_ _ _]
  nil)

(defn resolve-input
  "Main fn for resolving advanced query :inputs"
  [db input {:keys [current-block-uuid current-page-fn]
             :or {current-page-fn (constantly nil)}}]
  (cond
    (keyword? input) 
    (or
     (resolve-keyword-input db input {:current-block-uuid current-block-uuid
                                      :current-page-fn current-page-fn})
     ;; The input is returned back unresolved if a resolver communicates it
     ;; can't resolve it by returning nil. We may want to error if this is too
     ;; subtle for the user
     input)

    (and (string? input) (page-ref/page-ref? input))
    (-> (page-ref/get-page-name input)
        (string/lower-case))

    :else
    input))
