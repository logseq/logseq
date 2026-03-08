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

(deftest test-format-graph-validation
  (testing "graph validation success prints validated"
    (let [result (format/format-result {:status :ok
                                        :command :graph-validate
                                        :context {:graph "foo"}
                                        :data {:result {:errors nil}}}
                                       {:output-format nil})]
      (is (= "Validated graph \"foo\"" result))))
  (testing "graph validation error prints validation details without extra prefix"
    (let [result (format/format-result {:status :error
                                        :command :graph-validate
                                        :error {:code :graph-validation-failed
                                                :message "Found 1 entity with errors:\n({:entity {:db/id 1}})\n"}}
                                       {:output-format nil})]
      (is (= "Found 1 entity with errors:\n({:entity {:db/id 1}})\n" result)))))

(deftest test-human-output-graph-list
  (testing "graph list without current graph shows plain list"
    (let [result (format/format-result {:status :ok
                                        :command :graph-list
                                        :data {:graphs ["alpha" "beta"]}}
                                       {:output-format nil})]
      (is (= (str "alpha\n"
                  "beta\n"
                  "Count: 2")
             result))))

  (testing "graph list with current graph marks it with * and indents others"
    (let [result (format/format-result {:status :ok
                                        :command :graph-list
                                        :data {:graphs ["alpha" "beta" "gamma"]}}
                                       {:output-format nil
                                        :graph "beta"})]
      (is (= (str "  alpha\n"
                  "* beta\n"
                  "  gamma\n"
                  "Count: 3")
             result)))))

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
                                                        :logseq.property/type :node
                                                        :block/created-at 40000
                                                        :block/updated-at 90000}]}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (= (str "ID  TITLE  TYPE  UPDATED-AT  CREATED-AT\n"
                  "99  Prop   node  10s ago     1m ago\n"
                  "Count: 1")
             result))))

  (testing "list property renders missing type as -"
    (let [result (format/format-result {:status :ok
                                        :command :list-property
                                        :data {:items [{:block/title "Untyped"
                                                        :db/id 100
                                                        :block/created-at 40000
                                                        :block/updated-at 90000}]}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (= (str "ID   TITLE    TYPE  UPDATED-AT  CREATED-AT\n"
                  "100  Untyped  -     10s ago     1m ago\n"
                  "Count: 1")
             result)))))

(deftest test-human-output-add-upsert-remove
  (testing "upsert block renders ids in two lines"
    (let [result (format/format-result {:status :ok
                                        :command :upsert-block
                                        :context {:repo "demo-repo"
                                                  :blocks ["a" "b"]}
                                        :data {:result [201 202]}}
                                       {:output-format nil})]
      (is (= "Upserted blocks:\n[201 202]" result))))

  (testing "upsert page renders ids in two lines"
    (let [result (format/format-result {:status :ok
                                        :command :upsert-page
                                        :context {:repo "demo-repo"
                                                  :page "Home"}
                                        :data {:result [123]}}
                                       {:output-format nil})]
      (is (= "Upserted page:\n[123]" result))))

  (testing "upsert tag renders ids in two lines"
    (let [result (format/format-result {:status :ok
                                        :command :upsert-tag
                                        :context {:repo "demo-repo"
                                                  :name "Quote"}
                                        :data {:result [321]}}
                                       {:output-format nil})]
      (is (= "Upserted tag:\n[321]" result))))

  (testing "upsert property renders ids in two lines"
    (let [result (format/format-result {:status :ok
                                        :command :upsert-property
                                        :context {:repo "demo-repo"
                                                  :name "owner"}
                                        :data {:result [654]}}
                                       {:output-format nil})]
      (is (= "Upserted property:\n[654]" result))))

  (testing "remove page renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :remove-page
                                        :context {:repo "demo-repo"
                                                  :name "Home"}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Removed page: Home (repo: demo-repo)" result))))

  (testing "remove block with id list renders block count"
    (let [result (format/format-result {:status :ok
                                        :command :remove-block
                                        :context {:repo "demo-repo"
                                                  :ids [1 2 3]}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Removed blocks: 3 (repo: demo-repo)" result))))

  (testing "remove tag renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :remove-tag
                                        :context {:repo "demo-repo"
                                                  :name "Quote"}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Removed tag: Quote (repo: demo-repo)" result))))

  (testing "remove property renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :remove-property
                                        :context {:repo "demo-repo"
                                                  :name "owner"}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Removed property: owner (repo: demo-repo)" result))))

  (testing "upsert block update mode renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :upsert-block
                                        :context {:repo "demo-repo"
                                                  :source "source-uuid"
                                                  :target "target-uuid"
                                                  :update-tags ["TagA"]
                                                  :update-properties {:logseq.property/publishing-public? true}
                                                  :remove-tags ["TagB"]
                                                  :remove-properties [:logseq.property/deadline]}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Upserted block: source-uuid -> target-uuid (repo: demo-repo, tags:+1, properties:+1, remove-tags:+1, remove-properties:+1)" result))))

  (testing "upsert block update without move target renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :upsert-block
                                        :context {:repo "demo-repo"
                                                  :source "source-uuid"
                                                  :update-tags ["TagA"]}
                                        :data {:result {:ok true}}}
                                       {:output-format nil})]
      (is (= "Upserted block: source-uuid (repo: demo-repo, tags:+1)" result)))))

(deftest test-human-output-graph-import-export
  (testing "graph export renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :graph-export
                                        :context {:export-type "edn"
                                                  :file "/tmp/export.edn"}}
                                       {:output-format nil})]
      (is (= "Exported edn to /tmp/export.edn" result))))

  (testing "graph import renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :graph-import
                                        :context {:import-type "sqlite"
                                                  :input "/tmp/import.sqlite"}}
                                       {:output-format nil})]
      (is (= "Imported sqlite from /tmp/import.sqlite" result)))))

(deftest test-human-output-sync-status
  (testing "sync status renders runtime and queue fields"
    (let [result (format/format-result {:status :ok
                                        :command :sync-status
                                        :data {:repo "demo-graph"
                                               :graph-id "graph-uuid"
                                               :ws-state :open
                                               :pending-local 2
                                               :pending-asset 1
                                               :pending-server 3
                                               :local-tx 10
                                               :remote-tx 13}}
                                       {:output-format nil})]
      (is (string/includes? result "Sync status"))
      (is (string/includes? result "demo-graph"))
      (is (string/includes? result "graph-uuid"))
      (is (string/includes? result "pending-local"))
      (is (string/includes? result "pending-asset"))
      (is (string/includes? result "pending-server"))))

  (testing "sync status renders last error diagnostic when present"
    (let [result (format/format-result {:status :ok
                                        :command :sync-status
                                        :data {:repo "demo-graph"
                                               :graph-id "graph-uuid"
                                               :ws-state :open
                                               :pending-local 2
                                               :pending-asset 1
                                               :pending-server 3
                                               :local-tx 10
                                               :remote-tx 13
                                               :last-error {:code :decrypt-aes-key
                                                            :message "decrypt-aes-key"}}}
                                       {:output-format nil})]
      (is (string/includes? result "last-error"))
      (is (string/includes? result "decrypt-aes-key")))))

(deftest test-human-output-sync-remote-graphs
  (testing "sync remote-graphs renders a table"
    (let [result (format/format-result {:status :ok
                                        :command :sync-remote-graphs
                                        :data {:graphs [{:graph-id "graph-1"
                                                         :graph-name "Alpha"
                                                         :role "manager"
                                                         :graph-e2ee? true}
                                                        {:graph-id "graph-2"
                                                         :graph-name "Beta"
                                                         :role "member"
                                                         :graph-e2ee? false}]}}
                                       {:output-format nil})]
      (is (string/includes? result "GRAPH-ID"))
      (is (string/includes? result "GRAPH-NAME"))
      (is (string/includes? result "ROLE"))
      (is (string/includes? result "Alpha"))
      (is (string/includes? result "Beta"))
      (is (string/includes? result "Count: 2")))))

(deftest test-human-output-sync-actions
  (testing "sync start renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :sync-start
                                        :context {:repo "demo-graph"}}
                                       {:output-format nil})]
      (is (string/includes? result "Sync started"))
      (is (string/includes? result "demo-graph"))))

  (testing "sync upload renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :sync-upload
                                        :context {:repo "demo-graph"}
                                        :data {:graph-id "graph-uuid"}}
                                       {:output-format nil})]
      (is (string/includes? result "Sync upload"))
      (is (string/includes? result "demo-graph"))))

  (testing "sync download renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :sync-download
                                        :context {:repo "demo-graph"}}
                                       {:output-format nil})]
      (is (string/includes? result "Sync download"))
      (is (string/includes? result "demo-graph")))))

(deftest test-human-output-sync-config-get-e2ee-password-redaction
  (testing "sync config get e2ee-password redacts value in human output"
    (let [password "super-secret-password"
          result (format/format-result {:status :ok
                                        :command :sync-config-get
                                        :data {:key :e2ee-password
                                               :value password}}
                                       {:output-format nil})]
      (is (string/includes? result "e2ee-password"))
      (is (string/includes? result "[REDACTED]"))
      (is (not (string/includes? result password))))))

(deftest test-human-output-auth-commands
  (testing "login human output reports auth path and user metadata without tokens"
    (let [token "secret-token-value"
          result (format/format-result {:status :ok
                                        :command :login
                                        :data {:auth-path "/tmp/auth.json"
                                               :email "user@example.com"
                                               :sub "user-123"
                                               :authorize-url "https://example.com/oauth2/authorize?..."
                                               :id-token token}}
                                       {:output-format nil})]
      (is (string/includes? result "Login successful"))
      (is (string/includes? result "user@example.com"))
      (is (string/includes? result "/tmp/auth.json"))
      (is (not (string/includes? result token)))))

  (testing "logout human output reports whether auth was removed"
    (let [result (format/format-result {:status :ok
                                        :command :logout
                                        :data {:auth-path "/tmp/auth.json"
                                               :deleted? true
                                               :opened? true
                                               :logout-completed? true}}
                                       {:output-format nil})]
      (is (string/includes? result "Logged out"))
      (is (string/includes? result "/tmp/auth.json"))
      (is (string/includes? result "Cognito logout: completed"))))

  (testing "logout human output is still successful when auth file is absent"
    (let [result (format/format-result {:status :ok
                                        :command :logout
                                        :data {:auth-path "/tmp/auth.json"
                                               :deleted? false
                                               :opened? true
                                               :logout-completed? true}}
                                       {:output-format nil})]
      (is (string/includes? result "Already logged out"))
      (is (string/includes? result "/tmp/auth.json"))
      (is (string/includes? result "Cognito logout: completed")))))

(deftest test-human-output-graph-info
  (testing "graph info includes key metadata lines and kv section"
    (let [result (format/format-result {:status :ok
                                        :command :graph-info
                                        :data {:graph "demo-graph"
                                               :logseq.kv/graph-created-at 40000
                                               :logseq.kv/schema-version 2
                                               :kv {"logseq.kv/db-type" :sqlite
                                                    "logseq.kv/graph-created-at" 40000
                                                    "logseq.kv/schema-version" 2}}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (= (str "Graph: demo-graph\n"
                  "Created at: 1m ago\n"
                  "Schema version: 2\n"
                  "KV:\n"
                  "  logseq.kv/db-type: :sqlite\n"
                  "  logseq.kv/graph-created-at: 40000\n"
                  "  logseq.kv/schema-version: 2")
             result)))))

(deftest test-human-output-graph-info-kv-ordering
  (testing "graph info kv section is sorted by ident key"
    (let [result (format/format-result {:status :ok
                                        :command :graph-info
                                        :data {:graph "demo-graph"
                                               :kv {"logseq.kv/schema-version" 2
                                                    "logseq.kv/db-type" :sqlite
                                                    "logseq.kv/graph-created-at" 40000}}}
                                       {:output-format nil
                                        :now-ms 100000})
          idx-db-type (.indexOf result "logseq.kv/db-type")
          idx-created (.indexOf result "logseq.kv/graph-created-at")
          idx-schema (.indexOf result "logseq.kv/schema-version")]
      (is (>= idx-db-type 0))
      (is (< idx-db-type idx-created))
      (is (< idx-created idx-schema)))))

(deftest test-human-output-graph-info-kv-redaction
  (testing "graph info redacts sensitive kv values in human output"
    (let [token "secret-token-value"
          result (format/format-result {:status :ok
                                        :command :graph-info
                                        :data {:graph "demo-graph"
                                               :kv {"logseq.kv/api-token" token
                                                    "logseq.kv/db-type" :sqlite}}}
                                       {:output-format nil})]
      (is (string/includes? result "logseq.kv/api-token"))
      (is (string/includes? result "[REDACTED]"))
      (is (not (string/includes? result token))))))

(deftest test-human-output-graph-info-kv-truncates-long-strings
  (testing "graph info truncates long string kv values in human output"
    (let [long-text (apply str (repeat 180 "a"))
          result (format/format-result {:status :ok
                                        :command :graph-info
                                        :data {:graph "demo-graph"
                                               :kv {"logseq.kv/runtime-metadata" long-text}}}
                                       {:output-format nil})]
      (is (string/includes? result "... [truncated]"))
      (is (not (string/includes? result long-text))))))

(deftest test-machine-output-graph-info-kv-structure
  (testing "graph info json output includes kv map"
    (let [result (format/format-result {:status :ok
                                        :command :graph-info
                                        :data {:graph "demo-graph"
                                               :kv {"logseq.kv/db-type" :sqlite
                                                    "logseq.kv/schema-version" 2}}}
                                       {:output-format :json})
          parsed (js->clj (js/JSON.parse result) :keywordize-keys true)]
      (is (= "ok" (:status parsed)))
      (is (= "demo-graph" (get-in parsed [:data :graph])))
      (is (= "sqlite" (get-in parsed [:data :kv :logseq.kv/db-type])))
      (is (= 2 (get-in parsed [:data :kv :logseq.kv/schema-version])))))

  (testing "graph info edn output includes kv map"
    (let [result (format/format-result {:status :ok
                                        :command :graph-info
                                        :data {:graph "demo-graph"
                                               :kv {"logseq.kv/db-type" :sqlite
                                                    "logseq.kv/schema-version" 2}}}
                                       {:output-format :edn})
          parsed (reader/read-string result)]
      (is (= :ok (:status parsed)))
      (is (= "demo-graph" (get-in parsed [:data :graph])))
      (is (= :sqlite (get-in parsed [:data :kv "logseq.kv/db-type"])))
      (is (= 2 (get-in parsed [:data :kv "logseq.kv/schema-version"]))))))

(deftest test-machine-output-graph-info-kv-redaction
  (testing "graph info redacts sensitive kv values in json and edn output"
    (let [token "my-secret-token"
          json-result (format/format-result {:status :ok
                                             :command :graph-info
                                             :data {:graph "demo-graph"
                                                    :kv {"logseq.kv/api-token" token
                                                         "logseq.kv/db-type" :sqlite}}}
                                            {:output-format :json})
          json-parsed (js->clj (js/JSON.parse json-result) :keywordize-keys true)
          edn-result (format/format-result {:status :ok
                                            :command :graph-info
                                            :data {:graph "demo-graph"
                                                   :kv {"logseq.kv/api-token" token
                                                        "logseq.kv/db-type" :sqlite}}}
                                           {:output-format :edn})
          edn-parsed (reader/read-string edn-result)]
      (is (= "[REDACTED]" (get-in json-parsed [:data :kv :logseq.kv/api-token])))
      (is (= "[REDACTED]" (get-in edn-parsed [:data :kv "logseq.kv/api-token"])))
      (is (not (string/includes? json-result token)))
      (is (not (string/includes? edn-result token))))))

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
             result))))

  (testing "server status strips only one leading db prefix and keeps middle substrings"
    (let [double-prefixed (format/format-result {:status :ok
                                                 :command :server-status
                                                 :data {:repo "logseq_db_logseq_db_demo"
                                                        :status :ready}}
                                                {:output-format nil})
          middle-substring (format/format-result {:status :ok
                                                  :command :server-status
                                                 :data {:repo "my_logseq_db_notes"
                                                         :status :ready}}
                                                 {:output-format nil})]
      (is (= "Server ready: logseq_db_demo" double-prefixed))
      (is (= "Server ready: my_logseq_db_notes" middle-substring)))))

(deftest test-json-output-normalizes-graph-fields-with-single-leading-strip-only
  (let [result (format/format-result {:status :ok
                                      :data {:repo "logseq_db_logseq_db_demo"
                                             :graph "my_logseq_db_notes"
                                             :graphs ["logseq_db_logseq_db_demo"
                                                      "my_logseq_db_notes"]}}
                                     {:output-format :edn})
        parsed (reader/read-string result)]
    (is (= "logseq_db_demo" (get-in parsed [:data :repo])))
    (is (= "my_logseq_db_notes" (get-in parsed [:data :graph])))
    (is (= ["logseq_db_demo" "my_logseq_db_notes"]
           (get-in parsed [:data :graphs])))))

(deftest test-human-output-server-list-includes-owner
  (testing "server list shows owner column and value"
    (let [result (format/format-result {:status :ok
                                        :command :server-list
                                        :data {:servers [{:repo "demo-repo"
                                                          :status :ready
                                                          :host "127.0.0.1"
                                                          :port 1234
                                                          :pid 9876
                                                          :owner-source :cli}]}}
                                       {:output-format nil})]
      (is (= (str "GRAPH      STATUS  HOST       PORT  PID   OWNER\n"
                  "demo-repo  :ready  127.0.0.1  1234  9876  :cli\n"
                  "Count: 1")
             result))))

  (testing "server list falls back to placeholder when owner is missing"
    (let [result (format/format-result {:status :ok
                                        :command :server-list
                                        :data {:servers [{:repo "demo-repo"
                                                          :status :ready
                                                          :host "127.0.0.1"
                                                          :port 1234
                                                          :pid 9876}]}}
                                       {:output-format nil})]
      (is (= (str "GRAPH      STATUS  HOST       PORT  PID   OWNER\n"
                  "demo-repo  :ready  127.0.0.1  1234  9876  -\n"
                  "Count: 1")
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
                  "Hint: Use --graph <name>")
             result))))

  (testing "owner mismatch includes ownership hint"
    (let [result (format/format-result {:status :error
                                        :command :server-stop
                                        :error {:code :server-owned-by-other
                                                :message "server is owned by another process"}}
                                       {:output-format nil})]
      (is (= (str "Error (server-owned-by-other): server is owned by another process\n"
                  "Hint: Retry from the process owner that started the server")
             result))))

  (testing "orphan timeout includes recovery hint"
    (let [result (format/format-result {:status :error
                                        :command :server-start
                                        :error {:code :server-start-timeout-orphan
                                                :message "db-worker-node failed to create lock"}}
                                       {:output-format nil})]
      (is (= (str "Error (server-start-timeout-orphan): db-worker-node failed to create lock\n"
                  "Hint: Check and stop lingering db-worker-node processes, then retry")
             result))))

  (testing "remove tag ambiguity includes candidate list"
    (let [result (format/format-result {:status :error
                                        :command :remove-tag
                                        :error {:code :ambiguous-tag-name
                                                :message "multiple tags match name: Quote"
                                                :candidates [{:id 1 :name "Quote"}
                                                             {:id 2 :name "QUOTE"}]}}
                                       {:output-format nil})]
      (is (string/includes? result "Error (ambiguous-tag-name):"))
      (is (string/includes? result "multiple tags match name: Quote"))
      (is (string/includes? result "1"))
      (is (string/includes? result "2"))
      (is (string/includes? result "Quote"))
      (is (string/includes? result "QUOTE")))))

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
