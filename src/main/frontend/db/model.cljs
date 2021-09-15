(ns frontend.db.model
  "Core db functions."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db-schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.format :as format]
            [frontend.state :as state]
            [frontend.util :as util :refer [react]]
            [medley.core :as medley]
            [frontend.db.rules :refer [rules]]))

;; TODO: extract to specific models and move data transform logic to the
;; correponding handlers.

;; Use it as an input argument for datalog queries
(defonce block-attrs
  '[:db/id
    :block/uuid
    :block/type
    :block/left
    :block/format
    :block/title
    :block/refs
    :block/path-refs
    :block/tags
    :block/content
    :block/marker
    :block/priority
    :block/properties
    :block/body
    :block/pre-block?
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/created-at
    :block/updated-at
    :block/file
    :block/parent
    :block/unordered
    :block/heading-level
    {:block/page [:db/id :block/name :block/original-name :block/journal-day]}
    {:block/_parent ...}])

(defn transact-files-db!
  ([tx-data]
   (db-utils/transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (when-not config/publishing?
     (let [tx-data (->> (util/remove-nils tx-data)
                        (remove nil?)
                        (map #(dissoc % :file/handle :file/type)))]
       (when (seq tx-data)
         (when-let [conn (conn/get-conn repo-url false)]
           (d/transact! conn (vec tx-data))))))))

(defn pull-block
  [id]
  (let [repo (state/get-current-repo)]
    (when (conn/get-conn repo)
      (->
       (react/q repo [:blocks id] {}
                '[:find (pull ?block [*])
                  :in $ ?id
                  :where
                  [?block :block/uuid ?id]]
                id)
       react
       ffirst))))

(defn get-tag-pages
  [repo tag-name]
  (when tag-name
    (d/q '[:find ?original-name ?name
           :in $ ?tag
           :where
           [?e :block/name ?tag]
           [?page :block/tags ?e]
           [?page :block/original-name ?original-name]
           [?page :block/name ?name]]
         (conn/get-conn repo)
         (string/lower-case tag-name))))

(defn get-all-tagged-pages
  [repo]
  (d/q '[:find ?page-name ?tag
         :where
         [?page :block/tags ?e]
         [?e :block/name ?tag]
         [?page :block/name ?page-name]]
    (conn/get-conn repo)))

(defn get-all-namespace-relation
  [repo]
  (d/q '[:find ?page-name ?parent
         :where
         [?page :block/name ?page-name]
         [?page :block/namespace ?e]
         [?e :block/name ?parent]]
    (conn/get-conn repo)))

(defn get-pages
  [repo]
  (->> (d/q
        '[:find ?page-original-name
          :where
          [?page :block/name ?page-name]
          [(get-else $ ?page :block/original-name ?page-name) ?page-original-name]]
        (conn/get-conn repo))
       (map first)))

(defn get-all-pages
  [repo]
  (d/q
    '[:find [(pull ?page [*]) ...]
      :where
      [?page :block/name]]
    (conn/get-conn repo)))

(defn get-page-alias
  [repo page-name]
  (when-let [conn (and repo (conn/get-conn repo))]
    (some->> (d/q '[:find ?alias
                    :in $ ?page-name
                    :where
                    [?page :block/name ?page-name]
                    [?page :block/alias ?alias]]
                  conn
                  page-name)
             db-utils/seq-flatten
             distinct)))

(defn get-alias-source-page
  [repo alias]
  (when-let [conn (and repo (conn/get-conn repo))]
    (let [pages (->>
                 (d/q '[:find (pull ?p [*])
                        :in $ ?alias
                        :where
                        [?a :block/name ?alias]
                        [?p :block/alias ?a]]
                      conn
                      alias)
                 (db-utils/seq-flatten))]
      (when (seq pages)
        (some (fn [page]
                (let [aliases (->> (get-in page [:block/properties :alias])
                                   (map string/lower-case)
                                   set)]
                  (when (contains? aliases alias)
                    page)))
              pages)))))

(defn get-files
  [repo]
  (when-let [conn (conn/get-conn repo)]
    (->> (d/q
          '[:find ?path
             ;; ?modified-at
            :where
            [?file :file/path ?path]
            ;; [?file :file/last-modified-at ?modified-at]
            ]
          conn)
         (seq)
         ;; (sort-by last)
         (reverse))))

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
             (conn/get-conn repo-url) pred)
        db-utils/seq-flatten)))

(defn get-files-non-page-blocks
  [repo-url paths]
  (let [paths (set paths)
        pred (fn [_db e]
               (contains? paths e))]
    (-> (d/q '[:find ?block
               :in $ ?pred
               :where
               [?file :file/path ?path]
               [(?pred $ ?path)]
               [?block :block/file ?file]
               [(missing? $ ?block :block/name)]]
          (conn/get-conn repo-url) pred)
        db-utils/seq-flatten)))

(defn get-file-blocks
  [repo-url path]
  (-> (d/q '[:find ?block
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?block :block/file ?file]]
           (conn/get-conn repo-url) path)
      db-utils/seq-flatten))

(defn get-file-pages
  [repo-url path]
  (-> (d/q '[:find ?page
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]]
           (conn/get-conn repo-url) path)
      db-utils/seq-flatten))

(defn set-file-last-modified-at!
  [repo path last-modified-at]
  (when (and repo path last-modified-at)
    (when-let [conn (conn/get-conn repo false)]
      (d/transact! conn
                   [{:file/path path
                     :file/last-modified-at last-modified-at}]))))

(defn get-file-last-modified-at
  [repo path]
  (when (and repo path)
    (when-let [conn (conn/get-conn repo false)]
      (-> (d/entity (d/db conn) [:file/path path])
          :file/last-modified-at))))

(defn file-exists?
  [repo path]
  (when (and repo path)
    (when-let [conn (conn/get-conn repo false)]
      (d/entity (d/db conn) [:file/path path]))))

(defn get-file
  ([path]
   (get-file (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (->
      (react/q repo [:file/content path]
               {:use-cache? true}
               '[:find ?content
                 :in $ ?path
                 :where
                 [?file :file/path ?path]
                 [?file :file/content ?content]]
               path)
      react
      ffirst))))

(defn get-file-contents
  [repo]
  (when-let [conn (conn/get-conn repo)]
    (->>
     (d/q
      '[:find ?path ?content
        :where
        [?file :file/path ?path]
        [?file :file/content ?content]]
      conn)
     (into {}))))


(defn get-files-full
  [repo]
  (when-let [conn (conn/get-conn repo)]
    (->>
     (d/q
      '[:find (pull ?file [*])
        :where
        [?file :file/path]]
      conn)
     (flatten))))

(defn get-file-by-path
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (conn/get-conn repo)]
      (d/pull conn '[*] [:file/path file-path]))))

(defn get-custom-css
  []
  (when-let [repo (state/get-current-repo)]
    (get-file (config/get-file-path repo "logseq/custom.css"))))

(defn get-file-no-sub
  ([path]
   (get-file-no-sub (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (when-let [conn (conn/get-conn repo)]
       (:file/content (d/entity conn [:file/path path]))))))

(defn get-block-by-uuid
  [id]
  (db-utils/entity [:block/uuid (if (uuid? id) id (uuid id))]))

(defn query-block-by-uuid
  [id]
  (db-utils/pull [:block/uuid (if (uuid? id) id (uuid id))]))

(defn get-page-format
  [page-name]
  (or
   (let [page (db-utils/entity [:block/name page-name])]
     (or
      (:block/format page)
      (when-let [file (:block/file page)]
        (when-let [path (:file/path (db-utils/entity (:db/id file)))]
          (format/get-format path)))))
   (state/get-preferred-format)
   :markdown))

(defn page-alias-set
  [repo-url page]
  (when-let [page-id (:db/id (db-utils/entity repo-url [:block/name page]))]
    (->>
     (d/q '[:find ?e
            :in $ ?page-name %
            :where
            [?page :block/name ?page-name]
            (alias ?page ?e)]
          (conn/get-conn repo-url)
          page
          '[[(alias ?e2 ?e1)
             [?e2 :block/alias ?e1]]
            [(alias ?e2 ?e1)
             [?e1 :block/alias ?e2]]
            [(alias ?e1 ?e3)
             [?e1 :block/alias ?e2]
             [?e2 :block/alias ?e3]]
            [(alias ?e3 ?e1)
             [?e1 :block/alias ?e2]
             [?e2 :block/alias ?e3]]])
     db-utils/seq-flatten
     (set)
     (set/union #{page-id}))))

(defn get-page-names-by-ids
  ([ids]
   (get-page-names-by-ids (state/get-current-repo) ids))
  ([repo ids]
   (when repo
     (->> (db-utils/pull-many repo '[:block/name] ids)
          (map :block/name)))))

(defn get-page-ids-by-names
  ([names]
   (get-page-ids-by-names (state/get-current-repo) names))
  ([repo names]
   (when repo
     (let [lookup-refs (map (fn [name]
                              [:block/name (string/lower-case name)]) names)]
       (->> (db-utils/pull-many repo '[:db/id] lookup-refs)
            (mapv :db/id))))))

(defn get-page-alias-names
  [repo page-name]
  (let [alias-ids (page-alias-set repo page-name)]
    (when (seq alias-ids)
      (let [names (->> (get-page-names-by-ids repo alias-ids)
                       distinct
                       (remove #(= (string/lower-case %) (string/lower-case page-name))))
            lookup-refs (map (fn [name]
                               [:block/name (string/lower-case name)]) names)]
        (->> (db-utils/pull-many repo '[:block/name :block/original-name] lookup-refs)
             (map (fn [m]
                    (or (:block/original-name m) (:block/name m)))))))))

(defn page-blocks-transform
  [repo-url result]
  (db-utils/with-repo repo-url result))

(defn with-pages
  [blocks]
  (let [pages-ids (->> (map (comp :db/id :block/page) blocks)
                       (remove nil?))
        pages (when (seq pages-ids)
                (db-utils/pull-many '[:db/id :block/name :block/original-name :block/journal-day] pages-ids))
        pages-map (reduce (fn [acc p] (assoc acc (:db/id p) p)) {} pages)
        blocks (map
                (fn [block]
                  (assoc block :block/page
                         (get pages-map (:db/id (:block/page block)))))
                blocks)]
    blocks))

(defn get-page-properties
  [page]
  (when-let [page (db-utils/entity [:block/name page])]
    (:block/properties page)))

;; FIXME: alert
(defn- keep-only-one-file
  [blocks]
  (filter (fn [b] (= (:block/file b) (:block/file (first blocks)))) blocks))

(defn sort-by-left
  ([blocks parent]
   (sort-by-left blocks parent true))
  ([blocks parent check?]
   (let [blocks (keep-only-one-file blocks)]
     (when check?
       (when (not= (count blocks) (count (set (map :block/left blocks))))
         (let [duplicates (->> (map (comp :db/id :block/left) blocks)
                               frequencies
                               (filter (fn [[_k v]] (> v 1)))
                               (map (fn [[k _v]]
                                      (let [left (db-utils/pull k)]
                                        {:left left
                                         :duplicates (->>
                                                      (filter (fn [block]
                                                                (= k (:db/id (:block/left block))))
                                                              blocks)
                                                      (map #(select-keys % [:db/id :block/level :block/content :block/file])))}))))]
           (util/pprint duplicates)))
       (assert (= (count blocks) (count (set (map :block/left blocks)))) "Each block should have a different left node"))

    (let [left->blocks (reduce (fn [acc b] (assoc acc (:db/id (:block/left b)) b)) {} blocks)]
      (loop [block parent
             result []]
        (if-let [next (get left->blocks (:db/id block))]
          (recur next (conj result next))
          (vec result)))))))

(defn- sort-by-left-recursive
  [form]
  (walk/postwalk (fn [f]
                   (if (and (map? f)
                            (:block/_parent f))
                     (let [children (:block/_parent f)]
                       (-> f
                           (dissoc :block/_parent)
                           (assoc :block/children (sort-by-left children f))))
                     f))
                 form))

(defn flatten-blocks-sort-by-left
  [blocks parent]
  (let [ids->blocks (zipmap (map (fn [b] [(:db/id (:block/parent b))
                                         (:db/id (:block/left b))]) blocks) blocks)
        top-block (get ids->blocks [(:db/id parent) (:db/id parent)])]
    (loop [node parent
           next-siblings '()
           result []]
      (let [id (:db/id node)
            child-block (get ids->blocks [id id])
            next-sibling (get ids->blocks [(:db/id (:block/parent node)) id])
            next-siblings (if (and next-sibling child-block)
                            (cons next-sibling next-siblings)
                            next-siblings)]
        (if-let [node (or child-block next-sibling)]
          (recur node next-siblings (conj result node))
          (if-let [sibling (first next-siblings)]
            (recur sibling (rest next-siblings) (conj result sibling))
            result))))))

(defn get-page-blocks
  ([page]
   (get-page-blocks (state/get-current-repo) page nil))
  ([repo-url page]
   (get-page-blocks repo-url page nil))
  ([repo-url page {:keys [use-cache? pull-keys]
                   :or {use-cache? true
                        pull-keys '[*]}}]
   (let [page (string/lower-case (string/trim page))
         page-entity (or (db-utils/entity repo-url [:block/name page])
                         (db-utils/entity repo-url [:block/original-name page]))
         page-id (:db/id page-entity)
         db (conn/get-conn repo-url)]
     (when page-id
       (some->
        (react/q repo-url [:page/blocks page-id]
                 {:use-cache? use-cache?
                  :transform-fn #(page-blocks-transform repo-url %)
                  :query-fn (fn [db]
                              (let [datoms (d/datoms db :avet :block/page page-id)
                                    block-eids (mapv :e datoms)]
                                (db-utils/pull-many repo-url pull-keys block-eids)))}
                 nil)
        react
        (flatten-blocks-sort-by-left page-entity))))))

(defn get-page-blocks-no-cache
  ([page]
   (get-page-blocks-no-cache (state/get-current-repo) page nil))
  ([repo-url page]
   (get-page-blocks-no-cache repo-url page nil))
  ([repo-url page {:keys [pull-keys]
                   :or {pull-keys '[*]}}]
   (let [page (string/lower-case page)
         page-id (or (:db/id (db-utils/entity repo-url [:block/name page]))
                     (:db/id (db-utils/entity repo-url [:block/original-name page])))
         db (conn/get-conn repo-url)]
     (when page-id
       (let [datoms (d/datoms db :avet :block/page page-id)
             block-eids (mapv :e datoms)]
         (some->> (db-utils/pull-many repo-url pull-keys block-eids)
                  (page-blocks-transform repo-url)))))))

(defn get-page-blocks-count
  [repo page-id]
  (when-let [db (conn/get-conn repo)]
    (count (d/datoms db :avet :block/page page-id))))

(defn page-empty?
  [repo page-id]
  (let [page-id (if (integer? page-id)
                  page-id
                  [:block/name page-id])]
    (empty? (:block/_parent (db-utils/entity repo page-id)))))

(defn page-empty-or-dummy?
  [repo page-id]
  (or
   (page-empty? repo page-id)
   (when-let [db (conn/get-conn repo)]
     (let [datoms (d/datoms db :avet :block/page page-id)]
       (and (= (count datoms) 1)
            (= "" (:block/content (db-utils/pull (:e (first datoms))))))))))

(defn get-block-parent
  ([block-id]
   (get-block-parent (state/get-current-repo) block-id))
  ([repo block-id]
   (when-let [conn (conn/get-conn repo)]
     (when-let [block (d/entity conn [:block/uuid block-id])]
       (:block/parent block)))))

;; non recursive query
(defn get-block-parents
  [repo block-id depth]
  (when-let [conn (conn/get-conn repo)]
    (loop [block-id block-id
           parents (list)
           d 1]
      (if (> d depth)
        parents
        (if-let [parent (get-block-parent repo block-id)]
          (recur (:block/uuid parent) (conj parents parent) (inc d))
          parents)))))

(comment
  (defn get-immediate-children-v2
    [repo block-id]
    (d/pull (conn/get-conn repo)
            '[:block/_parent]
            [:block/uuid block-id])))

;; Use built-in recursive
(defn get-block-parents-v2
  [repo block-id]
  (d/pull (conn/get-conn repo)
          '[:db/id :block/properties {:block/parent ...}]
          [:block/uuid block-id]))

(defn parents-collapsed?
  [repo block-id]
  (when-let [block (:block/parent (get-block-parents-v2 repo block-id))]
    (->> (tree-seq map? (fn [x] [(:block/parent x)]) block)
         (map (comp :collapsed :block/properties))
         (some true?))))

(defn get-block-page
  [repo block-id]
  (when-let [block (db-utils/entity repo [:block/uuid block-id])]
    (db-utils/entity repo (:db/id (:block/page block)))))

(defn block-and-children-transform
  [result repo-url block-uuid]
  (some->> result
           db-utils/seq-flatten
           (db-utils/with-repo repo-url)))

(defn get-block-children-ids
  [repo block-uuid]
  (when-let [conn (conn/get-conn repo)]
    (let [eid (:db/id (db-utils/entity repo [:block/uuid block-uuid]))]
      (->> (d/q
            '[:find ?id
              :in $ ?p %
              :where
              (parent ?p ?c)
              [?c :block/uuid ?id]]
            conn
            eid
            rules)
           (apply concat)))))

(defn get-block-immediate-children
  "Doesn't include nested children."
  [repo block-uuid]
  (when-let [conn (conn/get-conn repo)]
    (-> (d/q
          '[:find [(pull ?b [*]) ...]
            :in $ ?parent-id
            :where
            [?b :block/parent ?parent]
            [?parent :block/uuid ?parent-id]]
          conn
          block-uuid)
        (sort-by-left (db-utils/entity [:block/uuid block-uuid])))))

(defn get-blocks-by-page
  [id-or-lookup-ref]
  (when-let [conn (conn/get-conn)]
    (->
     (d/q
      '[:find (pull ?block [*])
        :in $ ?page
        :where
        [?block :block/page ?page]]
      conn id-or-lookup-ref)
     flatten)))

(defn get-block-children
  "Including nested children."
  [repo block-uuid]
  (when-let [conn (conn/get-conn repo)]
    (let [ids (get-block-children-ids repo block-uuid)
          ids (map (fn [id] [:block/uuid id]) ids)]
      (when (seq ids)
        (db-utils/pull-many repo '[*] ids)))))

;; TODO: use the tree directly
(defn- flatten-tree
  [blocks-tree]
  (if-let [children (:block/_parent blocks-tree)]
    (cons (dissoc blocks-tree :block/_parent) (mapcat flatten-tree children))
    [blocks-tree]))

(defn get-block-and-children
  ([repo block-uuid]
   (get-block-and-children repo block-uuid true))
  ([repo block-uuid use-cache?]
   (some-> (react/q repo [:block/block block-uuid]
             {:use-cache? use-cache?
              :transform-fn #(block-and-children-transform % repo block-uuid)}
             '[:find [(pull ?block ?block-attrs) ...]
               :in $ ?id ?block-attrs
               :where
               [?block :block/uuid ?id]]
             block-uuid
             block-attrs)
           react
           first
           flatten-tree)))

(defn get-file-page
  ([file-path]
   (get-file-page file-path true))
  ([file-path original-name?]
   (when-let [repo (state/get-current-repo)]
     (when-let [conn (conn/get-conn repo)]
       (some->
        (d/q
         (if original-name?
           '[:find ?page-name
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]
             [?page :block/original-name ?page-name]]
           '[:find ?page-name
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :block/file ?file]
             [?page :block/name ?page-name]])
         conn file-path)
        db-utils/seq-flatten
        first)))))

(defn get-page-file
  [page-name]
  (some-> (or (db-utils/entity [:block/name page-name])
              (db-utils/entity [:block/original-name page-name]))
          :block/file))

(defn get-file-page-id
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (conn/get-conn repo)]
      (some->
       (d/q
        '[:find ?page
          :in $ ?path
          :where
          [?file :file/path ?path]
          [?page :block/name]
          [?page :block/file ?file]]
        conn file-path)
       db-utils/seq-flatten
       first))))

(defn get-page
  [page-name]
  (if (util/uuid-string? page-name)
    (db-utils/entity [:block/uuid (uuid page-name)])
    (db-utils/entity [:block/name (string/lower-case page-name)])))

(defn- heading-block?
  [block]
  (and
   (vector? block)
   (= "Heading" (first block))))

(defn get-redirect-page-name
  ([page-name] (get-redirect-page-name page-name false))
  ([page-name alias?]
   (when page-name
     (let [page-name (string/lower-case page-name)
           page-entity (db-utils/entity [:block/name page-name])]
       (cond
         alias?
         page-name

         (page-empty-or-dummy? (state/get-current-repo) (:db/id page-entity))
         (let [source-page (get-alias-source-page (state/get-current-repo)
                                                  (string/lower-case page-name))]
           (or (when source-page (:block/name source-page))
               page-name))

         :else
         page-name)))))

(defn get-page-original-name
  [page-name]
  (when (string? page-name)
    (let [page (db-utils/pull [:block/name (string/lower-case page-name)])]
      (or (:block/original-name page)
          (:block/name page)))))

(defn get-journals-length
  []
  (let [today (db-utils/date->int (js/Date.))]
    (d/q '[:find (count ?page) .
           :in $ ?today
           :where
           [?page :block/journal? true]
           [?page :block/journal-day ?journal-day]
           [(<= ?journal-day ?today)]]
         (conn/get-conn (state/get-current-repo))
         today)))

(defn get-latest-journals
  ([n]
   (get-latest-journals (state/get-current-repo) n))
  ([repo-url n]
   (when (conn/get-conn repo-url)
     (let [date (js/Date.)
           _ (.setDate date (- (.getDate date) (dec n)))
           today (db-utils/date->int (js/Date.))
           pages (->>
                  (react/q repo-url [:journals] {:use-cache? false}
                           '[:find ?page-name ?journal-day
                             :in $ ?today
                             :where
                             [?page :block/name ?page-name]
                             [?page :block/journal? true]
                             [?page :block/journal-day ?journal-day]
                             [(<= ?journal-day ?today)]]
                           today)
                  (react)
                  (sort-by last)
                  (reverse)
                  (map first)
                  (take n))]
       (mapv
        (fn [page]
          [page
           (get-page-format page)])
        pages)))))

;; get pages that this page referenced
(defn get-page-referenced-pages
  [repo page]
  (when (conn/get-conn repo)
    (let [pages (page-alias-set repo page)
          page-id (:db/id (db-utils/entity [:block/name page]))
          ref-pages (->> (react/q repo [:page/ref-pages page-id] {:use-cache? false}
                                  '[:find ?ref-page-name
                                    :in $ ?pages
                                    :where
                                    [?block :block/page ?p]
                                    [(contains? ?pages ?p)]
                                    [?block :block/refs ?ref-page]
                                    [?ref-page :block/name ?ref-page-name]]
                                  pages)
                         react
                         db-utils/seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) ref-pages))))

(defn get-page-linked-refs-refed-pages
  [repo page]
  (when-let [conn (conn/get-conn repo)]
    (->
     (d/q
      '[:find [?ref-page ...]
        :in $ % ?page
        :where
        [?p :block/name ?page]
        [?b :block/path-refs ?p]
        [?b :block/refs ?other-p]
        [(not= ?p ?other-p)]
        [?other-p :block/original-name ?ref-page]]
      conn
      rules
      page)
     (distinct))))

;; Ignore files with empty blocks for now
(defn get-pages-relation
  [repo with-journal?]
  (when-let [conn (conn/get-conn repo)]
    (let [q (if with-journal?
              '[:find ?page ?ref-page-name
                :where
                [?p :block/name ?page]
                [?block :block/page ?p]
                [?block :block/refs ?ref-page]
                [?ref-page :block/name ?ref-page-name]]
              '[:find ?page ?ref-page-name
                :where
                [?p :block/journal? false]
                [?p :block/name ?page]
                [?block :block/page ?p]
                [?block :block/refs ?ref-page]
                [?ref-page :block/name ?ref-page-name]])]
      (->>
       (d/q q conn)
       (map (fn [[page ref-page-name]]
              [page ref-page-name]))))))

;; get pages who mentioned this page
;; TODO: use :block/_refs
(defn get-pages-that-mentioned-page
  [repo page]
  (when (conn/get-conn repo)
    (let [page-id (:db/id (db-utils/entity [:block/name page]))
          pages (page-alias-set repo page)
          mentioned-pages (->> (react/q repo [:page/mentioned-pages page-id] {:use-cache? false}
                                        '[:find ?mentioned-page-name
                                          :in $ ?pages ?page-name
                                          :where
                                          [?block :block/refs ?p]
                                          [(contains? ?pages ?p)]
                                          [?block :block/page ?mentioned-page]
                                          [?mentioned-page :block/name ?mentioned-page-name]]
                                        pages
                                        page)
                               react
                               db-utils/seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) mentioned-pages))))

(defn- remove-children!
  [blocks]
  (let [parents (->> (mapcat :block/parent blocks)
                     (map :db/id)
                     (set))]
    (if (seq parents)
      (filter (fn [block] (contains? parents (:db/id block))) blocks)
      blocks)))

(defn has-children?
  ([block-id]
   (has-children? (state/get-current-repo) block-id))
  ([repo block-id]
   (let [db (conn/get-conn repo)]
     (when-let [block (db-utils/entity [:block/uuid block-id])]
       ;; perf: early stop
       (let [result (d/datoms db :avet :block/parent (:db/id block))]
         (boolean (seq result)))))))

;; TODO: improve perf
(defn with-children-refs
  [repo blocks]
  (when-let [conn (conn/get-conn repo)]
    (when (seq blocks)
      (let [block-ids (set (map :db/id blocks))
            refs (d/q
                  '[:find ?p ?ref
                    :in $ % ?block-ids
                    :where
                    (parent ?p ?b)
                    [(contains? ?block-ids ?p)]
                    [?b :block/refs ?ref]]
                  conn
                  rules
                  block-ids)
            refs (->> (group-by first refs)
                      (medley/map-vals #(set (map (fn [[_ id]] {:db/id id}) %))))]
        (map (fn [block] (assoc block :block/children-refs
                                (get refs (:db/id block)))) blocks)))))

(defn get-page-referenced-blocks-no-cache
  [page-id]
  (when-let [repo (state/get-current-repo)]
    (->>
     (d/q '[:find (pull ?b [*])
            :in $ ?page-id
            :where
            [?b :block/refs ?page-id]]
          (conn/get-conn repo)
          page-id)
     (flatten))))

(defn get-page-referenced-blocks
  ([page]
   (get-page-referenced-blocks (state/get-current-repo) page))
  ([repo page]
   (when repo
     (when (conn/get-conn repo)
       (let [page-id (:db/id (db-utils/entity [:block/name page]))
             pages (page-alias-set repo page)
             aliases (set/difference pages #{page-id})
             query-result (if (seq aliases)
                            (let [rules '[[(find-blocks ?block ?ref-page ?pages ?alias ?aliases)
                                           [?block :block/page ?alias]
                                           [(contains? ?aliases ?alias)]]
                                          [(find-blocks ?block ?ref-page ?pages ?alias ?aliases)
                                           [?block :block/refs ?ref-page]
                                           [(contains? ?pages ?ref-page)]]]]
                              (react/q repo [:block/refed-blocks page-id] {}
                                '[:find [(pull ?block ?block-attrs) ...]
                                  :in $ % ?pages ?aliases ?block-attrs
                                  :where
                                  (find-blocks ?block ?ref-page ?pages ?alias ?aliases)]
                                rules
                                pages
                                aliases
                                block-attrs))
                            (react/q repo [:block/refed-blocks page-id] {:use-cache? false}
                              '[:find [(pull ?ref-block ?block-attrs) ...]
                                :in $ ?page ?block-attrs
                                :where
                                [?ref-block :block/refs ?page]]
                              page-id
                              block-attrs))
             result (->> query-result
                         react
                         (sort-by-left-recursive)
                         (remove (fn [block]
                                   (= page-id (:db/id (:block/page block)))))
                         ;; (with-children-refs repo)
                         db-utils/group-by-page
                         (map (fn [[k blocks]]
                                (let [k (if (contains? aliases (:db/id k))
                                          (assoc k :block/alias? true)
                                          k)]
                                  [k blocks]))))]
         result)))))

(defn get-date-scheduled-or-deadlines
  [journal-title]
  (when-let [date (date/journal-title->int journal-title)]
    (let [future-days (state/get-scheduled-future-days)]
      (when-let [repo (state/get-current-repo)]
        (when-let [conn (conn/get-conn repo)]
          (->> (react/q repo [:custom :scheduled-deadline journal-title] {}
                 '[:find [(pull ?block ?block-attrs) ...]
                   :in $ ?day ?future ?block-attrs
                   :where
                   (or
                    [?block :block/scheduled ?d]
                    [?block :block/deadline ?d])
                   [(get-else $ ?block :block/repeated? false) ?repeated]
                   [(get-else $ ?block :block/marker "NIL") ?marker]
                   [(not= ?marker "DONE")]
                   [(not= ?marker "CANCELED")]
                   [(not= ?marker "CANCELLED")]
                   [(<= ?d ?future)]
                   (or-join [?repeated ?d ?day]
                            [(true? ?repeated)]
                            [(>= ?d ?day)])]
                 date
                 (+ date future-days)
                 block-attrs)
               react
               (sort-by-left-recursive)
               db-utils/group-by-page))))))

(defn- pattern [name]
  (re-pattern (str "(?i)(?<!#)(?<!\\[\\[)"
                   (util/regex-escape name)
                   "(?!\\]\\])")))

(defn get-page-unlinked-references
  [page]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (conn/get-conn repo)]
      (let [page-id     (:db/id (db-utils/entity [:block/name page]))
            alias-names (get-page-alias-names repo page)
            patterns    (->> (conj alias-names page)
                             (map pattern))
            filter-fn   (fn [datom]
                          (some (fn [p] (re-find p (:v datom))) patterns))]
        (->> (react/q repo [:block/unlinked-refs page-id]
                      {:query-fn (fn [db]
                                   (let [ids
                                         (->> (d/datoms db :aevt :block/content)
                                              (filter filter-fn)
                                              (map :e))
                                         result (d/pull-many db block-attrs ids)]
                                     (remove (fn [block] (= page-id (:db/id (:block/page block)))) result)))}
               nil)
             react
             (sort-by-left-recursive)
             db-utils/group-by-page)))))

;; TODO: Replace recursive queries with datoms index implementation
;; see https://github.com/tonsky/datascript/issues/130#issuecomment-169520434
(defn get-block-referenced-blocks
  [block-uuid]
  (when-let [repo (state/get-current-repo)]
    (when (conn/get-conn repo)
      (let [block (db-utils/entity [:block/uuid block-uuid])]
        (->> (react/q repo [:block/refed-blocks (:db/id block)]
               {}
               '[:find [(pull ?ref-block ?block-attrs) ...]
                 :in $ ?block-uuid ?block-attrs
                :where
                [?block :block/uuid ?block-uuid]
                [?ref-block :block/refs ?block]]
               block-uuid
               block-attrs)
            react
            (sort-by-left-recursive)
            db-utils/group-by-page)))))

(defn get-matched-blocks
  [match-fn limit]
  (when-let [repo (state/get-current-repo)]
    (let [pred (fn [db content]
                 (match-fn content))]
      (->> (d/q
            '[:find ?block
              :in $ ?pred
              :where
              [?block :block/content ?content]
              [(?pred $ ?content)]]
            (conn/get-conn)
            pred)
           (take limit)
           db-utils/seq-flatten
           (db-utils/pull-many '[:block/uuid
                                 :block/content
                                 :block/properties
                                 :block/format
                                 {:block/page [:block/name]}])))))

;; TODO: Does the result preserves the order of the arguments?
(defn get-blocks-contents
  [repo block-uuids]
  (let [db (conn/get-conn repo)]
    (db-utils/pull-many repo '[:block/content]
                        (mapv (fn [id] [:block/uuid id]) block-uuids))))

(defn journal-page?
  [page-name]
  (:block/journal? (db-utils/entity [:block/name page-name])))

(defn mark-repo-as-cloned!
  [repo-url]
  (db-utils/transact!
   [{:repo/url repo-url
     :repo/cloned? true}]))

(defn cloned?
  [repo-url]
  (when-let [conn (conn/get-conn repo-url)]
    (->
     (d/q '[:find ?cloned
            :in $ ?repo-url
            :where
            [?repo :repo/url ?repo-url]
            [?repo :repo/cloned? ?cloned]]
          conn
          repo-url)
     ffirst)))

(defn get-db-type
  [repo]
  (db-utils/get-key-value repo :db/type))

(defn local-native-fs?
  [repo]
  (= :local-native-fs (get-db-type repo)))

(defn get-public-pages
  [db]
  (-> (d/q
       '[:find ?p
         :where
         [?p :block/name]
         [?p :block/properties ?properties]
         [(get ?properties :public) ?pub]
         [(= true ?pub)]]
       db)
      (db-utils/seq-flatten)))

(defn get-public-false-pages
  [db]
  (-> (d/q
        '[:find ?p
          :where
          [?p :block/name]
          [?p :block/properties ?properties]
          [(get ?properties :public) ?pub]
          [(= false ?pub)]]
        db)
      (db-utils/seq-flatten)))

(defn get-public-false-block-ids
  [db]
  (-> (d/q
        '[:find ?b
          :where
          [?p :block/name]
          [?p :block/properties ?properties]
          [(get ?properties :public) ?pub]
          [(= false ?pub)]
          [?b :block/page ?p]]
        db)
      (db-utils/seq-flatten)))

(defn get-all-templates
  []
  (let [pred (fn [db properties]
               (some? (:template properties)))]
    (->> (d/q
          '[:find ?b ?p
            :in $ ?pred
            :where
            [?b :block/properties ?p]
            [(?pred $ ?p)]]
          (conn/get-conn)
          pred)
         (map (fn [[e m]]
                [(get m :template) e]))
         (into {}))))

(defn get-template-by-name
  [name]
  (when (string? name)
    (->> (d/q
           '[:find (pull ?b [*])
             :in $ ?name
             :where
             [?b :block/properties ?p]
             [(get ?p :template) ?t]
             [(= ?t ?name)]]
           (conn/get-conn)
           name)
         ffirst)))

(defonce blocks-count-cache (atom nil))

(defn blocks-count
  ([]
   (blocks-count true))
  ([cache?]
   (if (and cache? @blocks-count-cache)
     @blocks-count-cache
     (when-let [conn (conn/get-conn)]
       (let [n (count (d/datoms conn :avet :block/uuid))]
         (reset! blocks-count-cache n)
         n)))))

(defn get-all-block-uuids
  []
  (when-let [conn (conn/get-conn)]
    (->> (d/datoms conn :avet :block/uuid)
         (map :v))))

;; block/uuid and block/content
(defn get-all-block-contents
  []
  (when-let [conn (conn/get-conn)]
    (->> (d/datoms conn :avet :block/uuid)
         (map :v)
         (map (fn [id]
                (let [e (db-utils/entity [:block/uuid id])]
                  (when (and (not (:block/name e))
                             (not (string/blank? (:block/content e))))
                    {:db/id (:db/id e)
                     :block/uuid id
                     :block/page (:db/id (:block/page e))
                     :block/content (:block/content e)
                     :block/format (:block/format e)}))))
         (remove nil?))))

(defn get-assets
  [datoms]
  (keep
   (fn [datom]
     (when (= :block/content (:a datom))
       (let [matched (re-seq #"\([./]*/assets/([^)]+)\)" (:v datom))
             matched (get (into [] matched) 0)
             path (get matched 1)]
         (when (and (string? path)
                    (not (string/ends-with? path ".js")))
           path))))
   datoms))

(defn clean-export!
  [db]
  (let [remove? #(contains? #{"me" "recent" "file"} %)
        non-public-pages (get-public-false-pages db)
        non-public-datoms (get-public-false-block-ids db)
        non-public-datom-ids (set (concat non-public-pages non-public-datoms))
        filtered-db (d/filter db
                              (fn [db datom]
                                (let [ns (namespace (:a datom))]
                                  (and (not (remove? ns))
                                       (not (contains? #{:block/file} (:a datom)))
                                       (not (contains? non-public-datom-ids (:e datom)))))))
        datoms (d/datoms filtered-db :eavt)
        assets (get-assets datoms)]
    [@(d/conn-from-datoms datoms db-schema/schema) assets]))

(defn filter-only-public-pages-and-blocks
  [db]
  (let [public-pages (get-public-pages db)]
    (when (seq public-pages)
      (let [public-pages (set public-pages)
            exported-namespace? #(contains? #{"block" "me" "recent"} %)
            filtered-db (d/filter db
                                  (fn [db datom]
                                    (let [ns (namespace (:a datom))]
                                      (and
                                       (not (contains? #{:block/file} (:a datom)))
                                       (not= ns "file")
                                       (or
                                        (not (exported-namespace? ns))
                                        (and (= ns "block")
                                             (or
                                              (contains? public-pages (:e datom))
                                              (contains? public-pages (:db/id (:block/page (d/entity db (:e datom))))))))))))
            datoms (d/datoms filtered-db :eavt)
            assets (get-assets datoms)]
        [@(d/conn-from-datoms datoms db-schema/schema) assets]))))

(defn delete-blocks
  [repo-url files delete-page?]
  (when (seq files)
    (let [f (if delete-page? get-files-blocks get-files-non-page-blocks)
          blocks (f repo-url files)]
      (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks))))

(defn delete-files
  [files]
  (mapv (fn [path] [:db.fn/retractEntity [:file/path path]]) files))

(defn delete-file-blocks!
  [repo-url path]
  (let [blocks (get-file-blocks repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks)))

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

(defn delete-file!
  [repo-url file-path]
  (db-utils/transact! repo-url (delete-file-tx repo-url file-path)))

(defn delete-pages-by-files
  [files]
  (let [pages (->> (mapv get-file-page files)
                   (remove nil?))]
    (when (seq pages)
      (mapv (fn [page] [:db.fn/retractEntity [:block/name page]]) (map string/lower-case pages)))))

(defn remove-all-aliases!
  [repo]
  (let [page-ids (->>
                  (d/q '[:find ?e
                         :where
                         [?e :block/alias]]
                       (conn/get-conn repo))
                  (apply concat)
                  (distinct))
        tx-data (map (fn [page-id] [:db/retract page-id :block/alias]) page-ids)]
    (when (seq tx-data)
      (db-utils/transact! repo tx-data))))

(defn set-file-content!
  [repo path content]
  (when (and repo path)
    (let [tx-data {:file/path path
                   :file/content content}]
      (react/transact-react!
       repo
       [tx-data]
       {:key [:file/content path]}))))

(defn get-pre-block
  [repo page-id]
  (-> (d/q '[:find (pull ?b [*])
             :in $ ?page
             :where
             [?b :block/page ?page]
             [?b :block/pre-block? true]]
           (conn/get-conn repo)
           page-id)
      ffirst))

(defn get-namespace-pages
  [repo namespace]
  (assert (string? namespace))
  (when-let [db (conn/get-conn repo)]
    (when-not (string/blank? namespace)
      (let [namespace (string/lower-case (string/trim namespace))
            ids (->> (d/datoms db :aevt :block/name)
                     (filter (fn [datom]
                               (let [page (:v datom)]
                                 (or
                                  (= page namespace)
                                  (string/starts-with? page (str namespace "/"))))))
                     (map :e))]
        (when (seq ids)
          (db-utils/pull-many repo
                              '[:db/id :block/name :block/original-name
                                {:block/file [:db/id :file/path]}]
                              ids))))))

(defn get-latest-changed-pages
  [repo]
  (->>
   (d/q
     '[:find [(pull ?page [:block/name :block/file :block/updated-at]) ...]
       :where
       [?page :block/name]]
     (conn/get-conn repo))
   (filter :block/file)
   (sort-by :block/updated-at >)
   (take 200)))
