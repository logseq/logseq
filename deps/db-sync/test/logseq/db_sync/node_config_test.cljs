(ns logseq.db-sync.node-config-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.node.config :as config]))

(defn- with-env
  "Runs f with the given env vars set (a nil value deletes the var), then restores them."
  [vars f]
  (let [env (.-env js/process)
        ks (keys vars)
        saved (into {} (map (fn [k] [k (aget env k)])) ks)
        put! (fn [k v] (if (some? v) (aset env k v) (js-delete env k)))]
    (doseq [[k v] vars] (put! k v))
    (try
      (f)
      (finally
        (doseq [[k v] saved] (put! k v))))))

(deftest normalize-config-defaults-port-without-env-test
  (testing "without DB_SYNC_PORT the server gets the default port, not nil (a random port)"
    (with-env {"DB_SYNC_PORT" nil}
      #(is (= 8080 (:port (config/normalize-config {}))))))
  (testing "an empty DB_SYNC_PORT counts as unset"
    (with-env {"DB_SYNC_PORT" ""}
      #(is (= 8080 (:port (config/normalize-config {}))))))
  (testing "DB_SYNC_PORT and an override still win over the default"
    (with-env {"DB_SYNC_PORT" "9123"}
      #(is (= 9123 (:port (config/normalize-config {})))))
    (with-env {"DB_SYNC_PORT" "9123"}
      #(is (= 7777 (:port (config/normalize-config {:port 7777})))))))

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
