(ns frontend.handler.graph-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.handler.graph]))

(deftest normalize-registry-entry-prefers-remote-graph-id-test
  (let [normalize-f (some-> (resolve 'frontend.handler.graph/normalize-registry-entry) deref)]
    (is (fn? normalize-f) "Graph registry entry normalizer should exist")
    (when normalize-f
      (testing "remote graphs use the RTC graph uuid as canonical graph-id"
        (is (= {:repo "logseq_db_work"
                :graph-name "work"
                :local-graph-id "local-uuid"
                :rtc-graph-id "remote-uuid"
                :graph-id "remote-uuid"}
               (select-keys
                (normalize-f {:repo "logseq_db_work"
                              :graph-name "work"
                              :local-graph-id "local-uuid"
                              :rtc-graph-id "remote-uuid"})
                [:repo :graph-name :local-graph-id :rtc-graph-id :graph-id]))))
      (testing "local-only graphs use local graph uuid as canonical graph-id"
        (is (= "local-uuid"
               (:graph-id (normalize-f {:repo "logseq_db_local"
                                        :graph-name "local"
                                        :local-graph-id "local-uuid"})))))
      (testing "missing graph identity fails fast"
        (is (thrown? js/Error
                     (normalize-f {:repo "logseq_db_broken"
                                   :graph-name "broken"})))))))

(deftest resolve-registry-target-prefers-graph-id-test
  (let [resolve-f (some-> (resolve 'frontend.handler.graph/resolve-registry-target) deref)]
    (is (fn? resolve-f) "Graph registry target resolver should exist")
    (when resolve-f
      (let [registry [{:repo "logseq_db_work"
                       :graph-name "work"
                       :graph-id "remote-uuid"}
                      {:repo "logseq_db_other"
                       :graph-name "work"
                       :graph-id "other-uuid"}]]
        (is (= "logseq_db_work"
               (:repo (resolve-f registry {:graph-id "remote-uuid"}))))
        (is (= "logseq_db_other"
               (:repo (resolve-f registry {:graph-identifier "logseq_db_other"}))))
        (is (nil? (resolve-f registry {:graph-id "missing-uuid"})))))))
