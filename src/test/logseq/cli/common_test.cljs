(ns logseq.cli.common-test
  (:require ["fs-extra" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.common :as cli-common]
            [logseq.common.file-graph-import :as file-graph-import]
            [logseq.common.graph :as common-graph]
            [logseq.common.config :as common-config]))

(deftest file-graph-import-completed-result-reports-issues
  (let [issue {:code :import/file-parse-failed
               :severity :error
               :recoverable? true
               :phase :import-file
               :parameters {:path "pages/example.md"}}
        result (file-graph-import/completed-result "run" {:issues [issue]})]
    (is (= :completed-with-errors (:status result)))
    (is (= {:issue-count 1} (:summary result)))
    (is (= [issue] (:issues result)))))

(deftest file-graph-import-terminal-result-validates-the-contract
  (doseq [result [{}
                  {:status :failed
                   :phase :validate}
                  {:contract-version 2
                   :run-id "run"
                   :status :completed}
                  {:contract-version 1
                   :run-id "another-run"
                   :status :completed}
                  {:contract-version 1
                   :run-id "run"
                   :status :completed}
                  {:contract-version 1
                   :run-id "run"
                   :status :unknown}]]
    (is (= {:status :failed
            :phase :worker-import
            :code :import/invalid-terminal-result}
           (let [normalized (file-graph-import/normalize-terminal-result "run" result)]
             {:status (:status normalized)
              :phase (:phase normalized)
              :code (some-> normalized :issues first :code)})))))

(deftest file-graph-import-staging-repo-requires-an-internal-run-id
  (is (false? (file-graph-import/staging-repo?
               (str common-config/db-version-prefix
                    ".logseq-file-graph-import-user-notes")))))

(deftest cleanup-file-graph-imports-requires-an-ownership-marker
  (let [graphs-dir (node-helper/create-tmp-dir "cleanup-file-graph-import")
        user-run-id "00000000-0000-4000-8000-000000000001"
        staging-run-id "00000000-0000-4000-8000-000000000002"
        staging-repo (file-graph-import/staging-repo staging-run-id)
        user-path (node-path/join graphs-dir (str ".logseq-file-graph-import-" user-run-id))
        staging-path (node-path/join graphs-dir (str ".logseq-file-graph-import-" staging-run-id))]
    (fs/mkdirSync user-path #js {:recursive true})
    (fs/mkdirSync staging-path #js {:recursive true})
    (cli-common/mark-file-graph-import-staging! graphs-dir staging-repo)
    (is (= 1 (count (cli-common/cleanup-file-graph-imports! graphs-dir))))
    (is (fs/existsSync user-path)
        "A user graph with a staging-shaped name must not be cleaned up")
    (is (not (fs/existsSync staging-path)))))

(deftest publish-file-graph-import-preserves-the-target-boundary
  (let [run-id "00000000-0000-4000-8000-000000000001"
        graphs-dir (node-helper/create-tmp-dir "publish-file-graph-import")
        staging-repo (file-graph-import/staging-repo run-id)
        target-repo (str common-config/db-version-prefix "target")
        staging-path (node-path/join graphs-dir (str ".logseq-file-graph-import-" run-id))
        target-path (node-path/join graphs-dir "target")]
    (fs/mkdirSync staging-path #js {:recursive true})
    (fs/writeFileSync (node-path/join staging-path "db.sqlite") "imported-data")
    (cli-common/mark-file-graph-import-staging! graphs-dir staging-repo)
    (cli-common/publish-file-graph-import! graphs-dir staging-repo target-repo)
    (is (not (fs/existsSync staging-path)))
    (is (= "imported-data"
           (fs/readFileSync (node-path/join target-path "db.sqlite") "utf8")))
    (fs/mkdirSync staging-path #js {:recursive true})
    (cli-common/mark-file-graph-import-staging! graphs-dir staging-repo)
    (is (thrown-with-msg? js/Error #"target graph already exists"
                          (cli-common/publish-file-graph-import!
                           graphs-dir staging-repo target-repo)))))

(deftest unlink-graph-moves-to-unlinked-dir
  (let [graphs-dir (node-helper/create-tmp-dir "unlink-graph")
        graph-name "foo/bar"
        repo (str common-config/db-version-prefix graph-name)
        encoded-graph-dir "foo~2Fbar"
        graph-path (node-path/join graphs-dir encoded-graph-dir)
        unlinked-path (node-path/join graphs-dir common-config/unlinked-graphs-dir encoded-graph-dir)]
    (fs/mkdirSync graph-path #js {:recursive true})
    (fs/writeFileSync (node-path/join graph-path "db.sqlite") "test-data")
    (with-redefs [common-graph/get-default-graphs-dir (fn [] graphs-dir)]
      (cli-common/unlink-graph! repo)
      (is (not (fs/existsSync graph-path))
          "Original graph directory should no longer exist")
      (is (fs/existsSync unlinked-path)
          "Graph directory should be moved to Unlinked graphs")
      (is (fs/existsSync (node-path/join unlinked-path "db.sqlite"))
          "Graph contents should be preserved after move"))))

(deftest unlink-graph-moves-space-preserving-canonical-dir
  (let [graphs-dir (node-helper/create-tmp-dir "unlink-graph-space")
        graph-name "space name"
        repo (str common-config/db-version-prefix graph-name)
        encoded-graph-dir "space name"
        graph-path (node-path/join graphs-dir encoded-graph-dir)
        unlinked-path (node-path/join graphs-dir common-config/unlinked-graphs-dir encoded-graph-dir)]
    (fs/mkdirSync graph-path #js {:recursive true})
    (fs/writeFileSync (node-path/join graph-path "db.sqlite") "test-data")
    (with-redefs [common-graph/get-default-graphs-dir (fn [] graphs-dir)]
      (cli-common/unlink-graph! repo)
      (is (not (fs/existsSync graph-path))
          "Original space-preserving graph directory should no longer exist")
      (is (fs/existsSync unlinked-path)
          "Space-preserving graph directory should be moved to Unlinked graphs")
      (is (fs/existsSync (node-path/join unlinked-path "db.sqlite"))
          "Graph contents should be preserved after move"))))

(deftest unlink-graph-moves-unencoded-unicode-dir
  (let [graphs-dir (node-helper/create-tmp-dir "unlink-graph-unicode")
        graph-name "副本"
        repo (str common-config/db-version-prefix graph-name)
        graph-path (node-path/join graphs-dir graph-name)
        unlinked-path (node-path/join graphs-dir common-config/unlinked-graphs-dir graph-name)]
    (fs/mkdirSync graph-path #js {:recursive true})
    (fs/writeFileSync (node-path/join graph-path "db.sqlite") "test-data")
    (with-redefs [common-graph/get-default-graphs-dir (fn [] graphs-dir)]
      (cli-common/unlink-graph! repo)
      (is (not (fs/existsSync graph-path))
          "Original unencoded Unicode graph directory should no longer exist")
      (is (fs/existsSync unlinked-path)
          "Unencoded Unicode graph directory should be moved to Unlinked graphs")
      (is (fs/existsSync (node-path/join unlinked-path "db.sqlite"))
          "Graph contents should be preserved after move"))))
