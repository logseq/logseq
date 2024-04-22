(ns frontend.handler.db-based.property-test
  (:require [frontend.handler.db-based.property :as db-property-handler]
            [frontend.db :as db]
            [clojure.test :refer [deftest is testing are use-fixtures]]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.state :as state]
            [frontend.handler.page :as page-handler]))

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
;; delete-property-value!
;; remove-block-property!
;; batch-set-property!
;; batch-remove-property!
;; upsert-property!
;; update-property!
(deftest ^:large-vars/cleanup-todo block-property-test
  (testing "Add a property to a block"
    (db-property-handler/set-block-property! repo fbid :user.property/property-1 "value" {:property-type :string})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)
          property (db/entity :user.property/property-1)]
      ;; ensure property exists
      (are [x y] (= x y)
        (:block/schema property)
        {:type :string}
        (:block/type property)
        #{"property"})
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        1
        (keyword? (ffirst properties))
        true
        (second (first properties))
        "value")))

  (testing "Add another property"
    (db-property-handler/set-block-property! repo fbid :user.property/property-2 "1" {})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)
          property (db/entity :user.property/property-2)]
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
        (every? keyword? (map first properties))
        true
        (second (second properties))
        1)))

  (testing "Update property value"
    (db-property-handler/set-block-property! repo fbid :user.property/property-2 2 {})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)]
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        2
        (second (second properties))
        2)))

  (testing "Wrong type property value shouldn't transacted"
    (db-property-handler/set-block-property! repo fbid :user.property/property-2 "Not a number" {})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)]
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        2
        (second (second properties))
        2)))

  (testing "Add a multi-values property"
    (db-property-handler/upsert-property! repo :user.property/property-3 {:type :number :cardinality :many} {})
    (db-property-handler/set-block-property! repo fbid :user.property/property-3 1 {})
    (db-property-handler/set-block-property! repo fbid :user.property/property-3 2 {})
    (db-property-handler/set-block-property! repo fbid :user.property/property-3 3 {})
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)
          property (db/entity :user.property/property-3)]
      ;; ensure property exists
      (are [x y] (= x y)
        (:block/schema property)
        {:type :number :cardinality :many}
        (:block/type property)
        #{"property"})
      ;; check block's properties
      (are [x y] (= x y)
        3
        (count properties)
        #{1 2 3}
        (get properties :user.property/property-3))))

  (testing "Remove a property"
    (db-property-handler/remove-block-property! repo fbid :user.property/property-3)
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)]
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        2
        (contains? (set (keys properties)) :user.property/property-3)
        false)))

  (testing "Batch set properties"
    (let [k :user.property/property-4
          v "batch value"]
      (db-property-handler/upsert-property! repo :user.property/property-4 {:type :string} {})
      (db-property-handler/batch-set-property! repo [fbid sbid] k v)
      (let [fb (db/entity [:block/uuid fbid])
            sb (db/entity [:block/uuid sbid])]
        (are [x y] (= x y)
          (get (:block/properties fb) k)
          v
          (get (:block/properties sb) k)
          v))))

  (testing "Batch remove properties"
    (let [k :user.property/property-4]
      (db-property-handler/batch-remove-property! repo [fbid sbid] k)
      (let [fb (db/entity [:block/uuid fbid])
            sb (db/entity [:block/uuid sbid])]
        (are [x y] (= x y)
          (count (:block/properties fb))
          2
          (count (:block/properties sb))
          0)))))

;; class related
;; class-add-property!
;; class-remove-property!
;; class-set-schema!
;; get-block-classes-properties
(deftest property-class-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (page-handler/create! "class2" opts)
        _ (page-handler/create! "class3" opts)
        c1 (db/get-page "class1")
        c2 (db/get-page "class2")
        c1id (:block/uuid c1)
        c2id (:block/uuid c2)]

    (testing "Create classes"
      (are [x y] (= x y)
        (:block/type (db/get-page "class1"))
        #{"class"}
        (:block/type (db/get-page "class2"))
        #{"class"}))

    (testing "Class add property"
      (db-property-handler/class-add-property! repo c1id :user.property/property-1)
      (db-property-handler/class-add-property! repo c1id :user.property/property-2)
      ;; repeated adding property-2
      (db-property-handler/class-add-property! repo c1id :user.property/property-2)
      ;; add new property with same base db-ident as property-1
      (db-property-handler/class-add-property! repo c1id ":property-1")
      (is (= 3 (count (:class/schema.properties (db/entity (:db/id c1)))))))

    (testing "Class remove property"
      (db-property-handler/class-remove-property! repo c1id :user.property/property-1)
      (is (= 2 (count (:class/schema.properties (db/entity (:db/id c1)))))))
    (testing "Add classes to a block"
      (test-helper/save-block! repo fbid "Block 1" {:tags ["class1" "class2" "class3"]})
      (is (= 3 (count (:block/tags (db/entity [:block/uuid fbid]))))))
    ;; FIXME: @tiensonqin https://github.com/logseq/logseq/commit/575624c650b2b7e919033a79aa5d14b97507d86f
    #_(testing "Remove a class from a block"
      ;; make sure class2 will not be deleted when removing it from the first block
        (editor-handler/save-block! repo sbid "Block 2 #class2")
        (editor-handler/save-block! repo fbid "Block 1 #class1 #class3")
        (is (= 2 (count (:block/tags (db/entity [:block/uuid fbid]))))))
    (testing "Get block's classes properties"
      ;; set c2 as parent of c3
      (let [c3 (db/get-page "class3")]
        (db/transact! [{:db/id (:db/id c3)
                        :class/parent (:db/id c2)}]))
      (db-property-handler/class-add-property! repo c2id :user.property/property-3)
      (db-property-handler/class-add-property! repo c2id :user.property/property-4)
      (is (= 4 (count (:classes-properties
                       (db-property-handler/get-block-classes-properties (:db/id (db/entity [:block/uuid fbid]))))))))))


;; convert-property-input-string
(deftest convert-property-input-string
  (testing "Convert property input string according to its schema type"
    (let [test-uuid (random-uuid)]
      (are [x y]
           (= (let [[schema-type value] x]
                (db-property-handler/convert-property-input-string schema-type value)) y)
        [:number "1"] 1
        [:number "1.2"] 1.2
        [:url test-uuid] test-uuid
        [:date test-uuid] test-uuid
        [:any test-uuid] test-uuid
        [nil test-uuid] test-uuid))))

(deftest upsert-property!
  (testing "Update an existing property"
    (let [repo (state/get-current-repo)]
      (db-property-handler/upsert-property! repo nil {:type :default} {:property-name "p0"})
      (db-property-handler/upsert-property! repo :user.property/p0 {:type :default :cardinality :many} {})
      (is (= :many (get-in (db/entity repo :user.property/p0) [:block/schema :cardinality])))))
  (testing "Multiple properties that generate the same initial :db/ident"
    (let [repo (state/get-current-repo)]
      (db-property-handler/upsert-property! repo nil {:type :default} {:property-name "p1"})
      (db-property-handler/upsert-property! repo nil {} {:property-name ":p1"})
      (db-property-handler/upsert-property! repo nil {} {:property-name "1p1"})

      (is (= {:block/name "p1" :block/original-name "p1" :block/schema {:type :default}}
             (select-keys (db/entity repo :user.property/p1) [:block/name :block/original-name :block/schema]))
          "Existing db/ident does not get modified")
      (is (= ":p1"
             (:block/original-name (db/entity repo :user.property/p1-1)))
          "2nd property gets unique ident")
      (is (= "1p1"
             (:block/original-name (db/entity repo :user.property/p1-2)))
          "3rd property gets unique ident"))))

;; template (TBD, template implementation not settle down yet)
;; property-create-new-block-from-template

#_(cljs.test/run-tests)
