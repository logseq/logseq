(ns logseq.db.frontend.property.util
  "Property related util fns. Fns used in both DB and file graphs should go here"
  (:require [logseq.db.frontend.property :as db-property]
            [datascript.core :as d]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property.type :as db-property-type]))

(defn get-pid
  "Get a built-in property's id (keyword name for file graph and db-ident for db
  graph) given its db-ident. No need to use this fn in a db graph only context"
  [repo db-ident]
  (if (sqlite-util/db-based-graph? repo)
    db-ident
    (get-in db-property/built-in-properties [db-ident :name] (name db-ident))))

(defn built-in-has-ref-value?
  "Given a built-in's db-ident, determine if its property value is a ref"
  [db-ident]
  (contains? db-property-type/value-ref-property-types
             (get-in db-property/built-in-properties [db-ident :schema :type])))

(defn lookup
  "Get the property value by a built-in property's db-ident from coll. For file and db graphs"
  [repo coll db-ident]
  (if (sqlite-util/db-based-graph? repo)
    (let [val (get coll db-ident)]
      (if (built-in-has-ref-value? db-ident) (db-property/property-value-content val) val))
    (get coll (get-pid repo db-ident))))

(defn get-block-property-value
  "Get the value of built-in block's property by its db-ident"
  [repo db block db-ident]
  (when db
    (let [block (or (d/entity db (:db/id block)) block)]
     (lookup repo (:block/properties block) db-ident))))

(defn shape-block?
  [repo db block]
  (= :whiteboard-shape (get-block-property-value repo db block :logseq.property/ls-type)))
