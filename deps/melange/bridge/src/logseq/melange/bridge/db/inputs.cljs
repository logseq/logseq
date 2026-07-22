(ns logseq.melange.bridge.db.inputs
  "Advanced-query input representation and runtime capability boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [cljs-time.core :as t]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private input-workflow-api (.-InputWorkflow melange-db))

(defn date-at-local-ms
  "Returns the milliseconds representation of `date` in the local timezone."
  ([hours mins secs millisecs]
   (date-at-local-ms (.now js/Date) hours mins secs millisecs))
  ([date hours mins secs millisecs]
   (.setHours (js/Date. date) hours mins secs millisecs)))

(defn- input-capabilities
  [current-page-fn]
  #js {:currentPage current-page-fn
       :today t/today
       :addDays (fn [date amount] (t/plus date (t/days amount)))
       :addWeeks (fn [date amount] (t/plus date (t/weeks amount)))
       :addMonths (fn [date amount] (t/plus date (t/months amount)))
       :addYears (fn [date amount] (t/plus date (t/years amount)))
       :dateMs #(.getTime %)
       :setLocalTime date-at-local-ms
       :nowMs #(.now js/Date)})

(defn resolve-input
  "Resolves one advanced-query `input` through typed domain planning.

  Options:

  | key                   | description
  |-----------------------|------------
  | `:current-block-uuid` | UUID of the block running the query
  | `:current-page-fn`    | Function returning the current page name"
  [db input {:keys [current-block-uuid current-page-fn]
             :or {current-page-fn (constantly nil)}}]
  ((.-resolveWith input-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   (input-capabilities current-page-fn)
   current-block-uuid
   input))
