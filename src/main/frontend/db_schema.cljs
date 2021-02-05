(ns frontend.db-schema)

(defonce version "0.0.1")

(def files-db-schema
  {:file/path {:db/unique :db.unique/identity}
   :file/content {}
   :file/last-modified-at {}
   :file/size {}
   :file/handle {}})

;; A page can corresponds to multiple files (same title),
;; a month journal file can have multiple pages,
;; also, each block can be treated as a page too.
(def schema
  {:schema/version {}
   :db/type {}
   :db/ident {:db/unique :db.unique/identity}

   ;; user
   :me/name {}
   :me/email {}
   :me/avatar {}

   ;; Git
   :repo/url {:db/unique :db.unique/identity}
   :repo/cloned? {}
   :git/status {}
   :git/last-pulled-at {}
   ;; last error, better we should record all the errors
   :git/error {}

   ;; file
   :file/path {:db/unique :db.unique/identity}
   :file/created-at {}
   :file/last-modified-at {}

   ;; toggle to comment this line to force to clone
   :release/re-clone? {}

   :recent/pages {}

   :page/name {:db/unique :db.unique/identity}
   :page/original-name {:db/unique :db.unique/identity}
   :page/file {:db/valueType :db.type/ref}
   :page/properties {}
   :page/alias {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}
   :page/tags {:db/valueType :db.type/ref
               :db/cardinality :db.cardinality/many}
   :page/journal? {}
   :page/journal-day {}
   :page/created-at {}
   :page/last-modified-at {}

   ;; block
   :block/uuid {:db/unique :db.unique/identity}
   :block/file {:db/valueType :db.type/ref}
   :block/format {}
   :block/title {}
   ;; belongs to which page
   :block/page {:db/valueType :db.type/ref
                :db/index true}
   ;; referenced pages
   :block/ref-pages {:db/valueType :db.type/ref
                     :db/cardinality :db.cardinality/many}

   ;; Referenced pages
   ;; Notice: it's only for org mode, :tag1:tag2:
   ;; Markdown tags will be only stored in :block/ref-pages
   :block/tags {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}

   ;; referenced blocks
   :block/ref-blocks {:db/valueType :db.type/ref
                      :db/cardinality :db.cardinality/many}
   :block/embed-blocks {:db/valueType :db.type/ref
                        :db/cardinality :db.cardinality/many}
   :block/embed-pages {:db/valueType :db.type/ref
                       :db/cardinality :db.cardinality/many}
   :block/content {}
   :block/anchor {}
   :block/marker {}
   :block/priority {}
   :block/level {}
   ;; :start-pos :end-pos
   :block/meta {}
   :block/properties {}
   :block/body {}
   :block/pre-block? {}
   :block/collapsed? {}
   :block/children {:db/valueType :db.type/ref
                    :db/cardinality :db.cardinality/many
                    :db/unique :db.unique/identity}
   :block/scheduled {}
   :block/scheduled-ast {}
   :block/deadline {}
   :block/deadline-ast {}
   :block/repeated? {}})

(def outline-schema
  {:schema/version {}
   :db/type {}
   :db/ident {:db/unique :db.unique/identity}

   ;; user
   :me/name {}
   :me/email {}
   :me/avatar {}

   ;; block
   :block/id {:db/unique :db.unique/identity}
   :block/parent-id {:db/valueType :db.type/ref}
   :block/left-id {:db/valueType :db.type/ref}
   :block/type {}
   :block/title {}
   :block/content {}
   :block/properties {}
   :block/ref-blocks {:db/valueType :db.type/ref
                      :db/cardinality :db.cardinality/many}
   :block/embed-blocks {:db/cardinality :db.cardinality/many}
   :block/created-at {}
   :block/updated-at {}
   :block/alias {:db/cardinality :db.cardinality/many}
   :block/tags {:db/cardinality :db.cardinality/many}
   :block/journal? {}})
