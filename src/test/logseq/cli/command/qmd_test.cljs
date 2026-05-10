(ns logseq.cli.command.qmd-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.qmd :as qmd-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-qmd-command-entries
  (let [entries qmd-command/entries
        by-command (into {} (map (juxt :command identity) entries))]
    (is (= #{:qmd-init :qsearch}
           (set (keys by-command))))
    (is (= ["qmd" "init"] (:cmds (:qmd-init by-command))))
    (is (= ["qsearch"] (:cmds (:qsearch by-command))))
    (is (contains? (get-in by-command [:qmd-init :spec]) :collection))
    (is (contains? (get-in by-command [:qmd-init :spec]) :index))
    (is (contains? (get-in by-command [:qsearch :spec]) :collection))
    (is (contains? (get-in by-command [:qsearch :spec]) :index))
    (is (contains? (get-in by-command [:qsearch :spec]) :limit))
    (is (= :n (get-in by-command [:qsearch :spec :limit :alias])))
    (is (contains? (get-in by-command [:qsearch :spec]) :no-rerank))))

(deftest test-build-actions
  (testing "qmd init requires repo"
    (let [result (qmd-command/build-init-action {:collection "notes"} nil)]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "qmd init builds action with deterministic default collection"
    (let [result (qmd-command/build-init-action {} "logseq_db_My Graph")]
      (is (true? (:ok? result)))
      (is (= :qmd-init (get-in result [:action :type])))
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
    (let [result (qmd-command/build-search-action {:limit 10 :no-rerank true}
                                                  ["markdown" "mirror"]
                                                  "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= {:type :qsearch
              :repo "logseq_db_demo"
              :graph "demo"
              :query "markdown mirror"
              :limit 10
              :collection "logseq-demo-9d477851"
              :index nil
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

(deftest test-execute-qmd-init-creates-missing-collection
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

                               :else
                               {:exit 99 :out "" :err (pr-str args)})))
                          cli-server/ensure-server! (fn [config repo]
                                                      (assoc config :ensured-repo repo))
                          transport/invoke (fn [_ method args]
                                             (is (= :thread-api/markdown-mirror-regenerate method))
                                             (is (= ["logseq_db_demo"] args))
                                             (p/resolved {:status :completed}))]
            (qmd-command/execute-qmd-init
             {:type :qmd-init
              :repo "logseq_db_demo"
              :collection "custom"}
             {:root-dir "/tmp/root"}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= :created (get-in result [:data :action])))
                    (is (= "custom" (get-in result [:data :collection])))
                    (is (= [["--help"]
                            ["collection" "show" "custom"]
                            ["collection" "add" "/tmp/root/graphs/demo/mirror/markdown"
                             "--name" "custom" "--mask" "**/*.md"]]
                           @calls))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qmd-init-updates-existing-matching-collection
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
                               "update" {:exit 0 :out "updated" :err ""})))
                          cli-server/ensure-server! (fn [config _repo] config)
                          transport/invoke (fn [_ _ _] (p/resolved {:status :completed}))]
            (qmd-command/execute-qmd-init
             {:type :qmd-init
              :repo "logseq_db_demo"
              :collection "custom"}
             {:root-dir "/tmp/root"}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= :updated (get-in result [:data :action])))
                    (is (= [["--help"]
                            ["collection" "show" "custom"]
                            ["update"]]
                           @calls))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-qmd-init-updates-existing-collection-through-symlinked-path
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
                               "update" {:exit 0 :out "updated" :err ""})))
                          cli-server/ensure-server! (fn [config _repo] config)
                          transport/invoke (fn [_ _ _] (p/resolved {:status :completed}))]
            (qmd-command/execute-qmd-init
             {:type :qmd-init
              :repo "logseq_db_demo"
              :collection "custom"}
             {:root-dir link-root}))
          (p/then (fn [result]
                    (is (= :ok (:status result)))
                    (is (= :updated (get-in result [:data :action])))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (.rmSync fs tmp-dir #js {:recursive true :force true})
                       (done)))))))

(deftest test-execute-qmd-init-fails-on-mismatched-collection-path
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
          (qmd-command/execute-qmd-init
           {:type :qmd-init
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
                                                    5 nil)))))]
            (qmd-command/execute-qsearch
             {:type :qsearch
              :repo "logseq_db_demo"
              :query "alpha"
              :limit 10
              :collection "custom"
              :no-rerank true}
             {}))
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
                    (is (= [{:qmd ["query" "alpha" "--json" "-c" "custom" "-n" "10" "--no-rerank"]}
                            {:invoke [:thread-api/pull
                                      ["logseq_db_demo"
                                       [:db/id :block/title :block/uuid
                                        {:block/page [:db/id :block/title :block/name :block/uuid]}]
                                       3]]}
                            {:invoke [:thread-api/pull
                                      ["logseq_db_demo"
                                       [:db/id :block/title :block/uuid
                                        {:block/page [:db/id :block/title :block/name :block/uuid]}]
                                       5]]}]
                           @calls))))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally done)))))

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
                                        "logseq qmd init"))))
        (p/catch (fn [e] (is false (str "unexpected error: " e))))
        (p/finally done))))
