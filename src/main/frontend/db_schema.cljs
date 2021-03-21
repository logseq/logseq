(ns frontend.db-schema)

(defonce version "0.0.1")

;; TODO: remove files db schema
(def files-db-schema
  {:file/path {:db/unique :db.unique/identity}
   :file/content {}
   :file/size {}
   :file/handle {}})

;; A page is a special block, a page can corresponds to multiple files with the same ":page/name".
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

   :block/uuid {:db/unique :db.unique/identity}
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

   :block/alias {:db/valueType :db.type/ref
                 :db/cardinality :db.cardinality/many}

   :block/content {}
   :block/marker {}
   :block/priority {}
   :block/level {}
   ;; TODO: remove :block/meta, :start-pos :end-pos
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
   :block/repeated? {}

   :block/created-at {}
   :block/updated-at {}

   ;; page additional attributes
   :block/name {:db/unique :db.unique/identity}
   :block/original-name {:db/unique :db.unique/identity}
   :block/journal? {}
   :block/journal-day {}

   :block/file {:db/valueType :db.type/ref}

   ;; file
   :file/path {:db/unique :db.unique/identity}
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
   :block/refs {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}
   :block/embeds {:db/cardinality :db.cardinality/many}
   :block/created-at {}
   :block/updated-at {}
   :block/alias {:db/cardinality :db.cardinality/many}
   :block/tags {:db/cardinality :db.cardinality/many}
   :block/journal? {}})
