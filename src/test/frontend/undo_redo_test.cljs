(ns frontend.undo-redo-test
  (:require [clojure.test :as t :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.handler.editor :as editor]
            [frontend.modules.outliner.core-test :as outliner-test]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.undo-redo :as undo-redo]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.worker.undo-redo :as undo-validate]
            [logseq.db :as ldb]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]))

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
  (let [ignore-ent? (fn [ent]
                      (or (ldb/recycled? ent)
                          (= "Recycle" (:block/title ent))
                          (= "Recycle" (some-> ent :block/page :block/title))))
        ents (->> (d/q '[:find [?e ...]
                         :where
                         [?e :block/uuid]]
                       db)
                  (map (fn [e] (d/entity db e)))
                  (remove ignore-ent?))
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
           :when (and (not (ignore-ent? ent))
                      (nil? (:block/uuid ent)))]
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

(defn- seed-page-two-parents-child!
  []
  (let [conn (db/get-db test-db false)
        page-uuid (random-uuid)
        parent-a-uuid (random-uuid)
        parent-b-uuid (random-uuid)
        child-uuid (random-uuid)]
    (d/transact! conn
                 [{:db/ident :logseq.class/Page}
                  {:block/uuid page-uuid
                   :block/name "page"
                   :block/title "page"
                   :block/tags #{:logseq.class/Page}}
                  {:block/uuid parent-a-uuid
                   :block/title "parent-a"
                   :block/page [:block/uuid page-uuid]
                   :block/parent [:block/uuid page-uuid]}
                  {:block/uuid parent-b-uuid
                   :block/title "parent-b"
                   :block/page [:block/uuid page-uuid]
                   :block/parent [:block/uuid page-uuid]}
                  {:block/uuid child-uuid
                   :block/title "child"
                   :block/page [:block/uuid page-uuid]
                   :block/parent [:block/uuid parent-a-uuid]}]
                 {:outliner-op :insert-blocks
                  :local-tx? false})
    {:page-uuid page-uuid
     :parent-a-uuid parent-a-uuid
     :parent-b-uuid parent-b-uuid
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

(deftest single-op-apply-ops-preserves-local-tx-and-client-id-test
  (testing "single local outliner ops should reach listeners with local/client metadata intact"
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)
          tx-meta* (atom nil)]
      (d/listen! conn ::capture-tx-meta
                 (fn [{:keys [tx-meta]}]
                   (reset! tx-meta* tx-meta)))
      (try
        (outliner-op/apply-ops! conn
                                [[:save-block [{:block/uuid child-uuid
                                                :block/title "single-op-save"} {}]]]
                                {:client-id (:client-id @state/state)
                                 :local-tx? true})
        (is (= true (:local-tx? @tx-meta*)))
        (is (= (:client-id @state/state) (:client-id @tx-meta*)))
        (finally
          (d/unlisten! conn ::capture-tx-meta))))))

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

(deftest undo-insert-retracts-added-entity-cleanly-test
  (testing "undoing a local insert retracts the inserted entity instead of leaving a partial shell"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [page-uuid]} (seed-page-parent-child!)
          inserted-uuid (random-uuid)]
      (d/transact! conn
                   [{:block/uuid inserted-uuid
                     :block/title "inserted"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid page-uuid]}]
                   {:outliner-op :insert-blocks
                    :local-tx? true})
      (is (some? (d/entity @conn [:block/uuid inserted-uuid])))
      (let [undo-result (undo-redo/undo test-db)]
        (is (not= :frontend.undo-redo/empty-undo-stack undo-result))
        (is (nil? (d/entity @conn [:block/uuid inserted-uuid])))))))

(deftest repeated-save-block-content-undo-redo-test
  (testing "multiple saves on the same block undo and redo one step at a time"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (doseq [title ["v1" "v2" "v3"]]
        (d/transact! conn
                     [[:db/add [:block/uuid child-uuid] :block/title title]]
                     {:outliner-op :save-block
                      :local-tx? true}))
      (is (= "v3" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (undo-redo/undo test-db)
      (is (= "v2" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (undo-redo/undo test-db)
      (is (= "v1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (undo-redo/undo test-db)
      (is (= "child" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (undo-redo/redo test-db)
      (is (= "v1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (undo-redo/redo test-db)
      (is (= "v2" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (undo-redo/redo test-db)
      (is (= "v3" (:block/title (d/entity @conn [:block/uuid child-uuid])))))))

(deftest repeated-editor-save-block-content-undo-redo-test
  (testing "editor/save-block! records sequential content saves in order"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (doseq [title ["foo" "foo bar"]]
        (editor/save-block! test-db child-uuid title))
      (is (= "foo bar" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (undo-redo/undo test-db)
      (is (= "foo" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (undo-redo/redo test-db)
      (is (= "foo bar" (:block/title (d/entity @conn [:block/uuid child-uuid])))))))

(deftest editor-save-two-blocks-undo-targets-latest-block-test
  (testing "undo after saving two different blocks reverts the latest saved block first"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [parent-uuid child-uuid]} (seed-page-parent-child!)]
      (editor/save-block! test-db parent-uuid "parent updated")
      (editor/save-block! test-db child-uuid "child updated")
      (undo-redo/undo test-db)
      (is (= "parent updated" (:block/title (d/entity @conn [:block/uuid parent-uuid]))))
      (is (= "child" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (undo-redo/undo test-db)
      (is (= "parent" (:block/title (d/entity @conn [:block/uuid parent-uuid])))))))

(deftest new-local-save-clears-redo-stack-test
  (testing "a new local save clears redo history"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (editor/save-block! test-db child-uuid "v1")
      (editor/save-block! test-db child-uuid "v2")
      (undo-redo/undo test-db)
      (is (= "v1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (editor/save-block! test-db child-uuid "v3")
      (is (= :frontend.undo-redo/empty-redo-stack (undo-redo/redo test-db)))
      (is (= "v3" (:block/title (d/entity @conn [:block/uuid child-uuid])))))))

(deftest insert-save-delete-sequence-undo-redo-test
  (testing "insert then save then recycle-delete can be undone and redone in order"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [page-uuid]} (seed-page-parent-child!)
          inserted-uuid (random-uuid)
          recycle-title "Recycle"]
      (d/transact! conn
                   [{:block/uuid inserted-uuid
                     :block/title "draft"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid page-uuid]}]
                   {:outliner-op :insert-blocks
                    :local-tx? true})
      (d/transact! conn
                   [[:db/add [:block/uuid inserted-uuid] :block/title "published"]]
                   {:outliner-op :save-block
                    :local-tx? true})
      (outliner-core/delete-blocks! conn [(d/entity @conn [:block/uuid inserted-uuid])] {})
      (is (= recycle-title
             (:block/title (:block/page (d/entity @conn [:block/uuid inserted-uuid])))))
      (undo-redo/undo test-db)
      (let [restored (d/entity @conn [:block/uuid inserted-uuid])]
        (is (= page-uuid (:block/uuid (:block/page restored))))
        (is (= "published" (:block/title restored))))
      (undo-redo/undo test-db)
      (is (= "draft" (:block/title (d/entity @conn [:block/uuid inserted-uuid]))))
      (undo-redo/undo test-db)
      (is (nil? (d/entity @conn [:block/uuid inserted-uuid])))
      (undo-redo/redo test-db)
      (is (= "draft" (:block/title (d/entity @conn [:block/uuid inserted-uuid]))))
      (undo-redo/redo test-db)
      (is (= "published" (:block/title (d/entity @conn [:block/uuid inserted-uuid]))))
      (undo-redo/redo test-db)
      (is (= recycle-title
             (:block/title (:block/page (d/entity @conn [:block/uuid inserted-uuid]))))))))

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

(deftest undo-redo-works-for-recycle-delete-test
  (testing "undo restores a recycled delete and redo sends it back to recycle"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid page-uuid]} (seed-page-parent-child!)
          recycle-page-title "Recycle"]
      (outliner-core/delete-blocks! conn [(d/entity @conn [:block/uuid child-uuid])] {})
      (let [deleted-child (d/entity @conn [:block/uuid child-uuid])]
        (is (integer? (:logseq.property/deleted-at deleted-child)))
        (is (= recycle-page-title (:block/title (:block/page deleted-child)))))
      (let [undo-result (undo-redo/undo test-db)
            restored-child (d/entity @conn [:block/uuid child-uuid])]
        (is (not= :frontend.undo-redo/empty-undo-stack undo-result))
        (is (= page-uuid (:block/uuid (:block/page restored-child))))
        (is (nil? (:logseq.property/deleted-at restored-child))))
      (let [redo-result (undo-redo/redo test-db)
            recycled-child (d/entity @conn [:block/uuid child-uuid])]
        (is (not= :frontend.undo-redo/empty-redo-stack redo-result))
        (is (= recycle-page-title (:block/title (:block/page recycled-child))))
        (is (integer? (:logseq.property/deleted-at recycled-child)))))))

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

(deftest undo-validation-rejects-invalid-recycle-restore-tx-test
  (testing "recycle-shaped undo tx still validates resulting structure"
    (let [conn (db/get-db test-db false)
          page-uuid (random-uuid)
          block-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/ident :logseq.class/Page}
                    {:block/uuid page-uuid
                     :block/name "page"
                     :block/title "page"
                     :block/tags #{:logseq.class/Page}}
                    {:db/id 1000
                     :block/uuid block-uuid
                     :block/title "bad-block"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid page-uuid]
                     :logseq.property/deleted-at 1
                     :logseq.property.recycle/original-page [:block/uuid page-uuid]
                     :logseq.property.recycle/original-parent [:block/uuid page-uuid]
                     :logseq.property.recycle/original-order "aj"}]
                   {:local-tx? false})
      ;; Simulate a broken recycled block shell like the runtime repro: entity has
      ;; structural attrs but no title/uuid dispatch attrs after sync churn.
      (d/transact! conn
                   [[:db/retract 1000 :block/uuid block-uuid]
                    [:db/retract 1000 :block/title "bad-block"]]
                   {:local-tx? false})
      (is (false? (undo-validate/valid-undo-redo-tx?
                   conn
                   [[:db/retract 1000 :logseq.property.recycle/original-order "aj"]
                    [:db/retract 1000 :logseq.property/deleted-at 1]
                    [:db/add 1000 :block/parent [:block/uuid page-uuid]]
                    [:db/retract 1000 :logseq.property.recycle/original-page [:block/uuid page-uuid]]
                    [:db/retract 1000 :logseq.property.recycle/original-parent [:block/uuid page-uuid]]
                    [:db/add 1000 :block/order "aj"]
                    [:db/add 1000 :block/page [:block/uuid page-uuid]]]))))))

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

(deftest undo-skips-conflicted-move-and-keeps-earlier-history-test
  (testing "undo skips a conflicting move and continues to earlier safe history"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [parent-a-uuid parent-b-uuid child-uuid]} (seed-page-two-parents-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "local-title"]]
                   {:outliner-op :save-block
                    :local-tx? true})
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/parent [:block/uuid parent-b-uuid]]]
                   {:outliner-op :move-blocks
                    :local-tx? true})
      (d/transact! conn
                   (:tx-data (outliner-core/delete-blocks @conn [(d/entity @conn [:block/uuid parent-a-uuid])] {}))
                   {:outliner-op :delete-blocks
                    :local-tx? false})
      (let [undo-result (undo-redo/undo test-db)
            child (d/entity @conn [:block/uuid child-uuid])]
        (is (map? undo-result))
        (is (= "child" (:block/title child)))
        (is (= parent-b-uuid
               (:block/uuid (:block/parent child))))
        (is (empty? (db-issues @conn)))))))

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

(deftest redo-builds-reversed-tx-when-target-parent-is-recycled-test
  (testing "redo still builds reversed tx from raw datoms when target parent was recycled remotely"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid parent-a-uuid parent-b-uuid]} (seed-page-two-parents-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/parent [:block/uuid parent-b-uuid]]]
                   {:outliner-op :move-blocks
                    :local-tx? true})
      (undo-redo/undo test-db)
      (d/transact! conn
                   (:tx-data (outliner-core/delete-blocks @conn [(d/entity @conn [:block/uuid parent-b-uuid])] {}))
                   {:outliner-op :delete-blocks
                    :local-tx? false})
      (let [redo-op (last (get @undo-redo/*redo-ops test-db))
            data (some #(when (= ::undo-redo/db-transact (first %))
                          (second %))
                       redo-op)
            reversed (undo-redo/get-reversed-datoms conn false data (:tx-meta data))]
        (is (seq reversed))
        (is (= parent-a-uuid
               (:block/uuid (:block/parent (d/entity @conn [:block/uuid child-uuid])))))))))

(deftest undo-skips-move-when-original-parent-is-recycled-test
  (testing "undo should skip a move whose original parent has been recycled"
    (undo-redo/clear-history! test-db)
    (let [conn (db/get-db test-db false)
          {:keys [child-uuid parent-a-uuid parent-b-uuid]} (seed-page-two-parents-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/parent [:block/uuid parent-b-uuid]]]
                   {:outliner-op :move-blocks
                    :local-tx? true})
      (d/transact! conn
                   (:tx-data (outliner-core/delete-blocks @conn [(d/entity @conn [:block/uuid parent-a-uuid])] {}))
                   {:outliner-op :delete-blocks
                    :local-tx? false})
      (let [parent-a (d/entity @conn [:block/uuid parent-a-uuid])
            _ (is (some? parent-a))
            _ (is (true? (ldb/recycled? parent-a)))
            undo-op (last (get @undo-redo/*undo-ops test-db))
            data (some #(when (= ::undo-redo/db-transact (first %))
                          (second %))
                       undo-op)
            conflicted? (#'undo-redo/reversed-structural-target-conflicted?
                         conn
                         (->> (:tx-data data) reverse (group-by :e))
                         true)
            reversed (undo-redo/get-reversed-datoms conn true data (:tx-meta data))]
        (is (true? conflicted?))
        (is (nil? reversed))))))

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
