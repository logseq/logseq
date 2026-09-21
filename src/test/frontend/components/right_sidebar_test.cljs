(ns frontend.components.right-sidebar-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.components.right-sidebar-util :as right-sidebar-util]
            [frontend.db.async :as db-async]
            [promesa.core :as p]))

(deftest sidebar-action-block-lookup-test
  (testing "Contents sidebar items resolve the Contents page by name"
    (is (= "Contents" (right-sidebar-util/sidebar-action-block-lookup "contents" :contents)))
    (is (= "Contents" (right-sidebar-util/sidebar-action-block-lookup "contents" "contents"))))
  (testing "page and block items keep their entity id"
    (is (= 42 (right-sidebar-util/sidebar-action-block-lookup 42 :page)))
    (let [block-uuid #uuid "11111111-1111-1111-1111-111111111111"]
      (is (= block-uuid (right-sidebar-util/sidebar-action-block-lookup block-uuid :block)))))
  (testing "non-entity sidebar items have no Open as Page target"
    (is (nil? (right-sidebar-util/sidebar-action-block-lookup "help" :help)))
    (is (nil? (right-sidebar-util/sidebar-action-block-lookup "contents" :help)))))

(deftest sidebar-action-block-fetches-contents-by-name
  (async done
    (let [calls (atom [])
          contents-uuid #uuid "22222222-2222-2222-2222-222222222222"]
      (-> (p/with-redefs [db-async/<get-block
                          (fn [repo id opts]
                            (swap! calls conj [repo id opts])
                            (p/resolved {:block/uuid contents-uuid
                                         :block/title "Contents"}))]
            (p/let [block (right-sidebar-util/<sidebar-action-block "logseq_db_test" "contents" :contents)]
              (is (= [["logseq_db_test" "Contents" {:children? false}]] @calls))
              (is (= contents-uuid (:block/uuid block)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest sidebar-action-block-skips-non-entity-items
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [db-async/<get-block
                          (fn [repo id opts]
                            (swap! calls conj [repo id opts])
                            (p/resolved {:block/uuid #uuid "33333333-3333-3333-3333-333333333333"}))]
            (p/let [block (right-sidebar-util/<sidebar-action-block "logseq_db_test" "help" :help)]
              (is (empty? @calls))
              (is (nil? block))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))
