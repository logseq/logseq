(ns frontend.handler.property
  "Block properties handler."
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [clojure.string :as string]
            [goog.string :as gstring]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.page-ref :as page-ref]))

(defn toggle-properties
  [id]
  (state/update-state! [:ui/properties-show? id] not))

;; TODO spec
(defn set-property-schema!
  [entity key value]
  (let [pre-block (db/get-pre-block (state/get-current-repo) (:db/id entity))
        schema (assoc (:block/property-schema pre-block) key value)
        content (str (:block/content pre-block))
        edn-comment (gstring/format "<!--EDN %s -->" (pr-str {:block/property-schema schema}))
        new-content (cond
                      (string/includes? content "<!--EDN")
                      (string/replace-first content #"<!--EDN.*-->" edn-comment)
                      (seq content)
                      (str content "\n" edn-comment)
                      :else
                      edn-comment)]
    (db/transact! (state/get-current-repo)
                  [{:db/id (:db/id pre-block)
                    :block/content new-content}])))

(defn validate
  "Check whether the `value` validate against the `schema`."
  [schema value]
  (if (string/blank? value)
    [true value]
    (case (:type schema)
      "any" [true value]
      "number" (if-let [n (parse-double value)]
                 (let [[min-n max-n] [(:min schema) (:max schema)]
                       min-result (if min-n (>= n min-n) true)
                       max-result (if max-n (<= n max-n) true)]
                   (cond
                     (and min-result max-result)
                     [true n]

                     (false? min-result)
                     [false (str "the min value is " min-n)]

                     (false? max-result)
                     [false (str "the max value is " max-n)]

                     :else
                     n))
                 [false "invalid number"])
      "date" (if-let [result (js/Date. value)]
               (if (not= (str result) "Invalid Date")
                 [true value]
                 [false "invalid date"])
               [false "invalid date"])
      "url" (if (gp-util/url? value)
              [true value]
              [false "invalid URL"])
      "object" (let [page-name (or
                                (try
                                  (page-ref/get-page-name value)
                                  (catch :default _))
                                value)]
                 [true page-name]))))
