(ns logseq.cli.format-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.format :as format]))

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
                                        :command :remove-page
                                        :context {:repo "demo-repo"
                                                  :page "Home"}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Removed page: Home (repo: demo-repo)" result)))))

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
                                        :data {:repo "demo-repo"
                                               :status :ready
                                               :host "127.0.0.1"
                                               :port 1234}}
                                       {:output-format nil})]
      (is (= (str "Server ready: demo-repo\n"
                  "Host: 127.0.0.1  Port: 1234")
             result)))))

(deftest test-human-output-search-and-show
  (testing "search renders a table with count"
    (let [result (format/format-result {:status :ok
                                        :command :search
                                        :data {:results [{:type "page"
                                                         :title "Alpha"
                                                         :uuid "u1"
                                                         :updated-at 3
                                                         :created-at 1}
                                                        {:type "block"
                                                         :content "Note"
                                                         :uuid "u2"
                                                         :updated-at 4
                                                         :created-at 2}
                                                        {:type "tag"
                                                         :title "Taggy"
                                                         :uuid "u3"}
                                                        {:type "property"
                                                         :title "Prop"
                                                         :uuid "u4"}]}}
                                       {:output-format nil})]
      (is (= (str "TYPE      TITLE/CONTENT  UUID  UPDATED-AT  CREATED-AT\n"
                  "page      Alpha          u1    3           1\n"
                  "block     Note           u2    4           2\n"
                  "tag       Taggy          u3    -           -\n"
                  "property  Prop           u4    -           -\n"
                  "Count: 4")
             result))))

  (testing "show renders text payloads directly"
    (let [result (format/format-result {:status :ok
                                        :command :show
                                        :data {:message "Line 1\nLine 2"}}
                                       {:output-format nil})]
      (is (= "Line 1\nLine 2" result)))))

(deftest test-human-output-error-formatting
  (testing "errors include code and hint when available"
    (let [result (format/format-result {:status :error
                                        :command :graph-create
                                        :error {:code :missing-graph
                                                :message "graph name is required"}}
                                       {:output-format nil})]
      (is (= (str "Error (missing-graph): graph name is required\n"
                  "Hint: Use --graph <name>")
             result)))))
