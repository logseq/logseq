(ns logseq.cli.format-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.format :as format]))

(deftest test-format-success
  (testing "json output"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:json? true})]
      (is (= "{\"status\":\"ok\",\"data\":{\"message\":\"ok\"}}" result))))

  (testing "human output"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:json? false})]
      (is (= "ok" result)))))

(deftest test-format-error
  (testing "json error"
    (let [result (format/format-result {:status :error :error {:code :boom :message "nope"}}
                                       {:json? true})]
      (is (= "{\"status\":\"error\",\"error\":{\"code\":\"boom\",\"message\":\"nope\"}}" result))))

  (testing "human error"
    (let [result (format/format-result {:status :error :error {:code :boom :message "nope"}}
                                       {:json? false})]
      (is (= "error: nope" result)))))
