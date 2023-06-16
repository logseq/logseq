(ns frontend.util.property-edit
  "Property related fns, both file-based and db-based version need to be considered."
  {:clj-kondo/config {:linters {:unresolved-symbol {:level :off}}}}
  (:require-macros [frontend.util.property-edit :refer [defn-when-file-based]])
  (:require [frontend.util.property :as property]))


;; Why need these XXX-when-file-based fns?
;; there're a lot of usages of property-related fns(e.g. property/insert-property) in the whole codebase.
;; I want to minimize extensive modifications as much as possible when we add db-based graph support.

(defn-when-file-based insert-property [format content key value & args])
(defn-when-file-based insert-properties [format content kvs])
(defn-when-file-based remove-property [format key content & args])
(defn-when-file-based remove-properties [format content])
(defn-when-file-based remove-id-property [format content])
(defn-when-file-based remove-built-in-properties [format content])
(defn-when-file-based remove-empty-properties [content])
(defn-when-file-based with-built-in-properties [properties content format])


(def hidden-properties property/hidden-properties)
(def built-in-properties property/built-in-properties)
(def properties-hidden? property/properties-hidden?)
(def property-key-exist?-when-file-based property/property-key-exist?)
(def goto-properties-end-when-file-based property/goto-properties-end)
(def front-matter?-when-file-based property/front-matter?)
