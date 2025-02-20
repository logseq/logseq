(ns logseq.db.file-based.schema
  "Schema related vars for file graphs")

;; A page is a special block, a page can corresponds to multiple files with the same ":block/name".
(def ^:large-vars/data-var schema
  "Schema for file graphs"
  {:db/ident        {:db/unique :db.unique/identity}
   :kv/value       {}
   :recent/pages {}

   ;; :block/type is a string type of the current block
   ;; "whiteboard" for whiteboards
   ;; "property" for property blocks
   ;; "class" for structured page
   :block/type {:db/index true}
   :block/uuid {:db/unique :db.unique/identity}
   :block/parent {:db/valueType :db.type/ref
                  :db/index true}
   :block/order {:db/index true}
   :block/collapsed? {}

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

   ;; page's namespace
   :block/namespace {:db/valueType :db.type/ref}

   ;; for pages
   :block/alias {:db/valueType :db.type/ref
                 :db/cardinality :db.cardinality/many}

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

   ;; first block that's not a heading or unordered list
   :block/pre-block? {}

   ;; scheduled day
   :block/scheduled {}

   ;; deadline day
   :block/deadline {}

   ;; whether blocks is a repeated block (usually a task)
   :block/repeated? {}

   :block/created-at {:db/index true}
   :block/updated-at {:db/index true}

   ;; page additional attributes
   ;; page's name, lowercase
   :block/name {:db/unique :db.unique/identity}

   ;; page's original name
   :block/title {:db/index true}

   ;; page's journal day
   :block/journal-day {:db/index true}

   ;; macros in block
   :block/macros {:db/valueType :db.type/ref
                  :db/cardinality :db.cardinality/many}

   ;; block's file
   :block/file {:db/valueType :db.type/ref}

   ;; latest tx that affected the block
   :block/tx-id {}

   ;; file
   :file/path {:db/unique :db.unique/identity}
   :file/content {}
   :file/created-at {}
   :file/last-modified-at {}
   :file/size {}})

(def file-only-attributes
  [:block/namespace :block/properties-text-values :block/pre-block? :recent/pages :block/file
   :block/properties :block/properties-order :block/repeated? :block/deadline :block/scheduled :block/priority
   :block/marker :block/macros :block/type :block/format])

(def retract-attributes
  #{:block/refs
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
    :block/warning})
