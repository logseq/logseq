(ns electron.graph-switch-flow-test
  (:require [cljs.test :refer [deftest is]]
            [electron.graph-switch-flow :as graph-switch-flow]))

(deftest set-current-graph-switch-does-not-release-runtime
  (is (false?
       (graph-switch-flow/release-runtime-on-set-current-graph?
        {:previous-graph-path "graph-a"
         :next-graph-path "graph-b"}))))

(deftest set-current-graph-reselect-does-not-release-runtime
  (is (false?
       (graph-switch-flow/release-runtime-on-set-current-graph?
        {:previous-graph-path "graph-a"
         :next-graph-path "graph-a"}))))
