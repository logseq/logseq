(ns logseq.melange.bridge.db.entity
  "DataScript entity read representation boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime])
  (:refer-clojure :exclude [object?]))

(def ^:private entity-read-api (.-EntityRead melange-db))

(defn- has-tag?
  [entity tag-ident]
  ((.-hasTagWith entity-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   entity
   (subs (str tag-ident) 1)))

(defn internal-page?
  [entity]
  (has-tag? entity :logseq.class/Page))

(defn class?
  [entity]
  (has-tag? entity :logseq.class/Tag))

(defn property?
  [entity]
  (has-tag? entity :logseq.class/Property))

(defn closed-value?
  [entity]
  ((.-fieldPresentWith entity-read-api)
   (runtime/runtime-adapter) (d/adapter) entity "block/closed-value-property"))

(defn journal?
  "Given a page entity or map, checks whether it is a journal page."
  [entity]
  (has-tag? entity :logseq.class/Journal))

(defn page?
  [entity]
  ((.-pageWith entity-read-api)
   (runtime/runtime-adapter) (d/adapter) entity))

(defn asset?
  "Given an entity or map, checks whether it is an asset block."
  [entity]
  ((.-fieldPresentWith entity-read-api)
   (runtime/runtime-adapter) (d/adapter) entity "logseq.property.asset/type"))

(defn hidden?
  [page]
  ((.-hiddenWith entity-read-api)
   (runtime/runtime-adapter) (d/adapter) page))

(defn recycled?
  [entity]
  ((.-recycledWith entity-read-api)
   (runtime/runtime-adapter) (d/adapter) entity))

(defn object?
  [node]
  (seq ((.-fieldValueWith entity-read-api)
        (runtime/runtime-adapter) (d/adapter) node "block/tags")))

(defn get-entity-types
  "Returns entity types derived from `:block/tags`."
  [entity]
  (set (map keyword
            (seq ((.-entityTypesWith entity-read-api)
                  (runtime/runtime-adapter) (d/adapter) entity)))))

(defn built-in?
  "Returns the stored built-in marker for a page or block."
  [entity]
  ((.-fieldValueWith entity-read-api)
   (runtime/runtime-adapter) (d/adapter) entity "logseq.property/built-in?"))

(defn get-pages-by-name
  [db page-name]
  ((.-pagesByNameWith entity-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   page-name))

(defn entity->map
  "Converts a DataScript entity to a map with `:db/id`."
  [entity]
  (assert (d/entity? entity))
  ((.-entityToMapWith entity-read-api)
   (runtime/runtime-adapter) (d/adapter) entity))
