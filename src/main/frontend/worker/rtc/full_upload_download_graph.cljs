(ns frontend.worker.rtc.full-upload-download-graph
  "- upload local graph to remote
  - download remote graph"
  (:require [cljs-http.client :as http]
            [clojure.set :as set]
            [datascript.core :as d]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [frontend.worker.rtc.ws-util :as ws-util]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
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
  [db]
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
                      (let [a (:a datom)
                            card-many? (contains? card-many-attrs a)
                            ref? (contains? ref-type-attrs a)]
                        (case [ref? card-many?]
                          [true true]
                          (update r a conj (str (:v datom)))
                          [true false]
                          (assoc r a (str (:v datom)))
                          [false true]
                          (update r a conj (ldb/write-transit-str (:v datom)))
                          [false false]
                          (assoc r a (ldb/write-transit-str (:v datom))))))
                    {:db/id (str (:e (first datoms)))}
                    datoms))))
         (map (fn [block]
                (cond-> block
                  (:db/ident block) (update :db/ident ldb/read-transit-str)
                  (:block/order block) (update :block/order ldb/read-transit-str)))))))

(defn new-task--upload-graph
  [get-ws-create-task repo conn remote-graph-name]
  (m/sp
    (rtc-log-and-state/rtc-log :rtc.log/upload {:sub-type :fetch-presigned-put-url
                                                :message "fetching presigned put-url"})
    (let [[{:keys [url key]} all-blocks-str]
          (m/?
           (m/join
            vector
            (ws-util/send&recv get-ws-create-task {:action "presign-put-temp-s3-obj"})
            (m/sp
              (let [all-blocks (export-as-blocks @conn)]
                (ldb/write-transit-str all-blocks)))))]
      (rtc-log-and-state/rtc-log :rtc.log/upload {:sub-type :upload-data
                                                  :message "uploading data"})
      (c.m/<? (http/put url {:body all-blocks-str :with-credentials? false}))
      (rtc-log-and-state/rtc-log :rtc.log/upload {:sub-type :request-upload-graph
                                                  :message "requesting upload-graph"})
      (let [upload-resp
            (m/? (ws-util/send&recv get-ws-create-task {:action "upload-graph"
                                                        :s3-key key
                                                        :graph-name remote-graph-name}))]
        (if-let [graph-uuid (:graph-uuid upload-resp)]
          (let [^js worker-obj (:worker/object @worker-state/*state)]
            (ldb/transact! conn
                           [{:db/ident :logseq.kv/graph-uuid :kv/value graph-uuid}
                            {:db/ident :logseq.kv/graph-local-tx :kv/value "0"}])
            (m/? (c.m/await-promise (.storeMetadata worker-obj repo (pr-str {:kv/value graph-uuid}))))
            (client-op/update-graph-uuid repo graph-uuid)
            (rtc-log-and-state/rtc-log :rtc.log/upload {:sub-type :upload-completed
                                                        :message "upload-graph completed"})
            nil)
          (throw (ex-info "upload-graph failed" {:upload-resp upload-resp})))))))

(def page-of-block
  (memoize
   (fn [id->block-map block]
     (when-let [parent-id (:block/parent block)]
       (when-let [parent (id->block-map parent-id)]
         (if (:block/name parent)
           parent
           (page-of-block id->block-map parent)))))))

(defn- convert-block-fields
  [block]
  (cond-> block
    (:block/uuid block)        (assoc :block/format :markdown)))

(defn- fill-block-fields
  [blocks]
  (let [groups (group-by #(boolean (:block/name %)) blocks)
        other-blocks (set (get groups false))
        id->block (into {} (map (juxt :db/id identity) blocks))
        block-id->page-id (into {} (map (fn [b] [(:db/id b) (:db/id (page-of-block id->block b))]) other-blocks))]
    (mapv (fn [b]
            (let [b (convert-block-fields b)]
              (if-let [page-id (block-id->page-id (:db/id b))]
                (assoc b :block/page page-id)
                b)))
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
                          (if (coll? v) (first v) v))))))

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
      (ldb/transact! conn refs-tx {:outliner-op :rtc-download-rebuild-block-refs}))))

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

(defn- new-task--transact-remote-all-blocks
  [all-blocks repo graph-uuid]
  (let [{:keys [t blocks]} all-blocks
        card-one-attrs (blocks->card-one-attrs blocks)
        blocks (worker-util/profile :convert-card-one-value-from-value-coll
                                    (map (partial convert-card-one-value-from-value-coll card-one-attrs) blocks))
        blocks (worker-util/profile :normalize-remote-blocks
                                    (normalized-remote-blocks-coercer blocks))
        ;;TODO: remove this, client/schema already converted to :db/cardinality, :db/valueType by remote,
        ;; and :client/schema should be removed by remote too
        blocks (map #(dissoc % :client/schema) blocks)
        blocks (fill-block-fields blocks)
        [schema-blocks normal-blocks] (blocks->schema-blocks+normal-blocks blocks)
        tx-data (concat
                 normal-blocks
                 [{:db/ident :logseq.kv/graph-uuid :kv/value graph-uuid}])
        init-tx-data (concat [{:db/ident :logseq.kv/db-type :kv/value "db"}]
                             schema-blocks)
        ^js worker-obj (:worker/object @worker-state/*state)]
    (m/sp
      (client-op/update-local-tx repo t)
      (rtc-log-and-state/update-local-t graph-uuid t)
      (rtc-log-and-state/update-remote-t graph-uuid t)
      (m/?
       (c.m/await-promise
        (p/do!
         (.createOrOpenDB worker-obj repo (ldb/write-transit-str {:close-other-db? false}))
         (.exportDB worker-obj repo)
         (.transact worker-obj repo init-tx-data {:rtc-download-graph? true
                                                  :gen-undo-ops? false
                                                  ;; only transact db schema, skip validation to avoid warning
                                                  :skip-validate-db? true
                                                  :persist-op? false} (worker-state/get-context))
         (.transact worker-obj repo tx-data {:rtc-download-graph? true
                                             :gen-undo-ops? false
                                             :persist-op? false} (worker-state/get-context))
         (transact-block-refs! repo))))
      (worker-util/post-message :add-repo {:repo repo}))))

;;;;;;;;;;;;;;;;;;;;;;;;;;
;; async download-graph ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn new-task--request-download-graph
  [get-ws-create-task graph-uuid]
  (rtc-log-and-state/rtc-log :rtc.log/download {:sub-type :request-download-graph
                                                :message "requesting download graph"
                                                :graph-uuid graph-uuid})
  (m/join :download-info-uuid
          (ws-util/send&recv get-ws-create-task {:action "download-graph"
                                                 :graph-uuid graph-uuid})))

(defn new-task--download-info-list
  [get-ws-create-task graph-uuid]
  (m/join :download-info-list
          (ws-util/send&recv get-ws-create-task {:action "download-info-list"
                                                 :graph-uuid graph-uuid})))

(defn new-task--wait-download-info-ready
  [get-ws-create-task download-info-uuid graph-uuid timeout-ms]
  (->
   (m/sp
     (rtc-log-and-state/rtc-log :rtc.log/download {:sub-type :wait-remote-graph-data-ready
                                                   :message "waiting for the remote to prepare the data"
                                                   :graph-uuid graph-uuid})
     (loop []
       (m/? (m/sleep 3000))
       (let [{:keys [download-info-list]}
             (m/? (ws-util/send&recv get-ws-create-task {:action "download-info-list"
                                                         :graph-uuid graph-uuid}))]
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
          {:keys [status body] :as r} (c.m/<? (http/get s3-url {:with-credentials? false}))
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
            (m/? (c.m/await-promise (.storeMetadata worker-obj repo (pr-str {:kv/value graph-uuid}))))
            (worker-state/set-rtc-downloading-graph! false)
            (rtc-log-and-state/rtc-log :rtc.log/download {:sub-type :download-completed
                                                          :message "download completed"
                                                          :graph-uuid graph-uuid})
            nil))))))
