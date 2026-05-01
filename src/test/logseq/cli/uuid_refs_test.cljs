(ns logseq.cli.uuid-refs-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.cli.uuid-refs :as uuid-refs]))

(deftest test-extract-uuid-refs
  (let [uuid-a "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"
        uuid-b "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]
    (is (= ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
            "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]
           (uuid-refs/extract-uuid-refs
            (str "One [[" uuid-a "]] and two [[" uuid-b "]] and one again [[" uuid-a "]]"))))))

(deftest test-replace-uuid-refs
  (let [uuid-a "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        uuid-b "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
        missing-uuid "cccccccc-cccc-cccc-cccc-cccccccccccc"]
    (is (= "alpha [[Ref A]] omega [[Ref B]]"
           (uuid-refs/replace-uuid-refs
            (str "alpha [[" uuid-a "]] omega [[" uuid-b "]]" )
            {uuid-a "Ref A"
             uuid-b "Ref B"})))
    (is (= (str "[[Parent [[Child]]]] and [[" missing-uuid "]]" )
           (uuid-refs/replace-uuid-refs
            (str "[[" uuid-a "]] and [[" missing-uuid "]]" )
            {uuid-a (str "Parent [[" uuid-b "]]" )
             uuid-b "Child"})))
    (is (= (str "missing [[" missing-uuid "]]" )
           (uuid-refs/replace-uuid-refs
            (str "missing [[" missing-uuid "]]" )
            {})))))

(deftest test-collect-uuid-refs-from-strings
  (let [uuid-a "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"
        uuid-b "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]
    (is (= ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
            "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]
           (uuid-refs/collect-uuid-refs-from-strings
            [(str "Step [[" uuid-a "]]" )
             nil
             "No refs here"
             (str "Then [[" uuid-b "]] and again [[" uuid-a "]]" )])))))
