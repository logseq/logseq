(ns frontend.worker.worker-sync
  "Simple worker-sync client based on promesa + WebSocket."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(defn- enabled?
  []
  (true? (:enabled? @worker-state/*worker-sync-config)))

(defn- ws-base-url
  []
  (:ws-url @worker-state/*worker-sync-config))

(defn- http-base-url
  []
  (or (:http-base @worker-state/*worker-sync-config)
      (when-let [ws-url (ws-base-url)]
        (let [base (cond
                     (string/starts-with? ws-url "wss://")
                     (str "https://" (subs ws-url (count "wss://")))

                     (string/starts-with? ws-url "ws://")
                     (str "http://" (subs ws-url (count "ws://")))

                     :else ws-url)]
          (string/replace base #"/sync/%s$" "")))))

(def ^:private max-asset-size (* 100 1024 1024))

(defn- format-ws-url [base graph-id]
  (cond
    (string/includes? base "%s")
    (string/replace base "%s" graph-id)

    (string/ends-with? base "/")
    (str base graph-id)

    :else
    (str base "/" graph-id)))

(defn- get-graph-id [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          graph-uuid (ldb/get-graph-rtc-uuid db)
          local-uuid (ldb/get-graph-local-uuid db)
          new-local (when (and (nil? graph-uuid) (nil? local-uuid))
                      (random-uuid))]
      (when new-local
        (try
          (d/transact! conn [(sqlite-util/kv :logseq.kv/local-graph-uuid new-local)])
          (catch :default e
            (log/error :worker-sync/graph-uuid-write-failed {:error e}))))
      (or (some-> graph-uuid str)
          (some-> (or local-uuid new-local) str)
          (when (string? repo) repo)))))

(defn- ensure-client-graph-uuid! [repo graph-id]
  (when (seq graph-id)
    (client-op/update-graph-uuid repo graph-id)))

(defn- ready-state [ws]
  (.-readyState ws))

(defn- ws-open? [ws]
  (= 1 (ready-state ws)))

(defn- send! [ws message]
  (when (ws-open? ws)
    (.send ws (js/JSON.stringify (clj->js message)))))

(defn- normalize-tx-data [db-after db-before tx-data]
  (->> tx-data
       (remove (fn [[_e a _v _t _added]]
                 (contains? #{:block/tx-id :logseq.property/created-by-ref
                              :logseq.property.embedding/hnsw-label-updated-at} a)))
       (common-util/distinct-by-last-wins (fn [[e a v tx _added]] [e a v tx]))
       (db-normalize/normalize-tx-data db-after db-before)))

(defn- parse-message [raw]
  (try
    (js->clj (js/JSON.parse raw) :keywordize-keys true)
    (catch :default _
      nil)))

(defn- update-server-t! [client t]
  (when (number? t)
    (reset! (:server-t client) t)))

(def ^:private asset-update-attrs
  #{:logseq.property.asset/remote-metadata
    :logseq.property.asset/type
    :logseq.property.asset/checksum})

(defn- asset-uuids-from-tx [db tx-data]
  (->> tx-data
       (keep (fn [datom]
               (when (and (:added datom)
                          (contains? asset-update-attrs (:a datom)))
                 (when-let [ent (d/entity db (:e datom))]
                   (some-> (:block/uuid ent) str)))))
       (distinct)))

(declare enqueue-asset-downloads!)

(defn- apply-remote-tx! [repo client tx-data]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (try
      (let [tx-data' (db-normalize/de-normalize-tx-data @conn tx-data)
            tx-report (d/transact! conn tx-data' {:worker-sync/remote? true})
            db-after (:db-after tx-report)
            asset-uuids (asset-uuids-from-tx db-after (:tx-data tx-report))]
        (when (seq asset-uuids)
          (enqueue-asset-downloads! repo client asset-uuids)))
      (catch :default e
        (log/error :worker-sync/apply-remote-tx-failed {:error e})))))

(defn- reconcile-cycle! [repo attr server_values]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          tx-data (reduce
                   (fn [acc [eid value]]
                     (let [entity (d/entity db eid)
                           current (:db/id (get entity attr))]
                       (cond
                         (nil? entity) acc
                         (nil? value)
                         (if current
                           (conj acc [:db/retract eid attr current])
                           acc)
                         :else
                         (conj acc [:db/add eid attr value]))))
                   []
                   server_values)]
      (when (seq tx-data)
        (d/transact! conn tx-data {:worker-sync/remote? true})))))

(declare flush-pending!)
(declare remove-pending-txs!)

(declare enqueue-asset-sync!)
(declare enqueue-asset-initial-download!)
(defn- handle-message! [repo client raw]
  (when-let [message (parse-message raw)]
    (case (:type message)
      "hello" (do
                (update-server-t! client (:t message))
                (send! (:ws client) {:type "pull" :since @(:server-t client)})
                (enqueue-asset-sync! repo client)
                (enqueue-asset-initial-download! repo client)
                (flush-pending! repo client))
      "tx/ok" (do
                (update-server-t! client (:t message))
                (remove-pending-txs! repo @(:inflight client))
                (reset! (:inflight client) [])
                (flush-pending! repo client))
      "tx/batch/ok" (do
                      (update-server-t! client (:t message))
                      (remove-pending-txs! repo @(:inflight client))
                      (reset! (:inflight client) [])
                      (flush-pending! repo client))
      "changed" (let [t (:t message)]
                  (when (and (number? t) (< @(:server-t client) t))
                    (send! (:ws client) {:type "pull" :since @(:server-t client)})))
      "tx/reject" (do
                    (when (= "stale" (:reason message))
                      (update-server-t! client (:t message)))
                    (if-let [index (:index message)]
                      (let [inflight @(:inflight client)
                            succeeded (subvec inflight 0 (min index (count inflight)))]
                        (remove-pending-txs! repo succeeded)
                        (when-not (= "stale" (:reason message))
                          (let [failure (when (< index (count inflight)) [(nth inflight index)])]
                            (remove-pending-txs! repo failure))))
                      (when-not (= "stale" (:reason message))
                        (remove-pending-txs! repo @(:inflight client))))
                    (reset! (:inflight client) [])
                    (when (= "cycle" (:reason message))
                      (let [{:keys [attr server_values]} (sqlite-util/read-transit-str (:data message))]
                        (reconcile-cycle! repo attr server_values)))
                    (flush-pending! repo client))
      "pull/ok" (do
                  (update-server-t! client (:t message))
                  (doseq [{:keys [tx]} (:txs message)]
                    (when tx
                      (apply-remote-tx! repo client (sqlite-util/read-transit-str tx)))))
      "snapshot/ok" (update-server-t! client (:t message))
      nil)))

(defn- ensure-client-state! [repo]
  (or (get @worker-state/*worker-sync-clients repo)
      (let [client {:repo repo
                    :server-t (atom 0)
                    :send-queue (atom (p/resolved nil))
                    :asset-queue (atom (p/resolved nil))
                    :inflight (atom [])}]
        (swap! worker-state/*worker-sync-clients assoc repo client)
        client)))

(defn- asset-url [base graph-id asset-uuid asset-type]
  (str base "/assets/" graph-id "/" asset-uuid "." asset-type))

(defn- enqueue-asset-task! [client task]
  (when-let [queue (:asset-queue client)]
    (swap! queue
           (fn [prev]
             (p/then prev (fn [_] (task)))))))

(defn- asset-type-from-files
  [repo asset-uuid]
  (p/let [paths (worker-state/<invoke-main-thread :thread-api/get-all-asset-file-paths repo)]
    (some (fn [path]
            (let [stem (path/file-stem path)
                  ext (path/file-ext path)]
              (when (and (seq stem) (seq ext) (= stem (str asset-uuid)))
                ext)))
          paths)))

(defn- delete-remote-asset!
  [repo graph-id asset-uuid asset-type]
  (let [base (http-base-url)]
    (if (and (seq base) (seq graph-id) (seq asset-type))
      (p/let [url (asset-url base graph-id (str asset-uuid) asset-type)
              resp (js/fetch url #js {:method "DELETE"})]
        (when-not (.-ok resp)
          (log/error :worker-sync/asset-delete-failed {:repo repo
                                                       :asset-uuid asset-uuid
                                                       :status (.-status resp)})))
      (log/info :worker-sync/asset-delete-skipped {:repo repo
                                                   :asset-uuid asset-uuid
                                                   :reason :missing-base-or-type}))))

(defn- upload-remote-asset!
  [repo graph-id asset-uuid asset-type checksum]
  (let [base (http-base-url)]
    (if (and (seq base) (seq graph-id) (seq asset-type) (seq checksum))
      (worker-state/<invoke-main-thread :thread-api/rtc-upload-asset
                                        repo nil (str asset-uuid) asset-type checksum
                                        (asset-url base graph-id (str asset-uuid) asset-type))
      (p/rejected (ex-info "missing asset upload info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :checksum checksum
                            :base base
                            :graph-id graph-id})))))

(defn- download-remote-asset!
  [repo graph-id asset-uuid asset-type]
  (let [base (http-base-url)]
    (if (and (seq base) (seq graph-id) (seq asset-type))
      (worker-state/<invoke-main-thread :thread-api/rtc-download-asset
                                        repo nil (str asset-uuid) asset-type
                                        (asset-url base graph-id (str asset-uuid) asset-type))
      (p/rejected (ex-info "missing asset download info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :base base
                            :graph-id graph-id})))))

(defn- process-asset-op!
  [repo graph-id asset-op]
  (let [asset-uuid (:block/uuid asset-op)]
    (cond
      (contains? asset-op :update-asset)
      (if-let [conn (worker-state/get-datascript-conn repo)]
        (let [ent (d/entity @conn [:block/uuid asset-uuid])
              asset-type (:logseq.property.asset/type ent)
              checksum (:logseq.property.asset/checksum ent)
              size (:logseq.property.asset/size ent 0)]
          (cond
            (or (nil? ent) (nil? asset-type) (nil? checksum))
            (do
              (client-op/remove-asset-op repo asset-uuid)
              (p/resolved nil))

            (> size max-asset-size)
            (do
              (log/info :worker-sync/asset-too-large {:repo repo
                                                      :asset-uuid asset-uuid
                                                      :size size})
              (client-op/remove-asset-op repo asset-uuid)
              (p/resolved nil))

            :else
            (-> (upload-remote-asset! repo graph-id asset-uuid asset-type checksum)
                (p/then (fn [_]
                          (when (d/entity @conn [:block/uuid asset-uuid])
                            (ldb/transact!
                             conn
                             [{:block/uuid asset-uuid
                               :logseq.property.asset/remote-metadata {:checksum checksum :type asset-type}}]
                             {:persist-op? false}))
                          (client-op/remove-asset-op repo asset-uuid)))
                (p/catch (fn [e]
                           (case (:type (ex-data e))
                             :rtc.exception/read-asset-failed
                             (client-op/remove-asset-op repo asset-uuid)

                             :rtc.exception/upload-asset-failed
                             nil

                             (log/error :worker-sync/asset-upload-failed
                                        {:repo repo
                                         :asset-uuid asset-uuid
                                         :error e})))))))
        (p/resolved nil))

      (contains? asset-op :remove-asset)
      (-> (p/let [conn (worker-state/get-datascript-conn repo)
                  ent (when conn (d/entity @conn [:block/uuid asset-uuid]))
                  asset-type (if (seq (:logseq.property.asset/type ent))
                               (:logseq.property.asset/type ent)
                               (asset-type-from-files repo asset-uuid))]
            (p/do!
             (when (seq asset-type)
               (delete-remote-asset! repo graph-id asset-uuid asset-type))
             (client-op/remove-asset-op repo asset-uuid)))
          (p/catch (fn [e]
                     (log/error :worker-sync/asset-delete-failed
                                {:repo repo
                                 :asset-uuid asset-uuid
                                 :error e}))))

      :else
      (p/resolved nil))))

(defn- process-asset-ops!
  [repo client]
  (let [graph-id (:graph-id client)
        asset-ops (not-empty (client-op/get-all-asset-ops repo))]
    (if (and (seq graph-id) asset-ops)
      (p/loop [ops asset-ops]
        (if (empty? ops)
          nil
          (p/do!
           (process-asset-op! repo graph-id (first ops))
           (p/recur (rest ops)))))
      (p/resolved nil))))

(defn- enqueue-asset-sync! [repo client]
  (enqueue-asset-task! client #(process-asset-ops! repo client)))

(defn- enqueue-asset-downloads!
  [repo client asset-uuids]
  (when (seq asset-uuids)
    (enqueue-asset-task! client
                         (fn []
                           (let [graph-id (:graph-id client)]
                             (if (seq graph-id)
                               (p/loop [uuids (distinct asset-uuids)]
                                 (if (empty? uuids)
                                   nil
                                   (let [asset-uuid (first uuids)
                                         conn (worker-state/get-datascript-conn repo)
                                         ent (when conn (d/entity @conn [:block/uuid asset-uuid]))
                                         asset-type (:logseq.property.asset/type ent)]
                                     (p/do!
                                      (when (seq asset-type)
                                        (p/let [meta (worker-state/<invoke-main-thread
                                                      :thread-api/get-asset-file-metadata
                                                      repo (str asset-uuid) asset-type)]
                                          (when (nil? meta)
                                            (download-remote-asset! repo graph-id asset-uuid asset-type))))
                                      (p/recur (rest uuids))))))
                               (p/resolved nil)))))))

(defn- enqueue-asset-initial-download!
  [repo client]
  (enqueue-asset-task! client
                       (fn []
                         (if-let [conn (worker-state/get-datascript-conn repo)]
                           (let [db @conn
                                 graph-id (:graph-id client)
                                 remote-assets (d/q '[:find ?uuid ?type
                                                      :where
                                                      [?e :block/uuid ?uuid]
                                                      [?e :logseq.property.asset/type ?type]
                                                      [?e :logseq.property.asset/remote-metadata]]
                                                    db)]
                             (if (seq graph-id)
                               (-> (p/let [paths (worker-state/<invoke-main-thread
                                                  :thread-api/get-all-asset-file-paths
                                                  repo)]
                                     (let [local-uuids (into #{}
                                                             (keep (fn [path]
                                                                     (let [stem (path/file-stem path)]
                                                                       (when (seq stem)
                                                                         stem))))
                                                             paths)
                                           missing (remove (fn [[uuid _type]]
                                                             (contains? local-uuids (str uuid)))
                                                           remote-assets)]
                                       (p/loop [entries missing]
                                         (if (empty? entries)
                                           nil
                                           (let [[asset-uuid asset-type] (first entries)]
                                             (p/do!
                                              (download-remote-asset! repo graph-id asset-uuid asset-type)
                                              (p/recur (rest entries))))))))
                                   (p/catch (fn [e]
                                              (log/error :worker-sync/asset-initial-download-failed
                                                         {:repo repo :error e}))))
                               (p/resolved nil)))
                           (p/resolved nil)))))

(defn- client-ops-conn [repo]
  (worker-state/get-client-ops-conn repo))

(defn- persist-local-tx! [repo tx-str]
  (when-let [conn (client-ops-conn repo)]
    (let [tx-id (random-uuid)
          now (.now js/Date)]
      (d/transact! conn [{:worker-sync/tx-id tx-id
                          :worker-sync/tx tx-str
                          :worker-sync/created-at now}])
      tx-id)))

(defn- pending-txs
  [repo limit]
  (when-let [conn (client-ops-conn repo)]
    (let [db @conn
          datoms (d/datoms db :avet :worker-sync/created-at)]
      (->> datoms
           (map (fn [datom]
                  (d/entity db (:e datom))))
           (keep (fn [ent]
                   (when-let [tx-id (:worker-sync/tx-id ent)]
                     {:tx-id tx-id
                      :tx (:worker-sync/tx ent)})))
           (take limit)
           (vec)))))

(defn- remove-pending-txs!
  [repo tx-ids]
  (when (seq tx-ids)
    (when-let [conn (client-ops-conn repo)]
      (d/transact! conn
                   (mapv (fn [tx-id]
                           [:db.fn/retractEntity [:worker-sync/tx-id tx-id]])
                         tx-ids)))))

(defn- flush-pending!
  [repo client]
  (let [inflight @(:inflight client)]
    (when (empty? inflight)
      (when-let [ws (:ws client)]
        (when (ws-open? ws)
          (let [batch (pending-txs repo 50)]
            (when (seq batch)
              (let [tx-ids (mapv :tx-id batch)
                    txs (mapv :tx batch)]
                (when (seq txs)
                  (reset! (:inflight client) tx-ids)
                  (send! ws {:type "tx/batch"
                             :t_before @(:server-t client)
                             :txs txs}))))))))))

(defn- attach-ws-handlers! [repo client ws]
  (set! (.-onmessage ws)
        (fn [event]
          (handle-message! repo client (.-data event))))
  (set! (.-onclose ws)
        (fn [_]
          (log/info :worker-sync/ws-closed {:repo repo}))))

(defn- start-pull-loop! [client ws]
  client)

(defn- stop-client! [client]
  (when-let [ws (:ws client)]
    (try
      (.close ws)
      (catch :default _
        nil))))

(defn- connect! [repo client url]
  (let [ws (js/WebSocket. url)
        updated (assoc client :ws ws)]
    (attach-ws-handlers! repo updated ws)
    (set! (.-onopen ws)
          (fn [_]
            (send! ws {:type "hello" :client repo})
            (enqueue-asset-sync! repo updated)
            (enqueue-asset-initial-download! repo updated)))
    (start-pull-loop! updated ws)))

(defn start!
  [repo]
  (if-not (enabled?)
    (p/resolved nil)
    (let [base (ws-base-url)
          graph-id (get-graph-id repo)]
      (if (and (string? base) (seq base) (seq graph-id))
        (let [client (ensure-client-state! repo)
              url (format-ws-url base graph-id)
              _ (ensure-client-graph-uuid! repo graph-id)
              connected (assoc client :graph-id graph-id)
              connected (connect! repo connected url)]
          (swap! worker-state/*worker-sync-clients assoc repo connected)
          (p/resolved nil))
        (do
          (log/info :worker-sync/start-skipped {:repo repo :graph-id graph-id :base base})
          (p/resolved nil))))))

(defn stop!
  ([] (doseq [[repo client] @worker-state/*worker-sync-clients]
        (stop-client! client)
        (swap! worker-state/*worker-sync-clients dissoc repo))
      (p/resolved nil))
  ([repo]
   (when-let [client (get @worker-state/*worker-sync-clients repo)]
     (stop-client! client)
     (swap! worker-state/*worker-sync-clients dissoc repo))
   (p/resolved nil)))

(defn enqueue-local-tx!
  [repo {:keys [tx-data db-after db-before]}]
  (let [conn (worker-state/get-datascript-conn repo)
        db (some-> conn deref)
        ;; FIXME: all ignored properties
        tx-data' (remove (fn [d] (contains? #{:logseq.property.embedding/hnsw-label-updated-at :block/tx-id} (:a d))) tx-data)]
    (when (and db (seq tx-data'))
      (let [normalized (normalize-tx-data db-after db-before tx-data')
            tx-str (sqlite-util/write-transit-str normalized)]
        (persist-local-tx! repo tx-str)
        (when-let [client (get @worker-state/*worker-sync-clients repo)]
          (let [send-queue (:send-queue client)]
            (swap! send-queue
                   (fn [prev]
                     (p/then prev
                             (fn [_]
                               (when-let [ws (:ws (get @worker-state/*worker-sync-clients repo))]
                                 (when (ws-open? ws)
                                   (flush-pending! repo client)))))))))))))

(defn handle-local-tx!
  [repo {:keys [tx-data tx-meta] :as tx-report}]
  (when (and (enabled?)
             (seq tx-data)
             (not (:worker-sync/remote? tx-meta))
             (not (:rtc-download-graph? tx-meta))
             (not (:from-disk? tx-meta)))
    (enqueue-local-tx! repo tx-report)
    (when-let [client (get @worker-state/*worker-sync-clients repo)]
      (enqueue-asset-sync! repo client))))
