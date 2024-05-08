(ns frontend.worker.rtc.full-upload-download-graph
  "- upload local graph to remote
  - download remote graph"
  (:require [cljs-http.client :as http]
            [clojure.string :as string]
            [cognitect.transit :as transit]
            [datascript.core :as d]
            [frontend.worker.rtc.client :as r.client]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.common.missionary-util :as c.m]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [missionary.core :as m]
            [promesa.core :as p]))

(def ^:private transit-r (transit/reader :json))

(defn- export-as-blocks
  [db]
  (let [datoms (d/datoms db :eavt)]
    (->> datoms
         (partition-by :e)
         (keep (fn [datoms]
                 (when (seq datoms)
                   (reduce
                    (fn [r datom]
                      (when (and (contains? #{:block/parent} (:a datom))
                                 (not (pos-int? (:v datom))))
                        (throw (ex-info "invalid block data" {:datom datom})))
                      (if (contains? db-schema/card-many-attributes (:a datom))
                        (update r (:a datom) conj (:v datom))
                        (assoc r (:a datom) (:v datom))))
                    {:db/id (:e (first datoms))}
                    datoms)))))))

(defn new-task--upload-graph
  [get-ws-create-task repo conn remote-graph-name]
  (m/sp
    (let [[{:keys [url key]} all-blocks-str]
          (m/?
           (m/join
            vector
            (r.client/send&recv get-ws-create-task {:action "presign-put-temp-s3-obj"})
            (m/sp
              (let [all-blocks (export-as-blocks @conn)]
                (transit/write (transit/writer :json) all-blocks)))))]
      (m/? (c.m/<! (http/put url {:body all-blocks-str :with-credentials? false})))
      (let [upload-resp
            (m/? (r.client/send&recv get-ws-create-task {:action "upload-graph"
                                                         :s3-key key
                                                         :graph-name remote-graph-name}))]
        (if-let [graph-uuid (:graph-uuid upload-resp)]
          (let [^js worker-obj (:worker/object @worker-state/*state)]
            (d/transact! conn
                         [{:db/ident :logseq.kv/graph-uuid :graph/uuid graph-uuid}
                          {:db/ident :logseq.kv/graph-local-tx :graph/local-tx "0"}])
            (m/? (c.m/await-promise (.storeMetadata worker-obj repo (pr-str {:graph/uuid graph-uuid}))))
            (op-mem-layer/init-empty-ops-store! repo)
            (op-mem-layer/update-graph-uuid! repo graph-uuid)
            (op-mem-layer/update-local-tx! repo 8)
            (m/? (c.m/<! (op-mem-layer/<sync-to-idb-layer! repo)))
            nil)
          (throw (ex-info "upload-graph failed" {:upload-resp upload-resp})))))))

(def ^:private block-type-kw->str
  {:block-type/property     "property"
   :block-type/class        "class"
   :block-type/whiteboard   "whiteboard"
   :block-type/macro        "macro"
   :block-type/hidden       "hidden"
   :block-type/closed-value "closed value"})

(defn- remote-block-index->block-order*
  [same-parent-blocks]
  (let [orders (db-order/gen-n-keys (count same-parent-blocks) nil nil)]
    (map (fn [order block]
           (-> block
               (assoc :block/order order)
               (dissoc :block/index)))
         orders (sort-by :block/index same-parent-blocks))))

(defn- remote-block-index->block-order
  [blocks]
  (let [blocks-coll (vals (group-by :block/parent blocks))]
    (mapcat remote-block-index->block-order* blocks-coll)))

(defn- replace-db-id-with-temp-id
  [blocks]
  (mapv
   (fn [block]
     (let [db-id            (:db/id block)
           block-parent     (:db/id (:block/parent block))
           block-alias      (map :db/id (:block/alias block))
           block-tags       (map :db/id (:block/tags block))
           block-type       (keep block-type-kw->str (:block/type block))
           block-schema     (some->> (:block/schema block)
                                     (transit/read transit-r))
           block-properties (some->> (:block/properties block)
                                     (transit/read transit-r))
           block-link       (:db/id (:block/link block))]
       (cond-> (assoc block :db/id (str db-id))
         block-parent      (assoc :block/parent (str block-parent))
         (seq block-alias) (assoc :block/alias (map str block-alias))
         (seq block-tags)  (assoc :block/tags (map str block-tags))
         (seq block-type)  (assoc :block/type block-type)
         block-schema      (assoc :block/schema block-schema)
         block-properties  (assoc :block/properties block-properties)
         block-link        (assoc :block/link (str block-link)))))
   blocks))

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
    (:block/journal-day block) (assoc :block/type "journal")
    true                       (assoc :block/format :markdown)))

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

(defn- transact-block-refs!
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [date-formatter (worker-state/get-date-formatter repo)
          db @conn
          ;; get all the block datoms
          datoms (d/datoms db :avet :block/uuid)
          refs-tx (keep
                   (fn [d]
                     (let [block (d/entity @conn (:e d))
                           block' (let [content (:block/content block)]
                                    (if (and content (string/includes? content (str page-ref/left-brackets db-content/page-ref-special-chars)))
                                      (assoc block :block/content (db-content/db-special-id-ref->page db content))
                                      block))
                           refs (outliner-core/rebuild-block-refs repo conn date-formatter block' {})]
                       (when (seq refs)
                         {:db/id (:db/id block)
                          :block/refs refs})))
                   datoms)]
      (d/transact! conn refs-tx {:outliner-op :rtc-download-rebuild-block-refs}))))

(defn- new-task--transact-remote-all-blocks
  [all-blocks repo graph-uuid]
  (let [{:keys [t blocks]} all-blocks
        blocks* (remote-block-index->block-order (replace-db-id-with-temp-id blocks))
        blocks-with-page-id (fill-block-fields blocks*)
        tx-data (concat blocks-with-page-id
                        [{:db/ident :logseq.kv/graph-uuid :graph/uuid graph-uuid}])
        ^js worker-obj (:worker/object @worker-state/*state)]
    (m/sp
      (op-mem-layer/update-local-tx! repo t)
      (m/?
       (c.m/await-promise
        (p/do!
         (.createOrOpenDB worker-obj repo {:close-other-db? false})
         (.exportDB worker-obj repo)
         (.transact worker-obj repo tx-data {:rtc-download-graph? true} (worker-state/get-context))
         (transact-block-refs! repo))))
      (worker-util/post-message :add-repo {:repo repo}))))

;;;;;;;;;;;;;;;;;;;;;;;;;;
;; async download-graph ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn new-task--request-download-graph
  [get-ws-create-task graph-uuid]
  (m/join :download-info-uuid
          (r.client/send&recv get-ws-create-task {:action "download-graph"
                                                  :graph-uuid graph-uuid})))

(defn new-task--download-info-list
  [get-ws-create-task graph-uuid]
  (m/join :download-info-list
          (r.client/send&recv get-ws-create-task {:action "download-info-list"
                                                  :graph-uuid graph-uuid})))

(defn new-task--wait-download-info-ready
  [get-ws-create-task download-info-uuid graph-uuid timeout-ms]
  (->
   (m/sp
     (loop []
       (m/? (m/sleep 3000))
       (let [{:keys [download-info-list]}
             (m/? (r.client/send&recv get-ws-create-task {:action "download-info-list"
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
    (let [^js worker-obj              (:worker/object @worker-state/*state)
          {:keys [status body] :as r} (m/? (c.m/<! (http/get s3-url {:with-credentials? false})))
          repo                        (str sqlite-util/db-version-prefix graph-name)]
      (if (not= 200 status)
        (throw (ex-info "download-graph from s3 failed" {:resp r}))
        (let [all-blocks (transit/read transit-r body)]
          (worker-state/set-rtc-downloading-graph! true)
          (op-mem-layer/init-empty-ops-store! repo)
          (m/? (new-task--transact-remote-all-blocks all-blocks repo graph-uuid))
          (op-mem-layer/update-graph-uuid! repo graph-uuid)
          (m/? (c.m/<! (op-mem-layer/<sync-to-idb-layer! repo)))
          (m/? (c.m/await-promise (.storeMetadata worker-obj repo (pr-str {:graph/uuid graph-uuid}))))
          (worker-state/set-rtc-downloading-graph! false))))))
