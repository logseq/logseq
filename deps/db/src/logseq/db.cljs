(ns logseq.db
  "Main namespace for public db fns"
  (:require [logseq.db.frontend.default :as default-db]
            [logseq.db.frontend.schema :as db-schema]
            [datascript.core :as d]
            [clojure.string :as string]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.content :as db-content]
            [clojure.set :as set]
            [logseq.db.frontend.rules :as rules]
            [logseq.db.frontend.entity-plus]
            [promesa.core :as p]))

;; Use it as an input argument for datalog queries
(def block-attrs
  '[:db/id
    :block/uuid
    :block/parent
    :block/left
    :block/collapsed?
    :block/collapsed-properties
    :block/format
    :block/refs
    :block/_refs
    :block/path-refs
    :block/tags
    :block/link
    :block/content
    :block/marker
    :block/priority
    :block/properties
    :block/properties-order
    :block/properties-text-values
    :block/pre-block?
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/created-at
    :block/updated-at
    ;; TODO: remove this in later releases
    :block/heading-level
    :block/file
    {:block/page [:db/id :block/name :block/original-name :block/journal-day]}
    {:block/_parent ...}])

(defonce *transact-fn (atom nil))
(defn register-transact-fn!
  [f]
  (when f (reset! *transact-fn f)))

(defonce *request-id (atom 0))
(defonce *request-id->response (atom {}))

(defn request-finished?
  "Whether any DB transaction request has been finished"
  []
  (empty? @*request-id->response))

(defn get-deferred-response
  [request-id]
  (:response (get @*request-id->response request-id)))

;; run the next request
(add-watch *request-id->response :loop-execute-requests
           (fn [_ _ _ new]
             (when-let [request-id (some->> (keys new)
                                            sort
                                            first)]
               (when-let [callback (:callback (get new request-id))]
                 (callback)))))

(defn transact!
  "`repo-or-conn`: repo for UI thread and conn for worker/node"
  ([repo-or-conn tx-data]
   (transact! repo-or-conn tx-data nil))
  ([repo-or-conn tx-data tx-meta]
   (let [tx-data (->> (common-util/fast-remove-nils tx-data)
                      (remove empty?))
         request-finished? (request-finished?)]
     ;; Ensure worker can handle the request sequentially (one by one)
     ;; Because UI assumes that the in-memory db has all the data except the last one transaction
     (when (seq tx-data)

       ;; (prn :debug :transact)
       ;; (cljs.pprint/pprint tx-data)

       (let [f (or @*transact-fn d/transact!)
             sync? (= f d/transact!)
             request-id (when-not sync? (swap! *request-id inc))
             tx-meta' (cond-> tx-meta
                        (not sync?)
                        (assoc :request-id request-id))]
         (if sync?
           (f repo-or-conn tx-data tx-meta')
           (let [resp (p/deferred)]
             (when request-finished?
               (f repo-or-conn tx-data tx-meta'))
             (let [value (if request-finished?
                           {:response resp}
                           {:response resp
                            :callback #(f repo-or-conn tx-data tx-meta')})]
               (swap! *request-id->response assoc request-id value))
             resp)))))))

(defn build-default-pages-tx
  []
  (let [time (common-util/time-ms)]
    (map
     (fn [m]
       (-> m
           (assoc :block/created-at time)
           (assoc :block/updated-at time)
           (assoc :block/format :markdown)))
     default-db/built-in-pages)))

(defn create-default-pages!
  "Creates default pages if one of the default pages does not exist. This
   fn is idempotent"
  [db-conn _opts]
  (when-not (d/entity @db-conn [:block/name "card"])
    (let [built-in-pages (build-default-pages-tx)]
      (transact! db-conn built-in-pages))))

(defn start-conn
  "Create datascript conn with schema and default data"
  [& {:keys [create-default-pages? schema]
      :or {create-default-pages? true
           schema db-schema/schema}}]
  (let [db-conn (d/create-conn schema)]
    (when create-default-pages?
      (create-default-pages! db-conn {}))
    db-conn))

(defn sort-by-left
  ([blocks parent]
   (sort-by-left blocks parent {:check? true}))
  ([blocks parent {:keys [_check?]}]
   (let [blocks (common-util/distinct-by :db/id blocks)
         left->blocks (reduce (fn [acc b] (assoc acc (:db/id (:block/left b)) b)) {} blocks)]
     (loop [block parent
            result []]
       (if-let [next (get left->blocks (:db/id block))]
         (recur next (conj result next))
         (vec result))))))

(defn try-sort-by-left
  [blocks parent]
  (let [result' (sort-by-left blocks parent {:check? false})]
    (if (= (count result') (count blocks))
      result'
      blocks)))

;; TODO: use the tree directly
(defn flatten-tree
  [blocks-tree]
  (if-let [children (:block/_parent blocks-tree)]
    (cons (dissoc blocks-tree :block/_parent) (mapcat flatten-tree children))
    [blocks-tree]))

;; TODO: performance enhance
(defn get-block-and-children
  [repo db block-uuid]
  (some-> (d/q
           '[:find [(pull ?block ?block-attrs) ...]
             :in $ ?id ?block-attrs
             :where
             [?block :block/uuid ?id]]
           db
           block-uuid
           block-attrs)
          first
          flatten-tree
          (->> (map #(db-content/update-block-content repo db % (:db/id %))))))

(defn whiteboard-page?
  "Given a page name or a page object, check if it is a whiteboard page"
  [db page]
  (cond
    (string? page)
    (let [page (d/entity db [:block/name (common-util/page-name-sanity-lc page)])]
      (or
       (contains? (set (:block/type page)) "whiteboard")
       (when-let [file (:block/file page)]
         (when-let [path (:file/path (d/entity db (:db/id file)))]
           (common-config/whiteboard? path)))))

    (seq page)
    (contains? (set (:block/type page)) "whiteboard")

    :else false))

(defn get-page-blocks
  "Return blocks of the designated page, without using cache.
   page - name / title of the page"
  [db page {:keys [pull-keys]
            :or {pull-keys '[*]}}]
  (when page
    (let [page (common-util/page-name-sanity-lc page)
          page-id (:db/id (d/entity db [:block/name page]))]
      (when page-id
        (let [datoms (d/datoms db :avet :block/page page-id)
              block-eids (mapv :e datoms)]
          (d/pull-many db pull-keys block-eids))))))

(defn get-page-blocks-count
  [db page-id]
  (count (d/datoms db :avet :block/page page-id)))

(defn get-by-parent-&-left
  [db parent-id left-id]
  (when (and parent-id left-id)
    (let [lefts (:block/_left (d/entity db left-id))]
      (some (fn [node] (when (and (= parent-id (:db/id (:block/parent node)))
                                  (not= parent-id (:db/id node)))
                         node)) lefts))))

(defn get-right-sibling
  [db db-id]
  (when-let [block (d/entity db db-id)]
    (get-by-parent-&-left db
                          (:db/id (:block/parent block))
                          db-id)))

(defn get-by-id
  [db id]
  (d/pull db '[*] id))

(def get-by-parent-id
  '[:find (pull ?a [*])
    :in $ ?id
    :where
    [?a :block/parent ?id]])

(defn hidden-page?
  [page]
  (when page
    (if (string? page)
      (and (string/starts-with? page "$$$")
           (common-util/uuid-string? (common-util/safe-subs page 3)))
      (contains? (set (:block/type page)) "hidden"))))

(defn get-pages
  [db]
  (->> (d/q
        '[:find ?page-original-name
          :where
          [?page :block/name ?page-name]
          [(get-else $ ?page :block/original-name ?page-name) ?page-original-name]]
         db)
       (map first)
       (remove hidden-page?)))

(defn page-exists?
  "Whether a page exists."
  [db page-name]
  (when page-name
    (d/entity db [:block/name (common-util/page-name-sanity-lc page-name)])))

(defn page-empty?
  "Whether a page is empty. Does it has a non-page block?
  `page-id` could be either a string or a db/id."
  [db page-id]
  (let [page-id (if (string? page-id)
                  [:block/name (common-util/page-name-sanity-lc page-id)]
                  page-id)
        page (d/entity db page-id)]
    (nil? (:block/_left page))))

(defn get-orphaned-pages
  [db {:keys [pages empty-ref-f]
       :or {empty-ref-f (fn [page] (zero? (count (:block/_refs page))))}}]
  (let [pages (->> (or pages (get-pages db))
                   (remove nil?))
        built-in-pages (set (map string/lower-case default-db/built-in-pages-names))
        orphaned-pages (->>
                        (map
                         (fn [page]
                           (let [name (common-util/page-name-sanity-lc page)]
                             (when-let [page (d/entity db [:block/name name])]
                               (and
                                (empty-ref-f page)
                                (or
                                 (page-empty? db (:db/id page))
                                 (let [first-child (first (:block/_left page))
                                       children (:block/_page page)]
                                   (and
                                    first-child
                                    (= 1 (count children))
                                    (contains? #{"" "-" "*"} (string/trim (:block/content first-child))))))
                                (not (contains? built-in-pages name))
                                (not (whiteboard-page? db page))
                                (not (:block/_namespace page))
                                (not (contains? (:block/type page) "property"))
                                 ;; a/b/c might be deleted but a/b/c/d still exists (for backward compatibility)
                                (not (and (string/includes? name "/")
                                          (not (:block/journal? page))))
                                page))))
                         pages)
                        (remove false?)
                        (remove nil?)
                        (remove hidden-page?))]
    orphaned-pages))

(defn has-children?
  [db block-id]
  (some? (:block/_parent (d/entity db [:block/uuid block-id]))))

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
       (let [children (:block/_parent block)
             all-left (set (concat (map (comp :db/id :block/left) children) [db-id]))
             all-ids (set (map :db/id children))]
         (first (set/difference all-ids all-left)))))))

(defn get-block-immediate-children
  "Doesn't include nested children."
  [db block-uuid]
  (when-let [parent (d/entity db [:block/uuid block-uuid])]
    (sort-by-left (:block/_parent parent) parent)))

(defn get-block-parents
  [db block-id {:keys [depth] :or {depth 100}}]
  (loop [block-id block-id
         parents (list)
         d 1]
    (if (> d depth)
      parents
      (if-let [parent (:block/parent (d/entity db [:block/uuid block-id]))]
        (recur (:block/uuid parent) (conj parents parent) (inc d))
        parents))))

(defn get-block-children-ids
  "Returns children UUIDs"
  [db block-uuid]
  (when-let [eid (:db/id (d/entity db [:block/uuid block-uuid]))]
    (let [seen   (volatile! [])]
      (loop [steps          100      ;check result every 100 steps
             eids-to-expand [eid]]
        (when (seq eids-to-expand)
          (let [eids-to-expand*
                (mapcat (fn [eid] (map first (d/datoms db :avet :block/parent eid))) eids-to-expand)
                uuids-to-add (remove nil? (map #(:block/uuid (d/entity db %)) eids-to-expand*))]
            (when (and (zero? steps)
                       (seq (set/intersection (set @seen) (set uuids-to-add))))
              (throw (ex-info "bad outliner data, need to re-index to fix"
                              {:seen @seen :eids-to-expand eids-to-expand})))
            (vswap! seen (partial apply conj) uuids-to-add)
            (recur (if (zero? steps) 100 (dec steps)) eids-to-expand*))))
      @seen)))

(defn get-block-children
  "Including nested children."
  [db block-uuid]
  (let [ids (get-block-children-ids db block-uuid)]
    (when (seq ids)
      (let [ids' (map (fn [id] [:block/uuid id]) ids)]
        (d/pull-many db '[*] ids')))))

(defn- get-sorted-page-block-ids
  [db page-id]
  (let [root (d/entity db page-id)]
    (loop [result []
           children (sort-by-left (:block/_parent root) root)]
      (if (seq children)
        (let [child (first children)]
          (recur (conj result (:db/id child))
                 (concat
                  (sort-by-left (:block/_parent child) child)
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

(defn get-prev-sibling
  [db id]
  (when-let [e (d/entity db id)]
    (let [left (:block/left e)]
      (when (not= (:db/id left) (:db/id (:block/parent e)))
        left))))

(defn last-child-block?
  "The child block could be collapsed."
  [db parent-id child-id]
  (when-let [child (d/entity db child-id)]
    (cond
      (= parent-id child-id)
      true

      (get-right-sibling db child-id)
      false

      :else
      (last-child-block? db parent-id (:db/id (:block/parent child))))))

(defn- consecutive-block?
  [db block-1 block-2]
  (let [aux-fn (fn [block-1 block-2]
                 (and (= (:block/page block-1) (:block/page block-2))
                      (or
                       ;; sibling or child
                       (= (:db/id (:block/left block-2)) (:db/id block-1))
                       (when-let [prev-sibling (get-prev-sibling db (:db/id block-2))]
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
  (d/squuid))

(defn get-tag-blocks
  [db tag-name]
  (d/q '[:find [?b ...]
         :in $ ?tag
         :where
         [?e :block/name ?tag]
         [?b :block/tags ?e]]
       db
       (common-util/page-name-sanity-lc tag-name)))

(defn get-classes-with-property
  "Get classes which have given property as a class property"
  [db property-uuid]
  (d/q
   '[:find [?b ...]
     :in $ ?property-uuid
     :where
     [?b :block/schema ?schema]
     [(get ?schema :properties) ?schema-properties*]
     [(set ?schema-properties*) ?schema-properties]
     [(contains? ?schema-properties ?property-uuid)]]
   db
   property-uuid))

(defn get-block-property-values
  "Get blocks which have this property."
  [db property-uuid]
  (d/q
   '[:find ?b ?v
     :in $ ?property-uuid
     :where
     [?b :block/properties ?p]
     [(get ?p ?property-uuid) ?v]
     [(some? ?v)]]
   db
   property-uuid))

(defn get-alias-source-page
  "return the source page (page-name) of an alias"
  [db alias]
  (let [alias (common-util/page-name-sanity-lc alias)
        pages (d/q '[:find [(pull ?p [*]) ...]
                     :in $ ?alias
                     :where
                     [?a :block/name ?alias]
                     [?p :block/alias ?a]]
                   db
                   alias)]
    ;; may be a case that a user added same alias into multiple pages.
      ;; only return the first result for idiot-proof
    (when (seq pages)
      (first pages))))

(defn get-page-file
  [db page-name]
  (some-> (or (d/entity db [:block/name page-name])
              (d/entity db [:block/original-name page-name]))
          :block/file))

(defn get-namespace-pages
  "Accepts both sanitized and unsanitized namespaces"
  [db namespace {:keys [db-graph?]}]
  (assert (string? namespace))
  (let [namespace (common-util/page-name-sanity-lc namespace)
        pull-attrs  (cond-> [:db/id :block/name :block/original-name :block/namespace]
                      (not db-graph?)
                      (conj {:block/file [:db/id :file/path]}))]
    (d/q
     [:find [(list 'pull '?c pull-attrs) '...]
      :in '$ '% '?namespace
      :where
      ['?p :block/name '?namespace]
      (list 'namespace '?p '?c)]
     db
     (:namespace rules/rules)
     namespace)))

(defn get-pages-by-name-partition
  [db partition]
  (when-not (string/blank? partition)
    (let [partition (common-util/page-name-sanity-lc (string/trim partition))
          ids (->> (d/datoms db :aevt :block/name)
                   (filter (fn [datom]
                             (let [page (:v datom)]
                               (string/includes? page partition))))
                   (map :e))]
      (when (seq ids)
        (d/pull-many db
                     '[:db/id :block/name :block/original-name]
                     ids)))))

(defn get-page-alias
  [db page-id]
  (->>
   (d/q
    '[:find [?e ...]
      :in $ ?page %
      :where
      (alias ?page ?e)]
    db
    page-id
    (:alias rules/rules))
   distinct))

(defn get-page-refs
  [db id]
  (let [alias (->> (get-page-alias db id)
                   (cons id)
                   distinct)
        refs (->> (mapcat (fn [id] (:block/_path-refs (d/entity db id))) alias)
                  distinct)]
    (when (seq refs)
      (d/pull-many db '[*] (map :db/id refs)))))

(defn get-block-refs
  [db id]
  (let [block (d/entity db id)]
    (if (:block/name block)
      (get-page-refs db id)
      (let [refs (:block/_refs (d/entity db id))]
        (when (seq refs)
          (d/pull-many db '[*] (map :db/id refs)))))))

(defn get-block-refs-count
  [db id]
  (some-> (d/entity db id)
          :block/_refs
          count))

(defn get-page-unlinked-refs
  "Get unlinked refs from search result"
  [db page-id search-result-eids]
  (let [alias (->> (get-page-alias db page-id)
                   (cons page-id)
                   set)
        eids (remove
              (fn [eid]
                (when-let [e (d/entity db eid)]
                  (or (some alias (map :db/id (:block/refs e)))
                      (:block/link e)
                      (nil? (:block/content e)))))
              search-result-eids)]
    (when (seq eids)
      (d/pull-many db '[*] eids))))

(comment
  (defn db-based-graph?
    "Whether the current graph is db-only"
    [db]
    (= "db" (:db/type (d/entity db :db/type)))))
