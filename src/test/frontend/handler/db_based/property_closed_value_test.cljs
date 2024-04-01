(ns frontend.handler.db-based.property-closed-value-test
  (:require [frontend.handler.db-based.property :as db-property-handler]
            [frontend.db :as db]
            [clojure.test :refer [is testing async use-fixtures]]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [datascript.core :as d]
            [promesa.core :as p]
            [frontend.db.conn :as conn]))

(def repo test-helper/test-db-name-db-version)

(def init-data (test-helper/initial-test-page-and-blocks))

;; init page id
;; (def pid (:block/uuid (first init-data)))
;; first block id
(def fbid (:block/uuid (second init-data)))
(def sbid (:block/uuid (nth init-data 2)))

(use-fixtures :once
  {:before (fn []
             (async done
                    (test-helper/start-test-db! {:db-graph? true})
                    (p/let [_ (d/transact! (conn/get-db repo false) init-data)]
                      (done))))
   :after test-helper/destroy-test-db!})

(defn- get-value-ids
  [property-name]
  (:values (:block/schema (db/entity [:block/name property-name]))))

(defn- get-closed-values
  "Get value from block ids"
  [values]
  (set (map #(get-in (db/entity [:block/uuid %]) [:block/schema :value]) values)))

;; closed values related
;; upsert-closed-value
;; add-existing-values-to-closed-values!
;; delete-closed-value
(deftest-async closed-values-test
  (testing "Create properties and closed values"
    (db-property-handler/set-block-property! repo fbid :user.property/property-1 "1" {})
    (db-property-handler/set-block-property! repo sbid :user.property/property-1 "2" {})
    (let [k :user.property/property-1
          property (db/entity k)]
      (p/do!
       (db-property-handler/<add-existing-values-to-closed-values! property [1 2])
       (testing "Add existing values to closed values"
         (let [values (get-value-ids k)]
           (is (every? uuid? values))
           (is (= #{1 2} (get-closed-values values)))
           (is (every? #(contains? (:block/type (db/entity [:block/uuid %])) "closed value")
                       values))))
       (testing "Add non-numbers shouldn't work"
         (let [result (db-property-handler/upsert-closed-value property {:value "not a number"})]
           (is (= result :value-invalid))
           (let [values (get-value-ids k)]
             (is (= #{1 2} (get-closed-values values))))))

       (testing "Add existing value"
         (let [result (db-property-handler/upsert-closed-value property {:value 2})]
           (is (= result :value-exists))))

       (testing "Add new value"
         (let [{:keys [block-id tx-data]} (db-property-handler/upsert-closed-value property {:value 3})]
           (db/transact! tx-data)
           (let [b (db/entity [:block/uuid block-id])]
             (is (= 3 (:value (:block/schema b))))
             (is (contains? (:block/type b) "closed value")))
           (let [values (get-value-ids k)]
             (is (= #{1 2 3} (get-closed-values values))))

           (testing "Update closed value"
             (let [{:keys [tx-data]} (db-property-handler/upsert-closed-value property {:id block-id
                                                                                        :value 4
                                                                                        :description "choice 4"})]
               (db/transact! tx-data)
               (let [b (db/entity [:block/uuid block-id])]
                 (is (= 4 (:value (:block/schema b))))
                 (is (= "choice 4" (:description (:block/schema b))))
                 (is (contains? (:block/type b) "closed value")))))

           (p/do!
            (db-property-handler/delete-closed-value! property (db/entity [:block/uuid block-id]))
            (testing "Delete closed value"
              (is (nil? (db/entity [:block/uuid block-id])))
              (is (= 2 (count (:values (:block/schema (db/entity [:block/name k]))))))))))))))
