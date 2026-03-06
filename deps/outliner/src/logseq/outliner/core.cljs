(ns logseq.outliner.core
  "Provides the primary outliner operations and fns"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de :refer [Entity]]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.outliner.batch-tx :include-macros true :as batch-tx]
            [logseq.outliner.datascript :as ds]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [logseq.outliner.tree :as otree]
            [logseq.outliner.validate :as outliner-validate]
            [malli.core :as m]
            [malli.util :as mu]))

(def ^:private block-map
  (mu/optional-keys
   [:map
    [:db/id :int]
    ;; FIXME: tests use ints when they should use uuids
    [:block/uuid [:or :uuid :int]]
    [:block/order :string]
    [:block/parent :map]
    [:block/page :map]]))

(def ^:private block-map-or-entity
  [:or [:fn de/entity?] block-map])

(defn ^:api block-with-timestamps
  [block]
  (let [updated-at (common-util/time-ms)
        block (cond->
               (assoc block :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn ^:api block-with-updated-at
  [block]
  (let [updated-at (common-util/time-ms)]
    (assoc block :block/updated-at updated-at)))

(defn- filter-top-level-blocks
  [db blocks]
  (let [parent-ids (set/intersection (set (map (comp :db/id :block/parent) blocks))
                                     (set (map :db/id blocks)))]
    (->> blocks
         (remove (fn [e] (contains? parent-ids (:db/id (:block/parent e)))))
         (map (fn [block]
                (if (de/entity? block) block (d/entity db (:db/id block))))))))

(defn- remove-orphaned-page-refs!
  [db {db-id :db/id} txs-state old-refs new-refs]
  (when (not= old-refs new-refs)
    (let [new-refs (set (map (fn [ref]
                               (or (:block/name ref)
                                   (and (:db/id ref)
                                        (:block/name (d/entity db (:db/id ref)))))) new-refs))
          old-pages (->> (keep :db/id old-refs)
                         (d/pull-many db '[*])
                         (remove (fn [e] (contains? new-refs (:block/name e))))
                         (map :block/name)
                         (remove nil?))
          orphaned-pages (when (seq old-pages)
                           (ldb/get-orphaned-pages db {:pages old-pages
                                                       :built-in-pages-names sqlite-create-graph/built-in-pages-names
                                                       :empty-ref-f (fn [page]
                                                                      (let [refs (:block/_refs page)]
                                                                        (and (or (zero? (count refs))
                                                                                 (= #{db-id} (set (map :db/id refs))))
                                                                             (not (ldb/class? page))
                                                                             (not (ldb/property? page)))))}))]
      (when (seq orphaned-pages)
        (let [tx (mapv (fn [page] [:db/retractEntity (:db/id page)]) orphaned-pages)]
          (swap! txs-state (fn [state] (vec (concat state tx)))))))))

(defn- update-page-when-save-block
  [txs-state block-entity]
  (when-let [e (:block/page block-entity)]
    (let [m' (cond-> {:db/id (:db/id e)
                      :block/updated-at (common-util/time-ms)}
               (not (:block/created-at e))
               (assoc :block/created-at (common-util/time-ms)))
          txs [m']]
      (swap! txs-state into txs))))

(defn- remove-orphaned-refs-when-save
  [db txs-state block-entity m]
  (let [remove-self-page #(remove (fn [b]
                                    (= (:db/id b) (:db/id (:block/page block-entity)))) %)
        ;; only provide content based refs for db graphs instead of removing
        ;; as calculating all non-content refs is more complex
        old-refs (let [content-refs (set (outliner-pipeline/block-content-refs db block-entity))]
                   (filter #(contains? content-refs (:db/id %)) (:block/refs block-entity)))
        new-refs (remove-self-page (:block/refs m))]
    (remove-orphaned-page-refs! db block-entity txs-state old-refs new-refs)))

(defn- get-last-child-or-self
  [db block]
  (let [last-child (some->> (ldb/get-block-last-direct-child-id db (:db/id block) true)
                            (d/entity db))
        target (or last-child block)]
    [target (some? last-child)]))

(declare move-blocks)

(defn ^:api rebuild-block-refs
  [db block]
  (outliner-pipeline/db-rebuild-block-refs db block))

(defn- fix-tag-ids
  "Fix or remove tags related when entered via `Escape`"
  [m db]
  (let [refs (set (keep :block/name (seq (:block/refs m))))
        tags (seq (:block/tags m))]
    (if (and (seq refs) tags)
      (update m :block/tags
              (fn [tags]
                (let [tags (map (fn [tag] (or (and (:db/id tag)
                                                   (let [e (d/entity db (:db/id tag))]
                                                     (select-keys e [:db/id :block/uuid :block/title :block/name])))
                                              tag))
                                tags)]
                  (cond->>
                   ;; Update :block/tag to reference ids from :block/refs
                   (map (fn [tag]
                          (if (contains? refs (:block/name tag))
                            (assoc tag :block/uuid
                                   (:block/uuid
                                    (first (filter (fn [r] (= (:block/name tag)
                                                              (:block/name r)))
                                                   (:block/refs m)))))
                            tag))
                        tags)

                    true
                    ;; Remove tags changing case with `Escape`
                    ((fn [tags']
                       (let [ref-titles (->> (map :block/title (:block/refs m))
                                             (remove nil?)
                                             set)
                             lc-ref-titles (set (map string/lower-case ref-titles))]
                         (remove (fn [tag]
                                   (when-let [title (:block/title tag)]
                                     (and (not (contains? ref-titles title))
                                          (contains? lc-ref-titles (string/lower-case title)))))
                                 tags'))))))))
      m)))

(defn- remove-tags-when-title-changed
  [block new-content]
  (when (and (:block/raw-title block) new-content)
    (->> (:block/tags block)
         (filter (fn [tag]
                   (and (ldb/inline-tag? (:block/raw-title block) tag)
                        (not (ldb/inline-tag? new-content tag)))))
         (map (fn [tag]
                [:db/retract (:db/id block) :block/tags (:db/id tag)])))))

(defn- add-missing-tag-idents
  [db tags]
  (mapcat
   (fn [t]
     (when (and (not (:db/id t)) (not (:db/ident t)) (:block/uuid t)) ; new tag without db/ident
       (let [eid [:block/uuid (:block/uuid t)]]
         [[:db/add eid :db/ident (db-class/create-user-class-ident-from-name db (:block/title t))]
          [:db/add eid :logseq.property.class/extends :logseq.class/Root]
          [:db/retract eid :block/tags :logseq.class/Page]])))
   tags))

(defn- inline-tag-disallowed?
  [db t]
  ;; both disallowed tags and built-in pages shouldn't be used as inline tags
  (let [disallowed-idents (into db-class/disallowed-inline-tags
                                #{:logseq.property/query :logseq.property/asset})]
    (and (map? t)
         (or
          (contains?
           disallowed-idents
           (or (:db/ident t)
               (when-let [id (:block/uuid t)]
                 (:db/ident (d/entity db [:block/uuid id])))))
          (contains?
           sqlite-create-graph/built-in-pages-names
           (or (:block/title t)
               (when-let [id (:block/uuid t)]
                 (:block/title (d/entity db [:block/uuid id])))))))))

(defn- remove-disallowed-inline-classes
  [db {:block/keys [tags] :as block}]
  (if (or (ldb/page? (d/entity db (:db/id block))) (:block/name block))
    block
    (let [tags' (cond
                  (or (integer? tags)
                      (qualified-keyword? tags)
                      (and (vector? tags)
                           (= :block/uuid (first tags))))
                  [(d/entity db tags)]
                  (every? qualified-keyword? tags)
                  (map #(d/entity db %) tags)
                  :else
                  tags)
          block (assoc block :block/tags tags')
          disallowed-tag? (fn [tag] (inline-tag-disallowed? db tag))
          disallowed-tags (filter disallowed-tag? tags')]
      (if (and (seq disallowed-tags)
               (some (fn [tag]
                       (string/includes? (:block/title block) (str "#" (page-ref/->page-ref (:block/uuid tag)))))
                     disallowed-tags))
        (-> block
            (update :block/tags
                    (fn [tags]
                      (->> (remove disallowed-tag? tags)
                           (remove nil?))))
            (update :block/refs
                    (fn [refs] (->> (remove disallowed-tag? refs)
                                    (remove nil?))))
            (update :block/title (fn [title]
                                   (reduce
                                    (fn [title tag]
                                      (-> (string/replace title
                                                          (str "#" (page-ref/->page-ref (:block/uuid tag)))
                                                          (str "#" (:block/title tag)))
                                          string/trim))
                                    title
                                    disallowed-tags))))
        block))))

(extend-type Entity
  otree/INode
  (-save [this *txs-state db {:keys [retract-attributes? retract-attributes outliner-op]
                              :or {retract-attributes? true}}]
    (assert (ds/outliner-txs-state? *txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [data (if (de/entity? this)
                 (assoc (.-kv ^js this) :db/id (:db/id this))
                 this)
          data' (remove-disallowed-inline-classes db data)
          collapse-or-expand? (= outliner-op :collapse-expand-blocks)
          m* (cond->
              (-> data'
                  (dissoc :block/children :block/meta :block/unordered
                          :block.temp/ast-title :block.temp/ast-body :block/level :block.temp/load-status
                          :block.temp/has-children?)
                  (fix-tag-ids db))
               (not collapse-or-expand?)
               block-with-updated-at)
          db-id (:db/id this)
          block-uuid (:block/uuid this)
          eid (or db-id (when block-uuid [:block/uuid block-uuid]))
          block-entity (d/entity db eid)
          page? (ldb/page? block-entity)
          m* (if (and (:block/title m*)
                      (not (:logseq.property.node/display-type block-entity)))
               (update m* :block/title common-util/clear-markdown-heading)
               m*)
          block-title (:block/title m*)
          page-title-changed? (and page? block-title
                                   (not= block-title (:block/title block-entity)))
          _ (when (and page? block-title)
              (outliner-validate/validate-page-title-characters block-title {:node m*}))
          m (if page-title-changed?
              (let [_ (outliner-validate/validate-page-title (:block/title m*) {:node m*})
                    page-name (common-util/page-name-sanity-lc (:block/title m*))]
                (assoc m* :block/name page-name))
              m*)
          _ (when (and ;; page or object changed?
                   (or (ldb/page? block-entity) (ldb/object? block-entity))
                   (:block/title m)
                   (not= (:block/title m) (:block/title block-entity)))
              (outliner-validate/validate-block-title db (:block/title m) block-entity))]
      ;; Ensure block UUID never changes
      (let [e (d/entity db db-id)]
        (when (and e block-uuid)
          (let [uuid-not-changed? (= block-uuid (:block/uuid e))]
            (when-not uuid-not-changed?
              (js/console.error "Block UUID shouldn't be changed once created"))
            (assert uuid-not-changed? "Block UUID changed"))))

      (when eid
        ;; Retract attributes to prepare for tx which rewrites block attributes
        (when (or (and retract-attributes? (:block/title m))
                  (seq retract-attributes))
          (let [retract-attributes (concat
                                    db-schema/retract-attributes
                                    retract-attributes)]
            (swap! *txs-state (fn [txs]
                                (vec
                                 (concat txs
                                         (map (fn [attribute]
                                                [:db/retract eid attribute])
                                              retract-attributes)))))))

        ;; Update block's page attributes
        (when-not collapse-or-expand?
          (update-page-when-save-block *txs-state block-entity))
        ;; Remove orphaned refs from block
        (when (and (:block/title m) (not= (:block/title m) (:block/title block-entity)))
          (remove-orphaned-refs-when-save db *txs-state block-entity m)))

      ;; handle others txs
      (let [other-tx (:db/other-tx m)]
        (when (seq other-tx)
          (swap! *txs-state (fn [txs]
                              (vec (concat txs other-tx)))))
        (swap! *txs-state conj
               (dissoc m :db/other-tx)))

      (when (and (:block/tags block-entity) block-entity)
        (let [;; delete tags when title changed
              tx-data (remove-tags-when-title-changed block-entity (:block/title m))]
          (when (seq tx-data)
            (swap! *txs-state (fn [txs] (concat txs tx-data))))))

      (let [tx-data (add-missing-tag-idents db (:block/tags m))]
        (when (seq tx-data)
          (swap! *txs-state (fn [txs] (concat txs tx-data)))))

      this))

  (-del [this *txs-state db]
    (assert (ds/outliner-txs-state? *txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [block-id (:block/uuid this)
          block (d/entity db [:block/uuid block-id])]
      (if (ldb/page? block)
        (swap! *txs-state concat [[:db/retract (:db/id block) :block/parent]
                                  [:db/retract (:db/id block) :block/order]
                                  [:db/retract (:db/id block) :block/page]])
        (let [ids (cons (:db/id this) (ldb/get-block-full-children-ids db (:db/id block)))
              txs (map (fn [id] [:db/retractEntity id]) ids)]
          (swap! *txs-state concat txs)
          block-id)))))

(defn- assoc-level-aux
  [tree-vec children-key init-level]
  (map (fn [block]
         (let [children (get block children-key)
               children' (assoc-level-aux children children-key (inc init-level))]
           (cond-> (assoc block :block/level init-level)
             (seq children')
             (assoc children-key children')))) tree-vec))

(defn- assoc-level
  [children-key tree-vec]
  (assoc-level-aux tree-vec children-key 1))

(defn- assign-temp-id
  [blocks target-block replace-empty-target?]
  (->> blocks
       (map-indexed
        (fn [idx block]
          (let [replacing-block? (and replace-empty-target? (zero? idx))
                db-id (or (when (:block.temp/use-old-db-id? block)
                            (:db/id block))
                          (dec (- idx)))]
            (if replacing-block?
              [(assoc block
                      :db/id (:db/id target-block)
                      :block/uuid (:block/uuid target-block)
                      :block/order (:block/order target-block))]
              [(assoc block :db/id db-id)]))))
       (apply concat)))

(defn- get-id
  [x]
  (cond
    (map? x)
    (:db/id x)

    (vector? x)
    (second x)

    :else
    x))

(defn- compute-block-parent
  [block parent target-block top-level? sibling? get-new-id outliner-op replace-empty-target? idx]
  (cond
    ;; replace existing block
    (and (contains? #{:paste :insert-blocks} outliner-op)
         replace-empty-target?
         (string/blank? (:block/title target-block))
         (zero? idx))
    (get-id (:block/parent target-block))

    top-level?
    (if sibling?
      (:db/id (:block/parent target-block))
      (:db/id target-block))

    :else
    (get-new-id block parent)))

;;; ### public utils

(defn tree-vec-flatten
  "Converts a `tree-vec` to blocks with `:block/level`.
  A `tree-vec` example:
  [{:id 1, :children [{:id 2,
                       :children [{:id 3}]}]}
   {:id 4, :children [{:id 5}
                      {:id 6}]}]"
  ([tree-vec]
   (tree-vec-flatten tree-vec :children))
  ([tree-vec children-key]
   (->> tree-vec
        (assoc-level children-key)
        (mapcat #(tree-seq map? children-key %))
        (map #(dissoc % :block/children)))))

(defn ^:api save-block
  "Save the `block`."
  [db block opts]
  {:pre [(map? block)]}
  (let [*txs-state (atom [])
        block' (if (de/entity? block)
                 block
                 (do
                   (assert (or (:db/id block) (:block/uuid block)) "save-block db/id not exists")
                   (when-let [eid (or (:db/id block) (when-let [id (:block/uuid block)] [:block/uuid id]))]
                     (let [ent (d/entity db eid)]
                       (assert (some? ent) "save-block entity not exists")
                       (merge ent block)))))]
    (otree/-save block' *txs-state db opts)
    {:tx-data @*txs-state}))

(defn- get-right-siblings
  "Get `node`'s right siblings."
  [node]
  (when-let [parent (:block/parent node)]
    (let [children (ldb/sort-by-order (:block/_parent parent))]
      (->> (split-with #(not= (:block/uuid node) (:block/uuid %)) children)
           last
           rest))))

(defn- blocks-with-ordered-list-props
  [blocks target-block sibling?]
  (let [target-block (if sibling? target-block (when target-block (ldb/get-down target-block)))
        list-type-fn (fn [block]
                       (:db/id (:logseq.property/order-list-type block)))]
    (if-let [list-type (and target-block (list-type-fn target-block))]
      (mapv
       (fn [block]
         (let [list?' (and (some? (:block/uuid block))
                           (nil? (list-type-fn block)))]
           (cond-> block
             list?'
             ((fn [b]
                (assoc b :logseq.property/order-list-type list-type))))))
       blocks)
      blocks)))

;;; ### insert-blocks, delete-blocks, move-blocks

(defn- get-block-orders
  [blocks target-block sibling? keep-block-order?]
  (if (and keep-block-order? (every? :block/order blocks))
    (map :block/order blocks)
    (let [target-order (:block/order target-block)
          next-sibling-order (:block/order (ldb/get-right-sibling target-block))
          first-child (ldb/get-down target-block)
          first-child-order (:block/order first-child)
          start-order (when sibling? target-order)
          end-order (if sibling? next-sibling-order first-child-order)
          orders (db-order/gen-n-keys (count blocks) start-order end-order)]
      orders)))

(defn- update-property-ref-when-paste
  [block uuids]
  (let [id-lookup (fn [v] (and (vector? v) (= :block/uuid (first v))))
        resolve-id (fn [v] [:block/uuid (get uuids (last v) (last v))])]
    (reduce-kv
     (fn [r k v]
       (let [v' (cond
                  (id-lookup v)
                  (resolve-id v)
                  (and (coll? v) (every? id-lookup v))
                  (map resolve-id v)
                  :else
                  v)]
         (assoc r k v')))
     {}
     block)))

(defn- get-target-block-page
  [target-block sibling?]
  (or
   (:db/id (:block/page target-block))
   ;; target parent is a page
   (when sibling?
     (when-let [parent (:block/parent target-block)]
       (when (ldb/page? parent)
         (:db/id parent))))

   ;; target-block is a page itself
   (:db/id target-block)))

(defn- build-insert-blocks-tx
  [db target-block blocks uuids get-new-id {:keys [sibling? outliner-op replace-empty-target? insert-template? keep-block-order?]}]
  (let [block-ids (set (map :block/uuid blocks))
        target-page (get-target-block-page target-block sibling?)
        orders (get-block-orders blocks target-block sibling? keep-block-order?)]
    (map-indexed (fn [idx {:block/keys [parent] :as block}]
                   (when-let [uuid' (get uuids (:block/uuid block))]
                     (let [block (remove-disallowed-inline-classes db block)
                           top-level? (= (:block/level block) 1)
                           parent (compute-block-parent block parent target-block top-level? sibling? get-new-id outliner-op replace-empty-target? idx)

                           order (nth orders idx)
                           _ (assert (and parent order) (str "Parent or order is nil: " {:parent parent :order order}))
                           template-ref-block-ids (when insert-template?
                                                    (when-let [block (d/entity db (:db/id block))]
                                                      (let [ref-ids (set (map :block/uuid (:block/refs block)))]
                                                        (->> (set/intersection block-ids ref-ids)
                                                             (remove #{(:block/uuid block)})))))
                           m {:db/id (:db/id block)
                              :block/uuid uuid'
                              :block/parent parent
                              :block/order order}
                           result* (->
                                    (if (de/entity? block)
                                      (assoc m :block/level (:block/level block))
                                      (merge block m))
                                    (update :block/title (fn [value]
                                                           (if (seq template-ref-block-ids)
                                                             (reduce
                                                              (fn [value id]
                                                                (string/replace value
                                                                                (page-ref/->page-ref id)
                                                                                (page-ref/->page-ref (uuids id))))
                                                              value
                                                              template-ref-block-ids)
                                                             value))))
                           result* (if (:block.temp/use-old-db-id? result*)
                                     result*
                                     (dissoc result* :db/id))
                           page? (or (ldb/page? block) (:block/name block))
                           result (cond-> result*
                                    (not page?)
                                    (assoc :block/page target-page)
                                    page?
                                    (dissoc :block/page))]
                       (update-property-ref-when-paste result uuids))))
                 blocks)))

(defn- insert-blocks-aux
  [db blocks target-block {:keys [replace-empty-target? keep-uuid?]
                           :as opts}]
  (let [block-uuids (map :block/uuid blocks)
        uuids (zipmap block-uuids
                      (if keep-uuid?
                        block-uuids
                        (repeatedly common-uuid/gen-uuid)))
        uuids (if replace-empty-target?
                (assoc uuids (:block/uuid (first blocks)) (:block/uuid target-block))
                uuids)
        id->new-uuid (->> (map (fn [block] (when-let [id (:db/id block)]
                                             [id (get uuids (:block/uuid block))])) blocks)
                          (into {}))
        get-new-id (fn [block lookup]
                     (cond
                       (or (map? lookup) (vector? lookup) (de/entity? lookup))
                       (when-let [uuid' (if (and (vector? lookup) (= (first lookup) :block/uuid))
                                          (get uuids (last lookup))
                                          (get id->new-uuid (:db/id lookup)))]
                         [:block/uuid uuid'])

                       (integer? lookup)
                       lookup

                       :else
                       (throw (js/Error. (str "[insert-blocks] illegal lookup: " lookup ", block: " block)))))
        blocks-tx (build-insert-blocks-tx db target-block blocks uuids get-new-id opts)]
    {:blocks-tx blocks-tx
     :id->new-uuid id->new-uuid}))

(defn- get-target-block
  [db blocks target-block {:keys [outliner-op bottom? top? indent? sibling? up? replace-empty-target?]}]
  (when-let [block (if (:db/id target-block)
                     (d/entity db (:db/id target-block))
                     (when (:block/uuid target-block)
                       (d/entity db [:block/uuid (:block/uuid target-block)])))]
    (let [linked (:block/link block)
          library? (ldb/library? block)
          up-down? (= outliner-op :move-blocks-up-down)
          [block sibling?] (cond
                             up-down?
                             (if sibling?
                               [block sibling?]
                               (let [target (or linked block)]
                                 (if (and up?
                                ;; target is not any parent of the first block
                                          (not= (:db/id (:block/parent (first blocks)))
                                                (:db/id target))
                                          (not= (:db/id (:block/parent
                                                         (d/entity db (:db/id (:block/parent (first blocks))))))
                                                (:db/id target)))
                                   (get-last-child-or-self db target)
                                   [target false])))

                             (and (= outliner-op :indent-outdent-blocks)
                                  (or (not indent?)
                                      (and indent? sibling?)))
                             [block sibling?]

                             (contains? #{:insert-blocks :move-blocks} outliner-op)
                             (cond
                               top?
                               [block false]

                               (and bottom? (not replace-empty-target?))
                               (if-let [last-child (last (ldb/sort-by-order (:block/_parent block)))]
                                 [last-child true]
                                 [block false])
                               :else
                               [block (if library? false sibling?)])

                             linked
                             (get-last-child-or-self db linked)

                             :else
                             [block sibling?])
          block (if (de/entity? block) block (d/entity db (:db/id block)))]
      [block sibling?])))

(defn ^:api blocks-with-level
  "Calculate `:block/level` for all the `blocks`. Blocks should be sorted already."
  [blocks]
  {:pre [(seq blocks)]}
  (let [blocks (if (sequential? blocks) blocks [blocks])
        root (assoc (first blocks) :block/level 1)]
    (loop [m [root]
           blocks (rest blocks)]
      (if (empty? blocks)
        m
        (let [block (first blocks)
              parent (:block/parent block)
              parent-level (when parent
                             (:block/level
                              (first
                               (filter (fn [x]
                                         (or
                                          (and (map? parent)
                                               (= (:db/id x) (:db/id parent)))
                                          ;; lookup
                                          (and (vector? parent)
                                               (= (:block/uuid x) (second parent))))) m))))
              level (if parent-level
                      (inc parent-level)
                      1)
              block (assoc block :block/level level)
              m' (vec (conj m block))]
          (recur m' (rest blocks)))))))

(defn ^:api ^:large-vars/cleanup-todo insert-blocks
  "Insert blocks as children (or siblings) of target-node.
  Args:
    `db`: db
    `blocks`: blocks should be sorted already.
    `target-block`: where `blocks` will be inserted.
    Options:
      `sibling?`: as siblings (true) or children (false).
      `bottom?`: inserts block to the bottom.
      `top?`: inserts block to the top.
      `keep-uuid?`: whether to replace `:block/uuid` from the parameter `blocks`.
                    For example, if `blocks` are from internal copy, the uuids
                    need to be changed, but there's no need for internal cut or drag & drop.
      `keep-block-order?`: whether to replace `:block/order` from the parameter `blocks`.
      `outliner-op`: what's the current outliner operation.
      `replace-empty-target?`: If the `target-block` is an empty block, whether
                               to replace it, it defaults to be `false`.
      `update-timestamps?`: whether to update `blocks` timestamps.
    ``"
  [db blocks target-block {:keys [_sibling? keep-uuid? keep-block-order?
                                  outliner-op outliner-real-op replace-empty-target? update-timestamps?
                                  insert-template?]
                           :as opts
                           :or {update-timestamps? true}}]
  {:pre [(seq blocks)
         (m/validate block-map-or-entity target-block)]}
  (let [blocks (cond->>
                (keep (fn [b]
                        (if-let [eid (or (:db/id b)
                                         (when-let [id (:block/uuid b)]
                                           [:block/uuid id]))]
                          (let [b' (if-let [e (if (de/entity? b) b (d/entity db eid))]
                                     (merge
                                      (into {} e)
                                      {:db/id (:db/id e)
                                       :block/title (or (:block/raw-title e) (:block/title e))}
                                      b)
                                     b)
                                dissoc-keys (concat [:block/tx-id]
                                                    (when (and (contains? #{:insert-template-blocks :paste} outliner-op)
                                                               (not (contains? #{:paste-text} outliner-real-op)))
                                                      [:block/refs]))]
                            (apply dissoc b' dissoc-keys))
                          b))
                      blocks)
                 (or (= outliner-op :paste)
                     insert-template?)
                 (remove ldb/asset?))
        [target-block sibling?] (get-target-block db blocks target-block opts)
        _ (assert (some? target-block) (str "Invalid target: " target-block))
        replace-empty-target? (if (and (some? replace-empty-target?)
                                       (:block/title target-block)
                                       (string/blank? (:block/title target-block)))
                                replace-empty-target?
                                (and sibling?
                                     (:block/title target-block)
                                     (string/blank? (:block/title target-block))
                                     (> (count blocks) 1)))]
    (when (seq blocks)
      (let [blocks' (let [blocks' (blocks-with-level blocks)]
                      (cond->> (blocks-with-ordered-list-props blocks' target-block sibling?)
                        update-timestamps?
                        (mapv #(dissoc % :block/created-at :block/updated-at))
                        true
                        (mapv block-with-timestamps)))
            insert-opts {:sibling? sibling?
                         :replace-empty-target? replace-empty-target?
                         :keep-uuid? keep-uuid?
                         :keep-block-order? keep-block-order?
                         :outliner-op outliner-op
                         :insert-template? insert-template?}
            {:keys [id->new-uuid blocks-tx]} (insert-blocks-aux db blocks' target-block insert-opts)]
        (if (some (fn [b] (or (nil? (:block/parent b)) (nil? (:block/order b)))) blocks-tx)
          (throw (ex-info "Invalid outliner data"
                          {:opts insert-opts
                           :tx (vec blocks-tx)
                           :blocks (vec blocks)
                           :target-block target-block}))
          (let [tx (assign-temp-id blocks-tx target-block replace-empty-target?)
                old-db-id-blocks (->> (filter :block.temp/use-old-db-id? tx)
                                      (map :block/uuid)
                                      (set))
                uuids-tx (->> (map :block/uuid blocks-tx)
                              (remove old-db-id-blocks)
                              (remove nil?)
                              (map (fn [uuid'] {:block/uuid uuid'})))
                from-property (:logseq.property/created-from-property target-block)
                many? (= :db.cardinality/many (:db/cardinality from-property))
                property-values-tx (when (and sibling? from-property many?)
                                     (let [top-level-blocks (filter #(= 1 (:block/level %)) blocks')]
                                       (mapcat (fn [block]
                                                 (when-let [new-id (or (id->new-uuid (:db/id block)) (:block/uuid block))]
                                                   [{:block/uuid new-id
                                                     :logseq.property/created-from-property (:db/id from-property)}
                                                    [:db/add
                                                     (:db/id (:block/parent target-block))
                                                     (:db/ident (d/entity db (:db/id from-property)))
                                                     [:block/uuid new-id]]])) top-level-blocks)))
                full-tx (common-util/concat-without-nil (if (and keep-uuid? replace-empty-target?) (rest uuids-tx) uuids-tx)
                                                        tx
                                                        property-values-tx)
                ;; Replace entities with eid because Datascript doesn't support entity transaction
                full-tx' (walk/prewalk
                          (fn [f]
                            (cond
                              (de/entity? f)
                              (if-let [id (id->new-uuid (:db/id f))]
                                [:block/uuid id]
                                (:db/id f))
                              (map? f)
                              (dissoc f :block/level)
                              :else
                              f))
                          full-tx)]
            {:tx-data full-tx'
             :blocks  tx}))))))

(defn- sort-non-consecutive-blocks
  [db blocks]
  (let [page-blocks (group-by :block/page blocks)]
    (mapcat (fn [[_page blocks]]
              (ldb/sort-page-random-blocks db blocks))
            page-blocks)))

(defn- get-top-level-blocks
  [top-level-blocks non-consecutive?]
  (let [reversed? (and (not non-consecutive?)
                       (:block/order (first top-level-blocks))
                       (:block/order (second top-level-blocks))
                       (> (compare (:block/order (first top-level-blocks))
                                   (:block/order (second top-level-blocks))) 0))]
    (if reversed? (reverse top-level-blocks) top-level-blocks)))

(defn ^:api ^:large-vars/cleanup-todo delete-blocks
  "Delete blocks from the tree."
  [db blocks]
  (let [top-level-blocks (filter-top-level-blocks db blocks)
        non-consecutive? (and (> (count top-level-blocks) 1) (seq (ldb/get-non-consecutive-blocks db top-level-blocks)))
        top-level-blocks* (get-top-level-blocks top-level-blocks non-consecutive?)
        top-level-blocks (remove :logseq.property/built-in? top-level-blocks*)
        txs-state (ds/new-outliner-txs-state)
        block-ids (map (fn [b] [:block/uuid (:block/uuid b)]) top-level-blocks)
        start-block (first top-level-blocks)
        end-block (last top-level-blocks)
        delete-one-block? (or (= 1 (count top-level-blocks)) (= start-block end-block))]

    ;; Validate before `when` since top-level-blocks will be empty when deleting one built-in block
    (when (seq (filter :logseq.property/built-in? top-level-blocks*))
      (throw (ex-info "Built-in nodes can't be deleted"
                      {:type :notification
                       :payload {:message "Built-in nodes can't be deleted"
                                 :type :error}})))
    (when (seq top-level-blocks)
      (let [from-property (:logseq.property/created-from-property start-block)
            default-value-property? (and (:logseq.property/default-value from-property)
                                         (not= (:db/id start-block)
                                               (:db/id (:logseq.property/default-value from-property)))
                                         (not (:block/closed-value-property start-block)))]
        (cond
          (and delete-one-block? default-value-property?)
          (let [datoms (d/datoms db :avet (:db/ident from-property) (:db/id start-block))
                tx-data (map (fn [d] {:db/id (:e d)
                                      (:db/ident from-property) :logseq.property/empty-placeholder}) datoms)]
            (when (seq tx-data) (swap! txs-state concat tx-data)))

          :else
          (doseq [id block-ids]
            (let [node (d/entity db id)]
              (otree/-del node txs-state db))))))
    {:tx-data @txs-state}))

(defn- move-to-original-position?
  [blocks target-block sibling? non-consecutive-blocks?]
  (let [block (first blocks)
        db (.-db target-block)]
    (and (not non-consecutive-blocks?)
         (if sibling?
           (= (:db/id (ldb/get-left-sibling block)) (:db/id target-block))
           (= (:db/id (ldb/get-first-child db (:db/id target-block))) (:db/id block))))))

(defn- move-block
  [db block target-block sibling?]
  (let [target-block (d/entity db (:db/id target-block))
        block (d/entity db (:db/id block))
        target-without-parent? (and sibling? (nil? (:block/parent target-block)))
        move-page-as-block-child? (and (not sibling?)
                                       (not (ldb/page? target-block))
                                       (ldb/page? block))]
    (if (or target-without-parent? move-page-as-block-child?)
      (throw (ex-info "not-allowed-move-block-page"
                      {:reason (if target-without-parent?
                                 :move-to-target-without-parent
                                 :move-page-to-be-child-of-block)}))
      (let [first-block-page (:db/id (:block/page block))
            target-page (get-target-block-page target-block sibling?)
            not-same-page? (not= first-block-page target-page)
            block-order (if sibling?
                          (db-order/gen-key (:block/order target-block)
                                            (:block/order (ldb/get-right-sibling target-block)))
                          (db-order/gen-key nil
                                            (:block/order (ldb/get-down target-block))))

            tx-data [(cond->
                      {:db/id (:db/id block)
                       :block/parent (if sibling?
                                       (:db/id (:block/parent target-block))
                                       (:db/id target-block))
                       :block/order block-order}
                       (not (ldb/page? block))
                       (assoc :block/page target-page))]
            children-page-tx (when (and not-same-page? (not (ldb/page? block)))
                               (let [children-ids (ldb/get-block-full-children-ids db (:db/id block))]
                                 (keep (fn [id]
                                         (let [child (d/entity db id)]
                                           (when-not (ldb/page? child)
                                             {:block/uuid (:block/uuid child)
                                              :block/page target-page}))) children-ids)))
            target-from-property (:logseq.property/created-from-property target-block)
            block-from-property (:logseq.property/created-from-property block)
            property-tx (let [retract-property-tx (when block-from-property
                                                    [[:db/retract (:db/id (:block/parent block)) (:db/ident block-from-property) (:db/id block)]
                                                     [:db/retract (:db/id block) :logseq.property/created-from-property]])
                              add-property-tx (when (and sibling? target-from-property (not block-from-property))
                                                [[:db/add (:db/id block) :logseq.property/created-from-property (:db/id target-from-property)]
                                                 [:db/add (:db/id (:block/parent target-block)) (:db/ident target-from-property) (:db/id block)]])]
                          (concat retract-property-tx add-property-tx))]
        (common-util/concat-without-nil tx-data children-page-tx property-tx)))))

(defn- move-blocks
  "Move `blocks` to `target-block` as siblings or children."
  [conn blocks target-block {:keys [_sibling? _top? _bottom? _up? outliner-op _indent?]
                             :as opts}]
  {:pre [(seq blocks)
         (m/validate block-map-or-entity target-block)]}
  (let [db @conn
        top-level-blocks (filter-top-level-blocks db blocks)
        [target-block sibling?] (get-target-block db top-level-blocks target-block opts)
        non-consecutive? (and (> (count top-level-blocks) 1) (seq (ldb/get-non-consecutive-blocks db top-level-blocks)))
        top-level-blocks (get-top-level-blocks top-level-blocks non-consecutive?)
        blocks (->> (if non-consecutive?
                      (sort-non-consecutive-blocks db top-level-blocks)
                      top-level-blocks)
                    (map (fn [block]
                           (if (de/entity? block)
                             block
                             (d/entity db (:db/id block))))))
        original-position? (move-to-original-position? blocks target-block sibling? non-consecutive?)]
    (when (and (not (contains? (set (map :db/id blocks)) (:db/id target-block)))
               (not original-position?))
      (let [parents' (->> (ldb/get-block-parents db (:block/uuid target-block) {})
                          (map :db/id)
                          (set))
            move-parents-to-child? (some parents' (map :db/id blocks))]
        (when-not move-parents-to-child?
          (batch-tx/with-batch-tx-mode conn {:outliner-op :move-blocks}
            (doseq [[idx block] (map vector (range (count blocks)) blocks)]
              (let [first-block? (zero? idx)
                    sibling? (if first-block? sibling? true)
                    target-block (if first-block? target-block
                                     (d/entity @conn (:db/id (nth blocks (dec idx)))))
                    block (d/entity @conn (:db/id block))]
                (when-not (move-to-original-position? [block] target-block sibling? false)
                  (let [tx-data (move-block @conn block target-block sibling?)]
                    ;; (prn "==>> move blocks tx:" tx-data)
                    (ldb/transact! conn tx-data {:sibling? sibling?
                                                 :outliner-op (or outliner-op :move-blocks)}))))))
          nil)))))

(defn- move-blocks-up-down
  "Move blocks up/down."
  [conn blocks up?]
  {:pre [(seq blocks) (boolean? up?)]}
  (let [db @conn
        top-level-blocks (filter-top-level-blocks db blocks)
        opts {:outliner-op :move-blocks-up-down}]
    (if up?
      (let [first-block (d/entity db (:db/id (first top-level-blocks)))
            first-block-parent (:block/parent first-block)
            first-block-left-sibling (ldb/get-left-sibling first-block)
            left-or-parent (or first-block-left-sibling first-block-parent)
            left-left (or (ldb/get-left-sibling left-or-parent)
                          first-block-parent)
            sibling? (= (:db/id (:block/parent left-left))
                        (:db/id first-block-parent))]
        (when (and left-left
                   (not= (:db/id (:block/page first-block-parent))
                         (:db/id left-left))
                   (not (and (:logseq.property/created-from-property first-block)
                             (nil? first-block-left-sibling))))
          (move-blocks conn top-level-blocks left-left (merge opts {:sibling? sibling?
                                                                    :up? up?}))))

      (let [last-top-block (last top-level-blocks)
            last-top-block-right (ldb/get-right-sibling last-top-block)
            right (or
                   last-top-block-right
                   (let [parent (:block/parent last-top-block)]
                     (ldb/get-right-sibling parent)))
            sibling? (= (:db/id (:block/parent last-top-block))
                        (:db/id (:block/parent right)))]
        (when (and right
                   (not (and (:logseq.property/created-from-property last-top-block)
                             (nil? last-top-block-right))))
          (move-blocks conn blocks right (merge opts {:sibling? sibling?
                                                      :up? up?})))))))

(defn- ^:large-vars/cleanup-todo indent-outdent-blocks
  "Indent or outdent `blocks`."
  [conn blocks indent? & {:keys [parent-original logical-outdenting?]}]
  {:pre [(seq blocks) (boolean? indent?)]}
  (let [db @conn
        top-level-blocks (filter-top-level-blocks db blocks)
        non-consecutive? (and (> (count top-level-blocks) 1) (seq (ldb/get-non-consecutive-blocks @conn top-level-blocks)))
        top-level-blocks (get-top-level-blocks top-level-blocks non-consecutive?)]
    (when-not (or non-consecutive?
                  (and (not indent?)
                       ;; property value blocks shouldn't be outdented
                       (some :logseq.property/created-from-property top-level-blocks)))
      (let [first-block (d/entity db (:db/id (first top-level-blocks)))
            left (ldb/get-left-sibling first-block)
            parent (:block/parent first-block)
            concat-tx-fn (fn [& results]
                           {:tx-data (->> (map :tx-data results)
                                          (apply common-util/concat-without-nil))
                            :tx-meta (:tx-meta (first results))})
            opts {:outliner-op :indent-outdent-blocks}]
        (if indent?
          (when left
            (let [last-direct-child-id (ldb/get-block-last-direct-child-id db (:db/id left))
                  blocks' (drop-while (fn [b]
                                        (= (:db/id (:block/parent b))
                                           (:db/id left)))
                                      top-level-blocks)]
              (when (seq blocks')
                (if last-direct-child-id
                  (let [last-direct-child (d/entity db last-direct-child-id)
                        result (move-blocks conn blocks' last-direct-child (merge opts {:sibling? true
                                                                                        :indent? true}))
                        ;; expand `left` if it's collapsed
                        collapsed-tx (when (:block/collapsed? left)
                                       {:tx-data [{:db/id (:db/id left)
                                                   :block/collapsed? false}]})]
                    (concat-tx-fn result collapsed-tx))
                  (move-blocks conn blocks' left (merge opts {:sibling? false
                                                              :indent? true}))))))
          (if parent-original
            (let [blocks' (take-while (fn [b]
                                        (not= (:db/id (:block/parent b))
                                              (:db/id (:block/parent parent))))
                                      top-level-blocks)]
              (move-blocks conn blocks' parent-original (merge opts {:outliner-op :indent-outdent-blocks
                                                                     :sibling? true
                                                                     :indent? false})))

            (when parent
              (let [blocks' (take-while (fn [b]
                                          (not= (:db/id (:block/parent b))
                                                (:db/id (:block/parent parent))))
                                        top-level-blocks)
                    result (move-blocks conn blocks' parent (merge opts {:sibling? true}))]
                (if logical-outdenting?
                  result
                  ;; direct outdenting (default behavior)
                  (let [last-top-block (d/entity db (:db/id (last blocks')))
                        right-siblings (get-right-siblings last-top-block)]
                    (if (seq right-siblings)
                      (if-let [last-direct-child-id (ldb/get-block-last-direct-child-id db (:db/id last-top-block))]
                        (move-blocks conn right-siblings (d/entity db last-direct-child-id) (merge opts {:sibling? true}))
                        (move-blocks conn right-siblings last-top-block (merge opts {:sibling? false})))
                      result)))))))))))

;;; ### write-operations have side-effects (do transactions) ;;;;;;;;;;;;;;;;

(defn- op-transact!
  [outliner-op f & args]
  {:pre [(fn? f)]}
  (try
    (let [result (apply f args)]
      (when result
        (let [tx-meta (assoc (:tx-meta result)
                             :outliner-op outliner-op)]
          (ldb/transact! (first args) (:tx-data result) tx-meta)))
      result)
    (catch :default e
      (js/console.error e)
      (when-not (= "not-allowed-move-block-page" (ex-message e))
        (throw e)))))

(let [f (fn [conn block opts]
          (save-block @conn block opts))]
  (defn save-block!
    [conn block & {:as opts}]
    (op-transact! :save-block f conn block
                  (if (:outliner-op opts)
                    opts
                    (assoc opts :outliner-op :save-block)))))

(let [f (fn [conn blocks target-block opts]
          (insert-blocks @conn blocks target-block opts))]
  (defn insert-blocks!
    [conn blocks target-block opts]
    (op-transact! :insert-blocks f conn blocks target-block
                  (if (:outliner-op opts)
                    opts
                    (assoc opts :outliner-op :insert-blocks)))))

(let [f (fn [conn blocks _opts]
          (delete-blocks @conn blocks))]
  (defn delete-blocks!
    [conn blocks opts]
    (op-transact! :delete-blocks f conn blocks opts)))

(defn move-blocks!
  [conn blocks target-block opts]
  (op-transact! :move-blocks move-blocks conn blocks target-block
                (if (:outliner-op opts)
                  opts
                  (assoc opts :outliner-op :move-blocks))))

(defn move-blocks-up-down!
  [conn blocks up?]
  (op-transact! :move-blocks-up-down move-blocks-up-down conn blocks up?))

(defn indent-outdent-blocks!
  [conn blocks indent? & {:as opts}]
  (op-transact! :indent-outdent-blocks indent-outdent-blocks conn blocks indent? opts))
