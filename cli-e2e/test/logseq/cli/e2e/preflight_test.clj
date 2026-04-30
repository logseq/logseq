(ns logseq.cli.e2e.preflight-test
  (:require [clojure.test :refer [deftest is testing]]
            [logseq.cli.e2e.preflight :as preflight]))

(def required-artifacts
  ["/repo/static/logseq-cli.js"
   "/repo/static/db-worker-node.js"
   "/repo/dist/db-worker-node.js"
   "/repo/dist/db-worker-node-assets.json"
   "/repo/deps/db-sync/worker/dist/node-adapter.js"])

(defn- with-required-artifacts
  [f]
  (with-redefs [logseq.cli.e2e.paths/repo-root (constantly "/repo")
                logseq.cli.e2e.paths/required-artifacts (fn [] required-artifacts)]
    (f)))

(deftest build-plan-matches-required-commands
  (is (= ["clojure -M:cljs compile logseq-cli"
          "pnpm db-worker-node:compile:bundle"
          "pnpm --dir deps/db-sync build:node-adapter"]
         (mapv :cmd preflight/build-plan))))

(deftest missing-artifacts-returns-unreadable-paths
  (let [artifacts ["/repo/static/logseq-cli.js"
                   "/repo/static/db-worker-node.js"
                   "/repo/dist/db-worker-node.js"]
        present? #{"/repo/static/logseq-cli.js"}]
    (is (= ["/repo/static/db-worker-node.js"
            "/repo/dist/db-worker-node.js"]
           (preflight/missing-artifacts artifacts present?)))))

(deftest skip-build-avoids-running-shell-commands
  (let [called? (atom false)
        result (preflight/run! {:skip-build true
                                :run-command (fn [_]
                                               (reset! called? true))
                                :file-exists? (constantly false)})]
    (is (= :skipped (:status result)))
    (is (false? @called?))))

(deftest build-runs-commands-even-when-artifacts-are-ready
  (let [calls (atom [])]
    (with-required-artifacts
      #(let [result (preflight/run! {:run-command (fn [{:keys [cmd]}]
                                                    (swap! calls conj cmd)
                                                    {:cmd cmd
                                                     :exit 0
                                                     :out ""
                                                     :err ""})
                                     :file-exists? (set required-artifacts)})]
         (is (= :ok (:status result)))
         (is (= ["clojure -M:cljs compile logseq-cli"
                 "pnpm db-worker-node:compile:bundle"
                 "pnpm --dir deps/db-sync build:node-adapter"]
                @calls))))))

(deftest build-runs-commands-when-artifacts-are-partially-present
  (let [calls (atom [])
        existing (atom (disj (set required-artifacts)
                             "/repo/dist/db-worker-node-assets.json"))]
    (with-required-artifacts
      #(let [result (preflight/run! {:run-command (fn [{:keys [cmd]}]
                                                    (swap! calls conj cmd)
                                                    (reset! existing (set required-artifacts))
                                                    {:cmd cmd
                                                     :exit 0
                                                     :out ""
                                                     :err ""})
                                     :file-exists? (fn [path]
                                                     (contains? @existing path))})]
         (is (= :ok (:status result)))
         (is (= ["clojure -M:cljs compile logseq-cli"
                 "pnpm db-worker-node:compile:bundle"
                 "pnpm --dir deps/db-sync build:node-adapter"]
                @calls))))))

(deftest build-runs-commands-when-artifacts-are-absent
  (let [calls (atom [])
        existing (atom #{})]
    (with-required-artifacts
      #(let [result (preflight/run! {:run-command (fn [{:keys [cmd]}]
                                                    (swap! calls conj cmd)
                                                    (reset! existing (set required-artifacts))
                                                    {:cmd cmd
                                                     :exit 0
                                                     :out ""
                                                     :err ""})
                                     :file-exists? (fn [path]
                                                     (contains? @existing path))})]
         (is (= :ok (:status result)))
         (is (= ["clojure -M:cljs compile logseq-cli"
                 "pnpm db-worker-node:compile:bundle"
                 "pnpm --dir deps/db-sync build:node-adapter"]
                @calls))))))
