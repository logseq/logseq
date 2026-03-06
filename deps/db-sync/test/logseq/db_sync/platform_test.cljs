(ns logseq.db-sync.platform-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.platform.core :as platform]))

(deftest platform-response-test
  (testing "response builds status and headers"
    (let [resp (platform/response "ok" #js {:status 201
                                            :headers #js {"x-test" "1"}})]
      (is (= 201 (.-status resp)))
      (is (= "1" (.get (.-headers resp) "x-test"))))))

(deftest platform-request-url-test
  (testing "request url parsing"
    (let [req (platform/request "https://example.com/health" #js {:method "GET"})
          url (platform/request-url req)]
      (is (= "/health" (.-pathname url)))
      (is (= "example.com" (.-host url))))))
