(ns frontend.template
  "Provides template related functionality"
  (:require [clojure.string :as string]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [logseq.melange.bridge.common.api :as melange-common]
            [logseq.melange.bridge.db.core :as ldb]))

(defn- variable-rules
  []
  {"today" (melange-common/to-page-ref (db/get-journal-page-title (date/today)))
   "yesterday" (melange-common/to-page-ref (db/get-journal-page-title (date/yesterday)))
   "tomorrow" (melange-common/to-page-ref (db/get-journal-page-title (date/tomorrow)))
   "time" (date/get-current-time)
   "current page" (when-let [current-page (or
                                           (state/get-current-page)
                                           (db/get-journal-page-title (date/today)))]
                    (let [block-uuid (parse-uuid current-page)
                          page (if block-uuid
                                 (db-utils/entity [:block/uuid block-uuid])
                                 (ldb/get-page (conn/get-db) current-page))
                          current-page' (:block/title page)]
                      (when current-page' (melange-common/to-page-ref current-page'))))})

(def template-re #"<%([^%].*?)%>")

;; TODO: programmable
;; context information, date, current page
(defn resolve-dynamic-template!
  [content]
  (string/replace content template-re
                  (fn [[_ match]]
                    (let [match (string/trim match)]
                      (cond
                        (string/blank? match)
                        ""
                        (get (variable-rules) (string/lower-case match))
                        (get (variable-rules) (string/lower-case match))
                        :else
                        (if-let [nld (date/nld-parse match)]
                          (let [date (doto (goog.date.DateTime.) (.setTime (.getTime nld)))]
                            (melange-common/to-page-ref (date/journal-name date)))
                          match))))))
