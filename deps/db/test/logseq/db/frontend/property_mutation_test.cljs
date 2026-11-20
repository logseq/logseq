(ns logseq.db.frontend.property-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.property :as db-property]))

;; Fails if, in `sort-properties`, `and` becomes `or` or `nil?` becomes `some?`.
(deftest sort-properties-puts-unordered-after-ordered-whatever-their-uuid-test
  (let [ordered {:db/id 1 :block/order "a" :block/uuid "uuid-z"}
        unordered {:db/id 2 :block/order nil :block/uuid "uuid-a"}]
    (is (= [1 2] (mapv :db/id (db-property/sort-properties [ordered unordered]))))
    (is (= [1 2] (mapv :db/id (db-property/sort-properties [unordered ordered]))))))

;; Fails if, in `built-in-ident->i18n-key`, `inc` becomes `dec`, `if` becomes `if-not` or `=` becomes `not=`.
(deftest built-in-ident->i18n-key-test
  (is (= :property.status/backlog
         (db-property/built-in-ident->i18n-key :logseq.property/status.backlog))
      "closed value of a logseq.property property")
  (is (= :property.view-type/table
         (db-property/built-in-ident->i18n-key :logseq.property.view/type.table))
      "closed value of a property in a logseq.property.* namespace")
  (is (= :property.built-in/alias
         (db-property/built-in-ident->i18n-key :block/alias))
      "block namespace")
  (is (nil? (db-property/built-in-ident->i18n-key :user.property/foo))))
