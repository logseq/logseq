(ns logseq.tasks.db-graph.create-graph-with-large-sizes-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.tasks.db-graph.create-graph-with-large-sizes :as sut]))

(deftest build-page-and-blocks-batch-builds-the-requested-graph-slice
  (let [id-seq (map #(str "id-" %) (range))
        next-id (let [ids (atom id-seq)]
                  (fn []
                    (let [id (first @ids)]
                      (swap! ids rest)
                      id)))
        batch (#'sut/build-page-and-blocks-batch 10 2 3 next-id)]
    (is (= 2 (count batch)))
    (is (= ["Page-10" "Page-11"]
           (map (comp :block/title :page) batch)))
    (is (= ["id-0" "id-4"]
           (map (comp :block/uuid :page) batch)))
    (is (= [["Block" "Block" "Block"]
            ["Block" "Block" "Block"]]
           (map (fn [{:keys [blocks]}]
                  (mapv :block/title blocks))
                batch)))
    (is (= [["id-1" "id-2" "id-3"]
            ["id-5" "id-6" "id-7"]]
           (map (fn [{:keys [blocks]}]
                  (mapv :block/uuid blocks))
                batch)))))

(deftest page-and-block-batches-only-realize-requested-batches
  (let [calls (atom 0)
        next-id (fn []
                  (swap! calls inc)
                  (str "id-" @calls))
        batches (#'sut/page-and-block-batches {:pages 50000
                                               :blocks 50
                                               :batch-pages 100}
                                              next-id)
        first-batch (first batches)]
    (is (= 100 (count first-batch)))
    (is (= (* 100 51) @calls)
        "Only the first batch should be realized")
    (is (= "Page-0" (get-in first-batch [0 :page :block/title])))
    (is (= "Page-99" (get-in first-batch [99 :page :block/title])))))

(deftest default-batching-keeps-large-graphs-bounded
  (testing "50k pages with 50 blocks are split into many batches instead of one giant tx"
    (let [batch-pages (#'sut/default-batch-pages 50)]
      (is (< batch-pages 50000))
      (is (pos? batch-pages))
      (is (= batch-pages
             (count (first (#'sut/page-and-block-batches {:pages 50000
                                                          :blocks 50}
                                                         (constantly "id")))))))))

(deftest page-and-block-batches-handle-empty-input
  (is (= []
         (into [] (#'sut/page-and-block-batches {:pages 0
                                                 :blocks 50}
                                                (constantly "id"))))))

(deftest parse-args-keeps-the-graph-name-separate-from-cli-options
  (let [{:keys [graph-dir options]} (sut/parse-args ["large-graph"
                                                     "-p" "3"
                                                     "-b" "2"
                                                     "-t" "1"])]
    (is (= "large-graph" graph-dir))
    (is (= 3 (:pages options)))
    (is (= 2 (:blocks options)))
    (is (= 1 (:batch-pages options)))))
