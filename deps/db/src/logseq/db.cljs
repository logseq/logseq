(ns logseq.db
  "Main namespace for db fns that handles DB and file graphs. For db graph only
  fns, use logseq.db.frontend.db and for file graph only fns, use
  logseq.graph-parser.db"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.common.delete-blocks :as delete-blocks] ;; Load entity extensions
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.entity-util :as common-entity-util]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.file-based.schema :as file-schema]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.db :as db-db]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util])
  (:refer-clojure :exclude [object?]))

(def built-in? entity-util/built-in?)
(def built-in-class-property? db-db/built-in-class-property?)
(def private-built-in-page? db-db/private-built-in-page?)

(def write-transit-str sqlite-util/write-transit-str)
(def read-transit-str sqlite-util/read-transit-str)
(def build-favorite-tx db-db/build-favorite-tx)

(defonce *transact-fn (atom nil))
(defn register-transact-fn!
  [f]
  (when f (reset! *transact-fn f)))

(defn- remove-temp-block-data
  [tx-data]
  (let [remove-block-temp-f (fn [m]
                              (->> (remove (fn [[k _v]] (= "block.temp" (namespace k))) m)
                                   (into {})))]
    (keep (fn [data]
            (cond
              (map? data)
              (cond->
               (remove-block-temp-f data)
                (and (seq (:block/refs data))
                     (every? map? (:block/refs data)))
                (update :block/refs (fn [refs] (map remove-block-temp-f refs))))
              (and (vector? data)
                   (contains? #{:db/add :db/retract} (first data))
                   (> (count data) 2)
                   (keyword? (nth data 2))
                   (= "block.temp" (namespace (nth data 2))))
              nil
              :else
              data))
          tx-data)))

(defn assert-no-entities
  [tx-data]
  (walk/prewalk
   (fn [f]
     (if (de/entity? f)
       (throw (ex-info "ldb/transact! doesn't support Entity"
                       {:entity f
                        :tx-data tx-data}))
       f))
   tx-data))

(defn transact!
  "`repo-or-conn`: repo for UI thread and conn for worker/node"
  ([repo-or-conn tx-data]
   (transact! repo-or-conn tx-data nil))
  ([repo-or-conn tx-data tx-meta]
   (when (or (exists? js/process)
             (and (exists? js/goog) js/goog.DEBUG))
     (assert-no-entities tx-data))
   (let [tx-data (map (fn [m]
                        (if (map? m)
                          (cond->
                           (dissoc m :block/children :block/meta :block/top? :block/bottom? :block/anchor
                                   :block/level :block/container :db/other-tx
                                   :block/unordered)
                            (not @*transact-fn)
                            (dissoc :block.temp/load-status))
                          m)) tx-data)
         tx-data (->> (remove-temp-block-data tx-data)
                      (common-util/fast-remove-nils)
                      (remove empty?))
         delete-blocks-tx (when-not (string? repo-or-conn)
                            (delete-blocks/update-refs-history-and-macros @repo-or-conn tx-data tx-meta))
         tx-data (concat tx-data delete-blocks-tx)]

     ;; Ensure worker can handle the request sequentially (one by one)
     ;; Because UI assumes that the in-memory db has all the data except the last one transaction
     (when (or (seq tx-data) (:db-persist? tx-meta))

       ;; (prn :debug :transact :sync? (= d/transact! (or @*transact-fn d/transact!)) :tx-meta tx-meta)
       ;; (cljs.pprint/pprint tx-data)
       ;; (js/console.trace)

       (let [f (or @*transact-fn d/transact!)]
         (try
           (f repo-or-conn tx-data tx-meta)
           (catch :default e
             (js/console.trace)
             (prn :debug-tx-data tx-data)
             (throw e))))))))

(def page? common-entity-util/page?)
(def internal-page? entity-util/internal-page?)
(def class? entity-util/class?)
(def property? entity-util/property?)
(def closed-value? entity-util/closed-value?)
(def whiteboard? common-entity-util/whiteboard?)
(def journal? common-entity-util/journal?)
(def hidden? entity-util/hidden?)
(def object? entity-util/object?)
(def asset? entity-util/asset?)
(def public-built-in-property? db-property/public-built-in-property?)
(def get-entity-types entity-util/get-entity-types)
(def internal-tags db-class/internal-tags)
(def private-tags db-class/private-tags)
(def hidden-tags db-class/hidden-tags)

(defn sort-by-order
  [blocks]
  (sort-by :block/order blocks))

(defn- get-block-and-children-aux
  [entity & {:keys [include-property-block?]
             :or {include-property-block? false}
             :as opts}]
  (if-let [children (sort-by-order
                     (if include-property-block?
                       (:block/_raw-parent entity)
                       (:block/_parent entity)))]
    (cons entity (mapcat #(get-block-and-children-aux % opts) children))
    [entity]))

(defn get-block-and-children
  [db block-uuid & {:as opts}]
  (when-let [e (d/entity db [:block/uuid block-uuid])]
    (get-block-and-children-aux e opts)))

(defn get-page-blocks
  "Return blocks of the designated page, without using cache.
   page-id - eid"
  [db page-id & {:keys [pull-keys]
                 :or {pull-keys '[*]}}]
  (when page-id
    (let [datoms (d/datoms db :avet :block/page page-id)
          block-eids (mapv :e datoms)]
      (d/pull-many db pull-keys block-eids))))

(defn get-page-blocks-count
  [db page-id]
  (count (d/datoms db :avet :block/page page-id)))

(defn- get-block-children-or-property-children
  [block parent]
  (let [from-property (:logseq.property/created-from-property block)
        closed-property (:block/closed-value-property block)]
    (sort-by-order (cond
                     closed-property
                     (:property/closed-values closed-property)

                     from-property
                     (filter (fn [e]
                               (= (:db/id (:logseq.property/created-from-property e))
                                  (:db/id from-property)))
                             (:block/_raw-parent parent))

                     :else
                     (:block/_parent parent)))))

(defn get-right-sibling
  [block]
  (assert (or (de/entity? block) (nil? block)))
  (when-let [parent (:block/parent block)]
    (let [children (get-block-children-or-property-children block parent)
          right (some (fn [child] (when (> (compare (:block/order child) (:block/order block)) 0) child)) children)]
      (when (not= (:db/id right) (:db/id block))
        right))))

(defn get-left-sibling
  [block]
  (assert (or (de/entity? block) (nil? block)))
  (when-let [parent (:block/parent block)]
    (let [children (reverse (get-block-children-or-property-children block parent))
          left (some (fn [child] (when (< (compare (:block/order child) (:block/order block)) 0) child)) children)]
      (when (not= (:db/id left) (:db/id block))
        left))))

(defn get-down
  [block]
  (assert (or (de/entity? block) (nil? block)))
  (first (sort-by-order (:block/_parent block))))

(defn get-pages
  [db]
  (->> (d/q
        '[:find ?page-title
          :where
          [?page :block/name ?page-name]
          [(get-else $ ?page :block/title ?page-name) ?page-title]]
        db)
       (map first)
       (remove hidden?)))

(def get-first-page-by-name common-initial-data/get-first-page-by-name)

(def db-based-graph? entity-plus/db-based-graph?)

(defn page-exists?
  "Returns truthy value if page exists.
   For db graphs, returns all page db ids that given title and one of the given `tags`.
   For file graphs, returns page entity if it exists"
  [db page-name tags]
  (when page-name
    (if (db-based-graph? db)
      (let [tags' (if (coll? tags) (set tags) #{tags})]
        ;; Classes and properties are case sensitive and can be looked up
        ;; as such in case-sensitive contexts e.g. no Page
        (if (and (seq tags') (every? #{:logseq.class/Tag :logseq.class/Property} tags'))
          (seq
           (d/q
            '[:find [?p ...]
              :in $ ?name [?tag-ident ...]
              :where
              [?p :block/title ?name]
              [?p :block/tags ?tag]
              [?tag :db/ident ?tag-ident]]
            db
            page-name
            tags'))
          ;; TODO: Decouple db graphs from file specific :block/name
          (seq
           (d/q
            '[:find [?p ...]
              :in $ ?name [?tag-ident ...]
              :where
              [?p :block/name ?name]
              [?p :block/tags ?tag]
              [?tag :db/ident ?tag-ident]]
            db
            (common-util/page-name-sanity-lc page-name)
            tags'))))
      (d/entity db [:block/name (common-util/page-name-sanity-lc page-name)]))))

(defn get-page
  "Get a page given its unsanitized name"
  [db page-id-name-or-uuid]
  (when db
    (if (number? page-id-name-or-uuid)
      (d/entity db page-id-name-or-uuid)
      (if-let [id (if (uuid? page-id-name-or-uuid) page-id-name-or-uuid
                      (parse-uuid page-id-name-or-uuid))]
        (d/entity db [:block/uuid id])
        (d/entity db (get-first-page-by-name db (name page-id-name-or-uuid)))))))

(defn get-built-in-page
  [db title]
  (when db
    (let [id (common-uuid/gen-uuid :builtin-block-uuid title)]
      (d/entity db [:block/uuid id]))))

(defn library?
  [page]
  (and (built-in? page)
       (= common-config/library-page-name (:block/title page))))

(defn get-case-page
  "Case sensitive version of get-page. For use with DB graphs"
  [db page-name-or-uuid]
  (when db
    (if-let [id (if (uuid? page-name-or-uuid) page-name-or-uuid
                    (parse-uuid page-name-or-uuid))]
      (d/entity db [:block/uuid id])
      (d/entity db (common-initial-data/get-first-page-by-title db page-name-or-uuid)))))

(defn page-empty?
  "Whether a page is empty. Does it has a non-page block?
  `page-id` could be either a string or a db/id."
  [db page-id]
  (let [page-id (if (string? page-id)
                  (get-first-page-by-name db page-id)
                  page-id)
        page (d/entity db page-id)]
    (empty? (:block/_parent page))))

(defn get-first-child
  [db id]
  (first (sort-by-order (:block/_parent (d/entity db id)))))

(defn get-orphaned-pages
  [db {:keys [pages empty-ref-f built-in-pages-names]
       :or {empty-ref-f (fn [page] (zero? (count (:block/_refs page))))
            built-in-pages-names #{}}}]
  (let [pages (->> (or pages (get-pages db))
                   (remove nil?))
        built-in-pages (set (map string/lower-case built-in-pages-names))
        orphaned-pages (->>
                        (map
                         (fn [page]
                           (when-let [page (get-page db page)]
                             (let [name' (:block/name page)]
                               (and
                                (empty-ref-f page)
                                (or
                                 (page-empty? db (:db/id page))
                                 (let [first-child (get-first-child db (:db/id page))
                                       children (:block/_page page)]
                                   (and
                                    first-child
                                    (= 1 (count children))
                                    (contains? #{"" "-" "*"} (string/trim (:block/title first-child))))))
                                (not (contains? built-in-pages name'))
                                (not (whiteboard? page))
                                (not (:block/_namespace page))
                                (not (property? page))
                                 ;; a/b/c might be deleted but a/b/c/d still exists (for backward compatibility)
                                (not (and (string/includes? name' "/")
                                          (not (journal? page))))
                                (not (:block/properties page))
                                page))))
                         pages)
                        (remove false?)
                        (remove nil?)
                        (remove hidden?))]
    orphaned-pages))

(defn has-children?
  [db block-id]
  (let [eid (if (uuid? block-id) [:block/uuid block-id] block-id)]
    (some? (:block/_parent (d/entity db eid)))))

(defn- collapsed-and-has-children?
  [db block]
  (and (:block/collapsed? block) (has-children? db (:block/uuid block))))

(defn get-block-last-direct-child-id
  "Notice: if `not-collapsed?` is true, will skip searching for any collapsed block."
  ([db db-id]
   (get-block-last-direct-child-id db db-id false))
  ([db db-id not-collapsed?]
   (when-let [block (d/entity db db-id)]
     (when (if not-collapsed?
             (not (collapsed-and-has-children? db block))
             true)
       (let [children (sort-by :block/order (:block/_parent block))]
         (:db/id (last children)))))))

(defn get-children
  "Doesn't include nested children."
  ([block-entity]
   (get-children nil block-entity))
  ([db block-entity-or-eid]
   (when-let [parent (cond
                       (number? block-entity-or-eid)
                       (d/entity db block-entity-or-eid)
                       (uuid? block-entity-or-eid)
                       (d/entity db [:block/uuid block-entity-or-eid])
                       :else
                       block-entity-or-eid)]
     (sort-by-order (:block/_parent parent)))))

(defn get-block-parents
  [db block-id & {:keys [depth] :or {depth 100}}]
  (loop [block-id block-id
         parents' (list)
         d 1]
    (if (> d depth)
      parents'
      (if-let [parent (:block/parent (d/entity db [:block/uuid block-id]))]
        (recur (:block/uuid parent) (conj parents' parent) (inc d))
        parents'))))

(def get-block-children-ids common-initial-data/get-block-children-ids)
(def get-block-full-children-ids common-initial-data/get-block-full-children-ids)

(defn- get-sorted-page-block-ids
  [db page-id]
  (let [root (d/entity db page-id)]
    (loop [result []
           children (sort-by-order (:block/_parent root))]
      (if (seq children)
        (let [child (first children)]
          (recur (conj result (:db/id child))
                 (concat
                  (sort-by-order (:block/_parent child))
                  (rest children))))
        result))))

(defn sort-page-random-blocks
  "Blocks could be non consecutive."
  [db blocks]
  (assert (every? #(= (:block/page %) (:block/page (first blocks))) blocks) "Blocks must to be in a same page.")
  (let [page-id (:db/id (:block/page (first blocks)))
        ;; TODO: there's no need to sort all the blocks
        sorted-ids (get-sorted-page-block-ids db page-id)
        blocks-map (zipmap (map :db/id blocks) blocks)]
    (keep blocks-map sorted-ids)))

(defn last-child-block?
  "The child block could be collapsed."
  [db parent-id child-id]
  (when-let [child (d/entity db child-id)]
    (cond
      (= parent-id child-id)
      true

      (get-right-sibling child)
      false

      :else
      (last-child-block? db parent-id (:db/id (:block/parent child))))))

(defn- consecutive-block?
  [db block-1 block-2]
  (let [aux-fn (fn [block-1 block-2]
                 (and (= (:block/page block-1) (:block/page block-2))
                      (or
                       ;; sibling or child
                       (= (:db/id (get-left-sibling block-2)) (:db/id block-1))
                       (when-let [prev-sibling (get-left-sibling (d/entity db (:db/id block-2)))]
                         (last-child-block? db (:db/id prev-sibling) (:db/id block-1))))))]
    (or (aux-fn block-1 block-2) (aux-fn block-2 block-1))))

(defn get-non-consecutive-blocks
  [db blocks]
  (vec
   (keep-indexed
    (fn [i _block]
      (when (< (inc i) (count blocks))
        (when-not (consecutive-block? db (nth blocks i) (nth blocks (inc i)))
          (nth blocks i))))
    blocks)))

(defn new-block-id
  []
  (common-uuid/gen-uuid))

(defn get-alias-source-page
  "return the source page (page-name) of an alias"
  [db alias-id]
  (when alias-id
      ;; may be a case that a user added same alias into multiple pages.
      ;; only return the first result for idiot-proof
    (first (:block/_alias (d/entity db alias-id)))))

(def get-block-alias common-initial-data/get-block-alias)

(defn page-alias-set
  [db page-id]
  (->>
   (get-block-alias db page-id)
   (set)
   (set/union #{page-id})))

(defn get-block-refs
  [db id]
  (let [entity (d/entity db id)
        db-based? (db-based-graph? db)
        alias (->> (get-block-alias db id)
                   (cons id)
                   distinct)
        ref-ids (->> (mapcat (fn [id]
                               (cond->> (:block/_refs (d/entity db id))
                                 db-based?
                                 (remove (fn [ref]
                                           ;; remove refs that have the block as either tag or property
                                           (or (and
                                                (class? entity)
                                                (d/datom db :eavt (:db/id ref) :block/tags (:db/id entity)))
                                               (and
                                                (property? entity)
                                                (d/datom db :eavt (:db/id ref) (:db/ident entity))))))
                                 true
                                 (map :db/id)))
                             alias)
                     distinct)]
    (when (seq ref-ids)
      (d/pull-many db '[*] ref-ids))))

(def get-block-refs-count common-initial-data/get-block-refs-count)

(defn hidden-or-internal-tag?
  [e]
  (or (entity-util/hidden? e) (db-class/internal-tags (:db/ident e))))

(defn get-all-pages
  [db]
  (->>
   (d/datoms db :avet :block/name)
   (keep (fn [d]
           (let [e (d/entity db (:e d))]
             (when-not (hidden-or-internal-tag? e)
               e))))))

(defn get-key-value
  [db key-ident]
  (:kv/value (d/entity db key-ident)))

(def kv sqlite-util/kv)

;; TODO: why not generate a UUID for all local graphs?
;; And prefer this local graph UUID when picking an ID for new rtc graph?
(defn get-graph-rtc-uuid
  [db]
  (when db (get-key-value db :logseq.kv/graph-uuid)))

(defn get-graph-schema-version
  [db]
  (when db (get-key-value db :logseq.kv/schema-version)))

(defn get-graph-remote-schema-version
  [db]
  (when db (get-key-value db :logseq.kv/remote-schema-version)))

(def get-all-properties db-db/get-all-properties)
(def get-class-extends db-class/get-class-extends)
(def get-classes-parents db-db/get-classes-parents)
(def get-title-with-parents db-db/get-title-with-parents)
(def class-instance? db-db/class-instance?)
(def inline-tag? db-db/inline-tag?)
(def node-display-type-classes db-db/node-display-type-classes)
(def get-class-ident-by-display-type db-db/get-class-ident-by-display-type)
(def get-display-type-by-class-ident db-db/get-display-type-by-class-ident)

(def get-recent-updated-pages common-initial-data/get-recent-updated-pages)

(def get-latest-journals common-initial-data/get-latest-journals)

(defn get-pages-relation
  [db with-journal?]
  (if (entity-plus/db-based-graph? db)
    (let [q (if with-journal?
              '[:find ?p ?ref-page
                :where
                [?block :block/page ?p]
                [?block :block/refs ?ref-page]]
              '[:find ?p ?ref-page
                :where
                [?block :block/page ?p]
                [?p :block/tags]
                (not [?p :block/tags :logseq.class/Journal])
                [?block :block/refs ?ref-page]])]
      (d/q q db))
    (let [q (if with-journal?
              '[:find ?p ?ref-page
                :where
                [?block :block/page ?p]
                [?block :block/refs ?ref-page]]
              '[:find ?p ?ref-page
                :where
                [?block :block/page ?p]
                (not [?p :block/type "journal"])
                [?block :block/refs ?ref-page]])]
      (d/q q db))))

(defn get-all-tagged-pages
  [db]
  (d/q '[:find ?page ?tag
         :where
         [?page :block/tags ?tag]]
       db))

(defn get-schema
  "Returns schema for given repo"
  [repo]
  (if (sqlite-util/db-based-graph? repo)
    db-schema/schema
    file-schema/schema))
