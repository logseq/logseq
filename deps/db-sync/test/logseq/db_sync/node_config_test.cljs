(ns logseq.db-sync.node-config-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.node.config :as config]))

(defn- throws? [f]
  (try
    (f)
    false
    (catch :default _ true)))

(deftest normalize-config-drops-unknown-keys-test
  (let [cfg (config/normalize-config {:port 7777
                                      :unknown-key "value"
                                      :legacy-auth-key "value"})]
    (is (= 7777 (:port cfg)))
    (is (nil? (:unknown-key cfg)))
    (is (nil? (:legacy-auth-key cfg)))))

(deftest normalize-config-host-test
  (doseq [host ["127.0.0.1" "::1" "localhost"]]
    (is (= host (:host (config/normalize-config {:host host})))))
  (doseq [host [nil "" " 127.0.0.1" "127.0.0.1 " "http://127.0.0.1" "localhost/path" 127]]
    (is (throws? #(config/normalize-config {:host host})) (str "invalid host: " host)))
  (let [env (.-env js/process)
        original (aget env "DB_SYNC_HOST")]
    (try
      (js-delete env "DB_SYNC_HOST")
      (is (nil? (:host (config/normalize-config {}))))
      (aset env "DB_SYNC_HOST" "127.0.0.1")
      (is (= "127.0.0.1" (:host (config/normalize-config {}))))
      (aset env "DB_SYNC_HOST" "")
      (is (throws? #(config/normalize-config {})))
      (finally
        (if (some? original)
          (aset env "DB_SYNC_HOST" original)
          (js-delete env "DB_SYNC_HOST"))))))

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
