(ns logseq.outliner.core
  "Provides the primary outliner operations and fns"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de :refer [Entity]]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.order :as db-order]
            [logseq.db.file-based.schema :as file-schema]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.db :as gp-db]
            [logseq.graph-parser.property :as gp-property]
            [logseq.outliner.batch-tx :include-macros true :as batch-tx]
            [logseq.outliner.datascript :as ds]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [logseq.outliner.tree :as otree]
            [logseq.outliner.validate :as outliner-validate]
            [malli.core :as m]
            [malli.util :as mu]))

;; TODO: remove `repo` usage, use db to check `entity-plus/db-based-graph?`

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
  [db {db-id :db/id} txs-state old-refs new-refs {:keys [db-graph?]}]
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
                                                       :built-in-pages-names
                                                       (if db-graph?
                                                         sqlite-create-graph/built-in-pages-names
                                                         gp-db/built-in-pages-names)
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
  [txs-state block-entity m]
  (when-let [e (:block/page block-entity)]
    (let [m' (cond-> {:db/id (:db/id e)
                      :block/updated-at (common-util/time-ms)}
               (not (:block/created-at e))
               (assoc :block/created-at (common-util/time-ms)))
          txs (if (or (:block/pre-block? block-entity)
                      (:block/pre-block? m))
                (let [properties (:block/properties m)
                      alias (set (:alias properties))
                      tags (set (:tags properties))
                      alias (map (fn [p] {:block/name (common-util/page-name-sanity-lc p)}) alias)
                      tags (map (fn [p] {:block/name (common-util/page-name-sanity-lc p)}) tags)
                      deleteable-page-attributes {:block/alias alias
                                                  :block/tags tags
                                                  :block/properties properties
                                                  :block/properties-text-values (:block/properties-text-values m)}
                            ;; Retract page attributes to allow for deletion of page attributes
                      page-retractions
                      (mapv #(vector :db/retract (:db/id e) %) (keys deleteable-page-attributes))]
                  (conj page-retractions (merge m' deleteable-page-attributes)))
                [m'])]
      (swap! txs-state into txs))))

(defn- remove-orphaned-refs-when-save
  [db txs-state block-entity m {:keys [db-graph?] :as opts}]
  (let [remove-self-page #(remove (fn [b]
                                    (= (:db/id b) (:db/id (:block/page block-entity)))) %)
        ;; only provide content based refs for db graphs instead of removing
        ;; as calculating all non-content refs is more complex
        old-refs (if db-graph?
                   (let [content-refs (set (outliner-pipeline/block-content-refs db block-entity))]
                     (filter #(contains? content-refs (:db/id %)) (:block/refs block-entity)))
                   (remove-self-page (:block/refs block-entity)))
        new-refs (remove-self-page (:block/refs m))]
    (remove-orphaned-page-refs! db block-entity txs-state old-refs new-refs opts)))

(defn- get-last-child-or-self
  [db block]
  (let [last-child (some->> (ldb/get-block-last-direct-child-id db (:db/id block) true)
                            (d/entity db))
        target (or last-child block)]
    [target (some? last-child)]))

(declare move-blocks)

(defn- file-rebuild-block-refs
  [repo db date-formatter {:block/keys [properties] :as block}]
  (let [property-key-refs (->> (keys properties)
                               (keep (fn [property-id]
                                       (:block/uuid (ldb/get-page db (name property-id))))))
        property-value-refs (->> (vals properties)
                                 (mapcat (fn [v]
                                           (cond
                                             (and (coll? v) (uuid? (first v)))
                                             v

                                             (uuid? v)
                                             (when-let [_entity (d/entity db [:block/uuid v])]
                                               [v])

                                             (and (coll? v) (string? (first v)))
                                             (mapcat #(gp-block/extract-refs-from-text repo db % date-formatter) v)

                                             (string? v)
                                             (gp-block/extract-refs-from-text repo db v date-formatter)

                                             :else
                                             nil))))
        property-refs (->> (concat property-key-refs property-value-refs)
                           (map (fn [id-or-map] (if (uuid? id-or-map) {:block/uuid id-or-map} id-or-map)))
                           (remove (fn [b] (nil? (d/entity db [:block/uuid (:block/uuid b)])))))
        content-refs (when-let [content (:block/title block)]
                       (let [format (or (:block/format block) :markdown)
                             content' (str (common-config/get-block-pattern format) " " content)]
                         (gp-block/extract-refs-from-text repo db content' date-formatter)))]
    (concat property-refs content-refs)))

(defn ^:api rebuild-block-refs
  [repo db date-formatter block]
  (if (sqlite-util/db-based-graph? repo)
    (outliner-pipeline/db-rebuild-block-refs db block)
    (file-rebuild-block-refs repo db date-formatter block)))

(defn- fix-tag-ids
  "Fix or remove tags related when entered via `Escape`"
  [m db {:keys [db-graph?]}]
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

                    db-graph?
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
  (-save [this *txs-state db repo _date-formatter {:keys [retract-attributes? retract-attributes outliner-op]
                                                   :or {retract-attributes? true}}]
    (assert (ds/outliner-txs-state? *txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [db-based? (sqlite-util/db-based-graph? repo)
          data (if (de/entity? this)
                 (assoc (.-kv ^js this) :db/id (:db/id this))
                 this)
          data' (if db-based?
                  (->> (dissoc data :block/properties)
                       (remove-disallowed-inline-classes db))
                  data)
          collapse-or-expand? (= outliner-op :collapse-expand-blocks)
          m* (cond->
              (-> data'
                  (dissoc :block/children :block/meta :block/unordered
                          :block.temp/ast-title :block.temp/ast-body :block/level :block.temp/load-status
                          :block.temp/has-children?)
                  (fix-tag-ids db {:db-graph? db-based?}))
               (not collapse-or-expand?)
               block-with-updated-at)
          db-id (:db/id this)
          block-uuid (:block/uuid this)
          eid (or db-id (when block-uuid [:block/uuid block-uuid]))
          block-entity (d/entity db eid)
          page? (ldb/page? block-entity)
          m* (if (and db-based? (:block/title m*)
                      (not (:logseq.property.node/display-type block-entity)))
               (update m* :block/title common-util/clear-markdown-heading)
               m*)
          block-title (:block/title m*)
          page-title-changed? (and page? block-title
                                   (not= block-title (:block/title block-entity)))
          _ (when (and db-based? page? block-title)
              (outliner-validate/validate-page-title-characters block-title {:node m*}))
          m* (if (and db-based? page-title-changed?)
               (let [_ (outliner-validate/validate-page-title (:block/title m*) {:node m*})
                     page-name (common-util/page-name-sanity-lc (:block/title m*))]
                 (assoc m* :block/name page-name))
               m*)
          _ (when (and db-based?
                       ;; page or object changed?
                       (or (ldb/page? block-entity) (ldb/object? block-entity))
                       (:block/title m*)
                       (not= (:block/title m*) (:block/title block-entity)))
              (outliner-validate/validate-block-title db (:block/title m*) block-entity))
          m (cond-> m*
              db-based?
              (dissoc :block/format :block/pre-block? :block/priority :block/marker :block/properties-order))]
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
                                    (if db-based?
                                      db-schema/retract-attributes
                                      file-schema/retract-attributes)
                                    retract-attributes)]
            (swap! *txs-state (fn [txs]
                                (vec
                                 (concat txs
                                         (map (fn [attribute]
                                                [:db/retract eid attribute])
                                              retract-attributes)))))))

        ;; Update block's page attributes
        (when-not collapse-or-expand?
          (update-page-when-save-block *txs-state block-entity m))
        ;; Remove orphaned refs from block
        (when (and (:block/title m) (not= (:block/title m) (:block/title block-entity)))
          (remove-orphaned-refs-when-save db *txs-state block-entity m {:db-graph? db-based?})))

      ;; handle others txs
      (let [other-tx (:db/other-tx m)]
        (when (seq other-tx)
          (swap! *txs-state (fn [txs]
                              (vec (concat txs other-tx)))))
        (swap! *txs-state conj
               (dissoc m :db/other-tx)))

      (when (and db-based? (:block/tags block-entity) block-entity)
        (let [;; delete tags when title changed
              tx-data (remove-tags-when-title-changed block-entity (:block/title m))]
          (when (seq tx-data)
            (swap! *txs-state (fn [txs] (concat txs tx-data))))))

      (when db-based?
        (let [tx-data (add-missing-tag-idents db (:block/tags m))]
          (when (seq tx-data)
            (swap! *txs-state (fn [txs] (concat txs tx-data))))))

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
        (let [ids (cons (:db/id this) (ldb/get-block-full-children-ids db block-id))
              txs (map (fn [id] [:db.fn/retractEntity id]) ids)
              page-tx (let [block (d/entity db [:block/uuid block-id])]
                        (when (:block/pre-block? block)
                          (when-let [id (:db/id (:block/page block))]
                            [[:db/retract id :block/properties]
                             [:db/retract id :block/properties-order]
                             [:db/retract id :block/properties-text-values]
                             [:db/retract id :block/alias]
                             [:db/retract id :block/tags]])))]
          (swap! *txs-state concat txs page-tx)
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
  [db blocks replace-empty-target? target-block]
  (->> blocks
       (map-indexed
        (fn [idx block]
          (let [replacing-block? (and replace-empty-target? (zero? idx))
                db-id (or (when (:block.temp/use-old-db-id? block)
                            (:db/id block))
                          (dec (- idx)))]
            (if replacing-block?
              (if (seq (:block/_parent target-block)) ; target-block has children
                              ;; update block properties
                [(assoc block
                        :db/id (:db/id target-block)
                        :block/uuid (:block/uuid target-block))]
                (let [old-property-values (d/q
                                           '[:find ?b ?a
                                             :in $ ?v
                                             :where
                                             [?b ?a ?v]
                                             [?v :block/uuid]]
                                           db
                                           (:db/id target-block))
                      from-property (:logseq.property/created-from-property target-block)]
                  (concat
                   [[:db/retractEntity (:db/id target-block)] ; retract target-block first
                    (cond-> (assoc block :db/id db-id)
                      from-property
                      (assoc :logseq.property/created-from-property (:db/id from-property)))]
                   (map (fn [[b a]]
                          [:db/add b a db-id])
                        old-property-values))))
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
  [repo db date-formatter block opts]
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
    (otree/-save block' *txs-state db repo date-formatter opts)
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
  [repo blocks target-block sibling?]
  (let [target-block (if sibling? target-block (when target-block (ldb/get-down target-block)))
        list-type-fn (fn [block]
                       (if (sqlite-util/db-based-graph? repo)
                         ;; Get raw id since insert-blocks doesn't auto-handle raw property values
                         (:db/id (:logseq.property/order-list-type block))
                         (get (:block/properties block) :logseq.order-list-type)))
        db-based? (sqlite-util/db-based-graph? repo)]
    (if-let [list-type (and target-block (list-type-fn target-block))]
      (mapv
       (fn [{:block/keys [title format] :as block}]
         (let [list?' (and (some? (:block/uuid block))
                           (nil? (list-type-fn block)))]
           (cond-> block
             list?'
             ((fn [b]
                (if db-based?
                  (assoc b :logseq.property/order-list-type list-type)
                  (update b :block/properties assoc :logseq.order-list-type list-type))))

             (not db-based?)
             (assoc :block/title (gp-property/insert-property repo format title :logseq.order-list-type list-type)))))
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
  (let [db-based? (entity-plus/db-based-graph? db)
        block-ids (set (map :block/uuid blocks))
        target-page (get-target-block-page target-block sibling?)
        orders (get-block-orders blocks target-block sibling? keep-block-order?)]
    (map-indexed (fn [idx {:block/keys [parent] :as block}]
                   (when-let [uuid' (get uuids (:block/uuid block))]
                     (let [block (if db-based? (remove-disallowed-inline-classes db block) block)
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
        uuids (if (and (not keep-uuid?) replace-empty-target?)
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
  [db blocks target-block {:keys [outliner-op bottom? top? indent? sibling? up?]}]
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

                               bottom?
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
  [repo db blocks target-block {:keys [_sibling? keep-uuid? keep-block-order?
                                       outliner-op replace-empty-target? update-timestamps?
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
                                                    (when (contains? #{:insert-template-blocks :paste} outliner-op)
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
                                     (> (count blocks) 1)))
        db-based? (sqlite-util/db-based-graph? repo)]
    (when (seq blocks)
      (let [blocks' (let [blocks' (blocks-with-level blocks)]
                      (cond->> (blocks-with-ordered-list-props repo blocks' target-block sibling?)
                        update-timestamps?
                        (mapv #(dissoc % :block/created-at :block/updated-at))
                        true
                        (mapv block-with-timestamps)
                        db-based?
                        (mapv #(-> % (dissoc :block/properties)))))
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
          (let [tx (assign-temp-id db blocks-tx replace-empty-target? target-block)
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
                            (if (de/entity? f)
                              (if-let [id (id->new-uuid (:db/id f))]
                                [:block/uuid id]
                                (:db/id f))
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
        block (d/entity db (:db/id block))]
    (if (or
         ;; target-block doesn't have parent
         (and sibling? (nil? (:block/parent target-block)))
         ;; move page to be a child of block
         (and (not sibling?)
              (not (ldb/page? target-block))
              (ldb/page? block)))
      (throw (ex-info "not-allowed-move-block-page" {}))
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
                               (let [children-ids (ldb/get-block-full-children-ids db (:block/uuid block))]
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
  [_repo conn blocks target-block {:keys [_sibling? _top? _bottom? _up? outliner-op _indent?]
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
  [repo conn blocks up?]
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
          (move-blocks repo conn top-level-blocks left-left (merge opts {:sibling? sibling?
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
          (move-blocks repo conn blocks right (merge opts {:sibling? sibling?
                                                           :up? up?})))))))

(defn- ^:large-vars/cleanup-todo indent-outdent-blocks
  "Indent or outdent `blocks`."
  [repo conn blocks indent? & {:keys [parent-original logical-outdenting?]}]
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
                        result (move-blocks repo conn blocks' last-direct-child (merge opts {:sibling? true
                                                                                             :indent? true}))
                        ;; expand `left` if it's collapsed
                        collapsed-tx (when (:block/collapsed? left)
                                       {:tx-data [{:db/id (:db/id left)
                                                   :block/collapsed? false}]})]
                    (concat-tx-fn result collapsed-tx))
                  (move-blocks repo conn blocks' left (merge opts {:sibling? false
                                                                   :indent? true}))))))
          (if parent-original
            (let [blocks' (take-while (fn [b]
                                        (not= (:db/id (:block/parent b))
                                              (:db/id (:block/parent parent))))
                                      top-level-blocks)]
              (move-blocks repo conn blocks' parent-original (merge opts {:outliner-op :indent-outdent-blocks
                                                                          :sibling? true
                                                                          :indent? false})))

            (when parent
              (let [blocks' (take-while (fn [b]
                                          (not= (:db/id (:block/parent b))
                                                (:db/id (:block/parent parent))))
                                        top-level-blocks)
                    result (move-blocks repo conn blocks' parent (merge opts {:sibling? true}))]
                (if logical-outdenting?
                  result
                  ;; direct outdenting (default behavior)
                  (let [last-top-block (d/entity db (:db/id (last blocks')))
                        right-siblings (get-right-siblings last-top-block)]
                    (if (seq right-siblings)
                      (if-let [last-direct-child-id (ldb/get-block-last-direct-child-id db (:db/id last-top-block))]
                        (move-blocks repo conn right-siblings (d/entity db last-direct-child-id) (merge opts {:sibling? true}))
                        (move-blocks repo conn right-siblings last-top-block (merge opts {:sibling? false})))
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
          (ldb/transact! (second args) (:tx-data result) tx-meta)))
      result)
    (catch :default e
      (when-not (= "not-allowed-move-block-page" (ex-message e))
        (throw e)))))

(let [f (fn [repo conn date-formatter block opts]
          (save-block repo @conn date-formatter block opts))]
  (defn save-block!
    [repo conn date-formatter block & {:as opts}]
    (op-transact! :save-block f repo conn date-formatter block opts)))

(let [f (fn [repo conn blocks target-block opts]
          (insert-blocks repo @conn blocks target-block opts))]
  (defn insert-blocks!
    [repo conn blocks target-block opts]
    (op-transact! :insert-blocks f repo conn blocks target-block
                  (if (:outliner-op opts)
                    opts
                    (assoc opts :outliner-op :insert-blocks)))))

(let [f (fn [_repo conn blocks _opts]
          (delete-blocks @conn blocks))]
  (defn delete-blocks!
    [repo conn _date-formatter blocks opts]
    (op-transact! :delete-blocks f repo conn blocks opts)))

(defn move-blocks!
  [repo conn blocks target-block opts]
  (op-transact! :move-blocks move-blocks repo conn blocks target-block
                (if (:outliner-op opts)
                  opts
                  (assoc opts :outliner-op :move-blocks))))

(defn move-blocks-up-down!
  [repo conn blocks up?]
  (op-transact! :move-blocks-up-down move-blocks-up-down repo conn blocks up?))

(defn indent-outdent-blocks!
  [repo conn blocks indent? & {:as opts}]
  (op-transact! :indent-outdent-blocks indent-outdent-blocks repo conn blocks indent? opts))
