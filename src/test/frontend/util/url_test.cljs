(ns frontend.util.url-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util.url]))

(deftest web-page-url-requires-graph-id-test
  (let [page-url-f (some-> (resolve 'frontend.util.url/get-logseq-web-page-url) deref)]
    (is (fn? page-url-f) "Canonical page URL helper should exist")
    (when page-url-f
      (testing "page routes always include graph-id"
        (is (= "https://logseq.com/page/page-uuid?graph-id=remote-graph-uuid"
               (page-url-f "https://logseq.com" "remote-graph-uuid" "page-uuid"))))
      (testing "missing graph-id fails instead of generating ambiguous page URL"
        (is (thrown? js/Error
                     (page-url-f "https://logseq.com" nil "page-uuid")))))))

(deftest web-block-url-requires-graph-id-test
  (let [block-url-f (some-> (resolve 'frontend.util.url/get-logseq-web-block-url) deref)]
    (is (fn? block-url-f) "Canonical block URL helper should exist")
    (when block-url-f
      (is (= "https://logseq.com/block/block-uuid?graph-id=remote-graph-uuid"
             (block-url-f "https://logseq.com" "remote-graph-uuid" "block-uuid"))))))

(deftest parse-web-url-target-reads-path-route-and-graph-id-test
  (let [parse-f (some-> (resolve 'frontend.util.url/parse-web-url-target) deref)]
    (is (fn? parse-f) "Web URL target parser should exist")
    (when parse-f
      (is (= {:graph-id "remote-graph-uuid"
              :route {:to :page
                      :page-id "page-uuid"}}
             (parse-f "https://logseq.com/page/page-uuid?graph-id=remote-graph-uuid")))
      (is (= {:graph-id "remote-graph-uuid"
              :route {:to :block
                      :block-id "block-uuid"}}
             (parse-f "https://logseq.com/block/block-uuid?graph-id=remote-graph-uuid")))
      (is (= {:graph-id "dc4b7cbd-65f7-4e76-9591-dcb3d14f11cf"
              :route {:to :page
                      :page-id "00000001-2026-0520-0000-000000000000"}}
             (parse-f "http://localhost:3001/#/page/00000001-2026-0520-0000-000000000000?graph-id=dc4b7cbd-65f7-4e76-9591-dcb3d14f11cf"))))))

(deftest parse-web-url-target-reads-compatibility-graph-identifier-test
  (let [parse-f (some-> (resolve 'frontend.util.url/parse-web-url-target) deref)]
    (is (fn? parse-f) "Web URL target parser should exist")
    (when parse-f
      (is (= {:graph-identifier "work"}
             (parse-f "https://logseq.com/#/?graph=work")))
      (is (= {:graph-identifier "work"
              :route {:to :page
                      :page-id "Home"}}
             (parse-f "https://logseq.com/#/page/Home?graph=work")))
      (is (= {:graph-identifier "work"
              :route {:to :page
                      :page-id "Home"}}
             (parse-f "https://logseq.com/?graph=work#/page/Home")))
      (is (= {:graph-id "remote-graph-uuid"
              :route {:to :page
                      :page-id "Home"}}
             (parse-f "https://logseq.com/#/page/Home?graph=work&graph-id=remote-graph-uuid"))))))
