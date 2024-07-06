(ns frontend.worker.rtc.asset
  "Fns to sync assets.
  some notes:
  - block/type contains \"asset\"
  - block/content, store the asset name
  - an asset-block not having :file/path indicates need to download asset from server
  - an asset-block not having :logseq.property.asset/remote-metadata
    indicates need to upload the asset to server
  - if an asset-block doesn't have both :file/path and :logseq.property.asset/remote-metadata,
    it means the other client hasn't uploaded the asset to server
"
  (:require [datascript.core :as d]
            [frontend.worker.rtc.ws-util :as ws-util]
            [missionary.core :as m]
            [cljs-http.client :as http]
            [frontend.common.missionary-util :as c.m]
            [malli.core :as ma])
  (:import [missionary Cancelled]))

(defn get-all-asset-blocks
  [db]
  (->> (d/q
        '[:find (pull ?asset [*])
          :in $
          :where
          [?asset :block/uuid]
          [?asset :block/type "asset"]]
        db)
       (apply concat)))

(defn asset-block->upload+download-action
  [asset-block]
  (let [local-file-path (:file/path asset-block)
        remote-metadata (:logseq.property.asset/remote-metadata asset-block)]
    (cond
      (and local-file-path remote-metadata) nil
      (nil? local-file-path) :download
      (nil? remote-metadata) :upload)))

(defn get-action->asset-blocks
  [db]
  (reduce
   (fn [action->asset-blocks asset-block]
     (if-let [action (asset-block->upload+download-action asset-block)]
       (update action->asset-blocks action (fnil conj #{}) asset-block)
       action->asset-blocks))
   {} (get-all-asset-blocks db)))

(defn new-task--upload-assets
  [get-ws-create-task conn graph-uuid asset-uuids]
  (m/sp
    (when (seq asset-uuids)
      (let [asset-uuid->url (->> (m/? (ws-util/send&recv get-ws-create-task {:action "get-assets-upload-urls"
                                                                             :graph-uuid graph-uuid
                                                                             :asset-uuids asset-uuids}))
                                 :asset-uuid->url)]
        (doseq [[asset-uuid put-url] asset-uuid->url]
          (assert (uuid? asset-uuid) asset-uuid)
          (let [{:keys [status] :as r}
                (m/? (c.m/<! (http/put put-url {:headers {"x-amz-meta-checksum" "TEST"}
                                                :body (js/JSON.stringify
                                                       (clj->js {:TEST-ASSET true
                                                                 :asset-uuid (str asset-uuid)
                                                                 :graph-uuid (str graph-uuid)}))
                                                :with-credentials? false})))]
            (if (not= 200 status)
              (prn :debug-failed-upload-asset {:resp r :asset-uuid asset-uuid :graph-uuid graph-uuid})

              (when (some? (d/entity @conn [:block/uuid asset-uuid]))
                (d/transact! conn [{:block/uuid asset-uuid
                                    :logseq.property.asset/remote-metadata {:checksum "TEST"}}])))))))))

(defn new-task--download-assets
  [get-ws-create-task conn graph-uuid asset-uuids]
  (m/sp
    (when (seq asset-uuids)
      (let [asset-uuid->url (->> (m/? (ws-util/send&recv get-ws-create-task {:action "get-assets-download-urls"
                                                                             :graph-uuid graph-uuid
                                                                             :asset-uuids asset-uuids}))
                                 :asset-uuid->url)]
        (doseq [[asset-uuid get-url] asset-uuid->url]
          (assert (uuid? asset-uuid) asset-uuid)
          (let [{:keys [status _body] :as r} (m/? (c.m/<! (http/get get-url {:with-credentials? false})))]
            (if (not= 200 status)
              (prn :debug-failed-download-asset {:resp r :asset-uuid asset-uuid :graph-uuid graph-uuid})
              (when (d/entity @conn [:block/uuid asset-uuid])
                (d/transact! conn [{:block/uuid asset-uuid
                                    :file/path "TEST-FILE-PATH"}])
                (prn :debug-succ-download-asset asset-uuid)))))))))

(defonce ^:private *assets-sync-lock (atom nil))
(defn- holding-assets-sync-lock
  "Use this to prevent multiple assets-sync loops at same time."
  [started-dfv task]
  (m/sp
    (when-not (compare-and-set! *assets-sync-lock nil true)
      (let [e (ex-info "Must not run multiple assets-sync loops"
                       {:type :assets-sync.exception/lock-failed
                        :missionary/retry true})]
        (started-dfv e)
        (throw e)))
    (try
      (m/? task)
      (finally
        (reset! *assets-sync-lock nil)))))

(def ^:private asset-change-event-schema
  [:map-of
   [:enum :download :upload]
   [:sequential :uuid]])

(def ^:private asset-change-event-validator (ma/validator asset-change-event-schema))

(defonce *global-asset-change-event (atom nil :validator asset-change-event-validator))

(defonce ^:private global-asset-change-event-flow
  (m/buffer 20 (m/watch *global-asset-change-event)))

(defn- create-assets-sync-loop
  [get-ws-create-task graph-uuid repo conn]
  (let [started-dfv         (m/dfv)
        asset-change-event-flow global-asset-change-event-flow]
    {:assets-sync-loop-task
     (holding-assets-sync-lock
      started-dfv
      (m/sp
       (try
         (started-dfv true)
         (let [event (m/?> asset-change-event-flow)]

           )
         (catch Cancelled e
           ;; TODO: add log
           (throw e)))))}))
(comment
  (def x (atom 1))
  (def f (m/ap
           (let [r (m/?> (m/buffer 10 (m/watch x)))]
             (m/? (m/sleep 2000))
             r)))

  (def cancel ((m/reduce (fn [r e] (prn :e e)) f) prn prn)))
