(ns logseq.db.frontend.entity-util
  "Lower level entity util fns used across db namespaces"
  (:require [datascript.core :as d]
            [clojure.string :as string]
            [datascript.impl.entity :as de])
  (:refer-clojure :exclude [object?]))

(defn db-based-graph?
  "Whether the current graph is db-only"
  [db]
  (when db
    (= "db" (:kv/value (d/entity db :logseq.kv/db-type)))))

(defn- has-tag?
  [entity tag-ident]
  (let [tags (:block/tags entity)]
    (some (fn [t] (or (= (:db/ident t) tag-ident)
                      (= t tag-ident)))
          (if (coll? tags) tags [tags]))))

(defn internal-page?
  [entity]
  (has-tag? entity :logseq.class/Page))

(defn class?
  [entity]
  (or (= (:db/ident entity) :logseq.class/Tag)
      (has-tag? entity :logseq.class/Tag)))

(defn property?
  [entity]
  (has-tag? entity :logseq.class/Property))

(defn whiteboard?
  "Given a page entity or map, check if it is a whiteboard page"
  [entity]
  (has-tag? entity :logseq.class/Whiteboard))

(defn closed-value?
  [entity]
  (some? (:block/closed-value-property entity)))

(defn journal?
  "Given a page entity or map, check if it is a journal page"
  [entity]
  (has-tag? entity :logseq.class/Journal))

(defn page?
  [entity]
  (or (internal-page? entity)
      (class? entity)
      (property? entity)
      (whiteboard? entity)
      (journal? entity)))

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
      (when (or (map? page) (de/entity? page))
        (false? (get-in page [:block/schema :public?]))))))

(defn object?
  [node]
  (seq (:block/tags node)))

(defn get-entity-types
  "Get entity types from :block/tags"
  [entity]
  (let [ident->type {:logseq.class/Tag :class
                     :logseq.class/Property :property
                     :logseq.class/Journal :journal
                     :logseq.class/Whiteboard :whiteboard
                     :logseq.class/Page :page}]
    (set (map #(ident->type (:db/ident %)) (:block/tags entity)))))

(def internal-tags
  #{:logseq.class/Page :logseq.class/Property :logseq.class/Tag :logseq.class/Root
    :logseq.class/Asset})
