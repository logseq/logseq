(ns frontend.db.utils
  "Test-only db utilities."
  (:require [datascript.core :as d]))

(defn entity
  "This function will return nil if passed `eid` is an integer and
  the entity doesn't exist in db.
  `db`: a db value,
  `eid`: same as d/entity."
  [db eid]
  (when (and db eid)
    (assert (or (number? eid)
                (sequential? eid)
                (keyword? eid)
                (uuid? eid))
            (do
              (js/console.trace)
              (str "Invalid entity eid: " (pr-str eid))))
    (d/entity db (if (uuid? eid) [:block/uuid eid] eid))))

(defn q
  [db query & inputs]
  (apply d/q query db inputs))
