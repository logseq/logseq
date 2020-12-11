(ns frontend.db.queries
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [frontend.db.declares :as declares]
            [frontend.db-schema :as db-schema]
            [clojure.string :as string]
            [frontend.format.mldoc :as mldoc]
            [frontend.config :as config]
            [frontend.util :as util]
            [frontend.util :as util :refer-macros [profile]]
            [lambdaisland.glogi :as log]
            [frontend.db.react-queries :as react-queries]
            [frontend.date :as date]
            [clojure.core.async :as async]
            [promesa.core :as p]
            [frontend.db.utils :as db-utils]
            [clojure.walk :as walk]
            [clojure.set :as set]
            [frontend.idb :as idb]
            [cljs.reader :as reader]
            [frontend.format :as format]
            [frontend.utf8 :as utf8]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [frontend.format.block :as block]
            [medley.core :as medley]
            [frontend.extensions.sci :as sci]))

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

(defn block-and-children-transform
  [result repo-url block-uuid level]
  (some->> result
           db-utils/seq-flatten
           (db-utils/sort-by-pos)
           (take-while (fn [h]
                         (or
                           (= (:block/uuid h)
                             block-uuid)
                           (> (:block/level h) level))))
           (db-utils/with-repo repo-url)
           (with-block-refs-count repo-url)))

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

(defn get-pages-with-modified-at
  [repo]
  (let [now-long (tc/to-long (t/now))]
    (->> (d/q
           '[:find ?page-name ?modified-at
             :where
             [?page :page/original-name ?page-name]
             [(get-else $ ?page :page/last-modified-at 0) ?modified-at]]
           (declares/get-conn repo))
      (seq)
      (sort-by (fn [[page modified-at]]
                 [modified-at page]))
      (reverse)
      (remove (fn [[page modified-at]]
                (or (util/file-page? page)
                  (and modified-at
                       (> modified-at now-long))))))))

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

(defn start-db-conn!
  ([me repo]
   (start-db-conn! me repo {}))
  ([me repo {:keys [db-type]}]
   (let [files-db-name (declares/datascript-files-db repo)
         files-db-conn (d/create-conn db-schema/files-db-schema)
         db-name (declares/datascript-db repo)
         db-conn (d/create-conn db-schema/schema)]
     (swap! declares/conns assoc files-db-name files-db-conn)
     (swap! declares/conns assoc db-name db-conn)
     (d/transact! db-conn [(cond-> {:schema/version db-schema/version}
                             db-type
                             (assoc :db/type db-type))])
     (when me
       (d/transact! db-conn [(db-utils/me-tx (d/db db-conn) me)]))

     (db-utils/listen-and-persist! repo))))

(defn restore!
  [{:keys [repos] :as me} restore-config-handler]
  (let [logged? (:name me)]
    (doall
      (for [{:keys [url]} repos]
        (let [repo url

              db-name (declares/datascript-files-db repo)
              db-conn (d/create-conn db-schema/files-db-schema)]
          (swap! declares/conns assoc db-name db-conn)
          (p/let [stored (-> (idb/get-item db-name)
                             (p/then (fn [result]
                                       result))
                             (p/catch (fn [error]
                                        nil)))
                  _ (when stored
                      (let [stored-db (db-utils/string->db stored)
                            attached-db (d/db-with stored-db [(db-utils/me-tx stored-db me)])]
                        (declares/reset-conn! db-conn attached-db)))
                  db-name (declares/datascript-db repo)
                  db-conn (d/create-conn db-schema/schema)
                  _ (d/transact! db-conn [{:schema/version db-schema/version}])
                  _ (swap! declares/conns assoc db-name db-conn)
                  stored (idb/get-item db-name)
                  _ (if stored
                      (let [stored-db (db-utils/string->db stored)
                            attached-db (d/db-with stored-db [(db-utils/me-tx stored-db me)])]
                        (declares/reset-conn! db-conn attached-db))
                      (when logged?
                        (d/transact! db-conn [(db-utils/me-tx (d/db db-conn) me)])))]
            (restore-config-handler repo)
            (db-utils/listen-and-persist! repo)))))))

(defn build-global-graph
  [theme show-journal?]
  (let [dark? (= "dark" theme)
        current-page (:page/name (get-current-page))]
    (when-let [repo (state/get-current-repo)]
      (let [relation (get-pages-relation repo show-journal?)
            tagged-pages (get-all-tagged-pages repo)
            linked-pages (-> (concat
                               relation
                               tagged-pages)
                             flatten
                             set)
            all-pages (get-pages repo)
            other-pages (->> (remove linked-pages all-pages)
                          (remove nil?))
            other-pages (if show-journal? other-pages
                                          (remove date/valid-journal-title? other-pages))
            other-pages (if (seq other-pages)
                          (map string/lower-case other-pages)
                          other-pages)
            nodes (concat (seq relation)
                    (seq tagged-pages)
                    (if (seq other-pages)
                      (map (fn [page]
                             [page])
                        other-pages)
                      []))
            edges (db-utils/build-edges (remove
                                          (fn [[_ to]]
                                            (nil? to))
                                          nodes))
            nodes (db-utils/build-nodes dark? current-page edges nodes)]
        (db-utils/normalize-page-name
          {:nodes nodes
           :links edges})))))


(defn blocks->vec-tree [col]
  (let [col (map (fn [h] (cond->
                           h
                           (not (:block/dummy? h))
                           (dissoc h :block/meta))) col)]
    (loop [col (reverse col)
           children (list)]
      (if (empty? col)
        children
        (let [[item & others] col
              cur-level (:block/level item)
              bottom-level (:block/level (first children))
              pre-block? (:block/pre-block? item)]
          (cond
            (empty? children)
            (recur others (list item))

            (<= bottom-level cur-level)
            (recur others (conj children item))

            pre-block?
            (recur others (cons item children))

            (> bottom-level cur-level)                      ; parent
            (let [[children other-children] (split-with (fn [h]
                                                          (> (:block/level h) cur-level))
                                              children)

                  children (cons
                             (assoc item :block/children children)
                             other-children)]
              (recur others children))))))))

;; recursively with children content for tree
(defn get-block-content-rec
  ([block]
   (get-block-content-rec block (fn [block] (:block/content block))))
  ([block transform-fn]
   (let [contents (atom [])
         _ (walk/prewalk
             (fn [form]
               (when (map? form)
                 (when-let [content (:block/content form)]
                   (swap! contents conj (transform-fn form))))
               form)
             block)]
     (apply util/join-newline @contents))))

(defn get-block-end-pos-rec
  [repo block]
  (let [children (:block/children block)]
    (if (seq children)
      (get-block-end-pos-rec repo (last children))
      (if-let [end-pos (get-in block [:block/meta :end-pos])]
        end-pos
        (when-let [block (db-utils/entity repo [:block/uuid (:block/uuid block)])]
          (get-in block [:block/meta :end-pos]))))))

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

;; non recursive query

(defn get-block-ids
  [block]
  (let [ids (atom [])
        _ (walk/prewalk
            (fn [form]
              (when (map? form)
                (when-let [id (:block/uuid form)]
                  (swap! ids conj id)))
              form)
            block)]
    @ids))

(defn get-block-parents
  [repo block-id depth]
  (when-let [conn (declares/get-conn repo)]
    (loop [block-id block-id
           parents (list)
           d 1]
      (if (> d depth)
        parents
        (if-let [parent (get-block-parent repo block-id)]
          (recur (:block/uuid parent) (conj parents parent) (inc d))
          parents)))))


(defn get-block-page
  [repo block-id]
  (when-let [block (db-utils/entity repo [:block/uuid block-id])]
    (db-utils/entity repo (:db/id (:block/page block)))))


(defn get-block-page-end-pos
  [repo page-name]
  (or
    (when-let [page-id (:db/id (db-utils/entity repo [:page/name (string/lower-case page-name)]))]
      (when-let [db (declares/get-conn repo)]
        (let [block-eids (->> (d/datoms db :avet :block/page page-id)
                           (mapv :e))]
          (when (seq block-eids)
            (let [blocks (db-utils/pull-many repo '[:block/meta] block-eids)]
              (-> (last (db-utils/sort-by-pos blocks))
                  (get-in [:block/meta :end-pos])))))))
    ;; TODO: need more thoughts
    0))

(defn pre-block-with-only-title?
  [repo block-id]
  (when-let [block (db-utils/entity repo [:block/uuid block-id])]
    (let [properties (:page/properties (:block/page block))]
      (and (:title properties)
           (= 1 (count properties))
           (let [ast (mldoc/->edn (:block/content block) (mldoc/default-config (:block/format block)))]
             (or
               (empty? (rest ast))
               (every? (fn [[[typ break-lines]] _]
                         (and (= typ "Paragraph")
                              (every? #(= % ["Break_Line"]) break-lines))) (rest ast))))))))

(defn run-batch-txs!
  []
  (let [chan (state/get-db-batch-txs-chan)]
    (async/go-loop []
      (let [f (async/<! chan)]
        (f))
      (recur))
    chan))

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
