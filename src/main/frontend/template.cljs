(ns frontend.template
  "Provides template related functionality"
  (:require [clojure.string :as string]
            [frontend.date :as date]
            [frontend.state :as state]
            [frontend.db.utils :as db-utils]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [frontend.db.conn :as conn]))

(defn- variable-rules
  []
  {"today" (page-ref/->page-ref (date/today))
   "yesterday" (page-ref/->page-ref (date/yesterday))
   "tomorrow" (page-ref/->page-ref (date/tomorrow))
   "time" (date/get-current-time)
   "current page" (when-let [current-page (or
                                           (state/get-current-page)
                                           (date/today))]
                    (let [block-uuid (parse-uuid current-page)
                          page (if block-uuid
                                 (:block/page (db-utils/entity [:block/uuid block-uuid]))
                                 (ldb/get-page (conn/get-db) current-page))
                          current-page' (:block/title page)]
                      (page-ref/->page-ref current-page')))})

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
