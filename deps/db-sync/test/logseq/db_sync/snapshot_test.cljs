(ns logseq.db-sync.snapshot-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.snapshot :as snapshot]))

(deftest transit-frame-roundtrip-test
  (testing "framed transit json roundtrips rows"
    (let [expected [{:addr 1 :content "a" :addresses nil}
                    {:addr 2 :content "b" :addresses "{\"k\":1}"}]
          frame (snapshot/frame-bytes (snapshot/encode-rows expected))
          {:keys [rows buffer]} (snapshot/parse-framed-chunk nil frame)]
      (is (= rows expected))
      (is (or (nil? buffer) (zero? (.-byteLength buffer)))))))

(deftest transit-frame-split-test
  (testing "parse-framed-chunk handles partial trailing frame"
    (let [rows1 [{:addr 1 :content "a" :addresses nil}]
          rows2 [{:addr 2 :content "b" :addresses nil}]
          frame1 (snapshot/frame-bytes (snapshot/encode-rows rows1))
          frame2 (snapshot/frame-bytes (snapshot/encode-rows rows2))
          split-pos (- (.-byteLength frame2) 3)
          part1 (.slice frame2 0 split-pos)
          part2 (.slice frame2 split-pos (.-byteLength frame2))
          {rows1-parsed :rows buffer :buffer} (snapshot/parse-framed-chunk nil (snapshot/concat-bytes frame1 part1))
          {rows2-parsed :rows rows-buffer :buffer} (snapshot/parse-framed-chunk buffer part2)]
      (is (= rows1-parsed rows1))
      (is (= rows2-parsed rows2))
      (is (or (nil? rows-buffer) (zero? (.-byteLength rows-buffer)))))))

(deftest transit-finalize-buffer-test
  (testing "finalize-framed-buffer parses remaining frame"
    (let [rows [{:addr 3 :content "c" :addresses nil}]
          frame (snapshot/frame-bytes (snapshot/encode-rows rows))]
      (is (= rows (snapshot/finalize-framed-buffer frame)))
      (is (= [] (snapshot/finalize-framed-buffer (js/Uint8Array.)))))))

(deftest transit-framed-length-test
  (testing "framed-length sums frame sizes"
    (let [rows1 [{:addr 1 :content "a" :addresses nil}]
          rows2 [{:addr 2 :content "b" :addresses nil}
                 {:addr 3 :content "c" :addresses nil}]
          frame1 (snapshot/frame-bytes (snapshot/encode-rows rows1))
          frame2 (snapshot/frame-bytes (snapshot/encode-rows rows2))]
      (is (= (+ (.-byteLength frame1) (.-byteLength frame2))
             (snapshot/framed-length [rows1 rows2]))))))
