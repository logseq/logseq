(ns frontend.db-schema)

(def files-db-schema
  {:file/path {:db/unique :db.unique/identity}
   :file/content {}})

;; A page can corresponds to multiple files (same title),
;; a month journal file can have multiple pages,
;; also, each block can be treated as a page if we support
;; "zoom edit".
(def schema
  {:db/ident        {:db/unique :db.unique/identity}

   ;; user
   :me/name  {}
   :me/email {}
   :me/avatar {}

   ;; local, github, dropbox, etc.
   :db/type {}
   :encrypted-token {}

   ;; Git
   :repo/url        {:db/unique :db.unique/identity}
   :repo/cloned?    {}
   :git/latest-commit {}
   :git/status {}
   :git/last-pulled-at {}
   ;; last error, better we should record all the errors
   :git/error {}

   ;; file
   :file/path       {:db/unique :db.unique/identity}
   :file/created-at {}
   :file/last-modified-at {}
   ;; TODO: calculate memory/disk usage
   ;; :file/size       {}

   :recent/pages    {}

   :page/id         {:db/unique      :db.unique/identity}
   :page/name       {:db/unique      :db.unique/identity}
   :page/original-name {}
   :page/file       {:db/valueType   :db.type/ref}
   :page/directives {}
   :page/alias      {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/tags       {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/definitions {:db/valueType   :db.type/ref
                      :db/cardinality :db.cardinality/many}
   :page/created-at {}
   :page/last-modified-at {}
   :page/contributors {}
   :page/journal?   {}
   :page/journal-day {}
   ;; TODO: page meta like :page/start-pos and :page/end-pos to improve the performance for month journal pages.
   ;; ;; Maybe we should add daily journal or weekly journal later.

   ;; block
   :block/type   {}
   :block/uuid   {:db/unique      :db.unique/identity}
   :block/file   {:db/valueType   :db.type/ref}
   :block/format {}
   ;; belongs to which page
   :block/page   {:db/valueType   :db.type/ref}
   ;; referenced pages
   :block/ref-pages {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   ;; referenced blocks
   :block/ref-blocks {:db/valueType   :db.type/ref
                      :db/cardinality :db.cardinality/many}
   :block/content {}
   :block/anchor {}
   :block/marker {}
   :block/priority {}
   :block/level {}
   :block/tags {:db/valueType   :db.type/ref
                :db/cardinality :db.cardinality/many
                :db/isComponent true}
   ;; :start-pos :end-pos
   :block/meta {}
   :block/properties {}
   :block/properties-meta {}

   ;; TODO: To make this really working, every block needs a persisting `CUSTOM-ID`, which I'd like to avoid for now.
   ;; Any suggestions?
   :block/created-at {}
   :block/last-modified-at {}

   :block/body {}
   :block/pre-block? {}
   :block/collapsed? {}
   :block/children {:db/cardinality :db.cardinality/many
                    :db/unique :db.unique/identity}

   ;; For pages
   :tag/name       {:db/unique :db.unique/identity}

   ;; Definitions, useful for tags and future anki cards
   :definition/block {:db/valueType   :db.type/ref}
   ;; Why not make :definition/key unique?
   ;; Multiple definitions with the same key in either one page or multiple pages
   :definition/key {}
   :definition/value {}})
