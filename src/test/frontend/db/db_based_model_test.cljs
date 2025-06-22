(ns frontend.db.db-based-model-test
  (:require [cljs.test :refer [use-fixtures deftest is testing]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.test.helper :as test-helper]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]))

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

(deftest get-all-classes-test
  (let [opts {:redirect? false :class? true}
        _ (test-helper/create-page! "class1" opts)
        _ (test-helper/create-page! "class2" opts)]
    (is (= (set
            (concat
             (map :title (vals (remove (fn [[ident _]]
                                         (contains? ldb/private-tags ident))
                                       db-class/built-in-classes)))
             ["class1" "class2"]))
           (set (map :block/title (model/get-all-classes repo)))))))

(deftest ^:fix-me get-class-objects-test
  (let [opts {:redirect? false}
        _ (test-helper/create-page! "class1" opts)
        class (db/get-case-page "class1")
        _ (test-helper/save-block! repo fbid "Block 1" {:tags ["class1"]})]
    (is (= (map :db/id (model/get-class-objects repo (:db/id class)))
           [(:db/id (db/entity [:block/uuid fbid]))]))

    (testing "classes parent"
      (test-helper/create-page! "class2" opts)
      ;; set class2's parent to class1
      (let [class2 (db/get-case-page "class2")]
        (db/transact! [{:db/id (:db/id class2)
                        :logseq.property.class/extends (:db/id class)}]))
      (test-helper/save-block! repo sbid "Block 2" {:tags ["class2"]})
      (is (= (map :db/id (model/get-class-objects repo (:db/id class)))
             [(:db/id (db/entity [:block/uuid fbid]))
              (:db/id (db/entity [:block/uuid sbid]))])))))

(deftest hidden-page-test
  (let [opts {:redirect? false}
        _ (test-helper/create-page! "page 1" opts)]
    (is (false? (model/hidden-page? (db/get-page "page 1"))))
    (is (true? (model/hidden-page? "$$$test")))
    (is (true? (model/hidden-page? (str "$$$" (random-uuid)))))))

(deftest get-class-children-test
  (let [opts {:redirect? false}
        _ (test-helper/create-page! "class1" opts)
        _ (test-helper/create-page! "class2" opts)
        _ (test-helper/create-page! "class3" opts)
        class1 (db/get-case-page "class1")
        class2 (db/get-case-page "class2")
        class3 (db/get-case-page "class3")
        _ (db/transact! [{:db/id (:db/id class2)
                          :logseq.property.class/extends (:db/id class1)}
                         {:db/id (:db/id class3)
                          :logseq.property.class/extends (:db/id class2)}])]
    (is
     (= (model/get-structured-children repo (:db/id (db/get-case-page "class1")))
        [(:db/id class2) (:db/id class3)]))))
