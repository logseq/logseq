(ns logseq.db.frontend.entity-util
  "Lower level entity util fns used across db namespaces"
  (:require [datascript.core :as d]
            [clojure.string :as string])
  (:refer-clojure :exclude [object?]))

(defn db-based-graph?
  "Whether the current graph is db-only"
  [db]
  (when db
    (= "db" (:kv/value (d/entity db :logseq.kv/db-type)))))

(defn page?
  [block]
  (contains? #{"page" "journal" "whiteboard" "class" "property"}
             (:block/type block)))

(defn internal-page?
  [entity]
  (= (:block/type entity) "page"))

(defn class?
  [entity]
  (= (:block/type entity) "class"))

(defn property?
  [entity]
  (= (:block/type entity) "property"))

(defn closed-value?
  [entity]
  (= (:block/type entity) "closed value"))

(defn whiteboard?
  "Given a page entity or map, check if it is a whiteboard page"
  [page]
  (= (:block/type page) "whiteboard"))

(defn journal?
  "Given a page entity or map, check if it is a journal page"
  [page]
  (= (:block/type page) "journal"))

(defn asset?
  "Given an entity or map, check if it is an asset block"
  [entity]
  ;; Can't use :block/tags because this is used in some perf sensitive fns like ldb/transact!
  (some? (:logseq.property.asset/type entity)))

(defn hidden?
  [page]
  (when page
    (if (string? page)
      (string/starts-with? page "$$$")
      (when (map? page)
        (false? (get-in page [:block/schema :public?]))))))

(defn object?
  [node]
  (seq (:block/tags node)))
