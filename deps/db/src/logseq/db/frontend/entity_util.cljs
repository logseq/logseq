(ns logseq.db.frontend.entity-util
  "Lower level entity util fns used across db namespaces"
  (:require [clojure.string :as string]
            [datascript.db]
            [datascript.impl.entity :as de])
  (:refer-clojure :exclude [object?]))

(defn- has-tag?
  [entity tag-ident]
  (some (fn [t]
          (or (keyword-identical? (:db/ident t) tag-ident)
              (keyword-identical? t tag-ident)))
        (:block/tags entity)))

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
  (or
   ;; db based graph
   (has-tag? entity :logseq.class/Whiteboard)
   ;; file based graph
   (identical? "whiteboard" (:block/type entity))))

(defn closed-value?
  [entity]
  (some? (:block/closed-value-property entity)))

(defn journal?
  "Given a page entity or map, check if it is a journal page"
  [entity]
  (or
   ;; db based graph
   (has-tag? entity :logseq.class/Journal)
   ;; file based graph
   (identical? "journal" (:block/type entity))))

(defn page?
  [entity]
  (or
   ;; db based graph
   (internal-page? entity)
   (class? entity)
   (property? entity)
   (whiteboard? entity)
   (journal? entity)

   ;; file based graph
   (contains? #{"page" "journal" "whiteboard"} (:block/type entity))))

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
