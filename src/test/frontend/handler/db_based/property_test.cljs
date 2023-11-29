(ns frontend.handler.db-based.property-test
  (:require [frontend.handler.db-based.property :as property]
            [frontend.db :as db]
            [clojure.test :refer [deftest is testing are use-fixtures]]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.handler.property.util :as pu]
            [frontend.state]
            [frontend.config]))

(def repo test-helper/test-db-name-db-version)

(def init-data (test-helper/initial-test-page-and-blocks))
(defn start-and-destroy-db
  [f]
  (test-helper/db-based-start-and-destroy-db
   f
   {:init-data (fn [conn] (d/transact! conn init-data))}))

;; init page id
;; (def pid (:block/uuid (first init-data)))
;; first block id
(def fbid (:block/uuid (second init-data)))
(def sbid (:block/uuid (nth init-data 2)))

(use-fixtures :each start-and-destroy-db)

;; set-block-property!
;; remove-block-property!
;; batch-set-property!
;; batch-remove-property!
;; upsert-property!
;; update-property!
(deftest set-block-property-test
  (testing "Add a property to a block"
    (property/set-block-property! repo fbid "property-1" "value" {})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)
          property (db/entity [:block/name "property-1"])]
      ;; ensure property exists
      (are [x y] (= x y)
        (:block/schema property)
        {:type :default}
        (:block/type property)
        #{"property"})
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        1
        (uuid? (ffirst properties))
        true
        (second (first properties))
        "value")))

  (testing "Add another property"
    (property/set-block-property! repo fbid "property-2" "1" {})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)
          property (db/entity [:block/name "property-2"])]
      ;; ensure property exists
      (are [x y] (= x y)
        (:block/schema property)
        {:type :number}
        (:block/type property)
        #{"property"})
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        2
        (every? uuid? (map first properties))
        true
        (second (second properties))
        1)))

  (testing "Update property value"
    (property/set-block-property! repo fbid "property-2" 2 {})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)]
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        2
        (second (second properties))
        2)))

  (testing "Wrong type property value shouldn't transacted"
    (property/set-block-property! repo fbid "property-2" "Not a number" {})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)]
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        2
        (second (second properties))
        2)))

  (testing "Add a multi-values property"
    (property/upsert-property! repo "property-3" {:type :default :cardinality :many} {})
    (property/set-block-property! repo fbid "property-3" "value 1" {})
    (property/set-block-property! repo fbid "property-3" "value 2" {})
    (property/set-block-property! repo fbid "property-3" "value 3" {})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)
          property (db/entity [:block/name "property-3"])]
      ;; ensure property exists
      (are [x y] (= x y)
        (:block/schema property)
        {:type :default :cardinality :many}
        (:block/type property)
        #{"property"})
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        3
        (get properties (:block/uuid property))
        #{"value 1" "value 2" "value 3"}))

    ;; update property value from "value 1" to "value 4"
    (property/set-block-property! repo fbid "property-3" "value 4" {:old-value "value 1"})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)
          property (db/entity [:block/name "property-3"])]
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        3
        (get properties (:block/uuid property))
        #{"value 4" "value 2" "value 3"})))

  (testing "Remove a property"
    (property/remove-block-property! repo fbid "property-3")
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)
          property (db/entity [:block/name "property-3"])]
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        2
        (contains? (set (keys properties)) (:block/uuid property))
        false)))

  (testing "Batch set properties"
    (let [k "property-4"
          v "batch value"]
      (property/batch-set-property! repo [fbid sbid] k v)
      (let [fb (db/entity [:block/uuid fbid])
            sb (db/entity [:block/uuid sbid])]
        (are [x y] (= x y)
          (pu/get-property fb k)
          v
          (pu/get-property sb k)
          v))))

  (testing "Batch remove properties"
    (let [k "property-4"]
      (property/batch-remove-property! repo [fbid sbid] k)
      (let [fb (db/entity [:block/uuid fbid])
            sb (db/entity [:block/uuid sbid])]
        (are [x y] (= x y)
          (count (:block/properties fb))
          2
          (count (:block/properties sb))
          0)))))

;; delete-property-value!
;; property-create-new-block

;; class related
;; class-add-property!
;; class-remove-property!
;; class-set-schema!
;; get-block-classes-properties

;; closed values related
;; upsert-closed-value
;; add-existing-values-to-closed-values!
;; delete-closed-value
;; get-property-block-created-block

;; template (TBD, template implementation not settle down yet)
;; property-create-new-block-from-template

;; others
;; convert-property-input-string
;; replace-key-with-id
;; collapse-expand-property! TODO

#_(cljs.test/run-tests)
