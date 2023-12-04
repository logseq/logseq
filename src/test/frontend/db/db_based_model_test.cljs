(ns frontend.db.db-based-model-test
  (:require [cljs.test :refer [use-fixtures deftest is testing]]
            [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.editor :as editor-handler]))

(def repo test-helper/test-db-name-db-version)

(def init-data (test-helper/initial-test-page-and-blocks))
(defn start-and-destroy-db
  [f]
  (test-helper/db-based-start-and-destroy-db
   f
   {:init-data (fn [conn] (d/transact! conn init-data))}))

(def fbid (:block/uuid (second init-data)))
(def sbid (:block/uuid (nth init-data 2)))

(use-fixtures :each start-and-destroy-db)

(deftest get-all-properties-test
  (db-property-handler/set-block-property! repo fbid "property-1" "value" {})
  (db-property-handler/set-block-property! repo fbid "property-2" "1" {})
  (is (= '("property-1" "property-2") (model/get-all-properties))))

(deftest get-block-property-values-test
  (db-property-handler/set-block-property! repo fbid "property-1" "value 1" {})
  (db-property-handler/set-block-property! repo sbid "property-1" "value 2" {})
  (let [property (db/entity [:block/name "property-1"])]
    (is (= (model/get-block-property-values (:block/uuid property))
           #{[21 "value 1"] [22 "value 2"]}))))

(deftest get-db-property-values-test
  (db-property-handler/set-block-property! repo fbid "property-1" "1" {})
  (db-property-handler/set-block-property! repo sbid "property-1" "2" {})
  (is (= [1 2] (model/get-db-property-values repo "property-1"))))

(deftest get-db-property-values-test-with-pages
  (let [opts {:redirect? false :create-first-block? false}
        _ (page-handler/create! "page1" opts)
        _ (page-handler/create! "page2" opts)
        p1id (:block/uuid (db/entity [:block/name "page1"]))
        p2id (:block/uuid (db/entity [:block/name "page2"]))]
    (db-property-handler/upsert-property! repo "property-1" {:type :page} {})
    (db-property-handler/set-block-property! repo fbid "property-1" p1id {})
    (db-property-handler/set-block-property! repo sbid "property-1" p2id {})
    (is (= '("[[page1]]" "[[page2]]") (model/get-db-property-values repo "property-1")))))

(deftest get-all-classes-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (page-handler/create! "class2" opts)]
    (is (= ["class1" "class2"] (map first (model/get-all-classes repo))))))

(deftest get-class-objects-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        class (db/entity [:block/name "class1"])
        _ (editor-handler/save-block! repo fbid "Block 1 #class1")]
    (is (= (model/get-class-objects repo (:db/id class))
           [(:db/id (db/entity [:block/uuid fbid]))]))

    (testing "namespace classes"
      (page-handler/create! "class2" opts)
      ;; set class2's parent to class1
      (let [class2 (db/entity [:block/name "class2"])]
        (db/transact! [{:db/id (:db/id class2)
                        :block/namespace (:db/id class)}]))
      (editor-handler/save-block! repo sbid "Block 2 #class2")
      (is (= (model/get-class-objects repo (:db/id class))
           [(:db/id (db/entity [:block/uuid fbid]))
            (:db/id (db/entity [:block/uuid sbid]))])))))

(deftest get-classes-with-property-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (page-handler/create! "class2" opts)
        class1 (db/entity [:block/name "class1"])
        class2 (db/entity [:block/name "class2"])]
    (db-property-handler/upsert-property! repo "property-1" {:type :page} {})
    (db-property-handler/class-add-property! repo (:block/uuid class1) "property-1")
    (db-property-handler/class-add-property! repo (:block/uuid class2) "property-1")
    (let [property (db/entity [:block/name "property-1"])
          class-ids (model/get-classes-with-property (:block/uuid property))]
      (is (= class-ids [(:db/id class1) (:db/id class2)])))))

(deftest get-tag-blocks-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (editor-handler/save-block! repo fbid "Block 1 #class1")
        _ (editor-handler/save-block! repo sbid "Block 2 #class1")]
    (is
     (= (model/get-tag-blocks repo "class1")
        [(:db/id (db/entity [:block/uuid fbid]))
         (:db/id (db/entity [:block/uuid sbid]))]))))

(deftest hidden-page-test
  (let [opts {:redirect? false :create-first-block? false}
        _ (page-handler/create! "page 1" opts)]
    (is (false? (model/hidden-page? (db/entity [:block/name "page 1"]))))
    (is (false? (model/hidden-page? "$$$test")))
    (is (true? (model/hidden-page? (str "$$$" (random-uuid)))))))

(deftest get-namespace-children-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (page-handler/create! "class2" opts)
        _ (page-handler/create! "class3" opts)
        class1 (db/entity [:block/name "class1"])
        class2 (db/entity [:block/name "class2"])
        class3 (db/entity [:block/name "class3"])
        _ (db/transact! [{:db/id (:db/id class2)
                          :block/namespace (:db/id class1)}
                         {:db/id (:db/id class3)
                          :block/namespace (:db/id class2)}])]
    (is
     (= (model/get-namespace-children repo (:db/id (db/entity [:block/name "class1"])))
        [(:db/id class2) (:db/id class3)]))))
