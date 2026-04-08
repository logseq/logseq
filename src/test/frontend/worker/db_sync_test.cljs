(ns frontend.worker.db-sync-test
  (:require [cljs.test :refer [deftest is testing async]]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.crypt :as crypt]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.assets :as sync-assets]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.handle-message :as sync-handle-message]
            [frontend.worker.sync.large-title :as sync-large-title]
            [frontend.worker.sync.log-and-state :as sync-log-state]
            [frontend.worker.sync.presence :as sync-presence]
            [frontend.worker.sync.transport :as sync-transport]
            [frontend.worker.sync.temp-sqlite :as sync-temp-sqlite]
            [frontend.worker.sync.upload :as sync-upload]
            [frontend.worker.undo-redo :as undo-redo]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db-sync.storage :as sync-storage]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.ws :as ws]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.op.construct :as op-construct]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.property :as outliner-property]
            [promesa.core :as p]))

(def ^:private test-repo "test-db-sync-repo")
(def ^:private local-tx-meta
  {:client-id "test-client"
   :local-tx? true})

(def ^:private recycle-built-in-props
  #{:logseq.property.recycle/original-parent
    :logseq.property.recycle/original-page
    :logseq.property.recycle/original-order})

(defn- js-row
  [m]
  (let [row (js-obj)]
    (doseq [[k v] m]
      (aset row (name k) v))
    row))

(defn- js-rows
  [rows]
  (into-array (map js-row rows)))

(defn- make-storage-sql
  []
  (let [state (atom {:kvs {}
                     :tx-log {}
                     :meta {}})
        sql (doto (js-obj)
              (aset "exec"
                    (fn [sql & args]
                      (cond
                        (or (string/includes? sql "create table")
                            (string/includes? sql "alter table")
                            (string/includes? sql "select 1 from"))
                        #js []

                        (string/includes? sql "delete from kvs")
                        (do
                          (swap! state assoc :kvs {})
                          nil)

                        (string/includes? sql "delete from tx_log")
                        (do
                          (swap! state assoc :tx-log {})
                          nil)

                        (string/includes? sql "delete from sync_meta")
                        (do
                          (swap! state assoc :meta {})
                          nil)

                        (or (string/includes? sql "insert into kvs")
                            (string/includes? sql "insert or replace into kvs"))
                        (do
                          (doseq [[addr content addresses] (partition 3 args)]
                            (swap! state assoc-in [:kvs addr]
                                   {:addr addr
                                    :content content
                                    :addresses addresses}))
                          nil)

                        (string/includes? sql "select content, addresses from kvs where addr = ?")
                        (if-let [{:keys [content addresses]} (get-in @state [:kvs (first args)])]
                          (js-rows [{:content content
                                     :addresses addresses}])
                          (js-rows []))

                        (string/includes? sql "insert into tx_log")
                        (let [[t tx created-at outliner-op] args]
                          (swap! state assoc-in [:tx-log t]
                                 {:t t
                                  :tx tx
                                  :created-at created-at
                                  :outliner-op outliner-op})
                          nil)

                        (string/includes? sql "select t, tx, outliner_op from tx_log")
                        (let [since (first args)
                              rows (->> (:tx-log @state)
                                        vals
                                        (filter (fn [row] (> (:t row) since)))
                                        (sort-by :t)
                                        (map (fn [row]
                                               {:t (:t row)
                                                :tx (:tx row)
                                                :outliner_op (:outliner-op row)})))]
                          (js-rows rows))

                        (string/includes? sql "insert into sync_meta")
                        (let [[k v] args]
                          (swap! state assoc-in [:meta k] v)
                          nil)

                        (string/includes? sql "select value from sync_meta")
                        (if-let [value (get-in @state [:meta (first args)])]
                          (js-rows [{:value value}])
                          (js-rows []))

                        :else
                        #js []))))]
    {:state state
     :sql sql}))

(defn- kvs-rows
  [storage-state]
  (->> (:kvs @storage-state)
       vals
       (sort-by :addr)
       (mapv (fn [{:keys [addr content addresses]}]
               [addr content addresses]))))

(defn- non-recycle-validation-entities
  [validation]
  (->> (:errors validation)
       (map :entity)
       (remove (fn [entity]
                 (contains? recycle-built-in-props (:db/ident entity))))))

(defn- with-datascript-conns
  [db-conn ops-conn f]
  (let [db-prev @worker-state/*datascript-conns
        ops-prev @worker-state/*client-ops-conns]
    (reset! worker-state/*datascript-conns {test-repo db-conn})
    (reset! worker-state/*client-ops-conns {test-repo ops-conn})
    (when ops-conn
      (d/listen! db-conn ::listen-db
                 (fn [tx-report]
                   (db-sync/enqueue-local-tx! test-repo tx-report))))
    (let [result (f)
          cleanup (fn []
                    (when ops-conn
                      (d/unlisten! db-conn ::listen-db))
                    (reset! worker-state/*datascript-conns db-prev)
                    (reset! worker-state/*client-ops-conns ops-prev))]
      (if (p/promise? result)
        (p/finally result cleanup)
        (do
          (cleanup)
          result)))))

(defn- setup-parent-child
  []
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "parent"
                           :build/children [{:block/title "child 1"}
                                            {:block/title "child 2"}
                                            {:block/title "child 3"}]}]}]})
        client-ops-conn (d/create-conn client-op/schema-in-db)
        parent (db-test/find-block-by-content @conn "parent")
        child1 (db-test/find-block-by-content @conn "child 1")
        child2 (db-test/find-block-by-content @conn "child 2")
        child3 (db-test/find-block-by-content @conn "child 3")]
    {:conn conn
     :client-ops-conn client-ops-conn
     :parent parent
     :child1 child1
     :child2 child2
     :child3 child3}))

(defn- setup-two-parents
  []
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "parent a"
                           :build/children [{:block/title "a child 1"}
                                            {:block/title "a child 2"}]}
                          {:block/title "parent b"
                           :build/children [{:block/title "b child 1"}
                                            {:block/title "b child 2"}]}]}]})
        client-ops-conn (d/create-conn client-op/schema-in-db)]
    {:conn conn
     :client-ops-conn client-ops-conn
     :parent-a (db-test/find-block-by-content @conn "parent a")
     :parent-b (db-test/find-block-by-content @conn "parent b")
     :a-child-1 (db-test/find-block-by-content @conn "a child 1")
     :b-child-1 (db-test/find-block-by-content @conn "b child 1")}))

(deftest resolve-ws-token-refreshes-when-token-expired-test
  (async done
         (let [refresh-calls (atom 0)
               main-thread-prev @worker-state/*main-thread
               worker-state-prev @worker-state/*state]
           (reset! worker-state/*state (assoc worker-state-prev :auth/id-token "expired-token"))
           (reset! worker-state/*main-thread
                   (fn [qkw _direct-pass? _args-list]
                     (if (= qkw :thread-api/ensure-id&access-token)
                       (do
                         (swap! refresh-calls inc)
                         (p/resolved {:id-token "fresh-token"}))
                       (p/resolved nil))))
           (with-redefs [db-sync/auth-token (fn [] "expired-token")
                         db-sync/id-token-expired? (fn [_token] true)]
             (-> (#'db-sync/<resolve-ws-token)
                 (p/then (fn [token]
                           (is (= 1 @refresh-calls))
                           (is (= "fresh-token" token))
                           (is (= "fresh-token" (worker-state/get-id-token)))
                           (reset! worker-state/*main-thread main-thread-prev)
                           (reset! worker-state/*state worker-state-prev)
                           (done)))
                 (p/catch (fn [error]
                            (reset! worker-state/*main-thread main-thread-prev)
                            (reset! worker-state/*state worker-state-prev)
                            (is nil (str error))
                            (done))))))))

(deftest resolve-ws-token-skips-refresh-when-token-not-expired-test
  (async done
         (let [refresh-calls (atom 0)
               main-thread-prev @worker-state/*main-thread]
           (reset! worker-state/*main-thread
                   (fn [qkw _direct-pass? _args-list]
                     (when (= qkw :thread-api/ensure-id&access-token)
                       (swap! refresh-calls inc))
                     (p/resolved {:id-token "fresh-token"})))
           (with-redefs [db-sync/auth-token (fn [] "valid-token")
                         db-sync/id-token-expired? (fn [_token] false)]
             (-> (#'db-sync/<resolve-ws-token)
                 (p/then (fn [token]
                           (reset! worker-state/*main-thread main-thread-prev)
                           (is (= 0 @refresh-calls))
                           (is (= "valid-token" token))
                           (done)))
                 (p/catch (fn [error]
                            (reset! worker-state/*main-thread main-thread-prev)
                            (is nil (str error))
                            (done))))))))

(deftest update-online-users-dedupes-identical-messages-test
  (let [client {:repo test-repo
                :online-users (atom [])
                :ws-state (atom :open)}
        broadcasts (atom [])]
    (with-redefs [shared-service/broadcast-to-clients! (fn [topic payload]
                                                         (swap! broadcasts conj {:topic topic :payload payload}))]
      (#'db-sync/update-online-users! client [{:user-id "u1" :username "Alice"}])
      (#'db-sync/update-online-users! client [{:user-id "u1" :username "Alice"}])
      (is (= 1 (count @broadcasts)))
      (is (= [{:user/uuid "u1" :user/name "Alice"}]
             (get-in (first @broadcasts) [:payload :online-users]))))))

(deftest presence-message-ignores-source-client-test
  (let [client {:repo test-repo
                :online-users (atom [{:user/uuid "u1" :user/name "Alice"}
                                     {:user/uuid "u2" :user/name "Bob"}])
                :ws-state (atom :open)}
        broadcasts (atom [])
        raw-message (js/JSON.stringify
                     (clj->js {:type "presence"
                               :user-id "u1"
                               :editing-block-uuid "block-self"}))]
    (with-redefs [worker-state/get-id-token (fn [] "token")
                  worker-util/parse-jwt (fn [_] {:sub "u1"})
                  client-op/get-local-tx (fn [_repo] 0)
                  shared-service/broadcast-to-clients! (fn [topic payload]
                                                         (swap! broadcasts conj {:topic topic :payload payload}))]
      (sync-handle-message/handle-message! test-repo client raw-message)
      (is (= [{:user/uuid "u1" :user/name "Alice"}
              {:user/uuid "u2" :user/name "Bob"}]
             @(:online-users client)))
      (is (empty? @broadcasts)))))

(deftest presence-message-updates-other-user-test
  (let [client {:repo test-repo
                :online-users (atom [{:user/uuid "u1" :user/name "Alice"}
                                     {:user/uuid "u2" :user/name "Bob"}])
                :ws-state (atom :open)}
        broadcasts (atom [])
        raw-message (js/JSON.stringify
                     (clj->js {:type "presence"
                               :user-id "u2"
                               :editing-block-uuid "block-2"}))]
    (with-redefs [worker-state/get-id-token (fn [] "token")
                  worker-util/parse-jwt (fn [_] {:sub "u1"})
                  client-op/get-local-tx (fn [_repo] 0)
                  shared-service/broadcast-to-clients! (fn [topic payload]
                                                         (swap! broadcasts conj {:topic topic :payload payload}))]
      (sync-handle-message/handle-message! test-repo client raw-message)
      (is (= [{:user/uuid "u1" :user/name "Alice"}
              {:user/uuid "u2" :user/name "Bob" :user/editing-block-uuid "block-2"}]
             @(:online-users client)))
      (is (= 1 (count @broadcasts))))))

(deftest ws-send-tx-batch-serializes-tx-id-as-uuid-string-test
  (let [sent-raw (atom nil)
        ws (doto (js-obj)
             (aset "readyState" 1)
             (aset "send" (fn [raw]
                            (reset! sent-raw raw))))
        tx-id (str (random-uuid))]
    (sync-transport/send! sync-transport/coerce-ws-client-message
                          ws
                          {:type "tx/batch"
                           :t-before 99
                           :txs [{:tx "[]"
                                  :tx-id tx-id
                                  :outliner-op :move-blocks}]})
    (let [payload (js->clj (js/JSON.parse @sent-raw) :keywordize-keys true)
          payload-tx-id (get-in payload [:txs 0 :tx-id])]
      (is (= "tx/batch" (:type payload)))
      (is (= tx-id payload-tx-id))
      (is (string? payload-tx-id)))))

(deftest sync-counts-counts-only-true-pending-local-ops-test
  (testing "pending-local should count only rows with :db-sync/pending? true"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id (random-uuid)
                           :db-sync/created-at 1
                           :db-sync/pending? false}
                          {:db-sync/tx-id (random-uuid)
                           :db-sync/created-at 2}
                          {:db-sync/tx-id (random-uuid)
                           :db-sync/created-at 3
                           :db-sync/pending? true}])
          (let [counts (sync-presence/sync-counts
                        {:get-datascript-conn worker-state/get-datascript-conn
                         :get-client-ops-conn worker-state/get-client-ops-conn
                         :get-unpushed-asset-ops-count client-op/get-unpushed-asset-ops-count
                         :get-local-tx (constantly 0)
                         :get-graph-uuid (constantly nil)
                         :latest-remote-tx {}}
                        test-repo)]
            (is (= 1 (:pending-local counts)))))))))

(deftest upload-graph-metadata-write-is-not-persisted-as-local-sync-tx-test
  (let [captured (atom nil)
        fake-conn (atom :db)]
    (with-redefs [worker-state/get-datascript-conn (fn [_repo] fake-conn)
                  ldb/transact! (fn [conn tx-data tx-meta]
                                  (reset! captured {:conn conn
                                                    :tx-data tx-data
                                                    :tx-meta tx-meta})
                                  nil)]
      (sync-upload/set-graph-sync-metadata! test-repo true))
    (is (= fake-conn (:conn @captured)))
    (is (= [{:db/ident :logseq.kv/graph-remote? :kv/value true}
            {:db/ident :logseq.kv/graph-rtc-e2ee? :kv/value true}]
           (:tx-data @captured)))
    (is (= {:persist-op? false}
           (:tx-meta @captured)))))

(deftest pull-ok-with-older-remote-tx-is-ignored-test
  (testing "pull/ok with remote tx behind local tx does not apply stale tx data"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          parent-id (:db/id parent)
          stale-tx (sqlite-util/write-transit-str [[:db/add parent-id :block/title "stale-title"]])
          raw-message (js/JSON.stringify
                       (clj->js {:type "pull/ok"
                                 :t 4
                                 :checksum "ignored"
                                 :txs [{:t 4 :tx stale-tx}]}))
          latest-prev @db-sync/*repo->latest-remote-tx
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (reset! db-sync/*repo->latest-remote-tx {})
          (try
            (client-op/update-local-tx test-repo 5)
            (sync-handle-message/handle-message! test-repo client raw-message)
            (let [parent' (d/entity @conn parent-id)]
              (is (= "parent" (:block/title parent')))
              (is (= 5 (client-op/get-local-tx test-repo))))
            (finally
              (reset! db-sync/*repo->latest-remote-tx latest-prev))))))))

(deftest pull-ok-out-of-order-stale-response-is-ignored-test
  (testing "late stale pull/ok should not overwrite a newer already-applied tx"
    (async done
           (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
                 parent-id (:db/id parent)
                 new-tx (sqlite-util/write-transit-str [[:db/add parent-id :block/title "remote-new-title"]])
                 stale-tx (sqlite-util/write-transit-str [[:db/add parent-id :block/title "stale-title"]])
                 new-checksum (-> (d/with @conn [[:db/add parent-id :block/title "remote-new-title"]])
                                  :db-after
                                  sync-checksum/recompute-checksum)
                 raw-new (js/JSON.stringify
                          (clj->js {:type "pull/ok"
                                    :t 2
                                    :checksum new-checksum
                                    :txs [{:t 2 :tx new-tx}]}))
                 raw-stale (js/JSON.stringify
                            (clj->js {:type "pull/ok"
                                      :t 1
                                      :checksum "ignored"
                                      :txs [{:t 1 :tx stale-tx}]}))
                 latest-prev @db-sync/*repo->latest-remote-tx
                 client {:repo test-repo
                         :graph-id "graph-1"
                         :inflight (atom [])
                         :online-users (atom [])
                         :ws-state (atom :open)}]
             (reset! db-sync/*repo->latest-remote-tx {})
             (with-datascript-conns conn client-ops-conn
               (fn []
                 (-> (p/let [_ (sync-handle-message/handle-message! test-repo client raw-new)
                             _ (sync-handle-message/handle-message! test-repo client raw-stale)
                             parent' (d/entity @conn parent-id)]
                       (is (= "remote-new-title" (:block/title parent')))
                       (is (= 2 (client-op/get-local-tx test-repo))))
                     (p/finally (fn []
                                  (reset! db-sync/*repo->latest-remote-tx latest-prev)
                                  (done))))))))))

(deftest tx-reject-db-transact-failed-surfaces-rejected-tx-test
  (testing "tx/reject with db transact failed includes parsed rejected tx and emits rtc-log"
    (let [rejected-tx {:tx (sqlite-util/write-transit-str [[:db/add [:block/uuid (random-uuid)] :block/title "bad"]])
                       :outliner-op :save-block}
          *captured (atom nil)
          raw-message (js/JSON.stringify
                       (clj->js {:type "tx/reject"
                                 :reason "db transact failed"
                                 :t 3
                                 :data (sqlite-util/write-transit-str rejected-tx)}))
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}]
      (with-redefs [client-op/get-local-tx (constantly 0)]
        (with-redefs [sync-log-state/rtc-log (fn [type payload]
                                               (reset! *captured {:type type
                                                                  :payload payload}))]
          (try
            (sync-handle-message/handle-message! test-repo client raw-message)
            (is false "expected tx/reject to fail-fast with rejected tx details")
            (catch :default error
              (let [data (ex-data error)
                    captured @*captured]
                (is (= :db-sync/tx-rejected (:type data)))
                (is (= "db transact failed" (:reason data)))
                (is (= rejected-tx (:data data)))
                (is (= :rtc.log/tx-rejected (:type captured)))
                (is (= :db-sync/tx-rejected (-> captured :payload :type)))
                (is (= rejected-tx (-> captured :payload :data)))))))))))

(deftest tx-reject-db-transact-failed-marks-inflight-op-failed-test
  (testing "non-stale tx/reject should mark inflight ops failed and clear pending state"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          tx-id (random-uuid)
          raw-message (js/JSON.stringify
                       (clj->js {:type "tx/reject"
                                 :reason "db transact failed"
                                 :t 3
                                 :data (sqlite-util/write-transit-str
                                        {:tx (sqlite-util/write-transit-str [[:db/add [:block/uuid (random-uuid)]
                                                                              :block/title
                                                                              "bad"]])
                                         :outliner-op :save-block})}))
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [tx-id])
                  :online-users (atom [])
                  :ws-state (atom :open)}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/created-at 1
                           :db-sync/pending? true}])
          (with-redefs [client-op/get-local-tx (constantly 0)]
            (let [error (try
                          (sync-handle-message/handle-message! test-repo client raw-message)
                          nil
                          (catch :default e
                            e))
                  ent (d/entity @client-ops-conn [:db-sync/tx-id tx-id])]
              (is (some? error))
              (is (= [] @(:inflight client)))
              (is (= false (:db-sync/pending? ent)))
              (is (= true (:db-sync/failed? ent))))))))))

(deftest tx-reject-db-transact-failed-selectively-updates-inflight-ops-test
  (testing "tx/reject should mark success txs as non-pending and failed tx as failed, leaving later inflight pending"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          success-tx-id (random-uuid)
          failed-tx-id (random-uuid)
          untouched-tx-id (random-uuid)
          raw-message (js/JSON.stringify
                       (clj->js {:type "tx/reject"
                                 :reason "db transact failed"
                                 :t 3
                                 :success-tx-ids [(str success-tx-id)]
                                 :failed-tx-id (str failed-tx-id)}))
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [success-tx-id failed-tx-id untouched-tx-id])
                  :online-users (atom [])
                  :ws-state (atom :open)}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id success-tx-id
                           :db-sync/created-at 1
                           :db-sync/pending? true}
                          {:db-sync/tx-id failed-tx-id
                           :db-sync/created-at 2
                           :db-sync/pending? true}
                          {:db-sync/tx-id untouched-tx-id
                           :db-sync/created-at 3
                           :db-sync/pending? true}])
          (with-redefs [client-op/get-local-tx (constantly 0)]
            (let [error (try
                          (sync-handle-message/handle-message! test-repo client raw-message)
                          nil
                          (catch :default e
                            e))
                  success-ent (d/entity @client-ops-conn [:db-sync/tx-id success-tx-id])
                  failed-ent (d/entity @client-ops-conn [:db-sync/tx-id failed-tx-id])
                  untouched-ent (d/entity @client-ops-conn [:db-sync/tx-id untouched-tx-id])]
              (is (some? error))
              (is (= [] @(:inflight client)))
              (is (= false (:db-sync/pending? success-ent)))
              (is (not= true (:db-sync/failed? success-ent)))
              (is (= false (:db-sync/pending? failed-ent)))
              (is (= true (:db-sync/failed? failed-ent)))
              (is (= true (:db-sync/pending? untouched-ent)))
              (is (not= true (:db-sync/failed? untouched-ent))))))))))

(deftest tx-reject-stale-keeps-inflight-op-pending-test
  (testing "stale tx/reject should keep inflight ops pending for retry"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          tx-id (random-uuid)
          *sent (atom [])
          raw-message (js/JSON.stringify
                       (clj->js {:type "tx/reject"
                                 :reason "stale"
                                 :t 3}))
          client {:repo test-repo
                  :graph-id "graph-1"
                  :ws #js {}
                  :inflight (atom [tx-id])
                  :online-users (atom [])
                  :ws-state (atom :open)}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/created-at 1
                           :db-sync/pending? true}])
          (with-redefs [client-op/get-local-tx (constantly 0)
                        sync-transport/ws-open? (constantly true)
                        sync-transport/send! (fn [_coerce-f _ws message]
                                               (swap! *sent conj message))]
            (sync-handle-message/handle-message! test-repo client raw-message)
            (let [ent (d/entity @client-ops-conn [:db-sync/tx-id tx-id])]
              (is (= [{:type "pull" :since 0}] @*sent))
              (is (= [tx-id] @(:inflight client)))
              (is (= true (:db-sync/pending? ent)))
              (is (not= true (:db-sync/failed? ent))))))))))

(deftest hello-checksum-mismatch-logs-warning-test
  (testing "hello with matching t but mismatched checksum logs warning without throwing"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          latest-prev @db-sync/*repo->latest-remote-tx
          raw-message (js/JSON.stringify
                       (clj->js {:type "hello"
                                 :t 0
                                 :checksum "bad-checksum"}))
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (reset! db-sync/*repo->latest-remote-tx {})
          (with-redefs [sync-apply/flush-pending! (fn [& _] nil)
                        sync-assets/enqueue-asset-sync! (fn [& _] nil)]
            (try
              (is (= :ok
                     (try
                       (sync-handle-message/handle-message! test-repo client raw-message)
                       :ok
                       (catch :default _error
                         :thrown))))
              (finally
                (reset! db-sync/*repo->latest-remote-tx latest-prev)))))))))

(deftest hello-checksum-mismatch-logs-warning-for-e2ee-test
  (testing "e2ee graphs also log warning on checksum mismatch without throwing"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          latest-prev @db-sync/*repo->latest-remote-tx
          raw-message (js/JSON.stringify
                       (clj->js {:type "hello"
                                 :t 0
                                 :checksum "bad-checksum"}))
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (reset! db-sync/*repo->latest-remote-tx {})
          (with-redefs [sync-apply/flush-pending! (fn [& _] nil)
                        sync-assets/enqueue-asset-sync! (fn [& _] nil)
                        sync-crypt/graph-e2ee? (constantly true)]
            (try
              (is (= :ok
                     (try
                       (sync-handle-message/handle-message! test-repo client raw-message)
                       :ok
                       (catch :default _error
                         :thrown))))
              (finally
                (reset! db-sync/*repo->latest-remote-tx latest-prev)))))))))

(deftest hello-without-checksum-is-accepted-test
  (testing "legacy hello without checksum is accepted"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          latest-prev @db-sync/*repo->latest-remote-tx
          raw-message (js/JSON.stringify
                       (clj->js {:type "hello"
                                 :t 0}))
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (reset! db-sync/*repo->latest-remote-tx {})
          (with-redefs [sync-apply/flush-pending! (fn [& _] nil)
                        sync-assets/enqueue-asset-sync! (fn [& _] nil)]
            (sync-handle-message/handle-message! test-repo client raw-message)
            (is (= 0 (get @db-sync/*repo->latest-remote-tx test-repo)))
            (reset! db-sync/*repo->latest-remote-tx latest-prev)))))))

(deftest pull-ok-without-checksum-is-accepted-test
  (testing "legacy pull/ok without checksum is accepted"
    (async done
           (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
                 parent-id (:db/id parent)
                 new-tx (sqlite-util/write-transit-str [[:db/add parent-id :block/title "remote-new-title"]])
                 raw-message (js/JSON.stringify
                              (clj->js {:type "pull/ok"
                                        :t 2
                                        :txs [{:t 2 :tx new-tx}]}))
                 latest-prev @db-sync/*repo->latest-remote-tx
                 client {:repo test-repo
                         :graph-id "graph-1"
                         :inflight (atom [])
                         :online-users (atom [])
                         :ws-state (atom :open)}]
             (reset! db-sync/*repo->latest-remote-tx {})
             (with-datascript-conns conn client-ops-conn
               (fn []
                 (-> (p/let [_ (sync-handle-message/handle-message! test-repo client raw-message)
                             parent' (d/entity @conn parent-id)]
                       (is (= "remote-new-title" (:block/title parent')))
                       (is (= 2 (client-op/get-local-tx test-repo))))
                     (p/finally (fn []
                                  (reset! db-sync/*repo->latest-remote-tx latest-prev)
                                  (done))))))))))

(deftest pull-ok-batched-txs-preserve-tempid-boundaries-test
  (testing "pull/ok applies tx batches without cross-tx tempid collisions"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          page-uuid (:block/uuid (:block/page parent))
          block-uuid-a (random-uuid)
          block-uuid-b (random-uuid)
          now 1760000000000
          tx-a [[:db/add -1 :block/uuid block-uuid-a]
                [:db/add -1 :block/title "remote-a"]
                [:db/add -1 :block/parent [:block/uuid page-uuid]]
                [:db/add -1 :block/page [:block/uuid page-uuid]]
                [:db/add -1 :block/order 1]
                [:db/add -1 :block/updated-at now]
                [:db/add -1 :block/created-at now]]
          tx-b [[:db/add -1 :block/uuid block-uuid-b]
                [:db/add -1 :block/title "remote-b"]
                [:db/add -1 :block/parent [:block/uuid page-uuid]]
                [:db/add -1 :block/page [:block/uuid page-uuid]]
                [:db/add -1 :block/order 2]
                [:db/add -1 :block/updated-at now]
                [:db/add -1 :block/created-at now]]]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (is (nil? (try
                      (#'sync-apply/apply-remote-txs! test-repo nil [{:tx-data tx-a}
                                                                     {:tx-data tx-b}])
                      nil
                      (catch :default e
                        e)))))))))

(deftest apply-remote-txs-preserves-many-page-property-values-test
  (testing "remote txs keep both values when a new page-many property is created and then assigned twice"
    (let [graph {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "remote object"}]}]}
          conn-a (db-test/create-conn-with-blocks graph)
          conn-b (d/conn-from-db @conn-a)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          remote-txs (atom [])
          property-id :plugin.property._test_plugin/x7]
      (d/listen! conn-b ::capture-remote-many-page-property
                 (fn [tx-report]
                   (swap! remote-txs conj
                          {:tx-data (db-normalize/normalize-tx-data
                                     (:db-after tx-report)
                                     (:db-before tx-report)
                                     (:tx-data tx-report))
                           :outliner-op (get-in tx-report [:tx-meta :outliner-op])})))
      (try
        (let [block-id (:db/id (db-test/find-block-by-content @conn-b "remote object"))]
          (outliner-property/upsert-property! conn-b property-id
                                              {:logseq.property/type :page
                                               :db/cardinality :db.cardinality/many}
                                              {:property-name "x7"})
          (outliner-property/set-block-property! conn-b block-id property-id "Page y")
          (outliner-property/set-block-property! conn-b block-id property-id "Page z"))
        (with-datascript-conns conn-a client-ops-conn
          (fn []
            (#'sync-apply/apply-remote-txs! test-repo nil @remote-txs)
            (let [block' (db-test/find-block-by-content @conn-a "remote object")]
              (is (= #{"page y" "page z"}
                     (set (map :block/name (:plugin.property._test_plugin/x7 block'))))))))
        (finally
          (d/unlisten! conn-b ::capture-remote-many-page-property))))))

(deftest batch-transact-preserves-many-page-property-values-test
  (testing "temp conn batch keeps both values when a new page-many property is created and then assigned twice"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "remote object"}]}]})
          block-id (:db/id (db-test/find-block-by-content @conn "remote object"))
          property-id :plugin.property._test_plugin/x7]
      (ldb/batch-transact-with-temp-conn!
       conn
       {}
       (fn [temp-conn]
         (outliner-property/upsert-property! temp-conn property-id
                                             {:logseq.property/type :page
                                              :db/cardinality :db.cardinality/many}
                                             {:property-name "x7"})
         (outliner-property/set-block-property! temp-conn block-id property-id "Page y")
         (outliner-property/set-block-property! temp-conn block-id property-id "Page z")))
      (let [block' (db-test/find-block-by-content @conn "remote object")]
        (is (= #{"page y" "page z"}
               (set (map :block/name (:plugin.property._test_plugin/x7 block')))))))))

(deftest batch-transact-preserves-tag-many-page-property-values-test
  (testing "temp conn batch keeps tag property values when a new many page property is upserted first"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "remote object"}]}]})
          property-id :plugin.property._test_plugin/x7]
      (ldb/batch-transact-with-temp-conn!
       conn
       {}
       (fn [temp-conn]
         (outliner-property/upsert-property! temp-conn property-id
                                             {:logseq.property/type :page
                                              :db/cardinality :db.cardinality/many}
                                             {:property-name "x7"})
         (outliner-page/create! temp-conn "Tag x" {:class? true})
         (let [tag-id (:db/id (ldb/get-page @temp-conn "Tag x"))]
           (outliner-property/set-block-property! temp-conn tag-id property-id "Page y")
           (outliner-property/set-block-property! temp-conn tag-id property-id "Page z"))))
      (let [tag' (ldb/get-page @conn "Tag x")]
        (is (ldb/class? tag'))
        (is (= #{"page y" "page z"}
               (set (map :block/name (:plugin.property._test_plugin/x7 tag')))))))))

(deftest replace-attr-retract-with-retract-entity-preserves-input-order-test
  (testing "temp batch replay transform keeps property schema datoms before later value datoms"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "remote object"}]}]})
          block-id (:db/id (db-test/find-block-by-content @conn "remote object"))
          property-id :plugin.property._test_plugin/x7
          temp-conn (d/conn-from-db @conn)
          *batch-tx-data (volatile! [])]
      (swap! temp-conn assoc
             :skip-store? true
             :batch-tx? true)
      (d/listen! temp-conn ::capture-temp-batch
                 (fn [{:keys [tx-data]}]
                   (vswap! *batch-tx-data into tx-data)))
      (try
        (outliner-property/upsert-property! temp-conn property-id
                                            {:logseq.property/type :page
                                             :db/cardinality :db.cardinality/many}
                                            {:property-name "x7"})
        (outliner-property/set-block-property! temp-conn block-id property-id "Page y")
        (outliner-property/set-block-property! temp-conn block-id property-id "Page z")
        (let [tx-data @*batch-tx-data
              tx-data' (db-normalize/replace-attr-retract-with-retract-entity @temp-conn tx-data)
              schema-index (first (keep-indexed
                                   (fn [idx d]
                                     (when (and (= :db/ident (:a d))
                                                (= property-id (:v d)))
                                       idx))
                                   tx-data'))
              value-index (first (keep-indexed
                                  (fn [idx d]
                                    (when (and (= block-id (:e d))
                                               (= property-id (:a d))
                                               (:added d))
                                      idx))
                                  tx-data'))]
          (is (number? schema-index))
          (is (number? value-index))
          (is (< schema-index value-index)))
        (finally
          (d/unlisten! temp-conn ::capture-temp-batch))))))

(deftest local-checksum-matches-recompute-after-post-pipeline-update-test
  (testing "stored checksum matches recompute when updated from post-pipeline tx report"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [page-id (:db/id (:block/page parent))
                parent-id (:db/id parent)
                block-uuid (random-uuid)
                now 1773661308002
                tx-report* (d/with @conn [[:db/add -1 :block/uuid block-uuid]
                                          [:db/add -1 :block/title "Checksum Block"]
                                          [:db/add -1 :block/parent parent-id]
                                          [:db/add -1 :block/page page-id]
                                          [:db/add -1 :block/order "a0"]
                                          [:db/add -1 :block/created-at now]
                                          [:db/add -1 :block/updated-at now]]
                                   {:outliner-op :insert-blocks})
                tx-report (worker-pipeline/transact-pipeline tx-report*)]
            (db-sync/update-local-sync-checksum! test-repo tx-report)
            (is (= (client-op/get-local-checksum test-repo)
                   (sync-checksum/recompute-checksum (:db-after tx-report))))))))))

(deftest first-local-block-after-upload-keeps-server-checksum-in-sync-test
  (testing "the first local block tx after upload keeps server and client checksums equal"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          server-conn (d/conn-from-db @conn)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [parent-id (:db/id parent)
                block-uuid (random-uuid)]
            (outliner-core/insert-blocks! conn
                                          [{:block/title "Uploaded graph block"
                                            :block/uuid block-uuid}]
                                          (d/entity @conn parent-id)
                                          {:sibling? false
                                           :keep-uuid? true})
            (let [tx-entries (->> (#'sync-apply/pending-txs test-repo)
                                  (mapv (fn [{:keys [tx outliner-op]}]
                                          {:tx (sqlite-util/write-transit-str
                                                (->> tx
                                                     (db-normalize/remove-retract-entity-ref @conn)
                                                     distinct
                                                     vec))
                                           :outliner-op outliner-op})))]
              (doseq [tx-entry tx-entries]
                (#'sync-handler/apply-tx-entry! server-conn tx-entry))
              (is (= (sync-checksum/recompute-checksum @conn)
                     (sync-checksum/recompute-checksum @server-conn))))))))))

(deftest first-page-and-block-after-upload-keeps-server-checksum-in-sync-test
  (testing "creating the first page and first block after upload keeps server and client checksums equal"
    (let [conn (db-test/create-conn)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          server-conn (d/conn-from-db @conn)
          page-uuid (random-uuid)
          block-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (worker-page/create! conn "Fresh Sync Page" :uuid page-uuid)
          (outliner-core/insert-blocks! conn
                                        [{:block/title "Fresh graph block"
                                          :block/uuid block-uuid}]
                                        (d/entity @conn [:block/uuid page-uuid])
                                        {:sibling? false
                                         :keep-uuid? true})
          (let [tx-entries (->> (#'sync-apply/pending-txs test-repo)
                                (mapv (fn [{:keys [tx outliner-op]}]
                                        {:tx (sqlite-util/write-transit-str
                                              (->> tx
                                                   (db-normalize/remove-retract-entity-ref @conn)
                                                   distinct
                                                   vec))
                                         :outliner-op outliner-op})))]
            (doseq [tx-entry tx-entries]
              (#'sync-handler/apply-tx-entry! server-conn tx-entry))
            (is (= (sync-checksum/recompute-checksum @conn)
                   (sync-checksum/recompute-checksum @server-conn)))))))))

(deftest snapshot-roundtrip-first-page-and-block-after-upload-keeps-server-checksum-in-sync-test
  (testing "freshly uploaded graph storage roundtrip keeps the first page/block tx in sync"
    (let [base-conn (db-test/create-conn)
          local-storage (make-storage-sql)
          server-storage (make-storage-sql)
          local-conn (d/conn-from-datoms (d/datoms @base-conn :eavt)
                                         (d/schema @base-conn)
                                         {:storage (sync-storage/new-sqlite-storage (:sql local-storage))})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          _ (#'sync-handler/import-snapshot-rows! (:sql server-storage) "kvs" (kvs-rows (:state local-storage)))
          server-conn (sync-storage/open-conn (:sql server-storage))
          page-uuid (random-uuid)
          block-uuid (random-uuid)
          server-self #js {:sql (:sql server-storage)
                           :conn server-conn
                           :schema-ready true}]
      (with-datascript-conns local-conn client-ops-conn
        (fn []
          (worker-page/create! local-conn "Fresh Sync Page" :uuid page-uuid)
          (outliner-core/insert-blocks! local-conn
                                        [{:block/title "Fresh graph block"
                                          :block/uuid block-uuid}]
                                        (d/entity @local-conn [:block/uuid page-uuid])
                                        {:sibling? false
                                         :keep-uuid? true})
          (let [sanitize-tx (fn [tx]
                              (->> tx
                                   (db-normalize/remove-retract-entity-ref @local-conn)
                                   distinct
                                   vec))
                tx-entries (mapv (fn [{:keys [tx outliner-op]}]
                                   {:tx (sqlite-util/write-transit-str (sanitize-tx tx))
                                    :outliner-op outliner-op})
                                 (#'sync-apply/pending-txs test-repo))
                response (with-redefs [ws/broadcast! (fn [& _] nil)]
                           (sync-handler/handle-tx-batch! server-self nil tx-entries 0))]
            (is (= "tx/batch/ok" (:type response)))
            (is (= (sync-checksum/recompute-checksum @local-conn)
                   (sync-checksum/recompute-checksum @server-conn)))))))))

(deftest reaction-add-enqueues-pending-sync-tx-test
  (testing "adding a reaction should enqueue tx for db-sync"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:toggle-reaction [(:block/uuid parent) "+1" nil]]]
                                  local-tx-meta)
          (let [pending (#'sync-apply/pending-txs test-repo)
                raw-pending (->> (d/datoms @client-ops-conn :avet :db-sync/created-at)
                                 (map (fn [datom] (d/entity @client-ops-conn (:e datom)))))
                txs (mapcat :tx pending)]
            (is (seq pending))
            (is (= :toggle-reaction (:db-sync/outliner-op (first raw-pending))))
            (is (= :toggle-reaction (:outliner-op (first pending))))
            (is (= [[:transact nil]]
                   (:forward-outliner-ops (first pending))))
            (is (some (fn [tx]
                        (and (vector? tx)
                             (= :db/add (first tx))
                             (= :logseq.property.reaction/emoji-id (nth tx 2 nil))
                             (= "+1" (nth tx 3 nil))))
                      txs))))))))

(deftest rename-page-enqueues-canonical-save-block-pending-op-test
  (testing "rename-page is persisted as canonical save-block op"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          page-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (worker-page/create! conn "Rename Me" :uuid page-uuid)
          (outliner-op/apply-ops! conn
                                  [[:rename-page [page-uuid "Renamed"]]]
                                  local-tx-meta)
          (let [{:keys [forward-outliner-ops]} (last (#'sync-apply/pending-txs test-repo))]
            (is (= :save-block (ffirst forward-outliner-ops)))
            (is (= {:block/uuid page-uuid
                    :block/title "Renamed"}
                   (first (second (first forward-outliner-ops)))))))))))

(deftest move-blocks-up-down-enqueues-canonical-move-blocks-pending-op-test
  (testing "move-blocks-up-down is persisted as semantic move-blocks-up-down op"
    (let [{:keys [conn client-ops-conn child2]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:move-blocks-up-down [[(:db/id child2)] true]]]
                                  local-tx-meta)
          (let [{:keys [forward-outliner-ops]} (first (#'sync-apply/pending-txs test-repo))
                [op [ids up?]] (first forward-outliner-ops)]
            (is (= :move-blocks-up-down op))
            (is (seq ids))
            (is (= true up?))))))))

(deftest indent-outdent-enqueues-canonical-move-blocks-pending-op-test
  (testing "indent-outdent-blocks is persisted as canonical move-blocks op"
    (let [{:keys [conn client-ops-conn child2]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:indent-outdent-blocks [[(:db/id child2)] true {}]]]
                                  local-tx-meta)
          (let [{:keys [forward-outliner-ops]} (first (#'sync-apply/pending-txs test-repo))
                [_ [_ target-id opts]] (first forward-outliner-ops)]
            (is (= :move-blocks (ffirst forward-outliner-ops)))
            (is (some? target-id))
            (is (contains? opts :sibling?))
            (is (nil? (:source-op opts)))))))))

(deftest indent-outdent-direct-outdent-last-child-builds-forward-and-inverse-move-history-test
  (testing "direct outdent on last child builds concrete move forward/inverse ops with ui outliner-op metadata"
    (let [{:keys [conn client-ops-conn parent child2 child3]} (setup-parent-child)
          tx-meta (assoc local-tx-meta :outliner-op :move-blocks)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:indent-outdent-blocks [[(:db/id child3)] false {:parent-original nil
                                                                                     :logical-outdenting? nil}]]]
                                  tx-meta)
          (let [source-row (first (#'sync-apply/pending-txs test-repo))
                forward-ops (:forward-outliner-ops source-row)
                inverse-ops (:inverse-outliner-ops source-row)]
            (is (= :move-blocks (ffirst forward-ops)))
            (is (= [[:block/uuid (:block/uuid child3)]]
                   (get-in forward-ops [0 1 0])))
            (is (= [:block/uuid (:block/uuid parent)]
                   (get-in forward-ops [0 1 1])))
            (is (= true (get-in forward-ops [0 1 2 :sibling?])))
            (is (= :move-blocks (ffirst inverse-ops)))
            (is (= [[:block/uuid (:block/uuid child3)]]
                   (get-in inverse-ops [0 1 0])))
            (is (= [:block/uuid (:block/uuid child2)]
                   (get-in inverse-ops [0 1 1])))
            (is (= true (get-in inverse-ops [0 1 2 :sibling?])))))))))

(deftest indent-outdent-direct-outdent-with-right-sibling-persists-semantic-move-history-test
  (testing "direct outdent with right siblings persists concrete semantic move forward/inverse ops"
    (let [{:keys [conn client-ops-conn parent child1 child2]} (setup-parent-child)
          tx-meta (assoc local-tx-meta :outliner-op :move-blocks)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:indent-outdent-blocks [[(:db/id child2)] false {:parent-original nil
                                                                                     :logical-outdenting? nil}]]]
                                  tx-meta)
          (let [source-row (first (#'sync-apply/pending-txs test-repo))
                forward-ops (:forward-outliner-ops source-row)
                inverse-ops (:inverse-outliner-ops source-row)]
            (is (= :move-blocks (ffirst forward-ops)))
            (is (= [[:block/uuid (:block/uuid child2)]]
                   (get-in forward-ops [0 1 0])))
            (is (= [:block/uuid (:block/uuid parent)]
                   (get-in forward-ops [0 1 1])))
            (is (= true (get-in forward-ops [0 1 2 :sibling?])))
            (is (= :move-blocks (ffirst inverse-ops)))
            (is (= [[:block/uuid (:block/uuid child2)]]
                   (get-in inverse-ops [0 1 0])))
            (is (= [:block/uuid (:block/uuid child1)]
                   (get-in inverse-ops [0 1 1])))
            (is (= true (get-in inverse-ops [0 1 2 :sibling?])))))))))

(deftest indent-outdent-direct-outdent-undo-restores-right-sibling-parent-test
  (testing "undo after direct outdent restores right sibling parent to original parent"
    (let [{:keys [conn client-ops-conn parent child2 child3]} (setup-parent-child)
          parent-uuid (:block/uuid parent)
          child2-uuid (:block/uuid child2)
          child3-uuid (:block/uuid child3)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:indent-outdent-blocks [[(:db/id child2)] false {:parent-original nil
                                                                                     :logical-outdenting? nil}]]]
                                  local-tx-meta)
          (let [source-row (first (#'sync-apply/pending-txs test-repo))
                source-tx-id (:tx-id source-row)
                child3-after-outdent (d/entity @conn [:block/uuid child3-uuid])]
            (is (= child2-uuid
                   (:block/uuid (:block/parent child3-after-outdent))))
            (let [undo-result (#'sync-apply/apply-history-action! test-repo source-tx-id true {})
                  child2-after-undo (d/entity @conn [:block/uuid child2-uuid])
                  child3-after-undo (d/entity @conn [:block/uuid child3-uuid])]
              (is (= true (:applied? undo-result)))
              (is (= parent-uuid
                     (:block/uuid (:block/parent child2-after-undo))))
              (is (= parent-uuid
                     (:block/uuid (:block/parent child3-after-undo)))))))))))

(deftest indent-outdent-undo-enqueues-concrete-move-blocks-history-test
  (testing "indent-outdent outdent-path persists concrete semantic move history and undo/redo replays without invalid entities"
    (let [{:keys [conn client-ops-conn child2]} (setup-parent-child)
          prev-invalid-callback @ldb/*transact-invalid-callback
          invalid-payload* (atom nil)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (reset! ldb/*transact-invalid-callback
                  (fn [tx-report errors]
                    (reset! invalid-payload* {:tx-meta (:tx-meta tx-report)
                                              :errors errors})))
          (try
            (outliner-op/apply-ops! conn
                                    [[:indent-outdent-blocks [[(:db/id child2)] false {:parent-original nil
                                                                                       :logical-outdenting? nil}]]]
                                    local-tx-meta)
            (let [source-row (first (#'sync-apply/pending-txs test-repo))
                  source-tx-id (:tx-id source-row)
                  undo-result (#'sync-apply/apply-history-action! test-repo source-tx-id true {})
                  redo-result (#'sync-apply/apply-history-action! test-repo source-tx-id false {})]
              (is (= :move-blocks (ffirst (:forward-outliner-ops source-row))))
              (is (= true (:applied? undo-result)))
              (is (= true (:applied? redo-result)))
              (is (nil? @invalid-payload*))
              (is (= "child 2" (:block/title (d/entity @conn (:db/id child2))))))
            (finally
              (reset! ldb/*transact-invalid-callback prev-invalid-callback))))))))

(deftest enqueue-local-tx-canonicalizes-batch-import-to-transact-test
  (testing "batch-import-edn local tx persists as canonical transact op"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          tx-report (d/with @conn
                            [{:block/uuid (random-uuid)
                              :block/title "imported"
                              :block/tags :logseq.class/Page
                              :block/created-at 1760000000000
                              :block/updated-at 1760000000000}]
                            (assoc local-tx-meta :outliner-op :batch-import-edn))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (db-sync/enqueue-local-tx! test-repo tx-report)
          (let [{:keys [forward-outliner-ops]} (first (#'sync-apply/pending-txs test-repo))]
            (is (= [[:transact nil]] forward-outliner-ops))))))))

(deftest enqueue-local-tx-preserves-existing-tx-id-test
  (testing "local tx persistence reuses tx-id already attached to tx-meta"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          tx-id (random-uuid)
          tx-report (d/with @conn
                            [[:db/add (:db/id child1) :block/title "stable tx id"]]
                            (assoc local-tx-meta
                                   :db-sync/tx-id tx-id
                                   :outliner-op :save-block))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (db-sync/enqueue-local-tx! test-repo tx-report)
          (let [{persisted-tx-id :tx-id} (first (#'sync-apply/pending-txs test-repo))]
            (is (= tx-id persisted-tx-id))))))))

(deftest apply-history-action-does-not-reuse-original-tx-id-test
  (testing "undo/redo history actions should not overwrite the original pending tx row"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:save-block [{:block/uuid child-uuid
                                                  :block/title "hello"} nil]]]
                                  local-tx-meta)
          (let [{:keys [tx-id]} (first (#'sync-apply/pending-txs test-repo))]
            (let [{:keys [applied? history-tx-id]} (#'sync-apply/apply-history-action! test-repo
                                                                                       tx-id
                                                                                       true
                                                                                       {:db-sync/tx-id tx-id})]
              (is (= true applied?))
              (is (uuid? history-tx-id))
              (is (not= tx-id history-tx-id)))
            (let [pending (#'sync-apply/pending-txs test-repo)]
              (is (= 2 (count pending)))
              (is (= 2 (count (distinct (map :tx-id pending)))))
              (is (= "hello"
                     (get-in (#'sync-apply/pending-tx-by-id test-repo tx-id)
                             [:forward-outliner-ops 0 1 0 :block/title]))))))))))

(deftest apply-history-action-preserves-source-forward-inverse-ops-test
  (testing "undo/redo history actions should preserve source forward/inverse ops and create new tx rows"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:save-block [{:block/uuid child-uuid
                                                  :block/title "hello"} nil]]]
                                  local-tx-meta)
          (let [{source-tx-id :tx-id} (first (#'sync-apply/pending-txs test-repo))]
            (let [{undo-applied? :applied?
                   undo-history-tx-id :history-tx-id}
                  (#'sync-apply/apply-history-action! test-repo
                                                      source-tx-id
                                                      true
                                                      {})]
              (is (= true undo-applied?))
              (is (uuid? undo-history-tx-id))
              (is (not= source-tx-id undo-history-tx-id)))
            (let [source-pending (#'sync-apply/pending-tx-by-id test-repo source-tx-id)
                  pending-after-undo (#'sync-apply/pending-txs test-repo)
                  undo-pending (first (filter #(not= source-tx-id (:tx-id %)) pending-after-undo))]
              (is (= 2 (count pending-after-undo)))
              (is (some? undo-pending))
              (is (= "hello"
                     (get-in source-pending [:forward-outliner-ops 0 1 0 :block/title])))
              (is (= "child 1"
                     (get-in source-pending [:inverse-outliner-ops 0 1 0 :block/title])))
              (is (= "child 1"
                     (get-in undo-pending [:forward-outliner-ops 0 1 0 :block/title])))
              (is (= "hello"
                     (get-in undo-pending [:inverse-outliner-ops 0 1 0 :block/title]))))
            (let [{redo-applied? :applied?
                   redo-history-tx-id :history-tx-id}
                  (#'sync-apply/apply-history-action! test-repo
                                                      source-tx-id
                                                      false
                                                      {})]
              (is (= true redo-applied?))
              (is (uuid? redo-history-tx-id))
              (is (not= source-tx-id redo-history-tx-id)))
            (let [source-pending (#'sync-apply/pending-tx-by-id test-repo source-tx-id)
                  pending-after-redo (#'sync-apply/pending-txs test-repo)
                  new-tx-ids (set (map :tx-id pending-after-redo))]
              (is (= 3 (count pending-after-redo)))
              (is (= 3 (count new-tx-ids)))
              (is (contains? new-tx-ids source-tx-id))
              (is (= "hello"
                     (get-in source-pending [:forward-outliner-ops 0 1 0 :block/title])))
              (is (= "child 1"
                     (get-in source-pending [:inverse-outliner-ops 0 1 0 :block/title]))))))))))

(deftest apply-history-action-semantic-op-must-not-fallback-to-raw-tx-test
  (testing "semantic history action should not fallback to raw tx replay"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          tx-id (random-uuid)
          child-uuid (:block/uuid child1)
          before-title (:block/title (d/entity @conn (:db/id child1)))
          missing-uuid (random-uuid)
          raw-title "raw fallback title"
          tx-data [[:db/add [:block/uuid child-uuid] :block/title raw-title]]]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/pending? true
                           :db-sync/created-at (.now js/Date)
                           :db-sync/outliner-op :save-block
                           :db-sync/forward-outliner-ops [[:save-block [{:block/uuid missing-uuid
                                                                         :block/title "broken semantic"} {}]]]
                           :db-sync/normalized-tx-data tx-data
                           :db-sync/reversed-tx-data []}])
          (is (thrown? js/Error
                       (#'sync-apply/apply-history-action! test-repo tx-id false {})))
          (is (= before-title
                 (:block/title (d/entity @conn [:block/uuid child-uuid])))))))))

(deftest apply-history-action-redo-invalid-insert-conflict-skips-fail-fast-test
  (testing "redo conflict on stale insert target should throw skippable error without fail-fast logger"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          tx-id (random-uuid)
          missing-parent-uuid (random-uuid)
          inserted-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/pending? true
                           :db-sync/created-at (.now js/Date)
                           :db-sync/outliner-op :insert-blocks
                           :db-sync/forward-outliner-ops [[:insert-blocks [[{:block/uuid inserted-uuid
                                                                             :block/title ""
                                                                             :block/parent [:block/uuid missing-parent-uuid]}
                                                                            [:block/uuid missing-parent-uuid]
                                                                            {:sibling? false
                                                                             :keep-uuid? true}]]]]
                           :db-sync/normalized-tx-data []
                           :db-sync/reversed-tx-data []}])
          (with-redefs [sync-apply/fail-fast (fn [_tag data]
                                               (throw (ex-info "fail-fast-called" data)))]
            (try
              (#'sync-apply/apply-history-action! test-repo tx-id false {})
              (is false "expected redo conflict to throw")
              (catch :default e
                (is (not= "fail-fast-called" (ex-message e)))
                (is (= :invalid-history-action-ops
                       (:reason (ex-data e))))))))))))

(deftest apply-history-action-save-block-ignores-stale-db-id-when-uuid-exists-test
  (testing "semantic save-block replay should resolve by uuid and ignore stale db/id"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          tx-id (random-uuid)
          child-uuid (:block/uuid child1)
          stale-db-id 99999999
          new-title "semantic replay with stale db id"]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/pending? true
                           :db-sync/created-at (.now js/Date)
                           :db-sync/outliner-op :save-block
                           :db-sync/forward-outliner-ops [[:save-block [{:db/id stale-db-id
                                                                         :block/uuid child-uuid
                                                                         :block/title new-title}
                                                                        {}]]]
                           :db-sync/normalized-tx-data []
                           :db-sync/reversed-tx-data []}])
          (let [result (#'sync-apply/apply-history-action! test-repo tx-id false {})]
            (is (= true (:applied? result)))
            (is (= :semantic-ops (:source result)))
            (is (= new-title
                   (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))))

(deftest reverse-local-txs-uses-reversed-tx-data-test
  (testing "rebase reverse uses reversed tx-data even when semantic inverse ops are missing"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          tx-id (random-uuid)
          child-id (:db/id child1)
          child-uuid (:block/uuid child1)
          local-tx {:tx-id tx-id
                    :outliner-op :save-block
                    :forward-outliner-ops [[:save-block [{:block/uuid (random-uuid)
                                                          :block/title "value"} {}]]]
                    :inverse-outliner-ops nil
                    :reversed-tx [[:db/add child-id :block/title "raw reverse"]]}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [reports (#'sync-apply/reverse-local-txs! conn [local-tx])]
            (is (= 1 (count reports)))
            (is (= "raw reverse"
                   (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))))

(deftest reverse-local-txs-drops-missing-entity-order-adds-test
  (testing "reverse should ignore :db/add :block/order for missing entities"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          tx-id (random-uuid)
          child-id (:db/id child1)
          child-uuid (:block/uuid child1)
          missing-uuid (random-uuid)
          local-tx {:tx-id tx-id
                    :outliner-op :save-block
                    :reversed-tx [[:db/add [:block/uuid missing-uuid] :block/order "a0"]
                                  [:db/add child-id :block/title "reverse-kept"]]}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (is (nil? (d/entity @conn [:block/uuid missing-uuid])))
          (let [reports (#'sync-apply/reverse-local-txs! conn [local-tx])]
            (is (= 1 (count reports)))
            (is (= "reverse-kept"
                   (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))))

(deftest enqueue-local-tx-keeps-mixed-semantic-forward-outliner-ops-test
  (testing "mixed semantic outliner ops stay semantic and preserve op ordering"
    (let [{:keys [conn client-ops-conn child2]} (setup-parent-child)
          block-id (:db/id child2)
          block-uuid (:block/uuid child2)
          tx-report (d/with @conn
                            [[:db/add block-id :block/title "mixed fallback"]]
                            (assoc local-tx-meta
                                   :outliner-op :save-block
                                   :outliner-ops [[:save-block [{:block/uuid block-uuid
                                                                 :block/title "mixed fallback"} {}]]
                                                  [:indent-outdent-blocks [[block-id]
                                                                           false
                                                                           {:parent-original nil
                                                                            :logical-outdenting? nil}]]]))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (db-sync/enqueue-local-tx! test-repo tx-report)
          (let [{:keys [forward-outliner-ops]} (first (#'sync-apply/pending-txs test-repo))]
            (is (= :save-block (ffirst forward-outliner-ops)))
            (is (= :indent-outdent-blocks (first (second forward-outliner-ops))))
            (is (= [[:block/uuid block-uuid]]
                   (get-in forward-outliner-ops [1 1 0])))))))))

(deftest apply-history-action-redo-fails-fast-on-transact-placeholder-test
  (testing "redo fails fast when semantic ops contain transact placeholder to avoid silent partial replay"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          tx-id (random-uuid)
          child-uuid (:block/uuid child1)
          before-title (:block/title (d/entity @conn (:db/id child1)))
          semantic-title "semantic replay value"
          raw-title "raw replay value"
          forward-ops [[:save-block [{:block/uuid child-uuid
                                      :block/title semantic-title} {}]]
                       [:transact nil]]
          tx-data [[:db/add [:block/uuid child-uuid] :block/title raw-title]]
          reversed-tx-data [[:db/add [:block/uuid child-uuid] :block/title before-title]]]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/pending? true
                           :db-sync/created-at (.now js/Date)
                           :db-sync/outliner-op :save-block
                           :db-sync/forward-outliner-ops forward-ops
                           :db-sync/normalized-tx-data tx-data
                           :db-sync/reversed-tx-data reversed-tx-data}])
          (is (thrown? js/Error
                       (#'sync-apply/apply-history-action! test-repo tx-id false {})))
          (is (= before-title
                 (:block/title (d/entity @conn [:block/uuid child-uuid])))))))))

(deftest enqueue-local-tx-allows-explicit-transact-placeholder-forward-op-test
  (testing "enqueue-local-tx should preserve explicit transact placeholder forward ops"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          child-id (:db/id child1)
          tx-id (random-uuid)
          tx-report (d/with @conn
                            [[:db/add child-id :block/title "placeholder replay"]]
                            (assoc local-tx-meta
                                   :db-sync/tx-id tx-id
                                   :db-sync/forward-outliner-ops [[:transact nil]]
                                   :db-sync/inverse-outliner-ops nil
                                   :outliner-op :toggle-reaction))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (db-sync/enqueue-local-tx! test-repo tx-report)
          (let [pending (first (#'sync-apply/pending-txs test-repo))]
            (is (= tx-id (:tx-id pending)))
            (is (= [[:transact nil]]
                   (:forward-outliner-ops pending)))
            (is (nil? (:inverse-outliner-ops pending)))))))))

(deftest apply-history-action-undo-delete-blocks-noops-when-target-missing-test
  (testing "undo delete-blocks should no-op when the target block is already missing"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          tx-id (random-uuid)
          child-uuid (:block/uuid child1)
          missing-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/pending? true
                           :db-sync/created-at (.now js/Date)
                           :db-sync/outliner-op :delete-blocks
                           :db-sync/forward-outliner-ops
                           [[:save-block [{:block/uuid child-uuid
                                           :block/title "semantic source"} nil]]]
                           :db-sync/inverse-outliner-ops
                           [[:delete-blocks [[[:block/uuid missing-uuid]] {}]]]
                           :db-sync/normalized-tx-data []
                           :db-sync/reversed-tx-data []}])
          (is (= true
                 (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
          (is (some? (d/entity @conn [:block/uuid child-uuid]))))))))

(deftest enqueue-local-tx-persists-semantic-undo-ops-test
  (testing "undo local tx persists explicit semantic forward and inverse ops"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          tx-id (random-uuid)
          forward-ops [[:save-block [{:block/uuid (:block/uuid child1)
                                      :block/title "undo value"} {}]]]
          inverse-ops [[:save-block [{:block/uuid (:block/uuid child1)
                                      :block/title "child 1"} {}]]]
          tx-report (d/with @conn
                            [[:db/add (:db/id child1) :block/title "undo value"]]
                            (assoc local-tx-meta
                                   :db-sync/tx-id tx-id
                                   :db-sync/forward-outliner-ops forward-ops
                                   :db-sync/inverse-outliner-ops inverse-ops
                                   :outliner-op :save-block
                                   :undo? true
                                   :gen-undo-ops? false))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (db-sync/enqueue-local-tx! test-repo tx-report)
          (let [pending (first (#'sync-apply/pending-txs test-repo))
                raw-pending (->> (d/datoms @client-ops-conn :avet :db-sync/created-at)
                                 (map (fn [datom] (d/entity @client-ops-conn (:e datom))))
                                 first)]
            (is (= tx-id (:tx-id pending)))
            (is (= forward-ops (:forward-outliner-ops pending)))
            (is (= forward-ops (:db-sync/forward-outliner-ops raw-pending)))
            (is (= inverse-ops (:db-sync/inverse-outliner-ops raw-pending)))))))))

(deftest direct-outliner-page-delete-persists-delete-page-outliner-op-test
  (testing "direct outliner-page/delete! still persists singleton delete-page forward-outliner-ops"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Me"}}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          page (db-test/find-page-by-title @conn "Delete Me")]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-page/delete! conn (:block/uuid page) {})
          (let [{:keys [forward-outliner-ops inverse-outliner-ops]} (first (#'sync-apply/pending-txs test-repo))]
            (is (= :delete-page (ffirst forward-outliner-ops)))
            (is (= (:block/uuid page)
                   (get-in forward-outliner-ops [0 1 0])))
            (is (seq inverse-outliner-ops))))))))

(deftest delete-page-rewrites-node-refs-and-semantic-undo-redo-test
  (testing "moving a page to recycle rewrites node refs and semantic undo/redo restores and reapplies them"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Me"}}
                                    {:page {:block/title "Ref Page"}
                                     :blocks [{:block/title "seed"}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          page (db-test/find-page-by-title @conn "Delete Me")
          page-id (:db/id page)
          page-uuid (:block/uuid page)
          ref-block (db-test/find-block-by-content @conn "seed")
          ref-block-uuid (:block/uuid ref-block)
          node-ref-content (str "ref " (page-ref/->page-ref page-uuid))
          title-content "ref Delete Me"]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! conn [{:db/id (:db/id ref-block)
                                :block/title node-ref-content
                                :block/refs #{page-id}}])
          (outliner-page/delete! conn page-uuid {})
          (let [{:keys [tx-id forward-outliner-ops inverse-outliner-ops]}
                (->> (#'sync-apply/pending-txs test-repo)
                     (filter #(= :delete-page (:outliner-op %)))
                     last)]
            (is (= :delete-page (ffirst forward-outliner-ops)))
            (is (some (fn [[op [block]]]
                        (and (= :save-block op)
                             (= ref-block-uuid (:block/uuid block))
                             (= title-content (:block/title block))))
                      forward-outliner-ops))
            (is (some (fn [[op [target-page-uuid]]]
                        (and (= :restore-recycled op)
                             (= page-uuid target-page-uuid)))
                      inverse-outliner-ops))
            (is (some (fn [[op [block]]]
                        (and (= :save-block op)
                             (= ref-block-uuid (:block/uuid block))
                             (= node-ref-content (:block/title block))))
                      inverse-outliner-ops))
            (is (= title-content
                   (:block/raw-title (d/entity @conn [:block/uuid ref-block-uuid]))))
            (is (not (contains? (set (map :db/id (:block/refs (d/entity @conn [:block/uuid ref-block-uuid]))))
                                page-id)))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
            (is (= node-ref-content
                   (:block/raw-title (d/entity @conn [:block/uuid ref-block-uuid]))))
            (is (contains? (set (map :db/id (:block/refs (d/entity @conn [:block/uuid ref-block-uuid]))))
                           page-id))
            (is (nil? (:logseq.property/deleted-at (d/entity @conn [:block/uuid page-uuid]))))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id false {}))))
            (is (= title-content
                   (:block/raw-title (d/entity @conn [:block/uuid ref-block-uuid]))))
            (is (not (contains? (set (map :db/id (:block/refs (d/entity @conn [:block/uuid ref-block-uuid]))))
                                page-id)))
            (is (integer? (:logseq.property/deleted-at (d/entity @conn [:block/uuid page-uuid]))))))))))

(deftest direct-outliner-property-set-persists-set-block-property-outliner-op-test
  (testing "direct outliner-property/set-block-property! still persists singleton set-block-property forward-outliner-ops"
    (let [graph {:properties {:p2 {:logseq.property/type :default}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn (db-test/create-conn-with-blocks graph)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          block (db-test/find-block-by-content @conn "local object")
          property-id :user.property/p2]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-property/set-block-property! conn
                                                 [:block/uuid (:block/uuid block)]
                                                 property-id
                                                 "local value")
          (let [pending (#'sync-apply/pending-txs test-repo)
                property-tx (some (fn [{:keys [forward-outliner-ops]}]
                                    (when (= :set-block-property (ffirst forward-outliner-ops))
                                      forward-outliner-ops))
                                  pending)]
            (is (seq pending))
            (is (every? (comp seq :forward-outliner-ops) pending))
            (is (= [:set-block-property
                    [[:block/uuid (:block/uuid block)] property-id "local value"]]
                   (first property-tx)))))))))

(deftest canonical-set-block-property-rewrites-ref-values-to-stable-refs-test
  (testing "ref-valued set-block-property ops should persist stable entity refs instead of numeric ids"
    (let [graph {:properties {:x7 {:logseq.property/type :page
                                   :db/cardinality :db.cardinality/many}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn (db-test/create-conn-with-blocks graph)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          block (db-test/find-block-by-content @conn "local object")
          property-id :user.property/x7]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-page/create! conn "Page y" {})
          (let [page-y (db-test/find-page-by-title @conn "Page y")]
            (outliner-property/set-block-property! conn
                                                   [:block/uuid (:block/uuid block)]
                                                   property-id
                                                   (:db/id page-y))
            (let [pending (#'sync-apply/pending-txs test-repo)
                  property-tx (some (fn [{:keys [forward-outliner-ops]}]
                                      (when (= :set-block-property (ffirst forward-outliner-ops))
                                        forward-outliner-ops))
                                    pending)]
              (is (= [:set-block-property
                      [[:block/uuid (:block/uuid block)]
                       property-id
                       [:block/uuid (:block/uuid page-y)]]]
                     (first property-tx))))))))))

(deftest canonical-batch-set-property-rewrites-ref-values-to-stable-refs-test
  (testing "ref-valued batch-set-property ops should persist stable entity refs instead of numeric ids"
    (let [graph {:properties {:x7 {:logseq.property/type :page
                                   :db/cardinality :db.cardinality/many}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object 1"}
                            {:block/title "local object 2"}]}]}
          conn (db-test/create-conn-with-blocks graph)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          block-1 (db-test/find-block-by-content @conn "local object 1")
          block-2 (db-test/find-block-by-content @conn "local object 2")
          property-id :user.property/x7]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-page/create! conn "Page y" {})
          (let [page-y (db-test/find-page-by-title @conn "Page y")]
            (outliner-op/apply-ops! conn
                                    [[:batch-set-property [[(:db/id block-1)
                                                            (:db/id block-2)]
                                                           property-id
                                                           (:db/id page-y)
                                                           {}]]]
                                    {})
            (let [pending (#'sync-apply/pending-txs test-repo)
                  property-tx (some (fn [{:keys [forward-outliner-ops]}]
                                      (when (= :batch-set-property (ffirst forward-outliner-ops))
                                        forward-outliner-ops))
                                    pending)]
              (is (= [:batch-set-property
                      [[[:block/uuid (:block/uuid block-1)]
                        [:block/uuid (:block/uuid block-2)]]
                       property-id
                       [:block/uuid (:block/uuid page-y)]
                       {}]]
                     (first property-tx))))))))))

(deftest replay-batch-set-property-converts-lookup-ref-to-eid-when-entity-id-test
  (testing "replay should resolve stable lookup refs back to entity ids for batch-set-property when :entity-id? is true"
    (let [graph {:properties {:x7 {:logseq.property/type :page
                                   :db/cardinality :db.cardinality/many}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn (db-test/create-conn-with-blocks graph)
          block (db-test/find-block-by-content @conn "local object")
          property-id :user.property/x7]
      (outliner-page/create! conn "Page y" {})
      (let [page-y (db-test/find-page-by-title @conn "Page y")]
        (is (some? (#'sync-apply/replay-canonical-outliner-op!
                    conn
                    [:batch-set-property [[[:block/uuid (:block/uuid block)]]
                                          property-id
                                          [:block/uuid (:block/uuid page-y)]
                                          {:entity-id? true}]])))
        (let [block' (d/entity @conn [:block/uuid (:block/uuid block)])]
          (is (= #{"page y"}
                 (set (map :block/name (:user.property/x7 block'))))))))))

(deftest replay-batch-set-property-converts-raw-uuid-ids-to-eids-test
  (testing "replay should resolve raw uuid block ids for batch-set-property"
    (let [graph {:properties {:heading {:db/ident :logseq.property/heading
                                        :logseq.property/type :number
                                        :db/cardinality :db.cardinality/one}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn (db-test/create-conn-with-blocks graph)
          block (db-test/find-block-by-content @conn "local object")
          block-ref [:block/uuid (:block/uuid block)]]
      (is (some? (#'sync-apply/replay-canonical-outliner-op!
                  conn
                  [:batch-set-property [[(:block/uuid block)]
                                        :logseq.property/heading
                                        2
                                        nil]])))
      (is (= 2
             (:logseq.property/heading (d/entity @conn block-ref)))))))

(deftest apply-history-action-redo-replays-batch-set-property-with-raw-uuid-ids-test
  (testing "redo should replay batch-set-property when semantic op stores raw uuid block ids"
    (let [graph {:properties {:heading {:db/ident :logseq.property/heading
                                        :logseq.property/type :number
                                        :db/cardinality :db.cardinality/one}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn (db-test/create-conn-with-blocks graph)
          client-ops-conn (d/create-conn client-op/schema-in-db)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [block (db-test/find-block-by-content @conn "local object")
                block-uuid (:block/uuid block)
                block-ref [:block/uuid block-uuid]
                action-tx-id (random-uuid)]
            (ldb/transact! client-ops-conn
                           [{:db-sync/tx-id action-tx-id
                             :db-sync/pending? true
                             :db-sync/forward-outliner-ops
                             [[:batch-set-property [[block-uuid]
                                                    :logseq.property/heading
                                                    2
                                                    nil]]]
                             :db-sync/inverse-outliner-ops
                             [[:batch-remove-property [[block-ref]
                                                       :logseq.property/heading]]]
                             :db-sync/normalized-tx-data []
                             :db-sync/reversed-tx-data []}])
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo action-tx-id false {}))))
            (is (= 2
                   (:logseq.property/heading (d/entity @conn block-ref))))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo action-tx-id true {}))))
            (is (nil? (:logseq.property/heading (d/entity @conn block-ref))))))))))

(deftest replay-set-block-property-converts-lookup-ref-to-eid-test
  (testing "replay should resolve stable lookup refs back to entity ids for set-block-property"
    (let [graph {:properties {:x7 {:logseq.property/type :page
                                   :db/cardinality :db.cardinality/many}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn (db-test/create-conn-with-blocks graph)
          block (db-test/find-block-by-content @conn "local object")
          property-id :user.property/x7]
      (outliner-page/create! conn "Page y" {})
      (let [page-y (db-test/find-page-by-title @conn "Page y")]
        (is (some? (#'sync-apply/replay-canonical-outliner-op!
                    conn
                    [:set-block-property [[:block/uuid (:block/uuid block)]
                                          property-id
                                          [:block/uuid (:block/uuid page-y)]]])))
        (let [block' (d/entity @conn [:block/uuid (:block/uuid block)])]
          (is (= #{"page y"}
                 (set (map :block/name (:user.property/x7 block'))))))))))

(deftest replay-set-block-property-converts-raw-uuid-to-eid-test
  (testing "replay should resolve raw block uuid ids for set-block-property"
    (let [graph {:classes {:tag1 {}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn (db-test/create-conn-with-blocks graph)
          block (db-test/find-block-by-content @conn "local object")
          tag-id (:db/id (d/entity @conn :user.class/tag1))
          tag-uuid (:block/uuid (d/entity @conn tag-id))]
      (is (some? (#'sync-apply/replay-canonical-outliner-op!
                  conn
                  [:set-block-property [(:block/uuid block)
                                        :block/tags
                                        [:block/uuid tag-uuid]]])))
      (let [block' (d/entity @conn [:block/uuid (:block/uuid block)])]
        (is (= #{tag-id}
               (set (map :db/id (:block/tags block')))))))))

(deftest apply-history-action-redo-replays-set-block-tags-with-raw-uuid-id-test
  (testing "redo should replay set-block-property with raw block uuid ids for tags"
    (let [graph {:classes {:tag1 {}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn (db-test/create-conn-with-blocks graph)
          client-ops-conn (d/create-conn client-op/schema-in-db)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [block (db-test/find-block-by-content @conn "local object")
                block-uuid (:block/uuid block)
                block-ref [:block/uuid block-uuid]
                tag (d/entity @conn :user.class/tag1)
                tag-uuid (:block/uuid tag)
                action-tx-id (random-uuid)]
            (ldb/transact! client-ops-conn
                           [{:db-sync/tx-id action-tx-id
                             :db-sync/pending? true
                             :db-sync/forward-outliner-ops
                             [[:set-block-property [block-uuid
                                                    :block/tags
                                                    [:block/uuid tag-uuid]]]]
                             :db-sync/inverse-outliner-ops
                             [[:remove-block-property [block-ref :block/tags]]]
                             :db-sync/normalized-tx-data []
                             :db-sync/reversed-tx-data []}])
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo action-tx-id false {}))))
            (is (= #{(:db/id tag)}
                   (set (map :db/id (:block/tags (d/entity @conn block-ref))))))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo action-tx-id true {}))))
            (is (empty? (:block/tags (d/entity @conn block-ref))))))))))

(deftest apply-history-action-redo-replays-insert-blocks-test
  (testing "apply-history-action should redo an inserted block from semantic history"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          requested-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:insert-blocks [[{:block/title "history insert"
                                                      :block/uuid requested-uuid}]
                                                    (:db/id parent)
                                                    {:sibling? false}]]]
                                  local-tx-meta)
          (let [pending (first (#'sync-apply/pending-txs test-repo))
                inserted (db-test/find-block-by-content @conn "history insert")
                inserted-uuid (:block/uuid inserted)
                {:keys [tx-id]} pending]
            (is (= inserted-uuid
                   (get-in pending [:forward-outliner-ops 0 1 0 0 :block/uuid])))
            (is (= inserted-uuid
                   (second (first (get-in pending [:inverse-outliner-ops 0 1 0])))))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
            (is (nil? (d/entity @conn [:block/uuid inserted-uuid])))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id false {}))))
            (let [inserted* (d/entity @conn [:block/uuid inserted-uuid])]
              (is (some? inserted*))
              (is (= "history insert" (:block/title inserted*)))
              (is (= (:block/uuid parent)
                     (some-> inserted* :block/parent :block/uuid))))))))))

(deftest apply-history-action-redo-replays-save-block-test
  (testing "apply-history-action should redo an inline block edit from semantic history"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:save-block [{:block/uuid child-uuid
                                                  :block/title "child 1 inline edit"} {}]]]
                                  local-tx-meta)
          (let [{:keys [tx-id]} (first (#'sync-apply/pending-txs test-repo))]
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
            (is (= "child 1"
                   (:block/title (d/entity @conn [:block/uuid child-uuid]))))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id false {}))))
            (is (= "child 1 inline edit"
                   (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))))

(deftest apply-history-action-redo-rejects-save-block-with-late-created-query-ref-test
  (testing "redo should reject save-block when a referenced query block does not exist yet"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "source"}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          tx-id (random-uuid)
          query-block-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [source (db-test/find-block-by-content @conn "source")
                source-uuid (:block/uuid source)
                source-page-uuid (:block/uuid (:block/page source))]
            (is (some? (d/entity @conn [:block/uuid source-uuid])))
            (ldb/transact! client-ops-conn
                           [{:db-sync/tx-id tx-id
                             :db-sync/pending? true
                             :db-sync/created-at (.now js/Date)
                             :db-sync/outliner-op :save-block
                             :db-sync/forward-outliner-ops
                             [[:save-block [{:block/uuid source-uuid
                                             :logseq.property/query [:block/uuid query-block-uuid]}
                                            nil]]
                              [:save-block [{:block/uuid query-block-uuid
                                             :block/title ""
                                             :block/parent [:block/uuid source-page-uuid]
                                             :block/page [:block/uuid source-page-uuid]
                                             :block/order "a0"}
                                            nil]]]
                             :db-sync/inverse-outliner-ops
                             [[:remove-block-property [[:block/uuid source-uuid]
                                                       :logseq.property/query]]
                              [:delete-blocks [[[:block/uuid query-block-uuid]]
                                               {}]]]
                             :db-sync/normalized-tx-data []
                             :db-sync/reversed-tx-data []}])
            (let [error (try
                          (#'sync-apply/apply-history-action! test-repo tx-id false {})
                          nil
                          (catch :default e
                            e))]
              (is (some? error))
              (is (= :invalid-history-action-ops
                     (:reason (ex-data error))))
              (is (nil? (d/entity @conn [:block/uuid query-block-uuid])))
              (is (nil? (some-> (d/entity @conn [:block/uuid source-uuid])
                                :logseq.property/query))))))))))

(deftest replay-save-block-missing-block-is-invalid-test
  (testing "replay save-block should reject missing block even when parent/page attrs are present"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "seed"}]}]})
          seed (db-test/find-block-by-content @conn "seed")
          page-uuid (:block/uuid (:block/page seed))
          block-uuid (random-uuid)]
      (is (thrown? js/Error
                   (#'sync-apply/replay-canonical-outliner-op!
                    conn
                    [:save-block [{:block/uuid block-uuid
                                   :block/title ""
                                   :block/parent [:block/uuid page-uuid]
                                   :block/page [:block/uuid page-uuid]
                                   :block/order "a0"}
                                  nil]])))
      (is (nil? (d/entity @conn [:block/uuid block-uuid]))))))

(deftest apply-history-action-redo-replays-status-property-test
  (testing "apply-history-action should redo a status property change"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "task"
                             :build/properties {:status "Todo"}}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [task (db-test/find-block-by-content @conn "task")
                task-uuid (:block/uuid task)]
            (outliner-property/set-block-property! conn
                                                   (:db/id task)
                                                   :logseq.property/status
                                                   "Doing")
            (let [{:keys [tx-id]} (first (#'sync-apply/pending-txs test-repo))]
              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
              (is (= :logseq.property/status.todo
                     (some-> (d/entity @conn [:block/uuid task-uuid])
                             :logseq.property/status
                             :db/ident)))
              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo tx-id false {}))))
              (is (= :logseq.property/status.doing
                     (some-> (d/entity @conn [:block/uuid task-uuid])
                             :logseq.property/status
                             :db/ident))))))))))

(deftest apply-history-action-redo-replays-upsert-property-test
  (testing "apply-history-action should undo/redo creating a new property page"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "seed"}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          property-name "custom_prop_x"
          property-page-ids (fn [db]
                              (set (d/q '[:find [?e ...]
                                          :where
                                          [?e :block/tags :logseq.class/Property]]
                                        db)))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [before-ids (property-page-ids @conn)]
            (outliner-op/apply-ops! conn
                                    [[:upsert-property [nil
                                                        {:logseq.property/type :default}
                                                        {:property-name property-name}]]]
                                    local-tx-meta)
            (let [after-ids (property-page-ids @conn)
                  created-id (first (seq (set/difference after-ids before-ids)))
                  created-ident (some-> (d/entity @conn created-id) :db/ident)
                  created-uuid (some-> (d/entity @conn created-id) :block/uuid)
                  {:keys [tx-id]} (first (#'sync-apply/pending-txs test-repo))]
              (is (some? created-id))
              (is (keyword? created-ident))
              (is (uuid? created-uuid))
              (is (some? (d/entity @conn created-id)))
              (let [pending (#'sync-apply/pending-tx-by-id test-repo tx-id)]
                (is (= :upsert-property
                       (ffirst (:forward-outliner-ops pending))))
                (is (= created-ident
                       (get-in pending [:forward-outliner-ops 0 1 0])))
                (is (= :delete-page
                       (ffirst (:inverse-outliner-ops pending))))
                (is (= created-uuid
                       (get-in pending [:inverse-outliner-ops 0 1 0]))
                    (pr-str pending)))
              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
              (is (nil? (d/entity @conn created-ident)))
              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo tx-id false {}))))
              (let [restored (d/entity @conn created-ident)]
                (is (some? restored))
                (is (= created-uuid (:block/uuid restored)))))))))))

(deftest apply-history-action-redo-replays-block-concat-test
  (testing "block concat history should undo via reversed tx and redo cleanly"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "hellohello"}
                            {:block/title "hello"}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [left (db-test/find-block-by-content @conn "hellohello")
                right (db-test/find-block-by-content @conn "hello")
                left-uuid (:block/uuid left)
                right-uuid (:block/uuid right)]
            (outliner-op/apply-ops! conn
                                    [[:delete-blocks [[(:db/id right)]
                                                      {:deleted-by-uuid (random-uuid)}]]
                                     [:save-block [{:block/uuid left-uuid
                                                    :block/title "hellohellohello"} nil]]]
                                    local-tx-meta)
            (let [{:keys [tx-id]} (first (#'sync-apply/pending-txs test-repo))]
              (is (= "hellohellohello"
                     (:block/title (d/entity @conn [:block/uuid left-uuid]))))
              (is (nil? (d/entity @conn [:block/uuid right-uuid])))
              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
              (is (= "hellohello"
                     (:block/title (d/entity @conn [:block/uuid left-uuid]))))
              (is (some? (d/entity @conn [:block/uuid right-uuid])))
              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo tx-id false {}))))
              (is (= "hellohellohello"
                     (:block/title (d/entity @conn [:block/uuid left-uuid]))))
              (is (nil? (d/entity @conn [:block/uuid right-uuid]))))))))))

(deftest apply-history-action-redo-replays-save-then-insert-test
  (testing "apply-history-action should redo a combined save-block then insert-block history action"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          child-id (:db/id child1)
          inserted-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:save-block [{:block/uuid child-uuid
                                                  :block/title "child 1 edited"} {}]]
                                   [:insert-blocks [[{:block/title "inserted after save"
                                                      :block/uuid inserted-uuid}]
                                                    child-id
                                                    {:sibling? true}]]]
                                  local-tx-meta)
          (let [{:keys [tx-id]} (first (#'sync-apply/pending-txs test-repo))
                inserted-id (d/q '[:find ?e .
                                   :in $ ?title
                                   :where
                                   [?e :block/title ?title]]
                                 @conn
                                 "inserted after save")
                inserted (d/entity @conn inserted-id)
                inserted-uuid' (:block/uuid inserted)]
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
            (is (= "child 1"
                   (:block/title (d/entity @conn [:block/uuid child-uuid]))))
            (is (nil? (d/entity @conn [:block/uuid inserted-uuid'])))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id false {}))))
            (is (= "child 1 edited"
                   (:block/title (d/entity @conn [:block/uuid child-uuid]))))
            (is (= "inserted after save"
                   (:block/title (d/entity @conn [:block/uuid inserted-uuid']))))))))))

(deftest apply-history-action-redo-replays-paste-into-empty-target-test
  (testing "redo should replay paste into an empty target block without invalid rebase op"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "first"}
                            {:block/title ""}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          empty-target (db-test/find-block-by-content @conn "")
          empty-target-uuid (:block/uuid empty-target)
          parent-uuid (random-uuid)
          copied-blocks [{:block/uuid parent-uuid
                          :block/title "paste parent"}
                         {:block/uuid (random-uuid)
                          :block/title "paste child"
                          :block/parent [:block/uuid parent-uuid]}]]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:insert-blocks [copied-blocks
                                                    (:db/id empty-target)
                                                    {:sibling? true
                                                     :outliner-op :paste
                                                     :replace-empty-target? true}]]]
                                  local-tx-meta)
          (let [pending (first (#'sync-apply/pending-txs test-repo))
                {:keys [tx-id]} pending
                pasted-id (d/q '[:find ?e .
                                 :in $ ?title
                                 :where
                                 [?e :block/title ?title]]
                               @conn
                               "paste parent")
                pasted-child-id (d/q '[:find ?e .
                                       :in $ ?title
                                       :where
                                       [?e :block/title ?title]]
                                     @conn
                                     "paste child")
                pasted (d/entity @conn pasted-id)
                pasted-uuid (:block/uuid pasted)
                pasted-child-uuid (:block/uuid (d/entity @conn pasted-child-id))]
            (is (some #(and (= :delete-blocks (first %))
                            (= [[:block/uuid empty-target-uuid]]
                               (vec (get-in % [1 0]))))
                      (:inverse-outliner-ops pending)))
            (is (some #(and (= :insert-blocks (first %))
                            (= empty-target-uuid
                               (get-in % [1 0 0 :block/uuid])))
                      (:inverse-outliner-ops pending)))
            (is (not-any? #(= :save-block (first %))
                          (:inverse-outliner-ops pending)))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
            (let [restored-target (d/entity @conn [:block/uuid empty-target-uuid])]
              (is (some? restored-target))
              (is (= "" (:block/title restored-target))))
            (is (nil? (d/entity @conn [:block/uuid pasted-child-uuid])))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id false {}))))
            (let [redone (d/entity @conn [:block/uuid pasted-uuid])]
              (is (some? redone))
              (is (= "paste parent" (:block/title redone))))))))))

(deftest apply-history-action-redo-replays-insert-save-delete-sequence-test
  (testing "history actions replay insert -> save -> recycle-delete in undo/redo order"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          inserted-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:insert-blocks [[{:block/title "draft"
                                                      :block/uuid inserted-uuid}]
                                                    (:db/id parent)
                                                    {:sibling? false}]]]
                                  local-tx-meta)
          (let [inserted (db-test/find-block-by-content @conn "draft")
                inserted-uuid' (:block/uuid inserted)]
            (outliner-op/apply-ops! conn
                                    [[:save-block [{:block/uuid inserted-uuid'
                                                    :block/title "published"} {}]]]
                                    local-tx-meta)
            (outliner-core/delete-blocks! conn
                                          [(d/entity @conn [:block/uuid inserted-uuid'])]
                                          {})
            (let [pending (#'sync-apply/pending-txs test-repo)
                  insert-action (some #(when (= :insert-blocks (:outliner-op %)) %) pending)
                  save-action (some #(when (= :save-block (:outliner-op %)) %) pending)
                  delete-action (some #(when (= :delete-blocks (:outliner-op %)) %) pending)]
              (is (some? insert-action))
              (is (some? save-action))
              (is (some? delete-action))
              (is (nil? (d/entity @conn [:block/uuid inserted-uuid'])))

              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo
                                                                    (:tx-id delete-action)
                                                                    true
                                                                    {}))))
              (is (= "published"
                     (:block/title (d/entity @conn [:block/uuid inserted-uuid']))))

              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo
                                                                    (:tx-id save-action)
                                                                    true
                                                                    {}))))
              (is (= "draft"
                     (:block/title (d/entity @conn [:block/uuid inserted-uuid']))))

              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo
                                                                    (:tx-id save-action)
                                                                    false
                                                                    {}))))
              (is (= "published"
                     (:block/title (d/entity @conn [:block/uuid inserted-uuid']))))

              (is (= true
                     (:applied? (#'sync-apply/apply-history-action! test-repo
                                                                    (:tx-id delete-action)
                                                                    false
                                                                    {}))))
              (is (nil? (d/entity @conn [:block/uuid inserted-uuid']))))))))))

(deftest apply-history-action-undo-keeps-working-after-remote-non-structural-update-test
  (testing "undo/redo of local semantic save still works after a remote metadata-only update"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          child-id (:db/id child1)
          child-uuid (:block/uuid child1)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:save-block [{:block/uuid child-uuid
                                                  :block/title "local-2"} {}]]]
                                  local-tx-meta)
          (let [{:keys [tx-id]} (first (#'sync-apply/pending-txs test-repo))]
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add child-id :block/updated-at 12345]])
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
            (is (= "child 1"
                   (:block/title (d/entity @conn [:block/uuid child-uuid]))))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo tx-id false {}))))
            (is (= "local-2"
                   (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))))

(deftest apply-history-action-undo-restores-hard-deleted-block-via-semantic-inverse-test
  (testing "history action undo restores a hard-deleted block via semantic inverse ops"
    (let [{:keys [conn client-ops-conn child1 parent]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          parent-uuid (some-> child1 :block/parent :block/uuid)
          page-uuid (some-> parent :block/page :block/uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [_ (outliner-core/delete-blocks! conn
                                                [(d/entity @conn [:block/uuid child-uuid])]
                                                {})
                delete-action (->> (#'sync-apply/pending-txs test-repo)
                                   (filter #(= :delete-blocks (:outliner-op %)))
                                   last)
                deleted (d/entity @conn [:block/uuid child-uuid])]
            (is (some? delete-action))
            (is (nil? deleted))
            (is (= :insert-blocks
                   (ffirst (:inverse-outliner-ops delete-action))))

            (let [undo-result (#'sync-apply/apply-history-action! test-repo
                                                                  (:tx-id delete-action)
                                                                  true
                                                                  {})]
              (is (= true (:applied? undo-result)))
              (is (= :semantic-ops (:source undo-result))))
            (let [restored (d/entity @conn [:block/uuid child-uuid])]
              (is (= page-uuid (some-> restored :block/page :block/uuid)))
              (is (= parent-uuid (some-> restored :block/parent :block/uuid)))
              (is (nil? (:logseq.property/deleted-at restored))))))))))

(deftest apply-history-action-undo-restores-multi-parent-delete-via-semantic-inverse-test
  (testing "history action undo restores deleted roots to their original parents when roots span multiple parents"
    (let [{:keys [conn client-ops-conn parent-a parent-b a-child-1 b-child-1]} (setup-two-parents)
          a-child-uuid (:block/uuid a-child-1)
          b-child-uuid (:block/uuid b-child-1)
          parent-a-uuid (:block/uuid parent-a)
          parent-b-uuid (:block/uuid parent-b)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-core/delete-blocks! conn
                                        [(d/entity @conn [:block/uuid a-child-uuid])
                                         (d/entity @conn [:block/uuid b-child-uuid])]
                                        {})
          (let [delete-action (->> (#'sync-apply/pending-txs test-repo)
                                   (filter #(= :delete-blocks (:outliner-op %)))
                                   last)]
            (is (some? delete-action))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo
                                                                  (:tx-id delete-action)
                                                                  true
                                                                  {}))))
            (let [restored-a (d/entity @conn [:block/uuid a-child-uuid])
                  restored-b (d/entity @conn [:block/uuid b-child-uuid])]
              (is (= parent-a-uuid (some-> restored-a :block/parent :block/uuid)))
              (is (= parent-b-uuid (some-> restored-b :block/parent :block/uuid))))))))))

(deftest move-blocks-multi-parent-builds-per-root-inverse-history-test
  (testing "move-blocks across different source parents builds per-root inverse move ops"
    (let [{:keys [conn client-ops-conn parent-b a-child-1 b-child-1 parent-a]} (setup-two-parents)
          a-child-uuid (:block/uuid a-child-1)
          b-child-uuid (:block/uuid b-child-1)
          parent-a-uuid (:block/uuid parent-a)
          parent-b-uuid (:block/uuid parent-b)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:move-blocks [[(:db/id a-child-1)
                                                   (:db/id b-child-1)]
                                                  (:db/id parent-b)
                                                  {:sibling? false}]]]
                                  local-tx-meta)
          (let [move-action (->> (#'sync-apply/pending-txs test-repo)
                                 (filter #(= :move-blocks (:outliner-op %)))
                                 last)
                inverse-ops (:inverse-outliner-ops move-action)]
            (is (some? move-action))
            (is (= 2 (count inverse-ops)))
            (is (some #(and (= :move-blocks (first %))
                            (= [[:block/uuid a-child-uuid]] (get-in % [1 0]))
                            (= [:block/uuid parent-a-uuid] (get-in % [1 1]))
                            (= false (get-in % [1 2 :sibling?])))
                      inverse-ops))
            (is (some #(and (= :move-blocks (first %))
                            (= [[:block/uuid b-child-uuid]] (get-in % [1 0]))
                            (= [:block/uuid parent-b-uuid] (get-in % [1 1]))
                            (= false (get-in % [1 2 :sibling?])))
                      inverse-ops))))))))

(deftest apply-history-action-undo-restores-multi-parent-move-via-semantic-inverse-test
  (testing "history action undo restores moved roots to original parents when roots span multiple parents"
    (let [{:keys [conn client-ops-conn parent-b a-child-1 b-child-1 parent-a]} (setup-two-parents)
          a-child-uuid (:block/uuid a-child-1)
          b-child-uuid (:block/uuid b-child-1)
          parent-a-uuid (:block/uuid parent-a)
          parent-b-uuid (:block/uuid parent-b)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:move-blocks [[(:db/id a-child-1)
                                                   (:db/id b-child-1)]
                                                  (:db/id parent-b)
                                                  {:sibling? false}]]]
                                  local-tx-meta)
          (let [move-action (->> (#'sync-apply/pending-txs test-repo)
                                 (filter #(= :move-blocks (:outliner-op %)))
                                 last)]
            (is (some? move-action))
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo
                                                                  (:tx-id move-action)
                                                                  true
                                                                  {}))))
            (let [restored-a (d/entity @conn [:block/uuid a-child-uuid])
                  restored-b (d/entity @conn [:block/uuid b-child-uuid])]
              (is (= parent-a-uuid (some-> restored-a :block/parent :block/uuid)))
              (is (= parent-b-uuid (some-> restored-b :block/parent :block/uuid))))))))))

(deftest apply-history-action-undo-replays-move-blocks-with-nested-lookup-ref-id-test
  (testing "undo should replay move-blocks when ids contain a nested lookup-ref wrapper"
    (let [{:keys [conn client-ops-conn parent-b a-child-1]} (setup-two-parents)
          tx-id (random-uuid)
          child-uuid (:block/uuid a-child-1)
          target-parent-uuid (:block/uuid parent-b)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/pending? true
                           :db-sync/created-at (.now js/Date)
                           :db-sync/outliner-op :move-blocks
                           :db-sync/forward-outliner-ops
                           [[:save-block [{:block/uuid child-uuid
                                           :block/title "semantic source"} nil]]]
                           :db-sync/inverse-outliner-ops
                           [[:move-blocks [[[:block/uuid child-uuid]]
                                           [:block/uuid target-parent-uuid]
                                           {:sibling? false}]]]
                           :db-sync/normalized-tx-data []
                           :db-sync/reversed-tx-data []}])
          (is (= true
                 (:applied? (#'sync-apply/apply-history-action! test-repo tx-id true {}))))
          (is (= target-parent-uuid
                 (some-> (d/entity @conn [:block/uuid child-uuid])
                         :block/parent
                         :block/uuid))))))))

(deftest direct-outliner-core-insert-blocks-persists-insert-blocks-outliner-op-test
  (testing "direct outliner-core/insert-blocks! still persists singleton insert-blocks forward-outliner-ops"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-core/insert-blocks! conn
                                        [{:block/title "direct insert"}]
                                        parent
                                        {:sibling? false})
          (let [{:keys [forward-outliner-ops]} (first (#'sync-apply/pending-txs test-repo))]
            (is (= :insert-blocks (ffirst forward-outliner-ops)))
            (is (= [:block/uuid (:block/uuid parent)]
                   (get-in forward-outliner-ops [0 1 1])))))))))

(deftest rebase-create-page-keeps-page-uuid-test
  (testing "rebased create-page should preserve the original page uuid"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          page-title "rebase page uuid"]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:create-page [page-title {:redirect? false
                                                              :split-namespace? true
                                                              :tags ()}]]]
                                  local-tx-meta)
          (let [page-before (db-test/find-page-by-title @conn page-title)
                page-uuid (:block/uuid page-before)
                pending-before (last (#'sync-apply/pending-txs test-repo))]
            (is (= :create-page (ffirst (:forward-outliner-ops pending-before))))
            (is (= page-uuid (get-in pending-before [:forward-outliner-ops 0 1 1 :uuid])))
            (is (= :delete-page
                   (ffirst (:inverse-outliner-ops pending-before))))
            (is (= page-uuid
                   (get-in pending-before [:inverse-outliner-ops 0 1 0])))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id parent) :block/title "parent remote create-page"]])
            (let [page-after (db-test/find-page-by-title @conn page-title)]
              (is (some? page-after))
              (is (= page-uuid (:block/uuid page-after))))))))))

(deftest rebase-insert-blocks-keeps-block-uuid-test
  (testing "rebased insert-blocks should preserve the original block uuid"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:insert-blocks [[{:block/title "rebase uuid block"
                                                      :block/uuid (random-uuid)}]
                                                    (:db/id parent)
                                                    {:sibling? false}]]]
                                  local-tx-meta)
          (let [block-before (db-test/find-block-by-content @conn "rebase uuid block")
                block-uuid (:block/uuid block-before)
                pending-before (last (#'sync-apply/pending-txs test-repo))]
            (is (some? block-before))
            (is (= :insert-blocks (ffirst (:forward-outliner-ops pending-before))))
            (is (= block-uuid
                   (get-in pending-before [:forward-outliner-ops 0 1 0 0 :block/uuid])))
            (is (= true (get-in pending-before [:forward-outliner-ops 0 1 2 :keep-uuid?])))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id parent) :block/title "parent remote insert-blocks"]])
            (let [block-after (d/entity @conn [:block/uuid block-uuid])]
              (is (some? block-after))
              (is (= block-uuid (:block/uuid block-after))))))))))

(deftest rebase-insert-indent-save-sequence-keeps-structural-state-test
  (testing "rebasing insert -> indent -> save keeps parent linkage and local page attrs stable"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "parent"
                             :build/children [{:block/title "child 1"}]}]}
                  {:page {:block/title "page 2"}
                   :blocks []}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          parent (db-test/find-block-by-content @conn "parent")
          page-1 (db-test/find-page-by-title @conn "page 1")
          page-2 (db-test/find-page-by-title @conn "page 2")
          parent-uuid (:block/uuid parent)
          block-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-core/insert-blocks! conn
                                        [{:block/uuid block-uuid
                                          :block/title ""}]
                                        parent
                                        {:sibling? true
                                         :keep-uuid? true})
          (let [inserted (d/entity @conn [:block/uuid block-uuid])]
            (outliner-core/indent-outdent-blocks! conn [inserted] true)
            (outliner-core/save-block! conn
                                       (assoc (d/entity @conn [:block/uuid block-uuid])
                                              :block/title "121")
                                       {}))
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           [[:db/retract [:block/uuid parent-uuid] :block/parent [:block/uuid (:block/uuid page-1)]]
            [:db/add [:block/uuid parent-uuid] :block/parent [:block/uuid (:block/uuid page-2)]]
            [:db/retract [:block/uuid parent-uuid] :block/page [:block/uuid (:block/uuid page-1)]]
            [:db/add [:block/uuid parent-uuid] :block/page [:block/uuid (:block/uuid page-2)]]
            [:db/retract [:block/uuid parent-uuid] :block/order (:block/order parent)]
            [:db/add [:block/uuid parent-uuid] :block/order "a0"]])
          (let [block-after (d/entity @conn [:block/uuid block-uuid])]
            (is (some? block-after))
            (is (= "121" (:block/title block-after)))
            (is (= parent-uuid (-> block-after :block/parent :block/uuid)))
            (is (= (:block/uuid page-1) (-> block-after :block/page :block/uuid)))))))))

(deftest reaction-remove-enqueues-pending-sync-tx-test
  (testing "removing a reaction should enqueue tx for db-sync"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:toggle-reaction [(:block/uuid parent) "+1" nil]]]
                                  local-tx-meta)
          (let [reaction-eid (-> (d/datoms @conn :avet :logseq.property.reaction/target (:db/id parent))
                                 first
                                 :e)
                before-count (count (#'sync-apply/pending-txs test-repo))]
            (is (some? reaction-eid))
            (outliner-op/apply-ops! conn
                                    [[:toggle-reaction [(:block/uuid parent) "+1" nil]]]
                                    local-tx-meta)
            (let [after-count (count (#'sync-apply/pending-txs test-repo))]
              (is (> after-count before-count)))))))))

(deftest rebase-marks-stale-reaction-tx-non-pending-immediately-test
  (testing "stale pending reaction tx is marked non-pending during rebase to avoid re-upload"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          target-uuid (:block/uuid parent)
          remote-delete-tx (:tx-data (outliner-core/delete-blocks @conn [parent] {}))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:toggle-reaction [target-uuid "+1" nil]]]
                                  local-tx-meta)
          (let [pending-before (#'sync-apply/pending-txs test-repo)
                tx-id-before (:tx-id (first pending-before))]
            (is (= 1 (count pending-before)))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             remote-delete-tx)
            (let [pending-after (#'sync-apply/pending-txs test-repo)
                  tx-ent-after (d/entity @client-ops-conn [:db-sync/tx-id tx-id-before])]
              (is (empty? pending-after))
              (is (some? tx-ent-after))
              (is (= false (:db-sync/pending? tx-ent-after))))))))))

(deftest tx-batch-ok-removes-acked-pending-txs-test
  (testing "tx/batch/ok clears inflight and removes acked pending txs"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}
          raw-message (js/JSON.stringify (clj->js {:type "tx/batch/ok"
                                                   :t 1}))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (worker-page/create! conn "Ack Page" :uuid (random-uuid))
          (let [pending-before (#'sync-apply/pending-txs test-repo)
                tx-ids (mapv :tx-id pending-before)]
            (is (seq pending-before))
            (reset! (:inflight client) tx-ids)
            (sync-handle-message/handle-message! test-repo client raw-message)
            (is (= [] @(:inflight client)))
            (is (empty? (#'sync-apply/pending-txs test-repo)))
            (is (= 1 (client-op/get-local-tx test-repo)))))))))

(deftest tx-batch-ok-removes-only-inflight-acked-pending-txs-test
  (testing "tx/batch/ok should only clear pending txs tracked in inflight"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}
          raw-message (js/JSON.stringify (clj->js {:type "tx/batch/ok"
                                                   :t 1}))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (worker-page/create! conn "Ack Page A" :uuid (random-uuid))
          (worker-page/create! conn "Ack Page B" :uuid (random-uuid))
          (let [pending-before (#'sync-apply/pending-txs test-repo)
                [acked-tx-id unacked-tx-id] (mapv :tx-id pending-before)]
            (is (= 2 (count pending-before)))
            (reset! (:inflight client) [acked-tx-id])
            (sync-handle-message/handle-message! test-repo client raw-message)
            (is (= [] @(:inflight client)))
            (is (= [unacked-tx-id]
                   (mapv :tx-id (#'sync-apply/pending-txs test-repo))))
            (is (= 1 (client-op/get-local-tx test-repo)))))))))

(deftest apply-remote-tx-does-not-clear-pending-without-ack-test
  (testing "apply-remote-tx should not clear local pending txs before tx/batch/ok ack"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          parent-uuid (:block/uuid parent)
          block-uuid (random-uuid)
          remote-conn (d/conn-from-db @conn)
          *remote-tx (atom nil)]
      (d/listen! remote-conn ::capture-remote-same-insert
                 (fn [tx-report]
                   (when (seq (:tx-data tx-report))
                     (reset! *remote-tx
                             (db-normalize/normalize-tx-data
                              (:db-after tx-report)
                              (:db-before tx-report)
                              (:tx-data tx-report))))))
      (try
        (with-datascript-conns conn client-ops-conn
          (fn []
            (outliner-core/insert-blocks! conn
                                          [{:block/title "same insert"
                                            :block/uuid block-uuid}]
                                          parent
                                          {:sibling? false
                                           :keep-uuid? true})
            (let [pending-before (#'sync-apply/pending-txs test-repo)
                  pending-before-tx-ids (mapv :tx-id pending-before)
                  remote-parent (d/entity @remote-conn [:block/uuid parent-uuid])]
              (is (= 1 (count pending-before)))
              (outliner-core/insert-blocks! remote-conn
                                            [{:block/title "same insert"
                                              :block/uuid block-uuid}]
                                            remote-parent
                                            {:sibling? false
                                             :keep-uuid? true})
              (is (seq @*remote-tx))
              (#'sync-apply/apply-remote-tx! test-repo nil @*remote-tx)
              (let [pending-after (#'sync-apply/pending-txs test-repo)]
                (is (= pending-before-tx-ids
                       (mapv :tx-id pending-after)))
                (is (= 1 (count pending-after)))))))
        (finally
          (d/unlisten! remote-conn ::capture-remote-same-insert))))))

(deftest tx-batch-ok-stale-ack-does-not-regress-local-or-remote-checksum-state-test
  (testing "stale tx/batch/ok should not regress local tx or latest remote checksum state"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          actual-checksum (sync-checksum/recompute-checksum @conn)
          stale-checksum "ffffffffffffffff"
          latest-tx-prev @db-sync/*repo->latest-remote-tx
          latest-checksum-prev @db-sync/*repo->latest-remote-checksum
          *captured (atom nil)
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}
          raw-message (js/JSON.stringify (clj->js {:type "tx/batch/ok"
                                                   :t 4
                                                   :checksum stale-checksum}))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (reset! db-sync/*repo->latest-remote-tx {test-repo 5})
          (reset! db-sync/*repo->latest-remote-checksum {test-repo actual-checksum})
          (client-op/update-local-tx test-repo 5)
          (client-op/update-local-checksum test-repo actual-checksum)
          (try
            (with-redefs [sync-log-state/rtc-log (fn [type payload]
                                                   (reset! *captured {:type type
                                                                      :payload payload}))]
              (sync-handle-message/handle-message! test-repo client raw-message))
            (is (= [] @(:inflight client)))
            (is (= 5 (client-op/get-local-tx test-repo)))
            (is (= 5 (get @db-sync/*repo->latest-remote-tx test-repo)))
            (is (= actual-checksum (get @db-sync/*repo->latest-remote-checksum test-repo)))
            (is (nil? @*captured))
            (finally
              (reset! db-sync/*repo->latest-remote-tx latest-tx-prev)
              (reset! db-sync/*repo->latest-remote-checksum latest-checksum-prev))))))))

(deftest tx-batch-ok-real-checksum-mismatch-logs-warning-test
  (testing "tx/batch/ok logs warning on true checksum mismatch without throwing"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          stale-checksum "0000000000000000"
          remote-checksum "ffffffffffffffff"
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}
          raw-message (js/JSON.stringify (clj->js {:type "tx/batch/ok"
                                                   :t 0
                                                   :checksum remote-checksum}))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (client-op/update-local-checksum test-repo stale-checksum)
          (is (= :ok
                 (try
                   (sync-handle-message/handle-message! test-repo client raw-message)
                   :ok
                   (catch :default _error
                     :thrown)))))))))

(deftest tx-batch-ok-real-checksum-mismatch-emits-rtc-log-test
  (testing "tx/batch/ok mismatch emits :rtc.log/checksum-mismatch payload"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          stale-checksum "0000000000000000"
          remote-checksum "ffffffffffffffff"
          *captured (atom nil)
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}
          raw-message (js/JSON.stringify (clj->js {:type "tx/batch/ok"
                                                   :t 0
                                                   :checksum remote-checksum}))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (with-redefs [sync-log-state/rtc-log (fn [type payload]
                                                 (reset! *captured {:type type
                                                                    :payload payload}))]
            (client-op/update-local-checksum test-repo stale-checksum)
            (sync-handle-message/handle-message! test-repo client raw-message)
            (let [{:keys [type payload]} @*captured]
              (is (= :rtc.log/checksum-mismatch type))
              (is (= "tx/batch/ok" (:message-type payload)))
              (is (= stale-checksum (:cached-local-checksum payload)))
              (is (string? (:local-checksum payload)))
              (is (= remote-checksum (:remote-checksum payload))))))))))

(deftest tx-batch-ok-real-checksum-mismatch-heals-remote-checksum-cache-test
  (testing "tx/batch/ok mismatch should repair latest remote checksum cache to local recomputed checksum"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          stale-checksum "0000000000000000"
          remote-checksum "ffffffffffffffff"
          actual-checksum (sync-checksum/recompute-checksum @conn)
          latest-checksum-prev @db-sync/*repo->latest-remote-checksum
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}
          raw-message (js/JSON.stringify (clj->js {:type "tx/batch/ok"
                                                   :t 0
                                                   :checksum remote-checksum}))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (try
            (reset! db-sync/*repo->latest-remote-checksum {})
            (client-op/update-local-checksum test-repo stale-checksum)
            (sync-handle-message/handle-message! test-repo client raw-message)
            (is (= actual-checksum
                   (get @db-sync/*repo->latest-remote-checksum test-repo)))
            (finally
              (reset! db-sync/*repo->latest-remote-checksum latest-checksum-prev))))))))

(deftest tx-batch-ok-stale-local-checksum-cache-does-not-emit-mismatch-test
  (testing "stale cached local checksum is corrected by recompute before mismatch logging"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          stale-checksum "0000000000000000"
          actual-checksum (sync-checksum/recompute-checksum @conn)
          *captured (atom nil)
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}
          raw-message (js/JSON.stringify (clj->js {:type "tx/batch/ok"
                                                   :t 0
                                                   :checksum actual-checksum}))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (with-redefs [sync-log-state/rtc-log (fn [type payload]
                                                 (reset! *captured {:type type
                                                                    :payload payload}))]
            (client-op/update-local-checksum test-repo stale-checksum)
            (sync-handle-message/handle-message! test-repo client raw-message)
            (is (= actual-checksum (client-op/get-local-checksum test-repo)))
            (is (nil? @*captured))))))))

(deftest local-checksum-stays-in-sync-after-undo-redo-sequence-test
  (testing "insert/delete/indent/outdent with undo-all/redo-all keeps cached checksum aligned"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          inserted-uuid (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (client-op/update-local-checksum test-repo (sync-checksum/recompute-checksum @conn))
          (d/listen! conn ::checksum-sync
                     (fn [tx-report]
                       (when-not (:batch-tx? @conn)
                         (when (seq (:tx-data tx-report))
                           (db-sync/update-local-sync-checksum! test-repo tx-report)))))
          (try
            (outliner-core/insert-blocks! conn
                                          [{:block/uuid inserted-uuid
                                            :block/title "tmp"}]
                                          parent
                                          {:sibling? false
                                           :keep-uuid? true})
            (let [inserted (d/entity @conn [:block/uuid inserted-uuid])]
              (outliner-core/indent-outdent-blocks! conn [inserted] true)
              (outliner-core/indent-outdent-blocks! conn [inserted] false)
              (outliner-core/delete-blocks @conn [inserted] {}))
            (loop [n 0]
              (let [result (undo-redo/undo test-repo)]
                (when-not (= :frontend.worker.undo-redo/empty-undo-stack result)
                  (when (> n 128)
                    (throw (ex-info "undo loop exceeded" {:count n})))
                  (recur (inc n)))))
            (loop [n 0]
              (let [result (undo-redo/redo test-repo)]
                (when-not (= :frontend.worker.undo-redo/empty-redo-stack result)
                  (when (> n 128)
                    (throw (ex-info "redo loop exceeded" {:count n})))
                  (recur (inc n)))))
            (is (= (sync-checksum/recompute-checksum @conn)
                   (client-op/get-local-checksum test-repo)))
            (finally
              (d/unlisten! conn ::checksum-sync))))))))

(deftest reparent-block-when-cycle-detected-test
  (testing "cycle from remote sync reparent block to page root"
    (let [{:keys [conn parent child1]} (setup-parent-child)]
      (with-datascript-conns conn nil
        (fn []
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id parent) :block/parent (:db/id child1)]
            [:db/add (:db/id child1) :block/parent (:db/id (:block/page parent))]])
          (let [parent' (d/entity @conn (:db/id parent))
                child1' (d/entity @conn (:db/id child1))
                page' (:block/page parent')]
            (is (some? page'))
            (is (= (:db/id child1') (:db/id (:block/parent parent'))))
            (is (= (:db/id page') (:db/id (:block/parent child1'))))))))))

(deftest two-children-cycle-test
  (testing "conflicting parent updates can retain the local cycle shape (2 children)"
    (let [{:keys [conn client-ops-conn child1 child2]} (setup-parent-child)
          remote-conn (d/conn-from-db @conn)
          child1-uuid (:block/uuid child1)
          child2-uuid (:block/uuid child2)
          *remote-tx (atom nil)]
      (d/listen! remote-conn ::capture-two-children-cycle-remote
                 (fn [tx-report]
                   (when-not @*remote-tx
                     (reset! *remote-tx
                             (db-normalize/normalize-tx-data
                              (:db-after tx-report)
                              (:db-before tx-report)
                              (:tx-data tx-report))))))
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child1) :block/parent (:db/id child2)]])
          (let [remote-child1 (d/entity @remote-conn [:block/uuid child1-uuid])
                remote-child2 (d/entity @remote-conn [:block/uuid child2-uuid])]
            (outliner-core/move-blocks! remote-conn
                                        [remote-child2]
                                        remote-child1
                                        {:sibling? false}))
          (is (seq @*remote-tx))
          (#'sync-apply/apply-remote-tx! test-repo nil @*remote-tx)
          (let [child1' (d/entity @conn [:block/uuid child1-uuid])
                child2' (d/entity @conn [:block/uuid child2-uuid])]
            (is (= "parent" (:block/title (:block/parent child1'))))
            (is (= "child 1" (:block/title (:block/parent child2')))))))
      (d/unlisten! remote-conn ::capture-two-children-cycle-remote))))

(deftest three-children-cycle-test
  (testing "conflicting parent updates can retain a cycle shape (3 children)"
    (let [{:keys [conn client-ops-conn child1 child2 child3]} (setup-parent-child)
          remote-conn (d/conn-from-db @conn)
          child1-uuid (:block/uuid child1)
          child2-uuid (:block/uuid child2)
          child3-uuid (:block/uuid child3)
          *remote-txs (atom [])]
      (d/listen! remote-conn ::capture-three-children-cycle-remote
                 (fn [tx-report]
                   (when (seq (:tx-data tx-report))
                     (swap! *remote-txs conj
                            (db-normalize/normalize-tx-data
                             (:db-after tx-report)
                             (:db-before tx-report)
                             (:tx-data tx-report))))))
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child2) :block/parent (:db/id child1)]
                             [:db/add (:db/id child3) :block/parent (:db/id child2)]])
          (let [remote-child1 (d/entity @remote-conn [:block/uuid child1-uuid])
                remote-child2 (d/entity @remote-conn [:block/uuid child2-uuid])
                remote-child3 (d/entity @remote-conn [:block/uuid child3-uuid])]
            (outliner-core/move-blocks! remote-conn
                                        [remote-child2]
                                        remote-child3
                                        {:sibling? false})
            (outliner-core/move-blocks! remote-conn
                                        [remote-child1]
                                        remote-child2
                                        {:sibling? false}))
          (is (= 2 (count @*remote-txs)))
          (#'sync-apply/apply-remote-txs! test-repo nil (mapv (fn [tx-data] {:tx-data tx-data}) @*remote-txs))
          (let [child' (d/entity @conn [:block/uuid child1-uuid])
                child2' (d/entity @conn [:block/uuid child2-uuid])
                child3' (d/entity @conn [:block/uuid child3-uuid])]
            (is (= "child 2" (:block/title (:block/parent child'))))
            (is (= "child 3" (:block/title (:block/parent child2'))))
            (is (= "parent" (:block/title (:block/parent child3')))))))
      (d/unlisten! remote-conn ::capture-three-children-cycle-remote))))

(deftest ignore-missing-parent-update-after-local-delete-test
  (testing "remote hard delete removes descendants and marks stale local insert as non-pending"
    (let [{:keys [conn client-ops-conn parent child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-core/insert-blocks! conn [{:block/title "child 4"}] parent {:sibling? false})
          (let [pending-before (#'sync-apply/pending-txs test-repo)
                tx-id-before (:tx-id (first pending-before))]
            (is (= 1 (count pending-before)))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             (:tx-data (outliner-core/delete-blocks @conn [parent] {})))
            (let [child' (d/entity @conn [:block/uuid child-uuid])
                  pending-after (#'sync-apply/pending-txs test-repo)
                  tx-ent-after (d/entity @client-ops-conn [:db-sync/tx-id tx-id-before])]
              (is (nil? child'))
              (is (empty? pending-after))
              (is (some? tx-ent-after))
              (is (= false (:db-sync/pending? tx-ent-after))))))))))

(deftest missing-parent-after-remote-delete-removes-descendants-test
  (testing "remote hard delete tx removes descendants when full delete tx-data is provided"
    (let [{:keys [conn parent child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          remote-delete-tx (:tx-data (outliner-core/delete-blocks @conn [parent] {}))]
      (with-datascript-conns conn nil
        (fn []
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           remote-delete-tx)
          (let [child' (d/entity @conn [:block/uuid child-uuid])]
            (is (nil? child'))))))))

(deftest rebase-drops-local-property-pairs-for-remotely-deleted-property-test
  (testing "remote property deletion removes stale local offline property writes during rebase"
    (let [graph {:properties {:p2 {:logseq.property/type :default}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn-a (db-test/create-conn-with-blocks graph)
          conn-b (d/conn-from-db @conn-a)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          remote-tx (atom nil)]
      (d/listen! conn-b ::capture-property-delete-rebase
                 (fn [tx-report]
                   (when-not @remote-tx
                     (reset! remote-tx
                             (db-normalize/normalize-tx-data
                              (:db-after tx-report)
                              (:db-before tx-report)
                              (:tx-data tx-report))))))
      (try
        (with-datascript-conns conn-a client-ops-conn
          (fn []
            (let [local-block (db-test/find-block-by-content @conn-a "local object")
                  property-id :user.property/p2]
              (outliner-property/set-block-property! conn-a
                                                     [:block/uuid (:block/uuid local-block)]
                                                     property-id
                                                     "local value"))
            (outliner-page/delete! conn-b (:block/uuid (d/entity @conn-b :user.property/p2)))
            (#'sync-apply/apply-remote-tx! test-repo nil @remote-tx)
            (let [local-block' (db-test/find-block-by-content @conn-a "local object")
                  validation (db-validate/validate-local-db! @conn-a)]
              (is (nil? (:user.property/p2 local-block')))
              (is (empty? (non-recycle-validation-entities validation))
                  (str (:errors validation))))))
        (finally
          (d/unlisten! conn-b ::capture-property-delete-rebase))))))

(deftest rebase-drops-local-tags-for-remotely-deleted-tag-test
  (testing "remote tag deletion removes stale local offline tag writes during rebase"
    (let [graph {:classes {:Tag1 {}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "local object"}]}]}
          conn-a (db-test/create-conn-with-blocks graph)
          conn-b (d/conn-from-db @conn-a)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          remote-tx (atom nil)]
      (d/listen! conn-b ::capture-tag-delete-rebase
                 (fn [tx-report]
                   (when-not @remote-tx
                     (reset! remote-tx
                             (db-normalize/normalize-tx-data
                              (:db-after tx-report)
                              (:db-before tx-report)
                              (:tx-data tx-report))))))
      (try
        (with-datascript-conns conn-a client-ops-conn
          (fn []
            (let [local-block (db-test/find-block-by-content @conn-a "local object")
                  tag-id (:db/id (d/entity @conn-a :user.class/Tag1))]
              (ldb/transact! conn-a [[:db/add (:db/id local-block) :block/tags tag-id]]
                             local-tx-meta))
            (outliner-page/delete! conn-b (:block/uuid (d/entity @conn-b :user.class/Tag1)))
            (#'sync-apply/apply-remote-tx! test-repo nil @remote-tx)
            (let [local-block' (db-test/find-block-by-content @conn-a "local object")
                  validation (db-validate/validate-local-db! @conn-a)]
              (is (empty? (:block/tags local-block')))
              (is (empty? (non-recycle-validation-entities validation))
                  (str (:errors validation))))))
        (finally
          (d/unlisten! conn-b ::capture-tag-delete-rebase))))))

(deftest rebase-inserted-page-ref-does-not-keep-stale-ref-to-remotely-deleted-tag-test
  (testing "offline inserted [[tag1]] block keeps text but drops stale block/refs after remote tag deletion"
    (let [graph {:classes {:tag1 {}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks []}]}
          conn-a (db-test/create-conn-with-blocks graph)
          conn-b (d/conn-from-db @conn-a)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          remote-tx (atom nil)]
      (d/listen! conn-b ::capture-ref-delete-rebase
                 (fn [tx-report]
                   (when-not @remote-tx
                     (reset! remote-tx
                             (db-normalize/normalize-tx-data
                              (:db-after tx-report)
                              (:db-before tx-report)
                              (:tx-data tx-report))))))
      (try
        (with-datascript-conns conn-a client-ops-conn
          (fn []
            (let [page (db-test/find-page-by-title @conn-a "page 1")
                  tag1 (ldb/get-page @conn-a "tag1")
                  result (outliner-op/apply-ops!
                          conn-a
                          [[:insert-blocks
                            [[{:block/title (common-util/format "[[%s]]"
                                                                (:block/uuid tag1))

                               :block/refs [{:block/uuid (:block/uuid tag1)
                                             :block/title "tag1"}]}]
                             (:db/id page)
                             {:sibling? false}]]]
                          {})
                  block-id (:block/uuid (first (:blocks result)))]
              (outliner-page/delete! conn-a (:block/uuid (d/entity @conn-b :user.class/tag1)) {})
              (#'sync-apply/apply-remote-tx! test-repo nil @remote-tx)
              (let [block (d/entity @conn-a [:block/uuid block-id])]
                (is (some? block))
                (is (empty? (:block/refs block)))
                (is (= "tag1" (:block/raw-title block)))))))
        (finally
          (d/unlisten! conn-b ::capture-ref-delete-rebase))))))

(deftest rebase-save-block-inline-tag-recreates-deleted-tag-with-same-ident-test
  (testing "offline save-block with inline tag recreates deleted tag and preserves its db/ident during rebase"
    (let [graph {:classes {:tag4 {}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "hello"}]}]}
          conn-a (db-test/create-conn-with-blocks graph)
          conn-b (d/conn-from-db @conn-a)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          remote-tx (atom nil)]
      (d/listen! conn-b ::capture-save-inline-tag-rebase
                 (fn [tx-report]
                   (when-not @remote-tx
                     (reset! remote-tx
                             (db-normalize/normalize-tx-data
                              (:db-after tx-report)
                              (:db-before tx-report)
                              (:tx-data tx-report))))))
      (try
        (with-datascript-conns conn-a client-ops-conn
          (fn []
            (let [block (db-test/find-block-by-content @conn-a "hello")
                  block-uuid (:block/uuid block)
                  tag (d/entity @conn-a :user.class/tag4)
                  tag-uuid (:block/uuid tag)
                  tag-ident (:db/ident tag)
                  tag-ref tag]
              (outliner-core/save-block! conn-a
                                         (assoc (into {} block)
                                                :block/title "hello #tag4"
                                                :block/refs #{tag-ref}
                                                :block/tags #{tag-ref})
                                         {})
              (outliner-page/delete! conn-b (:block/uuid (d/entity @conn-b :user.class/tag4)))
              (#'sync-apply/apply-remote-tx! test-repo nil @remote-tx)
              (let [block' (d/entity @conn-a [:block/uuid block-uuid])
                    recreated-tag (d/entity @conn-a [:block/uuid tag-uuid])
                    ref-idents (set (keep :db/ident (:block/refs block')))
                    tag-idents (set (keep :db/ident (:block/tags block')))
                    validation (db-validate/validate-local-db! @conn-a)]
                (is (some? block'))
                (is (some? recreated-tag))
                (is (= tag-ident (:db/ident recreated-tag)))
                (is (= "hello #tag4"
                       (:block/raw-title block')))
                (is (set/subset? #{tag-ident} ref-idents))
                (is (= #{tag-ident} tag-idents))
                (is (empty? (non-recycle-validation-entities validation))
                    (str (:errors validation)))))))
        (finally
          (d/unlisten! conn-b ::capture-save-inline-tag-rebase))))))

(deftest rebase-save-block-inline-tag-keeps-surviving-and-recreates-deleted-with-same-ident-test
  (testing "offline save-block with mixed inline tags keeps surviving refs and recreates deleted tag with same db/ident"
    (let [graph {:classes {:tag1 {}
                           :tag2 {}}
                 :pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "hello"}]}]}
          conn-a (db-test/create-conn-with-blocks graph)
          conn-b (d/conn-from-db @conn-a)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          remote-tx (atom nil)]
      (d/listen! conn-b ::capture-save-inline-mixed-tag-rebase
                 (fn [tx-report]
                   (when-not @remote-tx
                     (reset! remote-tx
                             (db-normalize/normalize-tx-data
                              (:db-after tx-report)
                              (:db-before tx-report)
                              (:tx-data tx-report))))))
      (try
        (with-datascript-conns conn-a client-ops-conn
          (fn []
            (let [block (db-test/find-block-by-content @conn-a "hello")
                  block-uuid (:block/uuid block)
                  tag1-ref (d/entity @conn-a :user.class/tag1)
                  tag2-ref (d/entity @conn-a :user.class/tag2)
                  tag1-ident (:db/ident tag1-ref)
                  tag2-ident (:db/ident tag2-ref)
                  tag2-uuid (:block/uuid tag2-ref)]
              (outliner-core/save-block! conn-a
                                         (assoc (into {} block)
                                                :block/title "hello #tag1 #tag2"
                                                :block/refs #{tag1-ref tag2-ref}
                                                :block/tags #{tag1-ref tag2-ref})
                                         {})
              (outliner-page/delete! conn-b (:block/uuid (d/entity @conn-b :user.class/tag2)))
              (#'sync-apply/apply-remote-tx! test-repo nil @remote-tx)
              (let [block' (d/entity @conn-a [:block/uuid block-uuid])
                    recreated-tag2 (d/entity @conn-a [:block/uuid tag2-uuid])
                    ref-idents (set (keep :db/ident (:block/refs block')))
                    tag-idents (set (keep :db/ident (:block/tags block')))
                    validation (db-validate/validate-local-db! @conn-a)]
                (is (some? block'))
                (is (some? recreated-tag2))
                (is (= tag2-ident (:db/ident recreated-tag2)))
                (is (= "hello #tag1 #tag2"
                       (:block/raw-title block')))
                (is (set/subset? #{tag1-ident tag2-ident} ref-idents))
                (is (= #{tag1-ident tag2-ident} tag-idents))
                (is (empty? (non-recycle-validation-entities validation))
                    (str (:errors validation)))))))
        (finally
          (d/unlisten! conn-b ::capture-save-inline-mixed-tag-rebase))))))

(deftest cut-paste-parent-with-child-keeps-child-parent-after-sync-test
  (testing "remote tx can retract and recreate target uuid; child should point to recreated parent"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "parent"
                             :build/children [{:block/title "child"}]}
                            {:block/title "target"}]}]})
          parent (db-test/find-block-by-content @conn "parent")
          child (db-test/find-block-by-content @conn "child")
          target (db-test/find-block-by-content @conn "target")
          page-uuid (:block/uuid (:block/page parent))
          parent-uuid (:block/uuid parent)
          child-uuid (:block/uuid child)
          target-uuid (:block/uuid target)
          target-order (:block/order target)
          now 1760000000000]
      (with-datascript-conns conn nil
        (fn []
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           [[:db/retractEntity [:block/uuid parent-uuid]]
            [:db/retractEntity [:block/uuid target-uuid]]
            [:db/add -1 :block/uuid target-uuid]
            [:db/add -1 :block/title "parent"]
            [:db/add -1 :block/parent [:block/uuid page-uuid]]
            [:db/add -1 :block/page [:block/uuid page-uuid]]
            [:db/add -1 :block/order target-order]
            [:db/add -1 :block/created-at now]
            [:db/add -1 :block/updated-at now]
            [:db/add [:block/uuid child-uuid] :block/parent [:block/uuid target-uuid]]])
          (let [parent' (d/entity @conn [:block/uuid target-uuid])
                child' (d/entity @conn [:block/uuid child-uuid])]
            (is (= "parent" (:block/title parent')))
            (is (= (:db/id parent') (:db/id (:block/parent child'))))))))))

(deftest fix-duplicate-orders-after-rebase-test
  (testing "duplicate order updates are fixed after remote rebase"
    (let [{:keys [conn client-ops-conn child1 child2]} (setup-parent-child)
          order (:block/order (d/entity @conn (:db/id child1)))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child1) :block/title "child 1 local"]])
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id child1) :block/order order]
            [:db/add (:db/id child2) :block/order order]])
          (let [child1' (d/entity @conn (:db/id child1))
                child2' (d/entity @conn (:db/id child2))
                orders [(:block/order child1') (:block/order child2')]]
            (is (every? some? orders))
            (is (= (count orders) (count (distinct orders))))))))))

(deftest create-today-journal-does-not-rewrite-existing-journal-timestamps-test
  (testing "create today journal skips timestamp rewrite when the journal page already exists"
    (let [conn (db-test/create-conn)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          title "Dec 16th, 2024"]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [[_ page-uuid] (outliner-page/create! conn title {:today-journal? true})
                page (d/entity @conn [:block/uuid page-uuid])
                library-page (ldb/get-built-in-page @conn common-config/library-page-name)]
            (d/transact! conn [[:db/add (:db/id page) :block/parent (:db/id library-page)]])
            (let [created-at-before (:block/created-at (d/entity @conn [:block/uuid page-uuid]))
                  updated-at-before (:block/updated-at (d/entity @conn [:block/uuid page-uuid]))]
              (outliner-page/create! conn title {:today-journal? true})
              (let [page' (d/entity @conn [:block/uuid page-uuid])]
                (is (= created-at-before (:block/created-at page')))
                (is (= updated-at-before (:block/updated-at page')))))))))))

(deftest fix-duplicate-order-against-existing-sibling-test
  (testing "duplicate order update is fixed when it collides with an existing sibling"
    (let [{:keys [conn client-ops-conn child1 child2]} (setup-parent-child)
          child2-order (:block/order (d/entity @conn (:db/id child2)))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child1) :block/title "child 1 local"]])
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id child1) :block/order child2-order]])
          (let [child1' (d/entity @conn (:db/id child1))
                child2' (d/entity @conn (:db/id child2))]
            (is (some? (:block/order child1')))
            (is (not= (:block/order child1') (:block/order child2')))))))))

(deftest two-clients-extends-cycle-test
  (testing "class extends updates from two clients can retain the cycle edges"
    (let [conn (db-test/create-conn)
          client-ops-conn (d/create-conn client-op/schema-in-db)
          root-id (d/entid @conn :logseq.class/Root)
          tag-id (d/entid @conn :logseq.class/Tag)
          now 1710000000000
          a-uuid (random-uuid)
          b-uuid (random-uuid)]
      (d/transact! conn [{:db/ident :user.class/A
                          :block/uuid a-uuid
                          :block/name "a"
                          :block/title "A"
                          :block/created-at now
                          :block/updated-at now
                          :block/tags #{tag-id}
                          :logseq.property.class/extends #{root-id}}
                         {:db/ident :user.class/B
                          :block/uuid b-uuid
                          :block/name "b"
                          :block/title "B"
                          :block/created-at now
                          :block/updated-at now
                          :block/tags #{tag-id}
                          :logseq.property.class/extends #{root-id}}])
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [a-id (d/entid @conn :user.class/A)
                b-id (d/entid @conn :user.class/B)]
            (d/transact! conn [[:db/add a-id
                                :logseq.property.class/extends
                                b-id]])
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add b-id
               :logseq.property.class/extends
               a-id]])
            (let [a (d/entity @conn :user.class/A)
                  b (d/entity @conn :user.class/B)
                  extends-a (set (map :db/ident (:logseq.property.class/extends a)))
                  extends-b (set (map :db/ident (:logseq.property.class/extends b)))]
              (is (not (contains? extends-a :user.class/B)))
              (is (contains? extends-a :logseq.class/Root))
              (is (contains? extends-b :user.class/A)))))))))

(deftest fix-duplicate-orders-with-local-and-remote-new-blocks-test
  (testing "local and remote new sibling blocks at the same location get unique orders"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          parent-id (:db/id parent)
          page-uuid (:block/uuid (:block/page parent))
          remote-uuid-1 (random-uuid)
          remote-uuid-2 (random-uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-core/insert-blocks! conn [{:block/title "local 1"
                                               :block/uuid (random-uuid)}
                                              {:block/title "local 2"
                                               :block/uuid (random-uuid)}]
                                        parent
                                        {:sibling? true})
          (let [local1 (db-test/find-block-by-content @conn "local 1")
                local2 (db-test/find-block-by-content @conn "local 2")]
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add -1 :block/uuid remote-uuid-1]
              [:db/add -1 :block/title "remote 1"]
              [:db/add -1 :block/parent [:block/uuid page-uuid]]
              [:db/add -1 :block/page [:block/uuid page-uuid]]
              [:db/add -1 :block/order (:block/order local1)]
              [:db/add -1 :block/updated-at 1768308019312]
              [:db/add -1 :block/created-at 1768308019312]
              [:db/add -2 :block/uuid remote-uuid-2]
              [:db/add -2 :block/title "remote 2"]
              [:db/add -2 :block/parent [:block/uuid page-uuid]]
              [:db/add -2 :block/page [:block/uuid page-uuid]]
              [:db/add -2 :block/order (:block/order local2)]
              [:db/add -2 :block/updated-at 1768308019312]
              [:db/add -2 :block/created-at 1768308019312]]))
          (let [parent' (d/entity @conn parent-id)
                children (vec (:block/_parent parent'))
                orders (map :block/order children)]
            (is (every? some? orders))
            (is (= (count orders) (count (distinct orders))))))))))

(deftest rebase-preserves-pending-tx-boundaries-test
  (testing "pending txs stay separate after remote rebase"
    (let [{:keys [conn client-ops-conn parent child1 child2]} (setup-parent-child)]
      (with-redefs [db-sync/enqueue-local-tx!
                    (let [orig db-sync/enqueue-local-tx!]
                      (fn [repo tx-report]
                        (when-not (:rtc-tx? (:tx-meta tx-report))
                          (orig repo tx-report))))]
        (with-datascript-conns conn client-ops-conn
          (fn []
            (d/transact! conn [[:db/add (:db/id child1) :block/title "child 1 local"]])
            (d/transact! conn [[:db/add (:db/id child2) :block/title "child 2 local"]])
            (let [pending-before (#'sync-apply/pending-txs test-repo)
                  tx-ids-before (mapv :tx-id pending-before)]
              (is (= 2 (count pending-before)))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id parent) :block/title "parent remote"]])
              (let [pending-after (#'sync-apply/pending-txs test-repo)
                    tx-ids-after (mapv :tx-id pending-after)]
                (is (= 2 (count pending-after)))
                (is (= tx-ids-before tx-ids-after))
                (is (= 2 (count (distinct tx-ids-after))))))))))))

(deftest rebase-keeps-pending-when-rebased-empty-test
  (testing "pending txs stay when rebased txs are empty"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)]
      (with-redefs [db-sync/enqueue-local-tx!
                    (let [orig db-sync/enqueue-local-tx!]
                      (fn [repo tx-report]
                        (when-not (:rtc-tx? (:tx-meta tx-report))
                          (orig repo tx-report))))]
        (with-datascript-conns conn client-ops-conn
          (fn []
            (d/transact! conn [[:db/add (:db/id child1) :block/title "same"]])
            (let [pending-before (#'sync-apply/pending-txs test-repo)
                  tx-id-before (:tx-id (first pending-before))]
              (is (= 1 (count pending-before)))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id child1) :block/title "same"]])
              (let [pending-after (#'sync-apply/pending-txs test-repo)]
                (is (= 1 (count pending-after)))
                (is (= tx-id-before (:tx-id (first pending-after))))))))))))

(deftest rebase-later-tx-for-new-block-uses-lookup-ref-test
  (testing "rebased tx after creating a block should use lookup ref instead of stale tempid"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)]
      (with-redefs [db-sync/enqueue-local-tx!
                    (let [orig db-sync/enqueue-local-tx!]
                      (fn [repo tx-report]
                        (when-not (:rtc-tx? (:tx-meta tx-report))
                          (orig repo tx-report))))]
        (with-datascript-conns conn client-ops-conn
          (fn []
            (outliner-core/insert-blocks! conn [{:block/title "temp for lookup"}] parent {:sibling? false})
            (let [block (db-test/find-block-by-content @conn "temp for lookup")
                  block-uuid (:block/uuid block)]
              (outliner-core/save-block! conn {:block/uuid block-uuid
                                               :block/title "temp for lookup updated"})
              (let [pending-before (#'sync-apply/pending-txs test-repo)
                    pending-count-before (count pending-before)]
                (is (<= 2 pending-count-before))
                (#'sync-apply/apply-remote-tx!
                 test-repo
                 nil
                 [[:db/add (:db/id parent) :block/title "parent remote"]])
                (let [pending (#'sync-apply/pending-txs test-repo)
                      expected-row [:db/add [:block/uuid block-uuid] :block/title "temp for lookup updated"]
                      save-block-tx (some (fn [{:keys [tx]}]
                                            (let [tx-rows (mapv (fn [[op e a v _t]]
                                                                  [op e a v])
                                                                tx)]
                                              (when (some #(= expected-row %) tx-rows)
                                                tx)))
                                          pending)]
                  (is (some? save-block-tx))
                  (is (not-any? string?
                                (keep second save-block-tx))))))))))))

(deftest reverse-tx-data-create-property-text-block-restores-base-db-test
  (testing "reverse-tx-data for create-property-text-block should restore the base db"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:default "foo"}}
                           {:block/title "b2"}]}])
          tx-reports* (atom [])]
      (d/listen! conn ::capture-create-property-text-block
                 (fn [tx-report]
                   (swap! tx-reports* conj tx-report)))
      (try
        (let [base-db @conn
              block-before (db-test/find-block-by-content base-db "b2")]
          (outliner-property/create-property-text-block! conn (:db/id block-before) :user.property/default "" {})
          (let [db-after @conn
                block-after (db-test/find-block-by-content db-after "b2")
                value-block (:user.property/default block-after)
                value-uuid (:block/uuid value-block)
                reversed-rows (mapv (fn [{:keys [db-before db-after tx-data]}]
                                      (#'sync-apply/reverse-tx-data db-before db-after tx-data))
                                    @tx-reports*)
                restored-db (reduce (fn [db reversed]
                                      (:db-after (d/with db reversed)))
                                    db-after
                                    (reverse reversed-rows))
                block-restored (db-test/find-block-by-content restored-db "b2")]
            (is (= 2 (count @tx-reports*)))
            (is (some seq reversed-rows))
            (is (nil? (:user.property/default block-restored)))
            (is (= (select-keys block-before [:block/uuid :block/title :block/order])
                   (select-keys block-restored [:block/uuid :block/title :block/order])))
            (is (nil? (d/entity restored-db [:block/uuid value-uuid])))))
        (finally
          (d/unlisten! conn ::capture-create-property-text-block))))))

(deftest pending-reversed-txs-for-multiple-status-changes-restore-base-db-test
  (testing "fresh persisted reversed tx rows from repeated status changes should restore the base db"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "task"
                             :build/properties {:status "Todo"}}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [base-db @conn
                block-before (db-test/find-block-by-content base-db "task")
                block-uuid (:block/uuid block-before)
                base-status (some-> (:logseq.property/status block-before) :db/ident)
                base-tags (set (map :db/ident (:block/tags block-before)))
                base-history-count (count (d/q '[:find ?h
                                                 :in $ ?block
                                                 :where [?h :logseq.property.history/block ?block]]
                                               base-db
                                               (:db/id block-before)))]
            (outliner-property/set-block-property! conn (:db/id block-before) :logseq.property/status "Doing")
            (outliner-property/set-block-property! conn (:db/id block-before) :logseq.property/status "Todo")
            (outliner-property/set-block-property! conn (:db/id block-before) :logseq.property/status "Doing")
            (let [pending (#'sync-apply/pending-txs test-repo)
                  restored-db (reduce (fn [db {:keys [reversed-tx]}]
                                        (:db-after (d/with db reversed-tx)))
                                      @conn
                                      (reverse pending))
                  block-restored (d/entity restored-db [:block/uuid block-uuid])
                  restored-history-count (count (d/q '[:find ?h
                                                       :in $ ?block
                                                       :where [?h :logseq.property.history/block ?block]]
                                                     restored-db
                                                     (:db/id block-restored)))]
              (is (= 3 (count pending)))
              (is (= base-status
                     (some-> (:logseq.property/status block-restored) :db/ident)))
              (is (= base-tags
                     (set (map :db/ident (:block/tags block-restored)))))
              (is (= base-history-count restored-history-count)))))))))

(deftest derive-history-set-block-property-inverse-includes-property-history-cleanup-test
  (testing "derive-history-outliner-ops should delete created property-history block for set-block-property"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:pnum {:logseq.property/type :number
                                     :db/cardinality :db.cardinality/one}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "task"
                             :build/properties {:pnum 1}}]}]})
          block-before (db-test/find-block-by-content @conn "task")
          block-id (:db/id block-before)
          property-id (:db/id (d/entity @conn :user.property/pnum))
          history-uuid (random-uuid)
          {:keys [db-after tx-data]}
          (d/with @conn
                  [[:db/add block-id :user.property/pnum 2]
                   {:db/id -1
                    :block/uuid history-uuid
                    :logseq.property.history/block block-id
                    :logseq.property.history/property property-id
                    :logseq.property.history/scalar-value 2}]
                  {})
          {:keys [inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           @conn
           db-after
           tx-data
           {:outliner-op :set-block-property
            :outliner-ops [[:set-block-property [block-id :user.property/pnum 2]]]})]
      (is (= :delete-blocks (ffirst inverse-outliner-ops)))
      (is (= #{[:block/uuid history-uuid]}
             (set (get-in inverse-outliner-ops [0 1 0])))))))

(deftest pending-reversed-txs-for-batch-status-changes-restore-base-db-test
  (testing "fresh persisted reversed tx rows from repeated batch status changes should restore the base db"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "task"
                             :build/properties {:status "Todo"}}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [base-db @conn
                block-before (db-test/find-block-by-content base-db "task")
                block-uuid (:block/uuid block-before)
                status-doing (:db/id (d/entity base-db :logseq.property/status.doing))
                status-todo (:db/id (d/entity base-db :logseq.property/status.todo))
                base-status (some-> (:logseq.property/status block-before) :db/ident)
                base-tags (set (map :db/ident (:block/tags block-before)))
                base-history-count (count (d/q '[:find ?h
                                                 :in $ ?block
                                                 :where [?h :logseq.property.history/block ?block]]
                                               base-db
                                               (:db/id block-before)))]
            (outliner-property/batch-set-property! conn [(:db/id block-before)] :logseq.property/status status-doing {:entity-id? true})
            (outliner-property/batch-set-property! conn [(:db/id block-before)] :logseq.property/status status-todo {:entity-id? true})
            (outliner-property/batch-set-property! conn [(:db/id block-before)] :logseq.property/status status-doing {:entity-id? true})
            (let [pending (#'sync-apply/pending-txs test-repo)
                  restored-db (reduce (fn [db {:keys [reversed-tx]}]
                                        (:db-after (d/with db reversed-tx)))
                                      @conn
                                      (reverse pending))
                  block-restored (d/entity restored-db [:block/uuid block-uuid])
                  restored-history-count (count (d/q '[:find ?h
                                                       :in $ ?block
                                                       :where [?h :logseq.property.history/block ?block]]
                                                     restored-db
                                                     (:db/id block-restored)))]
              (is (= 3 (count pending)))
              (is (= base-status
                     (some-> (:logseq.property/status block-restored) :db/ident)))
              (is (= base-tags
                     (set (map :db/ident (:block/tags block-restored)))))
              (is (= base-history-count restored-history-count)))))))))

(deftest derive-history-batch-set-property-inverse-includes-property-history-cleanup-test
  (testing "derive-history-outliner-ops should delete created property-history blocks for batch-set-property"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:pnum {:logseq.property/type :number
                                     :db/cardinality :db.cardinality/one}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "task-1"
                             :build/properties {:pnum 1}}
                            {:block/title "task-2"}]}]})
          block-1 (db-test/find-block-by-content @conn "task-1")
          block-2 (db-test/find-block-by-content @conn "task-2")
          property-id (:db/id (d/entity @conn :user.property/pnum))
          history-uuid-1 (random-uuid)
          history-uuid-2 (random-uuid)
          {:keys [db-after tx-data]}
          (d/with @conn
                  [[:db/add (:db/id block-1) :user.property/pnum 2]
                   [:db/add (:db/id block-2) :user.property/pnum 2]
                   {:db/id -1
                    :block/uuid history-uuid-1
                    :logseq.property.history/block (:db/id block-1)
                    :logseq.property.history/property property-id
                    :logseq.property.history/scalar-value 2}
                   {:db/id -2
                    :block/uuid history-uuid-2
                    :logseq.property.history/block (:db/id block-2)
                    :logseq.property.history/property property-id
                    :logseq.property.history/scalar-value 2}]
                  {})
          {:keys [inverse-outliner-ops]}
          (op-construct/derive-history-outliner-ops
           @conn
           db-after
           tx-data
           {:outliner-op :batch-set-property
            :outliner-ops [[:batch-set-property [[(:db/id block-1)
                                                  (:db/id block-2)]
                                                 :user.property/pnum
                                                 2
                                                 {}]]]})]
      (is (= :delete-blocks (ffirst inverse-outliner-ops)))
      (is (= #{[:block/uuid history-uuid-1]
               [:block/uuid history-uuid-2]}
             (set (get-in inverse-outliner-ops [0 1 0])))))))

(deftest normalize-rebased-pending-tx-keeps-reconstructive-reverse-for-retract-entity-test
  (testing "rebased pending tx should keep non-empty reverse datoms even when forward tx collapses to retractEntity"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "target"}]}]})
          target (db-test/find-block-by-content @conn "target")
          target-uuid (:block/uuid target)
          db-before @conn
          tx-report (d/with db-before
                            [[:db/retractEntity [:block/uuid target-uuid]]]
                            {})
          {:keys [normalized-tx-data reversed-datoms]}
          (#'sync-apply/normalize-rebased-pending-tx
           {:db-before db-before
            :db-after (:db-after tx-report)
            :tx-data (:tx-data tx-report)
            :remote-tx-data-set #{}})
          restored-db (:db-after (d/with (:db-after tx-report) reversed-datoms))]
      (is (= [[:db/retractEntity [:block/uuid target-uuid]]]
             normalized-tx-data))
      (is (seq reversed-datoms))
      (is (= target-uuid
             (-> (d/entity restored-db [:block/uuid target-uuid]) :block/uuid))))))

(deftest reverse-tx-data-delete-and-recreate-same-uuid-remains-reversible-test
  (testing "reverse tx-data should remain valid when a tx retracts and recreates the same block uuid"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "old"}]}]})
          target (db-test/find-block-by-content @conn "old")
          target-uuid (:block/uuid target)
          page-uuid (:block/uuid (:block/page target))
          original-order (:block/order target)
          db-before @conn
          tx-report (d/with db-before
                            [[:db/retractEntity [:block/uuid target-uuid]]
                             [:db/add -1 :block/uuid target-uuid]
                             [:db/add -1 :block/title "new"]
                             [:db/add -1 :block/parent [:block/uuid page-uuid]]
                             [:db/add -1 :block/page [:block/uuid page-uuid]]
                             [:db/add -1 :block/order original-order]]
                            {})
          reversed-datoms (#'sync-apply/reverse-tx-data
                           db-before
                           (:db-after tx-report)
                           (:tx-data tx-report))
          reverse-conn (d/conn-from-db (:db-after tx-report))]
      (is (some? (d/entity (:db-after tx-report) [:block/uuid target-uuid])))
      (ldb/transact! reverse-conn reversed-datoms {:outliner-op :reverse-test})
      (let [restored (d/entity @reverse-conn [:block/uuid target-uuid])]
        (is (some? restored))
        (is (= "old" (:block/title restored)))
        (is (= page-uuid (some-> restored :block/page :block/uuid)))
        (is (= page-uuid (some-> restored :block/parent :block/uuid)))))))

(deftest rebase-preserves-title-when-reversed-tx-ids-change-test
  (testing "rebase keeps local title when reverse tx gets a new tx id"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "old"}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          block (db-test/find-block-by-content @conn "old")]
      (with-redefs [db-sync/enqueue-local-tx!
                    (let [orig db-sync/enqueue-local-tx!]
                      (fn [repo tx-report]
                        (when-not (:rtc-tx? (:tx-meta tx-report))
                          (orig repo tx-report))))]
        (with-datascript-conns conn client-ops-conn
          (fn []
            (outliner-op/apply-ops! conn
                                    [[:save-block [{:block/uuid (:block/uuid block)
                                                    :block/title "test"} nil]]]
                                    local-tx-meta)
            (is (= 1 (count (#'sync-apply/pending-txs test-repo))))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id block) :block/updated-at 1710000000000]])
            (let [block' (d/entity @conn (:db/id block))]
              (is (= "test" (:block/title block'))))))))))

(deftest rebase-does-not-leave-anonymous-created-by-entities-test
  (testing "rebase should not leave entities with timestamps/created-by but without identity attrs"
    (let [{:keys [conn client-ops-conn parent child1]} (setup-parent-child)
          child-id (:db/id child1)
          page-id (:db/id (:block/page parent))]
      (with-redefs [db-sync/enqueue-local-tx!
                    (let [orig db-sync/enqueue-local-tx!]
                      (fn [repo tx-report]
                        (when-not (:rtc-tx? (:tx-meta tx-report))
                          (orig repo tx-report))))]
        (with-datascript-conns conn client-ops-conn
          (fn []
            ;; Ensure the deleted block has the same created-by shape from production repros.
            (d/transact! conn [[:db/add child-id :logseq.property/created-by-ref page-id]])
            (outliner-core/delete-blocks! conn [(d/entity @conn child-id)] {})
            (is (seq (#'sync-apply/pending-txs test-repo)))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id parent) :block/title "parent remote"]])
            (let [anonymous-ents (->> (d/datoms @conn :avet :logseq.property/created-by-ref)
                                      (keep (fn [datom]
                                              (let [ent (d/entity @conn (:e datom))]
                                                (when (and (nil? (:block/uuid ent))
                                                           (nil? (:db/ident ent))
                                                           (some? (:block/created-at ent))
                                                           (some? (:block/updated-at ent)))
                                                  (select-keys ent [:db/id :block/created-at :block/updated-at :logseq.property/created-by-ref]))))))
                  validation (db-validate/validate-local-db! @conn)]
              (is (empty? anonymous-ents) (str anonymous-ents))
              (is (empty? (non-recycle-validation-entities validation))
                  (str (:errors validation))))))))))

(deftest rebase-create-then-delete-does-not-leave-anonymous-entities-test
  (testing "create+delete before sync should not leave anonymous entities after rebase"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          page-id (:db/id (:block/page parent))]
      (with-redefs [db-sync/enqueue-local-tx!
                    (let [orig db-sync/enqueue-local-tx!]
                      (fn [repo tx-report]
                        (when-not (:rtc-tx? (:tx-meta tx-report))
                          (orig repo tx-report))))]
        (with-datascript-conns conn client-ops-conn
          (fn []
            (outliner-core/insert-blocks! conn [{:block/title "temp-rebase-case"}] parent {:sibling? false})
            (let [temp-block (db-test/find-block-by-content @conn "temp-rebase-case")
                  temp-id (:db/id temp-block)]
              (d/transact! conn [[:db/add temp-id :logseq.property/created-by-ref page-id]])
              (outliner-core/delete-blocks! conn [temp-block] {})
              (is (>= (count (#'sync-apply/pending-txs test-repo)) 2))
              (#'sync-apply/apply-remote-tx!
               test-repo
               nil
               [[:db/add (:db/id parent) :block/title "parent remote 2"]])
              (let [anonymous-ents (->> (d/datoms @conn :avet :block/created-at)
                                        (keep (fn [datom]
                                                (let [ent (d/entity @conn (:e datom))]
                                                  (when (and (nil? (:block/uuid ent))
                                                             (nil? (:db/ident ent))
                                                             (some? (:block/updated-at ent)))
                                                    (select-keys ent [:db/id :block/created-at :block/updated-at :logseq.property/created-by-ref]))))))
                    validation (db-validate/validate-local-db! @conn)]
                (is (empty? anonymous-ents) (str anonymous-ents))
                (is (empty? (non-recycle-validation-entities validation))
                    (str (:errors validation)))))))))))

(deftest apply-remote-tx-local-delete-remote-recreate-does-not-leave-local-only-delete-test
  (testing "if remote batch recreates a locally deleted block, client should not end with unsynced local-only deletion"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "target"}]}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          target (db-test/find-block-by-content @conn "target")
          target-uuid (:block/uuid target)
          page-uuid (:block/uuid (:block/page target))
          page-id (:db/id (:block/page target))
          now 1760000000000
          remote-tx [[:db/retractEntity [:block/uuid target-uuid]]
                     [:db/add -1 :block/uuid target-uuid]
                     [:db/add -1 :block/title "remote-restored"]
                     [:db/add -1 :block/parent [:block/uuid page-uuid]]
                     [:db/add -1 :block/page [:block/uuid page-uuid]]
                     [:db/add -1 :block/order "a0"]
                     [:db/add -1 :block/updated-at now]
                     [:db/add -1 :block/created-at now]
                     [:db/add -1 :logseq.property/created-by-ref page-id]]
          client {:repo test-repo
                  :graph-id "graph-1"
                  :inflight (atom [])
                  :online-users (atom [])
                  :ws-state (atom :open)}]
      (with-datascript-conns conn client-ops-conn
        (fn []
          ;; Local client deletes target and has pending txs.
          (outliner-core/delete-blocks! conn [target] {})
          (is (seq (#'sync-apply/pending-txs test-repo)))
          ;; Remote side deletes then recreates same uuid in one batch.
          (#'sync-apply/apply-remote-tx! test-repo client remote-tx)
          (let [target' (d/entity @conn [:block/uuid target-uuid])
                pending (#'sync-apply/pending-txs test-repo)]
            ;; Current bug: target disappears locally while pending is empty.
            ;; Valid states:
            ;; 1) target exists (remote recreation applied), or
            ;; 2) target is absent but delete remains pending for upload.
            (is (or (some? target') (seq pending))
                (str "target missing with no pending txs for uuid=" target-uuid))
            (when target'
              (is (= "remote-restored" (:block/title target'))))))))))

(deftest rebase-persisted-row-contains-forward-and-inverse-outliner-ops-test
  (testing "rebased pending tx should always persist both forward and inverse outliner ops"
    (let [{:keys [conn client-ops-conn parent child1]} (setup-parent-child)
          tx-id-holder (atom nil)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-core/delete-blocks! conn [child1] {})
          (let [pending-before (first (#'sync-apply/pending-txs test-repo))
                tx-id (:tx-id pending-before)]
            (reset! tx-id-holder tx-id)
            (is (seq (:forward-outliner-ops pending-before)))
            (is (seq (:inverse-outliner-ops pending-before))))

          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id parent) :block/title "parent remote"]])

          (let [pending-after (#'sync-apply/pending-tx-by-id test-repo @tx-id-holder)]
            (is (some? pending-after))
            (is (= :rebase (:outliner-op pending-after)))
            (is (seq (:forward-outliner-ops pending-after)))
            (is (seq (:inverse-outliner-ops pending-after)))))))))

(deftest legacy-rebase-row-with-missing-history-ops-gets-persisted-with-both-ops-test
  (testing "legacy pending :rebase rows missing history ops should be rewritten with forward+inverse ops"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          tx-id (random-uuid)
          parent-uuid (:block/uuid parent)
          parent-title (:block/title parent)
          remote-title "parent remote refresh"]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/pending? true
                           :db-sync/created-at 1000
                           :db-sync/outliner-op :rebase
                           :db-sync/normalized-tx-data
                           [[:db/add [:block/uuid parent-uuid] :block/title "legacy local title"]]
                           :db-sync/reversed-tx-data
                           [[:db/add [:block/uuid parent-uuid] :block/title parent-title]]}])
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           [[:db/add [:block/uuid parent-uuid] :block/title remote-title]])
          (let [pending-after (#'sync-apply/pending-tx-by-id test-repo tx-id)]
            (is (some? pending-after))
            (is (= :rebase (:outliner-op pending-after)))
            (is (seq (:forward-outliner-ops pending-after)))
            (is (seq (:inverse-outliner-ops pending-after)))))))))

(deftest offload-large-title-test
  (testing "large titles are offloaded to object storage with placeholder"
    (async done
           (let [large-title (apply str (repeat 5000 "a"))
                 tx-data [[:db/add 1 :block/title large-title]]
                 upload-calls (atom [])
                 upload-fn (fn [_repo _graph-id title _aes-key]
                             (swap! upload-calls conj title)
                             (p/resolved {:asset-uuid "title-1"
                                          :asset-type "txt"}))]
             (-> (p/let [result (sync-large-title/offload-large-titles
                                 tx-data
                                 {:repo test-repo
                                  :graph-id "graph-1"
                                  :upload-fn upload-fn
                                  :aes-key nil})]
                   (is (= [large-title] @upload-calls))
                   (is (= [[:db/add 1 :block/title ""]
                           [:db/add 1 :logseq.property.sync/large-title-object
                            {:asset-uuid "title-1"
                             :asset-type "txt"}]]
                          result)))
                 (p/catch (fn [e]
                            (is false (str e))))
                 (p/finally done))))))

(deftest offload-small-title-test
  (testing "small titles are not offloaded"
    (async done
           (let [tx-data [[:db/add 1 :block/title "short"]]
                 upload-fn (fn [_repo _graph-id _title _aes-key]
                             (p/rejected (ex-info "unexpected upload" {})))]
             (-> (p/let [result (sync-large-title/offload-large-titles
                                 tx-data
                                 {:repo test-repo
                                  :graph-id "graph-1"
                                  :upload-fn upload-fn
                                  :aes-key nil})]
                   (is (= tx-data result)))
                 (p/catch (fn [e]
                            (is false (str e))))
                 (p/finally done))))))

(deftest upload-preparation-processes-datoms-in-batches-test
  (testing "upload preparation should stream work batch by batch instead of sending the full graph at once"
    (async done
           (let [datoms [{:e 1 :a :block/title :v "a"}
                         {:e 2 :a :block/title :v "b"}
                         {:e 3 :a :block/title :v "c"}
                         {:e 4 :a :block/title :v "d"}
                         {:e 5 :a :block/title :v "e"}]
                 seen-batches (atom [])
                 progress-calls (atom [])]
             (-> (p/let [_ (sync-large-title/process-upload-datoms-in-batches!
                            datoms
                            {:batch-size 2
                             :process-batch-f (fn [batch]
                                                (swap! seen-batches conj (mapv :e batch))
                                                (p/resolved nil))
                             :progress-f (fn [processed total]
                                           (swap! progress-calls conj [processed total]))})]
                   (is (= [[1 2] [3 4] [5]] @seen-batches))
                   (is (= [[2 5] [4 5] [5 5]] @progress-calls)))
                 (p/finally done))))))

(deftest create-temp-sqlite-db-uses-opfs-pool-test
  (testing "temp upload db should use an OPFS-backed sqlite db instead of :memory:"
    (async done
           (let [opened-paths (atom [])]
             (with-redefs [sync-temp-sqlite/<get-upload-temp-sqlite-pool
                           (fn []
                             (p/resolved
                              #js {:OpfsSAHPoolDb
                                   (fn [path]
                                     (swap! opened-paths conj path)
                                     #js {:close (fn [] nil)})}))
                           common-sqlite/create-kvs-table! (fn [_] nil)]
               (-> (p/let [{:keys [db path]} (sync-temp-sqlite/<create-temp-sqlite-db!
                                              {:get-pool-f sync-temp-sqlite/<get-upload-temp-sqlite-pool
                                               :upload-path-f sync-temp-sqlite/upload-temp-sqlite-path})]
                     (is (some? db))
                     (is (= [path] @opened-paths))
                     (is (string/includes? path "upload-"))
                     (is (string/ends-with? path ".sqlite")))
                   (p/finally done)))))))

(deftest cleanup-temp-sqlite-removes-opfs-file-test
  (testing "temp upload db cleanup should close the db and remove the temp OPFS file"
    (async done
           (let [closed? (atom false)
                 removed-paths (atom [])]
             (with-redefs [sync-temp-sqlite/<remove-upload-temp-sqlite-db-file!
                           (fn [path]
                             (swap! removed-paths conj path)
                             (p/resolved nil))]
               (-> (p/let [_ (sync-temp-sqlite/cleanup-temp-sqlite!
                              {:db #js {:close (fn [] (reset! closed? true))}
                               :path "/upload-temp.sqlite"}
                              sync-temp-sqlite/<remove-upload-temp-sqlite-db-file!)]
                     (is @closed?)
                     (is (= ["/upload-temp.sqlite"] @removed-paths)))
                   (p/finally done)))))))

(deftest upload-large-title-encrypts-transit-payload-test
  (testing "encrypted large title uploads transit-encoded payload"
    (async done
           (let [title (apply str (repeat 5000 "a"))
                 captured-body (atom nil)
                 fetch-prev js/fetch
                 config-prev @worker-state/*db-sync-config]
             (set! js/fetch
                   (fn [_url opts]
                     (reset! captured-body (.-body opts))
                     (js/Promise.resolve #js {:ok true})))
             (reset! worker-state/*db-sync-config {:http-base "https://example.com"})
             (-> (p/let [aes-key (crypt/<generate-aes-key)
                         _ (sync-large-title/upload-large-title!
                            {:repo test-repo
                             :graph-id "graph-1"
                             :title title
                             :aes-key aes-key
                             :http-base "https://example.com"
                             :auth-headers nil
                             :fail-fast-f db-sync/fail-fast
                             :encrypt-text-value-f sync-crypt/<encrypt-text-value})
                         body @captured-body]
                   (is (instance? js/Uint8Array body))
                   (let [payload-str (.decode (js/TextDecoder.) body)]
                     (p/let [title' (sync-crypt/<decrypt-text-value aes-key payload-str)]
                       (is (= title title')))))
                 (p/finally
                   (fn []
                     (set! js/fetch fetch-prev)
                     (reset! worker-state/*db-sync-config config-prev)
                     (done))))))))

(deftest ^:fix-me download-large-title-decrypts-transit-payload-test
  (testing "encrypted large title downloads transit-encoded payload"
    (async done
           (let [title (apply str (repeat 5000 "b"))
                 fetch-prev js/fetch
                 config-prev @worker-state/*db-sync-config]
             (reset! worker-state/*db-sync-config {:http-base "https://example.com"})
             (-> (p/let [aes-key (crypt/<generate-aes-key)
                         payload-str (sync-crypt/<encrypt-text-value aes-key title)
                         payload-bytes (.encode (js/TextEncoder.) payload-str)]
                   (set! js/fetch
                         (fn [_url _opts]
                           (js/Promise.resolve
                            #js {:ok true
                                 :arrayBuffer (fn [] (js/Promise.resolve (.-buffer payload-bytes)))})))
                   (p/let [result (sync-large-title/download-large-title!
                                   {:repo test-repo
                                    :graph-id "graph-1"
                                    :obj {:asset-uuid "title-1" :asset-type "txt"}
                                    :aes-key aes-key
                                    :http-base "https://example.com"
                                    :auth-headers nil
                                    :fail-fast-f db-sync/fail-fast
                                    :decrypt-text-value-f sync-crypt/<decrypt-text-value})]
                     (is (= title result))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error " e))))
                 (p/finally
                   (fn []
                     (set! js/fetch fetch-prev)
                     (reset! worker-state/*db-sync-config config-prev)
                     (done))))))))

(deftest rehydrate-large-title-test
  (testing "rehydrate fills empty title from object storage"
    (async done
           (let [conn (db-test/create-conn-with-blocks
                       {:pages-and-blocks
                        [{:page {:block/title "rehydrate-page"}
                          :blocks [{:block/title "rehydrate-block"}]}]})
                 block (db-test/find-block-by-content @conn "rehydrate-block")
                 block-id (:db/id block)
                 tx-data [[:db/add block-id :block/title ""]
                          [:db/add block-id :logseq.property.sync/large-title-object
                           {:asset-uuid "title-1" :asset-type "txt"}]]
                 download-calls (atom [])
                 download-fn (fn [_repo _graph-id obj _aes-key]
                               (swap! download-calls conj obj)
                               (p/resolved "rehydrated-title"))]
             (with-datascript-conns conn nil
               (fn []
                 (d/transact! conn tx-data)
                 (is (some? (worker-state/get-datascript-conn test-repo)))
                 (let [obj-datoms (filter #(= :logseq.property.sync/large-title-object (:a %))
                                          (d/datoms @conn :eavt))
                       obj (some-> obj-datoms first :v)]
                   (is (= 1 (count obj-datoms)))
                   (is (true? (sync-large-title/large-title-object? obj))))
                 (let [items (->> tx-data
                                  (keep (fn [item]
                                          (when (and (vector? item)
                                                     (= :db/add (nth item 0))
                                                     (= :logseq.property.sync/large-title-object (nth item 2))
                                                     (true? (sync-large-title/large-title-object? (nth item 3))))
                                            {:e (nth item 1)
                                             :obj (nth item 3)})))
                                  (distinct))]
                   (is (= 1 (count items))))
                 (-> (p/let [result (sync-large-title/rehydrate-large-titles!
                                     test-repo
                                     {:tx-data tx-data
                                      :conn conn
                                      :graph-id "graph-1"
                                      :download-fn download-fn
                                      :aes-key nil
                                      :get-conn-f worker-state/get-datascript-conn
                                      :get-graph-id-f (fn [repo]
                                                        (sync-large-title/get-graph-id
                                                         worker-state/get-datascript-conn repo))
                                      :graph-e2ee?-f sync-crypt/graph-e2ee?
                                      :ensure-graph-aes-key-f sync-crypt/<ensure-graph-aes-key
                                      :fail-fast-f db-sync/fail-fast})
                             _ (is (some? result))
                             block (d/entity @conn block-id)]
                       (is (= [{:asset-uuid "title-1" :asset-type "txt"}] @download-calls))
                       (is (= "rehydrated-title" (:block/title block))))
                     (p/finally done))))))))
