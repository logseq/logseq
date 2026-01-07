(ns frontend.worker.worker-sync
  "Simple worker-sync client based on promesa + WebSocket."
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de :refer [Entity]]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(defn- enabled?
  []
  (true? (:enabled? @worker-state/*worker-sync-config)))

(defn- ws-base-url
  []
  (:ws-url @worker-state/*worker-sync-config))

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

(defn- ready-state [ws]
  (.-readyState ws))

(defn- ws-open? [ws]
  (= 1 (ready-state ws)))

(defn- send! [ws message]
  (when (ws-open? ws)
    (.send ws (js/JSON.stringify (clj->js message)))))

(defn- normalize-ref [db a value]
  (if (and (integer? value)
           (= :db.type/ref (:db/valueType (d/entity db a))))
    (if-let [id (:block/uuid (d/entity db value))]
      [:block/uuid id]
      (throw (ex-info (str "There's no :block/uuid for given refed value: " value)
                      {:value value})))
    value))

(defn- normalize-tx-data [db-after db-before tx-data]
  (->> tx-data
       (remove (fn [[e a v t added]]
                 (contains? #{:block/tx-id :logseq.property/created-by-ref
                              :logseq.property.embedding/hnsw-label-updated-at} a)))
       (map
        (fn [[e a v t added]]
          (let [v' (or (normalize-ref db-after a v) (normalize-ref db-before a v))]
            (if added
              [:db/add (- e) a v']
              (let [e' (if-let [id (or (:block/uuid (d/entity db-after e))
                                       (:block/uuid (d/entity db-before e)))]
                         [:block/uuid id]
                         (let [ident (or (:db/ident (d/entity db-after e))
                                         (:db/ident (d/entity db-before e)))]
                           (when-not ident
                             (throw (ex-info "Entity has no :block/uuid or :db/ident"
                                             {:data [e a v t added]})))
                           ident))]
                [:db/retract e' a v'])))))))

(defn- parse-message [raw]
  (try
    (js->clj (js/JSON.parse raw) :keywordize-keys true)
    (catch :default _
      nil)))

(defn- update-server-t! [client t]
  (when (number? t)
    (reset! (:server-t client) t)))

(defn- apply-remote-tx! [repo tx-data]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (try
      (d/transact! conn tx-data {:worker-sync/remote? true})
      (catch :default e
        (log/error :worker-sync/apply-remote-tx-failed {:error e})))))

(defn- reconcile-cycle! [repo attr server-values]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          tx-data (reduce
                   (fn [acc [entity-str value]]
                     (let [entity (reader/read-string entity-str)
                           eid (d/entid db entity)
                           current-raw (when eid (get (d/entity db eid) attr))
                           current (cond
                                     (and (= attr :block/parent) (instance? Entity current-raw))
                                     (when-let [parent-uuid (:block/uuid current-raw)]
                                       [:block/uuid parent-uuid])
                                     (and (= attr :logseq.property.class/extends) (instance? Entity current-raw))
                                     (:db/ident current-raw)
                                     :else current-raw)]
                       (cond
                         (nil? eid) acc
                         (nil? value)
                         (cond
                           (and current (sequential? current))
                           (conj acc [:db/retract eid attr current])

                           (some? current)
                           (conj acc [:db/retract eid attr current])

                           :else acc)

                         :else
                         (conj acc [:db/add eid attr value]))))
                   []
                   server-values)]
      (when (seq tx-data)
        (d/transact! conn tx-data {:worker-sync/remote? true})))))

(declare flush-pending!)
(declare remove-pending-txs!)
(defn- handle-message! [repo client raw]
  (when-let [message (parse-message raw)]
    (case (:type message)
      "hello" (do
                (update-server-t! client (:t message))
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
                      (let [attr (keyword (:attr message))
                            server-values (sqlite-util/read-transit-str (:server_values message))]
                        (reconcile-cycle! repo attr server-values)))
                    (flush-pending! repo client))
      "pull/ok" (do
                  (update-server-t! client (:t message))
                  (doseq [{:keys [tx]} (:txs message)]
                    (when tx
                      (apply-remote-tx! repo (sqlite-util/read-transit-str tx)))))
      "snapshot/ok" (update-server-t! client (:t message))
      nil)))

(defn- ensure-client-state! [repo]
  (or (get @worker-state/*worker-sync-clients repo)
      (let [client {:repo repo
                    :server-t (atom 0)
                    :send-queue (atom (p/resolved nil))
                    :inflight (atom [])}]
        (swap! worker-state/*worker-sync-clients assoc repo client)
        client)))

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
                (reset! (:inflight client) tx-ids)
                (send! ws {:type "tx/batch"
                           :t_before @(:server-t client)
                           :txs txs})))))))))

(defn- attach-ws-handlers! [repo client ws]
  (set! (.-onmessage ws)
        (fn [event]
          (handle-message! repo client (.-data event))))
  (set! (.-onclose ws)
        (fn [_]
          (log/info :worker-sync/ws-closed {:repo repo}))))

(defn- start-pull-loop! [client ws]
  (let [interval-id (js/setInterval
                     (fn []
                       (when (ws-open? ws)
                         (send! ws {:type "pull" :since @(:server-t client)})))
                     2000)]
    (assoc client :pull-interval-id interval-id)))

(defn- stop-client! [client]
  (when-let [interval-id (:pull-interval-id client)]
    (js/clearInterval interval-id))
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
            (send! ws {:type "hello" :client repo})))
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
              connected (connect! repo client url)]
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
        db (some-> conn deref)]
    (when db
      (let [normalized (normalize-tx-data db-after db-before tx-data)
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
    (enqueue-local-tx! repo tx-report)))
