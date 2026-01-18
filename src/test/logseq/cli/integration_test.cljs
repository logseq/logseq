(ns logseq.cli.integration-test
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.main :as cli-main]
            [promesa.core :as p]
            ["fs" :as fs]
            ["path" :as node-path]))

(defn- run-cli
  [args data-dir cfg-path]
  (let [args-with-output (if (some #{"--output"} args)
                           args
                           (concat args ["--output" "json"]))
        global-opts ["--data-dir" data-dir "--config" cfg-path]
        final-args (vec (concat global-opts args-with-output))]
    (-> (cli-main/run! final-args {:exit? false})
        (p/then (fn [result]
                  (let [res (if (map? result)
                              result
                              (js->clj result :keywordize-keys true))]
                    res))))))

(defn- parse-json-output
  [result]
  (js->clj (js/JSON.parse (:output result)) :keywordize-keys true))

(defn- parse-edn-output
  [result]
  (reader/read-string (:output result)))

(deftest test-cli-graph-list
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  result (run-cli ["graph" "list"] data-dir cfg-path)
                  payload (parse-json-output result)]
            (is (= 0 (:exit-code result)))
            (is (= "ok" (:status payload)))
            (is (contains? payload :data))
            (done))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-cli-graph-create-and-info
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  _ (fs/writeFileSync cfg-path "{:output-format :json}")
                  create-result (run-cli ["graph" "create" "--repo" "demo-graph"] data-dir cfg-path)
                  create-payload (parse-json-output create-result)
                  info-result (run-cli ["graph" "info"] data-dir cfg-path)
                  info-payload (parse-json-output info-result)
                  stop-result (run-cli ["server" "stop" "--repo" "demo-graph"] data-dir cfg-path)
                  stop-payload (parse-json-output stop-result)]
            (is (= 0 (:exit-code create-result)))
            (is (= "ok" (:status create-payload)))
            (is (= 0 (:exit-code info-result)))
            (is (= "ok" (:status info-payload)))
            (is (= "demo-graph" (get-in info-payload [:data :graph])))
            (is (= 0 (:exit-code stop-result)))
            (is (= "ok" (:status stop-payload)))
            (done))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-cli-list-add-search-show-remove
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  _ (fs/writeFileSync cfg-path "{:output-format :json}")
                  _ (run-cli ["graph" "create" "--repo" "content-graph"] data-dir cfg-path)
                  add-page-result (run-cli ["add" "page" "--page" "TestPage"] data-dir cfg-path)
                  add-page-payload (parse-json-output add-page-result)
                  list-page-result (run-cli ["list" "page"] data-dir cfg-path)
                  list-page-payload (parse-json-output list-page-result)
                  list-tag-result (run-cli ["list" "tag"] data-dir cfg-path)
                  list-tag-payload (parse-json-output list-tag-result)
                  list-property-result (run-cli ["list" "property"] data-dir cfg-path)
                  list-property-payload (parse-json-output list-property-result)
                  add-block-result (run-cli ["add" "block" "--page" "TestPage" "--content" "hello world"] data-dir cfg-path)
                  _ (parse-json-output add-block-result)
                  search-result (run-cli ["search" "--text" "hello world" "--include-content"] data-dir cfg-path)
                  search-payload (parse-json-output search-result)
                  show-result (run-cli ["show" "--page-name" "TestPage" "--format" "json"] data-dir cfg-path)
                  show-payload (parse-json-output show-result)
                  remove-page-result (run-cli ["remove" "page" "--page" "TestPage"] data-dir cfg-path)
                  remove-page-payload (parse-json-output remove-page-result)
                  stop-result (run-cli ["server" "stop" "--repo" "content-graph"] data-dir cfg-path)
                  stop-payload (parse-json-output stop-result)]
            (is (= 0 (:exit-code add-page-result)))
            (is (= "ok" (:status add-page-payload)))
            (is (= "ok" (:status list-page-payload)))
            (is (vector? (get-in list-page-payload [:data :items])))
            (is (= "ok" (:status list-tag-payload)))
            (is (vector? (get-in list-tag-payload [:data :items])))
            (is (= "ok" (:status list-property-payload)))
            (is (vector? (get-in list-property-payload [:data :items])))
            (is (= "ok" (:status search-payload)))
            (is (vector? (get-in search-payload [:data :results])))
            (is (= "ok" (:status show-payload)))
            (is (contains? (get-in show-payload [:data :root]) :uuid))
            (is (= "ok" (:status remove-page-payload)))
            (is (= "ok" (:status stop-payload)))
            (done))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-cli-output-formats-graph-list
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  json-result (run-cli ["graph" "list" "--output" "json"] data-dir cfg-path)
                  json-payload (parse-json-output json-result)
                  edn-result (run-cli ["graph" "list" "--output" "edn"] data-dir cfg-path)
                  edn-payload (parse-edn-output edn-result)
                  human-result (run-cli ["graph" "list" "--output" "human"] data-dir cfg-path)]
            (is (= 0 (:exit-code json-result)))
            (is (= "ok" (:status json-payload)))
            (is (= 0 (:exit-code edn-result)))
            (is (= :ok (:status edn-payload)))
            (is (not (string/starts-with? (:output human-result) "{:status")))
            (done))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-cli-list-outputs-include-id
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  _ (fs/writeFileSync cfg-path "{:output-format :json}")
                  _ (run-cli ["graph" "create" "--repo" "list-id-graph"] data-dir cfg-path)
                  _ (run-cli ["add" "page" "--page" "TestPage"] data-dir cfg-path)
                  list-page-result (run-cli ["list" "page"] data-dir cfg-path)
                  list-page-payload (parse-json-output list-page-result)
                  list-tag-result (run-cli ["list" "tag"] data-dir cfg-path)
                  list-tag-payload (parse-json-output list-tag-result)
                  list-property-result (run-cli ["list" "property"] data-dir cfg-path)
                  list-property-payload (parse-json-output list-property-result)
                  stop-result (run-cli ["server" "stop" "--repo" "list-id-graph"] data-dir cfg-path)
                  stop-payload (parse-json-output stop-result)]
            (is (= "ok" (:status list-page-payload)))
            (is (every? #(contains? % :id) (get-in list-page-payload [:data :items])))
            (is (= "ok" (:status list-tag-payload)))
            (is (every? #(contains? % :id) (get-in list-tag-payload [:data :items])))
            (is (= "ok" (:status list-property-payload)))
            (is (every? #(contains? % :id) (get-in list-property-payload [:data :items])))
            (is (= "ok" (:status stop-payload)))
            (done))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-cli-list-page-human-output
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  _ (fs/writeFileSync cfg-path "{:output-format :json}")
                  _ (run-cli ["graph" "create" "--repo" "human-list-graph"] data-dir cfg-path)
                  _ (run-cli ["add" "page" "--page" "TestPage"] data-dir cfg-path)
                  list-page-result (run-cli ["list" "page" "--output" "human"] data-dir cfg-path)
                  output (:output list-page-result)]
            (is (= 0 (:exit-code list-page-result)))
            (is (string/includes? output "TITLE"))
            (is (string/includes? output "TestPage"))
            (is (string/includes? output "Count:"))
            (done))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest test-cli-show-page-block-by-id-and-uuid
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker")]
      (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                  _ (fs/writeFileSync cfg-path "{:output-format :json}")
                  _ (run-cli ["graph" "create" "--repo" "show-page-block-graph"] data-dir cfg-path)
                  _ (run-cli ["add" "page" "--page" "TestPage"] data-dir cfg-path)
                  list-page-result (run-cli ["list" "page" "--expand"] data-dir cfg-path)
                  list-page-payload (parse-json-output list-page-result)
                  page-item (some (fn [item]
                                    (when (= "TestPage" (or (:block/title item) (:title item)))
                                      item))
                                  (get-in list-page-payload [:data :items]))
                  page-id (or (:db/id page-item) (:id page-item))
                  page-uuid (or (:block/uuid page-item) (:uuid page-item))
                  show-by-id-result (run-cli ["show" "--id" (str page-id) "--format" "json"] data-dir cfg-path)
                  show-by-id-payload (parse-json-output show-by-id-result)
                  show-by-uuid-result (run-cli ["show" "--uuid" (str page-uuid) "--format" "json"] data-dir cfg-path)
                  show-by-uuid-payload (parse-json-output show-by-uuid-result)
                  stop-result (run-cli ["server" "stop" "--repo" "show-page-block-graph"] data-dir cfg-path)
                  stop-payload (parse-json-output stop-result)]
            (is (= "ok" (:status list-page-payload)))
            (is (some? page-item))
            (is (some? page-id))
            (is (some? page-uuid))
            (is (= "ok" (:status show-by-id-payload)))
            (is (= (str page-uuid) (str (or (get-in show-by-id-payload [:data :root :uuid])
                                            (get-in show-by-id-payload [:data :root :block/uuid])))))
            (is (= "ok" (:status show-by-uuid-payload)))
            (is (= (str page-uuid) (str (or (get-in show-by-uuid-payload [:data :root :uuid])
                                            (get-in show-by-uuid-payload [:data :root :block/uuid])))))
            (is (= "ok" (:status stop-payload)))
            (done))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))
