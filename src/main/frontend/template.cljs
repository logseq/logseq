(ns frontend.template
  (:require [clojure.string :as string]
            [frontend.date :as date]
            [frontend.state :as state]
            [logseq.graph-parser.util.page-ref :as page-ref]))

(defn- variable-rules
  []
  {"today" (page-ref/->page-ref (date/today))
   "yesterday" (page-ref/->page-ref (date/yesterday))
   "tomorrow" (page-ref/->page-ref (date/tomorrow))
   "time" (date/get-current-time)
   "current page" (page-ref/->page-ref (or (state/get-current-page)
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
                         (let [;; NOTE: This following cannot handle timezones
                               ;; date (tc/to-local-date-time nld)
                               date (doto (goog.date.DateTime.) (.setTime (.getTime nld)))]
                           (page-ref/->page-ref (date/journal-name date)))
                         match))))))
