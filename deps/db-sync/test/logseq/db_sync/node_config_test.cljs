(ns logseq.db-sync.node-config-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.node.config :as config]))

(defn- throws? [f]
  (try
    (f)
    false
    (catch :default _ true)))

(deftest normalize-config-drops-unknown-keys-test
  (let [cfg (config/normalize-config {:host "127.0.0.2"
                                      :port 7777
                                      :unknown-key "value"
                                      :legacy-auth-key "value"})]
    (is (= "127.0.0.2" (:host cfg)))
    (is (= 7777 (:port cfg)))
    (is (nil? (:unknown-key cfg)))
    (is (nil? (:legacy-auth-key cfg)))))

(deftest normalize-config-defaults-test
  (let [cfg (config/normalize-config {})]
    (is (= "127.0.0.1" (:host cfg)))
    (is (= 8080 (:port cfg)))))

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
