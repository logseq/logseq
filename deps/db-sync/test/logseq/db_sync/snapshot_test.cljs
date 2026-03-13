(ns logseq.db-sync.snapshot-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.snapshot :as snapshot]))

(def sample-datoms
  [{:e 1 :a :db/ident :v :logseq.class/Page :tx 1 :added true}
   {:e 2 :a :block/title :v "hello" :tx 1 :added true}])

(deftest datoms-jsonl-roundtrip-test
  (testing "jsonl transit roundtrips datoms"
    (let [payload (snapshot/encode-datoms-jsonl sample-datoms)
          {:keys [datoms buffer]} (snapshot/parse-datoms-jsonl-chunk nil payload)]
      (is (= sample-datoms datoms))
      (is (or (nil? buffer) (zero? (.-byteLength buffer)))))))

(deftest datoms-jsonl-split-test
  (testing "parse-datoms-jsonl-chunk handles partial trailing line"
    (let [payload (snapshot/encode-datoms-jsonl sample-datoms)
          split-pos (- (.-byteLength payload) 3)
          part1 (.slice payload 0 split-pos)
          part2 (.slice payload split-pos (.-byteLength payload))
          {datoms1 :datoms buffer :buffer} (snapshot/parse-datoms-jsonl-chunk nil part1)
          {datoms2 :datoms next-buffer :buffer} (snapshot/parse-datoms-jsonl-chunk buffer part2)]
      (is (= (subvec sample-datoms 0 1) datoms1))
      (is (= (subvec sample-datoms 1) datoms2))
      (is (or (nil? next-buffer) (zero? (.-byteLength next-buffer)))))))

(deftest datoms-jsonl-finalize-buffer-test
  (testing "finalize-datoms-jsonl-buffer parses the remaining line"
    (let [payload (snapshot/encode-datoms-jsonl sample-datoms)]
      (is (= sample-datoms (snapshot/finalize-datoms-jsonl-buffer payload)))
      (is (= [] (snapshot/finalize-datoms-jsonl-buffer (js/Uint8Array.)))))))
