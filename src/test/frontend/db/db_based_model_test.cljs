(ns frontend.db.db-based-model-test
  (:require [cljs.test :refer [use-fixtures deftest is testing]]
            [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [logseq.outliner.property :as outliner-property]
            [frontend.handler.page :as page-handler]
            [logseq.db :as ldb]))

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

(deftest get-block-property-values-test
  (let [conn (db/get-db false)]
    (outliner-property/upsert-property! conn :user.property/property-1 {:type :string} {:property-name "property 1"})
    (outliner-property/set-block-property! conn fbid :user.property/property-1 "value 1")
    (outliner-property/set-block-property! conn sbid :user.property/property-1 "value 2")
    (is (= (model/get-block-property-values :user.property/property-1)
           ["value 1" "value 2"]))))

(deftest get-db-property-values-test
  (let [conn (db/get-db false)]
    (outliner-property/upsert-property! conn :user.property/property-1 {:type :number} {:property-name "property 1"})
    (outliner-property/set-block-property-raw-value! conn fbid :user.property/property-1 "1")
    (outliner-property/set-block-property! conn sbid :user.property/property-1 "2")
    (is (= [1 2] (model/get-block-property-values :user.property/property-1)))))

;; (deftest get-db-property-values-test-with-pages
;;   (let [opts {:redirect? false :create-first-block? false}
;;         _ (page-handler/create! "page1" opts)
;;         _ (page-handler/create! "page2" opts)
;;         p1id (:block/uuid (db/get-page "page1"))
;;         p2id (:block/uuid (db/get-page "page2"))]
;;     (outliner-property/upsert-property! repo "property-1" {:type :page} {})
;;     (outliner-property/set-block-property! repo fbid "property-1" p1id {})
;;     (outliner-property/set-block-property! repo sbid "property-1" p2id {})
;;     (is (= '("[[page1]]" "[[page2]]") (model/get-db-property-values repo "property-1")))))

(deftest get-all-classes-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (page-handler/create! "class2" opts)]
    (is (= ["Root class" "Task" "card" "class1" "class2"] (sort (map first (model/get-all-classes repo)))))))

(deftest get-class-objects-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        class (db/get-page "class1")
        _ (test-helper/save-block! repo fbid "Block 1" {:tags ["class1"]})]
    (is (= (model/get-class-objects repo (:db/id class))
           [(:db/id (db/entity [:block/uuid fbid]))]))

    (testing "classes parent"
      (page-handler/create! "class2" opts)
      ;; set class2's parent to class1
      (let [class2 (db/get-page "class2")]
        (db/transact! [{:db/id (:db/id class2)
                        :class/parent (:db/id class)}]))
      (test-helper/save-block! repo sbid "Block 2" {:tags ["class2"]})
      (is (= (model/get-class-objects repo (:db/id class))
             [(:db/id (db/entity [:block/uuid fbid]))
              (:db/id (db/entity [:block/uuid sbid]))])))))

(deftest get-classes-with-property-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (page-handler/create! "class2" opts)
        class1 (db/get-page "class1")
        class2 (db/get-page "class2")
        conn (db/get-db false)]
    (outliner-property/upsert-property! conn :user.property/property-1 {:type :page} {})
    (outliner-property/class-add-property! conn (:db/id class1) :user.property/property-1)
    (outliner-property/class-add-property! conn (:db/id class2) :user.property/property-1)
    (let [property (db/entity :user.property/property-1)
          classes (model/get-classes-with-property (:db/ident property))]
      (is (= (set (map :db/id classes))
             #{(:db/id class1) (:db/id class2)})))))

(deftest get-tag-blocks-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (test-helper/save-block! repo fbid "Block 1" {:tags ["class1"]})
        _ (test-helper/save-block! repo sbid "Block 2" {:tags ["class1"]})]
    (is
     (= (ldb/get-tag-blocks (db/get-db) "class1")
        [(:db/id (db/entity [:block/uuid fbid]))
         (:db/id (db/entity [:block/uuid sbid]))]))))

(deftest hidden-page-test
  (let [opts {:redirect? false :create-first-block? false}
        _ (page-handler/create! "page 1" opts)]
    (is (false? (model/hidden-page? (db/get-page "page 1"))))
    (is (true? (model/hidden-page? "$$$test")))
    (is (true? (model/hidden-page? (str "$$$" (random-uuid)))))))

(deftest get-class-children-test
  (let [opts {:redirect? false :create-first-block? false :class? true}
        _ (page-handler/create! "class1" opts)
        _ (page-handler/create! "class2" opts)
        _ (page-handler/create! "class3" opts)
        class1 (db/get-page "class1")
        class2 (db/get-page "class2")
        class3 (db/get-page "class3")
        _ (db/transact! [{:db/id (:db/id class2)
                          :class/parent (:db/id class1)}
                         {:db/id (:db/id class3)
                          :class/parent (:db/id class2)}])]
    (is
     (= (model/get-class-children repo (:db/id (db/get-page "class1")))
        [(:db/id class2) (:db/id class3)]))))
