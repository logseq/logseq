(ns logseq.cli.e2e.manifests-test
  (:require [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.manifests :as manifests]))

(deftest load-cases-supports-legacy-vector-format
  (with-redefs [manifests/read-edn-file (fn [_]
                                          [{:id "legacy-a"}
                                           {:id "legacy-b"}])]
    (is (= ["legacy-a" "legacy-b"]
           (mapv :id (manifests/load-cases :non-sync))))))

(deftest load-cases-supports-templates-and-inheritance
  (with-redefs [manifests/read-edn-file (fn [_]
                                          {:templates
                                           {:base {:setup ["setup-a"]
                                                   :cmds ["cmd-a"]
                                                   :cleanup ["cleanup-a"]
                                                   :tags [:base]
                                                   :vars {:nested {:left 1}
                                                          :only-base true}
                                                   :covers {:commands ["base-command"]
                                                            :options {:global ["--base"]}}
                                                   :expect {:stdout-json-paths {[:status] "ok"}}
                                                   :graph "base-graph"}
                                            :addon {:setup ["setup-b"]
                                                    :cmds ["cmd-b"]
                                                    :cleanup ["cleanup-b"]
                                                    :tags [:addon]
                                                    :vars {:nested {:right 2}}
                                                    :covers {:options {:graph ["--addon"]}}
                                                    :expect {:stdout-json-paths {[:data :x] 1}}
                                                    :graph "addon-graph"}}
                                           :cases
                                           [{:id "templated"
                                             :extends [:base :addon]
                                             :setup ["setup-case"]
                                             :cmds ["cmd-case"]
                                             :cleanup ["cleanup-case"]
                                             :tags [:case]
                                             :vars {:nested {:leaf 3}
                                                    :only-case true}
                                             :covers {:options {:graph ["--case"]}}
                                             :expect {:stdout-json-paths {[:data :y] 2}}
                                             :graph "case-graph"}]})]
    (let [case (first (manifests/load-cases :sync))]
      (testing "append merge keys"
        (is (= ["setup-a" "setup-b" "setup-case"] (:setup case)))
        (is (= ["cmd-a" "cmd-b" "cmd-case"] (:cmds case)))
        (is (= ["cleanup-a" "cleanup-b" "cleanup-case"] (:cleanup case)))
        (is (= [:base :addon :case] (:tags case))))
      (testing "deep merge keys"
        (is (= {:nested {:left 1 :right 2 :leaf 3}
                :only-base true
                :only-case true}
               (:vars case)))
        (is (= {:commands ["base-command"]
                :options {:global ["--base"]
                          :graph ["--case"]}}
               (:covers case)))
        (is (= {[:status] "ok"
                [:data :x] 1
                [:data :y] 2}
               (get-in case [:expect :stdout-json-paths]))))
      (testing "scalar child override"
        (is (= "case-graph" (:graph case)))))))

(deftest load-cases-detects-circular-template-inheritance
  (with-redefs [manifests/read-edn-file (fn [_]
                                          {:templates
                                           {:a {:extends :b
                                                :setup ["a"]}
                                            :b {:extends :a
                                                :setup ["b"]}}
                                           :cases [{:id "cycle" :extends :a}]})]
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo
         #"Circular template inheritance"
         (manifests/load-cases :sync)))))
