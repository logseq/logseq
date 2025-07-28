(ns frontend.worker.rtc.asset
  "Fns to sync assets.
  some notes:
  - has :logseq.property.asset/type, :logseq.property.asset/size, :logseq.property.asset/checksum
  - block/title, store the asset name
  - an asset-block not having :logseq.property.asset/remote-metadata
    indicates need to upload the asset to server"
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [frontend.common.missionary :as c.m]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [frontend.worker.rtc.ws-util :as ws-util]
            [frontend.worker.state :as worker-state]
            [logseq.common.path :as path]
            [malli.core :as ma]
            [missionary.core :as m])
  (:import [missionary Cancelled]))

(defn- create-local-updates-check-flow
  "Return a flow that emits value if need to push local-updates"
  [repo *auto-push? interval-ms]
  (let [auto-push-flow (m/watch *auto-push?)
        clock-flow (c.m/clock interval-ms :clock)
        merge-flow (m/latest vector auto-push-flow clock-flow)]
    (m/eduction (filter first)
                (map second)
                (filter (fn [v] (when (pos? (client-op/get-unpushed-asset-ops-count repo)) v)))
                merge-flow)))

(def ^:private remote-asset-updates-schema
  [:sequential
   [:map {:closed true}
    [:op [:enum :update-asset :remove-asset]]
    [:block/uuid :uuid]
    [:malli.core/default [:map-of :keyword :any]]]])

(def ^:private *remote-asset-updates (atom nil :validator (ma/validator remote-asset-updates-schema)))
(def ^:private remote-asset-updates-flow (m/buffer 10 (m/watch *remote-asset-updates)))

(comment
  (def cancel ((m/reduce (fn [_ v] (prn :v v)) remote-asset-updates-flow) prn prn)))

(defn- new-task--get-asset-file-metadata
  "Return nil if this asset not exist"
  [repo block-uuid asset-type]
  (m/sp
    (c.m/<?
     (worker-state/<invoke-main-thread :thread-api/get-asset-file-metadata
                                       repo (str block-uuid) asset-type))))

(defn- remote-block-ops=>remote-asset-ops
  [db-before db-after remove-ops update-ops]
  (concat
   (keep
    (fn [remove-op]
      (let [block-uuid (:block-uuid remove-op)]
        (when-let [ent (d/entity db-before [:block/uuid block-uuid])]
          (when-let [asset-type (:logseq.property.asset/type ent)]
            {:op :remove-asset
             :block/uuid block-uuid
             :logseq.property.asset/type asset-type}))))
    remove-ops)
   (keep
    (fn [update-op]
      (let [block-uuid (:self update-op)]
        (when-let [ent (d/entity db-after [:block/uuid block-uuid])]
          (let [remote-metadata (:logseq.property.asset/remote-metadata ent)
                checksum (:logseq.property.asset/checksum ent)
                asset-type (:logseq.property.asset/type ent)]
            (when (and remote-metadata checksum asset-type)
              {:op :update-asset
               :block/uuid block-uuid})))))
    update-ops)))

(defn emit-remote-asset-updates-from-block-ops
  [db-before db-after remove-ops update-ops]
  (when-let [asset-update-ops
             (not-empty (remote-block-ops=>remote-asset-ops db-before db-after remove-ops update-ops))]
    (reset! *remote-asset-updates asset-update-ops)))

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

(defn- clean-asset-ops!
  [repo all-asset-uuids handled-asset-uuids]
  (doseq [asset-uuid (set/difference (set all-asset-uuids) (set handled-asset-uuids))]
    (client-op/remove-asset-op repo asset-uuid)))

(defn- new-task--concurrent-download-assets
  "Concurrently download assets with limited max concurrent count"
  [repo asset-uuid->url asset-uuid->asset-type]
  (->> (fn [[asset-uuid url]]
         (m/sp
           (let [r (c.m/<?
                    (worker-state/<invoke-main-thread :thread-api/rtc-download-asset
                                                      repo (str asset-uuid)
                                                      (get asset-uuid->asset-type asset-uuid) url))]
             (when-let [edata (:ex-data r)]
               ;; if download-url return 404, ignore this asset
               (when (not= 404 (:status (:data edata)))
                 (throw (ex-info "download asset failed" r)))))))
       (c.m/concurrent-exec-flow 5 (m/seed asset-uuid->url))
       (m/reduce (constantly nil))))

(defn- new-task--concurrent-upload-assets
  "Concurrently upload assets with limited max concurrent count"
  [repo conn asset-uuid->url asset-uuid->asset-type+checksum]
  (->> (fn [[asset-uuid url]]
         (m/sp
           (let [[asset-type checksum] (get asset-uuid->asset-type+checksum asset-uuid)
                 r (c.m/<?
                    (worker-state/<invoke-main-thread :thread-api/rtc-upload-asset
                                                      repo (str asset-uuid) asset-type checksum url))]
             (when (:ex-data r)
               (throw (ex-info "upload asset failed" r)))
             (d/transact! conn
                          [{:block/uuid asset-uuid
                            :logseq.property.asset/remote-metadata {:checksum checksum :type asset-type}}]
                       ;; Don't generate rtc ops again, (block-ops & asset-ops)
                          {:persist-op? false})
             (client-op/remove-asset-op repo asset-uuid))))
       (c.m/concurrent-exec-flow 3 (m/seed asset-uuid->url))
       (m/reduce (constantly nil))))

(defn- new-task--push-local-asset-updates
  [repo get-ws-create-task conn graph-uuid major-schema-version add-log-fn]
  (m/sp
    (when-let [asset-ops (not-empty (client-op/get-all-asset-ops repo))]
      (let [upload-asset-uuids (keep
                                (fn [asset-op]
                                  (when (contains? asset-op :update-asset)
                                    (:block/uuid asset-op)))
                                asset-ops)
            remove-asset-uuids (keep
                                (fn [asset-op]
                                  (when (contains? asset-op :remove-asset)
                                    (:block/uuid asset-op)))
                                asset-ops)
            asset-uuid->asset-type+checksum
            (into {}
                  (keep
                   (fn [asset-uuid]
                     (let [ent (d/entity @conn [:block/uuid asset-uuid])]
                       (when-let [tp (:logseq.property.asset/type ent)]
                         (when-let [checksum (:logseq.property.asset/checksum ent)]
                           [asset-uuid [tp checksum]])))))
                  upload-asset-uuids)
            asset-uuid->url
            (when (seq asset-uuid->asset-type+checksum)
              (->> (m/? (ws-util/send&recv get-ws-create-task
                                           {:action "get-assets-upload-urls"
                                            :graph-uuid graph-uuid
                                            :asset-uuid->metadata
                                            (into {}
                                                  (map (fn [[asset-uuid [asset-type checksum]]]
                                                         [asset-uuid {"checksum" checksum "type" asset-type}]))
                                                  asset-uuid->asset-type+checksum)}))
                   :asset-uuid->url))]
        (when (seq asset-uuid->url)
          (add-log-fn :rtc.asset.log/upload-assets {:asset-uuids (keys asset-uuid->url)}))
        (m/? (new-task--concurrent-upload-assets repo conn asset-uuid->url asset-uuid->asset-type+checksum))
        (when (seq remove-asset-uuids)
          (add-log-fn :rtc.asset.log/remove-assets {:asset-uuids remove-asset-uuids})
          (m/? (ws-util/send&recv get-ws-create-task
                                  {:action "delete-assets"
                                   :graph-uuid graph-uuid
                                   :schema-version (str major-schema-version)
                                   :asset-uuids remove-asset-uuids}))
          (doseq [asset-uuid remove-asset-uuids]
            (client-op/remove-asset-op repo asset-uuid)))
        (clean-asset-ops! repo
                          (map :block/uuid asset-ops)
                          (concat (keys asset-uuid->url) remove-asset-uuids))))))

(defn- new-task--pull-remote-asset-updates
  [repo get-ws-create-task conn graph-uuid add-log-fn asset-update-ops]
  (m/sp
    (when (seq asset-update-ops)
      (let [update-asset-uuids (keep (fn [op]
                                       (when (= :update-asset (:op op))
                                         (:block/uuid op)))
                                     asset-update-ops)
            remove-asset-uuid->asset-type
            (into {} (keep (fn [op]
                             (when (= :remove-asset (:op op))
                               [(:block/uuid op) (:logseq.property.asset/type op)])))
                  asset-update-ops)
            asset-uuid->asset-type (into {}
                                         (keep (fn [asset-uuid]
                                                 (when-let [ent (d/entity @conn [:block/uuid asset-uuid])]
                                                   (let [asset-type (:logseq.property.asset/type ent)]
                                                     [asset-uuid asset-type]))))
                                         update-asset-uuids)
            asset-uuid->url
            (when-let [asset-uuids
                       (->> asset-uuid->asset-type
                            (map
                             (fn [[asset-uuid asset-type]]
                               (m/sp
                                 (when (nil? (m/? (new-task--get-asset-file-metadata repo asset-uuid asset-type)))
                                   asset-uuid))))
                            (apply m/join vector)
                            m/?
                            (remove nil?))]
              (->> (m/? (ws-util/send&recv get-ws-create-task
                                           {:action "get-assets-download-urls"
                                            :graph-uuid graph-uuid
                                            :asset-uuids asset-uuids}))
                   :asset-uuid->url))]
        (doseq [[asset-uuid asset-type] remove-asset-uuid->asset-type]
          (c.m/<? (worker-state/<invoke-main-thread :thread-api/unlink-asset
                                                    repo (str asset-uuid) asset-type)))
        (when (seq asset-uuid->url)
          (add-log-fn :rtc.asset.log/download-assets {:asset-uuids (keys asset-uuid->url)}))
        (m/? (new-task--concurrent-download-assets repo asset-uuid->url asset-uuid->asset-type))))))

(defn- get-all-asset-blocks
  [db]
  (d/q '[:find [(pull ?b [:block/uuid
                          :logseq.property.asset/type
                          :logseq.property.asset/checksum])
                ...]
         :where
         [?b :block/uuid]
         [?b :logseq.property.asset/type]]
       db))

(defn- new-task--initial-download-missing-assets
  [repo get-ws-create-task graph-uuid conn add-log-fn]
  (m/sp
    (let [local-all-asset-file-paths
          (c.m/<? (worker-state/<invoke-main-thread :thread-api/get-all-asset-file-paths repo))
          local-all-asset-file-uuids (set (map (comp parse-uuid path/file-stem) local-all-asset-file-paths))
          local-all-asset-uuids (set (map :block/uuid (get-all-asset-blocks @conn)))]
      (when-let [asset-update-ops
                 (not-empty
                  (map (fn [asset-uuid] {:op :update-asset :block/uuid asset-uuid})
                       (set/difference local-all-asset-uuids local-all-asset-file-uuids)))]
        (add-log-fn :rtc.asset.log/initial-download-missing-assets {:count (count asset-update-ops)})
        (m/? (new-task--pull-remote-asset-updates
              repo get-ws-create-task conn graph-uuid add-log-fn asset-update-ops))))))

(defn create-assets-sync-loop
  [repo get-ws-create-task graph-uuid major-schema-version conn *auto-push?]
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
          (m/? (new-task--initial-download-missing-assets repo get-ws-create-task graph-uuid conn add-log-fn))
          (->>
           (let [event (m/?> mixed-flow)]
             (case (:type event)
               :remote-updates
               (when-let [asset-update-ops (not-empty (:value event))]
                 (m/? (new-task--pull-remote-asset-updates
                       repo get-ws-create-task conn graph-uuid add-log-fn asset-update-ops)))
               :local-update-check
               (m/? (new-task--push-local-asset-updates
                     repo get-ws-create-task conn graph-uuid major-schema-version add-log-fn))))
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
