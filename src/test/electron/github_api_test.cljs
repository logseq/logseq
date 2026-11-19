(ns electron.github-api-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.github-api :as github-api]))

(defn- rate-limit-body
  [remaining]
  (clj->js {:resources {:core {:limit 5000 :remaining remaining}}}))

(deftest proxy-usable?
  (testing "The proxy is used while its GitHub rate limit has requests left"
    (is (true? (github-api/proxy-usable? 200 (rate-limit-body 4999)))))
  (testing "The proxy answers 200 even when its GitHub rate limit is used up: then GitHub is used directly"
    (is (false? (github-api/proxy-usable? 200 (rate-limit-body 0)))))
  (testing "A failing proxy is not used"
    (is (false? (github-api/proxy-usable? 503 nil)))))
