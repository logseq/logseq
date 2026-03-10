(ns logseq.agents.source-control-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.agents.source-control :as source-control]))

(deftest parse-github-repo-test
  (testing "parses github https and ssh repo urls"
    (is (= {:provider "github" :owner "logseq" :name "web"}
           (source-control/repo-ref "https://github.com/logseq/web.git")))
    (is (= {:provider "github" :owner "logseq" :name "web"}
           (source-control/repo-ref "git@github.com:logseq/web.git")))))

(deftest manual-pr-url-test
  (testing "builds github manual pull request url"
    (is (= "https://github.com/logseq/web/pull/new/main...m14%2Fbranch"
           (source-control/manual-pr-url
            "https://github.com/logseq/web.git"
            "m14/branch"
            "main")))))

(deftest create-pr-rejects-missing-token-test
  (async done
         (-> (source-control/<create-pull-request! #js {}
                                                   nil
                                                   "https://github.com/logseq/web.git"
                                                   {:title "M14 publish"
                                                    :body "M14 publish body"
                                                    :head-branch "m14/publish"
                                                    :base-branch "main"})
             (.then (fn [_]
                      (is false "expected create-pr to reject without token")
                      (done)))
             (.catch (fn [error]
                       (let [data (ex-data error)]
                         (is (= :missing-token (:reason data))))
                       (done))))))
