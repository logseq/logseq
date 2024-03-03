(ns frontend.db.model-test
  (:require [cljs.test :refer [use-fixtures deftest is are]]
            [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [logseq.db.schema :as db-schema]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [datascript.core :as d]
            [shadow.resource :as rc]
            [clojure.set :as set]
            [clojure.edn :as edn]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(deftest get-namespace-pages
  (load-test-files [{:file/path "pages/a.b.c.md"
                     :file/content "foo"}
                    {:file/path "pages/b.c.md"
                     :file/content "bar"}
                    {:file/path "pages/b.d.md"
                     :file/content "baz"}])

  (is (= ["a/b" "a/b/c"]
         (map :block/name (model/get-namespace-pages test-helper/test-db "a"))))

  (is (= ["b/c" "b/d"]
         (map :block/name (model/get-namespace-pages test-helper/test-db "b")))))

(deftest get-page-namespace-routes
  (load-test-files [{:file/path "pages/a.b.c.md"
                     :file/content "foo"}
                    {:file/path "pages/b.c.md"
                     :file/content "bar"}
                    {:file/path "pages/b.d.md"
                     :file/content "baz"}])

  (is (= '()
         (map :block/name (model/get-page-namespace-routes test-helper/test-db "b/c")))
      "Empty if page exists"))

(deftest test-page-alias-with-multiple-alias
  (load-test-files [{:file/path "aa.md"
                     :file/content "alias:: ab, ac"}
                    {:file/path "ab.md"
                     :file/content "alias:: aa, ad"}
                    {:file/path "ae.md"
                     :file/content "## ref to [[ab]]"}])
  (let [a-aliases (model/page-alias-set test-helper/test-db "aa")
        b-aliases (model/page-alias-set test-helper/test-db "ab")
        alias-names (model/get-page-alias-names test-helper/test-db "aa")
        b-ref-blocks (model/get-page-referenced-blocks "ab")
        a-ref-blocks (model/get-page-referenced-blocks "aa")]

    (are [x y] (= x y)
         4 (count a-aliases)
         4 (count b-aliases)
         4 (count b-ref-blocks)
         4 (count a-ref-blocks)
         #{"ab" "ac" "ad"} (set alias-names))))

(deftest test-page-alias-set
  (load-test-files [{:file/path "aa.md"
                     :file/content "alias:: ab"}
                    {:file/path "ab.md"
                     :file/content "alias:: ac"}
                    {:file/path "ad.md"
                     :file/content "## ref to [[ab]]"}])
  (let [a-aliases (model/page-alias-set test-helper/test-db "aa")
        alias-names (model/get-page-alias-names test-helper/test-db "aa")
        a-ref-blocks (model/get-page-referenced-blocks "aa")]
    (are [x y] (= x y)
         3 (count a-aliases)
         3 (count a-ref-blocks)
         #{"ab" "ac"} (set alias-names))))

(deftest get-pages-that-mentioned-page-with-show-journal
  (load-test-files [{:file/path "journals/2020_08_15.md"
                     :file/content "link 1 to [[page ONE]] and link to [[generic page]]"}
                    {:file/path "journals/2020_09_18.md"
                     :file/content "link 2 to [[page ONE]]"}
                    {:file/path "pages/page ONE.md"
                     :file/content "tags:: a tag
- page one has link to [[Dec 26th, 2020]] journal page"}
                    {:file/path "pages/a tag.md"
                     :file/content "i'm a tag"}
                    {:file/path "pages/generic page.md"
                     :file/content "- link to page one [[page ONE]]"}])

  (is (= '("sep 18th, 2020" "aug 15th, 2020" "generic page")
         (map first (model/get-pages-that-mentioned-page test-helper/test-db "page ONE" true)))
      "Must be 'generic page' + 2 journals")

  (is (= '("generic page")
         (map first (model/get-pages-that-mentioned-page test-helper/test-db "page ONE" false)))
      "Must be only 'generic page'")

  (is (= '("aug 15th, 2020")
         (map first (model/get-pages-that-mentioned-page test-helper/test-db "generic page" true)))
      "Must show only 'aug 15th, 2020'")

  (is (= '()
         (map first (model/get-pages-that-mentioned-page test-helper/test-db "generic page" false)))
      "Must be empty"))

(deftest remove-links-for-each-level-of-the-namespaces
  (load-test-files [{:file/path "pages/generic page.md"
                     :file/content "tags:: [[one/two/tree]], one/two
- link to ns [[one]]
- link to page one [[page ONE]]"}])

  (is (= '("one/two/tree" "page one")
         (map second (model/get-pages-relation test-helper/test-db true)))
      "(get-pages-relation) Must be only ns one/two/tree")

  (is (= '("one/two/tree" "page one")
         (map second (#'model/remove-nested-namespaces-link [["generic page" "one/two/tree"]
                                                           ["generic page" "one/two"]
                                                           ["generic page" "one"]
                                                           ["generic page" "page one"]])))
      "(model/remove-nested-namespaces-link) Must be only ns one/two/tree")

  (is (= '("one/two/tree" "one/two" "one")
         (#'model/get-parents-namespace-list "one/two/tree/four"))
      "Must be one/two/tree one/two one")

  (is (= '("one/two" "one")
         (#'model/get-unnecessary-namespaces-name '("one/two/tree" "one" "one/two" "non nested tag" "non nested link")))
      "Must be  one/two one"))

(deftest entity-query-should-return-nil-if-id-not-exists
  (is (nil? (db/entity 1000000))))

(deftest entity-query-should-support-both-graph-string-and-db
  (is (= 1 (:db/id (db/entity test-helper/test-db 1))))
  (is (= 1 (:db/id (db/entity (conn/get-db test-helper/test-db) 1)))))

(deftest get-block-by-page-name-and-block-route-name
  (load-test-files [{:file/path "foo.md"
                     :file/content "foo:: bar
- b2
- ### Header 2
foo:: bar"}])
  (is (uuid?
       (:block/uuid
        (model/get-block-by-page-name-and-block-route-name test-helper/test-db "foo" "header 2")))
      "Header block's content returns map with :block/uuid")

  (is (nil?
       (model/get-block-by-page-name-and-block-route-name test-helper/test-db "foo" "b2"))
      "Non header block's content returns nil"))


(def broken-outliner-data-with-cycle (-> (rc/inline "fixtures/broken-outliner-data-with-cycle.edn")
                                         edn/read-string))

(deftest get-block-children-ids-on-bad-outliner-data
  (let [db (d/db-with (d/empty-db db-schema/schema)
                      broken-outliner-data-with-cycle)]

    (is (= "bad outliner data, need to re-index to fix"
           (try (model/get-block-children-ids-in-db db #uuid"e538d319-48d4-4a6d-ae70-c03bb55b6fe4")
                (catch :default e
                  (ex-message e)))))))

(deftest get-block-immediate-children
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "\n
- parent
  - child 1
    - grandchild 1
  - child 2
    - grandchild 2
  - child 3"}])
  (let [parent (-> (d/q '[:find (pull ?b [*]) :where [?b :block/content "parent"]]
                        (conn/get-db test-helper/test-db))
                   ffirst)]
    (is (= ["child 1" "child 2" "child 3"]
           (map :block/content
                (model/get-block-immediate-children test-helper/test-db (:block/uuid parent)))))))

(deftest get-property-values
  (load-test-files [{:file/path "pages/Feature.md"
                     :file/content "type:: [[Class]]"}
                    {:file/path "pages/Class.md"
                     :file/content "type:: https://schema.org/Class\npublic:: true"}
                    {:file/path "pages/DatePicker.md"
                     :file/content "type:: #Feature, #Command"}
                    {:file/path "pages/Whiteboard___Tool___Eraser.md"
                     :file/content "type:: [[Tool]], [[Whiteboard/Object]]"}])

  (let [type-values (set (model/get-property-values :type))
        public-values (set (model/get-property-values :public))]

    (is (contains? type-values "[[Class]]")
        "Property value from single page-ref is wrapped in square brackets")
    (is (= #{} (set/difference #{"[[Tool]]" "[[Whiteboard/Object]]"} type-values))
        "Property values from multiple page-refs are wrapped in square brackets")
    (is (= #{} (set/difference #{"#Feature" "#Command"} type-values))
        "Property values from multiple tags have hashtags")
    (is (contains? type-values "https://schema.org/Class")
        "Property value text is not modified")
    (is (contains? public-values "true")
        "Property value that is not text is not modified")))
