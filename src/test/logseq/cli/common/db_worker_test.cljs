(ns logseq.cli.common.db-worker-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.set :as set]
            [datascript.core :as d]
            [logseq.cli.common.db-worker :as cli-db-worker]
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
        required-property-keys #{:db/id :block/title :block/created-at :block/updated-at
                                 :logseq.property/type :db/cardinality}
        visible-page (some #(when (= "Visible Page" (:block/title %)) %)
                           (cli-db-worker/list-pages db {}))
        custom-tag-entity (first-user-tag-entity db)
        custom-tag-title (:block/title custom-tag-entity)
        custom-tag (some #(when (= custom-tag-title (:block/title %)) %)
                         (cli-db-worker/list-tags db {}))
        custom-property-entity (first-user-property-entity db)
        custom-property-title (:block/title custom-property-entity)
        custom-property (some #(when (= custom-property-title (:block/title %)) %)
                              (cli-db-worker/list-properties db {}))]
    (testing "list-pages non-expanded includes stable id and timestamps"
      (is (some? visible-page))
      (is (set/subset? required-keys (set (keys visible-page)))))

    (testing "list-tags non-expanded includes stable id and timestamps"
      (is (some? custom-tag))
      (is (set/subset? required-keys (set (keys custom-tag)))))

    (testing "list-properties non-expanded includes stable id, timestamps, and cardinality"
      (is (some? custom-property))
      (is (set/subset? required-property-keys (set (keys custom-property)))))))

(deftest test-list-properties-default-cardinality-contract
  (let [db (create-test-db)
        custom-property-title (:block/title (first-user-property-entity db))
        custom-property (some #(when (= custom-property-title (:block/title %)) %)
                              (cli-db-worker/list-properties db {}))]
    (testing "property without explicit cardinality defaults to :db.cardinality/one"
      (is (some? custom-property))
      (is (= :db.cardinality/one (:db/cardinality custom-property))))))

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
        default-tag-ids (list-item-ids (cli-db-worker/list-tags db {}))
        default-property-ids (list-item-ids (cli-db-worker/list-properties db {}))
        no-built-in-tag-ids (list-item-ids (cli-db-worker/list-tags db {:include-built-in false}))
        no-built-in-property-ids (list-item-ids (cli-db-worker/list-properties db {:include-built-in false}))]
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
        default-ids (list-item-ids (cli-db-worker/list-pages db {}))
        include-hidden-ids (list-item-ids (cli-db-worker/list-pages db {:include-hidden true}))
        exclude-journal-ids (list-item-ids (cli-db-worker/list-pages db {:include-journal false}))
        journal-only-ids (list-item-ids (cli-db-worker/list-pages db {:journal-only true}))
        created-after-ids (list-item-ids (cli-db-worker/list-pages db {:created-after 2500}))
        updated-after-ids (list-item-ids (cli-db-worker/list-pages db {:updated-after "1970-01-01T00:00:03.500Z"}))
        invalid-created-after-ids (list-item-ids (cli-db-worker/list-pages db {:created-after "not-a-date"}))
        invalid-updated-after-ids (list-item-ids (cli-db-worker/list-pages db {:updated-after "still-not-a-date"}))]
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

(deftest test-list-tasks-contract
  (let [db0 (create-test-db)
        visible-id (->> (d/q '[:find [?e ...]
                               :in $ ?title
                               :where [?e :block/title ?title]]
                             db0 "Visible Page")
                        first)
        late-id (->> (d/q '[:find [?e ...]
                            :in $ ?title
                            :where [?e :block/title ?title]]
                          db0 "Late Page")
                     first)
        db1 (d/db-with db0 [[:db/add visible-id :block/tags :logseq.class/Task]
                            [:db/add visible-id :logseq.property/status :logseq.property/status.todo]
                            [:db/add visible-id :logseq.property/priority :logseq.property/priority.high]
                            [:db/add visible-id :logseq.property/scheduled "2026-02-10T08:00:00.000Z"]
                            [:db/add visible-id :logseq.property/deadline "2026-02-12T18:00:00.000Z"]
                            [:db/add late-id :block/tags :logseq.class/Task]
                            [:db/add late-id :logseq.property/status :logseq.property/status.done]
                            [:db/add late-id :logseq.property/priority :logseq.property/priority.low]
                            [:db/add -1 :block/title "Task Block Alpha"]
                            [:db/add -1 :block/page visible-id]
                            [:db/add -1 :block/parent visible-id]
                            [:db/add -1 :block/order "a"]
                            [:db/add -1 :block/created-at 7000]
                            [:db/add -1 :block/updated-at 7100]
                            [:db/add -1 :block/tags :logseq.class/Task]
                            [:db/add -1 :logseq.property/status :logseq.property/status.doing]
                            [:db/add -1 :logseq.property/priority :logseq.property/priority.high]])
        task-block-id (->> (d/q '[:find [?e ...]
                                  :in $ ?title
                                  :where
                                  [?e :block/title ?title]
                                  [?e :block/page]]
                                db1 "Task Block Alpha")
                           first)
        all-ids (list-item-ids (cli-db-worker/list-tasks db1 {}))
        status-ids (list-item-ids (cli-db-worker/list-tasks db1 {:status :logseq.property/status.todo}))
        priority-ids (list-item-ids (cli-db-worker/list-tasks db1 {:priority :logseq.property/priority.high}))
        content-ids (list-item-ids (cli-db-worker/list-tasks db1 {:content "aLpHa"}))
        combined-ids (list-item-ids (cli-db-worker/list-tasks db1 {:status :logseq.property/status.doing
                                                                    :priority :logseq.property/priority.high
                                                                    :content "alpha"}))
        visible-task (->> (cli-db-worker/list-tasks db1 {})
                          (filter #(= visible-id (:db/id %)))
                          first)]
    (testing "task list includes task pages and task blocks"
      (is (contains? all-ids visible-id))
      (is (contains? all-ids late-id))
      (is (contains? all-ids task-block-id)))

    (testing "task filters apply status, priority, and content constraints"
      (is (= #{visible-id} status-ids))
      (is (= #{visible-id task-block-id} priority-ids))
      (is (= #{task-block-id} content-ids))
      (is (= #{task-block-id} combined-ids)))

    (testing "task rows include task property fields"
      (is (= :logseq.property/status.todo (:logseq.property/status visible-task)))
      (is (= :logseq.property/priority.high (:logseq.property/priority visible-task)))
      (is (= "2026-02-10T08:00:00.000Z" (:logseq.property/scheduled visible-task)))
      (is (= "2026-02-12T18:00:00.000Z" (:logseq.property/deadline visible-task))))))

(defn- create-list-node-test-db
  []
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:tag-alpha {}
                         :tag-beta {}
                         :tag-gamma {}}
               :properties {:prop-alpha {:logseq.property/type :default}
                            :prop-beta {:logseq.property/type :default}
                            :prop-gamma {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "Node Page AB"
                                          :block/created-at 1000
                                          :block/updated-at 2000
                                          :build/tags [:tag-alpha :tag-beta]
                                          :build/properties {:prop-alpha "a"
                                                             :prop-beta "b"}}
                                  :blocks [{:block/title "Node Block AB"
                                            :build/tags [:tag-alpha :tag-beta]
                                            :build/properties {:prop-alpha "a"
                                                               :prop-beta "b"}}
                                           {:block/title "Node Block A"
                                            :build/tags [:tag-alpha]
                                            :build/properties {:prop-alpha "a"}}]}
                                 {:page {:block/title "Node Page A"
                                         :block/created-at 3000
                                         :block/updated-at 4000
                                         :build/tags [:tag-alpha]
                                         :build/properties {:prop-alpha "a"}}}
                                 {:page {:block/title "Node Page B"
                                         :block/created-at 5000
                                         :block/updated-at 6000
                                         :build/tags [:tag-beta]
                                         :build/properties {:prop-beta "b"}}}]})]
    @conn))

(defn- title->id
  [db title]
  (->> (d/q '[:find [?e ...]
              :in $ ?title
              :where [?e :block/title ?title]]
            db title)
       first))

(defn- block-title->id
  [db title]
  (->> (d/q '[:find [?e ...]
              :in $ ?title
              :where
              [?e :block/title ?title]
              [?e :block/page]]
            db title)
       first))

(defn- invoke-list-nodes
  [db options]
  (when-let [list-nodes-fn (resolve 'logseq.cli.common.db-worker/list-nodes)]
    (list-nodes-fn db options)))

(defn- class-entity-id-by-name
  [db class-ident block-name]
  (->> (d/q '[:find [?e ...]
              :in $ ?class-ident ?block-name
              :where
              [?e :block/name ?block-name]
              [?e :block/tags ?class]
              [?class :db/ident ?class-ident]]
            db class-ident block-name)
       first))

(defn- property-ident-by-name
  [db block-name]
  (some-> (class-entity-id-by-name db :logseq.class/Property block-name)
          ((fn [id] (d/entity db id)))
          :db/ident))

(deftest test-list-nodes-filter-contract
  (let [db (create-list-node-test-db)
        tag-alpha-id (class-entity-id-by-name db :logseq.class/Tag "tag-alpha")
        tag-beta-id (class-entity-id-by-name db :logseq.class/Tag "tag-beta")
        prop-alpha-ident (property-ident-by-name db "prop-alpha")
        prop-beta-ident (property-ident-by-name db "prop-beta")
        page-ab-id (title->id db "Node Page AB")
        page-a-id (title->id db "Node Page A")
        page-b-id (title->id db "Node Page B")
        block-ab-id (block-title->id db "Node Block AB")
        block-a-id (block-title->id db "Node Block A")
        tag-match-ids (list-item-ids (or (invoke-list-nodes db {:tag-ids [tag-alpha-id tag-beta-id]}) []))
        property-match-ids (list-item-ids (or (invoke-list-nodes db {:property-idents [prop-alpha-ident prop-beta-ident]}) []))
        combined-match-ids (list-item-ids (or (invoke-list-nodes db {:tag-ids [tag-alpha-id tag-beta-id]
                                                                     :property-idents [prop-alpha-ident prop-beta-ident]}) []))
        schema-definition-ids (->> (concat (d/datoms db :avet :block/tags :logseq.class/Tag)
                                           (d/datoms db :avet :block/tags :logseq.class/Property))
                                   (map :e)
                                   set)]
    (testing "list-nodes function must exist"
      (is (some? (resolve 'logseq.cli.common.db-worker/list-nodes))))

    (testing "tag filter uses all-of semantics"
      (is (= #{page-ab-id block-ab-id} tag-match-ids))
      (is (not (contains? tag-match-ids page-a-id)))
      (is (not (contains? tag-match-ids page-b-id))))

    (testing "property filter uses all-of semantics"
      (is (= #{page-ab-id block-ab-id} property-match-ids))
      (is (not (contains? property-match-ids page-a-id)))
      (is (not (contains? property-match-ids block-a-id))))

    (testing "tag/property filters combine with AND semantics"
      (is (= #{page-ab-id block-ab-id} combined-match-ids)))

    (testing "schema-definition entities are excluded from node results"
      (is (empty? (set/intersection tag-match-ids schema-definition-ids)))
      (is (empty? (set/intersection property-match-ids schema-definition-ids)))
      (is (empty? (set/intersection combined-match-ids schema-definition-ids))))))
