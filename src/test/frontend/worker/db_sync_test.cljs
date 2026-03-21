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
            [frontend.worker.sync.legacy-rebase :as legacy-rebase]
            [frontend.worker.sync.temp-sqlite :as sync-temp-sqlite]
            [frontend.worker.sync.upload :as sync-upload]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
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
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.property :as outliner-property]
            [logseq.outliner.recycle :as outliner-recycle]
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
  (testing "tx/reject with db transact failed includes parsed rejected tx for debugging"
    (let [rejected-tx {:tx (sqlite-util/write-transit-str [[:db/add [:block/uuid (random-uuid)] :block/title "bad"]])
                       :outliner-op :save-block}
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
        (try
          (sync-handle-message/handle-message! test-repo client raw-message)
          (is false "expected tx/reject to fail-fast with rejected tx details")
          (catch :default error
            (let [data (ex-data error)]
              (is (= :db-sync/tx-rejected (:type data)))
              (is (= "db transact failed" (:reason data)))
              (is (= rejected-tx (:data data))))))))))

(deftest hello-checksum-mismatch-fails-fast-test
  (testing "hello with matching t but mismatched checksum fails fast"
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
              (sync-handle-message/handle-message! test-repo client raw-message)
              (catch :default error
                (let [data (ex-data error)]
                  (is (= :db-sync/checksum-mismatch (:type data)))
                  (is (= "bad-checksum" (:remote-checksum data)))))
              (finally
                (reset! db-sync/*repo->latest-remote-tx latest-prev)))))))))

(deftest hello-checksum-mismatch-fails-fast-for-e2ee-test
  (testing "e2ee graphs ignore checksum verification for now"
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
            (sync-handle-message/handle-message! test-repo client raw-message)
            (is (= 0 (get @db-sync/*repo->latest-remote-tx test-repo)))
            (reset! db-sync/*repo->latest-remote-tx latest-prev)))))))

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
      (ldb/batch-transact!
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
      (ldb/batch-transact!
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
                                                     (#'legacy-rebase/drop-missing-created-block-datoms @conn)
                                                     (#'legacy-rebase/sanitize-tx-data @conn)
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
                                                   (#'legacy-rebase/drop-missing-created-block-datoms @conn)
                                                   (#'legacy-rebase/sanitize-tx-data @conn)
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
                                   (#'legacy-rebase/drop-missing-created-block-datoms @local-conn)
                                   (#'legacy-rebase/sanitize-tx-data @local-conn)
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
                   (:db-sync/outliner-ops (first raw-pending))))
            (is (= [[:transact nil]]
                   (:outliner-ops (first pending))))
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
          (let [{:keys [outliner-ops]} (last (#'sync-apply/pending-txs test-repo))]
            (is (= :save-block (ffirst outliner-ops)))
            (is (= {:block/uuid page-uuid
                    :block/title "Renamed"}
                   (first (second (first outliner-ops)))))))))))

(deftest move-blocks-up-down-enqueues-canonical-move-blocks-pending-op-test
  (testing "move-blocks-up-down is persisted as canonical move-blocks op"
    (let [{:keys [conn client-ops-conn child2]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:move-blocks-up-down [[(:db/id child2)] true]]]
                                  local-tx-meta)
          (let [{:keys [outliner-ops]} (first (#'sync-apply/pending-txs test-repo))
                [_ [_ _ opts]] (first outliner-ops)]
            (is (= :move-blocks (ffirst outliner-ops)))
            (is (= :move-blocks-up-down (:source-op opts)))
            (is (= true (:up? opts)))))))))

(deftest indent-outdent-enqueues-canonical-move-blocks-pending-op-test
  (testing "indent-outdent-blocks is persisted as canonical move-blocks op"
    (let [{:keys [conn client-ops-conn child2]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:indent-outdent-blocks [[(:db/id child2)] true {}]]]
                                  local-tx-meta)
          (let [{:keys [outliner-ops]} (first (#'sync-apply/pending-txs test-repo))
                [_ [_ _ opts]] (first outliner-ops)]
            (is (= :move-blocks (ffirst outliner-ops)))
            (is (= :indent-outdent-blocks (:source-op opts)))
            (is (= true (:indent? opts)))))))))

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
          (let [{:keys [outliner-ops]} (first (#'sync-apply/pending-txs test-repo))]
            (is (= [[:transact nil]] outliner-ops))))))))

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
            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo
                                                                  tx-id
                                                                  true
                                                                  {:db-sync/tx-id tx-id}))))
            (let [pending (#'sync-apply/pending-txs test-repo)]
              (is (= 2 (count pending)))
              (is (= 2 (count (distinct (map :tx-id pending)))))
              (is (= "hello"
                     (get-in (#'sync-apply/pending-tx-by-id test-repo tx-id)
                             [:forward-outliner-ops 0 1 0 :block/title]))))))))))

(deftest apply-history-action-invalid-raw-tx-returns-unapplied-test
  (testing "invalid raw history tx replay returns an explicit unapplied result instead of throwing"
    (let [{:keys [conn client-ops-conn]} (setup-parent-child)
          tx-id (random-uuid)
          invalid-tx [[:db/unknown 1 :block/title "bad"]]]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (ldb/transact! client-ops-conn
                         [{:db-sync/tx-id tx-id
                           :db-sync/pending? true
                           :db-sync/created-at (.now js/Date)
                           :db-sync/outliner-op :transact
                           :db-sync/outliner-ops [[:transact nil]]
                           :db-sync/forward-outliner-ops [[:transact nil]]
                           :db-sync/normalized-tx-data invalid-tx
                           :db-sync/reversed-tx-data []}])
          (let [result (#'sync-apply/apply-history-action! test-repo tx-id false {})]
            (is (= false (:applied? result)))
            (is (= :invalid-history-action-tx (:reason result)))))))))

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
            (is (= forward-ops (:outliner-ops pending)))
            (is (= forward-ops (:db-sync/forward-outliner-ops raw-pending)))
            (is (= inverse-ops (:db-sync/inverse-outliner-ops raw-pending)))))))))

(deftest direct-outliner-page-delete-persists-delete-page-outliner-op-test
  (testing "direct outliner-page/delete! still persists singleton delete-page outliner-ops"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "Delete Me"}}]})
          client-ops-conn (d/create-conn client-op/schema-in-db)
          page (db-test/find-page-by-title @conn "Delete Me")]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-page/delete! conn (:block/uuid page) {})
          (let [{:keys [outliner-ops]} (first (#'sync-apply/pending-txs test-repo))]
            (is (= :delete-page (ffirst outliner-ops)))
            (is (= (:block/uuid page)
                   (get-in outliner-ops [0 1 0])))))))))

(deftest direct-outliner-property-set-persists-set-block-property-outliner-op-test
  (testing "direct outliner-property/set-block-property! still persists singleton set-block-property outliner-ops"
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
                property-tx (some (fn [{:keys [outliner-ops]}]
                                    (when (= :set-block-property (ffirst outliner-ops))
                                      outliner-ops))
                                  pending)]
            (is (seq pending))
            (is (every? (comp seq :outliner-ops) pending))
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
                  property-tx (some (fn [{:keys [outliner-ops]}]
                                      (when (= :set-block-property (ffirst outliner-ops))
                                        outliner-ops))
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
                  property-tx (some (fn [{:keys [outliner-ops]}]
                                      (when (= :batch-set-property (ffirst outliner-ops))
                                        outliner-ops))
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
                   (get-in pending [:outliner-ops 0 1 0 0 :block/uuid])))
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
            (is (some #(and (= :save-block (first %))
                            (= empty-target-uuid (get-in % [1 0 :block/uuid])))
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

(deftest apply-history-action-undo-restores-soft-delete-via-recycle-tx-test
  (testing "history action undo restores a recycled block created from recycle tx-data"
    (let [{:keys [conn client-ops-conn child1 parent]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          page-uuid (some-> parent :block/page :block/uuid)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (let [recycle-tx (outliner-recycle/recycle-blocks-tx-data
                            @conn
                            [(d/entity @conn [:block/uuid child-uuid])]
                            {})
                _ (ldb/transact! conn recycle-tx (assoc local-tx-meta :outliner-op :delete-blocks))
                delete-action (->> (#'sync-apply/pending-txs test-repo)
                                   (filter #(= :delete-blocks (:outliner-op %)))
                                   last)
                recycled (d/entity @conn [:block/uuid child-uuid])]
            (is (some? delete-action))
            (is (= common-config/recycle-page-name
                   (some-> recycled :block/page :block/title)))
            (is (integer? (:logseq.property/deleted-at recycled)))

            (is (= true
                   (:applied? (#'sync-apply/apply-history-action! test-repo
                                                                  (:tx-id delete-action)
                                                                  true
                                                                  {}))))
            (let [restored (d/entity @conn [:block/uuid child-uuid])]
              (is (= page-uuid (some-> restored :block/page :block/uuid)))
              (is (nil? (:logseq.property/deleted-at restored))))))))))

(deftest direct-outliner-core-insert-blocks-persists-insert-blocks-outliner-op-test
  (testing "direct outliner-core/insert-blocks! still persists singleton insert-blocks outliner-ops"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-core/insert-blocks! conn
                                        [{:block/title "direct insert"}]
                                        parent
                                        {:sibling? false})
          (let [{:keys [outliner-ops]} (first (#'sync-apply/pending-txs test-repo))]
            (is (= :insert-blocks (ffirst outliner-ops)))
            (is (= [:block/uuid (:block/uuid parent)]
                   (get-in outliner-ops [0 1 1])))))))))

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
            (is (= :create-page (ffirst (:outliner-ops pending-before))))
            (is (= page-uuid (get-in pending-before [:outliner-ops 0 1 1 :uuid])))
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
            (is (= :insert-blocks (ffirst (:outliner-ops pending-before))))
            (is (= block-uuid
                   (get-in pending-before [:outliner-ops 0 1 0 0 :block/uuid])))
            (is (= true (get-in pending-before [:outliner-ops 0 1 2 :keep-uuid?])))
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

(deftest rebase-drops-whole-pending-reaction-tx-when-target-deleted-test
  (testing "if a pending user action becomes invalid during rebase, the whole tx is dropped"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          target-uuid (:block/uuid parent)
          remote-delete-tx (:tx-data (outliner-core/delete-blocks @conn [parent] {}))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:toggle-reaction [target-uuid "+1" nil]]]
                                  local-tx-meta)
          (is (= 1 (count (#'sync-apply/pending-txs test-repo))))
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           remote-delete-tx)
          (is (empty? (#'sync-apply/pending-txs test-repo))))))))

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
    (let [{:keys [conn client-ops-conn child1 child2]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child1) :block/parent (:db/id child2)]])
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id child2) :block/parent (:db/id child1)]])
          (let [child1' (d/entity @conn (:db/id child1))
                child2' (d/entity @conn (:db/id child2))]
            (is (= "child 2" (:block/title (:block/parent child1'))))
            (is (= "child 1" (:block/title (:block/parent child2'))))))))))

(deftest three-children-cycle-test
  (testing "conflicting parent updates can retain a cycle shape (3 children)"
    (let [{:keys [conn client-ops-conn child1 child2 child3]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child2) :block/parent (:db/id child1)]
                             [:db/add (:db/id child3) :block/parent (:db/id child2)]])
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id child2) :block/parent (:db/id child3)]
            [:db/add (:db/id child1) :block/parent (:db/id child2)]])
          (let [child' (d/entity @conn (:db/id child1))
                child2' (d/entity @conn (:db/id child2))
                child3' (d/entity @conn (:db/id child3))]
            (is (= "child 2" (:block/title (:block/parent child'))))
            (is (= "child 1" (:block/title (:block/parent child2'))))
            (is (= "child 2" (:block/title (:block/parent child3'))))))))))

(deftest ignore-missing-parent-update-after-local-delete-test
  (testing "remote hard delete drops dependent pending insert and removes descendants"
    (let [{:keys [conn client-ops-conn parent child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-core/insert-blocks! conn [{:block/title "child 4"}] parent {:sibling? false})
          (#'sync-apply/apply-remote-tx!
           test-repo
           nil
           (:tx-data (outliner-core/delete-blocks @conn [parent] {})))
          (let [child' (d/entity @conn [:block/uuid child-uuid])]
            (is (nil? child'))
            (is (empty? (#'sync-apply/pending-txs test-repo)))))))))

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
                  validation (db-validate/validate-local-db! @conn-a)
                  pending (#'sync-apply/pending-txs test-repo)]
              (is (nil? (:user.property/p2 local-block')))
              (is (not-any? (fn [{:keys [tx]}]
                              (some (fn [item]
                                      (and (vector? item)
                                           (= :user.property/p2 (nth item 2 nil))))
                                    tx))
                            pending))
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
                  validation (db-validate/validate-local-db! @conn-a)
                  pending (#'sync-apply/pending-txs test-repo)]
              (is (empty? (:block/tags local-block')))
              (is (not-any? (fn [{:keys [tx]}]
                              (some (fn [item]
                                      (and (vector? item)
                                           (= :block/tags (nth item 2 nil))))
                                    tx))
                            pending))
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
            (is (= 2 (count (distinct orders))))))))))

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
              (is (contains? extends-a :user.class/B))
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
    (let [{:keys [conn client-ops-conn parent child1 child2]} (setup-parent-child)
          child1-uuid (:block/uuid child1)
          child2-uuid (:block/uuid child2)]
      (with-redefs [db-sync/enqueue-local-tx!
                    (let [orig db-sync/enqueue-local-tx!]
                      (fn [repo tx-report]
                        (when-not (:rtc-tx? (:tx-meta tx-report))
                          (orig repo tx-report))))]
        (with-datascript-conns conn client-ops-conn
          (fn []
            (d/transact! conn [[:db/add (:db/id child1) :block/title "child 1 local"]])
            (d/transact! conn [[:db/add (:db/id child2) :block/title "child 2 local"]])
            (is (= 2 (count (#'sync-apply/pending-txs test-repo))))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id parent) :block/title "parent remote"]])
            (let [pending (#'sync-apply/pending-txs test-repo)
                  txs (mapv (fn [{:keys [tx]}]
                              (->> tx
                                   (map (fn [[op e a v _t]]
                                          [op e a v]))
                                   vec))
                            pending)]
              (is (= 2 (count pending)))
              (is (some #(= [[:db/add [:block/uuid child1-uuid] :block/title "child 1 local"]]
                            %)
                        txs))
              (is (some #(= [[:db/add [:block/uuid child2-uuid] :block/title "child 2 local"]]
                            %)
                        txs)))))))))

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
            (is (= 1 (count (#'sync-apply/pending-txs test-repo))))
            (#'sync-apply/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id child1) :block/title "same"]])
            (is (= 0 (count (#'sync-apply/pending-txs test-repo))))))))))

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
              (is (= 2 (count (#'sync-apply/pending-txs test-repo))))
              (#'sync-apply/apply-remote-tx!
               test-repo
               nil
               [[:db/add (:db/id parent) :block/title "parent remote"]])
              (let [pending (#'sync-apply/pending-txs test-repo)
                    save-block-tx (some (fn [{:keys [outliner-op tx]}]
                                          (when (= :save-block outliner-op)
                                            tx))
                                        pending)]
                (is (= 2 (count pending)))
                (is (some #(= [:db/add [:block/uuid block-uuid] :block/title "temp for lookup updated"]
                              %)
                          (mapv (fn [[op e a v _t]]
                                  [op e a v])
                                save-block-tx)))
                (is (not-any? string?
                              (keep second save-block-tx)))))))))))

(deftest structural-conflict-drops-whole-entity-local-tx-test
  (testing "remote structural conflicts drop the whole entity tx instead of leaving partial block state"
    (let [{:keys [conn child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          tx-data [[:db/add [:block/uuid child-uuid] :block/title "local title"]
                   [:db/add [:block/uuid child-uuid] :block/parent 999]
                   [:db/add [:block/uuid child-uuid] :block/page 998]
                   [:db/retract [:block/uuid child-uuid] :logseq.property/created-by-ref 100]]
          remote-updated-keys #{[child-uuid :block/page]}]
      (is (empty? (#'legacy-rebase/drop-remote-conflicted-local-tx
                   @conn
                   remote-updated-keys
                   tx-data))))))

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
            (d/transact! conn [[:db/add (:db/id block) :block/title "test"]])
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

(deftest sanitize-tx-data-drops-partial-create-when-parent-recycled-test
  (testing "created block should be dropped when parent is already recycled"
    (let [{:keys [conn parent]} (setup-parent-child)
          page-uuid (:block/uuid (:block/page parent))
          parent-uuid (:block/uuid parent)
          child-uuid (random-uuid)
          tx-data [[:db/add -1 :block/uuid child-uuid]
                   [:db/add -1 :block/title ""]
                   [:db/add -1 :block/page [:block/uuid page-uuid]]
                   [:db/add -1 :block/order "a0"]
                   [:db/add [:block/uuid child-uuid] :block/parent [:block/uuid parent-uuid]]]
          _ (outliner-core/delete-blocks! conn [parent] {})
          sanitized (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                         vec)]
      (is (empty? sanitized)))))

(deftest sanitize-tx-data-removes-orphaning-parent-retract-test
  (testing "when invalid reparent add is dropped, paired parent retract should be dropped too"
    (let [{:keys [conn parent child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          old-parent-uuid (:block/uuid parent)
          missing-parent-uuid (random-uuid)
          tx-data [[:db/retract [:block/uuid child-uuid] :block/parent [:block/uuid old-parent-uuid]]
                   [:db/add [:block/uuid child-uuid] :block/parent [:block/uuid missing-parent-uuid]]]
          sanitized (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                         vec)]
      (is (empty? sanitized)))))

(deftest drop-orphaning-parent-retracts-is-still-needed-test
  (testing "without orphaning-parent cleanup, sanitize leaves a bad parent retract behind"
    (let [{:keys [conn parent child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          old-parent-uuid (:block/uuid parent)
          missing-parent-uuid (random-uuid)
          tx-data [[:db/retract [:block/uuid child-uuid] :block/parent [:block/uuid old-parent-uuid]]
                   [:db/add [:block/uuid child-uuid] :block/parent [:block/uuid missing-parent-uuid]]]
          sanitized-without-cleanup (with-redefs [legacy-rebase/drop-orphaning-parent-retracts identity]
                                      (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                                           vec))]
      (is (= [[:db/retract [:block/uuid child-uuid]
               :block/parent
               [:block/uuid old-parent-uuid]]]
             sanitized-without-cleanup)))))

(deftest sanitize-tx-data-drops-numeric-entity-datoms-for-recycled-block-test
  (testing "numeric entity datoms targeting recycled blocks should be dropped"
    (let [{:keys [conn child1]} (setup-parent-child)
          child-id (:db/id child1)
          tx-data [[:db/add child-id :block/title "should-drop"]]
          _ (outliner-core/delete-blocks! conn [child1] {})
          sanitized (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                         vec)]
      (is (empty? sanitized)))))

(deftest sanitize-tx-data-drops-numeric-value-refs-for-recycled-block-test
  (testing "numeric ref values that point to recycled blocks should be dropped"
    (let [{:keys [conn parent child1]} (setup-parent-child)
          parent-id (:db/id parent)
          child-id (:db/id child1)
          tx-data [[:db/add parent-id :block/parent child-id]]
          _ (outliner-core/delete-blocks! conn [child1] {})
          sanitized (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                         vec)]
      (is (empty? sanitized)))))

(deftest sanitize-tx-data-drops-datoms-with-missing-numeric-entity-test
  (testing "stale numeric entity ids should be dropped to avoid creating anonymous entities"
    (let [{:keys [conn]} (setup-parent-child)
          missing-id 999999
          tx-data [[:db/add missing-id :block/title ""]]
          sanitized (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                         vec)]
      (is (empty? sanitized)))))

(deftest sanitize-tx-data-drops-datoms-with-missing-numeric-ref-value-test
  (testing "stale numeric ref values should be dropped when referenced entity no longer exists"
    (let [{:keys [conn parent]} (setup-parent-child)
          parent-id (:db/id parent)
          missing-id 999999
          tx-data [[:db/add parent-id :block/parent missing-id]]
          sanitized (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                         vec)]
      (is (empty? sanitized)))))

(deftest sanitize-tx-data-drops-datoms-with-missing-lookup-ref-value-test
  (testing "stale lookup ref values should be dropped when referenced entity no longer exists"
    (let [{:keys [conn child1 child2]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          new-parent-uuid (:block/uuid child2)
          missing-parent-uuid (random-uuid)
          tx-data [[:db/retract [:block/uuid child-uuid]
                    :block/parent
                    [:block/uuid missing-parent-uuid]]
                   [:db/add [:block/uuid child-uuid]
                    :block/parent
                    [:block/uuid new-parent-uuid]]]
          sanitized (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                         vec)]
      (is (= [[:db/add [:block/uuid child-uuid]
               :block/parent
               [:block/uuid new-parent-uuid]]]
             sanitized)))))

(deftest sanitize-tx-data-keeps-retract-entity-lookup-for-missing-block-test
  (testing "retractEntity lookup should survive sanitize for synced undo of inserted blocks"
    (let [{:keys [conn]} (setup-parent-child)
          missing-uuid (random-uuid)
          tx-data [[:db/retractEntity [:block/uuid missing-uuid]]]
          sanitized (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                         vec)]
      (is (= tx-data sanitized)))))

(deftest sanitize-tx-data-drops-stale-missing-block-lookup-updates-test
  (testing "title-only updates for a missing lookup block should be dropped"
    (let [{:keys [conn]} (setup-parent-child)
          missing-uuid (random-uuid)
          tx-data [[:db/add [:block/uuid missing-uuid] :block/title "stale title"]
                   [:db/add [:block/uuid missing-uuid] :block/updated-at 1773747515784]]
          sanitized (->> (#'legacy-rebase/sanitize-tx-data @conn tx-data)
                         vec)]
      (is (empty? sanitized)))))

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
