(ns logseq.db.frontend.entity-util
  "Lower level entity util fns for DB graphs"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.db]
            [datascript.impl.entity :as de]
            [logseq.common.util :as common-util])
  (:refer-clojure :exclude [object?]))

(defn- has-tag?
  [entity tag-ident]
  (when (or (map? entity) (de/entity? entity))
    (some (fn [t]
            (or (keyword-identical? (:db/ident t) tag-ident)
                (keyword-identical? t tag-ident)))
          (:block/tags entity))))

(comment
  (require '[logseq.common.profile :as c.p])
  (do (vreset! c.p/*key->call-count {})
      (vreset! c.p/*key->time-sum {}))
  (c.p/profile-fn! has-tag? :print-on-call? false))

(defn internal-page?
  [entity]
  (has-tag? entity :logseq.class/Page))

(defn class?
  [entity]
  (has-tag? entity :logseq.class/Tag))

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
      (journal? entity)
      (class? entity)
      (property? entity)
      (whiteboard? entity)))

(defn asset?
  "Given an entity or map, check if it is an asset block"
  [entity]
  ;; Can't use :block/tags because this is used in some perf sensitive fns like ldb/transact!
  (some? (:logseq.property.asset/type entity)))

(defn hidden?
  [page]
  (boolean
   (when page
     (if (string? page)
       (string/starts-with? page "$$$")
       (when (or (map? page) (de/entity? page))
         (:logseq.property/hide? page))))))

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

(defn built-in?
  "Built-in page or block"
  [entity]
  (:logseq.property/built-in? entity))

(defn get-pages-by-name
  [db page-name]
  (d/datoms db :avet :block/name (common-util/page-name-sanity-lc page-name)))
