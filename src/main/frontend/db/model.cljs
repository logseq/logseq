(ns frontend.db.model
  "Core db functions."
  ;; TODO: Remove this config once how repos are passed to this ns are standardized
  {:clj-kondo/config {:linters {:unused-binding {:level :off}}}}
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
            [frontend.db.rules :refer [rules]]
            [frontend.db.default :as default-db]
            [frontend.util.drawer :as drawer]))

;; TODO: extract to specific models and move data transform logic to the
;; corresponding handlers.

;; Use it as an input argument for datalog queries
(def block-attrs
  '[:db/id
    :block/uuid
    :block/parent
    :block/left
    :block/collapsed?
    :block/format
    :block/refs
    :block/_refs
    :block/path-refs
    :block/tags
    :block/content
    :block/marker
    :block/priority
    :block/properties
    :block/pre-block?
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/created-at
    :block/updated-at
    :block/file
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
       (react/q repo [:frontend.db.react/block id] {}
         '[:find [(pull ?block ?block-attrs) ...]
           :in $ ?id ?block-attrs
           :where
           [?block :block/uuid ?id]]
         id
         block-attrs)
       react
       first))))

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
         (util/page-name-sanity-lc tag-name))))

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
                  (util/page-name-sanity-lc page-name))
             db-utils/seq-flatten
             distinct)))

(defn get-alias-source-page
  [repo alias]
  (when-let [conn (and repo (conn/get-conn repo))]
    (let [alias (util/page-name-sanity-lc alias)
          pages (->>
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
                                   (map util/page-name-sanity-lc)
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
               [?p :block/file ?file]
               [?block :block/page ?p]]
             (conn/get-conn repo-url) pred)
        db-utils/seq-flatten)))

(defn get-file-blocks
  [repo-url path]
  (-> (d/q '[:find ?block
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?p :block/file ?file]
             [?block :block/page ?p]]
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
          :file/last-modified-at last-modified-at}]
        {:skip-refresh? true}))))

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

(defn get-file
  ([path]
   (get-file (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (when-let [conn (conn/get-conn repo)]
       (:file/content (d/entity conn [:file/path path]))))))

(defn get-custom-css
  []
  (when-let [repo (state/get-current-repo)]
    (get-file (config/get-file-path repo "logseq/custom.css"))))

(defn get-block-by-uuid
  [id]
  (db-utils/entity [:block/uuid (if (uuid? id) id (uuid id))]))

(defn query-block-by-uuid
  [id]
  (db-utils/pull [:block/uuid (if (uuid? id) id (uuid id))]))

(defn get-page-format
  [page-name]
  (or
   (let [page (db-utils/entity [:block/name (util/safe-page-name-sanity-lc page-name)])]
     (or
      (:block/format page)
      (when-let [file (:block/file page)]
        (when-let [path (:file/path (db-utils/entity (:db/id file)))]
          (format/get-format path)))))
   (state/get-preferred-format)
   :markdown))

(defn page-alias-set
  [repo-url page]
  (when-let [page-id (:db/id (db-utils/entity repo-url [:block/name (util/safe-page-name-sanity-lc page)]))]
    (->>
     (d/q '[:find ?e
            :in $ ?page-name %
            :where
            [?page :block/name ?page-name]
            (alias ?page ?e)]
          (conn/get-conn repo-url)
          (util/safe-page-name-sanity-lc page)
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

(defn get-entities-by-ids
  ([ids]
   (get-entities-by-ids (state/get-current-repo) ids))
  ([repo ids]
   (when repo
     (db-utils/pull-many repo '[*] ids))))

(defn get-page-names-by-ids
  ([ids]
   (get-page-names-by-ids (state/get-current-repo) ids))
  ([repo ids]
   (when repo
     (->> (db-utils/pull-many repo '[:block/name] ids)
          (map :block/name)))))

(defn get-page-alias-names
  [repo page-name]
  (let [alias-ids (page-alias-set repo page-name)]
    (when (seq alias-ids)
      (let [names (->> (get-page-names-by-ids repo alias-ids)
                       distinct
                       (remove #(= (util/page-name-sanity-lc %) (util/page-name-sanity-lc page-name))))
            lookup-refs (map (fn [name]
                               [:block/name (util/page-name-sanity-lc name)]) names)]
        (->> (db-utils/pull-many repo '[:block/name :block/original-name] lookup-refs)
             (map (fn [m]
                    (or (:block/original-name m) (:block/name m)))))))))

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
  (when-let [page (db-utils/entity [:block/name (util/safe-page-name-sanity-lc page)])]
    (:block/properties page)))

;; FIXME: alert
(defn sort-by-left
  ([blocks parent]
   (sort-by-left blocks parent {:check? true}))
  ([blocks parent {:keys [check?]}]
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
         #_(util/pprint duplicates)))
     (assert (= (count blocks) (count (set (map :block/left blocks)))) "Each block should have a different left node"))

   (let [left->blocks (reduce (fn [acc b] (assoc acc (:db/id (:block/left b)) b)) {} blocks)]
     (loop [block parent
            result []]
       (if-let [next (get left->blocks (:db/id block))]
         (recur next (conj result next))
         (vec result))))))

(defn sort-by-left-recursive
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

(defn has-children?
  ([block-id]
   (has-children? (state/get-current-repo) block-id))
  ([repo block-id]
   (some? (:block/_parent (db-utils/entity repo [:block/uuid block-id])))))

(defn- collapsed-and-has-children?
  [block]
  (and (:block/collapsed? block) (has-children? (:block/uuid block))))

(defn get-by-parent-&-left
  [conn parent-id left-id]
  (when (and parent-id left-id)
    (let [lefts (:block/_left (d/entity @conn left-id))
          children (:block/_parent (d/entity @conn parent-id))
          ids (set/intersection lefts children)
          id (:db/id (first ids))]
      (when id (d/pull @conn '[*] id)))))

(defn- get-next-outdented-block
  "Get the next outdented block of the block that has the `id`.
  e.g.
  - a
    - b
      - c
  - d

  The next outdented block of `c` is `d`."
  [id]
  (when-let [block (db-utils/entity id)]
    (let [parent (:block/parent block)]
      (if-let [parent-sibling (get-by-parent-&-left (conn/get-conn false)
                                                    (:db/id (:block/parent parent))
                                                    (:db/id parent))]
       parent-sibling
       (get-next-outdented-block (:db/id parent))))))

(defn get-paginated-blocks-no-cache
  "Result should be sorted."
  [start-id {:keys [limit include-start? scoped-block-id]}]
  (when-let [start (db-utils/entity start-id)]
    (let [scoped-block-parent (when scoped-block-id
                                (:db/id (:block/parent (db-utils/entity scoped-block-id))))
          conn (conn/get-conn false)
          result (loop [block start
                        result []]
                   (if (and limit (>= (count result) limit))
                     result
                     (let [block-id (:db/id block)
                           block-parent-id (:db/id (:block/parent block))
                           next-block (or
                                       (if (collapsed-and-has-children? block) ; skips children
                                         ;; Sibling
                                         (get-by-parent-&-left conn block-parent-id block-id)
                                         (or
                                          ;; Child
                                          (get-by-parent-&-left conn block-id block-id)
                                          ;; Sibling
                                          (get-by-parent-&-left conn block-parent-id block-id)))

                                       ;; Next outdented block
                                       (get-next-outdented-block block-id))]
                       (if next-block
                         (if (and scoped-block-parent (= (:db/id (:block/parent next-block)) scoped-block-parent))
                           result
                           (recur next-block (conj result next-block)))
                         result))))]
      (if include-start?
        (cons start result)
        result))))

(defn get-block-last-direct-child
  [db-id]
  (when-let [block (db-utils/entity db-id)]
    (when-not (collapsed-and-has-children? block)
      (let [children (:block/_parent block)
            all-left (set (concat (map (comp :db/id :block/left) children) [db-id]))
            all-ids (set (map :db/id children))]
        (first (set/difference all-ids all-left))))))

(defn get-block-last-child
  [db-id]
  (let [last-child (get-block-last-direct-child db-id)]
    (loop [prev last-child
           last-child last-child]
      (if last-child
        (recur last-child (get-block-last-direct-child last-child))
        prev))))

(defn- get-prev-open-block
  [id]
  (let [conn (conn/get-conn false)
        block (db-utils/entity id)
        left (:block/left block)
        left-id (:db/id left)]
    (if (= (:db/id left) (:db/id (:block/parent block)))
      left-id
      (if (util/collapsed? left)
        left-id
        (or (get-block-last-child (:db/id left)) left-id)))))

(defn recursive-child?
  [repo child-id parent-id]
  (loop [node (db-utils/entity repo child-id)]
    (if node
      (let [parent (:block/parent node)]
        (if (= (:db/id parent) parent-id)
          true
          (recur parent)))
      false)))

(defn get-paginated-blocks
  "Get paginated blocks for a page or a specific block.
   `block?`: if true, returns its children only."
  ([repo-url block-id]
   (get-paginated-blocks repo-url block-id {}))
  ([repo-url block-id {:keys [pull-keys start-block limit use-cache? scoped-block-id]
                       :or {pull-keys '[* :block/_refs]
                            limit 50
                            use-cache? true
                            scoped-block-id nil}}]
   (assert (integer? block-id))
   (let [entity (db-utils/entity repo-url block-id)
         page? (some? (:block/name entity))
         page-entity (if page? entity (:block/page entity))
         page-id (:db/id page-entity)
         bare-page-map {:db/id page-id
                        :block/name (:block/name page-entity)
                        :block/original-name (:block/original-name page-entity)
                        :block/journal-day (:block/journal-day page-entity)}
         query-key (if page?
                     :frontend.db.react/page-blocks
                     :frontend.db.react/block-and-children)]
     (some->
      (react/q repo-url [query-key block-id]
        {:use-cache? use-cache?
         :query-fn (fn [db tx-report result]
                     (let [tx-data (:tx-data tx-report)
                           refs (some->> (filter #(= :block/refs (:a %)) tx-data)
                                         (map :v))
                           tx-block-ids (distinct (->> (map :e tx-data)
                                                       (concat refs)))
                           [tx-id->block cached-id->block] (when (and tx-report result)
                                                             (let [blocks (->> (db-utils/pull-many repo-url pull-keys tx-block-ids)
                                                                               (remove nil?))]
                                                               [(zipmap (mapv :db/id blocks) blocks)
                                                                (zipmap (mapv :db/id @result) @result)]))
                           limit (if (and result @result) (+ (count @result) 5) limit)
                           outliner-op (get-in tx-report [:tx-meta :outliner-op])
                           blocks (cond
                                    (contains? #{:save-node :indent-outdent-nodes :delete-node :delete-nodes} outliner-op)
                                    @result

                                    (contains? #{:insert-node :insert-nodes :save-and-insert-node} outliner-op)
                                    (let [cached-ids (set (conj (map :db/id @result) page-id))
                                          first-insert-id (some #(when (and (not (contains? cached-ids %))
                                                                            (recursive-child? repo-url % block-id))
                                                                   %) tx-block-ids)
                                          start-id (get-prev-open-block first-insert-id)
                                          start-page? (:block/name (db-utils/entity start-id))]
                                      (when-not start-page?
                                        (let [previous-blocks (take-while (fn [b] (not= start-id (:db/id b))) @result)
                                              more (get-paginated-blocks-no-cache start-id {:limit 25
                                                                                            :include-start? true
                                                                                            :scoped-block-id scoped-block-id})]
                                          (concat previous-blocks more))))

                                    ;; TODO: drag && drop, move blocks up/down

                                    :else
                                    nil)
                           blocks (or blocks
                                      (get-paginated-blocks-no-cache block-id {:limit limit
                                                                               :include-start? (not page?)
                                                                               :scoped-block-id scoped-block-id}))
                           block-eids (map :db/id blocks)
                           blocks (if (seq tx-id->block)
                                    (map (fn [id]
                                           (or (get tx-id->block id)
                                               (get cached-id->block id)
                                               (db-utils/pull repo-url pull-keys id))) block-eids)
                                    (db-utils/pull-many repo-url pull-keys block-eids))
                           blocks (remove (fn [b] (nil? (:block/content b))) blocks)]
                       (map (fn [b] (assoc b :block/page bare-page-map)) blocks)))}
        nil)
      react))))

(defn get-page-blocks-no-cache
  ([page]
   (get-page-blocks-no-cache (state/get-current-repo) page nil))
  ([repo-url page]
   (get-page-blocks-no-cache repo-url page nil))
  ([repo-url page {:keys [pull-keys]
                   :or {pull-keys '[*]}}]
   (when page
     (let [page (util/page-name-sanity-lc page)
           page-id (:db/id (db-utils/entity repo-url [:block/name page]))
           db (conn/get-conn repo-url)]
       (when page-id
         (let [datoms (d/datoms db :avet :block/page page-id)
               block-eids (mapv :e datoms)]
           (db-utils/pull-many repo-url pull-keys block-eids)))))))

(defn get-page-blocks-count
  [repo page-id]
  (when-let [db (conn/get-conn repo)]
    (count (d/datoms db :avet :block/page page-id))))

(defn page-empty?
  [repo page-id]
  (when-let [db (conn/get-conn repo)]
    (let [page-id (if (string? page-id)
                    [:block/name (util/safe-page-name-sanity-lc page-id)]
                    page-id)
          page (d/entity db page-id)]
      (nil? (:block/_left page)))))

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
          '[:db/id :block/collapsed? :block/properties {:block/parent ...}]
          [:block/uuid block-id]))

(defn parents-collapsed?
  [repo block-id]
  (when-let [block (:block/parent (get-block-parents-v2 repo block-id))]
    (->> (tree-seq map? (fn [x] [(:block/parent x)]) block)
         (some util/collapsed?))))

(defn block-collapsed?
  ([block-id]
   (block-collapsed? (state/get-current-repo) block-id))
  ([repo block-id]
   (when-let [block (db-utils/entity repo [:block/uuid block-id])]
     (util/collapsed? block))))

(defn get-block-page
  [repo block-id]
  (when-let [block (db-utils/entity repo [:block/uuid block-id])]
    (db-utils/entity repo (:db/id (:block/page block)))))

(defn get-pages-by-name-partition
  [repo partition]
  (when-let [conn (conn/get-conn repo)]
    (when-not (string/blank? partition)
      (let [partition (util/page-name-sanity-lc (string/trim partition))
            ids (->> (d/datoms conn :aevt :block/name)
                     (filter (fn [datom]
                               (let [page (:v datom)]
                                 (string/includes? page partition))))
                     (map :e))]
        (when (seq ids)
          (db-utils/pull-many repo
                              '[:db/id :block/name :block/original-name]
                              ids))))))


(defn get-block-children-ids
  [repo block-uuid]
  (when-let [conn (conn/get-conn repo)]
    (let [eid (:db/id (db-utils/entity repo [:block/uuid block-uuid]))]
      (->> (d/q
            '[:find ?id
              :in $ ?p %
              :where
              (child ?p ?c)
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
            [?parent :block/uuid ?parent-id]
            [?b :block/parent ?parent]]
          conn
          block-uuid)
        (sort-by-left (db-utils/entity [:block/uuid block-uuid])))))

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
  [repo block-uuid]
  (some-> (d/q
            '[:find [(pull ?block ?block-attrs) ...]
              :in $ ?id ?block-attrs
              :where
              [?block :block/uuid ?id]]
            (conn/get-conn repo)
            block-uuid
            block-attrs)
          first
          flatten-tree))

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
  ([page-name]
   (get-page-file (state/get-current-repo) page-name))
  ([repo page-name]
   (some-> (or (db-utils/entity repo [:block/name page-name])
               (db-utils/entity repo [:block/original-name page-name]))
           :block/file)))

(defn get-block-file-path
  [block]
  (when-let [page-id (:db/id (:block/page block))]
    (:file/path (:block/file (db-utils/entity page-id)))))

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
    (db-utils/entity [:block/name (util/page-name-sanity-lc page-name)])))

(defn get-redirect-page-name
  "Accepts both sanitized or unsanitized"
  ([page-name] (get-redirect-page-name page-name false))
  ([page-name alias?]
   (when page-name
     (let [page-name (util/page-name-sanity-lc page-name)
           page-entity (db-utils/entity [:block/name page-name])]
       (cond
         alias?
         page-name

         (page-empty-or-dummy? (state/get-current-repo) (:db/id page-entity))
         (let [source-page (get-alias-source-page (state/get-current-repo) page-name)]
           (or (when source-page (:block/name source-page))
               page-name))

         :else
         page-name)))))

(defn get-page-original-name
  [page-name]
  (when (string? page-name)
    (let [page (db-utils/pull [:block/name (util/page-name-sanity-lc page-name)])]
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
           today (db-utils/date->int (js/Date.))]
       (->>
        (react/q repo-url [:frontend.db.react/journals] {:use-cache? false}
          '[:find [(pull ?page [*]) ...]
            :in $ ?today
            :where
            [?page :block/name ?page-name]
            [?page :block/journal? true]
            [?page :block/journal-day ?journal-day]
            [(<= ?journal-day ?today)]]
          today)
        (react)
        (sort-by :block/journal-day)
        (reverse)
        (take n))))))

(defn journal-day-exists?
  [graph day]
  (d/q
    '[:find ?p .
      :in $ ?day
      :where
      [?p :block/journal-day ?day]]
    (conn/get-conn graph)
    day))

;; get pages that this page referenced
(defn get-page-referenced-pages
  [repo page]
  (when-let [db (conn/get-conn repo)]
    (let [page-name (util/safe-page-name-sanity-lc page)
          pages (page-alias-set repo page)
          page-id (:db/id (db-utils/entity [:block/name page-name]))
          ref-pages (d/q
                      '[:find [?ref-page-name ...]
                        :in $ ?pages
                        :where
                        [(untuple ?pages) [?page ...]]
                        [?block :block/page ?page]
                        [?block :block/refs ?ref-page]
                        [?ref-page :block/name ?ref-page-name]]
                      db
                      pages)]
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
      (util/safe-page-name-sanity-lc page))
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
    (let [page-id (:db/id (db-utils/entity [:block/name (util/safe-page-name-sanity-lc page)]))
          pages (page-alias-set repo page)
          mentioned-pages (->> (react/q repo [:frontend.db.react/page<-pages page-id] {:use-cache? false}
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
       (let [page-id (:db/id (db-utils/entity [:block/name (util/safe-page-name-sanity-lc page)]))
             pages (page-alias-set repo page)
             aliases (set/difference pages #{page-id})
             query-result (if (seq aliases)
                            (let [rules '[[(find-blocks ?block ?ref-page ?pages ?alias ?aliases)
                                           [?block :block/page ?alias]
                                           [(contains? ?aliases ?alias)]]
                                          [(find-blocks ?block ?ref-page ?pages ?alias ?aliases)
                                           [?block :block/refs ?ref-page]
                                           [(contains? ?pages ?ref-page)]]]]
                              (react/q repo
                                       [:frontend.db.react/page<-blocks-or-block<-blocks page-id]
                                       {}
                                       '[:find [(pull ?block ?block-attrs) ...]
                                         :in $ % ?pages ?aliases ?block-attrs
                                         :where
                                         (find-blocks ?block ?ref-page ?pages ?alias ?aliases)]
                                       rules
                                       pages
                                       aliases
                                       block-attrs))
                            (react/q repo
                                     [:frontend.db.react/page<-blocks-or-block<-blocks page-id]
                                     {:use-cache? false}
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
                         db-utils/group-by-page
                         (map (fn [[k blocks]]
                                (let [k (if (contains? aliases (:db/id k))
                                          (assoc k :block/alias? true)
                                          k)]
                                  [k blocks]))))]
         result)))))

(defn get-page-referenced-blocks-ids
  "Faster and can be used for pagination later."
  ([page]
   (get-page-referenced-blocks-ids (state/get-current-repo) page))
  ([repo page]
   (when repo
     (when-let [conn (conn/get-conn repo)]
       (let [page-id (:db/id (db-utils/entity [:block/name (util/safe-page-name-sanity-lc page)]))
             pages (page-alias-set repo page)
             aliases (set/difference pages #{page-id})
             query-result (if (seq aliases)
                            (let [rules '[[(find-blocks ?block ?ref-page ?pages ?alias ?aliases)
                                           [?block :block/page ?alias]
                                           [(contains? ?aliases ?alias)]]
                                          [(find-blocks ?block ?ref-page ?pages ?alias ?aliases)
                                           [?block :block/refs ?ref-page]
                                           [(contains? ?pages ?ref-page)]]]]
                              (d/q
                                '[:find ?block
                                  :in $ % ?pages ?aliases ?block-attrs
                                  :where
                                  (find-blocks ?block ?ref-page ?pages ?alias ?aliases)]
                                conn
                                rules
                                pages
                                aliases
                                block-attrs))
                            (d/q
                              '[:find ?ref-block
                                :in $ ?page ?block-attrs
                                :where
                                [?ref-block :block/refs ?page]]
                              conn
                              page-id
                              block-attrs))]
         query-result)))))

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
  (re-pattern (str "(?i)(^|[^\\[#0-9a-zA-Z]|((^|[^\\[])\\[))"
                   (util/regex-escape name)
                   "($|[^0-9a-zA-Z])")))

(defn get-page-unlinked-references
  [page]
  (when-let [repo (state/get-current-repo)]
    (when (conn/get-conn repo)
      (let [page (util/safe-page-name-sanity-lc page)
            page-id     (:db/id (db-utils/entity [:block/name page]))
            alias-names (get-page-alias-names repo page)
            patterns    (->> (conj alias-names page)
                             (map pattern))
            filter-fn   (fn [datom]
                          (some (fn [p]
                                  (re-find p (->> (:v datom)
                                                  (drawer/remove-logbook))))
                                patterns))]
        (->> (react/q repo [:frontend.db.react/page-unlinked-refs page-id]
                      {:query-fn (fn [db _tx-report _result]
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
        (->> (react/q repo [:frontend.db.react/page<-blocks-or-block<-blocks
                            (:db/id block)]
                      {:use-cache? false}
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

(defn get-block-referenced-blocks-ids
  [block-uuid]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (conn/get-conn repo)]
      (let [block (db-utils/entity [:block/uuid block-uuid])]
        (->> (react/q repo [:frontend.db.react/block<-block-ids
                            (:db/id block)] {}
                      '[:find ?ref-block
                        :in $ ?block-uuid ?block-attrs
                        :where
                        [?block :block/uuid ?block-uuid]
                        [?ref-block :block/refs ?block]]
                      block-uuid
                      block-attrs)
             react)))))

(defn get-referenced-blocks-ids
  [page-name-or-block-uuid]
  (if (util/uuid-string? (str page-name-or-block-uuid))
    (let [id (uuid page-name-or-block-uuid)]
      (get-block-referenced-blocks-ids id))
    (get-page-referenced-blocks-ids page-name-or-block-uuid)))

(defn get-matched-blocks
  [match-fn limit]
  (when-let [repo (state/get-current-repo)]
    (let [pred (fn [_db content]
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
  "sanitized page-name only"
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
  (let [pred (fn [_db properties]
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
                              (fn [_db datom]
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
  [repo-url files _delete-page?]
  (when (seq files)
    (let [blocks (get-files-blocks repo-url files)]
      (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks))))

(defn delete-files
  [files]
  (mapv (fn [path] [:db.fn/retractEntity [:file/path path]]) files))

(defn delete-file-blocks!
  [repo-url path]
  (let [blocks (get-file-blocks repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks)))

(defn delete-page-blocks
  [repo-url page]
  (when page
    (when-let [db (conn/get-conn repo-url)]
      (let [page (db-utils/pull [:block/name (util/page-name-sanity-lc page)])]
        (when page
          (let [datoms (d/datoms db :avet :block/page (:db/id page))
                block-eids (mapv :e datoms)]
            (mapv (fn [eid] [:db.fn/retractEntity eid]) block-eids)))))))

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
      (mapv (fn [page] [:db.fn/retractEntity [:block/name page]]) (map util/page-name-sanity-lc pages)))))

(defn set-file-content!
  [repo path content]
  (when (and repo path)
    (let [tx-data {:file/path path
                   :file/content content}]
      (db-utils/transact! repo [tx-data] {:skip-refresh? true}))))

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
  "Accepts both sanitized and unsanitized namespaces"
  [repo namespace]
  (assert (string? namespace))
  (let [namespace (util/page-name-sanity-lc namespace)]
    (d/q
      '[:find [(pull ?c [:db/id :block/name :block/original-name
                         :block/namespace
                         {:block/file [:db/id :file/path]}]) ...]
        :in $ % ?namespace
        :where
        [?p :block/name ?namespace]
        (namespace ?p ?c)]
      (conn/get-conn repo)
      rules
      namespace)))

(defn- tree [flat-col root]
  (let [sort-fn #(sort-by :block/name %)
        children (group-by :block/namespace flat-col)
        namespace-children (fn namespace-children [parent-id]
                             (map (fn [m]
                                    (assoc m :namespace/children
                                           (sort-fn (namespace-children {:db/id (:db/id m)}))))
                               (sort-fn (get children parent-id))))]
    (namespace-children root)))

(defn get-namespace-hierarchy
  "Unsanitized namespaces"
  [repo namespace]
  (let [children (get-namespace-pages repo namespace)
        namespace-id (:db/id (db-utils/entity [:block/name (util/page-name-sanity-lc namespace)]))
        root {:db/id namespace-id}
        col (conj children root)]
    (tree col root)))

(defn get-page-namespace
  [repo page]
  (:block/namespace (db-utils/entity repo [:block/name (util/page-name-sanity-lc page)])))

(defn get-page-namespace-routes
  [repo page]
  (assert (string? page))
  (when-let [db (conn/get-conn repo)]
    (when-not (string/blank? page)
      (let [page (util/page-name-sanity-lc (string/trim page))
            page-exist? (db-utils/entity repo [:block/name page])
            ids (if page-exist?
                  '()
                  (->> (d/datoms db :aevt :block/name)
                       (filter (fn [datom]
                                 (string/ends-with? (:v datom) (str "/" page))))
                       (map :e)))]
        (when (seq ids)
          (db-utils/pull-many repo
                              '[:db/id :block/name :block/original-name
                                {:block/file [:db/id :file/path]}]
                              ids))))))

(defn get-orphaned-pages
  [{:keys [repo pages empty-ref-f]
          :or {repo (state/get-current-repo)
               empty-ref-f (fn [page] (zero? (count (:block/_refs page))))}}]
  (let [pages (->> (or pages (get-pages repo))
                   (remove nil?))
        built-in-pages (set (map string/lower-case default-db/built-in-pages-names))
        orphaned-pages (->>
                        (map
                          (fn [page]
                            (let [name (util/page-name-sanity-lc page)]
                              (when-let [page (db-utils/entity [:block/name name])]
                                (and
                                 (empty-ref-f page)
                                 (or
                                  (page-empty? repo (:db/id page))
                                  (let [first-child (first (:block/_left page))
                                        children (:block/_page page)]
                                    (and
                                     first-child
                                     (= 1 (count children))
                                     (contains? #{"" "-" "*"} (string/trim (:block/content first-child))))))
                                 (not (contains? built-in-pages name))
                                 (not (:block/_namespace page))
                                 ;; a/b/c might be deleted but a/b/c/d still exists (for backward compatibility)
                                 (not (and (string/includes? name "/")
                                           (not (:block/journal? page))))
                                 page))))
                          pages)
                        (remove false?)
                        (remove nil?))]
    orphaned-pages))
