(ns logseq.melange.bridge.db.sqlite.export-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.melange.bridge.db.property :as melange-property]
            [logseq.melange.bridge.db.sqlite.export :as sqlite-export]
            [logseq.melange.bridge.db.test-helper :as db-test]))

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
  (let [result
        (sqlite-export/validate-export
         {:logseq.db.sqlite.export/graph-format :datoms
          :datoms [[1 :block/title "Missing required page fields"]]})]
    (is (re-find #"exported EDN" (:error result)))))
