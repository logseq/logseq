(ns logseq.cli.e2e.runner-test
  (:require [clojure.test :refer [deftest is]]
            [logseq.cli.e2e.runner :as runner]))

(deftest render-case-expands-template-values-recursively
  (let [rendered (runner/render-case
                  {:id "graph-create"
                   :setup ["{{cli}} --graph {{graph-arg}}"]
                   :cmds ["{{cli}} graph info --graph {{graph-arg}}"]
                   :expect {:stdout-json-paths {[:data :graph] "{{graph}}"
                                                [:status] "ok"}}}
                  {:cli "node /tmp/logseq-cli.js"
                   :graph "demo"
                   :graph-arg "'demo'"})]
    (is (= ["node /tmp/logseq-cli.js --graph 'demo'"] (:setup rendered)))
    (is (= ["node /tmp/logseq-cli.js graph info --graph 'demo'"] (:cmds rendered)))
    (is (= "demo" (get-in rendered [:expect :stdout-json-paths [:data :graph]])))))

(deftest run-case-executes-setup-before-main-command
  (let [calls (atom [])
        result (runner/run-case!
                {:id "graph-info"
                 :setup ["setup one" "setup two"]
                 :cmds ["main command one" "main command two"]
                 :expect {:exit 0}}
                {:context {}
                 :run-command (fn [{:keys [cmd]}]
                                (swap! calls conj cmd)
                                {:cmd cmd
                                 :exit 0
                                 :out ""
                                 :err ""})})]
    (is (= ["setup one" "setup two" "main command one" "main command two"] @calls))
    (is (= "graph-info" (:id result)))
    (is (= "main command two" (get-in result [:result :cmd])))))

(deftest run-case-includes-command-phase-metadata-when-detailed
  (let [calls (atom [])]
    (runner/run-case!
     {:id "graph-info"
      :setup ["setup one" "setup two"]
      :cmds ["main command one" "main command two"]
      :cleanup ["cleanup one"]
      :expect {:exit 0}}
     {:context {}
      :detailed-log? true
      :run-command (fn [{:keys [cmd phase step-index step-total case-id throw?] :as opts}]
                     (swap! calls conj (select-keys opts [:cmd :phase :step-index :step-total :case-id :throw?]))
                     {:cmd cmd
                      :exit 0
                      :out ""
                      :err ""})})
    (is (= [{:cmd "setup one" :phase :setup :step-index 1 :step-total 2 :case-id "graph-info" :throw? true}
            {:cmd "setup two" :phase :setup :step-index 2 :step-total 2 :case-id "graph-info" :throw? true}
            {:cmd "main command one" :phase :main :step-index 1 :step-total 2 :case-id "graph-info" :throw? true}
            {:cmd "main command two" :phase :main :step-index 2 :step-total 2 :case-id "graph-info" :throw? false}
            {:cmd "cleanup one" :phase :cleanup :step-index 1 :step-total 1 :case-id "graph-info" :throw? false}]
           @calls))))

(deftest run-case-collects-step-timings-when-enabled
  (let [result (runner/run-case!
                {:id "graph-info"
                 :setup ["setup one"]
                 :cmds ["main command"]
                 :cleanup ["cleanup one"]
                 :expect {:exit 0}}
                {:context {}
                 :timings? true
                 :run-command (fn [{:keys [cmd]}]
                                {:cmd cmd
                                 :exit 0
                                 :out ""
                                 :err ""})})]
    (is (= 3 (count (:timings result))))
    (is (= [:setup :main :cleanup]
           (mapv :phase (:timings result))))))

(deftest run-case-attaches-timings-to-error-when-enabled
  (let [error (try
                (runner/run-case!
                 {:id "graph-info"
                  :setup ["setup one"]
                  :cmds ["main command"]
                  :cleanup ["cleanup one"]
                  :expect {:exit 0}}
                 {:context {}
                  :timings? true
                  :run-command (fn [{:keys [cmd]}]
                                 (when (= cmd "main command")
                                   (throw (ex-info "boom" {:cmd cmd})))
                                 {:cmd cmd
                                  :exit 0
                                  :out ""
                                  :err ""})})
                nil
                (catch clojure.lang.ExceptionInfo error
                  error))
        timings (:timings (ex-data error))]
    (is (= "graph-info" (:case-id (ex-data error))))
    (is (= [:setup :main :cleanup]
           (mapv :phase timings)))
    (is (= :failed (:status (second timings))))))

(deftest run-case-validates-json-paths-and-nonzero-exit
  (let [result (runner/run-case!
                {:id "invalid-shell"
                 :cmds ["node static/logseq-cli.js completion fish"]
                 :expect {:exit 1
                          :stdout-json-paths {[:status] "error"
                                              [:error :code] "invalid-options"}}}
                {:context {}
                 :run-command (fn [{:keys [cmd]}]
                                {:cmd cmd
                                 :exit 1
                                 :out "{\"status\":\"error\",\"error\":{\"code\":\"invalid-options\"}}"
                                 :err ""})})]
    (is (= 1 (get-in result [:result :exit])))))

(deftest assert-result-validates-edn-paths
  (is (nil? (runner/assert-result!
             {:id "graph-list-edn"
              :expect {:exit 0
                       :stdout-edn-paths {[:status] :ok
                                          [:data :graphs] ["demo"]}}}
             {:cmd "node cli.js graph list"
              :exit 0
              :out "{:status :ok, :data {:graphs [\"demo\"]}}"
              :err ""}))))

(deftest assert-result-validates-stdout-not-contains
  (is (thrown-with-msg?
       clojure.lang.ExceptionInfo
       #"stdout contained forbidden text"
       (runner/assert-result!
        {:id "remove-block"
         :expect {:exit 0
                  :stdout-not-contains ["Alpha block"]}}
        {:cmd "node cli.js show --page Home"
         :exit 0
         :out "Home\n- Alpha block"
         :err ""}))))
