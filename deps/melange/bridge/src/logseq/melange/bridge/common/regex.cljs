(ns logseq.melange.bridge.common.regex
  "Regular-expression representation conversion for typed Melange Common consumers."
  (:require ["@logseq/melange-js-api/common" :as common-api]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private string-util (.-StringUtil common-api))

(defn safe-re-find
  "Returns the first match of `pattern` in `value`, tracing and returning `nil` when `value` is not a string."
  [pattern value]
  (.safeReFindValueWith
   string-util
   (runtime/runtime-adapter)
   pattern
   value
   #(.trace js/console)))
