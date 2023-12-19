(ns frontend.db.rtc.full-upload-download-graph
  "- upload local graph to remote
  - download remote graph"
  (:require-macros [frontend.db.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
  (:require [cljs-http.client :as http]
            [cljs.core.async :as async :refer [<! go]]
            [cljs.core.async.interop :refer [p->c]]
            [cognitect.transit :as transit]
            [datascript.core :as d]
            [frontend.async-util :include-macros true :refer [<? go-try]]
            [frontend.db.conn :as conn]
            [frontend.db.rtc.op-mem-layer :as op-mem-layer]
            [frontend.db.rtc.ws :refer [<send!]]
            [frontend.persist-db :as persist-db]
            [logseq.db.frontend.schema :as db-schema]
            [frontend.state :as state]))

(def transit-r (transit/reader :json))

(defn- export-as-blocks
  [repo]
  (let [db (conn/get-db repo)
        datoms (d/datoms db :eavt)]
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

(defn <upload-graph
  "Upload current repo to remote, return remote {:req-id xxx :graph-uuid <new-remote-graph-uuid>}"
  [state repo]
  (go
    (let [{:keys [url key all-blocks-str]}
          (with-sub-data-from-ws state
            (<! (<send! state {:req-id (get-req-id) :action "presign-put-temp-s3-obj"}))
            (let [all-blocks (export-as-blocks repo)
                  all-blocks-str (transit/write (transit/writer :json) all-blocks)]
              (merge (<! (get-result-ch)) {:all-blocks-str all-blocks-str})))]
      (<! (http/put url {:body all-blocks-str}))
      (with-sub-data-from-ws state
        (<! (<send! state {:req-id (get-req-id) :action "full-upload-graph" :s3-key key}))
        (let [r (<! (get-result-ch))]
          (if-not (:graph-uuid r)
            (ex-info "upload graph failed" r)
            (do (op-mem-layer/init-empty-ops-store! repo)
                (op-mem-layer/update-graph-uuid! repo (:graph-uuid r))
                (op-mem-layer/update-local-tx! repo (:t r))
                (<! (op-mem-layer/<sync-to-idb-layer! repo))
                r)))))))

(def block-type-ident->str
  {:block-type/property   "property"
   :block-type/class      "class"
   :block-type/whiteboard "whiteboard"
   :block-type/macros     "macros"})


(defn- replace-db-id-with-temp-id
  [blocks]
  (mapv
   (fn [block]
     (let [db-id            (:db/id block)
           block-parent     (:db/id (:block/parent block))
           block-left       (:db/id (:block/left block))
           block-alias      (map :db/id (:block/alias block))
           block-tags       (map :db/id (:block/tags block))
           block-type       (keep (comp block-type-ident->str :db/ident) (:block/type block))
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

(defn- fill-block-fields
  [blocks]
  (let [groups (group-by #(boolean (:block/name %)) blocks)
        ;; _page-blocks (get groups true)
        other-blocks (set (get groups false))
        id->block (into {} (map (juxt :db/id identity) blocks))
        block-id->page-id (into {} (map (fn [b] [(:db/id b) (:db/id (page-of-block id->block b))]) other-blocks))]
    (mapv (fn [b]
            (let [b (assoc b :block/format :markdown)]
              (if-let [page-id (block-id->page-id (:db/id b))]
                (assoc b :block/page page-id)
                b)))
          blocks)))


(defn- <transact-remote-all-blocks-to-sqlite
  [all-blocks repo]
  (go-try
   (let [{:keys [t blocks]} all-blocks
         blocks* (replace-db-id-with-temp-id blocks)
         blocks-with-page-id (fill-block-fields blocks*)]
     (<? (p->c (persist-db/<new repo)))
     (<? (p->c (persist-db/<transact-data repo blocks-with-page-id nil)))
     (<? (p->c (persist-db/<release-access-handles repo)))
     (state/add-repo! {:url repo})
     (op-mem-layer/update-local-tx! repo t))))

(defn <download-graph
  [state repo graph-uuid]
  (go-try
   (let [{:keys [url]}
         (with-sub-data-from-ws state
           (<send! state {:req-id (get-req-id) :action "full-download-graph" :graph-uuid graph-uuid})
           (<! (get-result-ch)))
         {:keys [status body] :as r} (<! (http/get url))
         repo (str "logseq_db_rtc-" repo)]
     (if (not= 200 status)
       (ex-info "<download-graph failed" r)
       (let [all-blocks (transit/read transit-r body)]
         (op-mem-layer/init-empty-ops-store! repo)
         (<? (<transact-remote-all-blocks-to-sqlite all-blocks repo))
         (op-mem-layer/update-graph-uuid! repo graph-uuid)
         (prn ::download-graph repo (@@#'op-mem-layer/*ops-store repo))
         (<! (op-mem-layer/<sync-to-idb-layer! repo)))))))
