(ns frontend.handler.file-based.property
  "Properties handler for file graphs and file graph specific feature implementations"
  (:require [frontend.handler.file-based.property.util :as property]
            [frontend.config :as config]))

;; Why need these XXX-when-file-based fns?
;; there're a lot of usages of property-related fns(e.g. property/insert-property) in the whole codebase.
;; I want to minimize extensive modifications as much as possible when we add db-based graph support.

;; (def insert-property
;;   (fn-when-file-based property/insert-property [format content key value & args]))
(defn insert-property
  [format content key value & args]
  (apply property/insert-property format content key value args))

(defn insert-properties-when-file-based
  [repo format content kvs]
  (if (config/db-based-graph? repo)
    content
    (property/insert-properties format content kvs)))

(defn remove-property-when-file-based
  [repo format key content & args]
  (if (config/db-based-graph? repo)
    content
    (apply property/remove-property format key content args)))

(defn remove-properties-when-file-based
  [repo format content]
  (if (config/db-based-graph? repo)
    content
    (property/remove-properties format content)))

(defn remove-id-property
  [format content]
  (property/remove-id-property format content))

(defn remove-built-in-properties-when-file-based
  [repo format content]
  (if (config/db-based-graph? repo)
    content
    (property/remove-built-in-properties format content)))
(defn remove-empty-properties-when-file-based
  [repo content]
  (if (config/db-based-graph? repo)
    content
    (property/remove-empty-properties content)))

(defn with-built-in-properties-when-file-based
  [repo properties content format]
  (if (config/db-based-graph? repo)
    content
    (property/with-built-in-properties properties content format)))


(def hidden-properties property/hidden-properties)
(def built-in-properties property/built-in-properties)
(def properties-hidden? property/properties-hidden?)
(def property-key-exist?-when-file-based property/property-key-exist?)
(def goto-properties-end-when-file-based property/goto-properties-end)
(def front-matter?-when-file-based property/front-matter?)
