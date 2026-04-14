;; src/test/memo/storage_test.cljs
(ns memo.storage-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.modules.memo.storage :as storage]))

(deftest test-settings-dir-path
  (testing "settings dir is .settings under graph path"
    (is (= (storage/settings-dir "/path/to/graph")
           "/path/to/graph/.settings"))))

(deftest test-setting-type-dir
  (testing "returns correct type directory"
    (is (= (storage/setting-type-dir "/path/to/graph" :character)
           "/path/to/graph/.settings/人物"))
    (is (= (storage/setting-type-dir "/path/to/graph" :world)
           "/path/to/graph/.settings/世界观"))))