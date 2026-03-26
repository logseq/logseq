(ns logseq.cli.command.search-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.cli.command.search :as search-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-search-command-entries
  (let [entries search-command/entries
        by-command (into {} (map (juxt :command identity) entries))]
    (is (= #{:search-block :search-page :search-property :search-tag}
           (set (keys by-command))))
    (is (= ["search" "block"] (:cmds (:search-block by-command))))
    (is (= ["search" "page"] (:cmds (:search-page by-command))))
    (is (= ["search" "property"] (:cmds (:search-property by-command))))
    (is (= ["search" "tag"] (:cmds (:search-tag by-command))))))

(deftest test-build-action
  (testing "build-action joins positional query args"
    (let [result (search-command/build-action :search-block ["Alpha" "Beta"] "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= {:type :search-block
              :repo "logseq_db_demo"
              :graph "demo"
              :query "Alpha Beta"}
             (:action result)))))

  (testing "build-action requires repo"
    (let [result (search-command/build-action :search-page ["Home"] nil)]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "build-action rejects blank query"
    (let [result (search-command/build-action :search-tag ["   "] "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :missing-query-text (get-in result [:error :code])))))

  (testing "build-action extracts trailing --graph from positional args"
    (let [result (search-command/build-action :search-page ["home" "--graph" "work"] nil)]
      (is (true? (:ok? result)))
      (is (= "logseq_db_work" (get-in result [:action :repo])))
      (is (= "home" (get-in result [:action :query]))))))

(deftest test-execute-search
  (async done
         (let [calls* (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method _ [repo [query-text query-input]]]
                                                  (swap! calls* conj {:method method
                                                                      :repo repo
                                                                      :query-text (pr-str query-text)
                                                                      :query-input query-input})
                                                  [{:db/id 9 :block/title "beta" :unused true}
                                                   {:db/id 7 :block/title "Alpha"}])]
                 (p/let [block-result (search-command/execute-search-block {:type :search-block :repo "demo" :query "alpha"} {})
                         page-result (search-command/execute-search-page {:type :search-page :repo "demo" :query "home"} {})
                         property-result (search-command/execute-search-property {:type :search-property :repo "demo" :query "owner"} {})
                         tag-result (search-command/execute-search-tag {:type :search-tag :repo "demo" :query "quote"} {})]
                   (is (= :ok (:status block-result)))
                   (is (= :ok (:status page-result)))
                   (is (= :ok (:status property-result)))
                   (is (= :ok (:status tag-result)))
                   (is (= [{:db/id 7 :block/title "Alpha"}
                           {:db/id 9 :block/title "beta"}]
                          (get-in block-result [:data :items])))
                   (is (= [:thread-api/q :thread-api/q :thread-api/q :thread-api/q]
                          (mapv :method @calls*)))
                   (is (= ["demo" "demo" "demo" "demo"] (mapv :repo @calls*)))
                   (is (= ["alpha" "home" "owner" "quote"] (mapv :query-input @calls*)))
                   (is (re-find #":block/title" (:query-text (nth @calls* 0))))
                   (is (re-find #":block/name" (:query-text (nth @calls* 1))))
                   (is (re-find #":logseq.class/Property" (:query-text (nth @calls* 2))))
                   (is (re-find #":logseq.class/Tag" (:query-text (nth @calls* 3))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))
