(ns logseq.db-sync.agent-request-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.worker.agent.request :as request]
            [logseq.db-sync.worker.http :as http]))

(deftest sessions-create-coerce-test
  (testing "accepts simplified sessions/create request"
    (let [body {:session-id "sess-1"
                :node-id "node-1"
                :node-title "Title"
                :content "Hello"
                :attachments ["https://example.com/a.png"]
                :project {:id "project-1"
                          :title "Demo Project"
                          :repo-url "https://github.com/example/repo"}
                :agent "codex"}
          coerced (http/coerce-http-request :sessions/create body)]
      (is (= body coerced))))
  (testing "rejects missing required fields"
    (is (nil? (http/coerce-http-request :sessions/create {:session-id "sess-1"})))))

(deftest normalize-session-create-test
  (testing "normalizes simplified request into agent task"
    (let [body {:session-id "sess-1"
                :node-id "node-1"
                :node-title "Title"
                :content "Hello"
                :attachments ["https://example.com/a.png" "https://example.com/b.png"]
                :project {:id "project-1"
                          :title "Demo Project"
                          :repo-url "https://github.com/example/repo"}
                :agent {:provider "codex"
                        :api-token "token-123"
                        :auth-json "{\"tokens\":{\"access_token\":\"abc\"}}"}}
          normalized (request/normalize-session-create body)]
      (is (= {:id "sess-1"
              :source {:node-id "node-1"
                       :node-title "Title"}
              :intent {:content "Hello"
                       :attachments ["https://example.com/a.png"
                                     "https://example.com/b.png"]}
              :project {:id "project-1"
                        :title "Demo Project"
                        :repo-url "https://github.com/example/repo"}
              :agent {:provider "codex"
                      :api-token "token-123"
                      :auth-json "{\"tokens\":{\"access_token\":\"abc\"}}"}
              :capabilities {:push-enabled true
                             :pr-enabled true}}
             normalized)))))

(deftest sessions-pr-coerce-test
  (testing "accepts sessions/pr request payload"
    (let [body {:title "feat: add m14 publish"
                :body "This change enables push + optional PR."
                :commit-message "feat: summarize m14 publish changes"
                :head-branch "m14/publish"
                :base-branch "main"
                :create-pr true
                :force false}
          coerced (http/coerce-http-request :sessions/pr body)]
      (is (= body coerced))))
  (testing "accepts empty sessions/pr payload (defaults resolved in handler)"
    (is (= {} (http/coerce-http-request :sessions/pr {}))))
  (testing "rejects invalid sessions/pr payload"
    (is (nil? (http/coerce-http-request :sessions/pr {:create-pr "yes"})))
    (is (nil? (http/coerce-http-request :sessions/pr {:force "no"})))
    (is (nil? (http/coerce-http-request :sessions/pr {:commit-message 100})))
    (is (nil? (http/coerce-http-request :sessions/pr {:head-branch 42})))))
