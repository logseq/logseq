(ns frontend.db.simple
  "Contains simple datascript operations, including queries, transact etc. Data process should not be located this
  namespace, it should be in the upper layer."
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [frontend.db.declares :as declares]
            [frontend.db-schema :as db-schema]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.util :as util]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.date :as date]
            [frontend.db.utils :as db-utils]
            [frontend.format :as format]))

(defn get-block-by-uuid
  [repo block-uuid]
  (db-utils/entity repo [:block/uuid block-uuid]))

(defn get-page-id-by-name
  ([page-name]
   (:db/id (db-utils/entity [:page/name page-name])))
  ([repo-url page-name]
   (:db/id (db-utils/entity repo-url [:page/name page-name]))))

(defn get-page-id-by-original-name
  ([page-name]
   (:db/id (db-utils/entity [:page/original-name page-name])))
  ([repo-url page-name]
   (:db/id (db-utils/entity repo-url [:page/original-name page-name]))))

(defn get-pages
  [repo]
  (->> (d/q
         '[:find ?page-name
           :where
           [?page :page/original-name ?page-name]]
         (declares/get-conn repo))
    (map first)))

(defn get-page-alias
  [conn page-name]
  (d/q '[:find ?alias
         :in $ ?page-name
         :where
         [?page :page/name ?page-name]
         [?page :page/alias ?alias]]
    conn page-name))

(defn get-alias-page
  [conn alias]
  (d/q '[:find ?page
         :in $ ?alias
         :where
         [?page :page/alias ?alias]]
    conn alias))

(defn get-block-refs-count
  [repo]
  (->> (d/q
         '[:find ?id2 ?id1
           :where
           [?id1 :block/ref-blocks ?id2]]
         (declares/get-conn repo))
    (map first)
    (frequencies)))

(defn with-block-refs-count
  [repo blocks]
  (let [refs (get-block-refs-count repo)]
    (map (fn [block]
           (assoc block :block/block-refs-count
                        (get refs (:db/id block))))
      blocks)))

(defn page-blocks-transform
  [repo-url result]
  (let [result (db-utils/seq-flatten result)
        sorted (db-utils/sort-by-pos result)]
    (->> (db-utils/with-repo repo-url sorted)
         (with-block-refs-count repo-url))))

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (when-not config/publishing?
     (let [tx-data (->> (util/remove-nils tx-data)
                     (remove nil?))]
       (when (seq tx-data)
         (when-let [conn (declares/get-conn repo-url false)]
           (d/transact! conn (vec tx-data))))))))

(defn retract-by-key
  [repo-url key]
  (transact! repo-url [[:db.fn/retractEntity [:db/ident key]]]))

(defn get-key-value
  ([key]
   (get-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when-let [db (declares/get-conn repo-url)]
     (some-> (d/entity db key)
       key))))

(defn get-current-page
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])
        tag? (= route-name :tag)
        page (case route-name
               :page
               (get-in match [:path-params :name])

               :file
               (get-in match [:path-params :path])

               :tag
               (get-in match [:path-params :name])

               (date/journal-name))]
    (when page
      (let [page-name (util/url-decode (string/lower-case page))]
        (db-utils/entity (if tag?
                           [:tag/name page-name]
                           [:page/name page-name]))))))

(defn get-block-parent
  [repo block-id]
  (when-let [conn (declares/get-conn repo)]
    (d/entity conn [:block/children [:block/uuid block-id]])))

(defn get-block-and-children
  [repo page pos]
  (let [pred (fn [data meta] (>= (:start-pos meta) pos))]
   (-> (d/q
         '[:find (pull ?block [*])
           :in $ ?page ?pred
           :where
           [?block :block/page ?page]
           [?block :block/meta ?meta]
           [(?pred $ ?meta)]]
         (declares/get-conn repo)
         page
         pred))))

(defn get-pages-relation
  [repo with-journal?]
  (when-let [conn (declares/get-conn repo)]
    (let [q (if with-journal?
              '[:find ?page ?ref-page-name
                :where
                [?p :page/name ?page]
                [?block :block/page ?p]
                [?block :block/ref-pages ?ref-page]
                [?ref-page :page/name ?ref-page-name]]
              '[:find ?page ?ref-page-name
                :where
                [?p :page/journal? false]
                [?p :page/name ?page]
                [?block :block/page ?p]
                [?block :block/ref-pages ?ref-page]
                [?ref-page :page/name ?ref-page-name]])]
      (->>
        (d/q q conn)
        (map (fn [[page ref-page-name]]
               [page ref-page-name]))))))

(defn get-all-tagged-pages
  [repo]
  (d/q '[:find ?page-name ?tag
         :where
         [?page :page/tags ?e]
         [?e :tag/name ?tag]
         [_ :page/name ?tag]
         [?page :page/name ?page-name]]
    (declares/get-conn repo)))

(defn get-page-format
  [page-name]
  (when-let [file (:page/file (db-utils/entity [:page/name page-name]))]
    (when-let [path (:file/path (db-utils/entity (:db/id file)))]
      (format/get-format path))))

(defn get-file-blocks
  [repo-url path]
  (-> (d/q '[:find ?block
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?block :block/file ?file]]
        (declares/get-conn repo-url) path)
      db-utils/seq-flatten))

(defn delete-file-blocks!
  [repo-url path]
  (let [blocks (get-file-blocks repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks)))

(defn transact-files-db!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (when-not config/publishing?
     (let [tx-data (->> (util/remove-nils tx-data)
                     (remove nil?)
                     (map #(dissoc % :file/handle :file/type)))]
       (when (seq tx-data)
         (when-let [conn (declares/get-files-conn repo-url)]
           (d/transact! conn (vec tx-data))))))))

(defn get-file-pages
  [repo-url path]
  (-> (d/q '[:find ?page
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :page/file ?file]]
        (declares/get-conn repo-url) path)
      (db-utils/seq-flatten)))

(defn delete-file-pages!
  [repo-url path]
  (let [pages (get-file-pages repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) pages)))

(defn delete-file-tx
  [repo-url file-path]
  (->>
    (concat
      (delete-file-blocks! repo-url file-path)
      (delete-file-pages! repo-url file-path)
      [[:db.fn/retractEntity [:file/path file-path]]])
    (remove nil?)))

(defn get-files-blocks
  [repo-url paths]
  (let [paths (set paths)
        pred (fn [_db e]
               (contains? paths e))]
    (-> (d/q '[:find ?block
               :in $ ?pred
               :where
               [?file :file/path ?path]
               [(?pred $ ?path)]
               [?block :block/file ?file]]
          (declares/get-conn repo-url) pred)
        (db-utils/seq-flatten))))

(defn get-tag-pages
  [repo tag-name]
  (d/q '[:find ?original-name ?name
         :in $ ?tag
         :where
         [?e :tag/name ?tag]
         [?page :page/tags ?e]
         [?page :page/original-name ?original-name]
         [?page :page/name ?name]]
    (declares/get-conn repo)
    tag-name))

(defn get-pages-with-modified
  [repo]
  (->> (d/q
         '[:find ?page-name ?modified-at
           :where
           [?page :page/original-name ?page-name]
           [(get-else $ ?page :page/last-modified-at 0) ?modified-at]]
         (declares/get-conn repo))))

(defn get-pages-by-names
  [repo page-names]
  (db-utils/pull-many repo '[:page/name] page-names))

(defn get-files
  [repo]
  (when-let [conn (declares/get-conn repo)]
    (->> (d/q
           '[:find ?path ?modified-at
             :where
             [?file :file/path ?path]
             [(get-else $ ?file :file/last-modified-at 0) ?modified-at]]
           conn)
      (seq)
      (sort-by last)
      (reverse))))

(defn delete-blocks
  [repo-url files]
  (when (seq files)
    (let [blocks (get-files-blocks repo-url files)]
      (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks))))

(defn delete-files
  [files]
  (mapv (fn [path] [:db.fn/retractEntity [:file/path path]]) files))

(defn get-file-after-blocks
  [repo-url file-id end-pos]
  (when end-pos
    (let [pred (fn [db meta]
                 (>= (:start-pos meta) end-pos))]
      (-> (d/q '[:find (pull ?block [*])
                 :in $ ?file-id ?pred
                 :where
                 [?block :block/file ?file-id]
                 [?block :block/meta ?meta]
                 [(?pred $ ?meta)]]
            (declares/get-conn repo-url) file-id pred)
          (db-utils/seq-flatten)
          (db-utils/sort-by-pos)))))

(defn get-file-after-blocks-meta
  ([repo-url file-id end-pos]
   (get-file-after-blocks-meta repo-url file-id end-pos false))
  ([repo-url file-id end-pos content-level?]
   (let [db (declares/get-conn repo-url)
         blocks (d/datoms db :avet :block/file file-id)
         eids (mapv :e blocks)
         ks (if content-level?
              '[:block/uuid :block/meta :block/content :block/level]
              '[:block/uuid :block/meta])
         blocks (db-utils/pull-many repo-url ks eids)]
     (->> (filter (fn [{:block/keys [meta]}]
                    (>= (:start-pos meta) end-pos)) blocks)
       (db-utils/sort-by-pos)))))

(defn delete-file!
  [repo-url file-path]
  (transact! repo-url (delete-file-tx repo-url file-path)))

(defn get-file-contents
  [repo]
  (when-let [conn (declares/get-files-conn repo)]
    (->>
      (d/q
        '[:find ?path ?content
          :where
          [?file :file/path ?path]
          [?file :file/content ?content]]
        @conn)
      (into {}))))

(defn get-files-full
  [repo]
  (when-let [conn (declares/get-files-conn repo)]
    (->>
      (d/q
        '[:find (pull ?file [*])
          :where
          [?file :file/path]]
        @conn)
      (flatten))))

(defn get-file-no-sub
  ([path]
   (get-file-no-sub (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (when-let [conn (declares/get-files-conn repo)]
       (->
         (d/q
           '[:find ?content
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?file :file/content ?content]]
           @conn
           path)
         ffirst)))))

(defn reset-contents-and-blocks!
  [repo-url files blocks-pages delete-files delete-blocks]
  (transact-files-db! repo-url files)
  (let [files (map #(select-keys % [:file/path]) files)
        all-data (-> (concat delete-files delete-blocks files blocks-pages)
                     (util/remove-nils))]
    (transact! repo-url all-data)))

(defn get-page-properties
  [page]
  (when-let [page (db-utils/entity [:page/name page])]
    (:page/properties page)))

(defn get-page-blocks-count
  [repo page-id]
  (when-let [db (declares/get-conn repo)]
    (count (d/datoms db :avet :block/page page-id))))

(defn get-block-children-ids
  [repo block-uuid]
  (when-let [conn (declares/get-conn repo)]
    (let [eid (:db/id (get-block-by-uuid repo block-uuid))]
      (->> (d/q
             '[:find ?e1
               :in $ ?e2 %
               :where (parent ?e2 ?e1)]
             conn
             eid
             ;; recursive rules
             '[[(parent ?e2 ?e1)
                [?e2 :block/children ?e1]]
               [(parent ?e2 ?e1)
                [?t :block/children ?e1]
                (parent ?e2 ?t)]])
        (apply concat)))))

(defn get-file-page
  ([file-path]
   (get-file-page file-path true))
  ([file-path original-name?]
   (when-let [repo (state/get-current-repo)]
     (when-let [conn (declares/get-conn repo)]
       (some->
         (d/q
           (if original-name?
             '[:find ?page-name
               :in $ ?path
               :where
               [?file :file/path ?path]
               [?page :page/file ?file]
               [?page :page/original-name ?page-name]]
             '[:find ?page-name
               :in $ ?path
               :where
               [?file :file/path ?path]
               [?page :page/file ?file]
               [?page :page/name ?page-name]])
           conn file-path)
         db-utils/seq-flatten
         first)))))

(defn get-page-file
  [page-name]
  (some-> (db-utils/entity [:page/name page-name])
    :page/file))

(defn get-block-file
  [block-id]
  (let [page-id (some-> (db-utils/entity [:block/uuid block-id])
                  :block/page
                  :db/id)]
    (:page/file (db-utils/entity page-id))))

(defn get-file-page-id
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (declares/get-conn repo)]
      (some->
        (d/q
          '[:find ?page
            :in $ ?path
            :where
            [?file :file/path ?path]
            [?page :page/file ?file]]
          conn file-path)
        db-utils/seq-flatten
        first))))

(defn get-journals-length
  []
  (let [today (db-utils/date->int (js/Date.))]
    (d/q '[:find (count ?page) .
           :in $ ?today
           :where
           [?page :page/journal? true]
           [?page :page/journal-day ?journal-day]
           [(<= ?journal-day ?today)]]
      (declares/get-conn (state/get-current-repo))
      today)))

(defn get-files-that-referenced-page
  [page-id]
  (when-let [repo (state/get-current-repo)]
    (when-let [db (declares/get-conn repo)]
      (->> (d/q
             '[:find ?path
               :in $ ?page-id
               :where
               [?block :block/ref-pages ?page-id]
               [?block :block/page ?p]
               [?p :page/file ?f]
               [?f :file/path ?path]]
             db
             page-id)
        (db-utils/seq-flatten)))))

(defn get-page-unlinked-references
  [conn pattern]
  (-> (d/q
        '[:find (pull ?block [*])
          :in $ ?pattern
          :where
          [?block :block/content ?content]
          [(re-find ?pattern ?content)]]
        conn
        pattern)
      (db-utils/seq-flatten)))

(defn get-matched-blocks
  [pred]
  (d/q
    '[:find ?block
      :in $ ?pred
      :where
      [?block :block/content ?content]
      [(?pred $ ?content)]]
    (declares/get-conn)
    pred))

;; TODO: Does the result preserves the order of the arguments?
(defn get-blocks-contents
  [repo block-uuids]
  (let [db (declares/get-conn repo)]
    (db-utils/pull-many repo '[:block/content]
      (mapv (fn [id] [:block/uuid id]) block-uuids))))


(defn journal-page?
  [page-name]
  (:page/journal? (db-utils/entity [:page/name page-name])))

(defn mark-repo-as-cloned!
  [repo-url]
  (transact!
    [{:repo/url repo-url
      :repo/cloned? true}]))

(defn cloned?
  [repo-url]
  (when-let [conn (declares/get-conn repo-url)]
    (->
      (d/q '[:find ?cloned
             :in $ ?repo-url
             :where
             [?repo :repo/url ?repo-url]
             [?repo :repo/cloned? ?cloned]]
        conn
        repo-url)
      ffirst)))

(defn collapse-block!
  [block]
  (let [repo (:block/repo block)]
    (transact! repo
      [{:block/uuid (:block/uuid block)
        :block/collapsed? true}])))

(defn expand-block!
  [block]
  (let [repo (:block/repo block)]
    (transact! repo
      [{:block/uuid (:block/uuid block)
        :block/collapsed? false}])))

(defn get-block-page
  [repo block-id]
  (when-let [block (db-utils/entity repo [:block/uuid block-id])]
    (db-utils/entity repo (:db/id (:block/page block)))))

(defn get-all-blocks-by-page-id
  [db page-id]
  (d/datoms db :avet :block/page page-id))

(defn get-all-templates
  []
  (let [pred (fn [_ properties]
               (some? (get properties "template")))]
    (->> (d/q
           '[:find ?b ?p
             :in $ ?pred
             :where
             [?b :block/properties ?p]
             [(?pred $ ?p)]]
           (declares/get-conn)
           pred)
      (map (fn [[e m]]
             [(get m "template") e]))
      (into {}))))

(defn template-exists?
  [title]
  (when title
    (let [templates (keys (get-all-templates))]
      (when (seq templates)
        (let [templates (map string/lower-case templates)]
          (contains? (set templates) (string/lower-case title)))))))

(defn clean-export!
  [db]
  (let [remove? #(contains? #{"me" "recent" "file"} %)
        filtered-db (d/filter db
                      (fn [db datom]
                        (let [ns (namespace (:a datom))]
                          (not (remove? ns)))))
        datoms (d/datoms filtered-db :eavt)]
    @(d/conn-from-datoms datoms db-schema/schema)))

(defn- get-public-pages
  [db]
  (-> (d/q
        '[:find ?p
          :where
          [?p :page/properties ?d]
          [(get ?d :public) ?pub]
          [(= "true" ?pub)]]
        db)
      (db-utils/seq-flatten)))

(defn filter-only-public-pages-and-blocks
  [db]
  (let [public-pages (get-public-pages db)
        contents-id (:db/id (db-utils/entity [:page/name "contents"]))]
    (when (seq public-pages)
      (let [public-pages (set (conj public-pages contents-id))
            page-or-block? #(contains? #{"page" "block" "me" "recent" "file"} %)
            filtered-db (d/filter db
                          (fn [db datom]
                            (let [ns (namespace (:a datom))]
                              (or
                                (not (page-or-block? ns))
                                (and (= ns "page")
                                     (contains? public-pages (:e datom)))
                                (and (= ns "block")
                                     (contains? public-pages (:db/id (:block/page (d/entity db (:e datom))))))))))
            datoms (d/datoms filtered-db :eavt)]
        @(d/conn-from-datoms datoms db-schema/schema)))))

(defn get-db-type
  [repo]
  (get-key-value repo :db/type))

(defn local-native-fs?
  [repo]
  (= :local-native-fs (get-db-type repo)))

(defn get-file-last-modified-at
  [repo path]
  (when (and repo path)
    (when-let [conn (declares/get-files-conn repo)]
      (-> (d/entity (d/db conn) [:file/path path])
          :file/last-modified-at))))

(defn set-file-last-modified-at!
  [repo path last-modified-at]
  (when (and repo path last-modified-at)
    (when-let [conn (declares/get-files-conn repo)]
      (d/transact! conn
        [{:file/path path
          :file/last-modified-at last-modified-at}]))))

(defn get-all-block-contents
  []
  (->> (d/datoms (declares/get-conn) :avet :block/uuid)
       (map :v)
       (map (fn [id]
              (let [e (db-utils/entity [:block/uuid id])]
                {:db/id (:db/id e)
                 :block/uuid id
                 :block/content (:block/content e)
                 :block/format (:block/format e)})))))