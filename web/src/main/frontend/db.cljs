(ns frontend.db
  (:require [datascript.core :as d]
            [frontend.util :as util]
            [medley.core :as medley]
            [datascript.transit :as dt]
            [frontend.format :as format]
            [frontend.format.org-mode :as org]
            [frontend.format.org.block :as block]
            [clojure.string :as string]
            [frontend.utf8 :as utf8]))

(def datascript-db "logseq/DB")
(def schema
  {:db/ident        {:db/unique :db.unique/identity}

   ;; user
   :me/name  {}
   :me/email {}
   :me/avatar {}

   ;; repo
   :repo/url        {:db/unique :db.unique/identity}
   :repo/cloning?   {}
   :repo/cloned?    {}
   :repo/current    {:db/valueType   :db.type/ref}

   ;; TODO: how to express compound unique, [:file/repo, :file/path]
   ;; file
   :file/path       {:db/unique :db.unique/identity}
   :file/repo       {:db/valueType   :db.type/ref}
   :file/content    {}
   ;; TODO: calculate memory/disk usage
   ;; :file/size       {}

   :page/uuid       {:db/unique      :db.unique/identity}
   :page/name       {:db/unique      :db.unique/identity}
   :page/file       {:db/valueType   :db.type/ref}
   :page/journal?   {}

   :reference/uuid    {:db/unique      :db.unique/identity}
   :reference/text    {}
   :reference/file    {:db/valueType   :db.type/ref}
   :reference/heading {:db/valueType   :db.type/ref}

   ;; heading
   :heading/uuid   {:db/unique      :db.unique/identity}
   :heading/repo   {:db/valueType   :db.type/ref}
   :heading/file   {:db/valueType   :db.type/ref}
   :heading/page   {:db/valueType   :db.type/ref}
   :heading/anchor {}
   :heading/marker {}
   :heading/priority {}
   :heading/level {}
   :heading/tags {:db/valueType   :db.type/ref
                  :db/cardinality :db.cardinality/many
                  :db/isComponent true}

   ;; tag
   :tag/name       {:db/unique :db.unique/identity}

   ;; task
   :task/scheduled {:db/index       true}
   :task/deadline  {:db/index       true}
   })

(defonce conn
  (d/create-conn schema))

;; transit serialization

(defn db->string [db]
  (dt/write-transit-str db))

(defn string->db [s]
  (dt/read-transit-str s))

;; persisting DB between page reloads
(defn persist [db]
  (js/localStorage.setItem datascript-db (db->string db)))

(defn reset-conn! [db]
  (reset! conn db))

;; (new TextEncoder().encode('foo')).length
(defn db-size
  []
  (when-let [store (js/localStorage.getItem datascript-db)]
    (let [bytes (.-length (.encode (js/TextEncoder.) store))]
      (/ bytes 1000))))

(defn kv
  [key value]
  {:db/id -1
   :db/ident key
   key value})

;; TODO: added_at, started_at, schedule, deadline
(def qualified-map
  {:file :heading/file
   :anchor :heading/anchor
   :title :heading/title
   :marker :heading/marker
   :priority :heading/priority
   :level :heading/level
   :timestamps :heading/timestamps
   :children :heading/children
   :tags :heading/tags
   :meta :heading/meta
   })

;; (def schema
;;   [{:db/ident       {:db/unique :db.unique/identity}}

;;    ;; {:db/ident       :heading/title
;;    ;;  :db/valueType   :db.type/string
;;    ;;  :db/cardinality :db.cardinality/one}

;;    ;; {:db/ident       :heading/parent-title
;;    ;;  :db/valueType   :db.type/string
;;    ;;  :db/cardinality :db.cardinality/one}

;;    ;; TODO: timestamps, meta
;;    ;; scheduled, deadline
;;    ])

(defn- safe-headings
  [headings]
  (mapv (fn [heading]
          (let [heading (-> (util/remove-nils heading)
                            (assoc :heading/uuid (d/squuid)))]
            (medley/map-keys
             (fn [k] (get qualified-map k k))
             heading)))
        headings))

;; queries

(defn- distinct-result
  [query-result]
  (-> query-result
      seq
      flatten
      distinct))

(def seq-flatten (comp flatten seq))

(defn get-all-tags
  []
  (distinct-result
   (d/q '[:find ?tags
          :where
          [?h :heading/tags ?tags]]
     @conn)))

(defn get-repo-headings
  [repo-url]
  (-> (d/q '[:find ?heading
             :in $ ?repo-url
             :where
             [?repo :repo/url ?repo-url]
             [?heading :heading/repo ?repo]]
        @conn repo-url)
      seq-flatten))

(defn- remove-journal-files
  [files]
  (remove
   (fn [file]
     (string/starts-with? file "journals/"))
   files))

(defn get-files
  ([]
   (->> (d/q '[:find ?path
               :where
               [_     :repo/current ?repo]
               [?file :file/repo ?repo]
               [?file :file/path ?path]]
          @conn)
        (map first)
        distinct
        remove-journal-files))
  ([repo-url]
   (->> (d/q '[:find ?path
               :where
               [?repo :repo/url ?repo-url]
               [?file :file/repo ?repo]
               [?file :file/path ?path]]
          @conn repo-url)
        (map first)
        distinct
        remove-journal-files)))

(defn get-pages
  []
  (->> (d/q '[:find ?page-name
              :where
              [_     :repo/current ?repo]
              [?page :page/name ?page-name]]
         @conn)
       (map first)
       distinct))

(defn get-files-headings
  [repo-url paths]
  (let [paths (set paths)
        pred (fn [db e]
               (contains? paths e))]
    (-> (d/q '[:find ?heading
               :in $ ?repo-url ?pred
               :where
               [?repo :repo/url ?repo-url]
               [?file :file/path ?path]
               [(?pred $ ?path)]
               [?heading :heading/file ?file]
               [?heading :heading/repo ?repo]]
          @conn repo-url pred)
        seq-flatten)))

(defn delete-headings
  ([repo-url]
   (let [headings (get-repo-headings repo-url)]
     (mapv (fn [eid] [:db.fn/retractEntity eid]) headings)))
  ([repo-url files]
   (when (seq files)
     (let [headings (get-files-headings repo-url files)]
       (mapv (fn [eid] [:db.fn/retractEntity eid]) headings)))))

(defn delete-files
  ([repo-url]
   (delete-files repo-url (get-files repo-url)))
  ([repo-url files]
   (mapv (fn [path] [:db.fn/retractEntity [:file/path path]]) files)))

(defn get-file-headings
  [repo-url path]
  (-> (d/q '[:find ?heading
             :in $ ?repo-url ?path
             :where
             [?repo :repo/url ?repo-url]
             [?file :file/path ?path]
             [?heading :heading/file ?file]
             [?heading :heading/repo ?repo]]
        @conn repo-url path)
      seq-flatten))

(defn delete-file-headings!
  [repo-url path]
  (let [headings (get-file-headings repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) headings)))

(defn reset-contents-and-headings!
  [repo-url contents headings-pages delete-files delete-headings]
  (let [file-contents (map (fn [[file content]]
                             (when content
                               {:file/repo [:repo/url repo-url]
                                :file/path file
                                :file/content content}))
                        contents)
        all-data (-> (concat delete-files delete-headings file-contents headings-pages)
                     (util/remove-nils))]
    (d/transact! conn all-data)))

(defn get-all-headings
  []
  (seq-flatten
   (d/q '[:find (pull ?h [*])
          :where
          [?h :heading/title]]
     @conn)))

(defn search-headings-by-title
  [title])

(defn get-headings-by-tag
  [tag]
  (let [pred (fn [db tags]
               (some #(= tag %) tags))]
    (d/q '[:find (flatten (pull ?h [*]))
           :in $ ?pred
           :where
           [?h :heading/tags ?tags]
           [(?pred $ ?tags)]]
      @conn pred)))

(defn transact!
  [tx-data]
  (d/transact! conn tx-data))

(defn set-key-value
  [key value]
  (transact! [(kv key value)]))

(defn get-key-value
  ([key]
   (get-key-value (d/db conn)))
  ([db key]
   (some-> (d/entity db key)
           key)))

(defn get-current-repo
  ([]
   (get-current-repo (d/db conn)))
  ([db]
   (:repo/url (get-key-value db :repo/current))))

(defn sort-by-pos
  [headings]
  (sort-by (fn [heading]
             (get-in heading [:heading/meta :pos]))
           headings))

(defn get-file-by-concat-headings
  ([path]
   (get-file-by-concat-headings (get-current-repo)
                                path))
  ([repo-url path]
   (->> (d/q '[:find (pull ?heading [*])
               :in $ ?repo-url ?path
               :where
               [?repo :repo/url ?repo-url]
               [?file :file/path ?path]
               [?heading :heading/file ?file]
               [?heading :heading/repo ?repo]]
          @conn repo-url path)
        seq-flatten
        sort-by-pos)))

(defn get-page-by-concat-headings
  ([page]
   (get-page-by-concat-headings (get-current-repo)
                                page))
  ([repo-url page]
   (->> (d/q '[:find (pull ?heading [*])
               :in $ ?repo-url ?page
               :where
               [?repo :repo/url ?repo-url]
               [?p :page/name ?page]
               [?heading :heading/page ?p]
               [?heading :heading/repo ?repo]]
          @conn repo-url page)
        seq-flatten
        sort-by-pos)))

;; TODO: quite slow
(defn get-children-headings
  [file heading-uuid heading-level]
  (let [file (:db/id file)
        pred (fn [db meta level child-meta child-level]
               (and
                (>= child-level level)
                (< (:pos meta) (:pos child-meta))))]
    (->> (d/q '[:find (pull ?child [*])
                :in $ ?file ?heading-uuid ?pred
                :where
                [?heading :heading/file ?file]
                [?heading :heading/uuid ?heading-uuid]
                [?heading :heading/repo ?repo]
                [?child   :heading/file ?file]
                [?child   :heading/repo ?repo]
                [?heading :heading/level ?level]
                [?heading :heading/meta ?meta]
                [?child   :heading/meta ?child-meta]
                [?child   :heading/level ?child-level]
                [(?pred $ ?meta ?level ?child-meta ?child-level)]]
           @conn file heading-uuid pred)
         seq-flatten
         sort-by-pos
         (take-while (fn [{:heading/keys [level]}]
                       (> level heading-level))))))

(defn set-current-repo!
  [repo]
  (set-key-value :repo/current [:repo/url repo]))

(defn mark-repo-as-cloned
  [repo-url]
  (d/transact! conn
    [{:repo/url repo-url
      :repo/cloned? true}
     (kv :repo/current [:repo/url repo-url])]))

(defn cloned?
  [repo-url]
  (->
   (d/q '[:find ?cloned
          :in $ ?repo-url
          :where
          [?repo :repo/url ?repo-url]
          [?repo :repo/cloned? ?cloned]]
     @conn repo-url)
   first))

(defn get-repos
  []
  (->> (d/q '[:find ?url
              :where [_ :repo/url ?url]]
         @conn)
       (map first)
       distinct))

(defn get-page-name
  [file ast]
  (when-let [heading (first (filter block/heading-block? ast))]
    (when-let [title (:title (second heading))]
      ;; FIXME:
      (str title)
      (first (string/split file #"\.")))))

(defn get-page-uuid
  [page-name]
  (:page/uuid (d/entity (d/db conn)
                        [:page/name page-name])))

(defn valid-journal-title?
  [title]
  (and title
       (not (js/isNaN (js/Date.parse title)))))

(defonce debug-headings (atom nil))
;; file
;; check journal formats and report errors
(defn extract-journal-pages-and-headings
  [repo-url file content]
  (let [ast (org/->clj content)
        headings (block/extract-headings ast)
        pages (loop [pages {}
                     last-page-name nil
                     headings headings]
                (if (seq headings)
                  (let [[{:keys [level title] :as heading} & tl] headings]
                    (if (and (= level 1)
                             (when-let [title (last (first title))]
                               (valid-journal-title? title)))
                      (let [page-name (last (first title))
                            new-pages (assoc pages page-name [heading])]
                        (recur new-pages page-name tl))
                      (let [new-pages (update pages last-page-name (fn [headings]
                                                                     (vec (conj headings heading))))]
                        (recur new-pages last-page-name tl))))
                  pages))
        headings (mapcat
                  (fn [[page headings]]
                    (if page
                      (map (fn [heading]
                             (assoc heading
                                    :heading/repo [:repo/url repo-url]
                                    :heading/file [:file/path file]
                                    :heading/page [:page/name page]))
                        headings)))
                  pages)
        headings (safe-headings headings)
        pages (map
                (fn [page]
                  {:page/uuid (d/squuid)
                   :page/name page
                   :page/file [:file/path file]
                   :page/journal? true})
                (keys pages))]
    (reset! debug-headings headings)
    (vec
     (concat
      pages
      headings))))

(comment
  (def file "journals/2020_04.org")
  (def content (get-file file))
  (def ast (org/->clj content))
  (def headings (block/extract-headings ast))
  (def pages (loop [pages {}
                    last-page-name nil
                    headings headings]
               (if (seq headings)
                 (let [[{:keys [level title] :as heading} & tl] headings]
                   (if (and (= level 1)
                            (when-let [title (last (first title))]
                              (valid-journal-title? title)))
                     (let [page-name (last (first title))
                           new-pages (assoc pages page-name [heading])]
                       (recur new-pages page-name tl))
                     (let [new-pages (update pages last-page-name (fn [headings]
                                                                    (vec (conj headings heading))))]
                       (recur new-pages last-page-name tl))))
                 pages)))
  (def pages (partition-by (fn [{:keys [level title]}]
                             (and
                              (= level 1)
                              (when-let [title (last (first title))]
                                (valid-journal-title? title)
                                title)))
                           headings))
  (def page-headings (extract-journal-pages-and-headings
                      (get-current-repo)
                      file
                      (get-file file)))
  )

(defn extract-headings-pages
  [repo-url file content]
  (if (string/blank? content)
    []
    (let [journal? (string/starts-with? file "journals/")]
      (if journal?
        (extract-journal-pages-and-headings repo-url file content)
        (let [ast (org/->clj content)
              headings (block/extract-headings ast)
              page-name (get-page-name file ast)
              headings (map (fn [heading]
                              (assoc heading
                                     :heading/repo [:repo/url repo-url]
                                     :heading/file [:file/path file]
                                     :heading/page [:page/name page-name]))
                         headings)
              headings (safe-headings headings)
              pages [{:page/uuid (d/squuid)
                      :page/name page-name
                      :page/file [:file/path file]
                      :page/journal? false}]]
          (vec
           (concat
            pages
            headings)))))))

(defn get-all-files-content
  [repo-url]
  (d/q '[:find ?path ?content
         :in $ ?repo-url
         :where
         [?repo :repo/url ?repo-url]
         [?file :file/repo ?repo]
         [?file :file/content ?content]
         [?file :file/path ?path]]
    @conn repo-url))

(defn extract-all-headings-pages
  [repo-url contents]
  (vec
   (mapcat
    (fn [[file content] contents]
      (when content
        (extract-headings-pages repo-url file content)))
    contents)))

(defn reset-file!
  [repo-url file content]
  (let [file-content [{:file/repo [:repo/url repo-url]
                       :file/path file
                       :file/content content}]
        delete-headings (delete-file-headings! repo-url file)
        headings-pages (extract-headings-pages repo-url file content)]
    (d/transact! conn (concat file-content delete-headings headings-pages))))

(defn get-file-content
  [repo-url path]
  (->> (d/q '[:find ?content
              :in $ ?repo-url ?path
              :where
              [?repo :repo/url ?repo-url]
              [?file :file/repo ?repo]
              [?file :file/path ?path]
              [?file :file/content ?content]]
         @conn repo-url path)
       (map first)
       first))

;; {:repo {:db/id 2}, :file {:db/id 6}}
(defn get-heading-content
  [{:heading/keys [uuid meta file repo]
    :as t}]
  (when-let [content (->> (d/q '[:find ?content
                                 :in $ ?repo ?file
                                 :where
                                 [?file :file/repo ?repo]
                                 [?file :file/content ?content]]
                            @conn (:db/id repo) (:db/id file))
                          (map first)
                          first)]
    (let [content (utf8/substring (utf8/encode content)
                                  (:pos meta)
                                  (:end-pos meta))]
      (string/trim content))))

(defn get-file
  [path]
  (->
   (d/q '[:find ?content
          :in $ ?path
          :where
          [_     :repo/current ?repo]
          [?file :file/repo ?repo]
          [?file :file/path ?path]
          [?file :file/content ?content]]
     @conn
     path)
   ffirst))

;; marker should be one of: TODO, DOING, IN-PROGRESS
;; time duration
(defn get-agenda
  ([]
   (get-agenda :week))
  ([time]
   (let [duration (case time
                    :today []
                    :week  []
                    :month [])]
     (->
      (d/q '[:find (pull ?h [*])
             :where
             (or [?h :heading/marker "TODO"]
                 [?h :heading/marker "DOING"]
                 [?h :heading/marker "IN-PROGRESS"]
                 ;; [?h :heading/marker "DONE"]
                 )]
        @conn)
      seq-flatten))))

(defn entity
  [id-or-lookup-ref]
  (d/entity (d/db conn) id-or-lookup-ref))

(defn get-current-journal-path
  []
  (let [{:keys [year month]} (util/get-date)]
    (util/journals-path year month)))

(defn get-journal
  ([]
   (get-journal (util/journal-name)))
  ([page-name]
   [page-name (get-page-by-concat-headings page-name)]))

(defn me-tx
  [db {:keys [name email avatar repos]}]
  (let [me (util/remove-nils {:me/name name
                              :me/email email
                              :me/avatar avatar})
        me-tx [me]
        repos-tx (mapv (fn [repo]
                         {:repo/url (:url repo)})
                       repos)
        current-repo (get-current-repo db)
        current-repo-tx (if (or current-repo (empty? repos))
                          nil
                          [(kv :repo/current [:repo/url (:url (first repos))])])]
    (->> (concat me-tx repos-tx current-repo-tx)
         (remove nil?))))

(defn restore! [me]
  (if-let [stored (js/localStorage.getItem datascript-db)]
    (let [stored-db (string->db stored)
          attached-db (d/db-with stored-db (me-tx stored-db me))]
      (if (= (:schema stored-db) schema) ;; check for code update
        (reset-conn! attached-db)))
    (d/transact! conn (me-tx (d/db conn) me))))
