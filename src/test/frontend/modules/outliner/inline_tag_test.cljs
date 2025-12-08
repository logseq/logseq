(ns frontend.modules.outliner.inline-tag-test
  (:require [cljs.test :refer [use-fixtures deftest is testing] :as test]
            [datascript.core :as d]
            [frontend.test.helper :as test-helper]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(use-fixtures :each test-helper/db-based-start-and-destroy-db)

(deftest save-inline-tag
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"} :blocks [{:block/title "test"}]}])
        block (db-test/find-block-by-content @conn "test")
        _ (outliner-core/save-block! "logseq_db_test" conn
                                     "MMM do, yyyy"
                                     {:block/uuid (:block/uuid block)
                                      :block/refs '({:block/name "audio", :block/title "audio", :block/uuid #uuid "6852be3e-6e80-4245-b72c-0d586f1fd007", :block/created-at 1750253118663, :block/updated-at 1750253118663, :block/tags [:logseq.class/Page]}),
                                      :block/tags '({:block/name "audio", :block/title "audio", :block/uuid #uuid "6852be3e-6e80-4245-b72c-0d586f1fd007", :block/created-at 1750253118663, :block/updated-at 1750253118663, :block/tags [:logseq.class/Tag]}),
                                      :block/title "test #[[6852be3e-6e80-4245-b72c-0d586f1fd007]]",
                                      :db/id (:db/id block)})
        audio-tag (ldb/get-page @conn "audio")]
    (is (some? (:db/ident audio-tag)) "#audio doesn't have db/ident")
    (is (= [:logseq.class/Tag] (map :db/ident (:block/tags audio-tag)))
        "#audio has wrong tags")))

(deftest disallowed-inline-tags-when-save-block
  (testing "Disallowed inline tags shouldn't be recognized when save block"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"} :blocks [{:block/title "test"}]}])
          block (db-test/find-block-by-content @conn "test")]
      (doseq [class-ident db-class/page-classes]
        (let [class (d/entity @conn class-ident)]
          (outliner-core/save-block! "logseq_db_test" conn
                                     "MMM do, yyyy"
                                     {:block/uuid (:block/uuid block)
                                      :block/tags [(select-keys class [:block/name :block/title :block/uuid :db/ident])],
                                      :block/title (common-util/format "test #[[%s]]" (str (:block/uuid class))),
                                      :db/id (:db/id block)})
          (let [block' (d/entity @conn (:db/id block))]
            (is (= (str "test #" (:block/title class)) (:block/title block')))
            (is (empty? (:block/tags block')))))))))

(deftest disallowed-inline-tags-when-insert-blocks
  (testing "Disallowed inline tags shouldn't be recognized when insert blocks"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"} :blocks [{:block/title "test"}]}])
          block (db-test/find-block-by-content @conn "test")]
      (doseq [class-ident db-class/page-classes]
        (let [class (d/entity @conn class-ident)
              new-block-id (random-uuid)
              _ (outliner-core/insert-blocks! "logseq_db_test" conn
                                              [{:block/uuid new-block-id
                                                :block/tags [(select-keys class [:block/name :block/title :block/uuid :db/ident])],
                                                :block/title (common-util/format "test #[[%s]]" (str (:block/uuid class))),
                                                :block/page (:db/id (:block/page block))}]
                                              block
                                              {:sibling? false
                                               :keep-uuid? true})
              block' (d/entity @conn [:block/uuid new-block-id])]
          (is (= (str "test #" (:block/title class)) (:block/title block')))
          (is (empty? (:block/tags block'))))))))
