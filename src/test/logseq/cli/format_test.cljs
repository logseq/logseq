(ns logseq.cli.format-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.format :as format]))

(deftest test-format-success
  (testing "json output via output-format"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:output-format :json})]
      (is (= "{\"status\":\"ok\",\"data\":{\"message\":\"ok\"}}" result))))

  (testing "edn output via output-format"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:output-format :edn})]
      (is (= "{:status :ok, :data {:message \"ok\"}}" result))))

  (testing "human output (default)"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:output-format nil})]
      (is (= "ok" result)))))

(deftest test-format-ignores-legacy-json-flag
  (testing "json? flag does not override output-format"
    (let [result (format/format-result {:status :ok :data {:message "ok"}}
                                       {:output-format nil
                                        :json? true})]
      (is (= "ok" result)))))

(deftest test-format-error
  (testing "json error via output-format"
    (let [result (format/format-result {:status :error :error {:code :boom :message "nope"}}
                                       {:output-format :json})]
      (is (= "{\"status\":\"error\",\"error\":{\"code\":\"boom\",\"message\":\"nope\"}}" result))))

  (testing "edn error via output-format"
    (let [result (format/format-result {:status :error :error {:code :boom :message "nope"}}
                                       {:output-format :edn})]
      (is (= "{:status :error, :error {:code :boom, :message \"nope\"}}" result))))

  (testing "human error (default)"
    (let [result (format/format-result {:status :error :error {:code :boom :message "nope"}}
                                       {:output-format nil})]
      (is (= "error: nope" result)))))
