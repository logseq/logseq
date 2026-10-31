(ns logseq.outliner.validate-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.validate :as outliner-validate]))

(defn- tag-idents
  [entity]
  (set (map :db/ident (:block/tags entity))))

;; Fails if, in `colliding-tag-ids`, `>` becomes `>=`.
(deftest validate-unique-page-with-only-page-tag-against-page-with-more-tags-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Company {}}
               :pages-and-blocks
               [{:page {:block/title "Apple" :build/tags [:logseq.class/Page :Company]}}
                {:page {:block/title "Banana" :build/tags [:logseq.class/Page :Company]}}
                {:page {:block/title "Plain"}}]})
        apple (db-test/find-page-by-title @conn "Apple")
        banana (db-test/find-page-by-title @conn "Banana")
        plain (db-test/find-page-by-title @conn "Plain")]
    (testing "fixture: Apple has #Page and #Company, Plain has only #Page"
      (is (= #{:logseq.class/Page :user.class/Company} (tag-idents apple)))
      (is (= #{:logseq.class/Page} (tag-idents plain))))
    (testing "a page with only #Page can't take the name of a page with #Page and another tag"
      (is (thrown-with-msg?
           js/Error
           #"Duplicate page"
           (outliner-validate/validate-unique-by-name-and-tags @conn "Apple" plain))))
    (testing "a page with #Page and another tag can't take the name of a page with only #Page"
      (is (thrown-with-msg?
           js/Error
           #"Duplicate page"
           (outliner-validate/validate-unique-by-name-and-tags @conn "Plain" apple))))
    (testing "two pages with #Page and the same other tag collide on that tag"
      (is (thrown-with-msg?
           js/Error
           #"Duplicate page"
           (outliner-validate/validate-unique-by-name-and-tags @conn "Apple" banana))))))

;; Fails if, in `validate-disallow-page-with-journal-name`, `not` becomes `identity`.
(deftest validate-disallow-page-with-journal-name-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Foo"}}
               {:page {:build/journal 20261011}}])
        page (db-test/find-page-by-title @conn "Foo")
        journal (db-test/find-journal-by-journal-day @conn 20261011)]
    (testing "a non-journal page can't be renamed to a journal title"
      (is (thrown-with-msg?
           js/Error
           #"Page can't be renamed to a journal"
           (outliner-validate/validate-block-title @conn "Oct 12th, 2026" page))))
    (testing "a non-journal page can be renamed to an ordinary title"
      (is (nil? (outliner-validate/validate-block-title @conn "Bar" page))))
    (testing "a journal page keeps its journal title"
      (is (some? journal))
      (is (nil? (outliner-validate/validate-disallow-page-with-journal-name "Oct 11th, 2026" journal))))))

;; Fails if, in `disallow-node-cant-tag-with-private-tags`, `=` becomes `not=`.
(deftest validate-tags-property-allows-asset-tag-on-assets-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "image"}
                         {:block/title "text"}]}])
        image (db-test/find-block-by-content @conn "image")
        text (db-test/find-block-by-content @conn "text")
        _ (d/transact! conn [[:db/add (:db/id image) :logseq.property.asset/type "png"]])]
    (testing "an asset block can get and lose #Asset"
      (is (nil? (outliner-validate/validate-tags-property @conn [(:db/id image)] :logseq.class/Asset)))
      (is (nil? (outliner-validate/validate-tags-property-deletion @conn [(:db/id image)] :logseq.class/Asset))))
    (testing "a non-asset block can't get #Asset"
      (is (thrown-with-msg?
           js/Error
           #"Can't set tag.*Asset"
           (outliner-validate/validate-tags-property @conn [(:db/id text)] :logseq.class/Asset))))
    (testing "an asset block still can't get another private tag"
      (is (thrown-with-msg?
           js/Error
           #"Can't set tag.*Tag"
           (outliner-validate/validate-tags-property @conn [(:db/id image)] :logseq.class/Tag))))))
