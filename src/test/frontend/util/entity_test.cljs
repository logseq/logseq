(ns frontend.util.entity-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util.entity :as entity]))

(deftest predicates-read-plain-worker-payload-tags
  (testing "page predicates use plain map tags"
    (is (entity/internal-page? {:block/tags [{:db/ident :logseq.class/Page}]}))
    (is (entity/journal? {:block/tags [:logseq.class/Journal]}))
    (is (entity/class? {:block/tags [{:db/ident :logseq.class/Tag}]}))
    (is (entity/property? {:block/tags [:logseq.class/Property]}))
    (is (entity/page? {:block/tags [:logseq.class/Journal]})))
  (testing "non page payloads and ids are not pages"
    (is (not (entity/page? {:block/tags [:logseq.class/Task]})))
    (is (not (entity/page? 1)))
    (is (not (entity/page? nil)))))
