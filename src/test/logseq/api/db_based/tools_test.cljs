(ns logseq.api.db-based.tools-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [frontend.db.conn :as conn]
            [frontend.test.helper :as test-helper]
            [logseq.api.db-based.tools :as api-tools]
            [logseq.api.test-helper :as api-test]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(deftest list-and-get-page-data
  (test-helper/load-test-files
   [{:page {:block/title "Tools Page"}
     :blocks [{:block/title "tools block"}]}])
  (let [db (conn/get-db)
        pages (api-tools/list-pages db {})
        page-data (api-tools/get-page-data db "Tools Page")
        missing (api-tools/get-page-data db "Missing")]
    (is (some #(= "Tools Page" (:block/title %)) pages))
    (is (= "Tools Page" (get-in page-data [:entity :block/title])))
    (is (some #(= "tools block" (:block/title %)) (:blocks page-data)))
    (is (nil? missing))))

(deftest build-upsert-nodes-edn-from-add-operations
  (let [db (conn/get-db)
        edn (api-tools/build-upsert-nodes-edn
             db
             [{:operation "add"
               :entityType "page"
               :id "p1"
               :data {:title "Upsert Tools Page"}}
              {:operation "add"
               :entityType "block"
               :data {:title "Upsert Tools Block"
                      :page-id "p1"}}
              {:operation "add"
               :entityType "tag"
               :data {:title "Upsert Tag"}}])]
    (is (= "Upsert Tools Page" (get-in edn [:pages-and-blocks 0 :page :block/title])))
    (is (= "Upsert Tools Block" (get-in edn [:pages-and-blocks 0 :blocks 0 :block/title])))
    (is (some #(= "Upsert Tag" (:block/title %)) (vals (:classes edn))))))

(deftest build-upsert-nodes-edn-rejects-invalid-operations
  (is (thrown-with-msg?
       js/Error
       #"Tool arguments are invalid"
       (api-tools/build-upsert-nodes-edn
        (conn/get-db)
        [{:operation "add" :entityType "block" :data {:title "no page"}}])))
  (is (thrown-with-msg?
       js/Error
       #"isn't supported yet"
       (api-tools/build-upsert-nodes-edn
        (conn/get-db)
        [{:operation "edit"
          :entityType "page"
          :id "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
          :data {:title "Nope"}}])))
  (is (thrown-with-msg?
       js/Error
       #"must be a page uuid or the id of a page added"
       (api-tools/build-upsert-nodes-edn
        (conn/get-db)
        [{:operation "add"
          :entityType "block"
          :data {:title "orphan"
                 :page-id "Some Page Name"}}]))))
