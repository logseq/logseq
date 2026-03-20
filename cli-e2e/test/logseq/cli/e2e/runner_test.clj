(ns logseq.cli.e2e.runner-test
  (:require [clojure.test :refer [deftest is]]
            [logseq.cli.e2e.runner :as runner]))

(deftest render-case-expands-template-values-recursively
  (let [rendered (runner/render-case
                  {:id "graph-create"
                   :setup ["{{cli}} --graph {{graph-arg}}"]
                   :cmd "{{cli}} graph info --graph {{graph-arg}}"
                   :expect {:stdout-json-paths {[:data :graph] "{{graph}}"
                                                [:status] "ok"}}}
                  {:cli "node /tmp/logseq-cli.js"
                   :graph "demo"
                   :graph-arg "'demo'"})]
    (is (= ["node /tmp/logseq-cli.js --graph 'demo'"] (:setup rendered)))
    (is (= "node /tmp/logseq-cli.js graph info --graph 'demo'" (:cmd rendered)))
    (is (= "demo" (get-in rendered [:expect :stdout-json-paths [:data :graph]])))))

(deftest run-case-executes-setup-before-main-command
  (let [calls (atom [])
        result (runner/run-case!
                {:id "graph-info"
                 :setup ["setup one" "setup two"]
                 :cmd "main command"
                 :expect {:exit 0}}
                {:context {}
                 :run-command (fn [{:keys [cmd]}]
                                (swap! calls conj cmd)
                                {:cmd cmd
                                 :exit 0
                                 :out ""
                                 :err ""})})]
    (is (= ["setup one" "setup two" "main command"] @calls))
    (is (= "graph-info" (:id result)))
    (is (= "main command" (get-in result [:result :cmd])))))

(deftest run-case-validates-json-paths-and-nonzero-exit
  (let [result (runner/run-case!
                {:id "invalid-shell"
                 :cmd "node static/logseq-cli.js completion fish"
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
