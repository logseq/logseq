(ns frontend.worker.rtc.full-upload-download-graph
  "- upload local graph to remote
  - download remote graph"
  (:require [cljs-http.client :as http]
            [cljs.core.async :as async :refer [<! go-loop]]
            [cljs.core.async.interop :refer [p->c]]
            [clojure.string :as string]
            [cognitect.transit :as transit]
            [datascript.core :as d]
            [frontend.worker.async-util :include-macros true :refer [<? go-try]]
            [frontend.worker.rtc.client :as r.client]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.rtc.ws :as ws]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.common.missionary-util :as c.m]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.schema :as db-schema]
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
                      (when (and (contains? #{:block/parent :block/left} (:a datom))
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
      (m/? (c.m/<! (http/put url {:body all-blocks-str})))
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

(defn- replace-db-id-with-temp-id
  [blocks]
  (mapv
   (fn [block]
     (let [db-id            (:db/id block)
           block-parent     (:db/id (:block/parent block))
           block-left       (:db/id (:block/left block))
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
         block-left        (assoc :block/left (str block-left))
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
    (:block/journal-day block) (assoc :block/journal? true)
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

(defn- <transact-remote-all-blocks-to-sqlite
  [all-blocks repo graph-uuid]
  (go-try
   (let [{:keys [t blocks]} all-blocks
         blocks* (replace-db-id-with-temp-id blocks)
         blocks-with-page-id (fill-block-fields blocks*)
         tx-data (concat blocks-with-page-id
                         [{:db/ident :logseq.kv/graph-uuid :graph/uuid graph-uuid}])
         ^js worker-obj (:worker/object @worker-state/*state)
         _ (op-mem-layer/update-local-tx! repo t)
         work (p/do!
               (.createOrOpenDB worker-obj repo {:close-other-db? false})
               (.exportDB worker-obj repo)
               (.transact worker-obj repo tx-data {:rtc-download-graph? true} (worker-state/get-context))
               (transact-block-refs! repo))]
     (<? (p->c work))

     (worker-util/post-message :add-repo {:repo repo}))))

;;;;;;;;;;;;;;;;;;;;;;;;;;
;; async download-graph ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn new-task--request-download-graph
  [get-ws-create-task graph-uuid]
  (m/join :download-info-uuid
          (r.client/send&recv get-ws-create-task {:action "download-graph"
                                                  :graph-uuid graph-uuid})))

(defn <wait-download-info-ready
  [state download-info-uuid graph-uuid timeout-ms]
  (let [init-interval 1000
        interval      3000
        timeout-ch    (async/timeout timeout-ms)]
    (go-loop [interval-ch (async/timeout init-interval)]
      (let [{:keys [timeout retry]}
            (async/alt!
              timeout-ch {:timeout true}
              interval-ch {:retry true}
              :priority true)]
        (cond
          timeout :timeout
          retry
          (let [{:keys [download-info-list]}
                (<? (ws/<send&receive state {:action     "download-info-list"
                                             :graph-uuid graph-uuid}))
                finished-download-info
                (some
                 (fn [download-info]
                   (when (and (= download-info-uuid (:download-info-uuid download-info))
                              (:download-info-s3-url download-info))
                     download-info))
                 download-info-list)]
            (if finished-download-info
              finished-download-info
              (recur (async/timeout interval)))))))))

(defn <download-graph-from-s3
  [graph-uuid graph-name s3-url]
  (let [^js worker-obj              (:worker/object @worker-state/*state)]
    (go-try
     (let [{:keys [status body] :as r} (<! (http/get s3-url))
           repo                        (str "logseq_db_" graph-name)]
       (if (not= 200 status)
         (ex-info "<download-graph failed" r)
         (let [all-blocks (transit/read transit-r body)]
           (worker-state/set-rtc-downloading-graph! true)
           (op-mem-layer/init-empty-ops-store! repo)
           (<? (<transact-remote-all-blocks-to-sqlite all-blocks repo graph-uuid))
           (op-mem-layer/update-graph-uuid! repo graph-uuid)
           (<! (op-mem-layer/<sync-to-idb-layer! repo))
           (<! (p->c (.storeMetadata worker-obj repo (pr-str {:graph/uuid graph-uuid}))))
           (worker-state/set-rtc-downloading-graph! false)))))))

(defn <download-info-list
  [state graph-uuid]
  (go-try
   (:download-info-list
    (<? (ws/<send&receive state {:action "download-info-list"
                                 :graph-uuid graph-uuid})))))
