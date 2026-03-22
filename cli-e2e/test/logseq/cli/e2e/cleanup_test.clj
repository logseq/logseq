(ns logseq.cli.e2e.cleanup-test
  (:require [babashka.fs :as fs]
            [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.cleanup :as cleanup]))

(deftest list-cli-e2e-db-worker-pids-filters-processes
  (let [shell-fn (fn [& _]
                   {:exit 0
                    :out (str " 101 node /repo/dist/db-worker-node.js --repo graph-a --data-dir /tmp/logseq-cli-e2e-graph-a-123/graphs --owner-source cli\n"
                              " 202 node /repo/dist/db-worker-node.js --repo production --data-dir /tmp/production-graphs --owner-source cli\n"
                              " 303 node /repo/static/logseq-cli.js graph list\n"
                              " 404 /usr/bin/python3 background.py\n"
                              " 505 node /repo/static/db-worker-node.js --repo graph-b --data-dir /private/tmp/logseq-cli-e2e-graph-b-999/graphs --owner-source cli\n")
                    :err ""})]
    (is (= [101 505]
           (cleanup/list-cli-e2e-db-worker-pids {:shell-fn shell-fn}))))

  (testing "throws when ps invocation fails"
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo
         #"Unable to scan processes"
         (cleanup/list-cli-e2e-db-worker-pids {:shell-fn (fn [& _]
                                                            {:exit 1
                                                             :out ""
                                                             :err "permission denied"})})))))

(deftest cleanup-db-worker-processes-separates-killed-and-failed
  (let [killed (atom [])
        result (cleanup/cleanup-db-worker-processes! {:list-pids-fn (fn [] [11 22 33])
                                                      :kill-pid-fn (fn [pid]
                                                                     (swap! killed conj pid)
                                                                     (if (= pid 22)
                                                                       :failed
                                                                       :killed))})]
    (is (= [11 22 33] (:found-pids result)))
    (is (= [11 33] (:killed-pids result)))
    (is (= [22] (:failed-pids result)))
    (is (= [11 22 33] @killed))))

(deftest cleanup-db-worker-processes-dry-run-does-not-kill
  (let [killed (atom [])
        result (cleanup/cleanup-db-worker-processes! {:dry-run true
                                                      :list-pids-fn (fn [] [11 22])
                                                      :kill-pid-fn (fn [pid]
                                                                     (swap! killed conj pid)
                                                                     :killed)})]
    (is (= [11 22] (:found-pids result)))
    (is (true? (:dry-run? result)))
    (is (= [11 22] (:would-kill-pids result)))
    (is (= [] (:killed-pids result)))
    (is (= [] (:failed-pids result)))
    (is (= [] @killed))))

(deftest cleanup-temp-graph-dirs-removes-only-cli-e2e-graphs
  (let [tmp-root (fs/create-temp-dir {:prefix "cleanup-e2e-test-"})
        matching-graphs (fs/path tmp-root "logseq-cli-e2e-case-a-123" "graphs")
        another-matching-graphs (fs/path tmp-root "logseq-cli-e2e-case-b-456" "graphs")
        non-matching-graphs (fs/path tmp-root "other-case" "graphs")]
    (try
      (fs/create-dirs matching-graphs)
      (fs/create-dirs another-matching-graphs)
      (fs/create-dirs non-matching-graphs)

      (let [result (cleanup/cleanup-temp-graph-dirs! {:tmp-root (str tmp-root)})
            expected-dirs (sort [(str matching-graphs)
                                 (str another-matching-graphs)])]
        (is (= expected-dirs
               (sort (:found-dirs result))))
        (is (= expected-dirs
               (sort (:removed-dirs result))))
        (is (empty? (:failed-dirs result)))
        (is (false? (fs/exists? matching-graphs)))
        (is (false? (fs/exists? another-matching-graphs)))
        (is (true? (fs/exists? non-matching-graphs))))
      (finally
        (fs/delete-tree tmp-root)))))

(deftest cleanup-temp-graph-dirs-dry-run-does-not-delete
  (let [deleted (atom [])
        result (cleanup/cleanup-temp-graph-dirs! {:dry-run true
                                                  :list-dirs-fn (fn [] ["/tmp/logseq-cli-e2e-a/graphs"
                                                                         "/tmp/logseq-cli-e2e-b/graphs"])
                                                  :delete-dir-fn (fn [dir]
                                                                   (swap! deleted conj dir))})]
    (is (= ["/tmp/logseq-cli-e2e-a/graphs"
            "/tmp/logseq-cli-e2e-b/graphs"]
           (:found-dirs result)))
    (is (true? (:dry-run? result)))
    (is (= ["/tmp/logseq-cli-e2e-a/graphs"
            "/tmp/logseq-cli-e2e-b/graphs"]
           (:would-remove-dirs result)))
    (is (= [] (:removed-dirs result)))
    (is (= [] (:failed-dirs result)))
    (is (= [] @deleted))))
