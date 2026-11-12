(ns frontend.worker.db.migrate-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(defn- initial-conn
  []
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data ""))
    conn))

;; Fails if, in `missing-class-extends?`, `empty?` becomes `seq`.
(deftest missing-class-extends-is-true-for-nil-and-empty-test
  (let [f #'db-migrate/missing-class-extends?]
    (is (true? (f {})))
    (is (true? (f {:logseq.property.class/extends #{}})))
    (is (true? (f {:logseq.property.class/extends []})))
    (is (false? (f {:logseq.property.class/extends #{1}})))
    (is (false? (f {:logseq.property.class/extends [1]})))))

;; Fails if, in `repair-comment-classes-and-targets`, `and` becomes `or`.
(deftest repair-comment-classes-adds-root-only-when-extends-is-missing-test
  (let [conn (initial-conn)
        root-id (:db/id (d/entity @conn :logseq.class/Root))
        class-ids (map #(:db/id (d/entity @conn %)) [:logseq.class/Comments :logseq.class/Comment])
        extends-adds (fn [tx-data]
                       (filter (fn [tx] (and (= :db/add (first tx))
                                             (= :logseq.property.class/extends (nth tx 2))))
                               tx-data))
        repair #'db-migrate/repair-comment-classes-and-targets]
    (is (some? root-id))
    (is (every? some? class-ids))
    (testing "classes that already extend a class get no new extends"
      (d/transact! conn (map (fn [id] [:db/add id :logseq.property.class/extends root-id]) class-ids))
      (is (empty? (extends-adds (repair @conn)))))
    (testing "a class without extends is attached to Root"
      (d/transact! conn (map (fn [id] [:db/retract id :logseq.property.class/extends]) class-ids))
      (is (= (set (map (fn [id] [:db/add id :logseq.property.class/extends root-id]) class-ids))
             (set (extends-adds (repair @conn))))))))

;; Fails if, in `ensure-built-in-data-exists!`, `=` becomes `not=`.
(deftest ensure-built-in-data-restores-type-and-keeps-extra-attributes-test
  (let [conn (initial-conn)
        type-property (->> (sqlite-create-graph/build-db-initial-data "")
                           (filter (fn [m] (and (:db/ident m)
                                                (keyword? (:logseq.property/type m)))))
                           first)
        ident (:db/ident type-property)
        original-type (:logseq.property/type type-property)
        extra-ident :logseq.property/deadline]
    (is (some? ident))
    (is (nil? (:logseq.property/hide? (d/entity @conn extra-ident))))
    (d/transact! conn [[:db/add [:db/ident ident] :logseq.property/type :wrong-type]
                       [:db/add [:db/ident extra-ident] :logseq.property/hide? true]])
    (db-migrate/ensure-built-in-data-exists! conn)
    (testing "the built-in type wins over the stored one"
      (is (= original-type (:logseq.property/type (d/entity @conn ident)))))
    (testing "an attribute the built-in data does not set is kept"
      (is (true? (:logseq.property/hide? (d/entity @conn extra-ident)))))))

;; Fails if, in `ensure-built-in-data-exists!`, `some?` becomes `nil?`.
(deftest ensure-built-in-data-keeps-a-stored-value-over-the-built-in-one-test
  (let [conn (initial-conn)
        public-property (->> (sqlite-create-graph/build-db-initial-data "")
                             (filter (fn [m] (and (:db/ident m)
                                                  (true? (:logseq.property/public? m)))))
                             first)
        ident (:db/ident public-property)]
    (is (some? ident))
    (d/transact! conn [[:db/add [:db/ident ident] :logseq.property/public? false]])
    (db-migrate/ensure-built-in-data-exists! conn)
    (is (false? (:logseq.property/public? (d/entity @conn ident))))))

(defn- conn-with-1-built-in
  "A graph holding only the built-in entity `ident` (its built-in uuid) with `attrs`:
  ensure-built-in-data-exists! then creates every other built-in entity."
  [ident attrs]
  (let [conn (d/create-conn db-schema/schema)
        built-in-uuid (->> (sqlite-create-graph/build-db-initial-data "")
                           (some (fn [m] (when (= ident (:db/ident m)) (:block/uuid m)))))]
    (d/transact! conn [(merge {:db/ident ident :block/uuid built-in-uuid} attrs)])
    conn))

;; Fails if, in `ensure-built-in-data-exists!`, `=` becomes `not=`.
(deftest ensure-built-in-data-keeps-a-class-stored-timestamps-test
  (let [stored {:block/created-at 1 :block/updated-at 2}
        conn (conn-with-1-built-in :logseq.class/Tag stored)]
    (db-migrate/ensure-built-in-data-exists! conn)
    (is (= stored (select-keys (d/entity @conn :logseq.class/Tag) (keys stored))))))

