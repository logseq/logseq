(ns frontend.db.fix-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [datascript.core :as d]
            [frontend.core-test :as core-test]
            [frontend.test.fixtures :as fixtures]
            [frontend.worker.db.fix :as db-fix]))

(use-fixtures :each fixtures/reset-db)

(defonce init-conflicts
  [{:block/uuid "1"}
   {:block/uuid "2"
    :block/page [:block/uuid "1"]
    :block/parent [:block/uuid "1"]
    :block/left [:block/uuid "1"]}
   {:block/uuid "3"
    :block/page [:block/uuid "1"]
    :block/parent [:block/uuid "1"]
    :block/left [:block/uuid "1"]}])

(deftest test-conflicts
  (let [conn (core-test/get-current-conn)
        _ (d/transact! conn init-conflicts)
        page-id (:db/id (d/entity @conn 1))
        _ (db-fix/fix-page-if-broken! conn page-id {})]
    (is (= 2 (:db/id (:block/left (d/entity @conn 3)))))))

(deftest test-conflicts-with-right
  (let [conn (core-test/get-current-conn)
        data (concat init-conflicts
                     [{:block/uuid "4"
                       :block/page [:block/uuid "1"]
                       :block/parent [:block/uuid "1"]
                       :block/left [:block/uuid "2"]}])
        _ (d/transact! conn data)
        page-id (:db/id (d/entity @conn 1))
        _ (db-fix/fix-page-if-broken! conn page-id {})]
    (is (= 3 (:db/id (:block/left (d/entity @conn 4)))))))

(def init-broken-chain
  [{:block/uuid "1"}
   {:block/uuid "2"
    :block/page [:block/uuid "1"]
    :block/parent [:block/uuid "1"]
    :block/left [:block/uuid "1"]}
   {:block/uuid "3"
    :block/page [:block/uuid "1"]
    :block/parent [:block/uuid "1"]
    :block/left [:block/uuid "2"]}
   {:block/uuid "4"}
   {:block/uuid "5"
    :block/page [:block/uuid "1"]
    :block/parent [:block/uuid "1"]
    :block/left [:block/uuid "4"]}])

(deftest test-broken-chain
  (let [conn (core-test/get-current-conn)
        data init-broken-chain
        _ (d/transact! conn data)
        page-id (:db/id (d/entity @conn 1))
        _ (db-fix/fix-page-if-broken! conn page-id {})]
    (is
     (=
      (set [{:db/id 2, :block/left 1}
            {:db/id 3, :block/left 2}
            {:db/id 5, :block/left 3}])
      (set
       (map (fn [b]
              {:db/id (:db/id b)
               :block/left (:db/id (:block/left b))})
            (:block/_parent (d/entity @conn 1))))))))

(deftest test-broken-chain-with-no-start
  (let [conn (core-test/get-current-conn)
        data [{:block/uuid "1"}
              {:block/uuid "5"}
              {:block/uuid "2"
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "5"]}
              {:block/uuid "3"
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "2"]}]
        _ (d/transact! conn data)
        page-id (:db/id (d/entity @conn 1))
        _ (db-fix/fix-page-if-broken! conn page-id {})]
    (is
     (=
      (set [{:db/id 3, :block/left 1}
            {:db/id 4, :block/left 3}])
      (set (map (fn [b]
                  {:db/id (:db/id b)
                   :block/left (:db/id (:block/left b))})
                (:block/_parent (d/entity @conn 1))))))))

(deftest test-broken-chain-with-circle
  (let [conn (core-test/get-current-conn)
        data [{:block/uuid "1"}
              {:block/uuid "2"
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "1"]}
              {:block/uuid "4"}
              {:block/uuid "3"
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "4"]}
              {:block/uuid "4"
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "3"]}]
        _ (d/transact! conn data)
        page-id (:db/id (d/entity @conn 1))
        _ (db-fix/fix-page-if-broken! conn page-id {})]
    (is
     (=
      (set [{:db/id 2, :block/left 1}
            {:db/id 4, :block/left 2}
            {:db/id 3, :block/left 4}])
      (set (map (fn [b]
                  {:db/id (:db/id b)
                   :block/left (:db/id (:block/left b))})
             (:block/_parent (d/entity @conn 1))))))))

(deftest test-broken-chain-with-no-start-and-circle
  (let [conn (core-test/get-current-conn)
        data [{:block/uuid "1"
               :db/id 1}
              {:block/uuid "5"
               :db/id 5}
              {:block/uuid "2"
               :db/id 2
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "5"]}
              {:block/uuid "3"
               :db/id 3
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "2"]}
              {:block/uuid "4"
               :db/id 4
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "3"]}
              {:block/uuid "5"
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "2"]}]
        _ (d/transact! conn data)
        page-id (:db/id (d/entity @conn 1))
        _ (db-fix/fix-page-if-broken! conn page-id {})]
    (is
     (=
      #{{:db/id 3, :block/left 1}
        {:db/id 5, :block/left 3}
        {:db/id 2, :block/left 5}
        {:db/id 4, :block/left 2}}
      (set (map (fn [b]
                  {:db/id (:db/id b)
                   :block/left (:db/id (:block/left b))})
             (:block/_parent (d/entity @conn 1))))))))

(deftest test-multiple-broken-chains
  (let [conn (core-test/get-current-conn)
        data [{:block/uuid "1"
               :db/id 1}
              {:block/uuid "2"
               :db/id 2
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "1"]}
              {:block/uuid "4"
               :db/id 4}
              {:block/uuid "3"
               :db/id 3
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "4"]}
              {:block/uuid "5"
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "3"]}
              {:block/uuid "6"
               :db/id 6}
              {:block/uuid "7"
               :block/page [:block/uuid "1"]
               :block/parent [:block/uuid "1"]
               :block/left [:block/uuid "5"]}]
        _ (d/transact! conn data)
        page-id (:db/id (d/entity @conn 1))
        _ (db-fix/fix-page-if-broken! conn page-id {})]
    (is
     (=
      #{{:db/id 2, :block/left 1}
        {:db/id 3, :block/left 2}
        {:db/id 5, :block/left 3}
        {:db/id 7, :block/left 5}}
      (set (map (fn [b]
                  {:db/id (:db/id b)
                   :block/left (:db/id (:block/left b))})
                (:block/_parent (d/entity @conn 1))))))))

(comment
  (do
    (frontend.test.fixtures/reset-datascript test-db)
    nil))
