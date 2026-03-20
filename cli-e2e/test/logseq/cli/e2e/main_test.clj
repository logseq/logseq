(ns logseq.cli.e2e.main-test
  (:require [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.main :as main]))

(def sample-cases
  [{:id "global-help"
    :cmd "node static/logseq-cli.js --help"
    :covers {:options {:global ["--help"]}}
    :tags [:global :smoke]}
   {:id "graph-create"
    :cmd "node static/logseq-cli.js graph create --graph demo"
    :covers {:commands ["graph create"]
             :options {:graph ["--type"]}}
    :tags [:graph]}
   {:id "graph-list"
    :cmd "node static/logseq-cli.js graph list"
    :covers {:commands ["graph list"]
             :options {:graph ["--file"]}}
    :tags [:graph :smoke]}])

(def complete-inventory
  {:excluded-command-prefixes ["sync" "login" "logout"]
   :scopes {:global {:options ["--help"]}
            :graph {:commands ["graph create" "graph list"]
                    :options ["--type" "--file"]}}})

(deftest select-cases-supports-case-id
  (is (= ["graph-create"]
         (mapv :id (main/select-cases sample-cases {:case "graph-create"})))))

(deftest select-cases-supports-include-tags
  (is (= ["global-help" "graph-list"]
         (mapv :id (main/select-cases sample-cases {:include ["smoke"]})))))

(deftest run-fails-on-missing-coverage-before-case-execution
  (let [ran? (atom false)]
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo
         #"Missing coverage"
         (main/run! {:inventory complete-inventory
                     :cases [{:id "global-help"
                              :cmd "node static/logseq-cli.js --help"
                              :covers {:options {:global ["--help"]}}}]
                     :skip-build true
                     :run-command (fn [_]
                                    (reset! ran? true)
                                    {:exit 0
                                     :out ""
                                     :err ""})})))
    (is (false? @ran?))))

(deftest run-succeeds-when-coverage-is-complete
  (let [result (main/run! {:inventory complete-inventory
                           :cases [{:id "global-help"
                                    :cmd "node static/logseq-cli.js --help"
                                    :covers {:options {:global ["--help"]}}}
                                   {:id "graph-create"
                                    :cmd "node static/logseq-cli.js graph create --type markdown"
                                    :covers {:commands ["graph create"]
                                             :options {:graph ["--type"]}}}
                                   {:id "graph-list"
                                    :cmd "node static/logseq-cli.js graph list --file demo.edn"
                                    :covers {:commands ["graph list"]
                                             :options {:graph ["--file"]}}}]
                           :skip-build true
                           :run-command (fn [_]
                                          {:exit 0
                                           :out ""
                                           :err ""})})]
    (is (= :ok (:status result)))
    (is (= 3 (count (:cases result))))))

(deftest targeted-run-skips-full-coverage-check
  (let [executed (atom [])]
    (let [result (main/run! {:inventory complete-inventory
                             :cases [{:id "global-help"
                                      :cmd "node static/logseq-cli.js --help"
                                      :covers {:options {:global ["--help"]}}}
                                     {:id "graph-create"
                                      :cmd "node static/logseq-cli.js graph create --graph demo"
                                      :covers {:commands ["graph create"]
                                               :options {:graph ["--type"]}}}]
                             :case "global-help"
                             :skip-build true
                             :run-command (fn [_]
                                            {:exit 0
                                             :out ""
                                             :err ""})
                             :run-case (fn [case _opts]
                                         (swap! executed conj (:id case))
                                         {:id (:id case)
                                          :status :ok})})]
      (is (= :ok (:status result)))
      (is (= ["global-help"] @executed)))))
