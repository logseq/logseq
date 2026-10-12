(ns logseq.outliner.op-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]))

(defn- apply-ops-capturing!
  "Applies `ops`; returns the tx-meta of the committed transactions."
  [conn ops opts]
  (let [metas (atom [])]
    (d/listen! conn ::captured-meta
               (fn [{:keys [tx-meta]}]
                 (swap! metas conj tx-meta)))
    (try
      (outliner-op/apply-ops! conn ops opts)
      @metas
      (finally
        (d/unlisten! conn ::captured-meta)))))

(defn- user-page-tx
  [user-uuid title]
  {:block/uuid user-uuid
   :block/name title
   :block/title title
   :block/created-at 1
   :block/updated-at 1
   :block/tags #{:logseq.class/Page}})

(deftest toggle-reaction-matches-emoji-and-user-test
  (let [user-a (random-uuid)
        user-b (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "Block"}]}])]
    (ldb/transact! conn [(user-page-tx user-a "user-a") (user-page-tx user-b "user-b")] {})
    (let [target-uuid (:block/uuid (db-test/find-block-by-content @conn "Block"))
          reactions #(:logseq.property.reaction/_target (d/entity @conn [:block/uuid target-uuid]))
          toggle! (fn [emoji user] (outliner-op/apply-ops! conn [[:toggle-reaction [target-uuid emoji user]]] {}))]
      (toggle! "+1" user-a)
      (testing "another user with the same emoji adds a reaction"
        (toggle! "+1" user-b)
        (is (= 2 (count (reactions)))))
      (testing "the same user with another emoji adds a reaction"
        (toggle! "-1" user-a)
        (is (= 3 (count (reactions)))))
      (testing "the same user and emoji removes it"
        (toggle! "+1" user-a)
        (is (= #{["+1" user-b] ["-1" user-a]}
               (set (map (fn [reaction]
                           [(:logseq.property.reaction/emoji-id reaction)
                            (:block/uuid (:logseq.property/created-by-ref reaction))])
                         (reactions)))))))))

(deftest apply-template-nests-under-a-target-with-children-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "tpl"
                          :build/children [{:block/title "t-child"}]}
                         {:block/title "target-a"}
                         {:block/title "target-b"
                          :build/children [{:block/title "existing"}]}]}])
        db @conn
        tpl (db-test/find-block-by-content db "tpl")
        original-child (db-test/find-block-by-content db "t-child")
        page-id (:db/id (:block/page tpl))
        copies (fn []
                 (->> (d/q '[:find [?e ...] :where [?e :block/title "t-child"]] @conn)
                      (remove #(= % (:db/id original-child)))
                      (map #(d/entity @conn %))))]
    (outliner-op/apply-ops! conn [[:apply-template [(:block/uuid tpl)
                                                    (:block/uuid (db-test/find-block-by-content db "target-a"))
                                                    {}]]] {})
    (is (= 1 (count (copies))))
    (is (= page-id (:db/id (:block/parent (first (copies)))))
        "a childless target gets the template as a sibling")
    (let [target-b (db-test/find-block-by-content @conn "target-b")]
      (outliner-op/apply-ops! conn [[:apply-template [(:block/uuid tpl) (:block/uuid target-b) {}]]] {})
      (is (= 2 (count (copies))))
      (is (some #(= (:db/id target-b) (:db/id (:block/parent %))) (copies))
          "a target with children gets the template as a child"))))

(deftest move-blocks-without-a-target-is-a-no-op-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "A"} {:block/title "B"}]}])
        a (db-test/find-block-by-content @conn "A")
        before-parent (:db/id (:block/parent a))
        before-order (:block/order a)]
    (outliner-op/apply-ops! conn [[:move-blocks [[(:block/uuid a)] (random-uuid) {}]]] {})
    (is (= before-parent (:db/id (:block/parent (d/entity @conn (:db/id a))))))
    (is (= before-order (:block/order (d/entity @conn (:db/id a)))))
    (outliner-op/apply-ops! conn [[:move-blocks [[(random-uuid)] (:block/uuid a) {}]]] {})
    (is (= before-order (:block/order (d/entity @conn (:db/id a)))))))

(deftest delete-blocks-without-selection-is-recorded-as-sent-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")
        metas (apply-ops-capturing! conn
                                    [[:delete-blocks [[(:block/uuid child) (:block/uuid parent)] {}]]]
                                    {:outliner-op :delete-blocks})
        recorded (vec (mapcat :outliner-ops metas))]
    (is (= [[:delete-blocks [[(:block/uuid child) (:block/uuid parent)] {}]]] recorded))))

(deftest apply-ops-tx-meta-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "A"}]}])
        a (db-test/find-block-by-content @conn "A")
        ;; a fresh title each time, so that every call commits a transaction
        save (fn [] [[:transact [[[:db/add (:db/id a) :block/title (str "A" (random-uuid))]] {}]]])
        tx-id (random-uuid)
        last-meta (fn [metas] (last metas))]
    (testing "a single op names the transaction"
      (is (= :transact (:outliner-op (last-meta (apply-ops-capturing! conn (save) {}))))))
    (testing "a single op without its own tx-meta op names the transaction"
      (is (= :collapse-expand-blocks
             (:outliner-op (last-meta (apply-ops-capturing!
                                       conn
                                       [[:collapse-expand-blocks [[{:db/id (:db/id a) :block/collapsed? true}] {}]]]
                                       {}))))))
    (testing "an explicit outliner op wins over the single op"
      (is (= :custom-op (:outliner-op (last-meta (apply-ops-capturing! conn (save) {:outliner-op :custom-op}))))))
    (testing "a given tx id is kept, a missing one is generated"
      (is (= tx-id (:db-sync/tx-id (last-meta (apply-ops-capturing! conn (save) {:db-sync/tx-id tx-id})))))
      (is (uuid? (:db-sync/tx-id (last-meta (apply-ops-capturing! conn (save) {}))))))))

(deftest apply-ops-additional-tx-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "A"} {:block/title "B"}]}])
        a (db-test/find-block-by-content @conn "A")
        b (db-test/find-block-by-content @conn "B")]
    (outliner-op/apply-ops! conn
                            [[:transact [[[:db/add (:db/id a) :block/title "A2"]] {}]]]
                            {:additional-tx [[:db/add (:db/id b) :block/title "B2"]]})
    (is (= "A2" (:block/title (d/entity @conn (:db/id a)))))
    (is (= "B2" (:block/title (d/entity @conn (:db/id b)))))))

(deftest insert-blocks-op-is-recorded-with-its-blocks-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Test"}
                :blocks [{:block/title "Target"}]}])
        target (db-test/find-block-by-content @conn "Target")
        new-uuid (random-uuid)
        metas (apply-ops-capturing! conn
                                    [[:insert-blocks [[{:block/uuid new-uuid :block/title "New"}]
                                                      (:block/uuid target)
                                                      {:sibling? true :keep-uuid? true}]]]
                                    {})
        recorded (vec (mapcat :outliner-ops metas))]
    (is (= 1 (count recorded)))
    (is (= :insert-blocks (ffirst recorded)))
    (is (= "New" (:block/title (first (first (second (first recorded)))))))
    (is (= (:block/uuid target) (second (second (first recorded)))))))
