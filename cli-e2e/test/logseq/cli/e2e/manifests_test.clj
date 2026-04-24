(ns logseq.cli.e2e.manifests-test
  (:require [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.manifests :as manifests]))

(deftest load-cases-requires-new-map-format
  (with-redefs [manifests/read-edn-file (fn [_]
                                          [{:id "legacy-a"}
                                           {:id "legacy-b"}])]
    (let [error (try
                  (manifests/load-cases :non-sync)
                  nil
                  (catch clojure.lang.ExceptionInfo error
                    error))]
      (is (some? error))
      (is (re-find #"Invalid cli-e2e manifest format" (.getMessage error)))
      (is (= "{:templates {...} :cases [...]}"
             (:expected (ex-data error)))))))

(deftest load-cases-merges-templates-and-cases-by-rules
  (with-redefs [manifests/read-edn-file
                (fn [_]
                  {:templates
                   {:base {:setup ["setup-a"]
                           :cmds ["cmd-a"]
                           :cleanup ["cleanup-a"]
                           :tags [:base]
                           :vars {:nested {:left 1}
                                  :only-base true}
                           :covers {:commands ["base-command"]
                                    :options {:global ["--base"]}}
                           :expect {:stdout-json-paths {[:status] "ok"
                                                        [:data :base] 1}}
                           :graph "base-graph"}
                    :addon {:setup ["setup-b"]
                            :cmds ["cmd-b"]
                            :cleanup ["cleanup-b"]
                            :tags [:addon]
                            :vars {:nested {:right 2}}
                            :covers {:options {:graph ["--addon"]}}
                            :expect {:stdout-json-paths {[:data :addon] 2}}
                            :graph "addon-graph"}
                    :shared {:setup ["setup-shared"]
                             :cmds ["cmd-shared"]
                             :cleanup ["cleanup-shared"]
                             :tags [:shared]
                             :vars {:nested {:shared 9}}
                             :graph "shared-graph"}}
                   :cases
                   [{:id "single-parent"
                     :extends :base
                     :cmds ["cmd-case"]
                     :expect {:stdout-json-paths {[:data :case] 3}}
                     :graph "single-parent-graph"}
                    {:id "multi-parent"
                     :extends [:base :addon]
                     :setup ["setup-case"]
                     :cmds ["cmd-case"]
                     :cleanup ["cleanup-case"]
                     :tags [:case]
                     :vars {:nested {:leaf 3}
                            :only-case true}
                     :covers {:commands ["case-command"]
                              :options {:graph ["--case"]}}
                     :expect {:stdout-json-paths {[:data :case] 3}}
                     :graph "case-graph"}
                    {:id "negative-case"
                     :extends :shared
                     :expect {:exit 1
                              :stdout-json-paths {[:error :code] "boom"}}
                     :graph "negative-graph"}]})]
    (let [[single-parent multi-parent negative-case] (manifests/load-cases :sync)]
      (testing "supports :extends keyword"
        (is (= "single-parent" (:id single-parent)))
        (is (= ["cmd-a" "cmd-case"] (:cmds single-parent)))
        (is (= "single-parent-graph" (:graph single-parent))))
      (testing "append merge keys"
        (is (= ["setup-a" "setup-b" "setup-case"] (:setup multi-parent)))
        (is (= ["cmd-a" "cmd-b" "cmd-case"] (:cmds multi-parent)))
        (is (= ["cleanup-a" "cleanup-b" "cleanup-case"] (:cleanup multi-parent)))
        (is (= [:base :addon :case] (:tags multi-parent))))
      (testing "deep merge keys"
        (is (= {:nested {:left 1 :right 2 :leaf 3}
                :only-base true
                :only-case true}
               (:vars multi-parent)))
        (is (= {:commands ["case-command"]
                :options {:global ["--base"]
                          :graph ["--case"]}}
               (:covers multi-parent)))
        (is (= {[:status] "ok"
                [:data :base] 1
                [:data :addon] 2
                [:data :case] 3}
               (get-in multi-parent [:expect :stdout-json-paths]))))
      (testing "child expect overrides inherited maps when parent omits them"
        (is (= {:exit 1
                :stdout-json-paths {[:error :code] "boom"}}
               (:expect negative-case))))
      (testing "base templates can omit happy-path defaults"
        (is (= ["setup-shared"] (:setup negative-case)))
        (is (= ["cmd-shared"] (:cmds negative-case)))
        (is (= ["cleanup-shared"] (:cleanup negative-case))))
      (testing "scalar keys are overridden by child"
        (is (= "case-graph" (:graph multi-parent)))))))

(deftest load-cases-detects-circular-template-inheritance-with-cycle-path
  (with-redefs [manifests/read-edn-file (fn [_]
                                          {:templates
                                           {:a {:extends :b
                                                :setup ["a"]}
                                            :b {:extends :a
                                                :setup ["b"]}}
                                           :cases [{:id "cycle" :extends :a}]})]
    (let [error (try
                  (manifests/load-cases :sync)
                  nil
                  (catch clojure.lang.ExceptionInfo error
                    error))]
      (is (some? error))
      (is (re-find #"Circular template inheritance" (.getMessage error)))
      (is (= [:a :b :a] (:cycle (ex-data error)))))))

(deftest load-cases-validates-extends-entries
  (with-redefs [manifests/read-edn-file (fn [_]
                                          {:templates {:base {:cmds ["base"]}}
                                           :cases [{:id "invalid-extends"
                                                    :extends [:base "bad"]
                                                    :cmds ["case"]}]})]
    (let [error (try
                  (manifests/load-cases :non-sync)
                  nil
                  (catch clojure.lang.ExceptionInfo error
                    error))]
      (is (some? error))
      (is (re-find #"Invalid :extends entries" (.getMessage error)))
      (is (= ["bad"] (:invalid-entries (ex-data error)))))))

(deftest load-cases-lint-detects-invalid-extends-references
  (with-redefs [manifests/read-edn-file (fn [_]
                                          {:templates {:base {:cmds ["base"]}
                                                       :unused {:extends :missing-template
                                                                :cmds ["unused"]}}
                                           :cases [{:id "valid" :extends :base :cmds ["case"]}
                                                   {:id "invalid" :extends :also-missing :cmds ["case"]}]})]
    (let [error (try
                  (manifests/load-cases :sync)
                  nil
                  (catch clojure.lang.ExceptionInfo error
                    error))
          issues (:issues (ex-data error))]
      (is (some? error))
      (is (re-find #"manifest lint failed" (.getMessage error)))
      (is (= #{:also-missing :missing-template}
             (set (map :target (filter #(= :invalid-extends (:type %)) issues))))))))

(deftest load-cases-lint-detects-duplicate-case-ids
  (with-redefs [manifests/read-edn-file (fn [_]
                                          {:templates {:base {:cmds ["base"]}}
                                           :cases [{:id "dup" :extends :base :cmds ["case-a"]}
                                                   {:id "dup" :extends :base :cmds ["case-b"]}]})]
    (let [error (try
                  (manifests/load-cases :non-sync)
                  nil
                  (catch clojure.lang.ExceptionInfo error
                    error))
          duplicate-issues (filter #(= :duplicate-case-id (:type %))
                                   (:issues (ex-data error)))]
      (is (some? error))
      (is (= [{:type :duplicate-case-id :id "dup" :count 2}]
             (vec duplicate-issues))))))

(deftest load-cases-lint-detects-unused-templates
  (with-redefs [manifests/read-edn-file (fn [_]
                                          {:templates {:base {:cmds ["base"]}
                                                       :unused {:cmds ["unused"]}}
                                           :cases [{:id "only" :extends :base :cmds ["case"]}]})]
    (let [error (try
                  (manifests/load-cases :sync)
                  nil
                  (catch clojure.lang.ExceptionInfo error
                    error))
          unused-issues (filter #(= :unused-template (:type %))
                                (:issues (ex-data error)))]
      (is (some? error))
      (is (= [{:type :unused-template :template :unused}]
             (vec unused-issues))))))

(deftest sync-multi-batch-operations-uses-state-driven-waits-instead-of-fixed-sleeps
  (let [cases (manifests/load-cases :sync)
        multi-batch (some #(when (= "sync-multi-batch-operations" (:id %)) %) cases)
        commands (:cmds multi-batch)
        upload-commands (filter #(re-find #"sync upload --graph" %) commands)
        wait-commands (filter #(re-find #"wait_sync_status\.py" %) commands)]
    (is (some? multi-batch))
    (is (not-any? #(= "sleep 1" %) commands))
    (is (= 1 (count upload-commands)))
    (is (= 5 (count wait-commands)))
    (is (= 3 (count (filter #(re-find #"--root-dir '\{\{tmp-dir\}\}/graphs-b'.+--timeout-s 30 --interval-s 1" %) wait-commands))))))

(deftest sync-manifest-includes-duplicate-upload-negative-case
  (let [cases (manifests/load-cases :sync)
        duplicate-upload (some #(when (= "sync-upload-rejects-duplicate-remote-graph" (:id %)) %) cases)
        json-paths (get-in duplicate-upload [:expect :stdout-json-paths])
        setup-commands (:setup duplicate-upload)
        main-commands (:cmds duplicate-upload)]
    (is (some? duplicate-upload))
    (is (= 1 (get-in duplicate-upload [:expect :exit])))
    (is (= "graph-already-exists"
           (get-in duplicate-upload [:expect :stdout-json-paths [:error :code]])))
    (is (= ["delete it before uploading again"]
           (get-in duplicate-upload [:expect :stdout-contains])))
    (is (= 1 (count (filter #(re-find #"sync upload --graph" %) setup-commands))))
    (is (= 1 (count (filter #(re-find #"sync upload --graph" %) main-commands))))
    (is (false? (contains? json-paths [:data :pending-local])))
    (is (false? (contains? json-paths [:data :pending-asset])))
    (is (false? (contains? json-paths [:data :pending-server])))
    (is (false? (contains? json-paths [:data :last-error])))))

(deftest sync-status-steady-state-does-not-repeat-identical-b-side-steady-state-waits
  (let [cases (manifests/load-cases :sync)
        steady-state (some #(when (= "sync-status-steady-state" (:id %)) %) cases)
        steady-waits (filter #(re-find #"wait_sync_status\.py.+--root-dir '\{\{tmp-dir\}\}/graphs-b'.+--timeout-s 30 --interval-s 1" %) (:cmds steady-state))]
    (is (some? steady-state))
    (is (= 1 (count steady-waits)))
    (is (= 1 (count (filter #(re-find #"sync status --graph" %) (:cmds steady-state)))))))
