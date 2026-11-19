(ns frontend.components.server-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.server :as server]))

(deftest add-token-then-type
  (testing "Adding the first token (no token saved yet) and typing its name"
    (let [tokens (server/add-token nil)]
      (is (vector? tokens))
      (is (= [{:name "a"}] (server/update-token tokens 0 :name "a")))))
  (testing "Adding a token after saved ones keeps the order"
    (let [tokens (server/add-token [{:name "a" :value "1"}])]
      (is (= [{:name "a" :value "1"} {:value "2"}]
             (server/update-token tokens 1 :value "2"))))))
