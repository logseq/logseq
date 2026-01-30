(ns logseq.db-sync.node-config-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.node.config :as config]))

(defn- throws? [f]
  (try
    (f)
    false
    (catch :default _ true)))

(deftest normalize-config-auth-driver-test
  (testing "static auth driver accepted"
    (let [cfg (config/normalize-config {:auth-driver "static" :auth-token "x"})]
      (is (= "static" (:auth-driver cfg)))))
  (testing "unsupported auth driver throws"
    (is (throws? #(config/normalize-config {:auth-driver "nope"})))))

(deftest normalize-config-storage-driver-test
  (testing "sqlite storage driver accepted"
    (let [cfg (config/normalize-config {:storage-driver "sqlite"})]
      (is (= "sqlite" (:storage-driver cfg)))))
  (testing "unsupported storage driver throws"
    (is (throws? #(config/normalize-config {:storage-driver "other"})))))

(deftest normalize-config-assets-driver-test
  (testing "filesystem assets driver accepted"
    (let [cfg (config/normalize-config {:assets-driver "filesystem"})]
      (is (= "filesystem" (:assets-driver cfg)))))
  (testing "unsupported assets driver throws"
    (is (throws? #(config/normalize-config {:assets-driver "s3"})))))
