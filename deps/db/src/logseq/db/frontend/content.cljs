(ns logseq.db.frontend.content
  "fns to handle special ids"
  (:require [clojure.string :as string]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [datascript.core :as d]
            [logseq.db.sqlite.util :as sqlite-util]))

(defonce page-ref-special-chars "~^")

(defn special-id->page
  "Convert special id backs to page name."
  [content refs]
  (reduce
   (fn [content ref]
     (if (:block/name ref)
       (string/replace content (str page-ref-special-chars (:block/uuid ref)) (:block/original-name ref))
       content))
   content
   refs))

(defn special-id-ref->page
  "Convert special id ref backs to page name."
  [content refs]
  (reduce
   (fn [content ref]
     (if (:block/name ref)
       (string/replace content
                       (str page-ref/left-brackets
                            page-ref-special-chars
                            (:block/uuid ref)
                            page-ref/right-brackets)
                       (:block/original-name ref))
       content))
   content
   refs))

(defn update-block-content
  "Replace `[[internal-id]]` with `[[page name]]`"
  [repo db item eid]
  (if (sqlite-util/db-based-graph? repo)
    (if-let [content (:block/content item)]
      (let [refs (:block/refs (d/entity db eid))]
        (assoc item :block/content (special-id->page content refs)))
      item)
    item))
