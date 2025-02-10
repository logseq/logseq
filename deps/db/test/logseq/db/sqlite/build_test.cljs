(ns logseq.db.sqlite.build-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.test.helper :as db-test]
            [logseq.db :as ldb]
            [logseq.common.util.page-ref :as page-ref]))

(deftest build-tags
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "Jrue Holiday" :build/tags [:Person]}
                      {:block/title "some task" :build/tags [:logseq.class/Task]}]}
            {:page {:block/title "Jayson Tatum" :build/tags [:Person]}}])]
    (is (= [:user.class/Person]
           (mapv :db/ident (:block/tags (db-test/find-block-by-content @conn "Jrue Holiday"))))
        "Person class is created and correctly associated to a block")

    (is (contains?
         (set (map :db/ident (:block/tags (db-test/find-page-by-title @conn "Jayson Tatum"))))
         :user.class/Person)
        "Person class is created and correctly associated to a page")

    (is (= [:logseq.class/Task]
           (mapv :db/ident (:block/tags (db-test/find-block-by-content @conn "some task"))))
        "Built-in class is associatedly correctly")))

(deftest build-properties-user
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "Jrue Holiday" :build/properties {:description "Clutch defense"}}]}
            {:page {:block/title "Jayson Tatum" :build/properties {:description "Awesome selfless basketball"}}}])]
    (is (= "Clutch defense"
           (->> (db-test/find-block-by-content @conn "Jrue Holiday")
                :user.property/description
                db-property/property-value-content))
        "description property is created and correctly associated to a block")

    (is (= "Awesome selfless basketball"
           (->> (db-test/find-page-by-title @conn "Jayson Tatum")
                :user.property/description
                db-property/property-value-content))
        "description property is created and correctly associated to a page")))

(deftest build-properties-built-in
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "some todo"
                       :build/properties {:logseq.task/status :logseq.task/status.doing}}
                      {:block/title "some slide"
                       :build/properties {:logseq.property/background-image "https://placekitten.com/200/300"}}]}])]
    (is (= :logseq.task/status.doing
           (->> (db-test/find-block-by-content @conn "some todo")
                :logseq.task/status
                :db/ident))
        "built-in property with closed value is created and correctly associated to a block")

    (is (= "https://placekitten.com/200/300"
           (->> (db-test/find-block-by-content @conn "some slide")
                :logseq.property/background-image
                db-property/property-value-content))
        "built-in :default property is created and correctly associated to a block")))

(deftest build-for-existing-blocks
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           {:properties {:p1 {}}
            :classes {:MyClass {}}
            :pages-and-blocks
            [{:page {:block/title "page1"}
              :blocks [{:block/title "block 1"}
                       {:block/title "block 2"}]}]})
        block (db-test/find-block-by-content @conn "block 1")
        block2 (db-test/find-block-by-content @conn "block 2")
        {:keys [init-tx block-props-tx]}
        (sqlite-build/build-blocks-tx
         {:pages-and-blocks [{:page (select-keys (:block/page block) [:block/uuid])
                              :blocks [(merge {:block/title "imported task" :block/uuid (:block/uuid block)}
                                              {:build/properties {:logseq.task/status :logseq.task/status.todo}
                                               :build/tags [:logseq.class/Task]})]}]
          :build-existing-tx? true})
        _ (d/transact! conn init-tx)
        _ (d/transact! conn block-props-tx)
        updated-block (d/entity @conn [:block/uuid (:block/uuid block)])
        {init-tx2 :init-tx block-props-tx2 :block-props-tx :as _tx}
        (sqlite-build/build-blocks-tx
         {:pages-and-blocks [{:page (select-keys (:block/page block2) [:block/uuid])
                              :blocks [(merge {:block/title "imported block" :block/uuid (:block/uuid block2)}
                                              {:build/properties {:user.property/p1 "foo"}
                                               :build/tags [:user.class/MyClass]})]}]
          :properties {:user.property/p1 (select-keys (d/entity @conn :user.property/p1)
                                                      [:logseq.property/type :block/uuid])}
          :build-existing-tx? true})
        _ (d/transact! conn init-tx2)
        _ (d/transact! conn block-props-tx2)
        updated-block2 (d/entity @conn [:block/uuid (:block/uuid block2)])]
;;     (cljs.pprint/pprint _tx)
    (testing "block with built-in properties and tags"
      (is (= []
             (filter #(or (:db/id %) (:db/ident %))
                     (concat init-tx block-props-tx)))
          "Tx doesn't try to create new blocks or modify existing idents")
      (is (= "imported task" (:block/title updated-block)))
      (is (= {:block/tags [:logseq.class/Task]
              :logseq.task/status :logseq.task/status.todo}
             (db-test/readable-properties updated-block))
          "Block's properties and tags are updated"))

    (testing "block with existing user properties and tags"
      (is (= "imported block" (:block/title updated-block2)))
      (is (= {:block/tags [:user.class/MyClass]
              :user.property/p1 "foo"}
             (db-test/readable-properties updated-block2))
          "Block's properties and tags are updated"))))

(deftest build-blocks-with-refs
  (let [block-uuid (random-uuid)
        class-uuid (random-uuid)
        page-uuid (random-uuid)
        property-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:classes {:C1 {:block/uuid class-uuid :build/new-class? true}}
               :properties {:p1 {:block/uuid property-uuid :build/new-property? true}}
               :build-existing-tx? true
               :pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "named page ref to [[named page]]"}
                          {:block/title (str "page ref to " (page-ref/->page-ref page-uuid))}
                          {:block/title (str "block ref to " (page-ref/->page-ref block-uuid))}
                          {:block/title (str "class ref to " (page-ref/->page-ref class-uuid))}
                          {:block/title (str "inline class ref to #" (page-ref/->page-ref class-uuid))}
                          {:block/title (str "property ref to " (page-ref/->page-ref property-uuid))}
                          {:block/title "hi" :block/uuid block-uuid}]}
                {:page {:block/title "another page" :block/uuid page-uuid}}]})
        block-with-named-page-ref (db-test/find-block-by-content @conn #"^named page ref")
        block-with-page-ref (db-test/find-block-by-content @conn #"^page ref")
        block-with-class-ref (db-test/find-block-by-content @conn #"^class ref")
        block-with-inline-class-ref (db-test/find-block-by-content @conn #"^inline class ref")
        block-with-property-ref (db-test/find-block-by-content @conn #"^property ref")
        block-with-block-ref (db-test/find-block-by-content @conn #"^block ref")]
    (is (ldb/internal-page? (db-test/find-page-by-title @conn "named page")))
    (is (contains? (:block/refs block-with-named-page-ref) (db-test/find-page-by-title @conn "named page")))

    (is (= page-uuid (:block/uuid (db-test/find-page-by-title @conn "another page"))))
    (is (contains? (:block/refs block-with-page-ref) (db-test/find-page-by-title @conn "another page")))

    (is (= class-uuid (:block/uuid (d/entity @conn :user.class/C1))))
    (is (contains? (:block/refs block-with-class-ref) (d/entity @conn :user.class/C1)))
    (is (contains? (:block/refs block-with-inline-class-ref) (d/entity @conn :user.class/C1)))

    (is (= property-uuid (:block/uuid (d/entity @conn :user.property/p1))))
    (is (contains? (:block/refs block-with-property-ref) (d/entity @conn :user.property/p1)))

    (is (= block-uuid (:block/uuid (db-test/find-block-by-content @conn "hi"))))
    (is (contains? (:block/refs block-with-block-ref) (db-test/find-block-by-content @conn "hi")))))