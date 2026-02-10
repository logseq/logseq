(ns frontend.components.cmdk.state-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.cmdk.state :as state]
            [frontend.storage :as storage]))

(deftest default-cmdk-context?-true-for-global-open
  (testing "default cmdk context is true for global open"
    (is (true? (state/default-cmdk-context? {} :global nil)))
    (is (true? (state/default-cmdk-context? {} nil nil)))))

(deftest default-cmdk-context?-false-for-sidebar
  (testing "sidebar cmdk is not treated as default context"
    (is (false? (state/default-cmdk-context? {:sidebar? true} :global nil)))))

(deftest default-cmdk-context?-false-when-initial-input-present
  (testing "initial-input should disable default restore context"
    (is (false? (state/default-cmdk-context? {:initial-input "foo"} :global nil)))))

(deftest default-cmdk-context?-true-when-initial-input-is-nil
  (testing "nil initial-input should still be treated as default cmdk context"
    (is (true? (state/default-cmdk-context? {:initial-input nil} :global nil)))))

(deftest default-cmdk-context?-true-even-with-stale-search-args
  (testing "stale search args should not block default cmdk persistence"
    (is (true? (state/default-cmdk-context? {} :global {:action :noop})))))

(deftest save-last-cmdk-search!-writes-per-repo
  (testing "save writes query and filter-group isolated by repo key"
    (let [saved* (atom {})]
      (with-redefs [storage/get (fn [_] @saved*)
                    storage/set (fn [_ value] (reset! saved* value))]
        (state/save-last-cmdk-search! "repo-a" "first query" :nodes)
        (state/save-last-cmdk-search! "repo-b" "second query" :code)
        (is (= "first query" (get-in @saved* ["repo-a" :query])))
        (is (= :nodes (get-in @saved* ["repo-a" :filter-group])))
        (is (= "second query" (get-in @saved* ["repo-b" :query])))
        (is (= :code (get-in @saved* ["repo-b" :filter-group])))))))

(deftest load-last-cmdk-search-reads-per-repo
  (testing "load reads persisted value by repo key"
    (with-redefs [storage/get (fn [_]
                                {"repo-a" {:query "alpha" :filter-group :nodes}
                                 "repo-b" {:query "beta" :filter-group :code}})]
      (is (= {:query "alpha" :filter-group :nodes}
             (state/load-last-cmdk-search "repo-a")))
      (is (= {:query "beta" :filter-group :code}
             (state/load-last-cmdk-search "repo-b")))
      (is (nil? (state/load-last-cmdk-search "repo-c"))))))

(deftest init-prioritizes-initial-input-over-saved-query
  (testing "initial-input wins over persisted query when both exist"
    (with-redefs [storage/get (fn [_]
                                {"repo-a" {:query "persisted query"
                                           :filter-group :nodes}})]
      (let [result (state/build-initial-cmdk-search
                    {:initial-input "typed query"}
                    :global
                    nil
                    "repo-a")]
        (is (= "typed query" (:input result)))
        (is (nil? (:filter result)))))))

(deftest build-initial-exposes-filter-for-core-init
  (testing "restored filter should be available via :filter"
    (with-redefs [storage/get (fn [_]
                                {"repo-a" {:query "persisted query"
                                           :filter-group :code}})]
      (let [result (state/build-initial-cmdk-search {} :global nil "repo-a")]
        (is (= {:group :code} (:filter result)))))))

(deftest non-default-open-does-not-read-or-overwrite-saved-search
  (testing "non-default mode should not read or write cmdk last search"
    (let [get-count* (atom 0)
          set-count* (atom 0)]
      (with-redefs [storage/get (fn [_]
                                  (swap! get-count* inc)
                                  {"repo-a" {:query "persisted query"
                                             :filter-group :nodes}})
                    storage/set (fn [_ _]
                                  (swap! set-count* inc))]
        (let [result (state/build-initial-cmdk-search {} :themes nil "repo-a")]
          (is (= "" (:input result)))
          (is (= {:group :themes} (:filter result))))
        (state/persist-last-cmdk-search! {} :themes nil "repo-a" "fresh query" {:group :themes})
        (is (= 0 @get-count*))
        (is (= 0 @set-count*))))))

(deftest cmdk-block-search-options-default-and-nodes
  (testing "default and nodes options keep snippet disabled and include expected base params"
    (is (= {:limit 100 :dev? false :built-in? true :enable-snippet? false}
           (state/cmdk-block-search-options {:dev? false})))
    (is (= {:limit 100 :dev? true :built-in? true :enable-snippet? false}
           (state/cmdk-block-search-options {:filter-group :nodes :dev? true})))))

(deftest cmdk-block-search-options-code
  (testing "code filter options include larger search limit and code-only flag"
    (is (= {:limit 100
            :search-limit 300
            :dev? true
            :built-in? true
            :enable-snippet? false
            :code-only? true}
           (state/cmdk-block-search-options {:filter-group :code :dev? true})))))

(deftest cmdk-block-search-options-current-page-and-move-blocks
  (testing "current-page adds page and move-blocks adds page-only flag"
    (is (= {:limit 100
            :enable-snippet? false
            :page "00000000-0000-0000-0000-000000000111"}
           (state/cmdk-block-search-options {:filter-group :current-page
                                                   :dev? false
                                                   :page-uuid #uuid "00000000-0000-0000-0000-000000000111"})))
    (is (= {:limit 100
            :dev? true
            :built-in? true
            :enable-snippet? false
            :page-only? true}
           (state/cmdk-block-search-options {:filter-group :nodes
                                                   :dev? true
                                                   :action :move-blocks})))))
