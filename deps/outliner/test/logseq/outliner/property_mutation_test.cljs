(ns logseq.outliner.property-mutation-test
  "Tests for logseq.outliner.property found by mutation testing"
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.property :as outliner-property]))

(defn- extends-idents
  [conn class-ident]
  (set (:logseq.property.class/extends
        (db-test/readable-properties (d/entity @conn class-ident)))))

;; Fails if, in `normalize-extends-value`, `if` becomes `if-not`.
(deftest extends-with-two-unrelated-parents-keeps-both
  (testing "batch-set-property! with a vector of two unrelated parents"
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:A {} :B {} :C {}}})]
      (outliner-property/batch-set-property! conn
                                             [(:db/id (d/entity @conn :user.class/C))]
                                             :logseq.property.class/extends
                                             [:user.class/A :user.class/B])
      (is (= #{:user.class/A :user.class/B} (extends-idents conn :user.class/C))
          "C extends both A and B")))
  (testing "set-block-property! with a vector of two unrelated parents"
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:A {} :B {} :C {}}})]
      (outliner-property/set-block-property! conn
                                             (:db/id (d/entity @conn :user.class/C))
                                             :logseq.property.class/extends
                                             [:user.class/A :user.class/B])
      (is (= #{:user.class/A :user.class/B} (extends-idents conn :user.class/C))
          "C extends both A and B"))))

(defn- value-contents
  [conn block-id property-id]
  (let [value (get (d/entity @conn block-id) property-id)]
    (set (map db-property/property-value-content
              (if (set? value) value [value])))))

;; Fails if, in `build-property-value-tx-data`, `=` becomes `not=`.
(deftest batch-set-property-collection-replaces-many-values
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:steps {:logseq.property/type :default
                                    :db/cardinality :db.cardinality/many}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        block-id (:db/id (db-test/find-block-by-content @conn "b1"))]
    (outliner-property/batch-set-property! conn [block-id] :user.property/steps ["a" "b"])
    (is (= #{"a" "b"} (value-contents conn block-id :user.property/steps)))
    (outliner-property/batch-set-property! conn [block-id] :user.property/steps ["c"])
    (is (= #{"c"} (value-contents conn block-id :user.property/steps))
        "A collection replaces the existing values of a :many property")))

;; Fails if, in `convert-property-input-string`, `and` becomes `or` or `=` becomes `not=`.
(deftest convert-property-input-string-parses-default-value-of-number-property
  (testing "the default value of a :number property is parsed as a number"
    (is (= 5 (outliner-property/convert-property-input-string
              :number {:db/ident :logseq.property/default-value} "5"))))
  (testing "the default value of a :default property stays a string"
    (is (= "abc" (outliner-property/convert-property-input-string
                  :default {:db/ident :logseq.property/default-value} "abc"))))
  (testing "a :default property set on a :number property entity stays a string"
    (is (= "5" (outliner-property/convert-property-input-string
                :number {:db/ident :user.property/note :logseq.property/type :default} "5")))))

;; Fails if, in `validate-property-name-update`, `not=` becomes `=`.
(deftest upsert-property-rename-validates-new-name
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:note {:logseq.property/type :default}}})]
    (is (thrown-with-msg?
         js/Error #"Page name can't include"
         (outliner-property/upsert-property! conn :user.property/note {} {:property-name "#bad"})))
    (is (= "note" (:block/title (d/entity @conn :user.property/note))))))

;; Fails if, in `schema-for-update`, `and` becomes `or`.
;; Fails if, in `update-property`, `not=` becomes `=`.
(deftest upsert-property-rename-property-with-values
  (testing "renaming a :many property that has values"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:note "text 1"}}]}])]
      (outliner-property/upsert-property! conn :user.property/note {:db/cardinality :many} {})
      (outliner-property/upsert-property! conn :user.property/note {} {:property-name "comment"})
      (is (= "comment" (:block/title (d/entity @conn :user.property/note))))
      (is (= "comment" (:block/name (d/entity @conn :user.property/note))))
      (is (db-property/many? (d/entity @conn :user.property/note)))))
  (testing "replaying :one on a :one property that has values"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:note "text 1"}}]}])]
      (outliner-property/upsert-property! conn :user.property/note {:db/cardinality :one} {})
      (is (not (db-property/many? (d/entity @conn :user.property/note)))))))

;; Fails if, in `update-property`, `and` becomes `or`, `=` becomes `not=`, `not=` becomes `=` or `seq` becomes `empty?`.
(deftest upsert-property-with-unchanged-schema-leaves-property-untouched
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:note {:logseq.property/type :default}
                            :done {:logseq.property/type :checkbox}}})
        updated-at (fn [ident] (:block/updated-at (d/entity @conn ident)))]
    (d/transact! conn [{:db/ident :user.property/note :block/updated-at 1}
                       {:db/ident :user.property/done :block/updated-at 1}])
    (testing "empty schema"
      (outliner-property/upsert-property! conn :user.property/note {} {})
      (is (= 1 (updated-at :user.property/note))))
    (testing "same :default type"
      (outliner-property/upsert-property! conn :user.property/note {:logseq.property/type :default} {})
      (is (= 1 (updated-at :user.property/note))))
    (testing "same :checkbox type"
      (outliner-property/upsert-property! conn :user.property/done {:logseq.property/type :checkbox} {})
      (is (= 1 (updated-at :user.property/done))))))

;; Fails if, in `update-property`, `when` becomes `when-not` or `seq` becomes `empty?`.
(deftest upsert-property-sets-given-properties
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:note {:logseq.property/type :default}}})
        icon {:type :emoji :id "smile"}]
    (outliner-property/upsert-property! conn :user.property/note {}
                                        {:properties {:logseq.property/icon icon}})
    (is (= icon (:logseq.property/icon (d/entity @conn :user.property/note))))))

;; Fails if, in `validate-property-value-aux`, `not` becomes `identity`.
(deftest upsert-closed-value-on-many-number-property
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:sizes {:logseq.property/type :number
                                    :db/cardinality :db.cardinality/many
                                    :build/closed-values [{:uuid (random-uuid) :value 2}]}}})]
    (outliner-property/upsert-closed-value! conn :user.property/sizes {:value 3})
    (is (= [2 3]
           (map db-property/closed-value-content
                (:block/_closed-value-property (d/entity @conn :user.property/sizes)))))))

;; Fails if, in `validate!`, `if` becomes `if-not`.
(deftest invalid-property-value-message-shows-first-error
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:done {:logseq.property/type :checkbox}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        block-id (:db/id (db-test/find-block-by-content @conn "b1"))
        error (try (outliner-property/set-block-property! conn block-id :user.property/done "not a bool")
                   nil
                   (catch :default e e))]
    (is (= "Property validation failed: \"done\" should be a boolean"
           (get-in (ex-data error) [:payload :message])))))

;; Fails if, in `convert-ref-property-value`, `or` becomes `and`.
(deftest set-page-property-to-blank-string-is-rejected
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:project {:logseq.property/type :page}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        block-id (:db/id (db-test/find-block-by-content @conn "b1"))]
    (is (thrown-with-msg?
         js/Error #"Value should be non-empty string"
         (outliner-property/set-block-property! conn block-id :user.property/project "  ")))
    (is (nil? (:user.property/project (d/entity @conn block-id))))))

;; Fails if, in `throw-error-if-self-value`, `or` becomes `and`.
(deftest batch-set-property-rejects-own-block-in-collection
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:related {:logseq.property/type :node
                                      :db/cardinality :db.cardinality/many}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        block-id (:db/id (db-test/find-block-by-content @conn "b1"))]
    (is (thrown-with-msg?
         js/Error #"Can't set this block itself as own property value"
         (outliner-property/batch-set-property! conn [block-id] :user.property/related [block-id])))
    (is (nil? (:user.property/related (d/entity @conn block-id))))))

;; Fails if, in `batch-remove-property!`, `nil?` becomes `some?`, `and` becomes `or`, `not` becomes `identity`, `or` becomes `and`, `empty?` becomes `seq`, `when` becomes `when-not` or `seq` becomes `empty?`.
(deftest batch-remove-property-deletes-only-unshared-created-values
  (testing "a :default value block is deleted with the property"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:note "text 1"}}]}])
          block (db-test/find-block-by-content @conn "b1")
          value-id (:db/id (:user.property/note block))]
      (outliner-property/batch-remove-property! conn [(:block/uuid block)] :user.property/note)
      (is (nil? (:user.property/note (d/entity @conn (:db/id block)))))
      (is (nil? (d/entity @conn value-id)) "The value block is deleted")))
  (testing "a :number value shared with another block is kept"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:num 2}}
                           {:block/title "b2"}]}])
          b1 (db-test/find-block-by-content @conn "b1")
          b2 (db-test/find-block-by-content @conn "b2")
          value-id (:db/id (:user.property/num b1))]
      (outliner-property/set-block-property! conn (:db/id b2) :user.property/num value-id)
      (is (= value-id (:db/id (:user.property/num (d/entity @conn (:db/id b2))))))
      (outliner-property/batch-remove-property! conn [(:block/uuid b1)] :user.property/num)
      (is (nil? (:user.property/num (d/entity @conn (:db/id b1)))))
      (is (= 2 (db-property/property-value-content (:user.property/num (d/entity @conn (:db/id b2)))))
          "The other block keeps its value")))
  (testing "a :node value that is an ordinary block is kept"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:related {:logseq.property/type :node}}
                 :pages-and-blocks [{:page {:block/title "page1"}
                                     :blocks [{:block/title "b1"} {:block/title "b2"}]}]})
          b1 (db-test/find-block-by-content @conn "b1")
          b2 (db-test/find-block-by-content @conn "b2")]
      (outliner-property/set-block-property! conn (:db/id b1) :user.property/related (:db/id b2))
      (is (= (:db/id b2) (:db/id (:user.property/related (d/entity @conn (:db/id b1))))))
      (outliner-property/batch-remove-property! conn [(:block/uuid b1)] :user.property/related)
      (is (nil? (:user.property/related (d/entity @conn (:db/id b1)))))
      (is (= "b2" (:block/title (d/entity @conn (:db/id b2)))) "The referenced block is kept")))
  (testing "a closed value choice is kept"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:stage {:logseq.property/type :default
                                      :build/closed-values [{:value "active"}]}}
                 :pages-and-blocks [{:page {:block/title "page1"}
                                     :blocks [{:block/title "b1"}]}]})
          block (db-test/find-block-by-content @conn "b1")
          choice (first (:block/_closed-value-property (d/entity @conn :user.property/stage)))]
      (outliner-property/set-block-property! conn (:db/id block) :user.property/stage (:db/id choice))
      (is (ldb/closed-value? (:user.property/stage (d/entity @conn (:db/id block)))))
      (outliner-property/batch-remove-property! conn [(:block/uuid block)] :user.property/stage)
      (is (nil? (:user.property/stage (d/entity @conn (:db/id block)))))
      (is (= ["active"]
             (map db-property/closed-value-content
                  (:block/_closed-value-property (d/entity @conn :user.property/stage))))
          "The choice stays on the property"))))
