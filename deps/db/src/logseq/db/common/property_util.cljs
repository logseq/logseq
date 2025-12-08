(ns logseq.db.common.property-util
  "Property related util fns. Fns used in both DB and file graphs should go here"
  (:require [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn get-file-pid
  "Gets file graph property id given the db graph ident"
  [db-ident]
  ;; Map of unique cases where the db graph keyword name is different than the file graph id
  (let [unique-file-ids {:logseq.property/order-list-type :logseq.order-list-type
                         :logseq.property.tldraw/page :logseq.tldraw.page
                         :logseq.property.tldraw/shape :logseq.tldraw.shape
                         :logseq.property/publishing-public? :public}]
    (or (get unique-file-ids db-ident)
        (keyword (name db-ident)))))

;; TODO: replace repo with db later to remove this fn
(defn get-pid
  "Get a built-in property's id (keyword name for file graph and db-ident for db
  graph) given its db-ident. No need to use this fn in a db graph only context"
  [repo db-ident]
  (if (sqlite-util/db-based-graph? repo)
    db-ident
    (get-file-pid db-ident)))

(defn lookup
  "Get the property value by a built-in property's db-ident from coll. For file and db graphs"
  [repo block db-ident]
  (if (sqlite-util/db-based-graph? repo)
    (let [val (get block db-ident)]
      (if (db-property/built-in-has-ref-value? db-ident) (db-property/property-value-content val) val))
    (get (:block/properties block) (get-pid repo db-ident))))

(defn get-block-property-value
  "Get the value of built-in block's property by its db-ident"
  [repo db block db-ident]
  (when db
    (let [block (or (d/entity db (:db/id block)) block)]
      (lookup repo block db-ident))))

(defn shape-block?
  [repo db block]
  (= :whiteboard-shape (get-block-property-value repo db block :logseq.property/ls-type)))
