(ns logseq.cli.format-test
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.format :as format]
            [logseq.cli.style :as style]
            ["string-width" :default string-width]))

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

(deftest test-format-example-output
  (let [base-result {:status :ok
                     :command :example
                     :data {:selector "upsert"
                            :matched-commands ["upsert block" "upsert page"]
                            :examples ["logseq upsert block --graph my-graph --content \"hello\""
                                       "logseq upsert page --graph my-graph --page Home"]
                            :message "Found 2 examples for selector upsert"}}
        human-result (format/format-result base-result {:output-format nil})
        json-result (format/format-result base-result {:output-format :json})
        edn-result (format/format-result base-result {:output-format :edn})
        parsed-json (js->clj (js/JSON.parse json-result) :keywordize-keys true)
        parsed-edn (reader/read-string edn-result)]
    (testing "human output includes selector, matched commands and examples"
      (is (string/includes? human-result "Selector: upsert"))
      (is (string/includes? human-result "Matched commands:"))
      (is (string/includes? human-result "upsert block"))
      (is (string/includes? human-result "Examples:"))
      (is (string/includes? human-result "logseq upsert page --graph my-graph --page Home")))

    (testing "json output keeps required structured fields"
      (is (= "upsert" (get-in parsed-json [:data :selector])))
      (is (= ["upsert block" "upsert page"] (get-in parsed-json [:data :matched-commands])))
      (is (= "Found 2 examples for selector upsert" (get-in parsed-json [:data :message]))))

    (testing "edn output keeps required structured fields"
      (is (= "upsert" (get-in parsed-edn [:data :selector])))
      (is (= ["upsert block" "upsert page"] (get-in parsed-edn [:data :matched-commands])))
      (is (= "Found 2 examples for selector upsert" (get-in parsed-edn [:data :message]))))))

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
      (is (= "Error (boom): nope" result))))

  (testing "human error with hint from context"
    (let [result (format/format-result {:status :error
                                        :error {:code :missing-auth
                                                :message "missing auth"
                                                :context {:code :missing-auth
                                                          :hint "Run `logseq login` first."}}}
                                       {:output-format nil})]
      (is (= "Error (missing-auth): missing auth\nHint: Run `logseq login` first." result))))

  (testing "human error with hint directly on error map"
    (let [result (format/format-result {:status :error
                                        :error {:code :e2ee-password-not-found
                                                :message "e2ee-password not found"
                                                :hint "Provide --e2ee-password to verify and persist it."}}
                                       {:output-format nil})]
      (is (= "Error (e2ee-password-not-found): e2ee-password not found\nHint: Provide --e2ee-password to verify and persist it." result)))))

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
             result))))

  (testing "graph list marks legacy entries and prints rename guidance"
    (let [result (format/format-result {:status :ok
                                        :command :graph-list
                                        :data {:graphs ["alpha" "legacy/name" "mystery"]
                                               :graph-items [{:kind :canonical
                                                              :graph-name "alpha"
                                                              :graph-dir "alpha"}
                                                             {:kind :legacy
                                                              :legacy-dir "legacy++name"
                                                              :legacy-graph-name "legacy/name"
                                                              :target-graph-dir "legacy~2Fname"
                                                              :conflict? false}
                                                             {:kind :legacy-undecodable
                                                              :legacy-dir "mystery"
                                                              :reason :undecodable}]}}
                                       {:output-format nil
                                        :graph "legacy/name"
                                        :graphs-dir "/tmp/graphs"})]
      (is (string/includes? result "* legacy/name [legacy]"))
      (is (string/includes? result "mystery [legacy]"))
      (is (string/includes? result "Warning: 2 legacy graph directories detected."))
      (is (string/includes? result "mv '/tmp/graphs/legacy++name' '/tmp/graphs/legacy~2Fname'"))
      (is (string/includes? result "Warning: cannot derive graph name for legacy dir 'mystery'; rename command is not available."))))

  (testing "graph list rename suggestion targets canonical dir with literal spaces"
    (let [result (format/format-result {:status :ok
                                        :command :graph-list
                                        :data {:graphs ["space name"]
                                               :graph-items [{:kind :legacy
                                                              :legacy-dir "space~20name"
                                                              :legacy-graph-name "space name"
                                                              :target-graph-dir "space name"
                                                              :conflict? false}]}}
                                       {:output-format nil
                                        :graphs-dir "/tmp/graphs"})]
      (is (string/includes? result "mv '/tmp/graphs/space~20name' '/tmp/graphs/space name'"))))

  (testing "graph list conflict warning does not print mv command"
    (let [result (format/format-result {:status :ok
                                        :command :graph-list
                                        :data {:graphs ["legacy/name"]
                                               :graph-items [{:kind :legacy
                                                              :legacy-dir "legacy++name"
                                                              :legacy-graph-name "legacy/name"
                                                              :target-graph-dir "legacy~2Fname"
                                                              :conflict? true}]}}
                                       {:output-format nil
                                        :graphs-dir "/tmp/graphs"})]
      (is (string/includes? result "Warning: target directory already exists for legacy graph 'legacy/name'."))
      (is (not (string/includes? result "mv '/tmp/graphs/legacy++name' '/tmp/graphs/legacy~2Fname'")))))

  (testing "graph list rename command uses POSIX single-quote escaping"
    (let [result (format/format-result {:status :ok
                                        :command :graph-list
                                        :data {:graphs ["weird'name"]
                                               :graph-items [{:kind :legacy
                                                              :legacy-dir "weird'++name"
                                                              :legacy-graph-name "weird'/name"
                                                              :target-graph-dir "weird~27~2Fname"
                                                              :conflict? false}]}}
                                       {:output-format nil
                                        :graphs-dir "/tmp/graphs"})]
      (is (string/includes? result "mv '/tmp/graphs/weird'\"'\"'++name' '/tmp/graphs/weird~27~2Fname'"))))

  )

(deftest test-human-output-graph-list-count-grouping
  (let [graphs (mapv #(str "graph-" %) (range 1234))
        result (format/format-result {:status :ok
                                      :command :graph-list
                                      :data {:graphs graphs}}
                                     {:output-format nil})]
    (is (string/includes? result "Count: 1,234"))))

(deftest test-human-output-graph-list-legacy-warning-singular
  (let [result (format/format-result {:status :ok
                                      :command :graph-list
                                      :data {:graphs ["legacy/name"]
                                             :graph-items [{:kind :legacy
                                                            :legacy-dir "legacy++name"
                                                            :legacy-graph-name "legacy/name"
                                                            :target-graph-dir "legacy~2Fname"
                                                            :conflict? false}]}}
                                     {:output-format nil
                                      :graphs-dir "/tmp/graphs"})]
    (is (string/includes? result "Warning: 1 legacy graph directory detected."))))

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
      (is (= (str "ID  TITLE  UPDATED-AT      CREATED-AT\n"
                  "1   Alpha  10 seconds ago  1 minute ago\n"
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
      (is (= (str "ID  TITLE  IDENT              UPDATED-AT      CREATED-AT\n"
                  "42  Tag    :logseq.class/Tag  10 seconds ago  1 minute ago\n"
                  "Count: 1")
             result))))

  (testing "list property uses ID column from :db/id"
    (let [result (format/format-result {:status :ok
                                        :command :list-property
                                        :data {:items [{:block/title "Prop"
                                                        :db/id 99
                                                        :logseq.property/type :node
                                                        :db/cardinality :db.cardinality/many
                                                        :block/created-at 40000
                                                        :block/updated-at 90000}]}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (= (str "ID  TITLE  TYPE  CARDINALITY  UPDATED-AT      CREATED-AT\n"
                  "99  Prop   node  many         10 seconds ago  1 minute ago\n"
                  "Count: 1")
             result))))

  (testing "list property renders missing type as - and missing cardinality as one"
    (let [result (format/format-result {:status :ok
                                        :command :list-property
                                        :data {:items [{:block/title "Prop"
                                                        :db/id 99
                                                        :logseq.property/type :node
                                                        :db/cardinality :db.cardinality/many
                                                        :block/created-at 40000
                                                        :block/updated-at 90000}
                                                       {:block/title "Untyped"
                                                        :db/id 100
                                                        :block/created-at 40000
                                                        :block/updated-at 90000}]}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (= (str "ID   TITLE    TYPE  CARDINALITY  UPDATED-AT      CREATED-AT\n"
                  "99   Prop     node  many         10 seconds ago  1 minute ago\n"
                  "100  Untyped  -     one          10 seconds ago  1 minute ago\n"
                  "Count: 2")
             result)))))

(deftest test-human-output-list-task
  (let [result (format/format-result {:status :ok
                                      :command :list-task
                                      :data {:items [{:db/id 12
                                                      :block/title "Alpha task"
                                                      :logseq.property/status :logseq.property/status.todo
                                                      :logseq.property/priority :logseq.property/priority.high
                                                      :logseq.property/scheduled "2026-02-10T08:00:00.000Z"
                                                      :logseq.property/deadline "2026-02-12T18:00:00.000Z"
                                                      :block/created-at 40000
                                                      :block/updated-at 90000}]}}
                                     {:output-format nil
                                      :now-ms 100000})]
    (is (string/includes? result "STATUS"))
    (is (string/includes? result "PRIORITY"))
    (is (string/includes? result "SCHEDULED"))
    (is (string/includes? result "DEADLINE"))
    (is (string/includes? result "Alpha task"))
    (is (string/includes? result "Count: 1")))

  (testing "list task renders epoch-ms scheduled/deadline with humanized relative datetime"
    (let [now-ms 1000000000
          scheduled-ms (+ now-ms (* 3 60 60 1000))
          deadline-ms (- now-ms (* 2 24 60 60 1000))
          result (format/format-result {:status :ok
                                        :command :list-task
                                        :data {:items [{:db/id 226
                                                        :block/title "q3"
                                                        :logseq.property/status :logseq.property/status.todo
                                                        :logseq.property/priority :logseq.property/priority.high
                                                        :logseq.property/scheduled scheduled-ms
                                                        :logseq.property/deadline deadline-ms}]}}
                                       {:output-format nil
                                        :now-ms now-ms})]
      (is (string/includes? result "in "))
      (is (string/includes? result "ago"))
      (is (not (string/includes? result (str scheduled-ms))))
      (is (not (string/includes? result (str deadline-ms)))))))

(deftest test-human-output-list-node
  (let [result (format/format-result {:status :ok
                                      :command :list-node
                                      :data {:items [{:db/id 1
                                                      :block/title "Node Page"
                                                      :node/type "page"
                                                      :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                                                      :block/created-at 40000
                                                      :block/updated-at 90000}
                                                     {:db/id 2
                                                      :block/title "Node Block"
                                                      :node/type "block"
                                                      :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
                                                      :block/page-id 1
                                                      :block/page-title "Node Page"
                                                      :block/created-at 45000
                                                      :block/updated-at 95000}]}}
                                     {:output-format nil
                                      :now-ms 100000})]
    (is (string/includes? result "TYPE"))
    (is (string/includes? result "PAGE-ID"))
    (is (string/includes? result "PAGE-TITLE"))
    (is (not (string/includes? result "UUID")))
    (is (not (string/includes? result "11111111-1111-1111-1111-111111111111")))
    (is (string/includes? result "Node Page"))
    (is (string/includes? result "Node Block"))
    (is (string/includes? result "Count: 2"))))

(deftest test-human-output-list-asset
  (let [result (format/format-result {:status :ok
                                      :command :list-asset
                                      :data {:items [{:db/id 3
                                                      :block/title "Asset Node"
                                                      :logseq.property.asset/type "md"
                                                      :logseq.property.asset/size 2552
                                                      :block/created-at 40000
                                                      :block/updated-at 90000}]}}
                                     {:output-format nil
                                      :now-ms 100000})
        lines (string/split-lines result)
        header (first lines)]
    (is (string/includes? header "ID"))
    (is (string/includes? header "TITLE"))
    (is (string/includes? header "ASSET-TYPE"))
    (is (string/includes? header "SIZE"))
    (is (string/includes? header "UPDATED-AT"))
    (is (string/includes? header "CREATED-AT"))
    (is (string/includes? result "Asset Node"))
    (is (string/includes? result "md"))
    (is (not (string/includes? result "2552")))
    (is (some? (re-find #"\b2(\.\d+)?\s*[KM]i?B\b" result)))
    (is (not (string/includes? (first lines) " TYPE  ")))
    (is (not (string/includes? result "PAGE-ID")))
    (is (not (string/includes? result "PAGE-TITLE")))
    (is (string/includes? result "Count: 1"))))

(deftest test-human-output-list-title-max-display-width
  (doseq [[label command item]
          [["list page truncates title by configured display width"
            :list-page
            {:db/id 1
             :block/title "ABCDEFGH"
             :block/updated-at 90000
             :block/created-at 40000}]
           ["list tag truncates title by configured display width"
            :list-tag
            {:db/id 2
             :block/title "ABCDEFGH"
             :block/updated-at 90000
             :block/created-at 40000}]
           ["list property truncates title by configured display width"
            :list-property
            {:db/id 3
             :block/title "ABCDEFGH"
             :logseq.property/type :node
             :db/cardinality :db.cardinality/one
             :block/updated-at 90000
             :block/created-at 40000}]
           ["list task truncates title by configured display width"
            :list-task
            {:db/id 4
             :block/title "ABCDEFGH"
             :block/updated-at 90000
             :block/created-at 40000}]
           ["list node truncates title by configured display width"
            :list-node
            {:db/id 5
             :block/title "ABCDEFGH"
             :node/type "page"
             :block/updated-at 90000
             :block/created-at 40000}]
           ["list asset truncates title by configured display width"
            :list-asset
            {:db/id 6
             :block/title "ABCDEFGH"
             :logseq.property.asset/type "png"
             :logseq.property.asset/size 2048
             :block/updated-at 90000
             :block/created-at 40000}]]]
    (testing label
      (let [result (format/format-result {:status :ok
                                          :command command
                                          :data {:items [item]}}
                                         {:output-format nil
                                          :now-ms 100000
                                          :list-title-max-display-width 6})]
        (is (string/includes? result "ABCDE…"))
        (is (not (string/includes? result "ABCDEFGH")))))))

(deftest test-human-output-list-cjk-title-alignment
  (let [result (format/format-result {:status :ok
                                      :command :list-page
                                      :data {:items [{:db/id 1
                                                      :block/title "ABCD"
                                                      :block/updated-at 90000
                                                      :block/created-at 40000}
                                                     {:db/id 2
                                                      :block/title "你好"
                                                      :block/updated-at 90000
                                                      :block/created-at 40000}]}}
                                     {:output-format nil
                                      :now-ms 100000
                                      :list-title-max-display-width 10})
        lines (string/split-lines result)
        line-1 (nth lines 1)
        line-2 (nth lines 2)
        updated-at-idx-1 (.indexOf line-1 "10 seconds ago")
        updated-at-idx-2 (.indexOf line-2 "10 seconds ago")
        prefix-width-1 (string-width (subs line-1 0 updated-at-idx-1))
        prefix-width-2 (string-width (subs line-2 0 updated-at-idx-2))]
    (is (pos? updated-at-idx-1))
    (is (pos? updated-at-idx-2))
    (is (= prefix-width-1 prefix-width-2))))

(deftest test-human-output-search
  (testing "search block renders the list table contract"
    (let [result (format/format-result {:status :ok
                                        :command :search-block
                                        :data {:items [{:db/id 3
                                                        :block/title "Alpha block"}
                                                       {:db/id 7
                                                        :block/title "Second line\nIndented"}]}}
                                       {:output-format nil})]
      (is (= (str "ID  TITLE\n"
                  "3   Alpha block\n"
                  "7   Second line\n"
                  "    Indented\n"
                  "Count: 2")
             result))))

  (testing "search page includes IDENT column when present"
    (let [result (format/format-result {:status :ok
                                        :command :search-page
                                        :data {:items [{:db/id 9
                                                        :block/title "Home"
                                                        :db/ident :logseq.graph/home}]}}
                                       {:output-format nil})]
      (is (= (str "ID  TITLE  IDENT\n"
                  "9   Home   :logseq.graph/home\n"
                  "Count: 1")
             result)))))

(deftest test-search-json-edn-output
  (let [base-result {:status :ok
                     :command :search-tag
                     :data {:items [{:db/id 2
                                     :block/title "Quote"
                                     :db/ident :logseq.class/Tag}]}}
        json-result (format/format-result base-result {:output-format :json})
        edn-result (format/format-result base-result {:output-format :edn})
        parsed-json (js->clj (js/JSON.parse json-result) :keywordize-keys true)
        parsed-edn (reader/read-string edn-result)]
    (is (= "Quote" (get-in parsed-json [:data :items 0 :block/title])))
    (is (= "logseq.class/Tag" (get-in parsed-json [:data :items 0 :db/ident])))
    (is (= :logseq.class/Tag (get-in parsed-edn [:data :items 0 :db/ident])))))

(deftest test-list-property-json-edn-cardinality-shape
  (testing "list property json keeps namespaced db/cardinality while edn stays unchanged"
    (let [base-result {:status :ok
                       :command :list-property
                       :data {:items [{:db/id 99
                                       :block/title "Prop"
                                       :logseq.property/type :number
                                       :db/cardinality :db.cardinality/many}]}}
          json-result (format/format-result base-result {:output-format :json})
          edn-result (format/format-result base-result {:output-format :edn})
          parsed-json (js->clj (js/JSON.parse json-result) :keywordize-keys true)
          parsed-edn (reader/read-string edn-result)]
      (is (= "db.cardinality/many" (get-in parsed-json [:data :items 0 :db/cardinality])))
      (is (nil? (get-in parsed-json [:data :items 0 :cardinality])))
      (is (= :db.cardinality/many (get-in parsed-edn [:data :items 0 :db/cardinality]))))))

(deftest test-json-output-preserves-namespaced-keys-and-values
  (let [payload {:status :ok
                 :data {:item {:block/title "Block title"
                               :logseq.property/title "Property title"
                               :db/id 42
                               :db/ident :logseq.class/Tag
                               :block/uuid #uuid "2a847b91-1565-49cc-9f9f-0f6ee25ca0f3"}}}
        json-result (format/format-result payload {:output-format :json})
        parsed-json (js->clj (js/JSON.parse json-result) :keywordize-keys true)]
    (is (= "Block title" (get-in parsed-json [:data :item :block/title])))
    (is (= "Property title" (get-in parsed-json [:data :item :logseq.property/title])))
    (is (= 42 (get-in parsed-json [:data :item :db/id])))
    (is (= "logseq.class/Tag" (get-in parsed-json [:data :item :db/ident])))
    (is (= "2a847b91-1565-49cc-9f9f-0f6ee25ca0f3" (get-in parsed-json [:data :item :block/uuid])))))

(deftest test-human-output-upsert-success-lines
  (doseq [[label payload expected]
          [["upsert block renders ids in two lines"
            {:status :ok
             :command :upsert-block
             :context {:repo "demo-repo"
                       :blocks ["a" "b"]}
             :data {:result [201 202]}}
            "Upserted blocks:\n[201 202]"]
           ["upsert page renders ids in two lines"
            {:status :ok
             :command :upsert-page
             :context {:repo "demo-repo"
                       :page "Home"}
             :data {:result [123]}}
            "Upserted page:\n[123]"]
           ["upsert tag renders ids in two lines"
            {:status :ok
             :command :upsert-tag
             :context {:repo "demo-repo"
                       :name "Quote"}
             :data {:result [321]}}
            "Upserted tag:\n[321]"]
           ["upsert property renders ids in two lines"
            {:status :ok
             :command :upsert-property
             :context {:repo "demo-repo"
                       :name "owner"}
             :data {:result [654]}}
            "Upserted property:\n[654]"]
           ["upsert task renders ids in two lines"
            {:status :ok
             :command :upsert-task
             :context {:repo "demo-repo"
                       :page "Weekly Plan"}
             :data {:result [987]}}
            "Upserted task:\n[987]"]
           ["upsert asset renders ids in two lines"
            {:status :ok
             :command :upsert-asset
             :context {:repo "demo-repo"}
             :data {:result [555]}}
            "Upserted asset:\n[555]"]]]
    (testing label
      (let [result (format/format-result payload {:output-format nil})]
        (is (= expected result))))))

(deftest test-human-output-remove-success-lines
  (doseq [[label payload expected]
          [["remove page renders a succinct success line"
            {:status :ok
             :command :remove-page
             :context {:repo "demo-repo"
                       :page "Home"}
             :data {:result {:ok true}}}
            "Removed page: Home (repo: demo-repo)"]
           ["remove block with id list renders block count"
            {:status :ok
             :command :remove-block
             :context {:repo "demo-repo"
                       :ids [1 2 3]}
             :data {:result {:ok true}}}
            "Removed blocks: 3 (repo: demo-repo)"]
           ["remove block with large id list uses grouped count"
            {:status :ok
             :command :remove-block
             :context {:repo "demo-repo"
                       :ids (vec (range 1234))}
             :data {:result {:ok true}}}
            "Removed blocks: 1,234 (repo: demo-repo)"]
           ["remove tag renders a succinct success line"
            {:status :ok
             :command :remove-tag
             :context {:repo "demo-repo"
                       :name "Quote"}
             :data {:result {:ok true}}}
            "Removed tag: Quote (repo: demo-repo)"]
           ["remove property renders a succinct success line"
            {:status :ok
             :command :remove-property
             :context {:repo "demo-repo"
                       :name "owner"}
             :data {:result {:ok true}}}
            "Removed property: owner (repo: demo-repo)"]]]
    (testing label
      (let [result (format/format-result payload {:output-format nil})]
        (is (= expected result))))))

(deftest test-human-output-upsert-block-update-summary
  (doseq [[label context expected]
          [["upsert block update mode renders a succinct success line"
            {:repo "demo-repo"
             :source "source-uuid"
             :target "target-uuid"
             :update-tags ["TagA"]
             :update-properties {:logseq.property/publishing-public? true}
             :remove-tags ["TagB"]
             :remove-properties [:logseq.property/deadline]}
            "Upserted block: source-uuid -> target-uuid (repo: demo-repo, tags:+1, properties:+1, remove-tags:+1, remove-properties:+1)"]
           ["upsert block update uses grouped counts for large changes"
            {:repo "demo-repo"
             :source "source-uuid"
             :update-tags (vec (range 1234))
             :update-properties (zipmap (map #(keyword (str "prop-" %)) (range 1234)) (repeat true))
             :remove-tags (vec (range 1234))
             :remove-properties (mapv #(keyword (str "remove-" %)) (range 1234))}
            "Upserted block: source-uuid (repo: demo-repo, tags:+1,234, properties:+1,234, remove-tags:+1,234, remove-properties:+1,234)"]
           ["upsert block update without move target renders a succinct success line"
            {:repo "demo-repo"
             :source "source-uuid"
             :update-tags ["TagA"]}
            "Upserted block: source-uuid (repo: demo-repo, tags:+1)"]]]
    (testing label
      (let [result (format/format-result {:status :ok
                                          :command :upsert-block
                                          :context context
                                          :data {:result {:ok true}}}
                                         {:output-format nil})]
        (is (= expected result))))))

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
                                                  :input "/tmp/import.sqlite"}
                                        :data {:message "Imported sqlite from /tmp/import.sqlite"}}
                                       {:output-format nil})]
      (is (= "Imported sqlite from /tmp/import.sqlite" result)))))

(deftest test-human-output-graph-backup
  (testing "graph backup list renders metadata table"
    (let [result (format/format-result {:status :ok
                                        :command :graph-backup-list
                                        :data {:backups [{:name "demo-nightly"
                                                          :created-at 90000
                                                          :size-bytes 2048}]}}
                                       {:output-format nil
                                        :now-ms 100000})]
      (is (string/includes? result "NAME"))
      (is (string/includes? result "CREATED-AT"))
      (is (string/includes? result "SIZE-BYTES"))
      (is (string/includes? result "demo-nightly"))
      (is (string/includes? result "10 seconds ago"))
      (is (string/includes? result "2048"))
      (is (string/includes? result "Count: 1"))))

  (testing "graph backup create renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :graph-backup-create
                                        :context {:graph "demo"
                                                  :backup-name "demo-nightly"}}
                                       {:output-format nil})]
      (is (= "Created backup: demo-nightly (graph: demo)" result))))

  (testing "graph backup restore renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :graph-backup-restore
                                        :context {:src "demo-nightly"
                                                  :dst "demo-restored"}}
                                       {:output-format nil})]
      (is (= "Restored backup demo-nightly -> demo-restored" result))))

  (testing "graph backup remove renders a succinct success line"
    (let [result (format/format-result {:status :ok
                                        :command :graph-backup-remove
                                        :context {:src "demo-nightly"}}
                                       {:output-format nil})]
      (is (= "Removed backup: demo-nightly" result)))))

(deftest test-machine-output-graph-backup-list-metadata
  (let [base-result {:status :ok
                     :command :graph-backup-list
                     :data {:backups [{:name "demo-nightly"
                                       :created-at 90000
                                       :size-bytes 2048}]}}
        json-result (format/format-result base-result {:output-format :json})
        edn-result (format/format-result base-result {:output-format :edn})
        parsed-json (js->clj (js/JSON.parse json-result) :keywordize-keys true)
        parsed-edn (reader/read-string edn-result)]
    (testing "graph backup list json output keeps metadata fields"
      (is (= "demo-nightly" (get-in parsed-json [:data :backups 0 :name])))
      (is (= 90000 (get-in parsed-json [:data :backups 0 :created-at])))
      (is (= 2048 (get-in parsed-json [:data :backups 0 :size-bytes]))))

    (testing "graph backup list edn output keeps metadata fields"
      (is (= "demo-nightly" (get-in parsed-edn [:data :backups 0 :name])))
      (is (= 90000 (get-in parsed-edn [:data :backups 0 :created-at])))
      (is (= 2048 (get-in parsed-edn [:data :backups 0 :size-bytes]))))))

(deftest test-human-output-sync-status
  (testing "sync status renders runtime and queue fields"
    (let [result (format/format-result {:status :ok
                                        :command :sync-status
                                        :data {:repo "demo-graph"
                                               :graph-id "graph-uuid"
                                               :ws-state :open
                                               :pending-local 2345
                                               :pending-asset 1234
                                               :pending-server 9876
                                               :local-tx 12345
                                               :remote-tx 67890}}
                                       {:output-format nil})]
      (is (string/includes? result "Sync status"))
      (is (string/includes? result "demo-graph"))
      (is (string/includes? result "graph-uuid"))
      (is (string/includes? result "pending-local: 2,345"))
      (is (string/includes? result "pending-asset: 1,234"))
      (is (string/includes? result "pending-server: 9,876"))
      (is (string/includes? result "local-tx: 12,345"))
      (is (string/includes? result "remote-tx: 67,890"))))

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

(deftest test-human-output-sync-config-get-ws-url
  (testing "sync config get ws-url renders value in human output"
    (let [value "wss://api.logseq.io/sync/%s"
          result (format/format-result {:status :ok
                                        :command :sync-config-get
                                        :data {:key :ws-url
                                               :value value}}
                                       {:output-format nil})]
      (is (string/includes? result "ws-url"))
      (is (string/includes? result value)))))

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
                  "Created at: 1 minute ago\n"
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

(deftest test-human-output-server-cleanup
  (testing "server cleanup includes counts and failed targets"
    (let [result (format/format-result {:status :ok
                                        :command :server-cleanup
                                        :data {:cli-revision "cli-rev"
                                               :checked 4321
                                               :mismatched 3210
                                               :eligible 2100
                                               :skipped-owner 1111
                                               :skipped-owner-targets [{:repo "logseq_db_graph-b"
                                                                        :pid 22
                                                                        :owner-source :electron
                                                                        :revision "worker-rev-b"}]
                                               :killed (mapv (fn [idx]
                                                               {:repo (str "logseq_db_graph-killed-" idx)
                                                                :pid (+ 1000 idx)
                                                                :owner-source :cli
                                                                :revision "worker-rev-a"})
                                                             (range 1234))
                                               :failed [{:repo "logseq_db_graph-c"
                                                         :pid 33
                                                         :owner-source :cli
                                                         :revision nil
                                                         :error {:code :server-stop-timeout
                                                                 :message "timed out stopping server"}}]}}
                                       {:output-format nil})]
      (is (string/includes? result "Server cleanup summary"))
      (is (string/includes? result "CLI revision: cli-rev"))
      (is (string/includes? result "Checked: 4,321"))
      (is (string/includes? result "Mismatched: 3,210"))
      (is (string/includes? result "Eligible (:cli owner): 2,100"))
      (is (string/includes? result "Skipped owner mismatch: 1,111"))
      (is (string/includes? result "Killed: 1,234"))
      (is (string/includes? result "Failed: 1"))
      (is (string/includes? result "Skipped owner targets:"))
      (is (string/includes? result "graph-b"))
      (is (string/includes? result "Failed targets:"))
      (is (string/includes? result "server-stop-timeout")))))

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

(deftest test-human-output-server-list-includes-owner-and-revision
  (testing "server list shows owner and revision columns"
    (let [result (format/format-result {:status :ok
                                        :command :server-list
                                        :data {:servers [{:repo "demo-repo"
                                                          :status :ready
                                                          :host "127.0.0.1"
                                                          :port 1234
                                                          :pid 9876
                                                          :owner-source :cli
                                                          :revision "worker-revision"}]}}
                                       {:output-format nil})]
      (is (= (str "GRAPH      STATUS  HOST       PORT  PID   OWNER  REVISION\n"
                  "demo-repo  :ready  127.0.0.1  1234  9876  :cli   worker-revision\n"
                  "Count: 1")
             result))))

  (testing "server list falls back to placeholder when owner or revision is missing"
    (let [result (format/format-result {:status :ok
                                        :command :server-list
                                        :data {:servers [{:repo "demo-repo"
                                                          :status :ready
                                                          :host "127.0.0.1"
                                                          :port 1234
                                                          :pid 9876}]}}
                                       {:output-format nil})]
      (is (= (str "GRAPH      STATUS  HOST       PORT  PID   OWNER  REVISION\n"
                  "demo-repo  :ready  127.0.0.1  1234  9876  -      -\n"
                  "Count: 1")
             result))))

  (testing "server list shows revision mismatch warning in human output only"
    (let [base-result {:status :ok
                       :command :server-list
                       :data {:servers [{:repo "demo-repo"
                                         :status :ready
                                         :host "127.0.0.1"
                                         :port 1234
                                         :pid 9876
                                         :owner-source :cli
                                         :revision "server-revision"}]}
                       :human {:server-list {:revision-mismatch {:cli-revision "cli-revision"
                                                                 :servers [{:repo "demo-repo"
                                                                            :revision "server-revision"}]}}}}
          human-result (format/format-result base-result {:output-format nil})
          json-result (format/format-result base-result {:output-format :json})
          json-parsed (js->clj (js/JSON.parse json-result) :keywordize-keys true)]
      (is (string/includes? human-result "Warning:"))
      (is (string/includes? human-result "cli-revision"))
      (is (string/includes? human-result "demo-repo"))
      (is (= "server-revision" (get-in json-parsed [:data :servers 0 :revision])))
      (is (not (string/includes? json-result "Warning:"))))))

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

  (testing "missing query text uses per-subcommand --content hint"
    (doseq [[command hint]
            [[:search-block "Use: logseq search block --content <query>"]
             [:search-page "Use: logseq search page --content <query>"]
             [:search-property "Use: logseq search property --content <query>"]
             [:search-tag "Use: logseq search tag --content <query>"]]]
      (let [result (format/format-result {:status :error
                                          :command command
                                          :error {:code :missing-query-text
                                                  :message "query text is required"}}
                                         {:output-format nil})]
        (is (= (str "Error (missing-query-text): query text is required\n"
                    "Hint: " hint)
               result)))))

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
                                                        {:id :root-dir
                                                         :status :ok
                                                         :message "Read/write access confirmed: /tmp/logseq"}
                                                        {:id :running-servers
                                                         :status :warning
                                                         :message "1 server is still starting"}]}}
                                       {:output-format nil})]
      (is (= (str "Doctor: warning\n"
                  "[ok] db-worker-script - Found readable file: /tmp/db-worker-node.js\n"
                  "[ok] root-dir - Read/write access confirmed: /tmp/logseq\n"
                  "[warning] running-servers - 1 server is still starting")
             result))))

  (testing "doctor includes restart guidance for revision mismatch"
    (let [result (format/format-result {:status :ok
                                        :command :doctor
                                        :data {:status :warning
                                               :checks [{:id :server-revision-mismatch
                                                         :status :warning
                                                         :message "2 servers use a different revision than this CLI"
                                                         :servers [{:graph "graph-a"}
                                                                   {:graph "team graph"}]}]}}
                                       {:output-format nil})]
      (is (= (str "Doctor: warning\n"
                  "[warning] server-revision-mismatch - 2 servers use a different revision than this CLI\n"
                  "  Run: logseq server restart --graph graph-a\n"
                  "  Run: logseq server restart --graph \"team graph\"")
             result)))))

(deftest test-doctor-json-edn-output
  (testing "doctor json and edn keep structured checks for failed runs"
    (let [payload {:checks [{:id :db-worker-script
                             :status :ok
                             :message "Found readable file: /tmp/db-worker-node.js"}
                            {:id :root-dir
                             :status :error
                             :code :root-dir-permission
                             :message "root-dir is not readable/writable: /tmp/logseq"}]}
          json-result (format/format-result {:status :error
                                             :command :doctor
                                             :error {:code :root-dir-permission
                                                     :message "root-dir check failed"}
                                             :data payload}
                                            {:output-format :json})
          edn-result (format/format-result {:status :error
                                            :command :doctor
                                            :error {:code :root-dir-permission
                                                    :message "root-dir check failed"}
                                            :data payload}
                                           {:output-format :edn})
          parsed-json (js->clj (js/JSON.parse json-result) :keywordize-keys true)
          parsed-edn (reader/read-string edn-result)]
      (is (= "error" (:status parsed-json)))
      (is (= "root-dir-permission" (get-in parsed-json [:error :code])))
      (is (= "root-dir" (get-in parsed-json [:data :checks 1 :id])))
      (is (= "error" (get-in parsed-json [:data :checks 1 :status])))
      (is (= :error (:status parsed-edn)))
      (is (= :root-dir-permission (get-in parsed-edn [:error :code])))
      (is (= :root-dir (get-in parsed-edn [:data :checks 1 :id])))
      (is (= :error (get-in parsed-edn [:data :checks 1 :status]))))))

(deftest test-doctor-json-edn-output-includes-revision-mismatch-check
  (let [payload {:status :warning
                 :checks [{:id :server-revision-mismatch
                           :status :warning
                           :code :doctor-server-revision-mismatch
                           :cli-revision "cli-rev"
                           :servers [{:repo "logseq_db_graph-b"
                                      :graph "logseq_db_graph-b"
                                      :revision "worker-rev"}]
                           :message "1 server uses a different revision than this CLI"}]}
        json-result (format/format-result {:status :ok
                                           :command :doctor
                                           :data payload}
                                          {:output-format :json})
        edn-result (format/format-result {:status :ok
                                          :command :doctor
                                          :data payload}
                                         {:output-format :edn})
        parsed-json (js->clj (js/JSON.parse json-result) :keywordize-keys true)
        parsed-edn (reader/read-string edn-result)]
    (is (= "ok" (:status parsed-json)))
    (is (= "warning" (get-in parsed-json [:data :status])))
    (is (= "server-revision-mismatch" (get-in parsed-json [:data :checks 0 :id])))
    (is (= "doctor-server-revision-mismatch" (get-in parsed-json [:data :checks 0 :code])))
    (is (= "graph-b" (get-in parsed-json [:data :checks 0 :servers 0 :repo])))
    (is (= "graph-b" (get-in parsed-json [:data :checks 0 :servers 0 :graph])))
    (is (= :ok (:status parsed-edn)))
    (is (= :warning (get-in parsed-edn [:data :status])))
    (is (= :server-revision-mismatch (get-in parsed-edn [:data :checks 0 :id])))
    (is (= :doctor-server-revision-mismatch (get-in parsed-edn [:data :checks 0 :code])))
    (is (= "graph-b" (get-in parsed-edn [:data :checks 0 :servers 0 :repo])))
    (is (= "graph-b" (get-in parsed-edn [:data :checks 0 :servers 0 :graph])))))
