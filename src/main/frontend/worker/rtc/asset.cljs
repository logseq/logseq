(ns frontend.worker.rtc.asset
  "Fns to sync assets.
  some notes:
  - has :logseq.property.asset/type
  - block/content, store the asset name
  - an asset-block not having :file/path indicates need to download asset from server
  - an asset-block not having :logseq.property.asset/remote-metadata
    indicates need to upload the asset to server
  - if an asset-block doesn't have both :file/path and :logseq.property.asset/remote-metadata,
    it means the other client hasn't uploaded the asset to server
"
  (:require [cljs-http.client :as http]
            [datascript.core :as d]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [frontend.worker.rtc.ws-util :as ws-util]
            [logseq.db :as ldb]
            [malli.core :as ma]
            [missionary.core :as m])
  (:import [missionary Cancelled]))

(defn get-all-asset-blocks
  [db]
  (->> (d/q
        '[:find (pull ?asset [*])
          :in $
          :where
          [?asset :block/uuid]
          [?asset :logseq.property.asset/type]]
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
  {:pre [(every? uuid? asset-uuids)]}
  (m/sp
   (when (seq asset-uuids)
     (let [asset-uuid->url (->> (m/? (ws-util/send&recv get-ws-create-task
                                                        {:action "get-assets-upload-urls"
                                                         :graph-uuid graph-uuid
                                                         :asset-uuid->metadata
                                                         (into {}
                                                               (map (fn [asset-uuid] [asset-uuid {"checksum" "TEST-CHECKSUM"}]))
                                                               asset-uuids)}))
                                :asset-uuid->url)]
       (doseq [[asset-uuid put-url] asset-uuid->url]
         (assert (uuid? asset-uuid) asset-uuid)
         (let [{:keys [status] :as r}
               (c.m/<? (http/put put-url {:headers {"x-amz-meta-checksum" "TEST-CHECKSUM"}
                                          :body (js/JSON.stringify
                                                 (clj->js {:TEST-ASSET true
                                                           :asset-uuid (str asset-uuid)
                                                           :graph-uuid (str graph-uuid)}))
                                          :with-credentials? false}))]
           (if (not= 200 status)
             (prn :debug-failed-upload-asset {:resp r :asset-uuid asset-uuid :graph-uuid graph-uuid})

             (when (some? (d/entity @conn [:block/uuid asset-uuid]))
               (d/transact! conn [{:block/uuid asset-uuid
                                   :logseq.property.asset/remote-metadata {:checksum "TEST"}}])))))))))

(defn new-task--download-assets
  [get-ws-create-task conn graph-uuid asset-uuids]
  {:pre [(every? uuid? asset-uuids)]}
  (m/sp
   (when (seq asset-uuids)
     (let [asset-uuid->url
           (->> (m/? (ws-util/send&recv get-ws-create-task {:action "get-assets-download-urls"
                                                            :graph-uuid graph-uuid
                                                            :asset-uuids asset-uuids}))
                :asset-uuid->url)]
       (doseq [[asset-uuid get-url] asset-uuid->url]
         (assert (uuid? asset-uuid) asset-uuid)
         (let [{:keys [status _body] :as r} (c.m/<? (http/get get-url {:with-credentials? false}))]
           (if (not= 200 status)
             (prn :debug-failed-download-asset {:resp r :asset-uuid asset-uuid :graph-uuid graph-uuid})
             (when (d/entity @conn [:block/uuid asset-uuid])
               (d/transact! conn [{:block/uuid asset-uuid
                                   :file/path "TEST-FILE-PATH"}])
               (prn :debug-succ-download-asset asset-uuid)))))))))

(defn- create-local-updates-check-flow
  "Return a flow that emits value if need to push local-updates"
  [repo *auto-push? interval-ms]
  (let [auto-push-flow (m/watch *auto-push?)
        clock-flow (c.m/clock interval-ms :clock)
        merge-flow (m/latest vector auto-push-flow clock-flow)]
    (m/eduction (filter first)
                (map second)
                (filter (fn [v] (when (client-op/get-unpushed-asset-ops-count repo) v)))
                merge-flow)))

(def ^:private remote-asset-updates-schema
  [:sequential
   [:map {:closed true}
    [:op [:enum :update-asset :remove-asset]]
    [:malli.core/default [:map-of :keyword :any]]]])

(def ^:private *remote-asset-updates (atom nil :validator (ma/validator remote-asset-updates-schema)))
(def ^:private remote-asset-updates-flow (m/buffer 10 (m/watch *remote-asset-updates)))

(comment
  (def cancel ((m/reduce (fn [_ v] (prn :v v)) remote-asset-updates-flow) prn prn)))

(defn- remote-block-ops=>remote-asset-ops
  [db-after db-before update-ops remove-ops]
  {:update-asset-ops
   (keep
    (fn [update-op]
      (let [block-uuid (:self update-op)
            asset-checksum (some-> (first (:logseq.property.asset/checksum update-op))
                                   ldb/read-transit-str)]
        (when asset-checksum
          (when-let [ent (d/entity db-after [:block/uuid block-uuid])]
            (let [local-checksum (:logseq.property.asset/checksum ent)]
              (when (or (and local-checksum (not= local-checksum asset-checksum))
                        (nil? local-checksum))
                (apply conj {:block/uuid block-uuid}
                       (keep (fn [[k v]]
                               (when (= "logseq.property.asset" (namespace k))
                                 [k (ldb/read-transit-str (first v))]))
                             update-op))))))))
    update-ops)
   :remove-asset-ops
   (keep
    (fn [remove-op]
      (let [block-uuid (:block-uuid remove-op)]
        (when-let [ent (d/entity db-before [:block/uuid block-uuid])]
          (when (:logseq.property.asset/checksum ent)
            {:block/uuid block-uuid}))))
    remove-ops)})

(defn emit-remote-asset-updates!
  [db-after db-before update-ops remove-ops]
  (let [{:keys [update-asset-ops remove-asset-ops]}
        (remote-block-ops=>remote-asset-ops db-after db-before update-ops remove-ops)]
    (when-let [remote-asset-updates-ops (not-empty (concat update-asset-ops remove-asset-ops))]
      (reset! *remote-asset-updates remote-asset-updates-ops))))

(defn- create-mixed-flow
  "Return a flow that emits different events:
  - `:local-update-check`: event to notify check if there're some new local-updates on assets
  - `:remote-updates`: remote asset updates "
  [repo *auto-push?]
  (let [remote-update-flow (m/eduction
                            (map (fn [v] {:type :remote-updates :value v}))
                            remote-asset-updates-flow)
        local-update-check-flow (m/eduction
                                 (map (fn [v] {:type :local-update-check :value v}))
                                 (create-local-updates-check-flow repo *auto-push? 2500))]
    (c.m/mix remote-update-flow local-update-check-flow)))

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

(defn- new-task--push-local-asset-updates
  [repo db graph-uuid add-log-fn]
  (m/sp
    (let [asset-ops (client-op/get&remove-all-asset-ops repo)]
      ;; TODO: upload local-assets to remote
      )))

(defn create-assets-sync-loop
  [repo get-ws-create-task graph-uuid conn *auto-push?]
  (let [started-dfv         (m/dfv)
        add-log-fn (fn [type message]
                     (assert (map? message) message)
                     (rtc-log-and-state/rtc-log type (assoc message :graph-uuid graph-uuid)))
        mixed-flow (create-mixed-flow repo *auto-push?)]
    {:onstarted-task started-dfv
     :assets-sync-loop-task
     (holding-assets-sync-lock
      started-dfv
      (m/sp
        (try
          (started-dfv true)
          (->>
           (let [event (m/?> mixed-flow)]
             (case (:type event)
               :remote-updates nil
               :local-update-check
               (m/? (new-task--push-local-asset-updates repo @conn graph-uuid add-log-fn))))
           m/ap
           (m/reduce {} nil)
           m/?)

         (catch Cancelled e
           (add-log-fn :rtc.asset.log/cancelled {})
           (throw e)))))}))

(comment
  (def x (atom 1))
  (def f (m/ap
          (let [r (m/?> (m/buffer 10 (m/watch x)))]
            (m/? (m/sleep 2000))
            r)))

  (def cancel ((m/reduce (fn [r e] (prn :e e)) f) prn prn)))
