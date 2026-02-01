(ns logseq.db-sync.agent-sandbox-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.worker.agent.sandbox :as sandbox]))

(deftest normalize-base-url-test
  (testing "normalizes sandbox base urls"
    (is (= "https://sandbox.example" (sandbox/normalize-base-url "https://sandbox.example")))
    (is (= "https://sandbox.example" (sandbox/normalize-base-url "https://sandbox.example/")))
    (is (= "http://localhost:8787" (sandbox/normalize-base-url "http://localhost:8787//")))))

(deftest session-endpoint-test
  (testing "builds sandbox session endpoints"
    (let [base "https://sandbox.example"
          session-id "sess-1"]
      (is (= "https://sandbox.example/sandbox/sessions"
             (sandbox/sessions-url base)))
      (is (= "https://sandbox.example/sandbox/sessions/sess-1/messages"
             (sandbox/messages-url base session-id)))
      (is (= "https://sandbox.example/sandbox/sessions/sess-1/stream"
             (sandbox/stream-url base session-id))))))
