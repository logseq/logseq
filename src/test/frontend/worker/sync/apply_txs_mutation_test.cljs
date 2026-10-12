(ns frontend.worker.sync.apply-txs-mutation-test
  (:require [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.asset-db-listener :as asset-db-listener]
            [frontend.worker.sync.assets :as sync-assets]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.large-title :as sync-large-title]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.op.construct :as op-construct]
            [logseq.outliner.page :as outliner-page]
            [promesa.core :as p]))

(def ^:private inline-history-action @#'sync-apply/inline-history-action)
(def ^:private block-ref? @#'sync-apply/block-ref?)
(def ^:private expand-block-retracts-to-descendants @#'sync-apply/expand-block-retracts-to-descendants)
(def ^:private reverse-history-action! @#'sync-apply/reverse-history-action!)
(def ^:private replace-uuid-str-with-eid @#'sync-apply/replace-uuid-str-with-eid)
(def ^:private ref-attr? @#'sync-apply/ref-attr?)
(def ^:private tx-item-components @#'sync-apply/tx-item-components)
(def ^:private tx-entity-uuid @#'sync-apply/tx-entity-uuid)
(def ^:private tx-item-created-block-uuid-entry @#'sync-apply/tx-item-created-block-uuid-entry)
(def ^:private remote-sync-conflicts @#'sync-apply/remote-sync-conflicts)
(def ^:private expected-stale-rebase-error? @#'sync-apply/expected-stale-rebase-error?)
(def ^:private replay-entity-id-value @#'sync-apply/replay-entity-id-value)
(def ^:private rebase-target-ref @#'sync-apply/rebase-target-ref)
(def ^:private template-parent-ref @#'sync-apply/template-parent-ref)
(def ^:private sanitize-template-block @#'sync-apply/sanitize-template-block)
(def ^:private replay-canonical-outliner-op! @#'sync-apply/replay-canonical-outliner-op!)
(def ^:private apply-remote-txs-with-retry! @#'sync-apply/apply-remote-txs-with-retry!)
(def ^:private enqueue-local-tx-aux @#'sync-apply/enqueue-local-tx-aux)
(def ^:private <upload-aes-key @#'sync-apply/<upload-aes-key)
(def ^:private <upload-pending-batch! @#'sync-apply/<upload-pending-batch!)
(def ^:private persist-local-tx! @#'sync-apply/persist-local-tx!)
(def ^:private log-outliner-op-perf! @#'sync-apply/log-outliner-op-perf!)

(def ^:private outliner-op->string @#'sync-apply/outliner-op->string)
(def ^:private normalize-tx-data-for-rebase @#'sync-apply/normalize-tx-data-for-rebase)
(def ^:private inferred-outliner-ops? @#'sync-apply/inferred-outliner-ops?)
(def ^:private apply-tx-meta @#'sync-apply/apply-tx-meta)
(def ^:private perf-time-ms @#'sync-apply/perf-time-ms)
(def ^:private broadcast-rtc-state! @#'sync-apply/broadcast-rtc-state!)
(def ^:private tx-item-block-uuid @#'sync-apply/tx-item-block-uuid)
(def ^:private tx-item-retract? @#'sync-apply/tx-item-retract?)
(def ^:private tx-item-retract-entity-block-uuid @#'sync-apply/tx-item-retract-entity-block-uuid)
(def ^:private drop-local-reversal-stale-target-ops @#'sync-apply/drop-local-reversal-stale-target-ops)
(def ^:private upload-tempid? @#'sync-apply/upload-tempid?)
(def ^:private cardinality-many-attr? @#'sync-apply/cardinality-many-attr?)
(def ^:private upload-replaced-values @#'sync-apply/upload-replaced-values)
(def ^:private upload-tx-item-group-keys @#'sync-apply/upload-tx-item-group-keys)
(def ^:private merge-upload-tx-ranges @#'sync-apply/merge-upload-tx-ranges)
(def ^:private upload-group-range-by-start @#'sync-apply/upload-group-range-by-start)
(def ^:private clear-large-upload-progress! @#'sync-apply/clear-large-upload-progress!)
(def ^:private large-upload-request-entry @#'sync-apply/large-upload-request-entry)
(def ^:private cap-upload-request-tx-entries @#'sync-apply/cap-upload-request-tx-entries)
(def ^:private *repo->large-upload-progress @#'sync-apply/*repo->large-upload-progress)
(def ^:private transact-remote-txs! @#'sync-apply/transact-remote-txs!)
(def ^:private rebase-local-op! @#'sync-apply/rebase-local-op!)
(def ^:private apply-remote-tx-with-local-changes! @#'sync-apply/apply-remote-tx-with-local-changes!)

;; Fails if, in `outliner-op->string`, `some?` becomes `nil?`.
(deftest outliner-op->string-test
  (is (= "x" (outliner-op->string :x)))
  (is (= "abc" (outliner-op->string "abc")))
  (is (nil? (outliner-op->string nil))))

;; Fails if, in `offload-large-titles`, `or` becomes `and`.
(deftest offload-large-titles-uses-given-upload-fn-test
  (let [captured (atom nil)
        upload-fn (fn [& _] nil)]
    (with-redefs [sync-large-title/offload-large-titles
                  (fn [_tx-data opts] (reset! captured opts) :ok)]
      (is (= :ok (sync-apply/offload-large-titles [] {:upload-fn upload-fn})))
      (is (identical? upload-fn (:upload-fn @captured)))
      (sync-apply/offload-large-titles [] {})
      (is (fn? (:upload-fn @captured))))))

;; Fails if, in `rehydrate-large-titles!`, `or` becomes `and`.
(deftest rehydrate-large-titles-uses-given-download-fn-test
  (let [captured (atom nil)
        download-fn (fn [& _] nil)]
    (with-redefs [sync-large-title/rehydrate-large-titles!
                  (fn [_repo opts] (reset! captured opts) :ok)]
      (is (= :ok (sync-apply/rehydrate-large-titles! "r" {:download-fn download-fn})))
      (is (identical? download-fn (:download-fn @captured)))
      (sync-apply/rehydrate-large-titles! "r" {})
      (is (fn? (:download-fn @captured))))))

;; Fails if, in `broadcast-rtc-state!`, `when` becomes `when-not`.
(deftest broadcast-rtc-state-skips-nil-client-test
  (let [calls (atom [])]
    (with-redefs [shared-service/broadcast-to-clients! (fn [& args] (swap! calls conj args))]
      (broadcast-rtc-state! nil)
      (is (empty? @calls)))))

;; Fails if, in `normalize-tx-data-for-rebase`, `if` becomes `if-not`, `and` becomes `or` or `=` becomes `not=`.
(deftest normalize-tx-data-for-rebase-test
  (is (= [[:db/add 1 :a 2] [:db/add 1 :b 3]]
         (normalize-tx-data-for-rebase [[:db/add 1 :a 2 100]
                                        [:db/add 1 :b 3]])))
  (testing "short vectors and maps are kept as they are"
    (is (= [[:db/add 1 :a]] (normalize-tx-data-for-rebase [[:db/add 1 :a]])))
    (let [m {:a 1 :b 2 :c 3 :d 4 :e 5}]
      (is (= [m] (normalize-tx-data-for-rebase [m]))))))

;; Fails if, in `inferred-outliner-ops?`, `and` becomes `or`, `nil?` becomes `some?`, `not` becomes `identity` or `not=` becomes `=`.
(deftest inferred-outliner-ops?-test
  (is (true? (inferred-outliner-ops? {})))
  (is (false? (boolean (inferred-outliner-ops? {:outliner-ops [1]}))))
  (is (false? (boolean (inferred-outliner-ops? {:undo? true}))))
  (is (false? (boolean (inferred-outliner-ops? {:redo? true}))))
  (is (false? (boolean (inferred-outliner-ops? {:outliner-op :batch-import-edn}))))
  (is (true? (boolean (inferred-outliner-ops? {:outliner-op :save-block})))))

;; Fails if, in `apply-tx-meta`, `=` becomes `not=`.
(deftest apply-tx-meta-test
  (is (= {:transact-remote? true :persist-op? false :t 5
          :outliner-op :db-migrate :db-migrate? true :skip-validate-db? true}
         (apply-tx-meta {:t 5 :outliner-op :db-migrate})))
  (is (= {:transact-remote? true :persist-op? false :t 5 :outliner-op :save-block}
         (apply-tx-meta {:t 5 :outliner-op :save-block})))
  (is (= {:transact-remote? true :persist-op? false :t 5}
         (apply-tx-meta {:t 5}))))

;; Fails if, in `perf-time-ms`, `if` becomes `if-not` or `and` becomes `or`.
(deftest perf-time-ms-test
  (let [orig (.-now js/performance)]
    (try
      (set! (.-now js/performance) (fn [] 12345.5))
      (is (= 12345.5 (perf-time-ms)))
      (set! (.-now js/performance) nil)
      (let [t (perf-time-ms)]
        (is (number? t))
        (is (> t 1.0e12)))
      (finally
        (set! (.-now js/performance) orig)))))

;; Fails if, in `tx-item-block-uuid`, `=` becomes `not=` or `first` becomes `last`.
(deftest tx-item-block-uuid-test
  (let [u (random-uuid)]
    (is (= u (tx-item-block-uuid nil u)))
    (is (= u (tx-item-block-uuid nil [:block/uuid u])))
    (is (nil? (tx-item-block-uuid nil [:other/attr u])))))

;; Fails if, in `tx-item-retract?`, `=` becomes `not=` or `first` becomes `last`.
(deftest tx-item-retract?-test
  (is (true? (tx-item-retract? [:db/retract 1 :a 2])))
  (is (false? (tx-item-retract? [:db/add 1 :a 2])))
  (is (true? (tx-item-retract? {:added false})))
  (is (false? (tx-item-retract? {:added true}))))

;; Fails if, in `tx-item-retract-entity-block-uuid`, `when` becomes `when-not`, `and` becomes `or` or `first` becomes `last`.
(deftest tx-item-retract-entity-block-uuid-test
  (let [u (random-uuid)]
    (is (= u (tx-item-retract-entity-block-uuid [:db/retractEntity [:block/uuid u]])))
    (is (= u (tx-item-retract-entity-block-uuid [:db.fn/retractEntity [:block/uuid u]])))
    (is (nil? (tx-item-retract-entity-block-uuid [:db/add [:block/uuid u] :a 1])))
    (is (nil? (tx-item-retract-entity-block-uuid {:e 1})))))

;; Fails if, in `drop-local-reversal-stale-target-ops`, `and` becomes `or` or `=` becomes `not=`.
(deftest drop-local-reversal-stale-target-ops-test
  (let [u (random-uuid)
        schema {:block/uuid {:db/unique :db.unique/identity}}
        db-before (d/db-with (d/empty-db schema) [{:db/id 1 :block/uuid u}])
        db-after (d/db-with (d/empty-db schema) [{:db/id 1 :block/title "x"}])
        stale [:db/add 1 :block/title "y"]
        recreate [:db/add 1 :block/uuid u]]
    (is (= [] (vec (drop-local-reversal-stale-target-ops db-before db-after [stale]))))
    (is (= [stale recreate]
           (vec (drop-local-reversal-stale-target-ops db-before db-after [stale recreate]))))))

;; Fails if, in `upload-tempid?`, `and` becomes `or`.
(deftest upload-tempid?-test
  (is (true? (upload-tempid? -1)))
  (is (true? (upload-tempid? "a")))
  (is (false? (boolean (upload-tempid? 5))))
  (is (false? (boolean (upload-tempid? -1.5)))))

;; Fails if, in `cardinality-many-attr?`, `or` becomes `and`.
(deftest cardinality-many-attr?-test
  (let [db (d/empty-db {:a {:db/cardinality :db.cardinality/many}})]
    (is (true? (cardinality-many-attr? db :a)))
    (is (false? (cardinality-many-attr? db :b)))))

;; Fails if, in `upload-replaced-values`, `and` becomes `or`.
(deftest upload-replaced-values-test
  (is (= #{[5 :a]}
         (upload-replaced-values nil [[:db/retract -1 :a 1]
                                      [:db/retract 5 :a 1]
                                      [:db/add 6 :a 1]]))))

;; Fails if, in `upload-tx-item-group-keys`, `and` becomes `or`, `first` becomes `last` or `=` becomes `not=`.
(deftest upload-tx-item-group-keys-test
  (is (= #{} (upload-tx-item-group-keys nil #{} {:db/id 5 :a 1})))
  (is (= #{-1} (upload-tx-item-group-keys nil #{} {:db/id -1 :a 1})))
  (is (= #{-1} (upload-tx-item-group-keys nil #{} [:db/retractEntity -1])))
  (is (= #{-1} (upload-tx-item-group-keys nil #{} [:db.fn/retractEntity -1])))
  (is (= #{} (upload-tx-item-group-keys nil #{} [:db/retractEntity -1 :extra]))))

;; Fails if, in `merge-upload-tx-ranges`, `<=` becomes `<`.
(deftest merge-upload-tx-ranges-test
  (is (= [[0 2]] (merge-upload-tx-ranges [[1 2] [0 1]])))
  (is (= [[0 1] [3 4]] (merge-upload-tx-ranges [[3 4] [0 1]]))))

;; Fails if, in `upload-tempid?`, `and` becomes `or`.
(deftest upload-group-range-by-start-test
  (is (= {0 2} (upload-group-range-by-start
                nil [[:db/add -1 :a 1] [:db/add -1 :b 2] [:db/add -1 :c 3]])))
  (is (= {0 1 3 4}
         (upload-group-range-by-start
          nil [[:db/add -1 :a 1] [:db/add -1 :b 2] [:db/add 7 :a 1]
               [:db/add -2 :a 1] [:db/add -2 :b 2]]))))

;; Fails if, in `clear-large-upload-progress!`, `when` becomes `when-not`.
(deftest clear-large-upload-progress!-test
  (let [prev @*repo->large-upload-progress]
    (try
      (reset! *repo->large-upload-progress {["r" 1] 10 ["r" 2] 20})
      (clear-large-upload-progress! "r" [1 nil])
      (is (= {["r" 2] 20} @*repo->large-upload-progress))
      (finally
        (reset! *repo->large-upload-progress prev)))))

;; Fails if, in `large-upload-request-entry`, `<` becomes `<=`.
(deftest large-upload-request-entry-restarts-when-progress-reached-total-test
  (let [prev @*repo->large-upload-progress
        tx-data (mapv (fn [i] [:db/add 1 :a i]) (range 3))]
    (try
      (reset! *repo->large-upload-progress {["r" :tx] 3})
      (let [entry (large-upload-request-entry "r" nil {:tx-id :tx :tx-data tx-data})]
        (is (= 3 (count (:tx-data entry))))
        (is (= 3 (:large-upload-next-index entry)))
        (is (true? (:large-upload-final? entry))))
      (finally
        (reset! *repo->large-upload-progress prev)))))

;; Fails if, in `cap-upload-request-tx-entries`, `first` becomes `last`, `and` becomes `or` or `>` becomes `>=`.
(deftest cap-upload-request-tx-entries-test
  (let [entry (fn [id n] {:tx-id id :tx-data (mapv (fn [i] [:db/add 1 :a i]) (range n))})
        small-1 (entry 1 2)
        small-2 (entry 2 3)
        exact (entry 3 5000)
        half-1 (entry 4 2500)
        half-2 (entry 5 2500)]
    (let [summary (fn [entries]
                    (mapv (fn [e] [(:tx-id e) (count (:tx-data e)) (contains? e :large-upload-final?)])
                          entries))]
      (is (= [[1 2 false] [2 3 false]] (summary (cap-upload-request-tx-entries "r" nil [small-1 small-2]))))
      (is (= [[3 5000 false]] (summary (cap-upload-request-tx-entries "r" nil [exact]))))
      (is (= [[4 2500 false] [5 2500 false]]
             (summary (cap-upload-request-tx-entries "r" nil [half-1 half-2]))))
      (is (= [[4 2500 false]]
             (summary (cap-upload-request-tx-entries "r" nil [half-1 (entry 6 2501)])))))))

(defn- capture-logs
  "Run f and return the pr-str of every log record emitted meanwhile."
  [f]
  (let [records (atom [])
        handler (fn [record] (swap! records conj (pr-str record)))]
    (log/set-levels {:glogi/root :all})
    (log/add-handler handler)
    (try
      (f)
      (finally
        (log/remove-handler handler)))
    @records))

(defn- logged? [records event-name]
  (boolean (some #(.includes ^string % event-name) records)))

;; Fails if, in `inline-history-action`, `and` becomes `or`.
(deftest inline-history-action-test
  (is (= {:outliner-op :x :forward-outliner-ops [[:a]] :inverse-outliner-ops [[:b]]}
         (inline-history-action {:outliner-op :x
                                 :db-sync/forward-outliner-ops [[:a]]
                                 :db-sync/inverse-outliner-ops [[:b]]})))
  (is (nil? (inline-history-action {:db-sync/forward-outliner-ops [[:a]]})))
  (is (nil? (inline-history-action {:inverse-outliner-ops [[:b]]}))))

;; Fails if, in `block-ref?`, `and` becomes `or`.
(deftest block-ref?-test
  (let [u (random-uuid)]
    (is (true? (block-ref? 5)))
    (is (true? (boolean (block-ref? [:block/uuid u]))))
    (is (false? (boolean (block-ref? [:other u]))))
    (is (false? (boolean (block-ref? "x"))))))

;; Fails if, in `expand-block-retracts-to-descendants`, `when` becomes `when-not` or `and` becomes `or`.
(deftest expand-block-retracts-to-descendants-test
  (let [u1 (random-uuid)
        u2 (random-uuid)
        db (d/db-with (d/empty-db {:block/uuid {:db/unique :db.unique/identity}
                                   :block/parent {:db/valueType :db.type/ref}})
                      [{:db/id 1 :block/uuid u1}
                       {:db/id 2 :block/uuid u2 :block/parent 1}])
        r1 [:db/retractEntity [:block/uuid u1]]
        r2 [:db/retractEntity [:block/uuid u2]]]
    (is (= [r2 r1] (vec (expand-block-retracts-to-descendants db [r1]))))
    (is (= [r1 r2] (vec (expand-block-retracts-to-descendants db [r1 r2]))))
    (is (= [[:db/add 2 :block/title "x"] r2 r1]
           (vec (expand-block-retracts-to-descendants db [[:db/add 2 :block/title "x"] r1]))))))

;; Fails if, in `reverse-history-action!`, `when-not` becomes `when` or `=` becomes `not=`.
(deftest reverse-history-action!-test
  (is (nil? (reverse-history-action! nil {:outliner-op :fix})))
  (is (= :missing-reversed-tx-data
         (try
           (reverse-history-action! nil {:outliner-op :save-block :tx-id 1})
           nil
           (catch :default e (:reason (ex-data e)))))))

;; Fails if, in `ref-attr?`, `or` becomes `and`.
(deftest ref-attr?-test
  (let [db (d/empty-db {:a {:db/valueType :db.type/ref}})]
    (is (true? (ref-attr? db :a)))
    (is (false? (ref-attr? db :b)))))

;; Fails if, in `tx-item-components`, `and` becomes `or`.
(deftest tx-item-components-test
  (is (= {:op :db/add :e 1 :a :block/title :v "x"}
         (tx-item-components [:db/add 1 :block/title "x"])))
  (is (= {:op :db/retract :e 1 :a :block/title :v "x"}
         (tx-item-components [:db/retract 1 :block/title "x"])))
  (is (nil? (tx-item-components [:db/add 1 :block/title])))
  (is (nil? (tx-item-components {:e 1 :a :block/title :v "x" :added true})))
  (is (nil? (tx-item-components [:db/add 1 :other "x"])))
  (is (nil? (tx-item-components [:db/cas 1 :block/title "x"]))))

;; Fails if, in `tx-entity-uuid`, `and` becomes `or`, `=` becomes `not=` or `first` becomes `last`.
(deftest tx-entity-uuid-test
  (let [u (random-uuid)
        u2 (random-uuid)
        db (d/db-with (d/empty-db) [{:db/id 7 :block/uuid u2}])]
    (is (= u (tx-entity-uuid nil {} u)))
    (is (= u (tx-entity-uuid nil {} (str u))))
    (is (= u (tx-entity-uuid nil {} [:block/uuid u])))
    (is (= u (tx-entity-uuid nil {5 u} 5)))
    (is (= u2 (tx-entity-uuid db {5 u} 7)))
    (is (= u2 (tx-entity-uuid db {} 7)))
    (testing "a string that is not a uuid string is not read as a uuid"
      (is (not (uuid? (try (tx-entity-uuid db {} "abc") (catch :default e e))))))))

;; Fails if, in `tx-item-created-block-uuid-entry`, `and` becomes `or` or `not` becomes `identity`.
(deftest tx-item-created-block-uuid-entry-test
  (let [u (random-uuid)]
    (is (= [5 u] (tx-item-created-block-uuid-entry [:db/add 5 :block/uuid u])))
    (is (= ["tmp" u] (tx-item-created-block-uuid-entry [:db/add "tmp" :block/uuid u])))
    (is (= [5 u] (tx-item-created-block-uuid-entry {:e 5 :a :block/uuid :v u :added true})))
    (is (nil? (tx-item-created-block-uuid-entry [:db/retract 5 :block/uuid u])))
    (is (nil? (tx-item-created-block-uuid-entry {:e 5 :a :block/uuid :v u :added false})))
    (is (nil? (tx-item-created-block-uuid-entry [:db/add :kw :block/uuid u])))))

;; Fails if, in `remote-sync-conflicts`, `and` becomes `or`.
(deftest remote-sync-conflicts-test
  (let [u (random-uuid)
        u2 (random-uuid)
        db (d/db-with (d/empty-db {:block/uuid {:db/unique :db.unique/identity}})
                      [{:block/uuid u :block/title "cur"}
                       {:block/uuid u2 :block/title "q"}])
        local-txs [{:tx [[:db/add [:block/uuid u] :block/title "local"]]}]
        remote (fn [item] [{:t 7 :tx-data [item]}])]
    (is (= [{:block-uuid u :attr :block/title :value "remote" :remote-t 7}]
           (remote-sync-conflicts db local-txs (remote [:db/add [:block/uuid u] :block/title "remote"]))))
    (testing "only string adds conflict"
      (is (= [] (remote-sync-conflicts db local-txs (remote [:db/retract [:block/uuid u] :block/title "old"]))))
      (is (= [] (remote-sync-conflicts db local-txs (remote [:db/add [:block/uuid u] :block/title 5])))))
    (testing "only blocks with local title edits conflict"
      (is (= [] (remote-sync-conflicts db local-txs (remote [:db/add [:block/uuid u2] :block/title "z"])))))
    (testing "the same value is no conflict"
      (is (= [] (remote-sync-conflicts db local-txs (remote [:db/add [:block/uuid u] :block/title "cur"])))))))

;; Fails if, in `expected-stale-rebase-error?`, `and` becomes `or`.
(deftest expected-stale-rebase-error?-test
  (is (true? (boolean (expected-stale-rebase-error? (ex-info "invalid rebase op" {})))))
  (is (true? (boolean (expected-stale-rebase-error? (ex-info "x" {:error :entity-id/missing})))))
  (is (true? (boolean (expected-stale-rebase-error?
                       (ex-info "x" {:error :transact/unique :attribute :block/uuid})))))
  (is (false? (boolean (expected-stale-rebase-error?
                        (ex-info "x" {:error :transact/unique :attribute :other})))))
  (is (false? (boolean (expected-stale-rebase-error?
                        (ex-info "x" {:error :other :attribute :block/uuid}))))))

;; Fails if, in `replay-entity-id-value`, `or` becomes `and`.
(deftest replay-entity-id-value-test
  (let [u (random-uuid)
        db (d/db-with (d/empty-db {:block/uuid {:db/unique :db.unique/identity}})
                      [{:db/id 3 :block/uuid u}])]
    (is (= 5 (replay-entity-id-value db 5)))
    (is (= 3 (replay-entity-id-value db u)))
    (is (= 3 (replay-entity-id-value db [:block/uuid u])))
    (is (= "x" (replay-entity-id-value db "x")))))

;; Fails if, in `rebase-target-ref`, `and` becomes `or`.
;; Fails if, in `template-parent-ref`, `and` becomes `or`.
(deftest rebase-target-and-template-parent-ref-test
  (let [u (random-uuid)]
    (doseq [f [rebase-target-ref template-parent-ref]]
      (is (= [:block/uuid u] (f [:block/uuid u])))
      (is (= [:block/uuid u] (f u)))
      (is (= [:block/uuid u] (f {:block/uuid u :a 1})))
      (is (= {:a 1} (f {:a 1})))
      (is (= 5 (f 5))))))

;; Fails if, in `sanitize-template-block`, `or` becomes `and` or `when` becomes `when-not`.
(deftest sanitize-template-block-test
  (let [u1 (random-uuid)
        u2 (random-uuid)
        db (d/db-with (d/empty-db) [{:db/id 5 :block/uuid u2}])]
    (is (= u1 (:block/uuid (sanitize-template-block db nil {:db/id 5 :block/uuid u1 :block/title "t"}))))
    (is (= u2 (:block/uuid (sanitize-template-block db nil {:db/id 5 :block/title "t"}))))
    (is (= u2 (:block/uuid (sanitize-template-block nil db {:db/id 5 :block/title "t"}))))
    (is (= u1 (:block/uuid (sanitize-template-block db nil {:db/id [:block/uuid u1] :block/title "t"}))))))

(defn- replay-error-reason
  [conn op]
  (try
    (replay-canonical-outliner-op! conn op nil)
    nil
    (catch :default e (:reason (ex-data e)))))

;; Fails if, in `replay-canonical-outliner-op!`, `and` becomes `or`.
(deftest replay-apply-template-rejects-missing-template-or-target-test
  (let [tu (random-uuid)
        conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}})]
    (d/transact! conn [{:db/id 10 :foo 1} {:db/id 11 :block/uuid tu :block/title "t"}])
    (is (= :missing-template-or-target-block
           (replay-error-reason conn [:apply-template [(random-uuid) [:block/uuid tu] {}]])))
    (is (= :missing-template-or-target-uuid
           (replay-error-reason conn [:apply-template [10 [:block/uuid tu] {}]])))))

;; Fails if, in `apply-remote-txs-with-retry!`, `<` becomes `<=` or `inc` becomes `dec`.
(deftest apply-remote-txs-with-retry-count-test
  (let [orig sync-apply/apply-remote-txs!
        calls (atom [])
        run (fn [retry-count]
              (reset! calls [])
              (set! sync-apply/apply-remote-txs!
                    (fn [_repo _client _txs n] (swap! calls conj n) (p/resolved :done)))
              (with-redefs [client-op/get-pending-local-txs (fn [& _] [{:tx-id 2}])]
                (apply-remote-txs-with-retry!
                 {:repo "r" :client {:inflight (atom [])} :has-local-changes? false
                  :remote-txs [] :local-txs [{:tx-id 1}] :remote-tx-data []
                  :apply-context {:repo "r" :conn nil :local-txs [{:tx-id 1}] :remote-txs []}
                  :snapshot-retry-count retry-count})))]
    (async done
      (-> (p/let [_ (run 1)
                  _ (is (= [2] @calls))
                  _ (run 3)
                  _ (is (= [0] @calls))]
            nil)
          (p/catch (fn [e] (is false (str e))))
          (p/finally (fn []
                       (set! sync-apply/apply-remote-txs! orig)
                       (done)))))))

(defn- local-tx-report
  []
  (let [db-before (d/empty-db {:block/uuid {:db/unique :db.unique/identity}})
        {:keys [db-after tx-data]} (d/with db-before [{:db/id 1 :block/uuid (random-uuid) :block/title "x"}])]
    {:db-before db-before :db-after db-after :tx-data tx-data :tx-meta {}}))

;; Fails if, in `enqueue-local-tx-aux`, `when` becomes `when-not` or `=` becomes `not=`.
;; Fails if, in `enqueue-local-tx!`, `not=` becomes `=`.
(deftest enqueue-local-tx-flushes-only-for-the-client-repo-test
  (let [prev @worker-state/*db-sync-client
        flushes (atom [])]
    (try
      (with-redefs [worker-state/get-datascript-conn (constantly :conn)
                    sync-apply/enqueue-flush-pending! (fn [repo client] (swap! flushes conj [repo (:repo client)]))]
        (reset! worker-state/*db-sync-client {:repo "r"})
        (enqueue-local-tx-aux "r" (local-tx-report))
        (is (= [["r" "r"]] @flushes))
        (reset! flushes [])
        (enqueue-local-tx-aux "other" (local-tx-report))
        (is (= [] @flushes))
        (testing "a batch report that is not a rebase is not enqueued"
          (sync-apply/enqueue-local-tx! "r" (assoc (local-tx-report) :tx-meta {:batch-tx-report? true :outliner-op :save-block}))
          (is (= [] @flushes)))
        (testing "a rebased batch report is enqueued"
          (sync-apply/enqueue-local-tx! "r" (assoc (local-tx-report) :tx-meta {:batch-tx-report? true
                                                                            :outliner-op :rebase
                                                                            :db-sync/rebased-local? true}))
          (is (= [["r" "r"]] @flushes))))
      (finally
        (reset! worker-state/*db-sync-client prev)))))

;; Fails if, in `handle-local-tx!`, `and` becomes `or`, `when` becomes `when-not` or `=` becomes `not=`.
(deftest handle-local-tx!-test
  (let [prev @worker-state/*db-sync-client
        enqueued (atom 0)
        asset-syncs (atom 0)
        db-after (fn [remote?]
                   (d/db-with (d/empty-db {:db/ident {:db/unique :db.unique/identity}})
                              [{:db/ident :logseq.kv/graph-remote? :kv/value remote?}]))
        report (fn [tx-data tx-meta remote?]
                 {:tx-data tx-data :tx-meta tx-meta :db-before nil :db-after (db-after remote?)})]
    (try
      (with-redefs [sync-apply/enqueue-local-tx! (fn [& _] (swap! enqueued inc))
                    asset-db-listener/generate-asset-ops (fn [& _] nil)
                    sync-assets/enqueue-asset-sync! (fn [& _] (swap! asset-syncs inc))]
        (reset! worker-state/*db-sync-client {:repo "r"})
        (testing "no tx-data: nothing happens"
          (sync-apply/handle-local-tx! "r" (report [] {} true))
          (is (= [0 0] [@enqueued @asset-syncs])))
        (testing "a remote tx is not persisted"
          (sync-apply/handle-local-tx! "r" (report [1] {:rtc-tx? true} true))
          (is (= [0 0] [@enqueued @asset-syncs])))
        (testing "local tx on the client repo of a remote graph"
          (sync-apply/handle-local-tx! "r" (report [1] {} true))
          (is (= [1 1] [@enqueued @asset-syncs])))
        (testing "another repo does not enqueue asset sync"
          (sync-apply/handle-local-tx! "other" (report [1] {} true))
          (is (= [2 1] [@enqueued @asset-syncs])))
        (testing "a graph that is not remote does not enqueue asset sync"
          (sync-apply/handle-local-tx! "r" (report [1] {} false))
          (is (= [3 1] [@enqueued @asset-syncs]))))
      (finally
        (reset! worker-state/*db-sync-client prev)))))

;; Fails if, in `<upload-aes-key`, `seq` becomes `empty?`.
(deftest upload-aes-key-test
  (let [ensure-calls (atom 0)
        orig-e2ee? sync-crypt/graph-e2ee?
        orig-ensure sync-crypt/<ensure-graph-aes-key]
    (set! sync-crypt/graph-e2ee? (constantly true))
    (set! sync-crypt/<ensure-graph-aes-key (fn [& _] (swap! ensure-calls inc) (p/resolved :key)))
    (async done
      (-> (p/let [e (<upload-aes-key "r" {:graph-id "g"} [])
                  empty-calls @ensure-calls
                  f (<upload-aes-key "r" {:graph-id "g"} [{:tx-data [1]}])]
            (is (nil? e))
            (is (= 0 empty-calls))
            (is (= :key f)))
          (p/catch (fn [err] (is false (str err))))
          (p/finally (fn []
                       (set! sync-crypt/graph-e2ee? orig-e2ee?)
                       (set! sync-crypt/<ensure-graph-aes-key orig-ensure)
                       (done)))))))

;; Fails if, in `<upload-pending-batch!`, `when` becomes `when-not` or `seq` becomes `empty?`.
(deftest upload-pending-batch-marks-empty-txs-not-pending-test
  (let [marked (atom [])
        tx-id (random-uuid)]
    (with-redefs [client-op/get-pending-local-txs (fn [& _] [{:tx-id tx-id :tx []}])
                  client-op/mark-pending-txs-false! (fn [repo ids] (swap! marked conj [repo ids]) nil)]
      (<upload-pending-batch! "r" {:inflight (atom [])} nil 1)
      (is (= [["r" [tx-id]]] @marked)))))

;; Fails if, in `persist-local-tx!`, `when` becomes `when-not`.
(deftest persist-local-tx!-increments-pending-count-test
  (doseq [inc? [true false]]
    (let [adjusts (atom [])]
      (with-redefs [worker-state/get-client-ops-conn (constantly :ops-conn)
                    op-construct/derive-history-outliner-ops (constantly {:forward-outliner-ops []
                                                                          :inverse-outliner-ops []})
                    client-op/upsert-local-tx-entry! (fn [& _] {:should-inc-pending? inc?})
                    worker-undo-redo/gen-undo-ops! (fn [& _] nil)
                    client-op/adjust-pending-local-tx-count! (fn [repo n] (swap! adjusts conj [repo n]))]
        (persist-local-tx! "r" {:db-before nil :db-after nil :tx-data [] :tx-meta {}} [] [])
        (is (= (if inc? [["r" 1]] []) @adjusts))))))

;; Fails if, in `log-outliner-op-perf!`, `when` becomes `when-not` or `and` becomes `or`.
(deftest log-outliner-op-perf!-test
  (is (logged? (capture-logs #(log-outliner-op-perf! {:perf-id 1})) "outliner-op-perf"))
  (is (not (logged? (capture-logs #(log-outliner-op-perf! {})) "outliner-op-perf"))))

;; Fails if, in `flush-pending!`, `when` becomes `when-not` or `or` becomes `and`.
(deftest flush-pending!-logs-skip-only-with-pending-txs-test
  (let [run (fn [pending-count]
              (with-redefs [client-op/get-local-tx (constantly 1)
                            client-op/get-pending-local-tx-count (constantly pending-count)]
                (capture-logs #(sync-apply/flush-pending! "r" {:inflight (atom [])}))))]
    (is (logged? (run 3) "flush-pending-skipped"))
    (is (not (logged? (run 0) "flush-pending-skipped")))
    (is (not (logged? (run nil) "flush-pending-skipped")))))

(defn- history-action-tx-meta
  "Run apply-history-action! on an inline action and return the tx-meta it commits with."
  [tx-id undo? tx-meta]
  (let [captured (atom nil)]
    (with-redefs [worker-state/get-datascript-conn (constantly (d/create-conn))
                  client-op/get-local-tx-entry (constantly nil)
                  op-construct/assert-no-numeric-entity-ids! (fn [& _] nil)
                  ldb/batch-transact-with-temp-conn! (fn [_conn tx-meta' _f & _] (reset! captured tx-meta') :report)]
      (is (true? (:applied? (sync-apply/apply-history-action! "r" tx-id undo? tx-meta))))
      @captured)))

;; Fails if, in `apply-history-action!`, `or` becomes `and`, `if` becomes `if-not`, `not` becomes `identity` or `seq` becomes `empty?`.
(deftest apply-history-action!-tx-meta-test
  (let [tx-id (random-uuid)
        u (random-uuid)
        forward [[:save-block [{:block/uuid u :block/title "new"} {}]]]
        inverse [[:save-block [{:block/uuid u :block/title "old"} {}]]]
        inline {:outliner-op :save-block
                :db-sync/forward-outliner-ops forward
                :db-sync/inverse-outliner-ops inverse}]
    (testing "undo swaps the recorded ops and keeps the action's tx-id as source"
      (let [tx-meta (history-action-tx-meta tx-id true inline)]
        (is (= tx-id (:db-sync/source-tx-id tx-meta)))
        (is (= inverse (:db-sync/forward-outliner-ops tx-meta)))
        (is (= forward (:db-sync/inverse-outliner-ops tx-meta)))
        (is (not (contains? tx-meta :db-sync/replayed-tx-data?)))))
    (testing "a given source tx-id is kept"
      (let [source (random-uuid)]
        (is (= source (:db-sync/source-tx-id
                       (history-action-tx-meta tx-id false (assoc inline :db-sync/source-tx-id source)))))))
    (testing "an action without semantic ops replays recorded tx-data"
      (let [tx-meta (history-action-tx-meta tx-id false {:outliner-op :x
                                                         :db-sync/forward-outliner-ops [[:not-semantic]]
                                                         :db-sync/inverse-outliner-ops [[:not-semantic]]})]
        (is (true? (:db-sync/replayed-tx-data? tx-meta)))))))

;; Fails if, in `transact-remote-txs!`, `first` becomes `last`.
(deftest transact-remote-txs!-drops-refs-to-blocks-deleted-later-in-the-batch-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page 1"}
                                   :blocks [{:block/title "existing"}]}]})
        page-id (:db/id (db-test/find-page-by-title @conn "page 1"))
        existing (db-test/find-block-by-content @conn "existing")
        b (random-uuid)
        c (random-uuid)
        block-tx (fn [tempid u title parent]
                   [[:db/add tempid :block/uuid u]
                    [:db/add tempid :block/title title]
                    [:db/add tempid :block/page page-id]
                    [:db/add tempid :block/parent parent]
                    [:db/add tempid :block/order "a5"]
                    [:db/add tempid :block/created-at 1]
                    [:db/add tempid :block/updated-at 1]])
        ;; b is created with child c in the 1st tx, deleted in the 2nd; the
        ;; 3rd tx deletes nothing.
        remote-txs [{:t 1 :tx-data (vec (concat (block-tx "b" b "b" page-id)
                                                (block-tx "c" c "c" [:block/uuid b])))}
                    {:t 2 :tx-data [[:db/retractEntity [:block/uuid b]]]}
                    {:t 3 :tx-data [[:db/add (:db/id existing) :block/title "remote"]]}]
        results (transact-remote-txs! conn remote-txs)]
    (is (= 3 (count results)))
    (is (= #{"b"} (set (map second (:tx-data (first results))))))
    (is (nil? (d/entity @conn [:block/uuid b])))
    (is (nil? (d/entity @conn [:block/uuid c])))
    (is (= "remote" (:block/title (d/entity @conn (:db/id existing)))))))

;; Fails if, in `replay-canonical-outliner-op!`, `nil?` becomes `some?`.
(deftest replay-apply-template-replace-empty-target-test
  (let [tu (random-uuid)
        gu (random-uuid)
        au (random-uuid)
        bu (random-uuid)
        conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}})
        captured (atom nil)
        replay (fn [template-blocks]
                 (reset! captured nil)
                 (replay-canonical-outliner-op!
                  conn
                  [:apply-template [[:block/uuid tu] [:block/uuid gu]
                                    {:replace-empty-target? true
                                     :template-blocks template-blocks}]]
                  nil)
                 (mapv :block/uuid (get-in @captured [0 1 2 :template-blocks])))]
    (d/transact! conn [{:db/id 11 :block/uuid tu :block/title "t"}
                       {:db/id 12 :block/uuid gu :block/title ""}])
    (with-redefs [outliner-op/apply-ops! (fn [_conn ops _opts] (reset! captured ops))]
      (testing "a first block without uuid takes the target's uuid"
        (is (= [gu bu] (replay [{:db/id 50 :block/title "a"}
                                {:block/uuid bu :block/title "b"}]))))
      (testing "a first block with a uuid keeps it"
        (is (= [au bu] (replay [{:block/uuid au :block/title "a"}
                                {:block/uuid bu :block/title "b"}])))))))

;; Fails if, in `replay-canonical-outliner-op!`, `or` becomes `and`, `when` becomes `when-not` or `=` becomes `not=`.
(deftest replay-create-page-reuses-existing-page-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Foo"}}]})
        foo (db-test/find-page-by-title @conn "Foo")
        foo-result ["Foo" (:block/uuid foo)]]
    (with-redefs [outliner-page/create! (fn [_conn title _opts] [:created title])]
      (testing "a page uuid finds the page whatever the title"
        (is (= foo-result (replay-canonical-outliner-op! conn [:create-page ["Bar" {:uuid (:block/uuid foo)}]] nil))))
      (testing "a title finds a page of the same kind"
        (is (= foo-result (replay-canonical-outliner-op! conn [:create-page ["Foo" {}]] nil)))
        (is (= [:created "Foo"]
               (replay-canonical-outliner-op! conn [:create-page ["Foo" {:class? true}]] nil))))
      (testing "nothing found: the page is created"
        (is (= [:created "Bar"] (replay-canonical-outliner-op! conn [:create-page ["Bar" {}]] nil)))))))

;; Fails if, in `rebase-local-op!`, `not` becomes `identity` or `seq` becomes `empty?`.
(deftest rebase-local-op!-marks-replayed-tx-data-test
  (let [u (random-uuid)
        captured (atom nil)
        rebase (fn [local-tx]
                 (reset! captured nil)
                 (is (= :rebased (:status (rebase-local-op! "r" (d/create-conn) local-tx (d/empty-db)))))
                 @captured)]
    (with-redefs [ldb/batch-transact-with-temp-conn! (fn [_conn tx-meta _f & _] (reset! captured tx-meta) :report)]
      (testing "semantic forward ops are replayed as ops"
        (is (not (contains? (rebase {:tx-id 1 :outliner-op :save-block :tx []
                                     :forward-outliner-ops [[:save-block [{:block/uuid u :block/title "x"} {}]]]
                                     :inverse-outliner-ops [[:save-block [{:block/uuid u :block/title "y"} {}]]]})
                            :db-sync/replayed-tx-data?))))
      (testing "without forward ops the recorded tx-data is replayed"
        (is (true? (:db-sync/replayed-tx-data?
                    (rebase {:tx-id 2 :outliner-op :save-block :tx [[:db/add 1 :block/title "x"]]}))))))))

;; Fails if, in `apply-remote-tx-with-local-changes!`, `and` becomes `or`.
(deftest apply-remote-tx-with-local-changes!-handles-only-rebased-local-reports-test
  (let [prev @worker-state/*db-sync-client
        calls (atom [])
        reports [{:tx-data [:d] :tx-meta {:outliner-op :save-block :reverse? true :skip-validate-db? true}}
                 {:tx-data [:d] :tx-meta {:transact-remote? true :persist-op? false :t 1}}
                 {:tx-data [] :tx-meta {:outliner-op :rebase :db-sync/rebased-local? true}}
                 {:tx-data [:d] :tx-meta {:outliner-op :rebase :db-sync/rebased-local? true}}]]
    (try
      (reset! worker-state/*db-sync-client nil)
      (with-redefs [ldb/batch-transact-with-temp-conn! (fn [_conn _tx-meta _f & {:keys [listen-db]}]
                                                         (doseq [r reports] (listen-db r))
                                                         nil)
                    sync-apply/enqueue-local-tx! (fn [_repo r] (swap! calls conj [:enqueue (:outliner-op (:tx-meta r))]))
                    asset-db-listener/generate-asset-ops (fn [_repo r] (swap! calls conj [:asset-ops (:outliner-op (:tx-meta r))]))
                    worker-undo-redo/clear-history! (fn [& _] nil)]
        (apply-remote-tx-with-local-changes! {:repo "r" :conn (d/create-conn) :local-txs [] :remote-txs []})
        (is (= [[:enqueue :rebase] [:asset-ops :rebase]] @calls)))
      (finally
        (reset! worker-state/*db-sync-client prev)))))
