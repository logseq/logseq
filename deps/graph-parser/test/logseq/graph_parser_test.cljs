(ns logseq.graph-parser-test
  (:require [cljs.test :refer [deftest testing is]]
            [clojure.string :as string]
            [logseq.graph-parser :as graph-parser]
            [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [datascript.core :as d]))

(deftest parse-file
  (testing "id properties"
    (let [conn (ldb/start-conn)]
      (graph-parser/parse-file conn "foo.md" "- id:: 628953c1-8d75-49fe-a648-f4c612109098" {})
      (is (= [{:id "628953c1-8d75-49fe-a648-f4c612109098"}]
             (->> (d/q '[:find (pull ?b [*])
                         :in $
                         :where [?b :block/content] [(missing? $ ?b :block/name)]]
                       @conn)
                  (map first)
                  (map :block/properties)))
          "id as text has correct :block/properties"))

    (let [conn (ldb/start-conn)]
      (graph-parser/parse-file conn "foo.md" "- id:: [[628953c1-8d75-49fe-a648-f4c612109098]]" {})
      (is (= [{:id #{"628953c1-8d75-49fe-a648-f4c612109098"}}]
             (->> (d/q '[:find (pull ?b [*])
                         :in $
                         :where [?b :block/content] [(missing? $ ?b :block/name)]]
                       @conn)
                  (map first)
                  (map :block/properties)))
          "id as linked ref has correct :block/properties")))

  (testing "unexpected failure during block extraction"
    (let [conn (ldb/start-conn)
          deleted-page (atom nil)]
      (with-redefs [gp-block/with-pre-block-if-exists (fn stub-failure [& _args]
                                              (throw (js/Error "Testing unexpected failure")))]
        (try
          (graph-parser/parse-file conn "foo.md" "- id:: 628953c1-8d75-49fe-a648-f4c612109098"
                                  {:delete-blocks-fn (fn [page _file]
                                                       (reset! deleted-page page))})
          (catch :default _)))
      (is (= nil @deleted-page)
          "Page should not be deleted when there is unexpected failure"))))

(defn- test-property-order [num-properties]
  (let [conn (ldb/start-conn)
        properties (mapv #(keyword (str "p" %)) (range 0 num-properties))
        text (->> properties
                  (map #(str (name %) ":: " (name %) "-value"))
                  (string/join "\n"))
        ;; Test page properties and block properties
        body (str text "\n- " text)
        _ (graph-parser/parse-file conn "foo.md" body {})
        properties-orders (->> (d/q '[:find (pull ?b [*])
                                      :in $
                                      :where [?b :block/content] [(missing? $ ?b :block/name)]]
                                    @conn)
                               (map first)
                               (map :block/properties-order))]
    (is (every? vector? properties-orders)
        "Order is persisted as a vec to avoid edn serialization quirks")
    (is (= [properties properties] properties-orders)
        "Property order")))

(deftest properties-order
  (testing "Sort order and persistence of a few properties"
    (test-property-order 4))
  (testing "Sort order and persistence of 10 properties"
    (test-property-order 10)))
