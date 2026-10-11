(ns logseq.outliner.entity-ops-test
  "Outliner core operations that merge into or read an entity's titles: they
   need the compiled app (the outliner library's own tests run under nbb)."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.outliner.core :as outliner-core]))

(deftest save-block-renames-a-page
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "Foo"} :blocks []}
                                               {:page {:block/title "Taken"} :blocks []}])
        foo (db-test/find-page-by-title @conn "Foo")
        save! #(outliner-core/save-block! conn {:db/id (:db/id foo) :block/uuid (:block/uuid foo) :block/title %})]
    (testing "a new title gives the page its new name"
      (save! "Bar")
      (is (= "bar" (:block/name (d/entity @conn (:db/id foo))))))
    (testing "the title of another page is refused"
      (is (thrown? js/Error (save! "Taken")))
      (is (= "bar" (:block/name (d/entity @conn (:db/id foo))))))))

(deftest save-block-allows-a-slash-in-a-block-title
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")]
    (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (:block/uuid b1) :block/title "either/or"})
    (is (= "either/or" (:block/title (d/entity @conn (:db/id b1)))))))

(deftest save-block-clears-a-warning-when-the-title-changes
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")]
    (d/transact! conn [[:db/add (:db/id b1) :block/warning :multiple-blocks]])
    (is (= :multiple-blocks (:block/warning (d/entity @conn (:db/id b1)))))
    (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (:block/uuid b1) :block/title "b1 edited"})
    (is (nil? (:block/warning (d/entity @conn (:db/id b1)))))))

(deftest save-block-drops-a-markdown-heading-marker-except-in-a-code-block
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}
                                                         {:block/title "code"
                                                          :build/properties {:logseq.property.node/display-type :code}}]}])
        b1 (db-test/find-block-by-content @conn "b1")
        code (db-test/find-block-by-content @conn "code")]
    (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (:block/uuid b1) :block/title "## Heading"})
    (is (= "Heading" (:block/title (d/entity @conn (:db/id b1)))))
    (outliner-core/save-block! conn {:db/id (:db/id code) :block/uuid (:block/uuid code) :block/title "## shell comment"})
    (is (= "## shell comment" (:block/title (d/entity @conn (:db/id code)))))))

(deftest save-block-refuses-to-change-a-block-uuid
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")]
    (is (thrown? js/Error
                 (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (random-uuid) :block/title "x"})))
    (is (= "b1" (:block/title (d/entity @conn (:db/id b1)))))))

(deftest save-block-removes-an-inline-tag-deleted-from-the-title
  ;; the stored title holds the tag as #[[uuid]], as the editor saves it
  (let [topic-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/uuid topic-uuid}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title (str "note #[[" topic-uuid "]]") :build/tags [:Topic]}]}]})
        note (db-test/find-block-by-content @conn #"note")
        topic-id (:db/id (d/entity @conn :user.class/Topic))]
    (is (contains? (set (map :db/id (:block/tags note))) topic-id))
    (outliner-core/save-block! conn {:db/id (:db/id note) :block/uuid (:block/uuid note) :block/title "note"})
    (is (not (contains? (set (map :db/id (:block/tags (d/entity @conn (:db/id note))))) topic-id)))))

(deftest save-block-bumps-the-block-and-its-page-updated-at
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")
        page (:block/page b1)]
    (d/transact! conn [[:db/add (:db/id b1) :block/updated-at 1]
                       [:db/add (:db/id page) :block/updated-at 1]])
    (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (:block/uuid b1) :block/title "b1 edited"})
    (is (< 1 (:block/updated-at (d/entity @conn (:db/id b1)))))
    (is (< 1 (:block/updated-at (d/entity @conn (:db/id page)))))))

(deftest collapsing-a-block-does-not-bump-its-updated-at
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1" :build/children [{:block/title "c"}]}]}])
        b1 (db-test/find-block-by-content @conn "b1")]
    (d/transact! conn [[:db/add (:db/id b1) :block/updated-at 1]])
    (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (:block/uuid b1) :block/collapsed? true}
                               {:outliner-op :collapse-expand-blocks})
    (is (true? (:block/collapsed? (d/entity @conn (:db/id b1)))))
    (is (= 1 (:block/updated-at (d/entity @conn (:db/id b1)))))))

(deftest save-block-gives-no-page-name-to-a-block
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")]
    (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (:block/uuid b1) :block/title "b1 edited"})
    (is (nil? (:block/name (d/entity @conn (:db/id b1)))))))

(deftest save-block-creates-a-page-its-new-title-refers-to
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")
        ;; the ref map the editor's parser makes for [[brand new page]]
        ref (gp-block/page-name->map "brand new page" @conn true
                                     date-time-util/default-journal-title-formatter)
        page-uuid (:block/uuid ref)]
    (outliner-core/save-block! conn {:db/id (:db/id b1)
                                     :block/uuid (:block/uuid b1)
                                     :block/title (str "see [[" page-uuid "]]")
                                     :block/refs [ref]})
    (is (some? (db-test/find-page-by-title @conn "brand new page")))
    (is (= [page-uuid] (map :block/uuid (:block/refs (d/entity @conn (:db/id b1))))))))

(deftest save-block-without-a-title-keeps-a-warning
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")]
    (d/transact! conn [[:db/add (:db/id b1) :block/warning :multiple-blocks]])
    (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (:block/uuid b1) :block/collapsed? true})
    (is (= :multiple-blocks (:block/warning (d/entity @conn (:db/id b1)))))))

(deftest save-block-transacts-its-other-tx
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"} {:block/title "b2"}]}])
        b1 (db-test/find-block-by-content @conn "b1")
        b2 (db-test/find-block-by-content @conn "b2")]
    (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (:block/uuid b1) :block/title "b1 edited"
                                     :db/other-tx [[:db/add (:db/id b2) :block/collapsed? true]]})
    (is (true? (:block/collapsed? (d/entity @conn (:db/id b2)))))))

(deftest remove-disallowed-inline-classes-cases
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {}}
               :pages-and-blocks [{:page {:block/title "page1"} :blocks [{:block/title "b1"}]}]})
        db @conn
        b1 (db-test/find-block-by-content db "b1")
        contents (db-test/find-page-by-title db "Contents")
        topic (d/entity db :user.class/Topic)
        title (str "see #[[" (:block/uuid contents) "]]")
        strip #(#'outliner-core/remove-disallowed-inline-classes db (merge {:db/id (:db/id b1) :block/title title} %))]
    (is (some? contents))
    (testing "a built-in page used as an inline tag is dropped from the tags and the title, however the tags are given"
      (doseq [tags [(:db/id contents) [:block/uuid (:block/uuid contents)] [contents]]]
        (let [block (strip {:block/tags tags})]
          (is (empty? (:block/tags block)) (pr-str tags))
          (is (= "see #Contents" (:block/title block)) (pr-str tags)))))
    (testing "an allowed tag stays"
      (is (= [(:db/id topic)] (map :db/id (:block/tags (strip {:block/tags [topic] :block/title "x"}))))))
    (testing "a disallowed tag the title does not use is left alone"
      (let [block (strip {:block/tags [contents] :block/title "plain"})]
        (is (= "plain" (:block/title block)))
        (is (= [(:db/id contents)] (map :db/id (:block/tags block))))))
    (testing "a map with a page name (a page being created) is returned as it is"
      (let [new-page {:db/id (:db/id b1) :block/name "new page" :block/title title :block/tags [contents]}]
        (is (= new-page (#'outliner-core/remove-disallowed-inline-classes db new-page)))))
    (testing "a page is returned as it is"
      (let [page {:db/id (:db/id (db-test/find-page-by-title db "page1")) :block/name "page1"
                  :block/title title :block/tags [contents]}]
        (is (= page (#'outliner-core/remove-disallowed-inline-classes db page)))))))

(deftest a-copied-block-keeps-its-references-by-uuid
  (let [src-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Linked"} :blocks []}
               {:page {:block/title "page1"}
                :blocks [{:block/title "see [[Linked]]" :block/uuid src-uuid}
                         {:block/title "target"}]}])
        src (d/entity @conn [:block/uuid src-uuid])
        target (db-test/find-block-by-content @conn "target")
        {:keys [blocks]} (outliner-core/insert-blocks @conn [src] target {:sibling? true})]
    (is (not= (:block/raw-title src) (:block/title src)) "the stored title holds the uuid")
    (is (= (:block/raw-title src) (:block/title (first blocks))))))
