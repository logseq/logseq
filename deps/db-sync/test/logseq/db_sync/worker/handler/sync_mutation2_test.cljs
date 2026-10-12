(ns logseq.db-sync.worker.handler.sync-mutation2-test
  "Tests for survivors of the second mutation run on
  logseq.db-sync.worker.handler.sync."
  (:require ["better-sqlite3" :as sqlite3]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.test-sql :as test-sql]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.ws :as ws]
            [promesa.core :as p]))

(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn- select-sql?
  [sql]
  (string/starts-with? (-> sql string/trim string/lower-case) "select"))

(defn- make-memory-sql
  []
  (let [^js db (new sqlite ":memory:" nil)]
    #js {:_db db
         :exec (fn [sql-str & args]
                 (let [^js stmt (.prepare db sql-str)
                       js-args (to-array args)]
                   (if (select-sql? sql-str)
                     (.apply (.-all stmt) stmt js-args)
                     (do (.apply (.-run stmt) stmt js-args)
                         nil))))
         :close (fn [] (.close db))}))

(defn- json-body [response]
  (p/let [text (.text response)]
    (js->clj (js/JSON.parse text) :keywordize-keys true)))

(defn- <outcome
  "Resolves to {:ok value} or {:err error} for a promise."
  [promise]
  (-> promise
      (p/then (fn [v] {:ok v}))
      (p/catch (fn [e] {:err e}))))

(defn- finish
  [promise done]
  (-> promise
      (p/catch (fn [error] (is false (str error (some-> error .-stack)))))
      (p/finally (fn [& _] (done)))))

(deftest ensure-conn-initializes-schema-and-opens-conn-test
  (let [sql (make-memory-sql)
        self #js {:sql sql}]
    (#'sync-handler/ensure-conn! self)
    (is (true? (.-schema-ready self)))
    (is (some? (.-conn self)))
    (.close sql)))

(deftest set-graph-ready-for-use-test
  (async done
         (let [calls (atom [])
               set-ready (fn [self result]
                           (p/with-redefs [index/<graph-ready-for-use-set!
                                           (fn [db graph-id ready?]
                                             (swap! calls conj [db graph-id ready?])
                                             (p/resolved result))]
                             (<outcome (#'sync-handler/<set-graph-ready-for-use! self "g1" true))))
               db #js {:name "d1"}
               self #js {:env #js {:DB db}}
               ok-result #js {:success true :meta #js {:changes 1}}]
           (finish
            (p/let [ok (set-ready self ok-result)
                    _ (is (identical? ok-result (:ok ok)))
                    _ (is (= [[db "g1" true]] @calls))
                    nil-result (set-ready self nil)
                    _ (is (= {:type :db-sync/graph-ready-for-use-set-failed
                              :graph-id "g1"
                              :graph-ready-for-use? true
                              :result nil}
                             (ex-data (:err nil-result))))
                    failed-result #js {:success false}
                    failed (set-ready self failed-result)
                    _ (is (= {:type :db-sync/graph-ready-for-use-set-failed
                              :graph-id "g1"
                              :graph-ready-for-use? true
                              :result failed-result}
                             (ex-data (:err failed))))
                    no-rows-results [#js {:success true :meta #js {:changes 0}}
                                     #js {:success true :meta #js {:rows_written 0}}
                                     #js {:success true :changes 0}
                                     #js {:success true :rows_written 0}]
                    no-rows (reduce (fn [acc-promise result]
                                      (p/let [acc acc-promise
                                              outcome (set-ready self result)]
                                        (conj acc outcome)))
                                    (p/resolved [])
                                    no-rows-results)
                    _ (doseq [[result outcome] (map vector no-rows-results no-rows)]
                        (is (= {:type :db-sync/graph-ready-for-use-set-no-rows
                                :graph-id "g1"
                                :graph-ready-for-use? true
                                :rows-affected 0
                                :result result}
                               (ex-data (:err outcome)))))
                    missing (set-ready #js {:env #js {}} ok-result)
                    _ (is (= {:type :db-sync/missing-db-binding
                              :graph-id "g1"
                              :graph-ready-for-use? true}
                             (ex-data (:err missing))))
                    no-env (set-ready #js {} ok-result)
                    _ (is (= :db-sync/missing-db-binding (:type (ex-data (:err no-env)))))]
              true)
            done))))

(deftest import-snapshot-reset-replaces-existing-state-test
  (let [sql (make-memory-sql)
        self #js {:sql sql}]
    (#'sync-handler/ensure-conn! self)
    (storage/set-t! sql 5)
    (storage/set-meta! sql :extra "value")
    (common/sql-exec sql "insert into kvs (addr, content, addresses) values (?, ?, ?)" 5001 "old" nil)
    (#'sync-handler/import-snapshot! self [[5010 "new" nil]] false)
    (is (some? (.-conn self)) "no reset keeps the conn")
    (is (= 5 (storage/get-t sql)))
    (is (= "value" (storage/get-meta sql :extra)))
    (is (= [5001 5010] (filterv #(<= 5000 % 5999)
                                (mapv #(aget % "addr")
                                      (common/get-sql-rows (common/sql-exec sql "select addr from kvs order by addr"))))))
    (#'sync-handler/import-snapshot! self [[5020 "newer" nil]] true)
    (is (nil? (.-conn self)))
    (is (= 0 (storage/get-t sql)))
    (is (nil? (storage/get-meta sql :extra)))
    (is (= [5020] (mapv #(aget % "addr")
                        (common/get-sql-rows (common/sql-exec sql "select addr from kvs order by addr")))))
    (.close sql)))

(deftest fetch-snapshot-kvs-rows-test
  (let [calls (atom [])
        sql #js {:exec (fn [sql-str & args]
                         (swap! calls conj [sql-str (vec args)])
                         #js [#js {:addr 2 :content "b" :addresses "[]"}
                              #js {:addr 3 :content "c" :addresses nil}])}]
    (is (= [[2 "b" "[]"] [3 "c" nil]]
           (#'sync-handler/fetch-snapshot-kvs-rows sql 1 10)))
    (is (= [["select addr, content, addresses from kvs where addr > ? order by addr asc limit ?"
             [1 10]]]
           @calls))))

(deftest missing-block-uuids-from-error-test
  (let [u1 (random-uuid)
        u2 (random-uuid)
        error (ex-info "a" {:entity-id [:block/uuid u1]}
                       (ex-info "b" {:entity-id [:block/uuid u1]}
                                (ex-info "c" {:entity-id [:block/uuid u2]})))
        result (#'sync-handler/missing-block-uuids-from-error error)]
    (is (vector? result))
    (is (= [u1 u2] result))))

(deftest cardinality-many-attr-reads-schema-test
  (let [db (d/empty-db {:many-attr {:db/cardinality :db.cardinality/many}
                        :one-attr {}})]
    (is (true? (#'sync-handler/cardinality-many-attr? db :many-attr)))
    (is (false? (#'sync-handler/cardinality-many-attr? db :one-attr)))))

(deftest cardinality-many-attr-falls-back-to-attr-entity-test
  (testing "an attribute missing from the schema takes its cardinality from its entity"
    (let [db (d/init-db [(d/datom 1 :db/ident :many-attr)
                         (d/datom 1 :db/cardinality :db.cardinality/many)
                         (d/datom 2 :db/ident :one-attr)
                         (d/datom 2 :db/cardinality :db.cardinality/one)]
                        {})]
      (is (nil? (get (d/schema db) :many-attr)))
      (is (true? (#'sync-handler/cardinality-many-attr? db :many-attr)))
      (is (false? (#'sync-handler/cardinality-many-attr? db :one-attr))))))

(deftest tx-item-group-keys-test
  (let [db (d/empty-db)
        group-keys #(#'sync-handler/tx-item-group-keys db #{} %)]
    (testing "map with a tempid"
      (is (= #{-1} (group-keys {:db/id -1 :block/title "x"}))))
    (testing "cas ops on a tempid entity"
      (is (= #{-2} (group-keys [:db/cas -2 :block/title nil "x"])))
      (is (= #{-3} (group-keys [:db.fn/cas -3 :block/title nil "x"]))))
    (testing "retractEntity of a tempid"
      (is (= #{-4} (group-keys [:db/retractEntity -4])))
      (is (= #{-5} (group-keys [:db.fn/retractEntity -5]))))
    (testing "real entity ids have no group"
      (is (= #{} (group-keys [:db/retractEntity 7])))
      (is (= #{} (group-keys {:db/id 7 :block/title "x"}))))))

(deftest normalize-diagnostic-block-test
  (let [uuid (random-uuid)
        parent (random-uuid)
        page (random-uuid)]
    (is (= {:block/uuid (str uuid)
            :block/parent (str parent)
            :block/page (str page)
            :block/order "a0"
            :other 1}
           (#'sync-handler/normalize-diagnostic-block
            {:block/uuid uuid
             :block/parent parent
             :block/page page
             :block/order "a0"
             :other 1})))
    (is (= {:other 1} (#'sync-handler/normalize-diagnostic-block {:other 1})))))

(defn- admin-reset-self
  [storage-obj closed]
  #js {:state #js {:getWebSockets (fn [] #js [#js {:close (fn [code reason]
                                                            (swap! closed conj [code reason]))}])
                   :storage storage-obj}
       :schema-ready true
       :conn :old-conn})

(deftest handle-sync-admin-reset-with-delete-all-test
  (async done
         (let [closed (atom [])
               deleted (atom 0)
               alarm-deleted (atom 0)
               self (admin-reset-self #js {:deleteAll (fn [] (swap! deleted inc) (p/resolved nil))
                                           :deleteAlarm (fn [] (swap! alarm-deleted inc) (p/resolved nil))}
                                      closed)]
           (finish
            (p/let [response (#'sync-handler/handle-sync-admin-reset self)
                    body (json-body response)]
              (is (= 200 (.-status response)))
              (is (= {:ok true} body))
              (is (= [[1000 "graph deleted"]] @closed))
              (is (= 1 @deleted))
              (is (= 1 @alarm-deleted))
              (is (false? (.-schema-ready self)))
              (is (nil? (.-conn self))))
            done))))

(deftest handle-sync-admin-reset-without-delete-all-test
  (async done
         (let [closed (atom [])
               sql (make-memory-sql)
               self (admin-reset-self #js {} closed)]
           (set! (.-sql self) sql)
           (finish
            (p/let [_ (p/do
                        (#'sync-handler/ensure-conn! self)
                        (storage/set-meta! sql :extra "value")
                        (set! (.-schema-ready self) false)
                        (set! (.-conn self) :old-conn))
                    response (#'sync-handler/handle-sync-admin-reset self)
                    body (json-body response)]
              (is (= 200 (.-status response)))
              (is (= {:ok true} body))
              (is (= [[1000 "graph deleted"]] @closed))
              (is (true? (.-schema-ready self)))
              (is (nil? (.-conn self)))
              (is (nil? (storage/get-meta sql :extra)))
              (.close sql))
            done))))

(deftest handle-http-synchronous-error-response-test
  (async done
         (finish
          (p/let [sync-response (sync-handler/handle-http #js {} #js {:url "not a url"})
                  sync-body (json-body sync-response)]
            (is (= 500 (.-status sync-response)))
            (is (= "server error" (:error sync-body)))
            (is (string? (:debug-message sync-body)))
            (is (string? (:debug-stack sync-body))))
          done)))

(deftest handle-http-passes-url-to-route-handler-test
  (async done
         (let [sql (test-sql/make-sql)
               conn (storage/open-conn sql)
               self #js {:sql sql :conn conn :schema-ready true}
               request (js/Request. "http://localhost/sync/g1/pull?since=0")]
           (finish
            (p/let [response (sync-handler/handle-http self request)
                    body (json-body response)]
              (is (= 200 (.-status response)))
              (is (= "pull/ok" (:type body))))
            done))))

(defn- batch-self
  []
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)]
    #js {:sql sql :conn conn :schema-ready true}))

(def ^:private stale-missing-uuid (random-uuid))

(defn- ok-entry
  [tx-id]
  {:tx-id tx-id
   :tx (protocol/tx->transit [[:db/add -1 :block/title "ok"]])
   :outliner-op :save-block})

(defn- failing-entry
  [tx-id]
  {:tx-id tx-id
   :tx (protocol/tx->transit
        [[:db/add [:block/uuid stale-missing-uuid] :block/title "stale" 1]
         [:db/add [:block/uuid stale-missing-uuid] :block/updated-at 1773188050934 1]])
   :outliner-op :save-block})

(deftest handle-tx-batch-rejections-test
  (let [self (batch-self)
        sql (.-sql self)]
    (storage/set-t! sql 3)
    (with-redefs [ws/broadcast! (fn [& _] nil)]
      (is (= {:type "tx/reject" :reason "stale" :t 3}
             (sync-handler/handle-tx-batch! self nil [(ok-entry (random-uuid))] 1)))
      (is (= {:type "tx/reject" :reason "empty tx data"}
             (sync-handler/handle-tx-batch! self nil [] 3)))
      (storage/set-meta! sql :snapshot-uploading? "true")
      (is (= {:type "tx/reject" :reason "snapshot upload in progress" :t 3}
             (sync-handler/handle-tx-batch! self nil [(ok-entry (random-uuid))] 3))))))

(deftest apply-tx-reports-successful-and-failed-entries-test
  (let [self (batch-self)
        sql (.-sql self)
        ok-id (random-uuid)
        failed-id (random-uuid)
        result (#'sync-handler/apply-tx! self [(ok-entry ok-id)] nil)]
    (is (= [ok-id] (:successful-tx-ids result)))
    (is (true? (:applied? result)))
    (is (= (storage/get-t sql) (:t result)))
    (is (= {:type :db-sync/tx-entry-failed
            :successful-tx-ids [ok-id]
            :failed-tx-id failed-id
            :missing-block-uuids [stale-missing-uuid]}
           (try
             (#'sync-handler/apply-tx! self [(ok-entry ok-id) (failing-entry failed-id)] nil)
             nil
             (catch :default e (ex-data e)))))))

(deftest handle-tx-batch-failure-reports-partial-progress-test
  (let [self (batch-self)
        sql (.-sql self)
        ok-id (random-uuid)
        failed-id (random-uuid)
        broadcasts (atom [])
        response (with-redefs [ws/broadcast! (fn [_self _sender payload]
                                               (swap! broadcasts conj payload))]
                   (sync-handler/handle-tx-batch! self nil
                                                  [(ok-entry ok-id) (failing-entry failed-id)]
                                                  0))]
    (is (= "tx/reject" (:type response)))
    (is (= "db transact failed" (:reason response)))
    (is (string? (:error-detail response)))
    (is (pos? (:t response)))
    (is (= (storage/get-t sql) (:t response)))
    (is (= [ok-id] (:success-tx-ids response)))
    (is (= failed-id (:failed-tx-id response)))
    (is (= [stale-missing-uuid] (:missing-block-uuids response)))
    (is (= [{:type "changed" :t (:t response)}] @broadcasts))))

(deftest apply-tx-entry-empty-delete-throws-with-context-test
  (let [conn (storage/open-conn (test-sql/make-sql))
        entry {:tx (protocol/tx->transit []) :outliner-op :delete-blocks}]
    (is (= {:type :db-sync/empty-delete-tx :outliner-op :delete-blocks}
           (try
             (#'sync-handler/apply-tx-entry! conn entry)
             nil
             (catch :default e (ex-data e)))))))

(defn- delete-fixture
  []
  (let [conn (storage/open-conn (test-sql/make-sql))
        page (random-uuid)
        parent (random-uuid)
        child (random-uuid)
        pv (random-uuid)
        now 1783043128375]
    (d/transact! conn [{:block/uuid page :block/name "p" :block/title "p"
                        :block/created-at now :block/updated-at now}
                       {:block/uuid parent :block/title "parent"
                        :block/parent [:block/uuid page] :block/page [:block/uuid page]
                        :block/order "a0" :block/created-at now :block/updated-at now}
                       {:block/uuid child :block/title "child"
                        :block/parent [:block/uuid parent] :block/page [:block/uuid page]
                        :block/order "a1" :block/created-at now :block/updated-at now}
                       {:block/uuid pv :block/title "pv"
                        :block/parent [:block/uuid child] :block/page [:block/uuid page]
                        :block/order "a2" :block/created-at now :block/updated-at now}])
    {:conn conn :parent parent :child child :pv pv :now now}))

(deftest sanitize-tx-entry-delete-ops-options-test
  (let [{:keys [conn parent child pv now]} (delete-fixture)
        tx [[:db/add [:block/uuid child] :block/updated-at (inc now) 1]
            [:db/add [:block/uuid pv] :block/updated-at (inc now) 1]
            [:db/retractEntity [:block/uuid parent]]
            [:db/retractEntity [:block/uuid child]]]
        sanitize (fn [op]
                   (:tx-data (#'sync-handler/sanitize-tx-entry
                              @conn {:tx (protocol/tx->transit tx) :outliner-op op})))
        add-targets (fn [tx-data]
                      (set (keep (fn [item]
                                   (when (and (vector? item) (= :db/add (first item)))
                                     (second item)))
                                 tx-data)))
        deleted (sanitize :delete-blocks)
        kept (sanitize :save-block)]
    (testing "a delete drops adds on entities it retracts"
      (is (not (contains? (add-targets deleted) [:block/uuid child]))))
    (testing "another op keeps them"
      (is (contains? (add-targets kept) [:block/uuid child])))
    (testing "a delete retracts descendants it merely touched"
      (is (some #(= [:db/retractEntity (d/entid @conn [:block/uuid pv])] %) deleted)))
    (testing "tx-entry is returned as given"
      (is (= :delete-blocks
             (:outliner-op (:tx-entry (#'sync-handler/sanitize-tx-entry
                                       @conn {:tx (protocol/tx->transit tx)
                                              :outliner-op :delete-blocks}))))))))

(deftest large-tx-entry-updates-checksum-from-its-tx-data-test
  (let [self (batch-self)
        sql (.-sql self)
        conn (.-conn self)
        _ (storage/set-checksum! sql (sync-checksum/recompute-checksum @conn))
        before (storage/get-checksum sql)
        tx-data (vec (mapcat (fn [i]
                               [[:db/add (- (inc i)) :block/uuid (random-uuid)]
                                [:db/add (- (inc i)) :block/name (str "n" i)]
                                [:db/add (- (inc i)) :block/title (str "t" i)]])
                             (range 170)))
        entry {:tx-id (random-uuid)
               :tx (protocol/tx->transit tx-data)
               :outliner-op :save-block}]
    (is (true? (#'sync-handler/apply-tx-entry! self conn entry nil)))
    (is (not= before (storage/get-checksum sql)))
    (is (= (sync-checksum/recompute-checksum @conn) (storage/get-checksum sql)))))

(deftest large-tx-entry-keeps-outliner-op-in-tx-meta-test
  (let [conn (storage/open-conn (test-sql/make-sql))
        tx-metas (atom [])
        tx-data (mapv (fn [i] [:db/add (- (inc i)) :block/title (str "t" i)]) (range 500))
        entry {:tx-id (random-uuid)
               :tx (protocol/tx->transit tx-data)
               :outliner-op :save-block}]
    (d/listen! conn ::capture (fn [report] (swap! tx-metas conj (:tx-meta report))))
    (is (true? (#'sync-handler/apply-tx-entry! conn entry)))
    (d/unlisten! conn ::capture)
    (is (some #(and (= :apply-client-tx (:op %))
                    (= :save-block (:outliner-op %)))
              @tx-metas))))
