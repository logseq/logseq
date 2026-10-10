(ns logseq.db.common.reference-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.common.reference :as db-reference]
            [logseq.db.test.helper :as db-test]))

(defn- ref-block-ids
  [result]
  (set (map :db/id (:ref-blocks result))))

(defn- unlinked-titles
  [refs]
  (set (map :block/title refs)))

(defn- create-self-ref-conn
  []
  (db-test/create-conn-with-blocks
   {:pages-and-blocks
    [{:page {:block/title "SelfRefTarget"}
      :blocks [{:block/title "self-linked mentions [[SelfRefTarget]]"}
               {:block/title "self-unlinked mentions SelfRefTarget"}]}
     {:page {:block/title "SelfRefAlias"}
      :blocks [{:block/title "alias-linked mentions [[SelfRefTarget]]"}
               {:block/title "alias-unlinked mentions SelfRefTarget"}]}
     {:page {:block/title "SelfRefOther"}
      :blocks [{:block/title "other-linked mentions [[SelfRefTarget]]"}
               {:block/title "other-unlinked mentions SelfRefTarget"}]}]}))

(deftest get-linked-references-excludes-blocks-on-the-page-itself
  (let [conn (create-self-ref-conn)
        target (db-test/find-page-by-title @conn "SelfRefTarget")
        self-linked (db-test/find-block-by-content @conn #"^self-linked")
        alias-linked (db-test/find-block-by-content @conn #"^alias-linked")
        other-linked (db-test/find-block-by-content @conn #"^other-linked")
        result (db-reference/get-linked-references @conn (:db/id target))
        ids (ref-block-ids result)]
    (is (contains? ids (:db/id other-linked))
        "A mention from another page stays in Linked References.")
    (is (contains? ids (:db/id alias-linked))
        "A mention from a not-yet-aliased page stays in Linked References.")
    (is (not (contains? ids (:db/id self-linked)))
        "A block that lives on the page itself is excluded.")
    (is (= 2 (count (:ref-blocks result))))))

(deftest get-linked-references-excludes-blocks-on-alias-pages
  (let [conn (create-self-ref-conn)
        target (db-test/find-page-by-title @conn "SelfRefTarget")
        alias (db-test/find-page-by-title @conn "SelfRefAlias")
        self-linked (db-test/find-block-by-content @conn #"^self-linked")
        alias-linked (db-test/find-block-by-content @conn #"^alias-linked")
        other-linked (db-test/find-block-by-content @conn #"^other-linked")
        _ (d/transact! conn [[:db/add (:db/id target) :block/alias (:db/id alias)]])
        result (db-reference/get-linked-references @conn (:db/id target))
        ids (ref-block-ids result)]
    (is (contains? ids (:db/id other-linked)))
    (is (not (contains? ids (:db/id self-linked))))
    (is (not (contains? ids (:db/id alias-linked)))
        "A block that lives on an alias of the page is excluded.")
    (is (= 1 (count (:ref-blocks result))))))

(deftest get-unlinked-references-excludes-blocks-on-the-page-itself
  (let [conn (create-self-ref-conn)
        target (db-test/find-page-by-title @conn "SelfRefTarget")
        titles (unlinked-titles (db-reference/get-unlinked-references @conn (:db/id target)))]
    (is (contains? titles "other-unlinked mentions SelfRefTarget")
        "A plain-text mention from another page stays in Unlinked References.")
    (is (not (contains? titles "self-unlinked mentions SelfRefTarget"))
        "A plain-text mention that lives on the page itself is excluded.")
    (is (contains? titles "alias-unlinked mentions SelfRefTarget")
        "A mention on a page that is not an alias remains an unlinked reference.")))

(deftest get-unlinked-references-excludes-blocks-on-alias-pages
  (let [conn (create-self-ref-conn)
        target (db-test/find-page-by-title @conn "SelfRefTarget")
        alias (db-test/find-page-by-title @conn "SelfRefAlias")
        _ (d/transact! conn [[:db/add (:db/id target) :block/alias (:db/id alias)]])
        titles (unlinked-titles (db-reference/get-unlinked-references @conn (:db/id target)))]
    (is (contains? titles "other-unlinked mentions SelfRefTarget"))
    (is (not (contains? titles "self-unlinked mentions SelfRefTarget")))
    (is (not (contains? titles "alias-unlinked mentions SelfRefTarget"))
        "A plain-text mention that lives on an alias of the page is excluded.")
    (is (not (contains? titles "SelfRefAlias"))
        "The alias page entity itself is not an unlinked reference.")))

(deftest get-block-refs-count-excludes-blocks-on-the-page-itself
  (testing "ref counts stay aligned with visible linked references"
    (let [conn (create-self-ref-conn)
          target (db-test/find-page-by-title @conn "SelfRefTarget")
          target-id (:db/id target)
          linked (db-reference/get-linked-references @conn target-id)
          count* (common-initial-data/get-block-refs-count @conn target-id)]
      (is (= 2 count*)
          "Self-mentions on the page do not inflate the linked-reference count.")
      (is (= (count (:ref-blocks linked)) count*))
      (is (= (count (common-initial-data/get-block-refs @conn target-id)) count*))))
  (testing "alias-page self-mentions are also omitted from the count"
    (let [conn (create-self-ref-conn)
          target (db-test/find-page-by-title @conn "SelfRefTarget")
          alias (db-test/find-page-by-title @conn "SelfRefAlias")
          _ (d/transact! conn [[:db/add (:db/id target) :block/alias (:db/id alias)]])
          target-id (:db/id target)
          count* (common-initial-data/get-block-refs-count @conn target-id)]
      (is (= 1 count*))
      (is (= 1 (count (:ref-blocks (db-reference/get-linked-references @conn target-id))))))))
