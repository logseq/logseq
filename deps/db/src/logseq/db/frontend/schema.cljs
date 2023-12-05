(ns logseq.db.frontend.schema
  "Main datascript schemas for the Logseq app"
  (:require [clojure.set :as set]))

(defonce version 2)
(defonce ast-version 1)
;; A page is a special block, a page can corresponds to multiple files with the same ":block/name".
(def ^:large-vars/data-var schema
  {:schema/version  {}
   :ast/version     {}
   :db/type         {}
   :db/ident        {:db/unique :db.unique/identity}

   :recent/pages {}

   ;; :block/type is a string type or multiple types of the current block
   ;; "whiteboard" for whiteboards
   ;; "macros" for macro
   ;; "property" for property blocks
   ;; "class" for structured page
   :block/type {:db/index true
                :db/cardinality :db.cardinality/many}
   :block/schema {}
   :block/uuid {:db/unique :db.unique/identity}
   :block/parent {:db/valueType :db.type/ref
                  :db/index true}
   :block/left   {:db/valueType :db.type/ref
                  :db/index true}
   :block/collapsed? {:db/index true}
   :block/collapsed-properties {:db/valueType :db.type/ref
                                :db/cardinality :db.cardinality/many}

   ;; :markdown, :org
   :block/format {}

   ;; belongs to which page
   :block/page {:db/valueType :db.type/ref
                :db/index true}
   ;; reference blocks
   :block/refs {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}
   ;; referenced pages inherited from the parents
   :block/path-refs {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}

   ;; tags are structured classes
   :block/tags {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}

   ;; which block this block links to, used for tag, embeds
   :block/link {:db/valueType :db.type/ref
                :db/index true}

   ;; for pages
   :block/alias {:db/valueType :db.type/ref
                 :db/cardinality :db.cardinality/many}

   ;; full-text for current block
   :block/content {}

   ;; todo keywords, e.g. "TODO", "DOING", "DONE"
   :block/marker {}

   ;; "A", "B", "C"
   :block/priority {}

   ;; map, key -> set of refs in property value or full text if none are found
   :block/properties {}
   ;; vector
   :block/properties-order {}
   ;; map, key -> original property value's content
   :block/properties-text-values {}

   ;; non-indexed metadata
   :block/metadata {}

   ;; first block that's not a heading or unordered list
   :block/pre-block? {}

   ;; scheduled day
   :block/scheduled {}

   ;; deadline day
   :block/deadline {}

   ;; whether blocks is a repeated block (usually a task)
   :block/repeated? {}

   :block/created-at {}
   :block/updated-at {}

   ;; page additional attributes
   ;; page's name, lowercase
   :block/name {:db/unique :db.unique/identity}

   ;; page's original name
   :block/original-name {:db/unique :db.unique/identity}
   ;; whether page's is a journal
   :block/journal? {}
   :block/journal-day {}
   ;; page's namespace
   :block/namespace {:db/valueType :db.type/ref}
   ;; macros in block
   :block/macros {:db/valueType :db.type/ref
                  :db/cardinality :db.cardinality/many}
   ;; block's file
   :block/file {:db/valueType :db.type/ref}

   ;; latest tx that affected the block
   :block/tx-id {}

   ;; file
   :file/path {:db/unique :db.unique/identity}
   ;; only store the content of logseq's files
   :file/content {}
   :file/handle {}
   ;; :file/created-at {}
   ;; :file/last-modified-at {}
   ;; :file/size {}
   })

(def schema-for-db-based-graph
  (merge
   (dissoc schema
           :block/properties-text-values :block/pre-block? :recent/pages :file/handle :block/file
           :block/properties-order)
   {:file/last-modified-at {}}))

(def retract-attributes
  #{
    :block/refs
    :block/tags
    :block/alias
    :block/marker
    :block/priority
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/pre-block?
    :block/properties
    :block/properties-order
    :block/properties-text-values
    :block/macros
    :block/invalid-properties
    :block/warning
    }
  )

;; If only block/content changes
(def db-version-retract-attributes
  #{:block/tags
    :block/refs
    :block/marker
    :block/priority
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/macros
    :block/warning})


;;; use `(map [:db.fn/retractAttribute <id> <attr>] retract-page-attributes)`
;;; to remove attrs to make the page as it's just created and no file attached to it
(def retract-page-attributes
  #{:block/created-at
    :block/updated-at
    :block/file
    :block/format
    :block/content
    :block/properties
    :block/properties-order
    :block/properties-text-values
    :block/invalid-properties
    :block/alias
    :block/tags})


(def ref-type-attributes
  (into #{}
        (keep (fn [[attr-name attr-body-map]]
                (when (= :db.type/ref (:db/valueType attr-body-map))
                  attr-name)))
        schema))

(def card-many-attributes
  (into #{}
        (keep (fn [[attr-name attr-body-map]]
                (when (= :db.cardinality/many (:db/cardinality attr-body-map))
                  attr-name)))
        schema))

(def card-many-ref-type-attributes
  (set/intersection card-many-attributes ref-type-attributes))

(def card-one-ref-type-attributes
  (set/difference ref-type-attributes card-many-attributes))

(def db-non-ref-attributes
  (->> schema-for-db-based-graph
       (keep (fn [[k v]]
               (when (not (:db/valueType v))
                 k)))
       set))
