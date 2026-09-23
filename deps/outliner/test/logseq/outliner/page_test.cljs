(ns logseq.outliner.page-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.db :as db-db]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.validate :as outliner-validate]))

(deftest create-class
  (let [conn (db-test/create-conn)
        _ (outliner-page/create! conn "movie" {:class? true})
        _ (outliner-page/create! conn "Movie" {:class? true})
        movie-class (ldb/get-case-page @conn "movie")
        Movie-class (ldb/get-case-page @conn "Movie")]

    (is (ldb/class? movie-class) "Creates a class")
    (is (ldb/class? Movie-class) "Creates another class with a different case sensitive name")
    (is (not= movie-class Movie-class) "The two classes are not the same")))

(deftest create-namespace-pages
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/property1 {:logseq.property/type :default}}
               :classes {:class1 {}}
               :pages-and-blocks [{:page {:block/title "page1"}}]})]

    (testing "Basic valid workflows"
      (let [[_ child-uuid] (outliner-page/create! conn "foo/bar/baz" {:split-namespace? true})
            child-page (d/entity @conn [:block/uuid child-uuid])
            ;; Create a 2nd child page using existing parent pages
            [_ child-uuid2] (outliner-page/create! conn "foo/bar/baz2" {:split-namespace? true})
            child-page2 (d/entity @conn [:block/uuid child-uuid2])
            ;; Create a child page for a class
            [_ child-uuid3] (outliner-page/create! conn "c1/c2" {:split-namespace? true :class? true})
            child-page3 (d/entity @conn [:block/uuid child-uuid3])
            library (ldb/get-built-in-page @conn common-config/library-page-name)
            bar (ldb/get-page @conn "bar")]
        (is (= ["foo"] (map :block/title (:block/_parent library)))
            "Namespace (non-class) pages are added to the Library page")
        (is (= ["baz" "baz2"] (map :block/title (:block/_parent bar)))
            "Child pages are created under the same parent")
        (is (= ["foo" "bar"] (map :block/title [(:block/parent (:block/parent child-page))
                                                (:block/parent child-page)]))
            "Child page with new parent has correct parents")
        (is (= (map :block/uuid (db-db/get-page-parents child-page))
               (map :block/uuid (db-db/get-page-parents child-page2)))
            "Child page with existing parents has correct parents")
        (is (= #{"Root Tag" "c1"} (set (map :block/title (ldb/get-classes-parents [child-page3]))))
            "Child class with new parent has correct parents")

        (outliner-page/create! conn "foo/class1/baz3" {:split-namespace? true})
        (is (= #{"Tag" "Page"}
               (set (d/q '[:find [?tag-title ...]
                           :where
                           [?b :block/title "class1"]
                           [?b :block/tags ?t]
                           [?t :block/title ?tag-title]] @conn)))
            "Using an existing class page in a multi-parent namespace doesn't allow a page to have a class parent and instead creates a new page")))

    (testing "Child pages with same name and different parents"
      (let [_ (outliner-page/create! conn "vim/keys" {:split-namespace? true})
            _ (outliner-page/create! conn "emacs/keys" {:split-namespace? true})]
        (is (= #{"vim" "emacs"}
               (->> (d/q '[:find [(pull ?b [{:block/parent [:block/title]}]) ...] :where [?b :block/title "keys"]] @conn)
                    (map #(get-in % [:block/parent :block/title]))
                    set))
            "Two child pages with same name exist and have different parents")))

    (testing "Invalid workflows"
      (is (thrown-with-msg?
           js/Error
           #"Cannot create"
           (outliner-page/create! conn "class1/page" {:split-namespace? true}))
          "Page can't have a class parent")
      (is (thrown-with-msg?
           js/Error
           #"Cannot create"
           (outliner-page/create! conn "property1/page" {:split-namespace? true}))
          "Page can't have a property parent")
      (is (thrown-with-msg?
           js/Error
           #"Cannot create"
           (outliner-page/create! conn "property1/class" {:split-namespace? true :class? true}))
          "Class can't have a property parent"))))

(deftest create-page
  (let [conn (db-test/create-conn)
        [_ page-uuid] (outliner-page/create! conn "fooz" {})]
    (is (= "fooz" (:block/title (d/entity @conn [:block/uuid page-uuid])))
        "Page created correctly")

    (is (thrown-with-msg?
         js/Error
         #"can't include \"/"
         (outliner-page/create! conn "foo/bar" {}))
        "Page can't have '/'n title")

    (is (thrown-with-msg?
         js/Error
         #"can't include \"#\""
         (outliner-page/create! conn "foo#bar" {}))
        "Page can't have '#' in title")

    (is (thrown-with-msg?
         js/Error
         #"can't include \"#\""
         (outliner-page/create! conn "#tagstyle" {}))
        "Page can't have leading '#' in title")))

(defn- parsed-tag
  "Tag map produced when search/create parses a hashtag without a db, matching
  Ctrl-K `Foo #Tag`."
  [title]
  (gp-block/page-name->map title nil true nil {:class? true}))

(deftest create-page-with-tag-named-tag
  (let [conn (db-test/create-conn)
        built-in-tag (d/entity @conn :logseq.class/Tag)]
    (is (thrown-with-msg?
         js/Error
         #"New page can't set built-in tags"
         (outliner-page/create! conn "Foo" {:tags [(parsed-tag "Tag")]}))
        "Creating a page with #Tag must not create a user Tag class")
    (is (nil? (db-test/find-page-by-title @conn "Foo"))
        "Page is not created when #Tag is rejected")
    (let [tag-after (d/entity @conn :logseq.class/Tag)
          tag-ents (d/q '[:find [?e ...] :where [?e :block/title "Tag"]] @conn)]
      (is (= (:db/id built-in-tag) (:db/id tag-after)))
      (is (= :logseq.class/Tag (:db/ident tag-after)))
      (is (true? (:logseq.property/built-in? tag-after)))
      (is (= 1 (count tag-ents))
          "Built-in Tag class is not duplicated"))
    (is (nil? (:errors (db-validate/validate-db @conn)))
        "Graph remains valid")))

(deftest create-page-with-existing-public-and-new-tags
  (let [conn (db-test/create-conn)
        [_ foo-uuid] (outliner-page/create! conn "Foo" {:tags [(parsed-tag "Task")]})
        foo (d/entity @conn [:block/uuid foo-uuid])
        [_ bar-uuid] (outliner-page/create! conn "Bar" {:tags [(parsed-tag "Movie")]})
        bar (d/entity @conn [:block/uuid bar-uuid])
        movie (db-test/find-page-by-title @conn "Movie")]
    (is (contains? (set (map :db/ident (:block/tags foo))) :logseq.class/Task)
        "Public built-in #Task is reused instead of duplicated")
    (is (= 1 (count (d/q '[:find [?e ...] :where [?e :block/title "Task"]] @conn))))
    (is (ldb/class? movie)
        "A new user tag is still created")
    (is (nil? (:block/type movie))
        "New tags must not keep file-graph :block/type from a db-less parse")
    (is (contains? (set (map :db/ident (:block/tags bar))) (:db/ident movie)))
    (is (nil? (:errors (db-validate/validate-db @conn)))
        "Graph remains valid after creating a page with a new tag")))

(deftest create-page-with-public-tag-reuses-existing-page
  (let [conn (db-test/create-conn)
        [_ foo-uuid] (outliner-page/create! conn "Foo" {:tags [(parsed-tag "Task")]})
        [_ foo-uuid-again] (outliner-page/create! conn "Foo" {:tags [(parsed-tag "Task")]})]
    (is (= foo-uuid foo-uuid-again)
        "A second create of Foo #Task returns the existing page")
    (is (= 1 (count (d/q '[:find [?e ...] :where [?e :block/title "Foo"]] @conn)))
        "A second create must not insert another Foo page")))

(deftest create-pages-with-same-title-and-different-tags
  (let [conn (db-test/create-conn-with-blocks {:classes {:Kestrel {} :Lantern {}}})
        kestrel (db-test/find-page-by-title @conn "Kestrel")
        lantern (db-test/find-page-by-title @conn "Lantern")
        [_ kestrel-page-uuid] (outliner-page/create! conn "Juniper" {:tags [(:block/uuid kestrel)]})
        [_ lantern-page-uuid] (outliner-page/create! conn "Juniper" {:tags [(:block/uuid lantern)]})
        [_ lantern-page-uuid-again] (outliner-page/create! conn "Juniper" {:tags [(:block/uuid lantern)]})
        tag-titles (fn [page-uuid]
                     (set (map :block/title (:block/tags (d/entity @conn [:block/uuid page-uuid])))))]
    (is (not= kestrel-page-uuid lantern-page-uuid)
        "Same title with a different tag creates a new page")
    (is (= 2 (count (d/q '[:find [?e ...] :where [?e :block/title "Juniper"]] @conn)))
        "Both pages share the title")
    (is (= #{"Kestrel" "Page"} (tag-titles kestrel-page-uuid)))
    (is (= #{"Lantern" "Page"} (tag-titles lantern-page-uuid)))
    (is (= lantern-page-uuid lantern-page-uuid-again)
        "Same title and tag reuses the existing tagged page")
    (is (nil? (outliner-validate/validate-block-title
               @conn "Juniper" (d/entity @conn [:block/uuid lantern-page-uuid])))
        "Page title uniqueness allows the same title for different tags")
    (is (nil? (:errors (db-validate/validate-db @conn)))
        "Graph remains valid")))

(deftest create-page-with-page-tag-reuses-page-class
  (let [conn (db-test/create-conn)
        [_ page-uuid] (outliner-page/create! conn "Foo" {:tags [(parsed-tag "Page")]})
        foo (d/entity @conn [:block/uuid page-uuid])]
    (is (= "Foo" (:block/title foo)))
    (is (= 1 (count (d/q '[:find [?e ...] :where [?e :block/title "Page"]] @conn)))
        "#Page must reuse the built-in Page class")
    (is (contains? (set (map :db/ident (:block/tags foo))) :logseq.class/Page))))

(deftest create-page-with-resolved-user-tag-titled-tag
  (let [conn (db-test/create-conn)
        [_ class-uuid] (outliner-page/create! conn "MyTag" {:class? true})
        my-tag (d/entity @conn [:block/uuid class-uuid])
        [_ foo-uuid] (outliner-page/create! conn "Foo" {:tags [{:db/ident (:db/ident my-tag)
                                                               :block/title "Tag"
                                                               :block/uuid (random-uuid)}]})
        foo (d/entity @conn [:block/uuid foo-uuid])]
    (is (contains? (set (map :db/ident (:block/tags foo))) (:db/ident my-tag))
        "An explicit user-class ident is reused even when the title is Tag")
    (is (= 1 (count (d/q '[:find [?e ...] :where [?e :block/title "Tag"]] @conn)))
        "Must not resolve a titled-Tag user class to the built-in Tag class")))

(deftest delete-page
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "D1"}
                :blocks [{:block/title "b1"}]}])
        d1 (ldb/get-page @conn "D1")
        b1 (db-test/find-block-by-content @conn "b1")]
    (ldb/transact! conn [{:db/id (:db/id b1)
                          :block/title (str "b1 " (page-ref/->page-ref (:block/uuid d1)))
                          :block/refs #{(:db/id d1)}}])
    (is (contains? (set (map :db/id (:block/refs (d/entity @conn (:db/id b1)))))
                   (:db/id d1)))
    (outliner-page/delete! conn (:block/uuid d1))
    (let [d1' (d/entity @conn (:db/id d1))
          b1' (d/entity @conn (:db/id b1))
          recycle-page (ldb/get-built-in-page @conn "Recycle")]
      (is (some? d1'))
      (is (some? b1'))
      (is (= (:block/uuid recycle-page) (:block/uuid (:block/parent d1'))))
      (is (integer? (:logseq.property/deleted-at d1')))
      (is (= (str "b1 " (page-ref/->page-ref (:block/uuid d1)))
             (:v (first (d/datoms @conn :eavt (:db/id b1') :block/title))))
          "Recycling preserves the child's original title and internal page reference")
      (is (empty? (d/datoms @conn :eavt (:db/id b1') :block/raw-title))
          "Raw title is a derived lookup, not a stored attribute")
      (is (contains? (set (map :db/id (:block/refs b1')))
                     (:db/id d1)))
      (is (= (:block/uuid d1') (:block/uuid (:block/page b1')))))))

(deftest delete-page-succeeds-when-recycle-missing
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "D-missing"}}])
        page (ldb/get-page @conn "D-missing")
        recycle (ldb/get-built-in-page @conn common-config/recycle-page-name)]
    (d/transact! conn [[:db/retractEntity (:db/id recycle)]])
    (is (nil? (ldb/get-built-in-page @conn common-config/recycle-page-name)))
    (is (true? (outliner-page/delete! conn (:block/uuid page))))
    (let [page' (d/entity @conn (:db/id page))
          recycle' (ldb/get-built-in-page @conn common-config/recycle-page-name)]
      (is (true? (ldb/page? recycle')))
      (is (contains? (set (map :db/ident (:block/tags recycle'))) :logseq.class/Page))
      (is (true? (ldb/recycled? page')))
      (is (= (:db/id recycle') (:db/id (:block/parent page')))))))

(deftest delete-page-succeeds-when-recycle-untagged
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "D-untagged"}}])
        page (ldb/get-page @conn "D-untagged")
        recycle (ldb/get-built-in-page @conn common-config/recycle-page-name)]
    (d/transact! conn [[:db/retract (:db/id recycle) :block/tags :logseq.class/Page]])
    (is (not (ldb/page? (d/entity @conn (:db/id recycle)))))
    (is (true? (outliner-page/delete! conn (:block/uuid page))))
    (let [page' (d/entity @conn (:db/id page))
          recycle' (d/entity @conn (:db/id recycle))]
      (is (true? (ldb/page? recycle')))
      (is (contains? (set (map :db/ident (:block/tags recycle'))) :logseq.class/Page))
      (is (true? (ldb/recycled? page')))
      (is (= (:db/id recycle') (:db/id (:block/parent page')))))))

(deftest delete-class-page-hard-retracts-page-tree
  (let [conn (db-test/create-conn-with-blocks {:classes {:Movie {}}})
        class-page (ldb/get-page @conn "Movie")
        child-uuid (random-uuid)
        _ (d/transact! conn [{:block/uuid child-uuid
                              :block/title "class child"
                              :block/page (:db/id class-page)
                              :block/parent (:db/id class-page)
                              :block/order (db-order/gen-key)}])]
    (outliner-page/delete! conn (:block/uuid class-page))
    (is (nil? (d/entity @conn [:block/uuid (:block/uuid class-page)])))
    (is (nil? (d/entity @conn [:block/uuid child-uuid])))))

(deftest delete-property-page-hard-retracts-page-tree
  (let [conn (db-test/create-conn-with-blocks {:properties {:rating {:logseq.property/type :number}}})
        property-page (d/entity @conn :user.property/rating)
        child-uuid (random-uuid)
        _ (d/transact! conn [{:block/uuid child-uuid
                              :block/title "property child"
                              :block/page (:db/id property-page)
                              :block/parent (:db/id property-page)
                              :block/order (db-order/gen-key)}])]
    (outliner-page/delete! conn (:block/uuid property-page))
    (is (nil? (d/entity @conn :user.property/rating)))
    (is (nil? (d/entity @conn [:block/uuid child-uuid])))))

(deftest create-journal
  (let [conn (db-test/create-conn)
        [_ page-uuid] (outliner-page/create! conn "Dec 16th, 2024" {})]

    (is (= "Dec 16th, 2024" (:block/title (d/entity @conn [:block/uuid page-uuid])))
        "Journal created correctly")

    (is (= [:logseq.class/Journal]
           (->> (d/entity @conn [:block/uuid page-uuid])
                :block/tags
                (map #(:db/ident (d/entity @conn (:db/id %))))))
        "New journal only has Journal tag")))

(deftest create-journal-keeps-default-block-name-with-custom-title-format
  (let [conn (db-test/create-conn)
        _ (d/transact! conn [[:db/add :logseq.class/Journal :logseq.property.journal/title-format "yyyy-MM-dd EEEE"]])
        [_ page-uuid] (outliner-page/create! conn "Dec 16th, 2024" {})
        page (d/entity @conn [:block/uuid page-uuid])
        default-name (-> (:block/journal-day page)
                         (date-time-util/int->journal-title date-time-util/default-journal-title-formatter)
                         common-util/page-name-sanity-lc)]
    (is (= "2024-12-16 Monday" (:block/title page))
        "Journal title follows configured formatter")
    (is (= default-name (:block/name page))
        "Journal block/name remains the default formatter, independent of title format")))

(deftest create-slash-formatted-journal-does-not-create-namespace-pages
  (let [conn (db-test/create-conn)
        _ (d/transact! conn [[:db/add :logseq.class/Journal :logseq.property.journal/title-format "yyyy/MM/dd"]])
        [_ page-uuid] (outliner-page/create! conn "May 18th, 2026" {:split-namespace? true
                                                                    :journal? true})
        page (d/entity @conn [:block/uuid page-uuid])]
    (is (= "2026/05/18" (:block/title page))
        "Journal title follows slash title format")
    (is (= (common-uuid/gen-uuid :journal-page-uuid 20260518) (:block/uuid page))
        "Journal page has the standard journal uuid")
    (is (nil? (ldb/get-page @conn "2026"))
        "Journal title is not split into a year namespace page")
    (is (nil? (ldb/get-page @conn "05"))
        "Journal title is not split into a month namespace page")
    (is (nil? (ldb/get-page @conn "18"))
        "Journal title is not split into a day namespace page")))
