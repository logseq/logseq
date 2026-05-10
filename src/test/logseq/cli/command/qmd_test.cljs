(ns logseq.cli.command.qmd-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.qmd :as qmd-command]
            [logseq.cli.format :as format]
            [logseq.cli.server :as cli-server]
            [logseq.cli.style :as style]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-qmd-command-entries
  (let [entries qmd-command/entries
        by-command (into {} (map (juxt :command identity) entries))]
    (is (= #{:qmd :qsearch}
           (set (keys by-command))))
    (is (= ["qmd"] (:cmds (:qmd by-command))))
    (is (= ["qsearch"] (:cmds (:qsearch by-command))))
    (is (not (contains? (get-in by-command [:qmd :spec]) :collection)))
    (is (not (contains? (get-in by-command [:qmd :spec]) :index)))
    (is (not (contains? (get-in by-command [:qsearch :spec]) :collection)))
    (is (not (contains? (get-in by-command [:qsearch :spec]) :index)))
    (is (contains? (get-in by-command [:qsearch :spec]) :limit))
    (is (= :n (get-in by-command [:qsearch :spec :limit :alias])))
    (is (contains? (get-in by-command [:qsearch :spec]) :no-rerank))))

(deftest test-build-actions
  (testing "qmd requires repo"
    (let [result (qmd-command/build-action {} nil)]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "qmd builds action with deterministic default collection"
    (let [result (qmd-command/build-action {} "logseq_db_My Graph")]
      (is (true? (:ok? result)))
      (is (= :qmd (get-in result [:action :type])))
      (is (= "logseq_db_My Graph" (get-in result [:action :repo])))
      (is (re-matches #"logseq-my-graph-[0-9a-f]{8}"
                      (get-in result [:action :collection])))))

  (testing "qsearch requires repo"
    (let [result (qmd-command/build-search-action {} ["alpha"] nil)]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "qsearch requires query text"
    (let [result (qmd-command/build-search-action {} [] "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :missing-query-text (get-in result [:error :code])))))

  (testing "qsearch joins positional query text"
    (let [result (qmd-command/build-search-action {:limit 10
                                                   :no-rerank true
                                                   :collection "ignored"
                                                   :index "ignored"}
                                                  ["markdown" "mirror"]
                                                  "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= {:type :qsearch
              :repo "logseq_db_demo"
              :graph "demo"
              :query "markdown mirror"
              :limit 10
              :collection "logseq-demo-9d477851"
              :no-rerank true}
             (:action result))))))

(deftest test-default-collection-name-is-deterministic-and-collision-resistant
  (let [a (qmd-command/default-collection-name "logseq_db_My Graph")
        b (qmd-command/default-collection-name "logseq_db_My Graph")
        c (qmd-command/default-collection-name "logseq_db_My Graph 2")]
    (is (= a b))
    (is (not= a c))
    (is (re-matches #"logseq-my-graph-[0-9a-f]{8}" a))))

(deftest test-mirror-dir
  (is (= "/tmp/logseq/graphs/foo~2Fbar/mirror/markdown"
         (qmd-command/mirror-dir {:root-dir "/tmp/logseq"} "logseq_db_foo/bar"))))

(deftest test-parse-qmd-json-output-tolerates-noisy-output
  (let [payload "Warning: embeddings pending\nSearching...\n[{\"file\":\"qmd://demo/pages/A.md\",\"snippet\":\"- hello <!-- id: 7 -->\"}]\n"]
    (is (= [{:file "qmd://demo/pages/A.md"
             :snippet "- hello <!-- id: 7 -->"}]
           (qmd-command/parse-qmd-json-output payload))))
  (let [payload "[WARN] embeddings pending\n[{\"file\":\"qmd://demo/pages/A.md\",\"snippet\":\"- hello <!-- id: 7 -->\"}]\n"]
    (is (= [{:file "qmd://demo/pages/A.md"
             :snippet "- hello <!-- id: 7 -->"}]
           (qmd-command/parse-qmd-json-output payload)))))

(deftest test-extract-block-ids-preserves-rank-and-dedupes
  (let [results [{:snippet "- one <!-- id: 7 -->\n- two <!-- id: 8 -->"}
                 {:snippet "- duplicate <!-- id: 7 -->"}
                 {:snippet "- missing id"}
                 {:snippet "- three <!-- id: 9 -->"}]]
    (is (= [7 8 9]
           (qmd-command/extract-block-ids results)))))

(deftest test-execute-qmd-checks-qmd-before-touching-graph
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj args)
                            (p/resolved {:exit 127
                                         :out ""
                                         :err "qmd not found"}))
                          cli-server/ensure-server! (fn [_ _]
                                                      (throw (js/Error. "server should not start")))
                          transport/invoke (fn [_ _ _]
                                             (throw (js/Error. "mirror should not regenerate")))]
            (qmd-command/execute-qmd
             {:type :qmd
              :repo "logseq_db_demo"
              :collection "custom"}
             {:root-dir "/tmp/root"}))
          (p/then (fn [result]
                    (is (= :error (:status result)))
                    (is (= :qmd-not-found (get-in result [:error :code])))
                    (is (= [["--help"]]
                           @calls))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qmd-creates-missing-collection-embeds-and-updates
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj args)
                            (p/resolved
                             (cond
                               (= ["--help"] args)
                               {:exit 0 :out "qmd help" :err ""}

                               (= ["collection" "show" "custom"] args)
                               {:exit 1 :out "" :err "Collection not found"}

                               (= ["collection" "add" "/tmp/root/graphs/demo/mirror/markdown"
                                   "--name" "custom" "--mask" "**/*.md"] args)
                               {:exit 0 :out "created" :err ""}

                               (= ["embed"] args)
                               {:exit 0 :out "embedded" :err ""}

                               (= ["update"] args)
                               {:exit 0 :out "updated" :err ""}

                               :else
                               {:exit 99 :out "" :err (pr-str args)})))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (is (= :thread-api/markdown-mirror-regenerate method))
                                             (is (= ["logseq_db_demo"] args))
                                             (p/resolved {:status :completed}))]
            (qmd-command/execute-qmd
             {:type :qmd
              :repo "logseq_db_demo"
              :collection "custom"}
             {:root-dir "/tmp/root"}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= true (get-in result [:data :qmd-installed?])))
                    (is (= :created (get-in result [:data :collection-action])))
                    (is (= :completed (get-in result [:data :embed])))
                    (is (= :completed (get-in result [:data :update])))
                    (is (= "custom" (get-in result [:data :collection])))
                    (is (= [["--help"]
                            ["collection" "show" "custom"]
                            ["collection" "add" "/tmp/root/graphs/demo/mirror/markdown"
                             "--name" "custom" "--mask" "**/*.md"]
                            ["embed"]
                            ["update"]]
                           @calls))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qmd-uses-existing-matching-collection-embeds-and-updates
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj args)
                            (p/resolved
                             (case (first args)
                               "--help" {:exit 0 :out "qmd help" :err ""}
                               "collection" {:exit 0
                                             :out "Collection: custom\n  Path:     /tmp/root/graphs/demo/mirror/markdown\n  Pattern:  **/*.md\n"
                                             :err ""}
                               "embed" {:exit 0 :out "embedded" :err ""}
                               "update" {:exit 0 :out "updated" :err ""})))
                          cli-server/ensure-server! (fn [config _repo] config)
                          transport/invoke (fn [_ _ _] (p/resolved {:status :completed}))]
            (qmd-command/execute-qmd
             {:type :qmd
              :repo "logseq_db_demo"
              :collection "custom"}
             {:root-dir "/tmp/root"}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= :existing (get-in result [:data :collection-action])))
                    (is (= :completed (get-in result [:data :embed])))
                    (is (= :completed (get-in result [:data :update])))
                    (is (= [["--help"]
                            ["collection" "show" "custom"]
                            ["embed"]
                            ["update"]]
                           @calls))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qmd-uses-existing-collection-through-symlinked-path
  (async done
    (let [tmp-dir (.mkdtempSync fs (node-path/join (.tmpdir os) "logseq-qmd-test-"))
          real-root (node-path/join tmp-dir "real-root")
          link-root (node-path/join tmp-dir "link-root")
          real-mirror-dir (node-path/join real-root "graphs" "demo" "mirror" "markdown")]
      (.mkdirSync fs real-mirror-dir #js {:recursive true})
      (.symlinkSync fs real-root link-root "dir")
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (p/resolved
                             (case (first args)
                               "--help" {:exit 0 :out "qmd help" :err ""}
                               "collection" {:exit 0
                                             :out (str "Collection: custom\n"
                                                       "  Path:     " real-mirror-dir "\n"
                                                       "  Pattern:  **/*.md\n")
                                             :err ""}
                               "embed" {:exit 0 :out "embedded" :err ""}
                               "update" {:exit 0 :out "updated" :err ""})))
                          cli-server/ensure-server! (fn [config _repo] config)
                          transport/invoke (fn [_ _ _] (p/resolved {:status :completed}))]
            (qmd-command/execute-qmd
             {:type :qmd
              :repo "logseq_db_demo"
              :collection "custom"}
             {:root-dir link-root}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= :existing (get-in result [:data :collection-action])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (.rmSync fs tmp-dir #js {:recursive true :force true})
                       (done)))))))

(deftest test-execute-qmd-fails-on-mismatched-collection-path
  (async done
    (-> (p/with-redefs [qmd-command/<run-qmd
                        (fn [args]
                          (p/resolved
                           (case (first args)
                             "--help" {:exit 0 :out "qmd help" :err ""}
                             "collection" {:exit 0
                                           :out "Collection: custom\n  Path:     /tmp/other\n  Pattern:  **/*.md\n"
                                           :err ""})))
                        cli-server/ensure-server! (fn [config _repo] config)
                        transport/invoke (fn [_ _ _] (p/resolved {:status :completed}))]
          (qmd-command/execute-qmd
           {:type :qmd
            :repo "logseq_db_demo"
            :collection "custom"}
           {:root-dir "/tmp/root"}))
        (p/then (fn [result]
                  (is (= :error (:status result)))
                  (is (= :qmd-collection-path-mismatch (get-in result [:error :code])))
                  (is (= "/tmp/other" (get-in result [:error :actual-path])))))
        (p/catch (fn [e] (is false (str "unexpected error: " e))))
        (p/finally done))))

(deftest test-execute-qsearch-uses-qmd-results-to-pull-blocks
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj {:qmd args})
                            (p/resolved
                             {:exit 0
                              :out (str "Warning: pending embeddings\n"
                                        "[{\"score\":1,\"file\":\"qmd://custom/pages/A.md\","
                                        "\"snippet\":\"- alpha <!-- id: 3 -->\\n- stale <!-- id: 5 -->\"},"
                                        "{\"score\":0.5,\"file\":\"qmd://custom/pages/B.md\","
                                        "\"snippet\":\"- duplicate <!-- id: 3 -->\"}]")
                              :err ""}))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (swap! calls conj {:invoke [method args]})
                                             (case method
                                               :thread-api/pull
                                               (let [[_repo _selector id] args]
                                                 (p/resolved
                                                  (case id
                                                    3 {:db/id 3
                                                       :block/title "alpha"
                                                       :block/page {:db/id 1
                                                                    :block/title "Home"}}
                                                    5 {:db/id 5})))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "alpha"
              :limit 10
              :collection "custom"
              :no-rerank true}
             {:output-format :json}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= [{:db/id 3
                             :block/title "alpha"
                             :block/page-id 1
                             :block/page-title "Home"
                             :qmd/rank 1
                             :qmd/score 1
                             :qmd/file "qmd://custom/pages/A.md"}]
                           (get-in result [:data :items])))
                    (is (= [5] (get-in result [:data :missing-ids])))
                    (is (= ["query" "alpha" "--json" "-c" "custom" "-n" "10" "--no-rerank"]
                           (:qmd (first @calls))))
                    (is (= [3 5]
                           (mapv (fn [{:keys [invoke]}]
                                   (get-in invoke [1 2]))
                                 (filter :invoke @calls))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qsearch-expands-property-snippet-with-qmd-get
  (async done
    (let [snippet (str "  * GitHub URL:: https://github.com/logseq/logseq/commit/5a40a2e1618182984d778dfeb1066786b2bbe176\n"
                       "  * Assignee:: [[Tienson]]\n"
                       "  - nice <!-- id: 6533 -->")
          calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj {:qmd args})
                            (p/resolved
                             (cond
                               (= ["query" "deadline" "--json" "-c" "logseq-demo-9d477851"] args)
                               {:exit 0
                                :out (str "[{\"score\":0.46,"
                                          "\"file\":\"qmd://custom/pages/db-release-checklist.md\","
                                          "\"line\":3,"
                                          "\"snippet\":" (js/JSON.stringify snippet) "}]")
                                :err ""}

                               (= ["get" "qmd://custom/pages/db-release-checklist.md:1" "-l" "15"] args)
                               {:exit 0
                                :out (str "id:: 11111111-1111-4111-8111-111111111111\n\n"
                                          "- DONE on web, app should be able to input immediately after cmd+e(quick add) #[[UX Enhancement]] <!-- id: 6515 -->\n"
                                          snippet)
                                :err ""}

                               :else
                               {:exit 99 :out "" :err (pr-str args)})))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (swap! calls conj {:invoke [method args]})
                                             (case method
                                               :thread-api/pull
                                               (let [[_repo _selector id] args]
                                                 (p/resolved
                                                  (case id
                                                    6515 {:db/id 6515
                                                          :block/title "DONE on web, app should be able to input immediately after cmd+e(quick add) #[[UX Enhancement]]"
                                                          :block/page {:db/id 100
                                                                       :block/title "DB release checklist"}}
                                                    6533 {:db/id 6533
                                                          :block/title "nice"
                                                          :block/page {:db/id 100
                                                                       :block/title "DB release checklist"}})))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "deadline"
              :collection "logseq-demo-9d477851"}
             {:output-format :json}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= [6515 6533]
                           (mapv :db/id (get-in result [:data :items]))))
                    (is (= [6515 6533]
                           (mapv (fn [{:keys [invoke]}]
                                   (get-in invoke [1 2]))
                                 (filter :invoke @calls))))
                    (is (= [["query" "deadline" "--json" "-c" "logseq-demo-9d477851"]
                            ["get" "qmd://custom/pages/db-release-checklist.md:1" "-l" "15"]]
                           (mapv :qmd (filter :qmd @calls))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qsearch-expands-nested-child-snippet-with-enclosing-parent
  (async done
    (let [snippet "  - nice <!-- id: 6533 -->"
          calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj {:qmd args})
                            (p/resolved
                             (cond
                               (= ["query" "nice" "--json" "-c" "custom"] args)
                               {:exit 0
                                :out (str "[{\"score\":1,"
                                          "\"file\":\"qmd://custom/pages/db-release-checklist.md\","
                                          "\"line\":4,"
                                          "\"snippet\":" (js/JSON.stringify snippet) "}]")
                                :err ""}

                               (= ["get" "qmd://custom/pages/db-release-checklist.md:1" "-l" "14"] args)
                               {:exit 0
                                :out (str "id:: 11111111-1111-4111-8111-111111111111\n\n"
                                          "- DONE parent <!-- id: 6515 -->\n"
                                          snippet)
                                :err ""}

                               :else
                               {:exit 99 :out "" :err (pr-str args)})))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (swap! calls conj {:invoke [method args]})
                                             (case method
                                               :thread-api/pull
                                               (let [[_repo _selector id] args]
                                                 (p/resolved
                                                  (case id
                                                    6515 {:db/id 6515
                                                          :block/title "DONE parent"
                                                          :block/page {:db/id 100
                                                                       :block/title "DB release checklist"}}
                                                    6533 {:db/id 6533
                                                          :block/title "nice"
                                                          :block/page {:db/id 100
                                                                       :block/title "DB release checklist"}})))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "nice"
              :collection "custom"}
             {:output-format :json}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= [6515 6533]
                           (mapv :db/id (get-in result [:data :items]))))
                    (is (= [6515 6533]
                           (mapv (fn [{:keys [invoke]}]
                                   (get-in invoke [1 2]))
                                 (filter :invoke @calls))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qsearch-expands-qmd-hunk-snippet-without-line-field
  (async done
    (let [snippet (str "@@ -4,4 @@ (3 before, 19 after)\n"
                       "  * GitHub URL:: https://github.com/logseq/logseq/commit/5a40a2e1618182984d778dfeb1066786b2bbe176\n"
                       "  * Assignee:: [[Tienson]]\n"
                       "  - nice <!-- id: 6533 -->\n"
                       "- on mobile side, I can’t see namespace pages(children pages) <!-- id: 6517 -->")
          calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj {:qmd args})
                            (p/resolved
                             (cond
                               (= ["query" "tienson sync" "--json" "-c" "custom"] args)
                               {:exit 0
                                :out (str "[{\"score\":0.47,"
                                          "\"file\":\"qmd://custom/journals/2025-07-11.md\","
                                          "\"snippet\":" (js/JSON.stringify snippet) "}]")
                                :err ""}

                               (= ["get" "qmd://custom/journals/2025-07-11.md:1" "-l" "18"] args)
                               {:exit 0
                                :out (str "id:: 00000001-2025-0711-0000-000000000000\n\n"
                                          "- DONE on web, app should be able to input immediately after cmd+e(quick add) #[[UX Enhancement]] <!-- id: 6515 -->\n"
                                          "  * GitHub URL:: https://github.com/logseq/logseq/commit/5a40a2e1618182984d778dfeb1066786b2bbe176\n"
                                          "  * Assignee:: [[Tienson]]\n"
                                          "  - nice <!-- id: 6533 -->\n"
                                          "- on mobile side, I can’t see namespace pages(children pages) <!-- id: 6517 -->")
                                :err ""}

                               :else
                               {:exit 99 :out "" :err (pr-str args)})))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (swap! calls conj {:invoke [method args]})
                                             (case method
                                               :thread-api/pull
                                               (let [[_repo _selector id] args]
                                                 (p/resolved
                                                  (case id
                                                    6515 {:db/id 6515
                                                          :block/title "DONE on web, app should be able to input immediately after cmd+e(quick add) #[[UX Enhancement]]"
                                                          :block/page {:db/id 6465
                                                                       :block/title "Jul 11th, 2025"}}
                                                    6533 {:db/id 6533
                                                          :block/title "nice"
                                                          :block/page {:db/id 6465
                                                                       :block/title "Jul 11th, 2025"}}
                                                    6517 {:db/id 6517
                                                          :block/title "on mobile side, I can’t see namespace pages(children pages)"
                                                          :block/page {:db/id 6465
                                                                       :block/title "Jul 11th, 2025"}})))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "tienson sync"
              :collection "custom"}
             {:output-format :json}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= [6515 6533 6517]
                           (mapv :db/id (get-in result [:data :items]))))
                    (is (= [["query" "tienson sync" "--json" "-c" "custom"]
                            ["get" "qmd://custom/journals/2025-07-11.md:1" "-l" "18"]]
                           (mapv :qmd (filter :qmd @calls))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qsearch-does-not-duplicate-already-complete-snippet
  (async done
    (let [snippet "- DONE parent <!-- id: 6515 -->\n  - nice <!-- id: 6533 -->"
          calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj {:qmd args})
                            (p/resolved
                             (cond
                               (= ["query" "nice" "--json" "-c" "custom"] args)
                               {:exit 0
                                :out (str "[{\"score\":1,"
                                          "\"file\":\"qmd://custom/pages/db-release-checklist.md\","
                                          "\"line\":3,"
                                          "\"snippet\":" (js/JSON.stringify snippet) "}]")
                                :err ""}

                               (= ["get" "qmd://custom/pages/db-release-checklist.md:1" "-l" "14"] args)
                               {:exit 0
                                :out (str "id:: 11111111-1111-4111-8111-111111111111\n\n"
                                          snippet)
                                :err ""}

                               :else
                               {:exit 99 :out "" :err (pr-str args)})))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (swap! calls conj {:invoke [method args]})
                                             (case method
                                               :thread-api/pull
                                               (let [[_repo _selector id] args]
                                                 (p/resolved
                                                  (case id
                                                    6515 {:db/id 6515
                                                          :block/title "DONE parent"
                                                          :block/page {:db/id 100
                                                                       :block/title "DB release checklist"}}
                                                    6533 {:db/id 6533
                                                          :block/title "nice"
                                                          :block/page {:db/id 100
                                                                       :block/title "DB release checklist"}})))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "nice"
              :collection "custom"}
             {:output-format :json}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= [6515 6533]
                           (mapv :db/id (get-in result [:data :items]))))
                    (is (= [6515 6533]
                           (mapv (fn [{:keys [invoke]}]
                                   (get-in invoke [1 2]))
                                 (filter :invoke @calls))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qsearch-keeps-original-snippet-when-qmd-get-fails
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj {:qmd args})
                            (p/resolved
                             (cond
                               (= ["query" "nice" "--json" "-c" "custom"] args)
                               {:exit 0
                                :out "[{\"score\":1,\"file\":\"qmd://custom/pages/missing.md\",\"line\":9,\"snippet\":\"  - nice <!-- id: 6533 -->\"}]"
                                :err ""}

                               (= ["get" "qmd://custom/pages/missing.md:1" "-l" "19"] args)
                               {:exit 1 :out "" :err "not found"}

                               :else
                               {:exit 99 :out "" :err (pr-str args)})))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (swap! calls conj {:invoke [method args]})
                                             (case method
                                               :thread-api/pull
                                               (let [[_repo _selector id] args]
                                                 (p/resolved
                                                  (case id
                                                    6533 {:db/id 6533
                                                          :block/title "nice"
                                                          :block/page {:db/id 100
                                                                       :block/title "DB release checklist"}})))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "nice"
              :collection "custom"}
             {:output-format :json}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= [6533]
                           (mapv :db/id (get-in result [:data :items]))))
                    (is (= [["query" "nice" "--json" "-c" "custom"]
                            ["get" "qmd://custom/pages/missing.md:1" "-l" "19"]]
                           (mapv :qmd (filter :qmd @calls))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qsearch-does-not-call-qmd-get-without-line
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj {:qmd args})
                            (p/resolved
                             {:exit 0
                              :out "[{\"score\":1,\"file\":\"qmd://custom/pages/A.md\",\"snippet\":\"  - nice <!-- id: 6533 -->\"}]"
                              :err ""}))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (swap! calls conj {:invoke [method args]})
                                             (case method
                                               :thread-api/pull
                                               (let [[_repo _selector id] args]
                                                 (p/resolved
                                                  (case id
                                                    6533 {:db/id 6533
                                                          :block/title "nice"
                                                          :block/page {:db/id 100
                                                                       :block/title "DB release checklist"}})))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "nice"
              :collection "custom"}
             {:output-format :json}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= [6533]
                           (mapv :db/id (get-in result [:data :items]))))
                    (is (= [["query" "nice" "--json" "-c" "custom"]]
                           (mapv :qmd (filter :qmd @calls))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qsearch-normalizes-block-reference-labels
  (async done
    (let [ref-uuid #uuid "11111111-1111-1111-1111-111111111111"
          calls (atom [])]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [args]
                            (swap! calls conj {:qmd args})
                            (p/resolved
                             {:exit 0
                              :out "[{\"score\":1,\"file\":\"qmd://custom/pages/A.md\",\"snippet\":\"- alpha <!-- id: 3 -->\"}]"
                              :err ""}))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (swap! calls conj {:invoke [method args]})
                                             (case method
                                               :thread-api/pull
                                               (let [[_repo selector id] args]
                                                 (p/resolved
                                                  (cond
                                                    (= id 3)
                                                    {:db/id 3
                                                     :block/title (str "alpha [[" ref-uuid "]]")
                                                     :block/page {:db/id 1
                                                                  :block/title "Home"}}

                                                    (= id [:block/uuid ref-uuid])
                                                    {:db/id 7
                                                     :block/uuid ref-uuid
                                                     :block/title "Referenced block"}

                                                    :else
                                                    (throw (ex-info "unexpected pull"
                                                                    {:selector selector
                                                                     :id id})))))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "alpha"
              :collection "custom"}
             {:output-format :json}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= "alpha [[Referenced block]]"
                           (get-in result [:data :items 0 :block/title])))
                    (is (not (string/includes? (get-in result [:data :items 0 :block/title])
                                               (str ref-uuid))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qsearch-renders-pulled-block-details-like-show
  (async done
    (let [query-call-count (atom 0)]
      (-> (p/with-redefs [qmd-command/<run-qmd
                          (fn [_]
                            (p/resolved
                             {:exit 0
                              :out "[{\"score\":1,\"file\":\"qmd://custom/pages/Home.md\",\"snippet\":\"- alpha <!-- id: 3 -->\"}]"
                              :err ""}))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (case method
                                               :thread-api/pull
                                               (let [[_repo _selector target] args]
                                                 (p/resolved
                                                  (cond
                                                    (= target 3)
                                                    {:db/id 3
                                                     :block/title "alpha target"
                                                     :block/page {:db/id 1
                                                                  :block/title "Home"}
                                                     :block/tags [{:db/id 20
                                                                   :block/title "Project"}]}

                                                    (= target [:db/ident :user.property/priority])
                                                    {:db/id 30
                                                     :db/ident :user.property/priority
                                                     :block/title "Priority"}

                                                    :else nil)))

                                               :thread-api/q
                                               (let [idx (swap! query-call-count inc)]
                                                 (p/resolved
                                                  (case idx
                                                    1 [[:user.property/priority :default]]
                                                    2 []
                                                    3 [[3 :user.property/priority "P1"]]
                                                    [])))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "alpha"
              :collection "custom"}
             {:output-format nil}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (let [plain (-> result
                                    (assoc :command :qsearch)
                                    (format/format-result {:output-format nil})
                                    style/strip-ansi)]
                      (is (string/includes? plain "3 └── alpha target #Project"))
                      (is (string/includes? plain "Priority: P1"))
                      (is (not (string/includes? plain "PAGE-TITLE")))
                      (is (not (string/includes? plain "Count: 1"))))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qsearch-empty-qmd-results-returns-no-matches
  (async done
    (-> (p/with-redefs [qmd-command/<run-qmd
                        (fn [_]
                          (p/resolved {:exit 0
                                       :out "[]"
                                       :err ""}))
                        cli-server/ensure-server! (fn [config _repo] config)]
          (qmd-command/execute-qsearch
           {:type :qsearch
            :repo "logseq_db_demo"
            :query "alpha"
            :collection "custom"}
           {}))
        (p/then (fn [result]
                  (is (= :ok (:status result)))
                  (is (= [] (get-in result [:data :items])))
                  (is (= [] (get-in result [:data :missing-ids])))
                  (is (= 0 (get-in result [:data :qmd :result-count])))))
        (p/catch (fn [e] (is false (str "unexpected error: " e))))
        (p/finally done))))

(deftest test-execute-qsearch-errors-on-malformed-qmd-json
  (async done
    (-> (p/with-redefs [qmd-command/<run-qmd
                        (fn [_]
                          (p/resolved {:exit 0
                                       :out "QMD finished without JSON output"
                                       :err ""}))
                        cli-server/ensure-server! (fn [config _repo] config)]
          (qmd-command/execute-qsearch
           {:type :qsearch
            :repo "logseq_db_demo"
            :query "alpha"
            :collection "custom"}
           {}))
        (p/then (fn [result]
                  (is (= :error (:status result)))
                  (is (= :qmd-json-parse-failed (get-in result [:error :code])))
                  (is (string/includes? (or (get-in result [:error :message]) "")
                                        "parse QMD JSON"))))
        (p/catch (fn [e] (is false (str "unexpected error: " e))))
        (p/finally done))))

(deftest test-execute-qsearch-errors-when-qmd-results-have-no-block-ids
  (async done
    (-> (p/with-redefs [qmd-command/<run-qmd
                        (fn [_]
                          (p/resolved {:exit 0
                                       :out "[{\"snippet\":\"no markdown mirror ids\"}]"
                                       :err ""}))
                        cli-server/ensure-server! (fn [config _repo] config)]
          (qmd-command/execute-qsearch
           {:type :qsearch
            :repo "logseq_db_demo"
            :query "alpha"
            :collection "custom"}
           {}))
        (p/then (fn [result]
                  (is (= :error (:status result)))
                  (is (= :qmd-no-block-ids (get-in result [:error :code])))
                  (is (string/includes? (get-in result [:error :hint])
                                        "logseq qmd"))))
        (p/catch (fn [e] (is false (str "unexpected error: " e))))
        (p/finally done))))
