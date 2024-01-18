(ns frontend.worker.rtc.db-listener
  "listen datascript changes, infer operations from the db tx-report"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.data :as data]
            [clojure.set :as set]
            [datascript.core :as d]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.state :as worker-state]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.search :as search]
            [frontend.worker.util :as worker-util]
            [promesa.core :as p]
            [cljs-bean.core :as bean]))


(defn- entity-datoms=>attr->datom
  [entity-datoms]
  (reduce
   (fn [m datom]
     (let [[_e a _v t _add?] datom]
       (if-let [[_e _a _v old-t _old-add?] (get m a)]
         (if (<= old-t t)
           (assoc m a datom)
           m)
         (assoc m a datom))))
   {} entity-datoms))


(defn- diff-value-of-set-type-attr
  [db-before db-after eid attr-name]
  (let [current-value-set (set (get (d/entity db-after eid) attr-name))
        old-value-set (set (get (d/entity db-before eid) attr-name))
        add (set/difference current-value-set old-value-set)
        retract (set/difference old-value-set current-value-set)]
    (cond-> {}
      (seq add) (conj [:add add])
      (seq retract) (conj [:retract retract]))))


(defn- diff-properties-value
  [db-before db-after eid]
  (let [current-value (:block/properties (d/entity db-after eid))
        old-value (:block/properties (d/entity db-before eid))
        [only-in-current-uuids only-in-old-uuids both-uuids] (map (comp set keys) (data/diff current-value old-value))
        add-uuids only-in-current-uuids
        retract-uuids (set/difference only-in-old-uuids add-uuids both-uuids)
        update-uuids (set/intersection both-uuids only-in-old-uuids)
        add-uuids* (set/union add-uuids update-uuids)]
    (cond-> {}
      (seq add-uuids*) (conj [:add add-uuids*])
      (seq retract-uuids) (conj [:retract retract-uuids]))))

(defn- entity-datoms=>ops
  [db-before db-after entity-datoms]
  (let [attr->datom (entity-datoms=>attr->datom entity-datoms)]
    (when (seq attr->datom)
      (let [updated-key-set (set (keys attr->datom))
            e (some-> attr->datom first second first)
            {[_e _a block-uuid _t add1?] :block/uuid
             [_e _a _v _t add2?]         :block/name
             [_e _a _v _t add3?]         :block/parent
             [_e _a _v _t add4?]         :block/left
             [_e _a _v _t add5?]         :block/original-name} attr->datom
            ops (cond
                  (and (not add1?) block-uuid
                       (not add2?) (contains? updated-key-set :block/name))
                  [[:remove-page block-uuid]]

                  (and (not add1?) block-uuid)
                  [[:remove block-uuid]]

                  :else
                  (let [updated-general-attrs (seq (set/intersection
                                                    updated-key-set
                                                    #{:block/tags :block/alias :block/type :block/schema :block/content
                                                      :block/properties :block/link}))
                        ops (cond-> []
                              (or add3? add4?)
                              (conj [:move])

                              (or (and (contains? updated-key-set :block/name) add2?)
                                  (and (contains? updated-key-set :block/original-name) add5?))
                              (conj [:update-page]))
                        update-op (->> updated-general-attrs
                                       (keep
                                        (fn [attr-name]
                                          (case attr-name
                                            (:block/link :block/schema :block/content)
                                            {(keyword (name attr-name)) nil}

                                            :block/alias
                                            (let [diff-value (diff-value-of-set-type-attr db-before db-after e :block/alias)]
                                              (when (seq diff-value)
                                                (let [{:keys [add retract]} diff-value
                                                      add (keep :block/uuid (d/pull-many db-after [:block/uuid]
                                                                                         (map :db/id add)))
                                                      retract (keep :block/uuid (d/pull-many db-before [:block/uuid]
                                                                                             (map :db/id retract)))]
                                                  {:alias (cond-> {}
                                                            (seq add) (conj [:add add])
                                                            (seq retract) (conj [:retract retract]))})))

                                            :block/type
                                            (let [diff-value (diff-value-of-set-type-attr db-before db-after e :block/type)]
                                              (when (seq diff-value)
                                                {:type diff-value}))

                                            :block/tags
                                            (let [diff-value (diff-value-of-set-type-attr db-before db-after e :block/tags)]
                                              (when (seq diff-value)
                                                (let [{:keys [add retract]} diff-value
                                                      add (keep :block/uuid (d/pull-many db-after [:block/uuid]
                                                                                         (map :db/id add)))
                                                      retract (keep :block/uuid (d/pull-many db-before [:block/uuid]
                                                                                             (map :db/id retract)))]
                                                  {:tags (cond-> {}
                                                           (seq add) (conj [:add add])
                                                           (seq retract) (conj [:retract retract]))})))
                                            :block/properties
                                            (let [diff-value (diff-properties-value db-before db-after e)]
                                              (when (seq diff-value)
                                                (let [{:keys [add retract]} diff-value
                                                      add (keep :block/uuid (d/pull-many
                                                                             db-after [:block/uuid]
                                                                             (map (fn [uuid] [:block/uuid uuid]) add)))]
                                                  {:properties (cond-> {}
                                                                 (seq add) (conj [:add add])
                                                                 (seq retract) (conj [:retract retract]))})))
                                            ;; else
                                            nil)))
                                       (apply merge))]
                    (cond-> ops (seq update-op) (conj [:update update-op]))))
            ops* (keep (fn [op]
                         (let [block-uuid (some-> (d/entity db-after e) :block/uuid str)]
                           (case (first op)
                             :move        (when block-uuid ["move" {:block-uuid block-uuid}])
                             :update      (when block-uuid
                                            ["update" (cond-> {:block-uuid block-uuid}
                                                        (second op) (conj [:updated-attrs (second op)]))])
                             :update-page (when block-uuid ["update-page" {:block-uuid block-uuid}])
                             :remove      ["remove" {:block-uuid (str (second op))}]
                             :remove-page ["remove-page" {:block-uuid (str (second op))}])))
                       ops)]
        ops*))))

(defn- entity-datoms=>asset-op
  [db-after entity-datoms]
  (let [attr->datom (entity-datoms=>attr->datom entity-datoms)]
    (when (seq attr->datom)
      (let [e (some-> attr->datom first second first)
            {[_e _a asset-uuid _t add1?] :asset/uuid
             [_e _a asset-meta _t add2?] :asset/meta}
            attr->datom
            op (cond
                 (or (and add1? asset-uuid)
                     (and add2? asset-meta))
                 [:update-asset]

                 (and (not add1?) asset-uuid)
                 [:remove-asset asset-uuid])]
        (when op
          (let [asset-uuid (some-> (d/entity db-after e) :asset/uuid str)]
            (case (first op)
              :update-asset (when asset-uuid ["update-asset" {:asset-uuid asset-uuid}])
              :remove-asset ["remove-asset" {:asset-uuid (str (second op))}])))))))


(defn generate-rtc-ops
  [repo db-before db-after datoms]
  (let [datom-vec-coll (map vec datoms)
        id->same-entity-datoms (group-by first datom-vec-coll)
        id-order (distinct (map first datom-vec-coll))
        same-entity-datoms-coll (map id->same-entity-datoms id-order)
        asset-ops (keep (partial entity-datoms=>asset-op db-after) same-entity-datoms-coll)
        ops (when (empty asset-ops)
              (mapcat (partial entity-datoms=>ops db-before db-after) same-entity-datoms-coll))
        now-epoch*1000 (* 1000 (tc/to-long (t/now)))
        ops* (map-indexed (fn [idx op]
                            [(first op) (assoc (second op) :epoch (+ idx now-epoch*1000))]) ops)
        epoch2 (+ now-epoch*1000 (count ops))
        asset-ops* (map-indexed (fn [idx op]
                                  [(first op) (assoc (second op) :epoch (+ idx epoch2))]) asset-ops)]
    (when (seq ops*)
      (op-mem-layer/add-ops! repo ops*))
    (when (seq asset-ops*)
      (op-mem-layer/add-asset-ops! repo asset-ops*))))



(defn listen-db-to-generate-ops
  [repo conn]
  (d/listen! conn :gen-ops
             (fn [{:keys [tx-data tx-meta db-before db-after]}]
               (when (:persist-op? tx-meta true)
                 (generate-rtc-ops repo db-before db-after tx-data)))))

(comment
  (defn listen-db-to-batch-txs
   [conn]
   (d/listen! conn :batch-txs
              (fn [{:keys [tx-data]}]
                (when (worker-state/batch-tx-mode?)
                  (worker-state/conj-batch-txs! tx-data))))))

(defn sync-db-to-main-thread
  [repo conn]
  (d/listen! conn :sync-db
             (fn [{:keys [tx-meta] :as tx-report}]
               (let [{:keys [pipeline-replace?]} tx-meta
                     result (worker-pipeline/invoke-hooks repo conn tx-report (worker-state/get-context))
                     tx-report' (or (:tx-report result) tx-report)]
                 (when-not pipeline-replace?
                   (let [data (pr-str
                               (merge
                                {:request-id (:request-id tx-meta)
                                 :repo repo
                                 :tx-data (:tx-data tx-report')
                                 :tx-meta tx-meta}
                                (dissoc result :tx-report)))]
                     (worker-util/post-message :sync-db-changes data))

                   (p/do!
                    (let [{:keys [blocks-to-remove-set blocks-to-add]} (search/sync-search-indice repo tx-report')
                          ^js wo (worker-state/get-worker-object)]
                      (when wo
                        (when (seq blocks-to-remove-set)
                          (.search-delete-blocks wo repo (bean/->js blocks-to-remove-set)))
                        (when (seq blocks-to-add)
                          (.search-upsert-blocks wo repo (bean/->js blocks-to-add)))))))))))

(defn listen-to-db-changes!
  [repo conn]
  (d/unlisten! conn :gen-ops)
  (d/unlisten! conn :sync-db)
  (when (op-mem-layer/rtc-db-graph? repo)
    (listen-db-to-generate-ops repo conn)
    ;; (rtc-db-listener/listen-db-to-batch-txs conn)
    )

  (sync-db-to-main-thread repo conn))
