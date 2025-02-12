(ns frontend.worker.rtc.full-upload-download-graph
  "- upload local graph to remote
  - download remote graph"
  (:require [cljs-http-missionary.client :as http]
            [clojure.set :as set]
            [datascript.core :as d]
            [frontend.common.missionary :as c.m]
            [frontend.worker.crypt :as crypt]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [frontend.worker.rtc.ws-util :as ws-util]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [malli.core :as ma]
            [malli.transform :as mt]
            [missionary.core :as m]
            [promesa.core :as p]))

(def ^:private normalized-remote-block-schema
  "Blocks stored in remote have some differences in format from the client's.
  Use this schema's coercer to decode."
  [:map
   [:db/id [:string {:decode/custom str}]]
   [:db/ident {:optional true} :keyword]
   [:block/uuid {:optional true} [:uuid {:decode/custom ldb/read-transit-str}]]
   [:block/order {:optional true} db-malli-schema/block-order]
   [:db/cardinality {:optional true} :keyword]
   [:db/valueType {:optional true} :keyword]
   [:db/index {:optional true} :boolean]
   [:malli.core/default [:map-of :keyword
                         [:any {:decode/custom
                                (fn [x] ; convert db-id to db-id-string(as temp-id)
                                  (cond
                                    (and (coll? x)
                                         (every? :db/id x))
                                    (map (comp str :db/id) x)

                                    (:db/id x)
                                    (str (:db/id x))

                                    (string? x)
                                    (ldb/read-transit-str x)

                                    (and (coll? x)
                                         (every? string? x))
                                    (map ldb/read-transit-str x)

                                    :else x))}]]]])

(def ^:private normalized-remote-blocks-coercer
  (ma/coercer [:sequential normalized-remote-block-schema]
              (mt/transformer {:name :custom} mt/string-transformer)))

(defn- schema->ref-type-attrs
  [db-schema]
  (set
   (keep
    (fn [[attr-name attr-body-map]]
      (when (= :db.type/ref (:db/valueType attr-body-map))
        attr-name))
    db-schema)))

(defn- schema->card-many-attrs
  [db-schema]
  (set
   (keep
    (fn [[attr-name attr-body-map]]
      (when (= :db.cardinality/many (:db/cardinality attr-body-map))
        attr-name))
    db-schema)))

(defn- export-as-blocks
  [db & {:keys [ignore-attr-set ignore-entity-set]}]
  (let [datoms (d/datoms db :eavt)
        db-schema (d/schema db)
        card-many-attrs (schema->card-many-attrs db-schema)
        ref-type-attrs (schema->ref-type-attrs db-schema)]
    (->> datoms
         (partition-by :e)
         (keep (fn [datoms]
                 (when (seq datoms)
                   (reduce
                    (fn [r datom]
                      (when (and (contains? #{:block/parent} (:a datom))
                                 (not (pos-int? (:v datom))))
                        (throw (ex-info "invalid block data" {:datom datom})))
                      (let [a (:a datom)]
                        (cond
                          (contains? ignore-attr-set a) r
                          (and (keyword-identical? :db/ident a)
                               (contains? ignore-entity-set (:v datom)))
                          (reduced nil)
                          :else
                          (let [card-many? (contains? card-many-attrs a)
                                ref? (contains? ref-type-attrs a)]
                            (case [ref? card-many?]
                              [true true]
                              (update r a conj (str (:v datom)))
                              [true false]
                              (assoc r a (str (:v datom)))
                              [false true]
                              (update r a conj (ldb/write-transit-str (:v datom)))
                              [false false]
                              (assoc r a (ldb/write-transit-str (:v datom))))))))
                    {:db/id (str (:e (first datoms)))}
                    datoms))))
         (map (fn [block]
                (cond-> block
                  (:db/ident block) (update :db/ident ldb/read-transit-str)
                  (:block/order block) (update :block/order ldb/read-transit-str)))))))

(defn- remove-rtc-data-in-conn!
  [repo]
  (client-op/reset-client-op-conn repo)
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (d/transact! conn [[:db/retractEntity :logseq.kv/graph-uuid]
                       [:db/retractEntity :logseq.kv/graph-local-tx]
                       [:db/retractEntity :logseq.kv/remote-schema-version]])))

(defn new-task--upload-graph
  [get-ws-create-task repo conn remote-graph-name major-schema-version]
  (m/sp
    (rtc-log-and-state/rtc-log :rtc.log/upload {:sub-type :fetching-presigned-put-url
                                                :message "fetching presigned put-url"})
    (let [[{:keys [url key]} all-blocks-str]
          (m/?
           (m/join
            vector
            (ws-util/send&recv get-ws-create-task {:action "presign-put-temp-s3-obj"})
            (m/sp
              (let [all-blocks (export-as-blocks
                                @conn
                                :ignore-attr-set rtc-const/ignore-attrs-when-init-upload
                                :ignore-entity-set rtc-const/ignore-entities-when-init-upload)]
                (ldb/write-transit-str all-blocks)))))]
      (rtc-log-and-state/rtc-log :rtc.log/upload {:sub-type :upload-data
                                                  :message "uploading data"})
      (m/? (http/put url {:body all-blocks-str :with-credentials? false}))
      (rtc-log-and-state/rtc-log :rtc.log/upload {:sub-type :request-upload-graph
                                                  :message "requesting upload-graph"})
      (let [aes-key (c.m/<? (crypt/<gen-aes-key))
            aes-key-jwk (ldb/write-transit-str (c.m/<? (crypt/<export-key aes-key)))
            upload-resp
            (m/? (ws-util/send&recv get-ws-create-task {:action "upload-graph"
                                                        :s3-key key
                                                        :schema-version (str major-schema-version)
                                                        :graph-name remote-graph-name}))]
        (if-let [graph-uuid (:graph-uuid upload-resp)]
          (let [schema-version (ldb/get-graph-schema-version @conn)]
            (ldb/transact! conn
                           [(ldb/kv :logseq.kv/graph-uuid graph-uuid)
                            (ldb/kv :logseq.kv/graph-local-tx "0")
                            (ldb/kv :logseq.kv/remote-schema-version schema-version)])
            (client-op/update-graph-uuid repo graph-uuid)
            (client-op/remove-local-tx repo)
            (client-op/add-all-exists-asset-as-ops repo)
            (crypt/store-graph-keys-jwk repo aes-key-jwk)
            (when-not rtc-const/RTC-E2E-TEST
              (let [^js worker-obj (:worker/object @worker-state/*state)]
                (c.m/<? (.storeMetadata worker-obj repo (pr-str {:kv/value graph-uuid})))))
            (rtc-log-and-state/rtc-log :rtc.log/upload {:sub-type :upload-completed
                                                        :message "upload-graph completed"})
            {:graph-uuid graph-uuid})
          (throw (ex-info "upload-graph failed" {:upload-resp upload-resp})))))))

(def page-of-block
  (memoize
   (fn [id->block-map block]
     (when-let [parent-id (:block/parent block)]
       (when-let [parent (id->block-map parent-id)]
         (if (:block/name parent)
           parent
           (page-of-block id->block-map parent)))))))

(defn- fill-block-fields
  [blocks]
  (let [groups (group-by #(boolean (:block/name %)) blocks)
        other-blocks (set (get groups false))
        id->block (into {} (map (juxt :db/id identity) blocks))
        block-id->page-id (into {} (map (fn [b] [(:db/id b) (:db/id (page-of-block id->block b))]) other-blocks))]
    (mapv (fn [b]
            (if-let [page-id (block-id->page-id (:db/id b))]
              (assoc b :block/page page-id)
              b))
          blocks)))

(defn- blocks->card-one-attrs
  [blocks]
  (set
   (keep
    (fn [block]
      (when-let [db-ident (:db/ident block)]
        (when (= :db.cardinality/one (:db/cardinality block))
          db-ident)))
    blocks)))

(defn- convert-card-one-value-from-value-coll
  [card-one-attrs block]
  (let [card-one-attrs-in-block (set/intersection (set (keys block)) card-one-attrs)]
    (merge block
           (update-vals (select-keys block card-one-attrs-in-block)
                        (fn [v]
                          (if (or (sequential? v)
                                  (set? v))
                            (first v)
                            v))))))

(defn- transact-remote-schema-version!
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (when-let [schema-version (:kv/value (d/entity db :logseq.kv/schema-version))]
        (d/transact! conn
                     [(ldb/kv :logseq.kv/remote-schema-version schema-version)]
                     {:rtc-download-graph? true
                      :gen-undo-ops? false
                      :persist-op? false})))))

(defn- transact-block-refs!
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          ;; get all the block datoms
          datoms (d/datoms db :avet :block/uuid)
          refs-tx (keep
                   (fn [d]
                     (let [block (d/entity @conn (:e d))
                           refs (outliner-pipeline/db-rebuild-block-refs @conn block)]
                       (when (seq refs)
                         {:db/id (:db/id block)
                          :block/refs refs})))
                   datoms)]
      (ldb/transact! conn refs-tx (cond-> {:outliner-op :rtc-download-rebuild-block-refs}
                                    rtc-const/RTC-E2E-TEST (assoc :frontend.worker.pipeline/skip-store-conn true))))))

(defn- block->schema-map
  [block]
  (when-let [db-ident (:db/ident block)]
    (let [value-type (:db/valueType block)
          cardinality (:db/cardinality block)
          db-index (:db/index block)]
      (when (or value-type cardinality db-index)
        (cond-> {:db/ident db-ident}
          value-type (assoc :db/valueType value-type)
          cardinality (assoc :db/cardinality cardinality)
          db-index (assoc :db/index db-index))))))

(defn- blocks->schema-blocks+normal-blocks
  [blocks]
  (reduce
   (fn [[schema-blocks normal-blocks] block]
     (if-let [schema-block (block->schema-map block)]
       (let [strip-schema-attrs-block (dissoc block :db/valueType :db/cardinality :db/index)]
         [(conj schema-blocks schema-block) (conj normal-blocks strip-schema-attrs-block)])
       [schema-blocks (conj normal-blocks block)]))
   [[] []] blocks))

(defn- create-graph-for-rtc-test
  "it's complex to setup db-worker related stuff, when I only want to test rtc related logic"
  [repo init-tx-data other-tx-data]
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        db-initial-data (sqlite-create-graph/build-db-initial-data "")]
    (swap! worker-state/*datascript-conns assoc repo conn)
    (d/transact! conn db-initial-data {:initial-db? true
                                       :frontend.worker.pipeline/skip-store-conn rtc-const/RTC-E2E-TEST})
    (db-listener/listen-db-changes! repo conn)
    (d/transact! conn init-tx-data {:rtc-download-graph? true
                                    :gen-undo-ops? false
                                    ;; only transact db schema, skip validation to avoid warning
                                    :frontend.worker.pipeline/skip-validate-db? true
                                    :frontend.worker.pipeline/skip-store-conn rtc-const/RTC-E2E-TEST
                                    :persist-op? false})
    (d/transact! conn other-tx-data {:rtc-download-graph? true
                                     :gen-undo-ops? false
                                     :frontend.worker.pipeline/skip-store-conn rtc-const/RTC-E2E-TEST
                                     :persist-op? false})
    (transact-remote-schema-version! repo)
    (transact-block-refs! repo)))

(defn- blocks-resolve-temp-id
  [blocks]
  (let [uuids (map :block/uuid blocks)
        idents (map :db/ident blocks)
        ids (map :db/id blocks)
        id->uuid (zipmap ids uuids)
        id->ident (zipmap ids idents)
        id-tx-data (map (fn [id]
                          (let [uuid' (id->uuid id)
                                ident (id->ident id)]
                            (cond-> {:block/uuid uuid'}
                              ident
                              (assoc :db/ident ident)))) ids)
        id-ref-exists? (fn [v] (and (string? v) (or (get id->ident v) (get id->uuid v))))
        blocks-tx-data (map (fn [block]
                              (->> (map
                                    (fn [[k v]]
                                      (let [v (cond
                                                (id-ref-exists? v)
                                                (or (get id->ident v) [:block/uuid (get id->uuid v)])

                                                (and (sequential? v) (every? id-ref-exists? v))
                                                (map (fn [id] (or (get id->ident id) [:block/uuid (get id->uuid id)])) v)

                                                :else
                                                v)]
                                        [k v]))
                                    (dissoc block :db/id))
                                   (into {}))) blocks)]
    (concat id-tx-data blocks-tx-data)))

(defn- remote-all-blocks=>client-blocks+t
  [all-blocks ignore-attr-set ignore-entity-set]
  (let [{:keys [t blocks]} all-blocks
        card-one-attrs (blocks->card-one-attrs blocks)
        blocks1 (worker-util/profile :convert-card-one-value-from-value-coll
                                     (map (partial convert-card-one-value-from-value-coll card-one-attrs) blocks))
        blocks2 (worker-util/profile :normalize-remote-blocks
                                     (normalized-remote-blocks-coercer blocks1))
        blocks (sequence
                (comp
                 ;;TODO: remove this
                 ;;client/schema already converted to :db/cardinality, :db/valueType by remote,
                 ;;and :client/schema should be removed by remote too
                 (map #(dissoc % :client/schema))
                 (remove (fn [block] (contains? ignore-entity-set (:db/ident block))))
                 (map (fn [block]
                        (into {} (remove (comp (partial contains? ignore-attr-set) first)) block))))
                blocks2)
        blocks (fill-block-fields blocks)]
    {:blocks blocks :t t}))

(defn- new-task--transact-remote-all-blocks
  [all-blocks repo graph-uuid]
  (let [{:keys [t blocks]} (remote-all-blocks=>client-blocks+t
                            all-blocks
                            rtc-const/ignore-attrs-when-init-download
                            rtc-const/ignore-entities-when-init-download)
        [schema-blocks normal-blocks] (blocks->schema-blocks+normal-blocks blocks)
        tx-data (concat
                 (blocks-resolve-temp-id normal-blocks)
                 [(ldb/kv :logseq.kv/graph-uuid graph-uuid)])
        init-tx-data (cons (ldb/kv :logseq.kv/db-type "db") schema-blocks)
        ^js worker-obj (:worker/object @worker-state/*state)]
    (m/sp
      (client-op/update-local-tx repo t)
      (rtc-log-and-state/update-local-t graph-uuid t)
      (rtc-log-and-state/update-remote-t graph-uuid t)
      (if rtc-const/RTC-E2E-TEST
        (create-graph-for-rtc-test repo init-tx-data tx-data)
        (c.m/<?
         (p/do!
          (.createOrOpenDB worker-obj repo (ldb/write-transit-str {:close-other-db? false}))
          (.exportDB worker-obj repo)
          (.transact worker-obj repo init-tx-data {:rtc-download-graph? true
                                                   :gen-undo-ops? false
                                                    ;; only transact db schema, skip validation to avoid warning
                                                   :frontend.worker.pipeline/skip-validate-db? true
                                                   :persist-op? false} (worker-state/get-context))
          (.transact worker-obj repo tx-data {:rtc-download-graph? true
                                              :gen-undo-ops? false
                                              :persist-op? false} (worker-state/get-context))
          (transact-remote-schema-version! repo)
          (transact-block-refs! repo))))
      (worker-util/post-message :add-repo {:repo repo}))))

;;;;;;;;;;;;;;;;;;;;;;;;;;
;; async download-graph ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn new-task--request-download-graph
  [get-ws-create-task graph-uuid schema-version]
  (rtc-log-and-state/rtc-log :rtc.log/download {:sub-type :request-download-graph
                                                :message "requesting download graph"
                                                :graph-uuid graph-uuid
                                                :schema-version schema-version})
  (m/join :download-info-uuid
          (ws-util/send&recv get-ws-create-task {:action "download-graph"
                                                 :graph-uuid graph-uuid
                                                 :schema-version (str schema-version)})))

(defn new-task--download-info-list
  [get-ws-create-task graph-uuid schema-version]
  (m/join :download-info-list
          (ws-util/send&recv get-ws-create-task {:action "download-info-list"
                                                 :graph-uuid graph-uuid
                                                 :schema-version (str schema-version)})))

(defn new-task--wait-download-info-ready
  [get-ws-create-task download-info-uuid graph-uuid schema-version timeout-ms]
  (->
   (m/sp
     (rtc-log-and-state/rtc-log :rtc.log/download {:sub-type :wait-remote-graph-data-ready
                                                   :message "waiting for the remote to prepare the data"
                                                   :graph-uuid graph-uuid})
     (loop []
       (m/? (m/sleep 3000))
       (let [{:keys [download-info-list]}
             (m/? (ws-util/send&recv get-ws-create-task {:action "download-info-list"
                                                         :graph-uuid graph-uuid
                                                         :schema-version (str schema-version)}))]
         (if-let [found-download-info
                  (some
                   (fn [download-info]
                     (when (and (= download-info-uuid (:download-info-uuid download-info))
                                (:download-info-s3-url download-info))
                       download-info))
                   download-info-list)]
           found-download-info
           (recur)))))
   (m/timeout timeout-ms :timeout)))

(defn new-task--download-graph-from-s3
  [graph-uuid graph-name s3-url]
  (m/sp
    (rtc-log-and-state/rtc-log :rtc.log/download {:sub-type :downloading-graph-data
                                                  :message "downloading graph data"
                                                  :graph-uuid graph-uuid})
    (let [^js worker-obj              (:worker/object @worker-state/*state)
          {:keys [status body] :as r} (m/? (http/get s3-url {:with-credentials? false}))
          repo                        (str sqlite-util/db-version-prefix graph-name)]
      (if (not= 200 status)
        (throw (ex-info "download-graph from s3 failed" {:resp r}))
        (do
          (rtc-log-and-state/rtc-log :rtc.log/download {:sub-type :transact-graph-data-to-db
                                                        :message "transacting graph data to local db"
                                                        :graph-uuid graph-uuid})
          (let [all-blocks (ldb/read-transit-str body)]
            (worker-state/set-rtc-downloading-graph! true)
            (m/? (new-task--transact-remote-all-blocks all-blocks repo graph-uuid))
            (client-op/update-graph-uuid repo graph-uuid)
            (when-not rtc-const/RTC-E2E-TEST
              (c.m/<? (.storeMetadata worker-obj repo (pr-str {:kv/value graph-uuid}))))
            (worker-state/set-rtc-downloading-graph! false)
            (rtc-log-and-state/rtc-log :rtc.log/download {:sub-type :download-completed
                                                          :message "download completed"
                                                          :graph-uuid graph-uuid})
            nil))))))

(defn new-task--branch-graph
  [get-ws-create-task repo conn graph-uuid major-schema-version]
  (m/sp
    (rtc-log-and-state/rtc-log :rtc.log/branch-graph {:sub-type :fetching-presigned-put-url
                                                      :message "fetching presigned put-url"})
    (remove-rtc-data-in-conn! repo)
    (let [[{:keys [url key]} all-blocks-str]
          (m/?
           (m/join
            vector
            (ws-util/send&recv get-ws-create-task {:action "presign-put-temp-s3-obj"})
            (m/sp
              (let [all-blocks (export-as-blocks
                                @conn
                                :ignore-attr-set rtc-const/ignore-attrs-when-init-upload
                                :ignore-entity-set rtc-const/ignore-entities-when-init-upload)]
                (ldb/write-transit-str all-blocks)))))]
      (rtc-log-and-state/rtc-log :rtc.log/branch-graph {:sub-type :upload-data
                                                        :message "uploading data"})
      (m/? (http/put url {:body all-blocks-str :with-credentials? false}))
      (rtc-log-and-state/rtc-log :rtc.log/branch-graph {:sub-type :request-branch-graph
                                                        :message "requesting branch-graph"})
      (let [aes-key (c.m/<? (crypt/<gen-aes-key))
            aes-key-jwk (ldb/write-transit-str (c.m/<? (crypt/<export-key aes-key)))
            resp (m/? (ws-util/send&recv get-ws-create-task {:action "branch-graph"
                                                             :s3-key key
                                                             :schema-version (str major-schema-version)
                                                             :graph-uuid graph-uuid}))]
        (if-let [graph-uuid (:graph-uuid resp)]
          (let [schema-version (ldb/get-graph-schema-version @conn)]
            (ldb/transact! conn
                           [(ldb/kv :logseq.kv/graph-uuid graph-uuid)
                            (ldb/kv :logseq.kv/graph-local-tx "0")
                            (ldb/kv :logseq.kv/remote-schema-version schema-version)])
            (client-op/update-graph-uuid repo graph-uuid)
            (client-op/remove-local-tx repo)
            (client-op/add-all-exists-asset-as-ops repo)
            (crypt/store-graph-keys-jwk repo aes-key-jwk)
            (let [^js worker-obj (:worker/object @worker-state/*state)]
              (c.m/<? (.storeMetadata worker-obj repo (pr-str {:kv/value graph-uuid}))))
            (rtc-log-and-state/rtc-log :rtc.log/branch-graph {:sub-type :completed
                                                              :message "branch-graph completed"})
            nil)
          (throw (ex-info "branch-graph failed" {:upload-resp resp})))))))
