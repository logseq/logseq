(ns logseq.cli.mcp-tools-contract-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.set :as set]
            [datascript.core :as d]
            [logseq.cli.common.mcp.tools :as cli-common-mcp-tools]
            [logseq.db.test.helper :as db-test]))

(defn- create-test-db
  []
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:custom-tag {}}
               :properties {:custom-property {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "Visible Page"
                                          :block/created-at 1000
                                          :block/updated-at 2000}}
                                  {:page {:block/title "Hidden Page"
                                          :block/created-at 1500
                                          :block/updated-at 2500
                                          :build/properties {:logseq.property/hide? true}}}
                                  {:page {:build/journal 20260201
                                          :block/created-at 3000
                                          :block/updated-at 4000}}
                                  {:page {:block/title "Late Page"
                                          :block/created-at 5000
                                          :block/updated-at 6000}}]})]
    @conn))

(defn- list-item-ids
  [items]
  (->> items (map :db/id) set))

(defn- first-user-tag-entity
  [db]
  (->> (d/datoms db :avet :block/tags :logseq.class/Tag)
       (map :e)
       (map #(d/entity db %))
       (remove :logseq.property/built-in?)
       first))

(defn- first-user-property-entity
  [db]
  (->> (d/datoms db :avet :block/tags :logseq.class/Property)
       (map :e)
       (map #(d/entity db %))
       (remove :logseq.property/built-in?)
       first))

(deftest test-list-non-expanded-contract
  (let [db (create-test-db)
        required-keys #{:db/id :block/title :block/created-at :block/updated-at}
        visible-page (some #(when (= "Visible Page" (:block/title %)) %)
                           (cli-common-mcp-tools/list-pages db {}))
        custom-tag-entity (first-user-tag-entity db)
        custom-tag-title (:block/title custom-tag-entity)
        custom-tag (some #(when (= custom-tag-title (:block/title %)) %)
                         (cli-common-mcp-tools/list-tags db {}))
        custom-property-entity (first-user-property-entity db)
        custom-property-title (:block/title custom-property-entity)
        custom-property (some #(when (= custom-property-title (:block/title %)) %)
                              (cli-common-mcp-tools/list-properties db {}))]
    (testing "list-pages non-expanded includes stable id and timestamps"
      (is (some? visible-page))
      (is (set/subset? required-keys (set (keys visible-page)))))

    (testing "list-tags non-expanded includes stable id and timestamps"
      (is (some? custom-tag))
      (is (set/subset? required-keys (set (keys custom-tag)))))

    (testing "list-properties non-expanded includes stable id and timestamps"
      (is (some? custom-property))
      (is (set/subset? required-keys (set (keys custom-property)))))))

(deftest test-list-tags-and-properties-include-built-in-default
  (let [db (create-test-db)
        built-in-tag-ids (->> (d/datoms db :avet :block/tags :logseq.class/Tag)
                              (map :e)
                              (map #(d/entity db %))
                              (filter :logseq.property/built-in?)
                              (map :db/id)
                              set)
        built-in-property-ids (->> (d/datoms db :avet :block/tags :logseq.class/Property)
                                   (map :e)
                                   (map #(d/entity db %))
                                   (filter :logseq.property/built-in?)
                                   (map :db/id)
                                   set)
        custom-tag-id (:db/id (first-user-tag-entity db))
        custom-property-id (:db/id (first-user-property-entity db))
        default-tag-ids (list-item-ids (cli-common-mcp-tools/list-tags db {}))
        default-property-ids (list-item-ids (cli-common-mcp-tools/list-properties db {}))
        no-built-in-tag-ids (list-item-ids (cli-common-mcp-tools/list-tags db {:include-built-in false}))
        no-built-in-property-ids (list-item-ids (cli-common-mcp-tools/list-properties db {:include-built-in false}))]
    (testing "built-ins are included by default"
      (is (seq built-in-tag-ids))
      (is (seq built-in-property-ids))
      (is (seq (set/intersection default-tag-ids built-in-tag-ids)))
      (is (seq (set/intersection default-property-ids built-in-property-ids))))

    (testing "include-built-in=false excludes built-ins but keeps user entities"
      (is (contains? no-built-in-tag-ids custom-tag-id))
      (is (contains? no-built-in-property-ids custom-property-id))
      (is (empty? (set/intersection no-built-in-tag-ids built-in-tag-ids)))
      (is (empty? (set/intersection no-built-in-property-ids built-in-property-ids))))))

(deftest test-list-pages-filter-contract
  (let [db (create-test-db)
        hidden-id (->> (d/q '[:find [?e ...]
                              :in $ ?title
                              :where
                              [?e :block/title ?title]
                              [?e :logseq.property/hide? true]]
                            db "Hidden Page")
                       first)
        journal-id (->> (d/datoms db :avet :block/journal-day 20260201)
                        first
                        :e)
        visible-id (->> (d/q '[:find [?e ...]
                               :in $ ?title
                               :where [?e :block/title ?title]]
                             db "Visible Page")
                        first)
        late-id (->> (d/q '[:find [?e ...]
                            :in $ ?title
                            :where [?e :block/title ?title]]
                          db "Late Page")
                     first)
        default-ids (list-item-ids (cli-common-mcp-tools/list-pages db {}))
        include-hidden-ids (list-item-ids (cli-common-mcp-tools/list-pages db {:include-hidden true}))
        exclude-journal-ids (list-item-ids (cli-common-mcp-tools/list-pages db {:include-journal false}))
        journal-only-ids (list-item-ids (cli-common-mcp-tools/list-pages db {:journal-only true}))
        created-after-ids (list-item-ids (cli-common-mcp-tools/list-pages db {:created-after 2500}))
        updated-after-ids (list-item-ids (cli-common-mcp-tools/list-pages db {:updated-after "1970-01-01T00:00:03.500Z"}))
        invalid-created-after-ids (list-item-ids (cli-common-mcp-tools/list-pages db {:created-after "not-a-date"}))
        invalid-updated-after-ids (list-item-ids (cli-common-mcp-tools/list-pages db {:updated-after "still-not-a-date"}))]
    (testing "journals are included by default and hidden pages are excluded by default"
      (is (contains? default-ids journal-id))
      (is (not (contains? default-ids hidden-id))))

    (testing "include-hidden includes hidden pages"
      (is (contains? include-hidden-ids hidden-id)))

    (testing "include-journal and journal-only page filters"
      (is (not (contains? exclude-journal-ids journal-id)))
      (is (= #{journal-id} journal-only-ids)))

    (testing "created-after and updated-after filters"
      (is (contains? created-after-ids journal-id))
      (is (contains? created-after-ids late-id))
      (is (not (contains? created-after-ids visible-id)))
      (is (contains? updated-after-ids journal-id))
      (is (contains? updated-after-ids late-id))
      (is (not (contains? updated-after-ids visible-id))))

    (testing "invalid date filters behave as no-op"
      (is (= default-ids invalid-created-after-ids))
      (is (= default-ids invalid-updated-after-ids)))))
