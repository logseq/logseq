(ns frontend.db-schema)

(def files-db-schema
  {:file/path {:db/unique :db.unique/identity}
   :file/content {}})

;; A page can corresponds to multiple files (same title),
;; a month journal file can have multiple pages,
;; also, each heading can be treated as a page if we support
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
   :git/write-permission? {}
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
   :page/list {}
   :page/alias      {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/tags       {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/created-at {}
   :page/last-modified-at {}
   :page/contributors {}
   :page/journal?   {}
   :page/journal-day {}
   ;; TODO: page meta like :page/start-pos and :page/end-pos to improve the performance for month journal pages.
   ;; ;; Maybe we should add daily journal or weekly journal later.
   ;; :page/headings {:db/valueType   :db.type/ref
   ;;                 :db/cardinality :db.cardinality/many
   ;;                 :db/isComponent true}

   ;; heading
   :heading/uuid   {:db/unique      :db.unique/identity}
   :heading/file   {:db/valueType   :db.type/ref}
   :heading/format {}
   ;; belongs to which page
   :heading/page   {:db/valueType   :db.type/ref}
   ;; referenced pages
   :heading/ref-pages {:db/valueType   :db.type/ref
                       :db/cardinality :db.cardinality/many}
   ;; referenced headings
   :heading/ref-headings {:db/valueType   :db.type/ref
                          :db/cardinality :db.cardinality/many}
   :heading/content {}
   :heading/anchor {}
   :heading/marker {}
   :heading/priority {}
   :heading/level {}
   :heading/tags {:db/valueType   :db.type/ref
                  :db/cardinality :db.cardinality/many
                  :db/isComponent true}
   :heading/meta {}
   :heading/properties {}
   :heading/properties-meta {}

   ;; TODO: To make this really working, every heading needs a persisting `CUSTOM-ID`, which I'd like to avoid for now.
   ;; Any suggestions?
   :heading/created-at {}
   :heading/last-modified-at {}

   :heading/body {}
   :heading/pre-heading? {}
   :heading/collapsed? {}
   :heading/children {:db/cardinality :db.cardinality/many
                      :db/unique :db.unique/identity}

   :tag/name       {:db/unique :db.unique/identity}})
