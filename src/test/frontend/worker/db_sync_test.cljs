(ns frontend.worker.db-sync-test
  (:require [cljs.test :refer [deftest is testing async]]
            [datascript.core :as d]
            [frontend.common.crypt :as crypt]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]
            [promesa.core :as p]))

(def ^:private test-repo "test-db-sync-repo")

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
      (#'db-sync/handle-message! test-repo client raw-message)
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
      (#'db-sync/handle-message! test-repo client raw-message)
      (is (= [{:user/uuid "u1" :user/name "Alice"}
              {:user/uuid "u2" :user/name "Bob" :user/editing-block-uuid "block-2"}]
             @(:online-users client)))
      (is (= 1 (count @broadcasts))))))

(deftest pull-ok-with-older-remote-tx-is-ignored-test
  (testing "pull/ok with remote tx behind local tx does not apply stale tx data"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
          parent-id (:db/id parent)
          stale-tx (sqlite-util/write-transit-str [[:db/add parent-id :block/title "stale-title"]])
          raw-message (js/JSON.stringify
                       (clj->js {:type "pull/ok"
                                 :t 4
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
            (#'db-sync/handle-message! test-repo client raw-message)
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
                 raw-new (js/JSON.stringify
                          (clj->js {:type "pull/ok"
                                    :t 2
                                    :txs [{:t 2 :tx new-tx}]}))
                 raw-stale (js/JSON.stringify
                            (clj->js {:type "pull/ok"
                                      :t 1
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
                 (-> (p/let [_ (#'db-sync/handle-message! test-repo client raw-new)
                             _ (#'db-sync/handle-message! test-repo client raw-stale)
                             parent' (d/entity @conn parent-id)]
                       (is (= "remote-new-title" (:block/title parent')))
                       (is (= 2 (client-op/get-local-tx test-repo))))
                     (p/finally (fn []
                                  (reset! db-sync/*repo->latest-remote-tx latest-prev)
                                  (done))))))))))

(deftest pull-ok-batched-txs-preserve-tempid-boundaries-test
  (testing "pull/ok applies tx batches without cross-tx tempid collisions"
    (async done
           (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)
                 page-uuid (:block/uuid (:block/page parent))
                 block-uuid-a (random-uuid)
                 block-uuid-b (random-uuid)
                 now 1760000000000
                 tx-a (sqlite-util/write-transit-str
                       [[:db/add -1 :block/uuid block-uuid-a]
                        [:db/add -1 :block/title "remote-a"]
                        [:db/add -1 :block/parent [:block/uuid page-uuid]]
                        [:db/add -1 :block/page [:block/uuid page-uuid]]
                        [:db/add -1 :block/order 1]
                        [:db/add -1 :block/updated-at now]
                        [:db/add -1 :block/created-at now]])
                 tx-b (sqlite-util/write-transit-str
                       [[:db/add -1 :block/uuid block-uuid-b]
                        [:db/add -1 :block/title "remote-b"]
                        [:db/add -1 :block/parent [:block/uuid page-uuid]]
                        [:db/add -1 :block/page [:block/uuid page-uuid]]
                        [:db/add -1 :block/order 2]
                        [:db/add -1 :block/updated-at now]
                        [:db/add -1 :block/created-at now]])
                 raw-message (js/JSON.stringify
                              (clj->js {:type "pull/ok"
                                        :t 2
                                        :txs [{:t 1 :tx tx-a}
                                              {:t 2 :tx tx-b}]}))
                 latest-prev @db-sync/*repo->latest-remote-tx
                 client {:repo test-repo
                         :graph-id "graph-1"
                         :inflight (atom [])
                         :online-users (atom [])
                         :ws-state (atom :open)}]
             (with-datascript-conns conn client-ops-conn
               (fn []
                 (reset! db-sync/*repo->latest-remote-tx {})
                 (-> (p/let [_ (client-op/update-local-tx test-repo 0)
                             _ (#'db-sync/handle-message! test-repo client raw-message)]
                       (is (= "remote-a" (:block/title (d/entity @conn [:block/uuid block-uuid-a]))))
                       (is (= "remote-b" (:block/title (d/entity @conn [:block/uuid block-uuid-b])))))
                     (p/finally (fn []
                                  (reset! db-sync/*repo->latest-remote-tx latest-prev)
                                  (done))))))))))

(deftest reaction-add-enqueues-pending-sync-tx-test
  (testing "adding a reaction should enqueue tx for db-sync"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:toggle-reaction [(:block/uuid parent) "+1" nil]]]
                                  {})
          (let [pending (#'db-sync/pending-txs test-repo)
                txs (mapcat :tx pending)]
            (is (seq pending))
            (is (some (fn [tx]
                        (and (vector? tx)
                             (= :db/add (first tx))
                             (= :logseq.property.reaction/emoji-id (nth tx 2 nil))
                             (= "+1" (nth tx 3 nil))))
                      txs))))))))

(deftest reaction-remove-enqueues-pending-sync-tx-test
  (testing "removing a reaction should enqueue tx for db-sync"
    (let [{:keys [conn client-ops-conn parent]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-op/apply-ops! conn
                                  [[:toggle-reaction [(:block/uuid parent) "+1" nil]]]
                                  {})
          (let [reaction-eid (-> (d/datoms @conn :avet :logseq.property.reaction/target (:db/id parent))
                                 first
                                 :e)
                before-count (count (#'db-sync/pending-txs test-repo))]
            (is (some? reaction-eid))
            (outliner-op/apply-ops! conn
                                    [[:toggle-reaction [(:block/uuid parent) "+1" nil]]]
                                    {})
            (let [after-count (count (#'db-sync/pending-txs test-repo))]
              (is (> after-count before-count)))))))))

(deftest ^:long reparent-block-when-cycle-detected-test
  (testing "cycle from remote sync reparent block to page root"
    (let [{:keys [conn parent child1]} (setup-parent-child)]
      (with-datascript-conns conn nil
        (fn []
          (#'db-sync/apply-remote-tx!
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

(deftest ^:long two-children-cycle-test
  (testing "cycle from remote sync overwrite client (2 children)"
    (let [{:keys [conn client-ops-conn child1 child2]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child1) :block/parent (:db/id child2)]])
          (#'db-sync/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id child2) :block/parent (:db/id child1)]])
          (let [child1' (d/entity @conn (:db/id child1))
                child2' (d/entity @conn (:db/id child2))]
            (is (= "parent" (:block/title (:block/parent child1'))))
            (is (= "child 1" (:block/title (:block/parent child2'))))))))))

(deftest ^:long three-children-cycle-test
  (testing "cycle from remote sync overwrite client (3 children)"
    (let [{:keys [conn client-ops-conn child1 child2 child3]} (setup-parent-child)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child2) :block/parent (:db/id child1)]
                             [:db/add (:db/id child3) :block/parent (:db/id child2)]])
          (#'db-sync/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id child2) :block/parent (:db/id child3)]
            [:db/add (:db/id child1) :block/parent (:db/id child2)]])
          (let [child' (d/entity @conn (:db/id child1))
                child2' (d/entity @conn (:db/id child2))
                child3' (d/entity @conn (:db/id child3))]
            (is (= "child 2" (:block/title (:block/parent child'))))
            (is (= "child 3" (:block/title (:block/parent child2'))))
            (is (= "parent" (:block/title (:block/parent child3'))))))))))

(deftest ^:long ignore-missing-parent-update-after-local-delete-test
  (testing "remote parent retracted while local adds another child"
    (let [{:keys [conn client-ops-conn parent child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (outliner-core/insert-blocks! conn [{:block/title "child 4"}] parent {:sibling? false})
          (#'db-sync/apply-remote-tx!
           test-repo
           nil
           [[:db/retractEntity [:block/uuid (:block/uuid parent)]]])
          (let [child' (d/entity @conn [:block/uuid child-uuid])]
            (is (nil? child'))))))))

(deftest ^:long fix-duplicate-orders-after-rebase-test
  (testing "duplicate order updates are fixed after remote rebase"
    (let [{:keys [conn client-ops-conn child1 child2]} (setup-parent-child)
          order (:block/order (d/entity @conn (:db/id child1)))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child1) :block/title "child 1 local"]])
          (#'db-sync/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id child1) :block/order order]
            [:db/add (:db/id child2) :block/order order]])
          (let [child1' (d/entity @conn (:db/id child1))
                child2' (d/entity @conn (:db/id child2))
                orders [(:block/order child1') (:block/order child2')]]
            (is (every? some? orders))
            (is (= 2 (count (distinct orders))))))))))

(deftest ^:long create-today-journal-does-not-rewrite-existing-journal-timestamps-test
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

(deftest ^:long fix-duplicate-order-against-existing-sibling-test
  (testing "duplicate order update is fixed when it collides with an existing sibling"
    (let [{:keys [conn client-ops-conn child1 child2]} (setup-parent-child)
          child2-order (:block/order (d/entity @conn (:db/id child2)))]
      (with-datascript-conns conn client-ops-conn
        (fn []
          (d/transact! conn [[:db/add (:db/id child1) :block/title "child 1 local"]])
          (#'db-sync/apply-remote-tx!
           test-repo
           nil
           [[:db/add (:db/id child1) :block/order child2-order]])
          (let [child1' (d/entity @conn (:db/id child1))
                child2' (d/entity @conn (:db/id child2))]
            (is (some? (:block/order child1')))
            (is (not= (:block/order child1') (:block/order child2')))))))))

(deftest ^:long two-clients-extends-cycle-test
  (testing "remote extends wins when two clients create a cycle"
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
            (#'db-sync/apply-remote-tx!
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

(deftest ^:long fix-duplicate-orders-with-local-and-remote-new-blocks-test
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
            (#'db-sync/apply-remote-tx!
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

(deftest ^:long rebase-replaces-pending-txs-test
  (testing "pending txs are rebased into a single tx after remote rebase"
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
            (is (= 2 (count (#'db-sync/pending-txs test-repo))))
            (#'db-sync/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id parent) :block/title "parent remote"]])
            (let [pending (#'db-sync/pending-txs test-repo)
                  txs (->> (mapcat :tx pending)
                           (map (fn [[op e a v _t]]
                                  [op e a v])))]
              (is (= 1 (count pending)))
              (is (some #(= % [:db/add [:block/uuid child1-uuid] :block/title "child 1 local"]) txs))
              (is (some #(= % [:db/add [:block/uuid child2-uuid] :block/title "child 2 local"]) txs)))))))))

(deftest ^:long rebase-keeps-pending-when-rebased-empty-test
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
            (is (= 1 (count (#'db-sync/pending-txs test-repo))))
            (#'db-sync/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id child1) :block/title "same"]])
            (is (= 0 (count (#'db-sync/pending-txs test-repo))))))))))

(deftest ^:long rebase-preserves-title-when-reversed-tx-ids-change-test
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
            (is (= 1 (count (#'db-sync/pending-txs test-repo))))
            (#'db-sync/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id block) :block/updated-at 1710000000000]])
            (let [block' (d/entity @conn (:db/id block))]
              (is (= "test" (:block/title block'))))))))))

(deftest ^:long rebase-does-not-leave-anonymous-created-by-entities-test
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
            (is (seq (#'db-sync/pending-txs test-repo)))
            (#'db-sync/apply-remote-tx!
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
              (is (empty? (map :entity (:errors validation)))
                  (str (:errors validation))))))))))

(deftest ^:long rebase-create-then-delete-does-not-leave-anonymous-entities-test
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
              (is (>= (count (#'db-sync/pending-txs test-repo)) 2))
              (#'db-sync/apply-remote-tx!
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
                (is (empty? (map :entity (:errors validation)))
                    (str (:errors validation)))))))))))

(deftest ^:long malformed-remote-anonymous-entity-tx-is-ignored-test
  (testing "remote tx creating anonymous entities should be ignored instead of invalidating db"
    (let [{:keys [conn parent]} (setup-parent-child)
          created-by-id (:db/id (:block/page parent))
          ts 1771435997392
          malformed-tx [[:db/add "missing-uuid-entity" :block/created-at ts]
                        [:db/add "missing-uuid-entity" :block/updated-at ts]
                        [:db/add "missing-uuid-entity" :logseq.property/created-by-ref created-by-id]]]
      (with-datascript-conns conn nil
        (fn []
          (is (nil? (try
                      (#'db-sync/apply-remote-tx! test-repo nil malformed-tx)
                      nil
                      (catch :default e
                        e))))
          (let [anonymous-ents (->> (d/datoms @conn :avet :logseq.property/created-by-ref)
                                    (keep (fn [datom]
                                            (let [ent (d/entity @conn (:e datom))]
                                              (when (and (nil? (:block/uuid ent))
                                                         (nil? (:db/ident ent))
                                                         (= ts (:block/created-at ent))
                                                         (= ts (:block/updated-at ent)))
                                                (select-keys ent [:db/id :block/created-at :block/updated-at :logseq.property/created-by-ref]))))))
                validation (db-validate/validate-local-db! @conn)]
            (is (empty? anonymous-ents) (str anonymous-ents))
            (is (empty? (map :entity (:errors validation)))
                (str (:errors validation)))))))))

(deftest ^:long offload-large-title-test
  (testing "large titles are offloaded to object storage with placeholder"
    (async done
           (let [large-title (apply str (repeat 5000 "a"))
                 tx-data [[:db/add 1 :block/title large-title]]
                 upload-calls (atom [])
                 upload-fn (fn [_repo _graph-id title _aes-key]
                             (swap! upload-calls conj title)
                             (p/resolved {:asset-uuid "title-1"
                                          :asset-type "txt"}))]
             (-> (p/let [result (#'db-sync/offload-large-titles
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
                 (p/finally done))))))

(deftest ^:long offload-small-title-test
  (testing "small titles are not offloaded"
    (async done
           (let [tx-data [[:db/add 1 :block/title "short"]]
                 upload-fn (fn [_repo _graph-id _title _aes-key]
                             (p/rejected (ex-info "unexpected upload" {})))]
             (-> (p/let [result (#'db-sync/offload-large-titles
                                 tx-data
                                 {:repo test-repo
                                  :graph-id "graph-1"
                                  :upload-fn upload-fn
                                  :aes-key nil})]
                   (is (= tx-data result)))
                 (p/finally done))))))

(deftest ^:long upload-large-title-encrypts-transit-payload-test
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
                         _ (#'db-sync/upload-large-title! test-repo "graph-1" title aes-key)
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

(deftest ^:long ^:fix-me download-large-title-decrypts-transit-payload-test
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
                   (p/let [result (#'db-sync/download-large-title!
                                   test-repo
                                   "graph-1"
                                   {:asset-uuid "title-1" :asset-type "txt"}
                                   aes-key)]
                     (is (= title result))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error " e))))
                 (p/finally
                   (fn []
                     (set! js/fetch fetch-prev)
                     (reset! worker-state/*db-sync-config config-prev)
                     (done))))))))

(deftest ^:long rehydrate-large-title-test
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
                   (is (true? (#'db-sync/large-title-object? obj))))
                 (let [items (->> tx-data
                                  (keep (fn [item]
                                          (when (and (vector? item)
                                                     (= :db/add (nth item 0))
                                                     (= :logseq.property.sync/large-title-object (nth item 2))
                                                     (true? (#'db-sync/large-title-object? (nth item 3))))
                                            {:e (nth item 1)
                                             :obj (nth item 3)})))
                                  (distinct))]
                   (is (= 1 (count items))))
                 (-> (p/let [result (#'db-sync/rehydrate-large-titles!
                                     test-repo
                                     {:tx-data tx-data
                                      :conn conn
                                      :graph-id "graph-1"
                                      :download-fn download-fn
                                      :aes-key nil})
                             _ (is (some? result))
                             block (d/entity @conn block-id)]
                       (is (= [{:asset-uuid "title-1" :asset-type "txt"}] @download-calls))
                       (is (= "rehydrated-title" (:block/title block))))
                     (p/finally done))))))))
