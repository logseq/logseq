(ns frontend.worker.db-sync-test
  (:require [cljs.test :refer [deftest is testing async]]
            [datascript.core :as d]
            [frontend.common.crypt :as crypt]
            [frontend.worker.db-sync :as db-sync]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
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
    (try
      (f)
      (finally
        (reset! worker-state/*datascript-conns db-prev)
        (reset! worker-state/*client-ops-conns ops-prev)))))

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

(deftest reparent-block-when-cycle-detected-test
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

(deftest ensure-block-parents-test
  (let [{:keys [conn child1 parent]} (setup-parent-child)
        child-uuid (:block/uuid child1)
        parent-uuid (:block/uuid parent)
        page-uuid (:block/uuid (:block/page child1))]
    (testing "adds parent when a block loses parent without becoming a page"
      (let [tx-data [[:db/retract [:block/uuid child-uuid] :block/parent [:block/uuid parent-uuid] 1]]
            fixed (#'db-sync/ensure-block-parents @conn tx-data)]
        (is (some (fn [item]
                    (and (= :db/add (first item))
                         (= [:block/uuid child-uuid] (second item))
                         (= :block/parent (nth item 2))
                         (= [:block/uuid page-uuid] (nth item 3))))
                  fixed))))
    (testing "does not add parent when converting to page"
      (let [tx-data [[:db/retract [:block/uuid child-uuid] :block/parent [:block/uuid parent-uuid] 1]
                     [:db/add [:block/uuid child-uuid] :block/name "page" 1]]
            fixed (#'db-sync/ensure-block-parents @conn tx-data)]
        (is (= tx-data fixed))))
    (testing "does not add parent when entity is retracted"
      (let [tx-data [[:db/retract [:block/uuid child-uuid] :block/parent [:block/uuid parent-uuid] 1]
                     [:db/retractEntity [:block/uuid child-uuid]]]
            fixed (#'db-sync/ensure-block-parents @conn tx-data)]
        (is (= tx-data fixed))))))

(deftest ensure-block-parents-last-op-retract-test
  (let [{:keys [conn child1 parent]} (setup-parent-child)
        child-uuid (:block/uuid child1)
        parent-uuid (:block/uuid parent)
        page-uuid (:block/uuid (:block/page child1))]
    (testing "retract after add still reparents to page"
      (let [tx-data [[:db/add [:block/uuid child-uuid] :block/parent [:block/uuid parent-uuid] 1]
                     [:db/retract [:block/uuid child-uuid] :block/parent [:block/uuid parent-uuid] 2]]
            fixed (#'db-sync/ensure-block-parents @conn tx-data)]
        (is (some (fn [item]
                    (and (= :db/add (first item))
                         (= [:block/uuid child-uuid] (second item))
                         (= :block/parent (nth item 2))
                         (= [:block/uuid page-uuid] (nth item 3))))
                  fixed))))))

(deftest sanitize-tx-data-ensures-parent-test
  (let [{:keys [conn child1 parent]} (setup-parent-child)
        child-uuid (:block/uuid child1)
        parent-uuid (:block/uuid parent)
        page-uuid (:block/uuid (:block/page child1))]
    (testing "sanitize-tx-data preserves parent for blocks when last op retracts parent"
      (let [tx-data [[:db/add [:block/uuid child-uuid] :block/parent [:block/uuid parent-uuid] 1]
                     [:db/retract [:block/uuid child-uuid] :block/parent [:block/uuid parent-uuid] 2]]
            fixed (#'db-sync/sanitize-tx-data @conn tx-data #{})]
        (is (some (fn [item]
                    (and (= :db/add (first item))
                         (= [:block/uuid child-uuid] (second item))
                         (= :block/parent (nth item 2))
                         (= [:block/uuid page-uuid] (nth item 3))))
                  fixed))))))

(deftest encrypt-decrypt-tx-data-test
  (async done
         (-> (p/let [aes-key (crypt/<generate-aes-key)
                     tx-data [[:db/add 1 :block/title "hello"]
                              [:db/add 2 :block/name "page"]
                              [:db/add 3 :block/uuid (random-uuid)]]
                     encrypted (#'db-sync/<encrypt-tx-data aes-key tx-data)]
               (is (not= tx-data encrypted))
               (is (string? (nth (first encrypted) 3)))
               (is (string? (nth (second encrypted) 3)))
               (is (not= (nth (second encrypted) 3) "page"))
               (p/let [decrypted (#'db-sync/<decrypt-tx-data aes-key encrypted)]
                 (is (= tx-data decrypted))
                 (done)))
             (p/catch (fn [e]
                        (is false (str e))
                        (done))))))

(deftest encrypt-decrypt-snapshot-rows-test
  (async done
         (-> (p/let [aes-key (crypt/<generate-aes-key)
                     keys [[1 :block/title "hello" 0]
                           [1 :block/name "page" 0]
                           [1 :block/uuid (random-uuid) 0]]
                     content (sqlite-util/write-transit-str {:keys keys})
                     encrypted-title (#'db-sync/<encrypt-text-value aes-key "hello")
                     encrypted-name (#'db-sync/<encrypt-text-value aes-key "page")
                     encrypted-content (sqlite-util/write-transit-str
                                        {:keys [[1 :block/title encrypted-title 0]
                                                [1 :block/name encrypted-name 0]
                                                [1 :block/uuid (nth (nth keys 2) 2) 0]]})
                     rows [[1 encrypted-content nil]]]
               (is (not= content encrypted-content))
               (p/let [decrypted (#'db-sync/<decrypt-snapshot-rows aes-key rows)
                       decode (fn [content']
                                (let [data (ldb/read-transit-str content')]
                                  (if (map? data)
                                    (update data :keys (fnil vec []))
                                    data)))
                       decoded-original (decode content)
                       decoded-decrypted (decode (nth (first decrypted) 1))]
                 (is (= decoded-original decoded-decrypted))
                 (done)))
             (p/catch (fn [e]
                        (is false (str e))
                        (done))))))

(deftest encrypt-datoms-test
  (async done
         (let [conn (db-test/create-conn-with-blocks
                     {:pages-and-blocks
                      [{:page {:block/title "page 1"}
                        :blocks [{:block/title "parent"}]}]})
               datoms (vec (d/datoms @conn :eavt))
               title-datom (first (filter (fn [datom] (= :block/title (:a datom))) datoms))
               name-datom (first (filter (fn [datom] (= :block/name (:a datom))) datoms))
               uuid-datom (first (filter (fn [datom] (= :block/uuid (:a datom))) datoms))]
           (-> (p/let [aes-key (crypt/<generate-aes-key)
                       tx-data (#'db-sync/<encrypt-datoms aes-key datoms)
                       title-tx (first (filter (fn [item]
                                                 (and (= (:e title-datom) (:e item))
                                                      (= :block/title (:a item))))
                                               tx-data))
                       name-tx (first (filter (fn [item]
                                                (and (= (:e name-datom) (:e item))
                                                     (= :block/name (:a item))))
                                              tx-data))
                       uuid-tx (first (filter (fn [item]
                                                (and (= (:e uuid-datom) (:e item))
                                                     (= :block/uuid (:a item))))
                                              tx-data))]
                 (is (string? (:v title-tx)))
                 (is (string? (:v name-tx)))
                 (is (not= (:v title-datom) (:v title-tx)))
                 (is (= (:v uuid-datom) (:v uuid-tx)))
                 (done))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest ensure-user-rsa-keys-test
  (async done
         (let [upload-called (atom nil)]
           (-> (p/with-redefs [db-sync/e2ee-base (fn [] "http://base")
                               db-sync/<fetch-user-rsa-key-pair-raw (fn [_] (p/resolved {}))
                               db-sync/<upload-user-rsa-key-pair! (fn [_ public-key encrypted-private-key]
                                                                    (reset! upload-called [public-key encrypted-private-key])
                                                                    (p/resolved {:public-key public-key
                                                                                 :encrypted-private-key encrypted-private-key}))
                               crypt/<generate-rsa-key-pair (fn [] (p/resolved #js {:publicKey :pub :privateKey :priv}))
                               crypt/<export-public-key (fn [_] (p/resolved :pub-export))
                               crypt/<encrypt-private-key (fn [_ _] (p/resolved :priv-encrypted))
                               worker-state/<invoke-main-thread (fn [_] (p/resolved {:password "pw"}))]
                 (p/let [resp (db-sync/ensure-user-rsa-keys!)]
                   (is (map? resp))
                   (is (= 2 (count @upload-called)))
                   (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest two-children-cycle-test
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

(deftest three-children-cycle-test
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

(deftest ignore-missing-parent-update-after-local-delete-test
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

(deftest fix-duplicate-orders-after-rebase-test
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

(deftest fix-duplicate-order-against-existing-sibling-test
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

(deftest two-clients-extends-cycle-test
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

(deftest rebase-replaces-pending-txs-test
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
            (is (= 1 (count (#'db-sync/pending-txs test-repo))))
            (#'db-sync/apply-remote-tx!
             test-repo
             nil
             [[:db/add (:db/id child1) :block/title "same"]])
            (is (= 0 (count (#'db-sync/pending-txs test-repo))))))))))

(deftest normalize-online-users-include-editing-block-test
  (testing "online user normalization preserves editing block info"
    (let [result (#'db-sync/normalize-online-users
                  [{:user-id "user-1"
                    :name "Jane"
                    :editing-block-uuid "block-1"}])]
      (is (= [{:user/uuid "user-1"
               :user/name "Jane"
               :user/editing-block-uuid "block-1"}]
             result)))))

(deftest normalize-online-users-omit-empty-editing-block-test
  (testing "online user normalization drops empty editing block info"
    (let [result (#'db-sync/normalize-online-users
                  [{:user-id "user-1"
                    :name "Jane"
                    :editing-block-uuid nil}])]
      (is (= [{:user/uuid "user-1"
               :user/name "Jane"}]
             result)))))
