(ns frontend.db-schema)

(defonce version "0.0.1")

(def files-db-schema
  {:file/path {:db/unique :db.unique/identity}
   :file/content {}})

;; A page can corresponds to multiple files (same title),
;; a month journal file can have multiple pages,
;; also, each block can be treated as a page too.
(def schema
  {:schema/version {}
   :db/ident        {:db/unique :db.unique/identity}

   ;; user
   :me/name  {}
   :me/email {}
   :me/avatar {}

   ;; TODO: local, github, dropbox, etc.
   :db/type {}

   ;; Git
   :repo/url        {:db/unique :db.unique/identity}
   :repo/cloned?    {}
   ;; local
   :git/latest-commit {}
   ;; remote
   :git/remote-latest-commit {}
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

   :page/name       {:db/unique      :db.unique/identity}
   :page/original-name {:db/unique      :db.unique/identity}
   :page/file       {:db/valueType   :db.type/ref}
   :page/properties {}
   :page/alias      {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/tags       {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/journal?   {}
   :page/journal-day {}
   :page/created-at {}
   :page/last-modified-at {}

   ;; block
   :block/uuid   {:db/unique      :db.unique/identity}
   :block/file   {:db/valueType   :db.type/ref}
   :block/format {}
   :block/title {}
   ;; belongs to which page
   :block/page   {:db/valueType   :db.type/ref}
   ;; referenced pages
   :block/ref-pages {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   ;; referenced blocks
   :block/ref-blocks {:db/valueType   :db.type/ref
                      :db/cardinality :db.cardinality/many}
   :block/embed-blocks {:db/valueType   :db.type/ref
                        :db/cardinality :db.cardinality/many}
   :block/embed-pages {:db/valueType   :db.type/ref
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
   :block/body {}
   :block/pre-block? {}
   :block/collapsed? {}
   :block/children {:db/cardinality :db.cardinality/many
                    :db/unique :db.unique/identity}
   :block/scheduled {}
   :block/scheduled-ast {}
   :block/deadline {}
   :block/deadline-ast {}
   :block/repeated? {}

   ;; TODO: To make this really working, every block needs a persisting `CUSTOM-ID`, which I'd like to avoid for now.
   ;; Any suggestions?
   :block/created-at {}
   :block/last-modified-at {}

   ;; For pages
   :tag/name       {:db/unique :db.unique/identity}

   ;; ;; Definitions, useful for tags and future anki cards
   ;; :definition/block {:db/valueType   :db.type/ref}
   ;; ;; Why not make :definition/key unique?
   ;; ;; Multiple definitions with the same key in either one page or multiple pages
   ;; :definition/key {}
   ;; :definition/value {}
})
