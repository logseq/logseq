(ns logseq.db.frontend.entity-util
  "Lower level entity util fns used across db namespaces"
  (:require [datascript.core :as d]
            [clojure.string :as string]
            [logseq.common.config :as common-config])
  (:refer-clojure :exclude [object?]))

(defn db-based-graph?
  "Whether the current graph is db-only"
  [db]
  (when db
    (= "db" (:kv/value (d/entity db :logseq.kv/db-type)))))

(defn page?
  [block]
  (contains? #{"page" "journal" "whiteboard" "class" "property" "hidden"}
             (:block/type block)))

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

(defn hidden?
  [page]
  (when page
    (if (string? page)
      (or (string/starts-with? page "$$$")
          (= common-config/favorites-page-name page))
      (= (:block/type page) "hidden"))))

(defn object?
  [node]
  (seq (:block/tags node)))