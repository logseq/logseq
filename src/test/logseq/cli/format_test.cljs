(ns logseq.cli.format-test
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.format :as format]
            [logseq.cli.style :as style]))

(deftest test-format-success
  (testing "json output via output-format"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:output-format :json})]
      (is (= "{\"status\":\"ok\",\"data\":{\"message\":\"ok\"}}" result))))

  (testing "edn output via output-format"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:output-format :edn})]
      (is (= "{:status :ok, :data {:message \"ok\"}}" result))))

  (testing "human output (default)"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:output-format nil})]
      (is (= "ok" result)))))

(deftest test-format-ignores-legacy-json-flag
  (testing "json? flag does not override output-format"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:output-format nil
                                        :json? true})]
      (is (= "ok" result)))))

(deftest test-format-error
  (testing "json error via output-format"
    (let [result (format/format-result {:status :error :error {:code :boom :message "nope"}}
                                       {:output-format :json})]
      (is (= "{\"status\":\"error\",\"error\":{\"code\":\"boom\",\"message\":\"nope\"}}" result))))

  (testing "edn error via output-format"
    (let [result (format/format-result {:status :error :error {:code :boom :message "nope"}}
                                       {:output-format :edn})]
      (is (= "{:status :error, :error {:code :boom, :message \"nope\"}}" result))))

  (testing "human error (default)"
    (let [result (format/format-result {:status :error :error {:code :boom :message "nope"}}
                                       {:output-format nil})]
      (is (= "Error (boom): nope" result)))))

(deftest test-human-output-list-page
  (testing "list page renders a table with count"
    (let [result (format/format-result {:status :ok
                                        :command :list-page
                                        :data {:items [{:db/id 1
                                                        :title "Alpha"
                                                        :updated-at 90000
                                                        :created-at 40000}]}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (= (str "ID  TITLE  UPDATED-AT  CREATED-AT\n"
                  "1   Alpha  10s ago     1m ago\n"
                  "Count: 1")
             result)))))

(deftest test-human-output-list-tag-property
  (testing "list tag uses ID column from :db/id"
    (let [result (format/format-result {:status :ok
                                        :command :list-tag
                                        :data {:items [{:block/title "Tag"
                                                        :db/id 42
                                                        :block/created-at 40000
                                                        :block/updated-at 90000
                                                        :db/ident :logseq.class/Tag}]}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (= (str "ID  TITLE  IDENT              UPDATED-AT  CREATED-AT\n"
                  "42  Tag    :logseq.class/Tag  10s ago     1m ago\n"
                  "Count: 1")
             result))))

  (testing "list property uses ID column from :db/id"
    (let [result (format/format-result {:status :ok
                                        :command :list-property
                                        :data {:items [{:block/title "Prop"
                                                        :db/id 99
                                                        :block/created-at 40000
                                                        :block/updated-at 90000}]}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (= (str "ID  TITLE  UPDATED-AT  CREATED-AT\n"
                  "99  Prop   10s ago     1m ago\n"
                  "Count: 1")
             result)))))

(deftest test-human-output-add-remove
  (testing "add block renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :add-block
                                        :context {:repo "demo-repo"
                                                  :blocks ["a" "b"]}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Added blocks: 2 (repo: demo-repo)" result))))

  (testing "remove page renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :remove
                                        :context {:repo "demo-repo"
                                                  :page "Home"}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Removed page: Home (repo: demo-repo)" result))))

  (testing "update block renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :update-block
                                        :context {:repo "demo-repo"
                                                  :source "source-uuid"
                                                  :target "target-uuid"
                                                  :update-tags ["TagA"]
                                                  :update-properties {:logseq.property/publishing-public? true}
                                                  :remove-tags ["TagB"]
                                                  :remove-properties [:logseq.property/deadline]}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Updated block: source-uuid -> target-uuid (repo: demo-repo, tags:+1, properties:+1, remove-tags:+1, remove-properties:+1)" result))))

  (testing "update without move target renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :update-block
                                        :context {:repo "demo-repo"
                                                  :source "source-uuid"
                                                  :update-tags ["TagA"]}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Updated block: source-uuid (repo: demo-repo, tags:+1)" result)))))

(deftest test-human-output-graph-import-export
  (testing "graph export renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :graph-export
                                        :context {:export-type "edn"
                                                  :output "/tmp/export.edn"}}
                                       {:output-format nil})]
      (is (= "Exported edn to /tmp/export.edn" result))))

  (testing "graph import renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :graph-import
                                        :context {:import-type "sqlite"
                                                  :input "/tmp/import.sqlite"}}
                                       {:output-format nil})]
      (is (= "Imported sqlite from /tmp/import.sqlite" result)))))

(deftest test-human-output-graph-info
  (testing "graph info includes key metadata lines"
    (let [result (format/format-result {:status :ok
                                        :command :graph-info
                                        :data {:graph "demo-graph"
                                               :logseq.kv/graph-created-at 40000
                                               :logseq.kv/schema-version 2}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (= (str "Graph: demo-graph\n"
                  "Created at: 1m ago\n"
                  "Schema version: 2")
             result)))))

(deftest test-human-output-server-status
  (testing "server status includes repo, status, host, port"
    (let [result (format/format-result {:status :ok
                                        :command :server-status
                                        :data {:repo "logseq_db_demo-repo"
                                               :status :ready
                                               :host "127.0.0.1"
                                               :port 1234}}
                                       {:output-format nil})]
      (is (= (str "Server ready: demo-repo\n"
                  "Host: 127.0.0.1  Port: 1234")
             result)))))

(deftest test-human-output-show
  (testing "show renders text payloads directly"
    (let [result (format/format-result {:status :ok
                                        :command :show
                                        :data {:message "Line 1\nLine 2"}}
                                       {:output-format nil})]
      (is (= "Line 1\nLine 2" result)))))

(deftest test-human-output-query-results
  (testing "scalar id collections preserve EDN formatting"
    (let [result (format/format-result {:status :ok
                                        :command :query
                                        :data {:result [1 2 3]}}
                                       {:output-format nil})]
      (is (= "[1 2 3]" result))))

  (testing "non-scalar collections preserve EDN formatting"
    (let [value [{:db/id 1 :block/title "Alpha"}
                 {:db/id 2 :block/title "Beta"}]
          result (format/format-result {:status :ok
                                        :command :query
                                        :data {:result value}}
                                       {:output-format nil})]
      (is (= (pr-str value) result))))

  (testing "mixed scalar collections preserve EDN formatting"
    (let [value [1 "two" 3]
          result (format/format-result {:status :ok
                                        :command :query
                                        :data {:result value}}
                                       {:output-format nil})]
      (is (= (pr-str value) result))))

  (testing "nil results render as nil"
    (let [result (format/format-result {:status :ok
                                        :command :query
                                        :data {:result nil}}
                                       {:output-format nil})]
      (is (= "nil" result)))))

(deftest test-human-output-show-styled-prefixes
  (testing "show preserves styled status and tags in human output"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/title "Child"
                                              :logseq.property/status {:db/ident :logseq.property/status.todo
                                                                       :block/title "TODO"}
                                              :block/tags [{:block/title "TagA"}]}]}}
          styled (binding [style/*color-enabled?* true]
                   (tree->text tree-data))
          result (format/format-result {:status :ok
                                        :command :show
                                        :data {:message styled}}
                                       {:output-format nil})
          styled-todo (binding [style/*color-enabled?* true]
                        (style/bold (style/yellow "TODO")))
          styled-tag (binding [style/*color-enabled?* true]
                       (style/bold "#TagA"))]
      (is (string/includes? result styled-todo))
      (is (string/includes? result styled-tag))
      (is (= (str "1 Root\n"
                  "2 └── TODO Child #TagA")
             (style/strip-ansi result))))))

(deftest test-human-output-show-styled-property-keys
  (testing "show preserves styled property keys in human output"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/title "Child"
                                              :user.property/acceptance-criteria ["One" "Two"]}
                                             {:db/id 3
                                              :block/title "Sibling"}]}
                     :property-titles {:user.property/acceptance-criteria "Acceptance Criteria"}}
          styled (binding [style/*color-enabled?* true]
                   (tree->text tree-data))
          result (format/format-result {:status :ok
                                        :command :show
                                        :data {:message styled}}
                                       {:output-format nil})]
      (is (re-find #"\u001b\[[0-9;]*mAcceptance Criteria\u001b\[[0-9;]*m" result))
      (is (not (re-find #"\u001b\[[0-9;]*m- One\u001b\[[0-9;]*m" result)))
      (is (not (re-find #"\u001b\[[0-9;]*m- Two\u001b\[[0-9;]*m" result)))
      (is (= (str "1 Root\n"
                  "2 ├── Child\n"
                  "  │   Acceptance Criteria:\n"
                  "  │     - One\n"
                  "  │     - Two\n"
                  "3 └── Sibling")
             (style/strip-ansi result))))))

(deftest test-human-output-show-preserves-styling
  (testing "show returns styled text without stripping ANSI"
    (let [tree->text #'show-command/tree->text
          tree-data {:root {:db/id 1
                            :block/title "Root"
                            :block/children [{:db/id 2
                                              :block/title "Child"}]}}
          styled (binding [style/*color-enabled?* true]
                   (tree->text tree-data))
          result (format/format-result {:status :ok
                                        :command :show
                                        :data {:message styled}}
                                       {:output-format nil})]
      (is (= styled result))
      (is (re-find #"\u001b\[[0-9;]*m" result)))))

(deftest test-show-json-edn-output-ignores-styled-message
  (testing "show json/edn outputs serialize data without ANSI styling"
    (let [tree-data {:root {:db/id 1
                            :block/title "Root"}}
          json-result (format/format-result {:status :ok
                                             :command :show
                                             :data tree-data}
                                            {:output-format :json})
          edn-result (format/format-result {:status :ok
                                            :command :show
                                            :data tree-data}
                                           {:output-format :edn})]
      (is (string/includes? json-result "\"root\""))
      (is (string/includes? edn-result ":root"))
      (is (not (re-find #"\u001b\[[0-9;]*m" json-result)))
      (is (not (re-find #"\u001b\[[0-9;]*m" edn-result))))))

(deftest test-human-output-query
  (testing "query renders raw result"
    (let [result (format/format-result {:status :ok
                                        :command :query
                                        :data {:result [[1] [2] [3]]}}
                                       {:output-format nil})]
      (is (= "[[1] [2] [3]]" result)))))

(deftest test-human-output-query-list
  (testing "query list renders a table with count"
    (let [result (format/format-result {:status :ok
                                        :command :query-list
                                        :data {:queries [{:name "block-search"
                                                          :inputs ["search-title"]
                                                          :doc "Find blocks"
                                                          :source :built-in}]}}
                                       {:output-format nil})]
      (is (= (str "NAME          INPUTS        SOURCE    DOC\n"
                  "block-search  search-title  built-in  Find blocks\n"
                  "Count: 1")
             result)))))

(deftest test-human-output-error-formatting
  (testing "errors include code and hint when available"
    (let [result (format/format-result {:status :error
                                        :command :graph-create
                                        :error {:code :missing-graph
                                                :message "graph name is required"}}
                                       {:output-format nil})]
      (is (= (str "Error (missing-graph): graph name is required\n"
                  "Hint: Use --repo <name>")
             result)))))

(deftest test-human-output-doctor
  (testing "doctor renders concise check summary"
    (let [result (format/format-result {:status :ok
                                        :command :doctor
                                        :data {:status :warning
                                               :checks [{:id :db-worker-script
                                                         :status :ok
                                                         :message "Found readable file: /tmp/db-worker-node.js"}
                                                        {:id :data-dir
                                                         :status :ok
                                                         :message "Read/write access confirmed: /tmp/logseq/graphs"}
                                                        {:id :running-servers
                                                         :status :warning
                                                         :message "1 server is still starting"}]}}
                                       {:output-format nil})]
      (is (= (str "Doctor: warning\n"
                  "[ok] db-worker-script - Found readable file: /tmp/db-worker-node.js\n"
                  "[ok] data-dir - Read/write access confirmed: /tmp/logseq/graphs\n"
                  "[warning] running-servers - 1 server is still starting")
             result)))))

(deftest test-doctor-json-edn-output
  (testing "doctor json and edn keep structured checks for failed runs"
    (let [payload {:checks [{:id :db-worker-script
                             :status :ok
                             :message "Found readable file: /tmp/db-worker-node.js"}
                            {:id :data-dir
                             :status :error
                             :code :data-dir-permission
                             :message "data-dir is not readable/writable: /tmp/logseq"}]}
          json-result (format/format-result {:status :error
                                             :command :doctor
                                             :error {:code :data-dir-permission
                                                     :message "data-dir check failed"}
                                             :data payload}
                                            {:output-format :json})
          edn-result (format/format-result {:status :error
                                            :command :doctor
                                            :error {:code :data-dir-permission
                                                    :message "data-dir check failed"}
                                            :data payload}
                                           {:output-format :edn})
          parsed-json (js->clj (js/JSON.parse json-result) :keywordize-keys true)
          parsed-edn (reader/read-string edn-result)]
      (is (= "error" (:status parsed-json)))
      (is (= "data-dir-permission" (get-in parsed-json [:error :code])))
      (is (= "data-dir" (get-in parsed-json [:data :checks 1 :id])))
      (is (= "error" (get-in parsed-json [:data :checks 1 :status])))
      (is (= :error (:status parsed-edn)))
      (is (= :data-dir-permission (get-in parsed-edn [:error :code])))
      (is (= :data-dir (get-in parsed-edn [:data :checks 1 :id])))
      (is (= :error (get-in parsed-edn [:data :checks 1 :status]))))))
