(ns logseq.cli.command.show-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.show :as show-command]))

(deftest test-build-action-stdin-id
  (testing "reads id from stdin when id flag is present without a value"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "42"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= 42 (get-in result [:action :id])))
      (is (= [42] (get-in result [:action :ids])))
      (is (false? (get-in result [:action :multi-id?])))))

  (testing "reads multi-id vector from stdin"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "[1 2 3]"}
                                            "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= [1 2 3] (get-in result [:action :ids])))
      (is (true? (get-in result [:action :multi-id?])))))

  (testing "blank stdin returns invalid options"
    (let [result (show-command/build-action {:id ""
                                             :id-from-stdin? true
                                             :stdin "   "}
                                            "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (string/includes? (get-in result [:error :message]) "id")))))
