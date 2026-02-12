(ns frontend.undo-redo-test
  (:require [clojure.test :as t :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.modules.outliner.core-test :as outliner-test]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.undo-redo :as undo-redo]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.worker.undo-redo :as undo-validate]
            [logseq.db :as ldb]))

;; TODO: random property ops test

(def test-db test-helper/test-db)

(defmethod worker-db-listener/listen-db-changes :gen-undo-ops
  [_ {:keys [repo]} tx-report]
  (undo-redo/gen-undo-ops! repo
                           (-> tx-report
                               (assoc-in [:tx-meta :client-id] (:client-id @state/state))
                               (update-in [:tx-meta :local-tx?] (fn [local-tx?]
                                                                  (if (nil? local-tx?)
                                                                    true
                                                                    local-tx?))))))

(defn listen-db-fixture
  [f]
  (let [test-db-conn (db/get-db test-db false)]
    (assert (some? test-db-conn))
    (worker-db-listener/listen-db-changes! test-db test-db-conn
                                           {:handler-keys [:gen-undo-ops]})
    (f)
    (d/unlisten! test-db-conn :frontend.worker.db-listener/listen-db-changes!)))

(defn disable-browser-fns
  [f]
  ;; get-selection-blocks has a js/document reference
  (with-redefs [state/get-selection-blocks (constantly [])]
    (f)))

(defn with-worker-undo-validation
  [f]
  (let [orig-transact ldb/transact!]
    (with-redefs [ldb/transact! (fn [repo-or-conn tx-data tx-meta]
                                  (if (and (or (:undo? tx-meta) (:redo? tx-meta))
                                           (not (undo-validate/valid-undo-redo-tx? repo-or-conn tx-data)))
                                    (throw (ex-info "undo/redo tx invalid"
                                                    {:undo? (:undo? tx-meta)
                                                     :redo? (:redo? tx-meta)}))
                                    (if (satisfies? IDeref repo-or-conn)
                                      (d/transact! repo-or-conn tx-data tx-meta)
                                      (orig-transact repo-or-conn tx-data tx-meta))))]
      (f))))

(use-fixtures :each
  disable-browser-fns
  with-worker-undo-validation
  test-helper/react-components
  #(test-helper/start-and-destroy-db % {:build-init-data? false})
  listen-db-fixture)

(defn- undo-all!
  []
  (loop [i 0]
    (let [r (undo-redo/undo test-db)]
      (if (not= :frontend.undo-redo/empty-undo-stack r)
        (recur (inc i))
        (prn :undo-count i)))))

(defn- redo-all!
  []
  (loop [i 0]
    (let [r (undo-redo/redo test-db)]
      (if (not= :frontend.undo-redo/empty-redo-stack r)
        (recur (inc i))
        (prn :redo-count i)))))

(defn- parent-cycle?
  [ent]
  (let [start (:block/uuid ent)]
    (loop [current ent
           seen #{start}
           steps 0]
      (cond
        (>= steps 200) true
        (nil? (:block/parent current)) false
        :else (let [next-ent (:block/parent current)
                    next-uuid (:block/uuid next-ent)]
                (if (contains? seen next-uuid)
                  true
                  (recur next-ent (conj seen next-uuid) (inc steps))))))))

(defn- db-issues
  [db]
  (let [ents (->> (d/q '[:find [?e ...]
                         :where
                         [?e :block/uuid]]
                       db)
                  (map (fn [e] (d/entity db e))))
        uuid-required-ids (->> (concat
                                (d/q '[:find [?e ...]
                                       :where
                                       [?e :block/title]]
                                     db)
                                (d/q '[:find [?e ...]
                                       :where
                                       [?e :block/page]]
                                     db)
                                (d/q '[:find [?e ...]
                                       :where
                                       [?e :block/parent]]
                                     db))
                               distinct)]
    (concat
     (for [e uuid-required-ids
           :let [ent (d/entity db e)]
           :when (nil? (:block/uuid ent))]
       {:type :missing-uuid :e e})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (not (ldb/page? ent)) (nil? parent))]
       {:type :missing-parent :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (not (ldb/page? ent)) parent (nil? (:block/uuid parent)))]
       {:type :missing-parent-ref :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (not (ldb/page? ent)) (nil? page))]
       {:type :missing-page :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (not (ldb/page? ent)) page (not (ldb/page? page)))]
       {:type :page-not-page :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)
                 page (:block/page ent)
                 expected-page (when parent
                                 (if (ldb/page? parent) parent (:block/page parent)))]
           :when (and (not (ldb/page? ent))
                      parent
                      page
                      expected-page
                      (not= (:block/uuid expected-page) (:block/uuid page)))]
       {:type :page-mismatch :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and parent (= uuid (:block/uuid parent)))]
       {:type :self-parent :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)]
           :when (and (not (ldb/page? ent))
                      (parent-cycle? ent))]
       {:type :cycle :uuid uuid}))))

(defn- seed-page-parent-child!
  []
  (let [conn (db/get-db test-db false)
        page-uuid (random-uuid)
        parent-uuid (random-uuid)
        child-uuid (random-uuid)]
    (d/transact! conn
                 [{:db/ident :logseq.class/Page}
                  {:block/uuid page-uuid
                   :block/name "page"
                   :block/title "page"
                   :block/tags #{:logseq.class/Page}}
                  {:block/uuid parent-uuid
                   :block/title "parent"
                   :block/page [:block/uuid page-uuid]
                   :block/parent [:block/uuid page-uuid]}
                  {:block/uuid child-uuid
                   :block/title "child"
                   :block/page [:block/uuid page-uuid]
                   :block/parent [:block/uuid parent-uuid]}]
                 {:outliner-op :insert-blocks
                  :local-tx? false})
    {:page-uuid page-uuid
     :parent-uuid parent-uuid
     :child-uuid child-uuid}))

(deftest undo-records-only-local-txs-test
  (testing "undo history records only local txs"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "local-update"]]
                   {:outliner-op :save-block
                    :local-tx? true})
      (let [undo-result (undo-redo/undo test-db)]
        (is (not= :frontend.undo-redo/empty-undo-stack undo-result))
        (undo-redo/redo test-db)))
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "remote-update"]]
                   {:outliner-op :save-block
                    :local-tx? false})
      (is (= :frontend.undo-redo/empty-undo-stack (undo-redo/undo test-db))))))

(deftest undo-conflict-clears-history-test
  (testing "undo clears history when reverse tx is unsafe"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          block-uuid (random-uuid)]
      (d/transact! conn [{:block/uuid block-uuid
                          :block/title "conflict"}]
                   {:outliner-op :insert-blocks
                    :local-tx? true})
      (with-redefs [undo-redo/get-reversed-datoms (fn [& _] nil)]
        (is (= :frontend.undo-redo/empty-undo-stack (undo-redo/undo test-db)))))))

(deftest undo-works-for-local-graph-test
  (testing "undo/redo works for local changes on local graph"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "local-1"]]
                   {:outliner-op :save-block
                    :local-tx? true})
      (let [undo-result (undo-redo/undo test-db)]
        (is (not= :frontend.undo-redo/empty-undo-stack undo-result))
        (is (= "child" (:block/title (d/entity @conn [:block/uuid child-uuid])))))
      (let [redo-result (undo-redo/redo test-db)]
        (is (not= :frontend.undo-redo/empty-redo-stack redo-result))
        (is (= "local-1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))

(deftest undo-works-with-remote-updates-test
  (testing "undo works after remote updates on sync graphs"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "local-2"]]
                   {:outliner-op :save-block
                    :local-tx? true})
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/updated-at 12345]]
                   {:outliner-op :save-block
                    :local-tx? false})
      (let [undo-result (undo-redo/undo test-db)]
        (is (not= :frontend.undo-redo/empty-undo-stack undo-result))
        (is (= "child" (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))

(deftest undo-validation-allows-baseline-issues-test
  (testing "undo validation allows existing issues without introducing new ones"
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)
          orphan-uuid (random-uuid)]
      (d/transact! conn
                   [{:block/uuid orphan-uuid
                     :block/title "orphan"}]
                   {:local-tx? false})
      (is (undo-validate/valid-undo-redo-tx? conn
                                             [[:db/add [:block/uuid child-uuid]
                                               :block/title "child-updated"]])))))

(deftest undo-skips-when-parent-missing-test
  (testing "undo skips when parent is missing"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [parent-uuid child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/retractEntity [:block/uuid child-uuid]]]
                   {:outliner-op :delete-blocks
                    :local-tx? true})
      (d/transact! conn
                   [[:db/retractEntity [:block/uuid parent-uuid]]]
                   {:outliner-op :delete-blocks
                    :local-tx? false})
      (is (= :frontend.undo-redo/empty-undo-stack (undo-redo/undo test-db)))
      (is (nil? (d/entity @conn [:block/uuid child-uuid]))))))

(deftest undo-skips-when-block-deleted-remote-test
  (testing "undo skips when block was deleted remotely"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "child-updated"]]
                   {:outliner-op :save-block
                    :local-tx? true})
      (d/transact! conn
                   [[:db/retractEntity [:block/uuid child-uuid]]]
                   {:outliner-op :delete-blocks
                    :local-tx? false})
      (is (= :frontend.undo-redo/empty-undo-stack (undo-redo/undo test-db)))
      (is (nil? (d/entity @conn [:block/uuid child-uuid]))))))

(deftest undo-skips-when-undo-would-create-cycle-test
  (testing "undo skips when it would create a parent cycle"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [page-uuid parent-uuid child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/parent [:block/uuid page-uuid]]]
                   {:outliner-op :move-blocks
                    :local-tx? true})
      (d/transact! conn
                   [[:db/add [:block/uuid parent-uuid] :block/parent [:block/uuid child-uuid]]]
                   {:outliner-op :move-blocks
                    :local-tx? false})
      (is (= :frontend.undo-redo/empty-undo-stack (undo-redo/undo test-db)))
      (let [parent (d/entity @conn [:block/uuid parent-uuid])
            child (d/entity @conn [:block/uuid child-uuid])]
        (is (= child-uuid (:block/uuid (:block/parent parent))))
        (is (= page-uuid (:block/uuid (:block/parent child))))))))

(deftest undo-validation-fast-path-skips-db-issues-for-non-structural-tx-test
  (testing "undo validation skips db-issues for non-structural tx-data"
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (with-redefs [undo-validate/issues-for-entity-ids (fn [_ _]
                                                          (throw (js/Error. "issues-for-entity-ids called")))]
        (is (true? (undo-validate/valid-undo-redo-tx?
                    conn
                    [[:db/add [:block/uuid child-uuid] :block/title "child-updated"]])))))))

(deftest undo-validation-checks-structural-tx-test
  (testing "undo validation evaluates structural changes"
    (let [conn (db/get-db test-db false)
          {:keys [page-uuid child-uuid]} (seed-page-parent-child!)
          calls (atom 0)]
      (with-redefs [undo-validate/issues-for-entity-ids (fn [_ _]
                                                          (swap! calls inc)
                                                          [])]
        (is (true? (undo-validate/valid-undo-redo-tx?
                    conn
                    [[:db/add [:block/uuid child-uuid] :block/parent [:block/uuid page-uuid]]])))
        (is (pos? @calls))))))

(deftest ^:long undo-redo-test
  (testing "Random mixed operations"
    (set! undo-redo/max-stack-length 500)
    (let [*random-blocks (atom (outliner-test/get-blocks-ids))]
      (outliner-test/transact-random-tree!)
      (let [conn (db/get-db test-db false)]
        (d/transact! conn
                     [{:db/ident :logseq.class/Page}
                      [:db/add [:block/uuid 1] :block/tags :logseq.class/Page]]
                     {:local-tx? false}))
      (let [conn (db/get-db false)
            _ (outliner-test/run-random-mixed-ops! *random-blocks)]

        (undo-all!)
        (is (empty? (db-issues @conn)))

        (redo-all!)
        (is (empty? (db-issues @conn)))))))
