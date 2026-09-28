(ns frontend.graph-tab-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.graph-tab :as graph-tab]
            [goog.object :as gobj]))

(defn- memory-session-storage
  []
  (let [store (atom {})]
    #js {:getItem (fn [k]
                    (get @store k))
         :setItem (fn [k v]
                    (swap! store assoc k v)
                    nil)
         :removeItem (fn [k]
                       (swap! store dissoc k)
                       nil)}))

(deftest set-tab-graph-replaces-stale-identity-test
  (let [storage (memory-session-storage)
        previous (gobj/get js/globalThis "sessionStorage")]
    (gobj/set js/globalThis "sessionStorage" storage)
    (try
      (graph-tab/set-tab-graph! "logseq_db_graph_a" "graph-a-uuid")
      (is (= {:repo "logseq_db_graph_a"
              :graph-id "graph-a-uuid"}
             (graph-tab/get-tab-graph)))

      (testing "opening another graph replaces repo and drops the previous graph-id"
        (graph-tab/set-tab-graph! "logseq_db_graph_b" nil)
        (is (= {:repo "logseq_db_graph_b"
                :graph-id nil}
               (graph-tab/get-tab-graph))))

      (testing "clearing the current repo removes tab memory"
        (graph-tab/set-tab-graph! nil nil)
        (is (nil? (graph-tab/get-tab-graph))))
      (finally
        (if (undefined? previous)
          (js-delete js/globalThis "sessionStorage")
          (gobj/set js/globalThis "sessionStorage" previous))))))
