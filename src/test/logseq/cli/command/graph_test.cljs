(ns logseq.cli.command.graph-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.cli.command.graph :as graph-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-graph-validate-result
  (let [graph-validate-result #'graph-command/graph-validate-result
        invalid-result (graph-validate-result {:errors [{:entity {:db/id 1}
                                                        :errors {:foo ["bad"]}}]})
        valid-result (graph-validate-result {:errors nil :datom-count 10})]
    (is (= :error (:status invalid-result)))
    (is (= :graph-validation-failed (get-in invalid-result [:error :code])))
    (is (string/includes? (get-in invalid-result [:error :message])
                          "Found 1 entity with errors:"))
    (is (= :ok (:status valid-result)))))

(deftest test-execute-graph-info-queries-kv-rows-with-thread-api-q
  (async done
         (let [invoke-calls* (atom [])
               action {:repo "demo-repo"
                       :graph "demo-graph"}]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _]
                                                           (p/resolved {:base-url "http://example"}))
                               transport/invoke (fn [_ method _ args]
                                                  (swap! invoke-calls* conj [method args])
                                                  (p/resolved [[:logseq.kv/schema-version 7]
                                                               [:logseq.kv/graph-created-at 40000]
                                                               [:logseq.kv/db-type :sqlite]]))]
                 (p/let [result (graph-command/execute-graph-info action {})]
                   (is (= :ok (:status result)))
                   (is (= 1 (count @invoke-calls*)))
                   (let [[method [repo query-args]] (first @invoke-calls*)]
                     (is (= :thread-api/q method))
                     (is (= "demo-repo" repo))
                     (is (= 1 (count query-args)))
                     (is (string/includes? (pr-str (first query-args)) "logseq.kv")))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-graph-info-preserves-summary-fields-and-builds-kv-map
  (async done
         (let [action {:repo "demo-repo"
                       :graph "demo-graph"}]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _]
                                                           (p/resolved {:base-url "http://example"}))
                               transport/invoke (fn [_ method _ _]
                                                  (case method
                                                    :thread-api/q
                                                    (p/resolved [[:logseq.kv/db-type :sqlite]
                                                                 [:logseq.kv/graph-created-at 40000]
                                                                 [:logseq.kv/schema-version 7]])
                                                    (throw (ex-info "unexpected invoke method" {:method method}))))]
                 (p/let [result (graph-command/execute-graph-info action {})]
                   (is (= :ok (:status result)))
                   (is (= "demo-graph" (get-in result [:data :graph])))
                   (is (= 40000 (get-in result [:data :logseq.kv/graph-created-at])))
                   (is (= 7 (get-in result [:data :logseq.kv/schema-version])))
                   (is (= {"logseq.kv/db-type" :sqlite
                           "logseq.kv/graph-created-at" 40000
                           "logseq.kv/schema-version" 7}
                          (get-in result [:data :kv])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))
