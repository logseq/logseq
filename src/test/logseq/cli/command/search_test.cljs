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
    (is (= ["search" "tag"] (:cmds (:search-tag by-command))))
    (doseq [command [:search-block :search-page :search-property :search-tag]]
      (is (contains? (get-in by-command [command :spec]) :content))
      (is (= :c (get-in by-command [command :spec :content :alias])))
      (is (= "Search content text" (get-in by-command [command :spec :content :desc]))))))

(deftest test-build-action
  (testing "build-action reads query text from options"
    (let [result (search-command/build-action :search-block {:content "Alpha Beta"} "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= {:type :search-block
              :repo "logseq_db_demo"
              :graph "demo"
              :query "Alpha Beta"}
             (:action result)))))

  (testing "build-action requires repo"
    (let [result (search-command/build-action :search-page {:content "Home"} nil)]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "build-action rejects blank --content"
    (let [result (search-command/build-action :search-tag {:content "   "} "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :missing-query-text (get-in result [:error :code])))))

  (testing "build-action ignores unrelated options"
    (let [result (search-command/build-action :search-page {:content "home" :output "json"} "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= "home" (get-in result [:action :query]))))))

(deftest test-execute-search
  (async done
         (let [calls* (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method [repo [query-text query-input]]]
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
                   (is (re-find #":logseq.class/Tag" (:query-text (nth @calls* 3))))
                   (is (re-find #":logseq.property/deleted-at" (:query-text (nth @calls* 1)))
                       "search-page query pulls :logseq.property/deleted-at to support recycle filtering")
                   (is (re-find #":logseq.property/deleted-at" (:query-text (nth @calls* 0)))
                       "search-block query pulls :logseq.property/deleted-at to support recycle filtering")
                   (is (re-find #"\{:block/parent \.\.\.\}" (:query-text (nth @calls* 0)))
                       "search-block query pulls :block/parent recursively so ldb/recycled? can walk to the page")))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-search-block-renders-block-ref-labels
  (async done
         (let [ref-uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
               calls* (atom [])]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ method args]
                                                  (swap! calls* conj {:method method :args args})
                                                  (case method
                                                    :thread-api/q
                                                    [{:db/id 7
                                                      :block/title (str "foo [[" ref-uuid "]]" )}]

                                                    :thread-api/pull
                                                    {:db/id 99
                                                     :block/uuid (uuid ref-uuid)
                                                     :block/title "bar"}

                                                    nil))]
                 (p/let [result (search-command/execute-search-block
                                 {:type :search-block :repo "demo" :query "foo"}
                                 {})]
                   (is (= :ok (:status result)))
                   (is (= [{:db/id 7
                            :block/title "foo [[bar]]"}]
                          (get-in result [:data :items])))
                   (is (= [:thread-api/q :thread-api/pull]
                          (mapv :method @calls*)))
                   (is (= ["demo"
                           [:db/id :block/uuid :block/title :block/name]
                           [:block/uuid (uuid ref-uuid)]]
                          (-> @calls* second :args)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-search-block-skips-block-on-recycled-page
  ;; Recycled pages get :block/parent set to the Recycle page id and
  ;; :logseq.property/deleted-at stamped on themselves. The recursive
  ;; {:block/parent ...} pull lets ldb/recycled? walk from a child block up
  ;; through its parent chain until it lands on the recycled page's
  ;; :logseq.property/deleted-at.
  (async done
         (let [recycled-page-parent {:db/id 50
                                     :block/title "Old Page"
                                     :logseq.property/deleted-at 1712000000000
                                     :block/parent {:db/id 999 :block/title "Recycle"}}
               live-page-parent {:db/id 51
                                 :block/title "Live Page"}]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                               transport/invoke (fn [_ _ _]
                                                  [{:db/id 1 :block/title "alpha live"
                                                    :block/parent live-page-parent}
                                                   {:db/id 2 :block/title "alpha orphan"
                                                    :block/parent {:db/id 10
                                                                   :block/title "intermediate"
                                                                   :block/parent recycled-page-parent}}
                                                   {:db/id 3 :block/title "alpha tombstone"
                                                    :block/parent recycled-page-parent}])]
                 (p/let [result (search-command/execute-search-block
                                 {:type :search-block :repo "demo" :query "alpha"}
                                 {})]
                   (is (= :ok (:status result)))
                   (is (= [{:db/id 1 :block/title "alpha live"}]
                          (get-in result [:data :items]))
                       "blocks under a recycled page are filtered, even through an intermediate parent block")))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-search-page-skips-recycled-pages
  (async done
         (-> (p/with-redefs [cli-server/ensure-server! (fn [_ _] {:base-url "http://example"})
                             transport/invoke (fn [_ _ _]
                                                [{:db/id 1 :block/title "Home"}
                                                 {:db/id 2 :block/title "Recycled Home"
                                                  :logseq.property/deleted-at 1712000000000}
                                                 {:db/id 3 :block/title "Homework"}])]
               (p/let [result (search-command/execute-search-page
                               {:type :search-page :repo "demo" :query "home"}
                               {})]
                 (is (= :ok (:status result)))
                 (is (= [{:db/id 1 :block/title "Home"}
                         {:db/id 3 :block/title "Homework"}]
                        (get-in result [:data :items]))
                     "recycled page is filtered out and :logseq.property/deleted-at is stripped from output")))
             (p/catch (fn [e] (is false (str "unexpected error: " e))))
             (p/finally done))))