(ns logseq.cli.integration-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.main :as cli-main]
            [promesa.core :as p]))

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

(defn- node-title
  [node]
  (or (:block/title node) (:block/content node) (:title node) (:content node)))

(defn- node-uuid
  [node]
  (or (:block/uuid node) (:uuid node)))

(defn- node-children
  [node]
  (or (:block/children node) (:children node)))

(defn- find-block-by-title
  [node title]
  (when node
    (if (= title (node-title node))
      node
      (some #(find-block-by-title % title) (node-children node)))))

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

(deftest test-cli-list-add-show-remove
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "content-graph"] data-dir cfg-path)
                       add-page-result (run-cli ["--repo" "content-graph" "add" "page" "--page" "TestPage"] data-dir cfg-path)
                       add-page-payload (parse-json-output add-page-result)
                       list-page-result (run-cli ["--repo" "content-graph" "list" "page"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       list-tag-result (run-cli ["--repo" "content-graph" "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       list-property-result (run-cli ["--repo" "content-graph" "list" "property"] data-dir cfg-path)
                       list-property-payload (parse-json-output list-property-result)
                       add-block-result (run-cli ["--repo" "content-graph" "add" "block" "--target-page-name" "TestPage" "--content" "Test block"] data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       _ (p/delay 100)
                       show-result (run-cli ["--repo" "content-graph" "show" "--page-name" "TestPage" "--format" "json"] data-dir cfg-path)
                       show-payload (parse-json-output show-result)
                       remove-page-result (run-cli ["--repo" "content-graph" "remove" "page" "--page" "TestPage"] data-dir cfg-path)
                       remove-page-payload (parse-json-output remove-page-result)
                       stop-result (run-cli ["server" "stop" "--repo" "content-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code add-page-result)))
                 (is (= "ok" (:status add-page-payload)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (= "ok" (:status list-page-payload)))
                 (is (vector? (get-in list-page-payload [:data :items])))
                 (is (= "ok" (:status list-tag-payload)))
                 (is (vector? (get-in list-tag-payload [:data :items])))
                 (is (= "ok" (:status list-property-payload)))
                 (is (vector? (get-in list-property-payload [:data :items])))
                 (is (= "ok" (:status show-payload)))
                 (is (contains? (get-in show-payload [:data :root]) :uuid))
                 (is (= "ok" (:status remove-page-payload)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-query
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-query")
               query-text "[:find ?e :in $ ?title :where [?e :block/title ?title]]"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                  create-result (run-cli ["graph" "create" "--repo" "query-graph"] data-dir cfg-path)
                  create-payload (parse-json-output create-result)
                  _ (run-cli ["--repo" "query-graph" "add" "page" "--page" "QueryPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "query-graph" "add" "block" "--target-page-name" "QueryPage" "--content" "Query block"] data-dir cfg-path)
                       _ (run-cli ["--repo" "query-graph" "add" "block" "--target-page-name" "QueryPage" "--content" "Query block"] data-dir cfg-path)
                       _ (p/delay 100)
                       query-result (run-cli ["--repo" "query-graph"
                                              "query"
                                              "--query" query-text
                                              "--inputs" "[\"Query block\"]"]
                                             data-dir cfg-path)
                       query-payload (parse-json-output query-result)
                       result (get-in query-payload [:data :result])
                       stop-result (run-cli ["server" "stop" "--repo" "query-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status create-payload)))
                 (is (= 0 (:exit-code query-result)))
                 (is (= "ok" (:status query-payload)))
                 (is (vector? result))
                 (is (= 2 (count result)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-query-task-search
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-task-query")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--repo" "task-query-graph"] data-dir cfg-path)
                       create-payload (parse-json-output create-result)
                       _ (run-cli ["--repo" "task-query-graph" "add" "page" "--page" "Tasks"] data-dir cfg-path)
                       _ (run-cli ["--repo" "task-query-graph"
                                   "add" "block"
                                   "--target-page-name" "Tasks"
                                   "--content" "Task one"
                                   "--status" "doing"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "task-query-graph"
                                   "add" "block"
                                   "--target-page-name" "Tasks"
                                   "--content" "Task two"
                                   "--status" "doing"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "task-query-graph"
                                   "add" "block"
                                   "--target-page-name" "Tasks"
                                   "--content" "Task three"
                                   "--status" "todo"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       list-result (run-cli ["query" "list"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       task-entry (some (fn [entry]
                                          (when (= "task-search" (:name entry)) entry))
                                        (get-in list-payload [:data :queries]))
                       query-result (run-cli ["--repo" "task-query-graph"
                                              "query"
                                              "--name" "task-search"
                                              "--inputs" "[\"doing\"]"]
                                             data-dir cfg-path)
                       query-payload (parse-json-output query-result)
                       query-nil-result (run-cli ["--repo" "task-query-graph"
                                                  "query"
                                                  "--name" "task-search"
                                                  "--inputs" "[\"doing\" nil 1]"]
                                                 data-dir cfg-path)
                       query-nil-payload (parse-json-output query-nil-result)
                       result (get-in query-payload [:data :result])
                       nil-result (get-in query-nil-payload [:data :result])
                       stop-result (run-cli ["server" "stop" "--repo" "task-query-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status create-payload)))
                 (is (= "ok" (:status list-payload)))
                 (is (= [{:name "search-status"}
                         {:name "?search-title" :default ""}
                         {:name "?recent-days" :default 0}]
                        (:inputs task-entry)))
                 (is (= 0 (:exit-code query-result)))
                 (is (= "ok" (:status query-payload)))
                 (is (vector? result))
                 (is (= 2 (count result)))
                 (is (= 0 (:exit-code query-nil-result)))
                 (is (= "ok" (:status query-nil-payload)))
                 (is (vector? nil-result))
                 (is (= 2 (count nil-result)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-show-resolve-nested-uuid-refs
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-nested-refs")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "nested-refs"] data-dir cfg-path)
                       _ (run-cli ["--repo" "nested-refs" "add" "page" "--page" "NestedPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "nested-refs" "add" "block" "--target-page-name" "NestedPage" "--content" "Inner"] data-dir cfg-path)
                       show-inner (run-cli ["--repo" "nested-refs" "show" "--page-name" "NestedPage" "--format" "json"] data-dir cfg-path)
                       show-inner-payload (parse-json-output show-inner)
                       inner-node (find-block-by-title (get-in show-inner-payload [:data :root]) "Inner")
                       inner-uuid (node-uuid inner-node)
                       _ (run-cli ["--repo" "nested-refs" "add" "block" "--target-page-name" "NestedPage"
                                   "--content" (str "See [[" inner-uuid "]]")] data-dir cfg-path)
                       show-middle (run-cli ["--repo" "nested-refs" "show" "--page-name" "NestedPage" "--format" "json"] data-dir cfg-path)
                       show-middle-payload (parse-json-output show-middle)
                       middle-node (find-block-by-title (get-in show-middle-payload [:data :root]) "See [[Inner]]")
                       middle-uuid (node-uuid middle-node)
                       _ (run-cli ["--repo" "nested-refs" "add" "block" "--target-page-name" "NestedPage"
                                   "--content" (str "Outer [[" middle-uuid "]]")] data-dir cfg-path)
                       show-outer (run-cli ["--repo" "nested-refs" "show" "--page-name" "NestedPage" "--format" "json"] data-dir cfg-path)
                       show-outer-payload (parse-json-output show-outer)
                       outer-node (find-block-by-title (get-in show-outer-payload [:data :root]) "Outer [[See [[Inner]]]]")
                       stop-result (run-cli ["server" "stop" "--repo" "nested-refs"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (some? inner-uuid))
                 (is (some? middle-uuid))
                 (is (some? outer-node))
                 (is (= "Outer [[See [[Inner]]]]" (node-title outer-node)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-show-linked-references-json
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-linked-refs")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "linked-refs-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "page" "--page" "TargetPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "page" "--page" "SourcePage"] data-dir cfg-path)
                       target-show-before (run-cli ["--repo" "linked-refs-graph" "show" "--page-name" "TargetPage" "--format" "json"] data-dir cfg-path)
                       target-before-payload (parse-json-output target-show-before)
                       target-uuid (or (get-in target-before-payload [:data :root :block/uuid])
                                       (get-in target-before-payload [:data :root :uuid]))
                       target-title (or (get-in target-before-payload [:data :root :block/title])
                                        (get-in target-before-payload [:data :root :block/name])
                                        "TargetPage")
                       ref-content (str "See [[" target-uuid "]]")
                       ref-title (str "See [[" target-title "]]")
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "block" "--target-page-name" "SourcePage" "--content" ref-content] data-dir cfg-path)
                       source-show (run-cli ["--repo" "linked-refs-graph" "show" "--page-name" "SourcePage" "--format" "json"] data-dir cfg-path)
                       source-payload (parse-json-output source-show)
                       ref-node (find-block-by-title (get-in source-payload [:data :root]) ref-title)
                       ref-uuid (or (:block/uuid ref-node) (:uuid ref-node))
                       target-show (run-cli ["--repo" "linked-refs-graph" "show" "--page-name" "TargetPage" "--format" "json"] data-dir cfg-path)
                       target-payload (parse-json-output target-show)
                       linked-refs (get-in target-payload [:data :linked-references])
                       linked-blocks (:blocks linked-refs)
                       linked-uuids (set (map (fn [block]
                                                (or (:block/uuid block) (:uuid block)))
                                              linked-blocks))
                       linked-page-titles (set (keep (fn [block]
                                                       (or (get-in block [:block/page :block/title])
                                                           (get-in block [:block/page :block/name])
                                                           (get-in block [:page :title])
                                                           (get-in block [:page :name])))
                                                     linked-blocks))
                       stop-result (run-cli ["server" "stop" "--repo" "linked-refs-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (some? target-uuid))
                 (is (= "ok" (:status target-payload)))
                 (is (some? ref-uuid))
                 (is (contains? linked-uuids ref-uuid))
                 (is (contains? linked-page-titles "SourcePage"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-move-block
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-move")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "move-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "move-graph" "add" "page" "--page" "SourcePage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "move-graph" "add" "page" "--page" "TargetPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "move-graph" "add" "block" "--target-page-name" "SourcePage" "--content" "Parent Block"] data-dir cfg-path)
                       source-show (run-cli ["--repo" "move-graph" "show" "--page-name" "SourcePage" "--format" "json"] data-dir cfg-path)
                       source-payload (parse-json-output source-show)
                       parent-node (find-block-by-title (get-in source-payload [:data :root]) "Parent Block")
                       parent-uuid (or (:block/uuid parent-node) (:uuid parent-node))
                       _ (run-cli ["--repo" "move-graph" "add" "block" "--target-uuid" (str parent-uuid) "--content" "Child Block"] data-dir cfg-path)
                       move-result (run-cli ["--repo" "move-graph" "move" "--uuid" (str parent-uuid) "--target-page-name" "TargetPage"] data-dir cfg-path)
                       move-payload (parse-json-output move-result)
                       target-show (run-cli ["--repo" "move-graph" "show" "--page-name" "TargetPage" "--format" "json"] data-dir cfg-path)
                       target-payload (parse-json-output target-show)
                       moved-node (find-block-by-title (get-in target-payload [:data :root]) "Parent Block")
                       child-node (find-block-by-title moved-node "Child Block")
                       stop-result (run-cli ["server" "stop" "--repo" "move-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status move-payload)))
                 (is (some? parent-uuid))
                 (is (some? moved-node))
                 (is (some? child-node))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-add-block-pos-ordering
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-add-pos")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "add-pos-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "add-pos-graph" "add" "page" "--page" "PosPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "add-pos-graph" "add" "block" "--target-page-name" "PosPage" "--content" "Parent"] data-dir cfg-path)
                       parent-show (run-cli ["--repo" "add-pos-graph" "show" "--page-name" "PosPage" "--format" "json"] data-dir cfg-path)
                       parent-payload (parse-json-output parent-show)
                       parent-node (find-block-by-title (get-in parent-payload [:data :root]) "Parent")
                       parent-uuid (or (:block/uuid parent-node) (:uuid parent-node))
                       _ (run-cli ["--repo" "add-pos-graph" "add" "block" "--target-uuid" (str parent-uuid) "--pos" "first-child" "--content" "First"] data-dir cfg-path)
                       _ (run-cli ["--repo" "add-pos-graph" "add" "block" "--target-uuid" (str parent-uuid) "--pos" "last-child" "--content" "Last"] data-dir cfg-path)
                       final-show (run-cli ["--repo" "add-pos-graph" "show" "--page-name" "PosPage" "--format" "json"] data-dir cfg-path)
                       final-payload (parse-json-output final-show)
                       final-parent (find-block-by-title (get-in final-payload [:data :root]) "Parent")
                       child-titles (map node-title (node-children final-parent))
                       stop-result (run-cli ["server" "stop" "--repo" "add-pos-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (some? parent-uuid))
                 (is (= ["First" "Last"] (vec child-titles)))
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

(deftest test-cli-show-multi-id
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-multi-id")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "show-multi-id-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "show-multi-id-graph" "add" "page" "--page" "MultiPage"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "show-multi-id-graph" "add" "block"
                                   "--target-page-name" "MultiPage"
                                   "--content" "Multi show one"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "show-multi-id-graph" "add" "block"
                                   "--target-page-name" "MultiPage"
                                   "--content" "Multi show two"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       query-text "[:find ?e . :in $ ?title :where [?e :block/title ?title]]"
                       query-one-result (run-cli ["--repo" "show-multi-id-graph" "query"
                                                  "--query" query-text
                                                  "--inputs" (pr-str ["Multi show one"])]
                                                 data-dir cfg-path)
                       query-one-payload (parse-json-output query-one-result)
                       block-one-id (get-in query-one-payload [:data :result])
                       query-two-result (run-cli ["--repo" "show-multi-id-graph" "query"
                                                  "--query" query-text
                                                  "--inputs" (pr-str ["Multi show two"])]
                                                 data-dir cfg-path)
                       query-two-payload (parse-json-output query-two-result)
                       block-two-id (get-in query-two-payload [:data :result])
                       ids-edn (str "[" block-one-id " " block-two-id "]")
                       show-text-result (run-cli ["--repo" "show-multi-id-graph" "show"
                                                  "--id" ids-edn
                                                  "--format" "text"
                                                  "--output" "human"]
                                                 data-dir cfg-path)
                       output (:output show-text-result)
                       idx-one (string/index-of output "Multi show one")
                       idx-two (string/index-of output "Multi show two")
                       idx-delim (string/index-of output "================================================================")
                       show-json-result (run-cli ["--repo" "show-multi-id-graph" "show"
                                                  "--id" ids-edn
                                                  "--format" "json"]
                                                 data-dir cfg-path)
                       show-json-payload (parse-json-output show-json-result)
                       show-data (:data show-json-payload)
                       root-titles (set (map (comp node-title :root) show-data))
                       stop-result (run-cli ["server" "stop" "--repo" "show-multi-id-graph"]
                                            data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code query-one-result)))
                 (is (= "ok" (:status query-one-payload)))
                 (is (= 0 (:exit-code query-two-result)))
                 (is (= "ok" (:status query-two-payload)))
                 (is (some? block-one-id))
                 (is (some? block-two-id))
                 (is (= 0 (:exit-code show-text-result)))
                 (is (string/includes? output "Multi show one"))
                 (is (string/includes? output "Multi show two"))
                 (is (some? idx-delim))
                 (is (< idx-one idx-delim idx-two))
                 (is (= 0 (:exit-code show-json-result)))
                 (is (= "ok" (:status show-json-payload)))
                 (is (vector? show-data))
                 (is (= 2 (count show-data)))
                 (is (contains? root-titles "Multi show one"))
                 (is (contains? root-titles "Multi show two"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-query-human-output-pipes-to-show
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-query-pipe")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "query-pipe-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "query-pipe-graph" "add" "page" "--page" "PipePage"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "query-pipe-graph" "add" "block"
                                   "--target-page-name" "PipePage"
                                   "--content" "Pipe One"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "query-pipe-graph" "add" "block"
                                   "--target-page-name" "PipePage"
                                   "--content" "Pipe Two"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       query-text (str "[:find [?e ...]"
                                       " :in $ ?q"
                                       " :where"
                                       " [?e :block/title ?title]"
                                       " [(clojure.string/includes? ?title ?q)]]")
                       query-result (run-cli ["--repo" "query-pipe-graph"
                                              "--output" "human"
                                              "query"
                                              "--query" query-text
                                              "--inputs" (pr-str ["Pipe"])]
                                             data-dir cfg-path)
                       ids-edn (string/trim (:output query-result))
                       show-json-result (run-cli ["--repo" "query-pipe-graph" "show"
                                                  "--id" ids-edn
                                                  "--format" "json"]
                                                 data-dir cfg-path)
                       show-json-payload (parse-json-output show-json-result)
                       show-data (:data show-json-payload)
                       root-titles (set (map (comp node-title :root) show-data))
                       stop-result (run-cli ["server" "stop" "--repo" "query-pipe-graph"]
                                            data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code query-result)))
                 (is (seq ids-edn))
                 (is (= 0 (:exit-code show-json-result)))
                 (is (= "ok" (:status show-json-payload)))
                 (is (vector? show-data))
                 (is (contains? root-titles "Pipe One"))
                 (is (contains? root-titles "Pipe Two"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-show-linked-references
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-linked-refs")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "linked-refs-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "page" "--page" "TargetPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "page" "--page" "SourcePage"] data-dir cfg-path)
                       list-page-result (run-cli ["--repo" "linked-refs-graph" "list" "page" "--expand"]
                                                 data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       page-item (some (fn [item]
                                         (when (= "TargetPage" (or (:block/title item) (:title item)))
                                           item))
                                       (get-in list-page-payload [:data :items]))
                       page-id (or (:db/id page-item) (:id page-item))
                       blocks-edn (str "[{:block/title \"Ref to TargetPage\" :block/refs [{:db/id " page-id "}]}]")
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "block" "--target-page-name" "SourcePage"
                                   "--blocks" blocks-edn] data-dir cfg-path)
                       show-result (run-cli ["--repo" "linked-refs-graph" "show" "--page-name" "TargetPage" "--format" "json"]
                                            data-dir cfg-path)
                       show-payload (parse-json-output show-result)
                       linked (get-in show-payload [:data :linked-references])
                       ref-block (first (:blocks linked))
                       stop-result (run-cli ["server" "stop" "--repo" "linked-refs-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status show-payload)))
                 (is (some? page-id))
                 (is (map? linked))
                 (is (pos? (:count linked)))
                 (is (seq (:blocks linked)))
                 (is (some? ref-block))
                 (is (some? (or (:block/uuid ref-block) (:uuid ref-block))))
                 (is (some? (or (get-in ref-block [:page :title])
                                (get-in ref-block [:page :name]))))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-graph-export-import-edn
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-export-edn")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       export-graph "export-edn-graph"
                       import-graph "import-edn-graph"
                       export-path (node-path/join (node-helper/create-tmp-dir "exports") "graph.edn")
                       _ (run-cli ["graph" "create" "--repo" export-graph] data-dir cfg-path)
                       _ (run-cli ["--repo" export-graph "add" "page" "--page" "ExportPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" export-graph "add" "block" "--target-page-name" "ExportPage" "--content" "Export content"] data-dir cfg-path)
                       export-result (run-cli ["--repo" export-graph
                                               "graph" "export"
                                               "--type" "edn"
                                               "--output" export-path] data-dir cfg-path)
                       export-payload (parse-json-output export-result)
                       _ (run-cli ["--repo" import-graph
                                   "graph" "import"
                                   "--type" "edn"
                                   "--input" export-path] data-dir cfg-path)
                       list-result (run-cli ["--repo" import-graph "list" "page"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       stop-export (run-cli ["server" "stop" "--repo" export-graph] data-dir cfg-path)
                       stop-import (run-cli ["server" "stop" "--repo" import-graph] data-dir cfg-path)]
                 (is (= 0 (:exit-code export-result)))
                 (is (= "ok" (:status export-payload)))
                 (is (fs/existsSync export-path))
                 (is (pos? (.-size (fs/statSync export-path))))
                 (is (= "ok" (:status list-payload)))
                 (is (some (fn [item]
                             (= "ExportPage" (or (:title item) (:block/title item))))
                           (get-in list-payload [:data :items])))
                 (is (= 0 (:exit-code stop-export)))
                 (is (= 0 (:exit-code stop-import)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-graph-export-import-sqlite
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-export-sqlite")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       export-graph "export-sqlite-graph"
                       import-graph "import-sqlite-graph"
                       export-path (node-path/join (node-helper/create-tmp-dir "exports") "graph.sqlite")
                       _ (run-cli ["graph" "create" "--repo" export-graph] data-dir cfg-path)
                       _ (run-cli ["--repo" export-graph "add" "page" "--page" "SQLiteExportPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" export-graph "add" "block" "--target-page-name" "SQLiteExportPage" "--content" "SQLite export content"] data-dir cfg-path)
                       export-result (run-cli ["--repo" export-graph
                                               "graph" "export"
                                               "--type" "sqlite"
                                               "--output" export-path] data-dir cfg-path)
                       export-payload (parse-json-output export-result)
                       _ (run-cli ["--repo" import-graph
                                   "graph" "import"
                                   "--type" "sqlite"
                                   "--input" export-path] data-dir cfg-path)
                       list-result (run-cli ["--repo" import-graph "list" "page"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       stop-export (run-cli ["server" "stop" "--repo" export-graph] data-dir cfg-path)
                       stop-import (run-cli ["server" "stop" "--repo" import-graph] data-dir cfg-path)]
                 (is (= 0 (:exit-code export-result)))
                 (is (= "ok" (:status export-payload)))
                 (is (fs/existsSync export-path))
                 (is (pos? (.-size (fs/statSync export-path))))
                 (is (= "ok" (:status list-payload)))
                 (is (some (fn [item]
                             (= "SQLiteExportPage" (or (:title item) (:block/title item))))
                           (get-in list-payload [:data :items])))
                 (is (= 0 (:exit-code stop-export)))
                 (is (= 0 (:exit-code stop-import)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))
