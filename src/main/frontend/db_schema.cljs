(ns frontend.db-schema)

(defonce version "0.0.2")

;; A page is a special block, a page can corresponds to multiple files with the same ":block/name".
(def schema
  {:schema/version  {}
   :db/type         {}
   :db/ident        {:db/unique :db.unique/identity}

   :db/encrypted?    {}
   :db/encryption-keys {}

   ;; user
   :me/name {}
   :me/email {}
   :me/avatar {}

   ;; Git
   :repo/url {:db/unique :db.unique/identity}

   :recent/pages {}

   :block/type {}
   :block/uuid {:db/unique :db.unique/identity}
   :block/parent {:db/valueType :db.type/ref}
   :block/left {:db/valueType :db.type/ref}

   ;; :markdown, :org
   :block/format {}

   ;; mldoc parsed ast
   :block/title {}

   ;; belongs to which page
   :block/page {:db/valueType :db.type/ref
                :db/index true}
   ;; reference blocks
   :block/refs {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}
   ;; referenced pages inherited from the parents
   :block/path-refs {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}

   ;; for pages
   :block/tags {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}

   ;; for pages
   :block/alias {:db/valueType :db.type/ref
                 :db/cardinality :db.cardinality/many}

   ;; full-text for current block
   :block/content {}

   ;; todo keywords, e.g. "TODO", "DOING", "DONE"
   :block/marker {}

   ;; "A", "B", "C"
   :block/priority {}

   ;; 1, 2, 3, etc.
   :block/level {}
   ;; TODO: remove :block/meta, :start-pos :end-pos
   :block/meta {}

   ;; block key value properties
   :block/properties {}

   ;; parsed ast
   :block/body {}

   ;; first block that's not a heading or unordered list
   :block/pre-block? {}

   ;; whether block is collapsed
   :block/collapsed? {}

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

   ;; block's file
   :block/file {:db/valueType :db.type/ref}

   ;; file
   :file/path {:db/unique :db.unique/identity}
   ;; only store the content of logseq's files
   :file/content {}
   :file/handle {}
   ;; :file/created-at {}
   ;; :file/last-modified-at {}
   ;; :file/size {}
   ;; :file/handle {}

   ;; git
   :repo/cloned? {}
   :git/status {}
   :git/last-pulled-at {}
   ;; last error, better we should record all the errors
   :git/error {}

   })

(def retract-attributes
  #{
    :block/refs
    :block/path-refs
    :block/tags
    :block/alias
    :block/marker
    :block/priority
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/properties
    }
  )
