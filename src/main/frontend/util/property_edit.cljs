(ns frontend.util.property-edit
  "Property related fns, both file-based and db-based version need to be considered."
  (:require [frontend.util.property :as property]
            [frontend.config :as config]
            [frontend.db :as db]))


;; Why need these XXX-when-file-based fns?
;; there're a lot of usages of property-related fns(e.g. property/insert-property) in the whole codebase.
;; I want to minimize extensive modifications as much as possible when we add db-based graph support.

;; (def insert-property-when-file-based
;;   (fn-when-file-based property/insert-property [format content key value & args]))
(defn insert-property-when-file-based
  [repo format content key value & args]
  (if (config/db-based-graph? repo)
    content
    (apply property/insert-property format content key value args)))

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

(defn remove-id-property-when-file-based
  [repo format content]
  (if (config/db-based-graph? repo)
    content
    (property/remove-id-property format content)))

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


(defn insert-property-when-db-based
  "return tx-data"
  [repo block k-name v]
  (let [property-class      (db/pull repo '[*] [:property/name k-name])
        property-class-uuid (or (:block/uuid property-class) (random-uuid))]
    (cond-> []
      (nil? property-class) (conj {:property/schema {}
                                   :property/name k-name
                                   :block/uuid property-class-uuid
                                   :block/type "property"})
      true (conj {:block/uuid (:block/uuid block)
                  :block/properties (assoc (:block/properties block) (str property-class-uuid) v)}))))

(defn remove-property-when-db-based
  "return tx-data"
  [block k-uuid-or-builtin-k-name]
  {:pre (string? k-uuid-or-builtin-k-name)}
  (let [origin-properties (:block/properties block)]
    (assert (contains? (set (keys origin-properties)) k-uuid-or-builtin-k-name))
    [{:block/uuid (:block/uuid block)
      :block/properties (dissoc origin-properties k-uuid-or-builtin-k-name)}]))
