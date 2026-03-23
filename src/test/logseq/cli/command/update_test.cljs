(ns logseq.cli.command.update-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.command.update :as update-command]))

(deftest test-build-action-invalid-update-properties
  (testing "returns parse error when update-properties is not a map"
    (let [result (update-command/build-action
                  {:id 207 :update-properties "[\"p1\"]"}
                  "test-repo")]
      (is (not (:ok? result)))
      (is (= "properties must be a map"
             (get-in result [:error :message])))))

  (testing "returns parse error when update-tags is not a vector"
    (let [result (update-command/build-action
                  {:id 207 :update-tags "{\"t1\" true}"}
                  "test-repo")]
      (is (not (:ok? result)))
      (is (string? (get-in result [:error :message])))))

  (testing "valid update-properties map succeeds"
    (let [result (update-command/build-action
                  {:id 207 :update-properties "{\"p1\" \"val\"}"}
                  "test-repo")]
      (is (:ok? result)))))
