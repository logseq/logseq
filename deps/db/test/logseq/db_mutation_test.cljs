(ns logseq.db-mutation-test
  "Tests for behaviors of logseq.db that surviving mutants showed no test
   checked."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(def ^:private plain-schema
  {:block/uuid {:db/unique :db.unique/identity}
   :block/refs {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}})

(defn- console-error-first-args
  "Runs `f` with js/console.error replaced; returns the first argument of
   every console.error call."
  [f]
  (let [orig (.-error js/console)
        calls (atom [])]
    (set! (.-error js/console) (fn [& args] (swap! calls conj (first args))))
    (try
      (f)
      (finally
        (set! (.-error js/console) orig)))
    @calls))

;; Fails if, in `register-transact-fn!`, `when` becomes `when-not`.
;; Fails if, in `transact!`, `and` becomes `or` or `if` becomes `if-not`.
(deftest register-transact-fn-receives-transact-of-a-repo-test
  (testing "a repo (UI thread) transact goes to the registered transact fn, untouched by delete expansion"
    (let [orig @ldb/*transact-fn
          seen (atom nil)
          block-uuid (random-uuid)]
      (try
        (ldb/register-transact-fn!
         (fn [repo tx-data tx-meta]
           (reset! seen [repo (vec tx-data) tx-meta])
           :sent))
        (is (= :sent
               (ldb/transact! "logseq_db_mutation_test"
                              [{:block/uuid block-uuid :block/title "x"}]
                              {:outliner-op :save-block})))
        (is (= ["logseq_db_mutation_test"
                [{:block/uuid block-uuid :block/title "x"}]
                {:outliner-op :save-block}]
               @seen))
        (finally
          (reset! ldb/*transact-fn orig))))))

;; Fails if, in `register-transact-invalid-callback-fn!`, `when` becomes `when-not`.
(deftest register-transact-invalid-callback-fn-is-told-of-invalid-data-test
  (let [orig @ldb/*transact-invalid-callback
        calls (atom 0)
        conn (db-test/create-conn)]
    (try
      (ldb/register-transact-invalid-callback-fn! (fn [_tx-report _errors] (swap! calls inc)))
      (is (thrown? js/Error
                   (with-out-str
                     (db-test/silence-stderr
                      (console-error-first-args
                       #(ldb/transact! conn [{:db/ident :logseq.class/Task
                                              :block/tags :logseq.class/Property}]))))))
      (is (= 1 @calls))
      (finally
        (reset! ldb/*transact-invalid-callback orig)))))

;; Fails if, in `remove-temp-block-data`, `seq` becomes `empty?` or `first` becomes `last`.
(deftest transact-drops-block-temp-attributes-test
  (let [conn (d/create-conn plain-schema)
        block-uuid (random-uuid)
        ref-uuid (random-uuid)]
    (ldb/transact! conn [{:block/uuid block-uuid
                          :block/title "block"
                          :block/refs [{:block/uuid ref-uuid
                                        :block/title "ref"
                                        :block.temp/ref-flag true}]}
                         [:db/add [:block/uuid block-uuid] :block.temp/vector-flag true]])
    (testing "a ref given as a map loses its :block.temp/* keys"
      (is (= "ref" (:block/title (d/entity @conn [:block/uuid ref-uuid]))))
      (is (empty? (d/datoms @conn :aevt :block.temp/ref-flag))))
    (testing "a [:db/add e :block.temp/* v] vector is dropped"
      (is (empty? (d/datoms @conn :aevt :block.temp/vector-flag))))))

;; Fails if, in `transact!`, `or` becomes `and`.
(deftest transact-drops-entities-given-as-bare-items-test
  (let [conn (d/create-conn plain-schema)
        block-uuid (random-uuid)
        _ (d/transact! conn [{:block/uuid block-uuid :block/title "old"}])
        block (d/entity @conn [:block/uuid block-uuid])]
    (ldb/transact! conn [block {:db/id (:db/id block) :block/title "new"}])
    (is (= "new" (:block/title (d/entity @conn [:block/uuid block-uuid]))))))

;; Fails if, in `throw-if-page-has-block-parent!`, `=` becomes `not=`.
(deftest transact-rejects-a-page-with-a-block-parent-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page a"}}
                {:page {:block/title "page b"}
                 :blocks [{:block/title "block of b"}]}]})
        page-a (db-test/find-page-by-title @conn "page a")
        block (db-test/find-block-by-content @conn "block of b")]
    (is (thrown-with-msg? js/Error #"Page can't have block as parent"
                          (console-error-first-args
                           #(ldb/transact! conn [[:db/add (:db/id page-a) :block/parent (:db/id block)]]))))
    (is (nil? (:block/parent (d/entity @conn (:db/id page-a)))))))

;; Fails if, in `transact-sync`, `and` becomes `or`.
(deftest transact-without-changes-commits-nothing-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "same"}]}]})
        block (db-test/find-block-by-content @conn "same")
        db-before @conn
        reports (atom 0)]
    (d/listen! conn ::no-change (fn [_] (swap! reports inc)))
    (ldb/transact! conn [[:db/add (:db/id block) :block/title "same"]])
    (d/unlisten! conn ::no-change)
    (is (identical? db-before @conn))
    (is (zero? @reports))))

;; Fails if, in `transact-sync`, `or` becomes `and`, `and` becomes `or` or `=` becomes `not=`.
(deftest transact-failed-log-follows-suppress-flags-test
  (let [logged? (fn [tx tx-meta]
                  (let [conn (d/create-conn plain-schema)
                        calls (console-error-first-args
                               #(try (ldb/transact! conn tx tx-meta)
                                     (catch :default _ nil)))]
                    (boolean (some #{"transact-failed"} calls))))
        missing-entity-tx [[:db/add [:block/uuid (random-uuid)] :block/title "x"]]
        nil-value-tx [[:db/add -1 :block/title nil]]]
    (testing "failures are logged by default"
      (is (true? (logged? nil-value-tx {})))
      (is (true? (logged? missing-entity-tx {}))))
    (testing ":db-sync/suppress-transact-failed-log? suppresses every failure log"
      (is (false? (logged? nil-value-tx {:db-sync/suppress-transact-failed-log? true}))))
    (testing ":db-sync/suppress-stale-rebase-transact-failed-log? suppresses only missing entity failures"
      (is (false? (logged? missing-entity-tx {:db-sync/suppress-stale-rebase-transact-failed-log? true})))
      (is (true? (logged? nil-value-tx {:db-sync/suppress-stale-rebase-transact-failed-log? true}))))))

;; Fails if, in `transact!`, `if` becomes `if-not`.
(deftest transact-delete-blocks-retracts-children-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "parent"
                           :build/children [{:block/title "child"}]}]}]})
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")]
    (ldb/transact! conn [[:db/retractEntity (:db/id parent)]] {:outliner-op :delete-blocks})
    (is (nil? (d/entity @conn (:db/id parent))))
    (is (nil? (d/entity @conn (:db/id child))))))

;; Fails if, in `batch-transact-with-temp-conn!`, `and` becomes `or`.
(deftest batch-transact-with-temp-conn-empty-batch-builds-no-tx-meta-test
  (let [conn (db-test/create-conn)
        db-before @conn
        calls (atom 0)]
    (is (nil? (ldb/batch-transact-with-temp-conn!
               conn
               {}
               (fn [_temp-conn _*batch-tx-data] nil)
               {:transform-tx-meta (fn [tx-meta] (swap! calls inc) tx-meta)})))
    (is (zero? @calls))
    (is (identical? db-before @conn))))

;; Fails if, in `get-right-sibling`, `nil?` becomes `some?`.
;; Fails if, in `get-left-sibling`, `nil?` becomes `some?`.
;; Fails if, in `get-down`, `nil?` becomes `some?`.
(deftest siblings-and-down-of-nil-are-nil-test
  (is (nil? (ldb/get-right-sibling nil)))
  (is (nil? (ldb/get-left-sibling nil)))
  (is (nil? (ldb/get-down nil))))

;; Fails if, in `get-journal-page-by-day`, `and` becomes `or` or `first` becomes `last`.
(deftest get-journal-page-by-day-edges-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:build/journal 20260410}}
                {:page {:build/journal 20260411}}]})]
    (testing "no day gives no page"
      (is (nil? (ldb/get-journal-page-by-day @conn nil))))
    (testing "2 pages with the same day: the older one"
      (d/transact! conn [{:block/uuid (random-uuid)
                          :block/title "Apr 10th, 2026 duplicate"
                          :block/name "apr 10th, 2026 duplicate"
                          :block/journal-day 20260410
                          :block/tags :logseq.class/Journal}])
      (is (= "Apr 10th, 2026"
             (:block/title (ldb/get-journal-page-by-day @conn 20260410)))))))

;; Fails if, in `page-empty?`, `if` becomes `if-not`.
;; Fails if, in `get-orphaned-pages`, `not` becomes `identity`.
(deftest page-empty-and-orphaned-pages-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "has content"}
                 :blocks [{:block/title "a block"}]}
                {:page {:block/title "plain"}}
                {:page {:block/title "a/b"}}]})
        has-content (db-test/find-page-by-title @conn "has content")
        plain (db-test/find-page-by-title @conn "plain")
        orphaned-titles (fn [pages]
                          (set (map :block/title (ldb/get-orphaned-pages @conn {:pages pages}))))]
    (testing "page-empty? by id and by name"
      (is (false? (ldb/page-empty? @conn (:db/id has-content))))
      (is (false? (ldb/page-empty? @conn "has content")))
      (is (true? (ldb/page-empty? @conn (:db/id plain))))
      (is (true? (ldb/page-empty? @conn "plain"))))
    (testing "an unreferenced page with a block is not orphaned"
      (is (= #{} (orphaned-titles ["has content"]))))
    (testing "an empty unreferenced page is orphaned"
      (is (= #{"plain"} (orphaned-titles ["plain"]))))
    (testing "an empty unreferenced non-journal page with a / in its name is kept"
      (is (= #{} (orphaned-titles ["a/b"]))))))

;; Fails if, in `block-order-path`, `or` becomes `and`.
(deftest sort-page-random-blocks-leaves-out-property-value-blocks-test
  (let [conn (db-test/create-conn)]
    (d/transact! conn
                 [{:db/id -1
                   :block/title "page"
                   :block/name "page"}
                  {:db/id -2
                   :db/ident :user.property/p}
                  {:db/id -3
                   :block/title "ordinary before"
                   :block/parent -1
                   :block/page -1
                   :block/order "a0"}
                  {:db/id -4
                   :block/title "property value"
                   :block/parent -1
                   :block/page -1
                   :block/order "a1"
                   :logseq.property/created-from-property -2}
                  {:db/id -5
                   :block/title "ordinary after"
                   :block/parent -1
                   :block/page -1
                   :block/order "a2"}])
    (let [pick (fn [title] (db-test/find-block-by-content @conn title))]
      (is (= ["ordinary before" "ordinary after"]
             (map :block/title
                  (ldb/sort-page-random-blocks
                   @conn
                   [(pick "ordinary after") (pick "property value") (pick "ordinary before")])))))))

;; Fails if, in `compare-order-paths`, `nil?` becomes `some?`.
(deftest sort-page-random-blocks-keeps-given-order-of-siblings-sharing-an-order-test
  (testing "siblings with the same :block/order (e.g. before db-sync fixes duplicate orders) stay in the order given"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "page 1"}
                   :blocks [{:block/title "a"} {:block/title "b"} {:block/title "c"}]}]})
          pick (fn [title] (db-test/find-block-by-content @conn title))
          sorted-titles (fn [titles]
                          (map :block/title (ldb/sort-page-random-blocks @conn (map pick titles))))]
      (d/transact! conn [[:db/add (:db/id (pick "b")) :block/order (:block/order (pick "a"))]])
      (is (= ["a" "b"] (sorted-titles ["a" "b"])))
      (is (= ["b" "a" "c"] (sorted-titles ["c" "b" "a"]))))))

;; Fails if, in `get-alias-source-page`, `first` becomes `last`.
(deftest get-alias-source-page-of-an-alias-of-2-pages-is-the-older-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "source 1"}}
                {:page {:block/title "source 2"}}
                {:page {:block/title "alias"}}]})
        source-1 (db-test/find-page-by-title @conn "source 1")
        source-2 (db-test/find-page-by-title @conn "source 2")
        alias (db-test/find-page-by-title @conn "alias")]
    (is (< (:db/id source-1) (:db/id source-2)))
    (d/transact! conn [[:db/add (:db/id source-1) :block/alias (:db/id alias)]
                       [:db/add (:db/id source-2) :block/alias (:db/id alias)]])
    (is (= "source 1" (:block/title (ldb/get-alias-source-page @conn (:db/id alias)))))))

;; Fails if, in `get-graph-rtc-uuid`, `when` becomes `when-not`.
(deftest get-graph-rtc-uuid-test
  (let [conn (db-test/create-conn)
        graph-uuid (random-uuid)]
    (d/transact! conn [(ldb/kv :logseq.kv/graph-uuid graph-uuid)])
    (is (= graph-uuid (ldb/get-graph-rtc-uuid @conn)))
    (is (nil? (ldb/get-graph-rtc-uuid nil)))))

(defn- bidirectional-conn
  [person-properties]
  (db-test/create-conn-with-blocks
   {:properties {:friend {:logseq.property/type :node
                          :build/property-classes [:Person]}}
    :classes {:Person {:build/properties (merge {:logseq.property.class/enable-bidirectional? true}
                                                person-properties)}}
    :pages-and-blocks
    [{:page {:block/title "Alice"
             :build/tags [:Person]
             :build/properties {:friend [:build/page {:block/title "Bob"}]}}}
     {:page {:block/title "Bob"}}]}))

;; Fails if, in `build-bidirectional-property-group`, `if` becomes `if-not`.
(deftest get-bidirectional-properties-custom-title-test
  (let [conn (bidirectional-conn {:logseq.property.class/bidirectional-property-title "Friends of"})
        bob (db-test/find-page-by-title @conn "Bob")]
    (is (= ["Friends of"]
           (map :title (ldb/get-bidirectional-properties @conn (:db/id bob)))))))

;; Fails if, in `get-bidirectional-properties`, `and` becomes `or`.
(deftest get-bidirectional-properties-without-target-is-nil-test
  (let [conn (bidirectional-conn {})
        bob (db-test/find-page-by-title @conn "Bob")]
    (is (= ["People"]
           (map :title (ldb/get-bidirectional-properties @conn (:db/id bob)))))
    (is (empty? (ldb/get-bidirectional-properties @conn nil)))))

;; Fails if, in `get-bidirectional-properties`, `and` becomes `or`.
(deftest get-bidirectional-properties-ignores-recycled-classes-test
  (let [conn (bidirectional-conn {})
        bob (db-test/find-page-by-title @conn "Bob")
        person (db-test/find-page-by-title @conn "Person")]
    (d/transact! conn [{:db/id (:db/id person)
                        :logseq.property/deleted-at 1}])
    (is (empty? (ldb/get-bidirectional-properties @conn (:db/id bob))))))

;; Fails if, in `bidirectional-property-attr?`, `and` becomes `or`.
(deftest get-bidirectional-properties-ignores-db-attributes-test
  (testing ":block/alias given property classes is still not a bidirectional property"
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Person {:build/properties {:logseq.property.class/enable-bidirectional? true}}}
                 :pages-and-blocks
                 [{:page {:block/title "Alice"
                          :build/tags [:Person]}}
                  {:page {:block/title "Bob"}}]})
          alice (db-test/find-page-by-title @conn "Alice")
          bob (db-test/find-page-by-title @conn "Bob")
          person (db-test/find-page-by-title @conn "Person")]
      (d/transact! conn [[:db/add :block/alias :logseq.property/classes (:db/id person)]
                         [:db/add (:db/id alice) :block/alias (:db/id bob)]])
      (is (empty? (ldb/get-bidirectional-properties @conn (:db/id bob)))))))
