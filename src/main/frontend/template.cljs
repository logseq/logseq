(ns frontend.template
  (:require [cljs-time.coerce :as tc]
            [clojure.string :as string]
            [frontend.date :as date]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn- variable-rules
  []
  {"today" (util/format "[[%s]]" (date/today))
   "yesterday" (util/format "[[%s]]" (date/yesterday))
   "tomorrow" (util/format "[[%s]]" (date/tomorrow))
   "time" (date/get-current-time)
   "current page" (util/format "[[%s]]"
                               (or (state/get-current-page)
                                   (date/today)))})

;; TODO: programmable
;; context information, date, current page
(defn resolve-dynamic-template!
  [content]
  (string/replace content #"<%([^%].*?)%>"
                  (fn [[_ match]]
                    (let [match (string/trim match)]
                      (cond
                       (string/blank? match)
                       ""
                       (get (variable-rules) (string/lower-case match))
                       (get (variable-rules) (string/lower-case match))
                       :else
                       (if-let [nld (date/nld-parse match)]
                         (let [date (tc/to-local-date-time nld)]
                           (util/format "[[%s]]" (date/journal-name date)))
                         match))))))
