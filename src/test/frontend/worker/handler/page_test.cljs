(ns frontend.worker.handler.page-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.handler.page :as worker-page]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(defn- page-block-index-api
  []
  (let [api (deref #'worker-page/get-page-block-index)]
    (is (fn? api) "Missing worker page API: get-page-block-index")
    api))

(defn- conn-with-page
  "Creates a conn with a \"Page\" page of `child-count` direct children, each
   having `grandchild-count` children of its own. Returns conn."
  [child-count grandchild-count]
  (db-test/create-conn-with-blocks
   [{:page {:block/title "PerfPage"}
     :blocks (mapv (fn [i]
                     {:block/title (str "b" i)
                      :build/children (mapv (fn [j]
                                              {:block/title (str "b" i "." j)})
                                            (range grandchild-count))})
                   (range child-count))}]))

(defn- page-uuid
  [conn]
  (:block/uuid (db-test/find-page-by-title @conn "PerfPage")))

(deftest get-page-block-index-bounds-work-to-initial-limit-test
  (let [get-page-block-index (page-block-index-api)]
    (testing "returns only the first N visible blocks in pre-order"
      (let [conn (conn-with-page 10 100)
            result (get-page-block-index @conn (page-uuid conn) 5)
            index (:index result)]
        (is (= 5 (count index)))
        (is (= ["b0" "b0.0" "b0.1" "b0.2" "b0.3"]
               (mapv #(:block/title (d/entity @conn (:db/id %))) index)))
        (is (= [1 2 2 2 2] (mapv :block/level index)))
        (is (= 5 (count (:blocks result))))
        (is (some? (:block result)))))

    (testing "does not descend into collapsed blocks"
      (let [conn (conn-with-page 3 5)
            first-child (:db/id (db-test/find-block-by-content @conn "b0"))]
        (d/transact! conn [[:db/add first-child :block/collapsed? true]])
        (let [index (:index (get-page-block-index @conn (page-uuid conn) 10))]
          (is (= ["b0" "b1" "b1.0" "b1.1" "b1.2" "b1.3" "b1.4" "b2" "b2.0" "b2.1"]
                 (mapv #(:block/title (d/entity @conn (:db/id %))) index)))
          (is (true? (:block/collapsed? (first index))))
          (is (true? (:block.temp/has-children? (first index)))))))))

(deftest get-page-block-index-scales-with-limit-not-page-size-test
  (let [get-page-block-index (page-block-index-api)]
    (doseq [child-count [50 500]]
      (let [conn (conn-with-page child-count 10)
            total (* child-count 10)
            _ (dotimes [_ 3] (get-page-block-index @conn (page-uuid conn) 50))
            start (system-time)
            result (get-page-block-index @conn (page-uuid conn) 50)
            elapsed (- (system-time) start)
            ;; Baseline: what the old implementation paid before taking the
            ;; limit — materializing the whole subtree.
            full-start (system-time)
            full-count (count (ldb/get-block-and-children @conn (page-uuid conn)))
            full-elapsed (- (system-time) full-start)]
        (is (= 50 (count (:index result))))
        (is (>= full-count (inc total)))
        (println (str "page-size=" total " initial-limit=50 bounded-ms=" elapsed
                      " full-materialization-ms=" full-elapsed))))))
