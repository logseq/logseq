(ns frontend.worker.handler.graph-not-open-test
  "Thread apis the renderer calls right after a reload, before the worker
  has opened the graph, must not throw while the graph's conn is missing."
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.handler.graph]
            [frontend.worker.handler.view]
            [frontend.worker.state :as worker-state]))

(def ^:private unopened-repo "logseq_db_graph-not-open-test")

(defn- call-thread-api
  [k & args]
  (let [f (get @thread-api/*thread-apis k)]
    (is (fn? f) (str "thread api not registered: " k))
    (apply f args)))

(deftest read-thread-apis-return-empty-before-graph-opens-test
  (is (nil? (worker-state/get-datascript-conn unopened-repo)))
  (testing "view and graph reads"
    (is (nil? (call-thread-api :thread-api/get-view-data unopened-repo 1 {})))
    (is (false? (call-thread-api :thread-api/favorited-page? unopened-repo (random-uuid))))
    (is (nil? (call-thread-api :thread-api/get-all-page-titles unopened-repo)))))
