(ns frontend.util.property-edit
  "Property related fns, both file-based and db-based version need to be considered."
  {:clj-kondo/config {:linters {:unresolved-symbol {:level :off}}}}
  (:require-macros [frontend.util.property-edit :refer [defn-for-file-based-graph]]))


;; Why need these XXX-for-file-based fns?
;; there're a lot of usages of property-related fns(e.g. property/insert-property) in the whole codebase.
;; I want to minimize extensive modifications as much as possible when we add db-based graph support.

(defn-for-file-based-graph insert-property [format content key value & args])
(defn-for-file-based-graph insert-properties [format content kvs])
(defn-for-file-based-graph remove-property [format key content & args])
(defn-for-file-based-graph remove-id-property [format content])
(defn-for-file-based-graph remove-built-in-properties [format content])
