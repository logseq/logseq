(ns logseq.melange.bridge.db.sqlite.export-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.melange.bridge.db.property :as melange-property]
            [logseq.melange.bridge.db.sqlite.export :as sqlite-export]
            [logseq.melange.bridge.db.test-helper :as db-test]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private invalid-graph-export
  {:logseq.db.sqlite.export/graph-format :datoms
   :datoms [[1 :block/title "Orphan Page"]
            [1 :block/name "orphan page"]
            [1 :block/uuid #uuid "33333333-3333-4333-8333-000000000001"]
            [1 :block/tags 2]
            [2 :block/title "Page"]
            [2 :block/name "page"]
            [2 :db/ident :logseq.class/Page]
            [2 :block/uuid #uuid "33333333-3333-4333-8333-000000000002"]]})

(deftest build-import-prepares-structured-page-transactions
  (let [conn (db-test/create-conn)
        transactions
        (sqlite-export/build-import
         {:logseq.db.sqlite.export/export-type :page
          :properties {:description {:logseq.property/type :default}}
          :pages-and-blocks
          [{:page {:block/title "Imported page"}
            :blocks [{:block/title "Imported block"
                      :build/properties {:description "Imported value"}}]}]}
         @conn
         {})
        _ (d/transact! conn (:init-tx transactions))
        _ (d/transact! conn (:block-props-tx transactions))
        block (db-test/find-block-by-content @conn "Imported block")]
    (is (= "Imported page" (-> block :block/page :block/title)))
    (is (= "Imported value"
           (-> block
               :user.property/description
               melange-property/property-value-content)))))

(deftest build-import-rejects-existing-property-schema-conflicts
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}})
        result (sqlite-export/build-import
                {:logseq.db.sqlite.export/export-type :page
                 :properties
                 {:user.property/p1
                  {:logseq.property/type :number}}}
                @conn
                {})]
    (is (re-find #"conflict" (:error result)))
    (is (re-find #"user.property/p1" (:error result)))))

(deftest validate-import-transactions-dry-runs-and-removes-disallowed-keys
  (let [conn (db-test/create-conn)
        contents (db-test/find-page-by-title @conn "Contents")
        disallowed-tx [:db/add (:db/id contents) :custom/value "ignored"]
        result (sqlite-export/validate-import-txs
                {:init-tx []
                 :block-props-tx []
                 :misc-tx [disallowed-tx]}
                @conn)]
    (is (some? (:db result)))
    (is (not-any? #{disallowed-tx} (:tx-data result)))
    (is (nil? (:custom/value (d/entity (:db result) (:db/id contents)))))))

(deftest validate-import-transactions-preserves-build-errors
  (let [conn (db-test/create-conn)]
    (is (= {:error "conflicting property"}
           (sqlite-export/validate-import-txs
            {:error "conflicting property"}
            @conn)))))

(deftest graph-human-export-round-trips-properties-and-classes
  (let [source
        (db-test/create-conn-with-blocks
         {:properties {:score {:logseq.property/type :number}}
          :classes {:project {:build/class-properties [:score]}}
          :pages-and-blocks
          [{:page {:block/title "Projects"}
            :blocks [{:block/title "Migration"
                      :build/tags #{:project}
                      :build/properties {:score 42}}]}]})
        exported (sqlite-export/build-export
                  @source
                  {:export-type :graph-human
                   :graph-options {}})
        target (db-test/create-conn)
        transactions (sqlite-export/build-import exported @target {})
        validation (sqlite-export/validate-import-txs transactions @target)
        _ (d/transact! target (:tx-data validation))
        block (db-test/find-block-by-content @target "Migration")]
    (is (nil? (:error validation)))
    (is (= #{:user.class/project}
           (set (map :db/ident (:block/tags block)))))
    (is (= 42
           (melange-property/property-value-content
            (:user.property/score block))))))

(deftest validate-export-rejects-invalid-graph-datoms
  (let [result (sqlite-export/validate-export invalid-graph-export)]
    (is (re-find #"Exported EDN" (:error result)))))

(deftest validate-import-transactions-uses-capitalized-default-label
  (let [conn (db-test/create-conn)
        result (sqlite-export/validate-import-txs
                {:init-tx []
                 :block-props-tx []
                 :misc-tx [[:db/add -1 :block/title "Orphan block"]]}
                @conn)]
    (is (re-find #"Imported EDN" (:error result)))))

(deftest validation-errors-log-sanitized-entities
  (let [console-errors (atom [])
        printed-values (atom [])]
    (with-redefs [runtime/log-error (fn [message]
                                      (swap! console-errors conj message))
                  runtime/log-values (fn [values]
                                       (swap! printed-values into
                                              (array-seq values)))]
      (sqlite-export/validate-export invalid-graph-export))
    (is (some #(re-find #"Exported EDN has [0-9]+ validation error\(s\)" %)
              @console-errors))
    (let [diagnostics (pr-str @printed-values)]
      (is (re-find #":entity" diagnostics))
      (is (re-find #":dispatch-key" diagnostics))
      (is (re-find #":errors" diagnostics))
      (is (not (re-find #":block/tags" diagnostics))))))

(deftest export-selected-nodes-with-missing-node
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        block (db-test/find-block-by-content @conn "b1")
        result (try
                 {:export (sqlite-export/build-export
                           @conn
                           {:export-type :selected-nodes
                            :node-ids [[:block/uuid (:block/uuid block)]
                                       [:block/uuid (random-uuid)]]})}
                 (catch :default error
                   {:error (ex-message error)}))]
    (is (nil? (:error result)) (:error result))
    (is (some? (:export result)) "Selected nodes export is present")
    (when-let [export (:export result)]
      (is (= ["b1"]
             (mapv :block/title (mapcat :blocks (:pages-and-blocks export)))))
      (is (nil? (:error (sqlite-export/validate-export export)))))))
