(ns logseq.cli.integration-test
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.db-worker-node :as db-worker-node]
            [logseq.cli.main :as cli-main]
            [promesa.core :as p]
            ["fs" :as fs]
            ["path" :as node-path]))

(defn- run-cli
  [args url cfg-path]
  (let [args-with-output (if (some #{"--output"} args)
                           args
                           (concat args ["--output" "json"]))]
    (cli-main/run! (vec (concat args-with-output ["--base-url" url "--config" cfg-path]))
                   {:exit? false})))

(defn- parse-json-output
  [result]
  (js->clj (js/JSON.parse (:output result)) :keywordize-keys true))

(defn- parse-edn-output
  [result]
  (reader/read-string (:output result)))

(deftest test-cli-graph-list
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [daemon (db-worker-node/start-daemon! {:host "127.0.0.1"
                                                        :port 0
                                                        :data-dir data-dir})
                  url (str "http://127.0.0.1:" (:port daemon))
                  cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  result (run-cli ["graph" "list"] url cfg-path)
                  payload (parse-json-output result)]
            (is (= 0 (:exit-code result)))
            (is (= "ok" (:status payload)))
            (is (contains? payload :data))
            (p/let [_ ((:stop! daemon))]
              (done)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-cli-graph-create-and-info
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [daemon (db-worker-node/start-daemon! {:host "127.0.0.1"
                                                        :port 0
                                                        :data-dir data-dir})
                  url (str "http://127.0.0.1:" (:port daemon))
                  cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  _ (fs/writeFileSync cfg-path "{}")
                  create-result (run-cli ["graph" "create" "--graph" "demo-graph"] url cfg-path)
                  create-payload (parse-json-output create-result)
                  info-result (run-cli ["graph" "info"] url cfg-path)
                  info-payload (parse-json-output info-result)]
            (is (= 0 (:exit-code create-result)))
            (is (= "ok" (:status create-payload)))
            (is (= 0 (:exit-code info-result)))
            (is (= "ok" (:status info-payload)))
            (is (= "demo-graph" (get-in info-payload [:data :graph])))
            (p/let [_ ((:stop! daemon))]
              (done)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-cli-add-search-tree-remove
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [daemon (db-worker-node/start-daemon! {:host "127.0.0.1"
                                                        :port 0
                                                        :data-dir data-dir})
                  url (str "http://127.0.0.1:" (:port daemon))
                  cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  _ (fs/writeFileSync cfg-path "{}")
                  _ (run-cli ["graph" "create" "--graph" "content-graph"] url cfg-path)
                  add-result (run-cli ["block" "add" "--page" "TestPage" "--content" "hello world"] url cfg-path)
                  _ (parse-json-output add-result)
                  search-result (run-cli ["block" "search" "--text" "hello world"] url cfg-path)
                  search-payload (parse-json-output search-result)
                  tree-result (run-cli ["block" "tree" "--page" "TestPage" "--format" "json"] url cfg-path)
                  tree-payload (parse-json-output tree-result)
                  block-uuid (get-in tree-payload [:data :root :children 0 :uuid])
                  remove-result (run-cli ["block" "remove" "--block" (str block-uuid)] url cfg-path)
                  remove-payload (parse-json-output remove-result)]
            (is (= 0 (:exit-code add-result)))
            (is (= "ok" (:status search-payload)))
            (is (seq (get-in search-payload [:data :results])))
            (is (= "ok" (:status tree-payload)))
            (is (= "ok" (:status remove-payload)))
            (p/let [_ ((:stop! daemon))]
              (done)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-cli-output-formats-graph-list
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [daemon (db-worker-node/start-daemon! {:host "127.0.0.1"
                                                        :port 0
                                                        :data-dir data-dir})
                  url (str "http://127.0.0.1:" (:port daemon))
                  cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  json-result (run-cli ["graph" "list" "--output" "json"] url cfg-path)
                  json-payload (parse-json-output json-result)
                  edn-result (run-cli ["graph" "list" "--output" "edn"] url cfg-path)
                  edn-payload (parse-edn-output edn-result)
                  human-result (run-cli ["graph" "list" "--output" "human"] url cfg-path)]
            (is (= 0 (:exit-code json-result)))
            (is (= "ok" (:status json-payload)))
            (is (= 0 (:exit-code edn-result)))
            (is (= :ok (:status edn-payload)))
            (is (not (string/starts-with? (:output human-result) "{:status")))
            (p/let [_ ((:stop! daemon))]
              (done)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))
