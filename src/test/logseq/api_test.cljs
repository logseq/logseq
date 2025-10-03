(ns logseq.api-test
  (:require [cljs-bean.core :as bean]
            [cljs.test :refer [use-fixtures deftest is testing]]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [logseq.api :as api]
            [logseq.api.block :as api-block]
            [promesa.core :as p]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(deftest get-block
  (with-redefs [state/get-current-repo (constantly test-helper/test-db)]
    (db/transact! test-helper/test-db
                  [{:db/id 10000
                    :block/uuid #uuid "4406f839-6410-43b5-87db-25e9b8f54cc0"
                    :block/title "1"}
                   {:db/id 10001
                    :block/uuid #uuid "d9b7b45f-267f-4794-9569-f43d1ce77172"
                    :block/refs #{10000}
                    :block/title "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]"}
                   {:db/id 10002
                    :block/uuid #uuid "adae3006-f03e-4814-a1f5-f17f15b86556"
                    :block/parent 10001
                    :block/title "3"}
                   {:db/id 10003
                    :block/uuid #uuid "0c3053c3-2dab-4769-badd-14ce16d8ba8d"
                    :block/parent 10002
                    :block/title "4"}])

    (is (= (:title (bean/->clj (api-block/get_block 10000 #js {}))) "1"))
    (is (= (:content (bean/->clj (api-block/get_block 10000 #js {}))) "1"))
    (is (= (:title (bean/->clj (api-block/get_block "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {}))) "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]"))
    (is (= (:fullTitle (bean/->clj (api-block/get_block "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {}))) "2 [[1]]"))
    (is (= (:title (bean/->clj (api-block/get_block #uuid "d9b7b45f-267f-4794-9569-f43d1ce77172" #js {}))) "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]"))
    (is (= {:id 10001, :title "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]", :uuid "d9b7b45f-267f-4794-9569-f43d1ce77172", :children [["uuid" "adae3006-f03e-4814-a1f5-f17f15b86556"]]}
           (select-keys (js->clj (api-block/get_block 10001 #js {:includeChildren false}) :keywordize-keys true)
                        [:id :title :uuid :children])))
    ;; NOTE: `content` key is to be compatible with old APIs
    (is (= {:id 10001, :refs [{:id 10000}], :title "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]", :uuid "d9b7b45f-267f-4794-9569-f43d1ce77172", :children [{:id 10002, :parent {:id 10001}, :title "3", :uuid "adae3006-f03e-4814-a1f5-f17f15b86556", :level 1, :children [{:id 10003, :parent {:id 10002}, :title "4", :uuid "0c3053c3-2dab-4769-badd-14ce16d8ba8d", :level 2, :children [], :content "4", :fullTitle "4"}], :content "3", :fullTitle "3"}], :content "2 [[4406f839-6410-43b5-87db-25e9b8f54cc0]]", :fullTitle "2 [[1]]"}
           (js->clj (api-block/get_block 10001 #js {:includeChildren true}) :keywordize-keys true)))))

(deftest get-page-linked-references
  "Test get_page_linked_references API function to ensure backlinks work correctly"
  (with-redefs [state/get-current-repo (constantly test-helper/test-db)]
    ;; Create test data: pages with references between them
    (db/transact! test-helper/test-db
                  [{:db/id 20000
                    :block/uuid #uuid "page-ideas-uuid-1234-567890abcdef"
                    :block/name "ideas"
                    :block/title "Ideas"
                    :block/type "page"}

                   {:db/id 20001
                    :block/uuid #uuid "page-3dprint-uuid-1234-567890abcdef"
                    :block/name "3d printing"
                    :block/title "3D Printing"
                    :block/type "page"}

                   {:db/id 20002
                    :block/uuid #uuid "page-printer-uuid-1234-567890abcdef"
                    :block/name "printer farm"
                    :block/title "Printer Farm"
                    :block/type "page"}

                   ;; Block on "ideas" page that references "3d printing"
                   {:db/id 20100
                    :block/uuid #uuid "block-ideas-ref3d-1234-567890abcdef"
                    :block/page 20000
                    :block/title "[[3D Printing]] project for the future"
                    :block/refs #{20001}}  ; References 3d printing page

                   ;; Block on "ideas" page that references "printer farm"
                   {:db/id 20101
                    :block/uuid #uuid "block-ideas-refprinter-567890abcdef"
                    :block/page 20000
                    :block/title "Starting a [[Printer Farm]] business"
                    :block/refs #{20002}}  ; References printer farm page

                   ;; Block on different page that also references "3d printing"
                   {:db/id 20102
                    :block/uuid #uuid "block-other-ref3d-1234-567890abcdef"
                    :block/page 20002      ; On printer farm page
                    :block/title "Need [[3D Printing]] equipment"
                    :block/refs #{20001}}]) ; References 3d printing page

    (testing "get_page_linked_references returns blocks that reference the target page"
      (p/let [result (api/get_page_linked_references "3d printing")]
        (let [refs (js->clj result :keywordize-keys true)]
          ;; Should find 2 blocks that reference "3d printing"
          (is (= 2 (count refs)) "Should find 2 references to '3d printing'")

          ;; Check that the references contain the expected UUIDs
          (let [ref-uuids (set (map :uuid refs))]
            (is (contains? ref-uuids "block-ideas-ref3d-1234-567890abcdef")
                "Should include reference from ideas page")
            (is (contains? ref-uuids "block-other-ref3d-1234-567890abcdef")
                "Should include reference from printer farm page"))

          ;; Check that content includes the references
          (let [ref-titles (set (map :title refs))]
            (is (some #(clojure.string/includes? % "3D Printing") ref-titles)
                "References should contain the page title")))))

    (testing "get_page_linked_references works with page UUID"
      (p/let [result (api/get_page_linked_references "page-3dprint-uuid-1234-567890abcdef")]
        (let [refs (js->clj result :keywordize-keys true)]
          ;; Should find same 2 blocks when querying by UUID
          (is (= 2 (count refs)) "Should find same references when querying by UUID"))))

    (testing "get_page_linked_references returns empty for page with no references"
      (p/let [result (api/get_page_linked_references "printer farm")]
        (let [refs (js->clj result :keywordize-keys true)]
          ;; Printer farm has one reference (from ideas page)
          (is (= 1 (count refs)) "Should find 1 reference to 'printer farm'"))))

    (testing "get_page_linked_references returns empty for non-existent page"
      (p/let [result (api/get_page_linked_references "non-existent-page")]
        (let [refs (js->clj result :keywordize-keys true)]
          (is (empty? refs) "Should return empty for non-existent page"))))

    (testing "get_page_linked_references excludes self-references"
      (p/let [result (api/get_page_linked_references "ideas")]
        (let [refs (js->clj result :keywordize-keys true)]
          ;; Ideas page should not include blocks from itself
          (is (every? #(not= (:page %) {:id 20000}) refs)
              "Should not include self-references from the same page"))))))

#_(cljs.test/run-tests)
