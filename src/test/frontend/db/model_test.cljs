(ns frontend.db.model-test
  (:require [cljs.test :refer [use-fixtures deftest is testing]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.model :as model]
            [frontend.db.utils]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [logseq.melange.bridge.db.test-helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.property :as outliner-property]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(def test-db test-helper/test-db)

(deftest test-page-alias-set
  (load-test-files
   [{:page {:block/title "aa"
            :build/properties {:block/alias #{[:build/page {:block/title "ab"}]
                                              [:build/page {:block/title "ac"}]}}}}
    {:page {:block/title "ae"}
     :blocks [{:block/title "## ref to [[aa]]"}]}])

  (let [page-id (:db/id (test-helper/find-page-by-title "aa"))
        a-aliases (model/page-alias-set test-db page-id)]
    (is (= 3 (count a-aliases)))
    (is (contains? a-aliases page-id) "canonical page included in alias set")))

(deftest page-alias-invariants-reject-invalid-via-set-block-property
  (testing "self-alias is rejected"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "p-self"}}]})
          page (db-test/find-page-by-title @conn "p-self")]
      (is (thrown? js/Error
                   (outliner-property/set-block-property!
                    conn (:db/id page) :block/alias (:db/id page))))))
  (testing "duplicate owner is rejected"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "owner1"}}
                                    {:page {:block/title "owner2"}}
                                    {:page {:block/title "shared-alias"}}]})
          owner1  (db-test/find-page-by-title @conn "owner1")
          owner2  (db-test/find-page-by-title @conn "owner2")
          s-alias (db-test/find-page-by-title @conn "shared-alias")]
      (outliner-property/set-block-property!
       conn (:db/id owner1) :block/alias (:db/id s-alias))
      (is (thrown? js/Error
                   (outliner-property/set-block-property!
                    conn (:db/id owner2) :block/alias (:db/id s-alias))))))
  (testing "alias page that owns aliases is rejected"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "canonical"}}
                                    {:page {:block/title "mid"}}
                                    {:page {:block/title "leaf"}}]})
          canonical (db-test/find-page-by-title @conn "canonical")
          mid       (db-test/find-page-by-title @conn "mid")
          leaf      (db-test/find-page-by-title @conn "leaf")]
      ;; mid owns leaf first — mid now has aliases so cannot itself be used as alias
      (outliner-property/set-block-property!
       conn (:db/id mid) :block/alias (:db/id leaf))
      ;; now canonical trying to claim mid (which owns aliases) must fail
      (is (thrown? js/Error
                   (outliner-property/set-block-property!
                    conn (:db/id canonical) :block/alias (:db/id mid)))
          "page owning aliases cannot be used as an alias")))
  (testing "source page that is already an alias cannot own aliases"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "root"}}
                                    {:page {:block/title "already-alias"}}
                                    {:page {:block/title "new-target"}}]})
          root         (db-test/find-page-by-title @conn "root")
          already-a    (db-test/find-page-by-title @conn "already-alias")
          new-target   (db-test/find-page-by-title @conn "new-target")]
      (outliner-property/set-block-property!
       conn (:db/id root) :block/alias (:db/id already-a))
      (is (thrown? js/Error
                   (outliner-property/set-block-property!
                    conn (:db/id already-a) :block/alias (:db/id new-target)))
          "page that is an alias cannot gain its own aliases"))))

(deftest page-alias-converts-string-value-via-set-block-property
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "canonical-string-alias"}}]})
        canonical (db-test/find-page-by-title @conn "canonical-string-alias")]
    (outliner-property/set-block-property!
     conn (:db/id canonical) :block/alias "string-alias")
    (let [alias-page (db-test/find-page-by-title @conn "string-alias")
          canonical' (d/entity @conn (:db/id canonical))]
      (is alias-page)
      (is (= #{(:db/id alias-page)}
             (set (map :db/id (:block/alias canonical'))))))))

(deftest clear-status-updates-task-tag
  (testing "removes Task when status is the only task property"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "task"
                            :build/tags [:logseq.class/Task]
                            :build/properties {:logseq.property/status :logseq.property/status.todo}}]}])
          block-id (:block/uuid (db-test/find-block-by-content @conn "task"))]
      (outliner-op/apply-ops! conn [[:batch-remove-property [[block-id] :logseq.property/status]]] {})
      (outliner-op/apply-ops! conn [[:batch-remove-property [[block-id] :logseq.property/status]]] {})
      (let [block (d/entity @conn [:block/uuid block-id])]
        (is (not (contains? (d/pull @conn [:logseq.property/status] [:block/uuid block-id])
                            :logseq.property/status)))
        (is (not (contains? (set (map :db/ident (:block/tags block)))
                            :logseq.class/Task))))))

  (testing "keeps Task for other task properties and in the Task view"
    (doseq [[properties opts] [[{:logseq.property/priority :logseq.property/priority.high} {}]
                               [{:logseq.property/deadline 20260715} {}]
                               [{:logseq.property/scheduled 20260716} {}]
                               [{} {:preserve-task-tag? true}]]]
      (let [conn (db-test/create-conn-with-blocks
                  [{:page {:block/title "page1"}
                    :blocks [{:block/title "task"
                              :build/tags [:logseq.class/Task]
                              :build/properties (assoc properties
                                                       :logseq.property/status
                                                       :logseq.property/status.todo)}]}])
            block-id (:block/uuid (db-test/find-block-by-content @conn "task"))]
        (outliner-op/apply-ops! conn [[:batch-set-property [[block-id]
                                                            :logseq.property/status
                                                            nil
                                                            opts]]] {})
        (let [block (d/entity @conn [:block/uuid block-id])]
          (is (= :logseq.property/empty-placeholder
                 (:db/ident (:logseq.property/status block))))
          (is (contains? (set (map :db/ident (:block/tags block)))
                         :logseq.class/Task)))))))

(deftest clear-status-handles-default-and-class-provided-status
  (testing "removes Task when clearing its implicit default status"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "implicit task"
                            :build/tags [:logseq.class/Task]}]}])
          block-id (:block/uuid (db-test/find-block-by-content @conn "implicit task"))]
      (outliner-op/apply-ops! conn [[:batch-remove-property [[block-id] :logseq.property/status]]] {})
      (let [block (d/entity @conn [:block/uuid block-id])]
        (is (not (contains? (d/pull @conn [:logseq.property/status] [:block/uuid block-id])
                            :logseq.property/status)))
        (is (not (contains? (set (map :db/ident (:block/tags block)))
                            :logseq.class/Task))))))

  (testing "stores an empty placeholder when a non-Task class provides status"
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Project {:build/class-properties [:logseq.property/status]}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "project task"
                             :build/tags [:Project]
                             :build/properties {:logseq.property/status
                                                :logseq.property/status.doing}}]}]})
          block-id (:block/uuid (db-test/find-block-by-content @conn "project task"))]
      (outliner-op/apply-ops! conn [[:batch-remove-property [[block-id] :logseq.property/status]]] {})
      (let [block (d/entity @conn [:block/uuid block-id])]
        (is (= :logseq.property/empty-placeholder
               (:db/ident (:logseq.property/status block))))
        (is (= [:user.class/Project]
               (mapv :db/ident (:block/tags block))))))))

(deftest clear-status-uses-task-class-properties
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "task"
                          :build/tags [:logseq.class/Task]
                          :build/properties {:logseq.property/status :logseq.property/status.todo
                                             :logseq.property/description "details"}}]}])
        block-id (:block/uuid (db-test/find-block-by-content @conn "task"))]
    (d/transact! conn [[:db/add :logseq.class/Task
                        :logseq.property.class/properties
                        :logseq.property/description]])
    (outliner-op/apply-ops! conn [[:batch-remove-property [[block-id]
                                                           :logseq.property/status]]] {})
    (let [block (d/entity @conn [:block/uuid block-id])]
      (is (= :logseq.property/empty-placeholder
             (:db/ident (:logseq.property/status block))))
      (is (contains? (set (map :db/ident (:block/tags block)))
                     :logseq.class/Task)))))

(deftest clear-status-public-remove-ops
  (testing "keeps Task when the public remove-property op clears status with another task property"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "task"
                            :build/tags [:logseq.class/Task]
                            :build/properties {:logseq.property/status :logseq.property/status.todo
                                               :logseq.property/scheduled 20260716}}]}])
          block-id (:block/uuid (db-test/find-block-by-content @conn "task"))]
      (outliner-op/apply-ops! conn [[:remove-block-property [block-id :logseq.property/status]]] {})
      (let [block (d/entity @conn [:block/uuid block-id])]
        (is (= :logseq.property/empty-placeholder
               (:db/ident (:logseq.property/status block))))
        (is (contains? (set (map :db/ident (:block/tags block)))
                       :logseq.class/Task)))))

  (testing "applies the same Task cleanup through the public batch-remove op"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "status only"
                            :build/tags [:logseq.class/Task]
                            :build/properties {:logseq.property/status :logseq.property/status.todo}}
                           {:block/title "scheduled task"
                            :build/tags [:logseq.class/Task]
                            :build/properties {:logseq.property/status :logseq.property/status.todo
                                               :logseq.property/scheduled 20260716}}]}])
          block-ids (mapv #(-> (db-test/find-block-by-content @conn %) :block/uuid)
                          ["status only" "scheduled task"])]
      (outliner-op/apply-ops! conn [[:batch-remove-property [block-ids :logseq.property/status]]] {})
      (let [[status-only scheduled-task] (map #(d/entity @conn [:block/uuid %]) block-ids)]
        (is (not (contains? (set (map :db/ident (:block/tags status-only)))
                            :logseq.class/Task)))
        (is (= :logseq.property/empty-placeholder
               (:db/ident (:logseq.property/status scheduled-task))))
        (is (contains? (set (map :db/ident (:block/tags scheduled-task)))
                       :logseq.class/Task)))))

  (testing "handles mixed blocks independently and keeps unrelated tags"
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Project {}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "status only"
                             :build/tags [:logseq.class/Task :Project]
                             :build/properties {:logseq.property/status :logseq.property/status.todo}}
                            {:block/title "scheduled task"
                             :build/tags [:logseq.class/Task]
                             :build/properties {:logseq.property/status :logseq.property/status.todo
                                                :logseq.property/scheduled 20260716}}]}]})
          block-ids (mapv #(-> (db-test/find-block-by-content @conn %) :block/uuid)
                          ["status only" "scheduled task"])]
      (outliner-op/apply-ops! conn [[:batch-remove-property [block-ids :logseq.property/status]]] {})
      (let [[status-only scheduled-task] (map #(d/entity @conn [:block/uuid %]) block-ids)]
        (is (= #{"Project"}
               (set (map :block/title (:block/tags status-only)))))
        (is (= :logseq.property/empty-placeholder
               (:db/ident (:logseq.property/status scheduled-task))))
        (is (contains? (set (map :db/ident (:block/tags scheduled-task)))
                       :logseq.class/Task))))))

(deftest clear-status-retracts-direct-status-without-provider
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "plain block"}]}])
        block-id (:block/uuid (db-test/find-block-by-content @conn "plain block"))]
    (d/transact! conn [[:db/add [:block/uuid block-id]
                        :logseq.property/status
                        :logseq.property/status.doing]])
    (outliner-op/apply-ops! conn [[:batch-remove-property [[block-id]
                                                           :logseq.property/status]]] {})
    (let [block (d/entity @conn [:block/uuid block-id])]
      (is (not (contains? (d/pull @conn [:logseq.property/status]
                                  [:block/uuid block-id])
                          :logseq.property/status)))
      (is (not (contains? (set (map :db/ident (:block/tags block)))
                          :logseq.class/Task))))))

(deftest page-alias-invariants-reject-invalid-via-batch-set-property
  (testing "batch path: duplicate owner is rejected"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "b-owner1"}}
                                    {:page {:block/title "b-owner2"}}
                                    {:page {:block/title "b-shared"}}]})
          b-owner1 (db-test/find-page-by-title @conn "b-owner1")
          b-owner2 (db-test/find-page-by-title @conn "b-owner2")
          b-shared (db-test/find-page-by-title @conn "b-shared")]
      (outliner-property/batch-set-property!
       conn [(:block/uuid b-owner1)] :block/alias (:db/id b-shared) {:entity-id? true})
      (is (thrown? js/Error
                   (outliner-property/batch-set-property!
                    conn [(:block/uuid b-owner2)] :block/alias (:db/id b-shared) {:entity-id? true}))
          "batch-set path must enforce duplicate-owner invariant")))
  (testing "batch path: one alias cannot be assigned to multiple pages in one transaction"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks [{:page {:block/title "batch-owner1"}}
                                    {:page {:block/title "batch-owner2"}}
                                    {:page {:block/title "batch-shared"}}]})
          owner1 (db-test/find-page-by-title @conn "batch-owner1")
          owner2 (db-test/find-page-by-title @conn "batch-owner2")
          shared (db-test/find-page-by-title @conn "batch-shared")]
      (is (thrown? js/Error
                   (outliner-property/batch-set-property!
                    conn
                    [(:block/uuid owner1) (:block/uuid owner2)]
                    :block/alias
                    (:db/id shared)
                    {:entity-id? true}))
          "batch-set path must not create multiple owners for the same alias"))))

(defn- page-mention-check?
  [page-name include-journals?]
  (->> (model/get-pages-that-mentioned-page test-db (:db/id (test-helper/find-page-by-title page-name)) include-journals?)
       (map (fn [id] (:block/name (db/entity id))))))

(deftest get-pages-that-mentioned-page-with-show-journal
  (let [page-one-uuid (random-uuid)
        generic-page-uuid (random-uuid)
        journal-2020-12-26-uuid (random-uuid)]
    (load-test-files
     [;; -------- Pages --------
      {:page {:block/title "page one"
              :build/keep-uuid? true
              :block/uuid page-one-uuid}
       :blocks
       [{:block/title (str "- page one has link to [["
                           journal-2020-12-26-uuid
                           "]] journal page")}]}
      {:page {:block/title "generic page"
              :build/keep-uuid? true
              :block/uuid generic-page-uuid}
       :blocks
       [{:block/title (str "- link to page one [[" page-one-uuid "]]")}]}
      ;; -------- Journals --------
      {:page {:build/journal 20201226
              :build/keep-uuid? true
              :block/uuid journal-2020-12-26-uuid}}
      {:page {:build/journal 20200815}
       :blocks
       [{:block/title (str "link 1 to [[" page-one-uuid "]] and link to [[" generic-page-uuid "]]")}]}
      {:page {:build/journal 20200918}
       :blocks
       [{:block/title (str "link 2 to [[" page-one-uuid "]]")}]}]))

  (is (= #{"sep 18th, 2020" "aug 15th, 2020" "generic page"}
         (set (page-mention-check? "page one" true)))
      "Must be 'generic page' + 2 journals")

  (is (= '("generic page")
         (page-mention-check? "page one" false))
      "Must be only 'generic page'")

  (is (= '("aug 15th, 2020")
         (page-mention-check? "generic page" true))
      "Must show only 'aug 15th, 2020'")

  (is (= '()
         (page-mention-check? "generic page" false))
      "Must be empty"))

(deftest entity-query-should-return-nil-if-id-not-exists
  (is (nil? (db/entity 1000000))))

(deftest entity-query-should-support-both-graph-string-and-db
  (db/transact! test-db [{:db/id 1 :value "test"}])
  (is (= 1 (:db/id (db/entity test-db 1))))
  (is (= 1 (:db/id (db/entity (conn/get-db test-db) 1)))))

(deftest get-latest-journals-should-exclude-recycled-journal-pages
  (load-test-files
   [{:page {:build/journal 20240101}}
    {:page {:build/journal 20240102}}
    {:page {:build/journal 20240103}}])
  (let [journal-2024-01-02-id (ffirst (d/q '[:find ?e
                                              :where
                                              [?e :block/journal-day 20240102]]
                                            (conn/get-db test-db)))]
    (db/transact! test-db [{:db/id journal-2024-01-02-id
                            :logseq.property/deleted-at 1704196800000}]))
  (is (= [20240103 20240101]
         (mapv :block/journal-day (model/get-latest-journals test-db 10)))))

(deftest get-block-by-page-name-and-block-route-name
  (load-test-files
   [{:page {:block/title "foo"}
     :blocks [{:block/title "b2"}
              {:block/title "Header 2"
               :build/properties {:logseq.property/heading 3}}]}])
  (is (uuid?
       (:block/uuid
        (let [page (db/get-page "foo")]
          (model/get-block-by-page-name-and-block-route-name test-db (str (:block/uuid page)) "header 2"))))
      "Header block's content returns map with :block/uuid")

  (is (nil?
       (let [page (db/get-page "foo")]
         (model/get-block-by-page-name-and-block-route-name test-db (str (:block/uuid page)) "b2")))
      "Non header block's content returns nil"))

(deftest get-block-immediate-children
  (load-test-files
   [{:page {:block/title "page1"}
     :blocks [{:block/title "parent"
               :build/children [{:block/title "child 1"
                                 :build/children [{:block/title "grandchild 1"}]}
                                {:block/title "child 2"
                                 :build/children [{:block/title "grandchild 2"}]}
                                {:block/title "child 3"}]}]}])
  (let [parent (-> (d/q '[:find (pull ?b [*]) :where [?b :block/title "parent"]]
                        (conn/get-db test-db))
                   ffirst)]
    (is (= ["child 1" "child 2" "child 3"]
           (map :block/title
                (model/get-block-immediate-children test-db (:block/uuid parent)))))))

(deftest with-pages-preserves-page-ref-when-ui-db-is-partial
  (let [page-ref {:db/id 1}
        block {:db/id 2
               :block/uuid (random-uuid)
               :block/page page-ref}]
    (with-redefs [frontend.db.utils/pull-many (fn [& _] nil)]
      (is (= page-ref
             (:block/page (first (model/with-pages [block]))))
          "When page entity details are unavailable locally, keep the original page ref instead of replacing it with nil"))))
