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
          local-uuid (ldb/get-graph-local-uuid db)]
      (or (some-> graph-uuid str)
          (some-> local-uuid str)
          (when (string? repo) repo)))))

(defn- ready-state [ws]
  (.-readyState ws))

(defn- ws-open? [ws]
  (= 1 (ready-state ws)))

(defn- send! [ws message]
  (when (ws-open? ws)
    (.send ws (js/JSON.stringify (clj->js message)))))

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

(defn- handle-message! [repo client raw]
  (when-let [message (parse-message raw)]
    (case (:type message)
      "hello" (update-server-t! client (:t message))
      "tx/ok" (update-server-t! client (:t message))
      "tx/reject" (do
                    (when (= "stale" (:reason message))
                      (update-server-t! client (:t message)))
                    (when (= "cycle" (:reason message))
                      (let [attr (keyword (:attr message))
                            server-values (sqlite-util/read-transit-str (:server_values message))]
                        (reconcile-cycle! repo attr server-values))))
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
                    :send-queue (atom (p/resolved nil))}]
        (swap! worker-state/*worker-sync-clients assoc repo client)
        client)))

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
  [repo tx-data]
  (when-let [client (get @worker-state/*worker-sync-clients repo)]
    (let [send-queue (:send-queue client)
          normalized (mapv (fn [item]
                             (if (and (map? item) (contains? item :e) (contains? item :a))
                               (if (:added item)
                                 [:db/add (:e item) (:a item) (:v item)]
                                 [:db/retract (:e item) (:a item) (:v item)])
                               item))
                           tx-data)
          tx-str (sqlite-util/write-transit-str normalized)]
      (swap! send-queue
             (fn [prev]
               (p/then prev
                       (fn [_]
                         (when-let [ws (:ws (get @worker-state/*worker-sync-clients repo))]
                           (when (ws-open? ws)
                             (send! ws {:type "tx"
                                        :t_before @(:server-t client)
                                        :tx tx-str}))))))))))

(defn handle-local-tx!
  [repo tx-data tx-meta]
  (when (and (enabled?)
             (seq tx-data)
             (not (:worker-sync/remote? tx-meta))
             (not (:rtc-download-graph? tx-meta))
             (not (:from-disk? tx-meta)))
    (enqueue-local-tx! repo tx-data)))
