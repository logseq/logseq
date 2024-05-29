(ns frontend.handler.db-based.property-test
  (:require [logseq.outliner.property :as outliner-property]
            [frontend.db :as db]
            [clojure.test :refer [deftest is testing are use-fixtures]]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.state :as state]
            [frontend.handler.page :as page-handler]
            [logseq.db.frontend.property :as db-property]))

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
    (let [conn (db/get-db false)]
      (outliner-property/upsert-property! conn :user.property/property-1 {:type :default}
                                          {:property-name "property 1"})
      (outliner-property/set-block-property! conn fbid :user.property/property-1 "value"))
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)
          property (db/entity :user.property/property-1)]
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
        (keyword? (ffirst properties))
        true
        (:block/content (second (first properties)))
        "value")))

  (testing "Add another property"
    (let [conn (db/get-db false)]
      (outliner-property/upsert-property! conn :user.property/property-2 {:type :number}
                                          {:property-name "property 2"})
      (outliner-property/set-block-property! conn fbid :user.property/property-2 "1"))

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
        (:block/content (second (second properties)))
        "1")))

  (testing "Update property value"
    (let [conn (db/get-db false)]
      (outliner-property/set-block-property! conn fbid :user.property/property-2 2))
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)]
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        2
        (:block/content (second (second properties)))
        "2")))

  (testing "Wrong type property value shouldn't transacted"
    (let [conn (db/get-db false)]
      (is
       (thrown-with-msg?
        js/Error
        #"Schema validation failed"
        (outliner-property/set-block-property! conn fbid :user.property/property-2 "Not a number"))))
    (let [block (db/entity [:block/uuid fbid])
          properties (:block/properties block)]
      ;; check block's properties
      (are [x y] (= x y)
        (count properties)
        2
        (:block/content (second (second properties)))
        "2")))

  (testing "Add a multi-values property"
    (let [conn (db/get-db false)]
      (outliner-property/upsert-property! conn :user.property/property-3 {:type :number :cardinality :many}
                                          {:property-name "property 3"})
      (outliner-property/set-block-property! conn fbid :user.property/property-3 1)
      (outliner-property/set-block-property! conn fbid :user.property/property-3 2)
      (outliner-property/set-block-property! conn fbid :user.property/property-3 3)
      (let [block (db/entity [:block/uuid fbid])
            properties (:block/properties block)
            property (db/entity :user.property/property-3)]
      ;; ensure property exists
        (are [x y] (= x y)
          (:block/schema property)
          {:type :number}
          (:block/type property)
          #{"property"})
      ;; check block's properties
        (are [x y] (= x y)
          3
          (count properties)
          #{"1" "2" "3"}
          (set (map :block/content (get properties :user.property/property-3)))))))

  (testing "Remove a property"
    (outliner-property/remove-block-property! (db/get-db false) fbid :user.property/property-3)
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
          v "batch value"
          conn (db/get-db false)]
      (outliner-property/upsert-property! conn :user.property/property-4 {:type :default} {})
      (outliner-property/batch-set-property! conn [fbid sbid] k v)
      (let [fb (db/entity [:block/uuid fbid])
            sb (db/entity [:block/uuid sbid])]
        (are [x y] (= x y)
          (:block/content (get (:block/properties fb) k))
          v
          (:block/content (get (:block/properties sb) k))
          v))))

  (testing "Batch remove properties"
    (let [k :user.property/property-4]
      (outliner-property/batch-remove-property! (db/get-db false) [fbid sbid] k)
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
;; get-block-classes-properties
(deftest property-class-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (page-handler/create! "class2" opts)
        _ (page-handler/create! "class3" opts)
        c1 (db/get-case-page "class1")
        c2 (db/get-case-page "class2")
        c1id (:db/id c1)
        c2id (:db/id c2)]

    (testing "Create classes"
      (are [x y] (= x y)
        (:block/type (db/get-case-page "class1"))
        #{"class"}
        (:block/type (db/get-case-page "class2"))
        #{"class"}))

    (testing "Class add property"
      (let [conn (db/get-db false)]
        (outliner-property/upsert-property! conn :user.property/property-1 {:type :default :cardinality :many} {})
        (outliner-property/upsert-property! conn :user.property/property-2 {:type :default :cardinality :many} {})
        (outliner-property/class-add-property! conn c1id :user.property/property-1)
        (outliner-property/class-add-property! conn c1id :user.property/property-2)
        ;; repeated adding property-2
        (outliner-property/class-add-property! conn c1id :user.property/property-2)
        (is (= 2 (count (:class/schema.properties (db/entity (:db/id c1))))))))

    (testing "Class remove property"
      (let [conn (db/get-db false)]
        (outliner-property/class-remove-property! conn c1id :user.property/property-1))
      (is (= 1 (count (:class/schema.properties (db/entity (:db/id c1)))))))
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
      (let [c3 (db/get-case-page "class3")
            conn (db/get-db false)]
        (db/transact! [{:db/id (:db/id c3)
                        :class/parent (:db/id c2)}])
        (outliner-property/upsert-property! conn :user.property/property-3 {:type :default :cardinality :many} {})
        (outliner-property/upsert-property! conn :user.property/property-4 {:type :default :cardinality :many} {})
        (outliner-property/class-add-property! conn c2id :user.property/property-3)
        (outliner-property/class-add-property! conn c2id :user.property/property-4)
      (is (= 3 (count (:classes-properties
                       (outliner-property/get-block-classes-properties @conn (:db/id (db/entity [:block/uuid fbid])))))))))))


;; convert-property-input-string
(deftest convert-property-input-string
  (testing "Convert property input string according to its schema type"
    (let [test-uuid (random-uuid)]
      (are [x y]
           (= (let [[schema-type value] x]
                (outliner-property/convert-property-input-string schema-type value)) y)
        [:number "1"] 1
        [:number "1.2"] 1.2
        [:url test-uuid] test-uuid
        [:date test-uuid] test-uuid
        [:any test-uuid] test-uuid
        [nil test-uuid] test-uuid))))

(deftest upsert-property!
  (testing "Update an existing property"
    (let [repo (state/get-current-repo)
          conn (db/get-db false)]
      (outliner-property/upsert-property! conn nil {:type :default} {:property-name "p0"})
      (outliner-property/upsert-property! conn :user.property/p0 {:type :default :cardinality :many} {})
      (is (db-property/many? (db/entity repo :user.property/p0)))))
  (testing "Multiple properties that generate the same initial :db/ident"
    (let [repo (state/get-current-repo)
          conn (db/get-db false)]
      (outliner-property/upsert-property! conn nil {:type :default} {:property-name "p1"})
      (outliner-property/upsert-property! conn nil {} {:property-name ":p1"})
      (outliner-property/upsert-property! conn nil {} {:property-name "1p1"})

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

(defn- get-value-ids
  [k]
  (map :block/uuid (:property/closed-values (db/entity k))))

(defn- get-closed-values
  "Get value from block ids"
  [values]
  (set (map #(:block/content (db/entity [:block/uuid %])) values)))

;; closed values related
;; upsert-closed-value
;; add-existing-values-to-closed-values!
;; delete-closed-value
(deftest closed-values-test
  (testing "Create properties and closed values"
    (let [conn (db/get-db false)]
      (outliner-property/upsert-property! conn :user.property/property-1 {:type :number} {})
      (outliner-property/set-block-property! conn fbid :user.property/property-1 "1")
      (outliner-property/set-block-property! conn sbid :user.property/property-1 "2"))
    (let [k :user.property/property-1
          property (db/entity k)
          conn (db/get-db false)
          values (map (fn [d] (:block/uuid (d/entity @conn (:v d)))) (d/datoms @conn :avet :user.property/property-1))]
      (outliner-property/add-existing-values-to-closed-values! conn (:db/id property) values)
      (testing "Add existing values to closed values"
        (let [values (get-value-ids k)]
          (is (every? uuid? values))
          (is (= #{"1" "2"} (get-closed-values values)))
          (is (every? #(contains? (:block/type (db/entity [:block/uuid %])) "closed value")
                      values))))
      (testing "Add non-numbers shouldn't work"
        (is
         (thrown-with-msg?
          js/Error
          #"Can't convert"
          (outliner-property/upsert-closed-value! conn (:db/id property) {:value "not a number"})))
        (let [values (get-value-ids k)]
          (is (= #{"1" "2"} (get-closed-values values)))))

      (testing "Add existing value"
        (is
         (thrown-with-msg?
          js/Error
          #"Closed value choice already exists"
          (outliner-property/upsert-closed-value! conn (:db/id property) {:value 2}))))

      (testing "Add new value"
        (let [_ (outliner-property/upsert-closed-value! conn (:db/id property) {:value 3})
              b (first (d/q '[:find [(pull ?b [*]) ...] :where [?b :block/content "3"]] @conn))]
          (is (contains? (set (:block/type b)) "closed value"))
          (let [values (get-value-ids k)]
            (is (= #{"1" "2" "3"}
                   (get-closed-values values))))

          (testing "Update closed value"
            (let [block-id (:block/uuid b)
                  _ (outliner-property/upsert-closed-value! conn (:db/id property) {:id block-id
                                                                                    :value 4
                                                                                    :description "choice 4"})
                  b (db/entity [:block/uuid block-id])]
              (is (= "4" (:block/content b)))
              (is (= "choice 4" (:description (:block/schema b))))
              (is (contains? (:block/type b) "closed value"))
              (outliner-property/delete-closed-value! conn (:db/id property) (:db/id (db/entity [:block/uuid block-id])))
              (testing "Delete closed value"
                (is (nil? (db/entity [:block/uuid block-id])))
                (is (= 2 (count (:property/closed-values (db/entity k)))))))))))))

;; property-create-new-block
;; get-property-block-created-block
(deftest text-block-test
  (testing "Add property and create a block value"
    (let [fb (db/entity [:block/uuid fbid])
          k :user.property/property-1
          conn (db/get-db false)]
      ;; add property
      (outliner-property/upsert-property! conn k {:type :default} {})
      (let [property (db/entity k)
            block-id (outliner-property/create-property-text-block! conn (:db/id fb) (:db/id property) "Block content" {})
            {:keys [from-property-id]} (outliner-property/get-property-block-created-block @conn [:block/uuid block-id])]
        (is (= from-property-id (:db/id property)))))))

;; collapse-expand-property!
(deftest collapse-expand-property-test
  (testing "Collapse and expand property"
    (let [conn (db/get-db false)
          fb (db/entity [:block/uuid fbid])
          k :user.property/property-1]
      ;; add property
      (outliner-property/upsert-property! conn k {:type :default} {})
      (let [property (db/entity k)]
        (outliner-property/create-property-text-block! conn
                                                       (:db/id fb)
                                                       (:db/id property)
                                                       "Block content"
                                                       {})
            ;; collapse property-1
        (outliner-property/collapse-expand-block-property! conn (:db/id fb) (:db/id property) true)
        (is (=
             [(:db/id property)]
             (map :db/id (:block/collapsed-properties (db/entity [:block/uuid fbid])))))

            ;; expand property-1
        (outliner-property/collapse-expand-block-property! conn (:db/id fb) (:db/id property) false)
        (is (nil? (:block/collapsed-properties (db/entity [:block/uuid fbid]))))))))


#_(cljs.test/run-tests)
