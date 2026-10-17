(ns logseq.outliner.delete-tag-page-refs-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]))

(deftest deleting-a-tag-page-turns-refs-to-it-and-its-blocks-into-titles-test
  (testing "a block referencing a tag page and one of the page's own blocks keeps both as text after the tag is deleted"
    (let [foo-uuid (random-uuid)
          conn (db-test/create-conn-with-blocks
                {:classes {:Foo {:block/uuid foo-uuid :build/keep-uuid? true}}
                 :pages-and-blocks
                 [{:page {:block/uuid foo-uuid}
                   :blocks [{:block/title "fb"}]}
                  {:page {:block/title "P"}
                   :blocks [{:block/title "r"}
                            {:block/title "only-foo"}]}]
                 :build-existing-tx? true})
          foo (d/entity @conn [:block/uuid foo-uuid])
          fb (db-test/find-block-by-content @conn "fb")
          r (db-test/find-block-by-content @conn "r")
          only-foo (db-test/find-block-by-content @conn "only-foo")]
      (d/transact! conn [{:db/id (:db/id r)
                          :block/title (str "see " (page-ref/->page-ref foo-uuid)
                                            " and " (page-ref/->page-ref (:block/uuid fb)))
                          :block/refs [(:db/id foo) (:db/id fb)]}
                         {:db/id (:db/id only-foo)
                          :block/title (str "see " (page-ref/->page-ref foo-uuid))
                          :block/refs [(:db/id foo)]}])
      (outliner-page/delete! conn foo-uuid {})
      (is (nil? (d/entity @conn [:block/uuid foo-uuid])) "the tag page is deleted")
      (is (= "see Foo and fb" (:block/raw-title (d/entity @conn (:db/id r))))
          "refs to the page and to its block become their titles")
      (is (= "see Foo" (:block/raw-title (d/entity @conn (:db/id only-foo))))
          "a ref to the page alone becomes its title"))))
