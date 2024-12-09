(ns frontend.worker.handler.page.db-based.page-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.db :as ldb]
            [frontend.worker.handler.page.db-based.page :as worker-db-page]))

(deftest create-class
  (let [conn (db-test/create-conn)
        _ (worker-db-page/create! conn "movie" {:class? true})
        _ (worker-db-page/create! conn "Movie" {:class? true})
        movie-class (->> (d/q '[:find [(pull ?b [*]) ...] :in $ ?title :where [?b :block/title ?title]]
                              @conn "movie")
                         first)
        Movie-class (->> (d/q '[:find [(pull ?b [*]) ...] :in $ ?title :where [?b :block/title ?title]]
                              @conn "Movie")
                         first)]

    (is (ldb/class? movie-class) "Creates a class")
    (is (ldb/class? Movie-class) "Creates another class with a different case sensitive name")
    (is (not= movie-class Movie-class) "The two classes are not the same")))

(deftest create-namespace-pages
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:property1 {:block/schema {:type :default}}}
               :classes {:class1 {}}
               :pages-and-blocks [{:page {:block/title "page1"}}]})]

    (testing "Basic valid workflows"
      (let [[_ child-uuid] (worker-db-page/create! conn "foo/bar/baz" {:split-namespace? true})
            child-page (d/entity @conn [:block/uuid child-uuid])
            ;; Create a 2nd child page using existing parent pages
            [_ child-uuid2] (worker-db-page/create! conn "foo/bar/baz2" {:split-namespace? true})
            child-page2 (d/entity @conn [:block/uuid child-uuid2])
            ;; Create a child page for a class
            [_ child-uuid3] (worker-db-page/create! conn "c1/c2" {:split-namespace? true :class? true})
            child-page3 (d/entity @conn [:block/uuid child-uuid3])]
        (is (= ["foo" "bar"] (map :block/title (ldb/get-page-parents child-page)))
            "Child page with new parent has correct parents")
        (is (= (map :block/uuid (ldb/get-page-parents child-page))
               (map :block/uuid (ldb/get-page-parents child-page2)))
            "Child page with existing parents has correct parents")
        (is (= ["Root Tag" "c1"] (map :block/title (ldb/get-classes-parents [child-page3])))
            "Child class with new parent has correct parents")

        (worker-db-page/create! conn "foo/class1/baz3" {:split-namespace? true})
        (is (= #{"Class" "Page"}
               (set (d/q '[:find [?tag-title ...]
                           :where
                           [?b :block/title "class1"]
                           [?b :block/tags ?t]
                           [?t :block/title ?tag-title]] @conn)))
            "Using an existing class page in a multi-parent namespace doesn't allow a page to have a class parent and instead creates a new page")))

    (testing "Child pages with same name and different parents"
      (let [_ (worker-db-page/create! conn "vim/keys" {:split-namespace? true})
            _ (worker-db-page/create! conn "emacs/keys" {:split-namespace? true})]
        (is (= #{"vim" "emacs"}
               (->> (d/q '[:find [(pull ?b [{:logseq.property/parent [:block/title]}]) ...] :where [?b :block/title "keys"]] @conn)
                    (map #(get-in % [:logseq.property/parent :block/title]))
                    set))
            "Two child pages with same name exist and have different parents")))

    (testing "Invalid workflows"
      (is (thrown-with-msg?
           js/Error
           #"Cannot create"
           (worker-db-page/create! conn "class1/page" {:split-namespace? true}))
          "Page can't have a class parent")
      (is (thrown-with-msg?
           js/Error
           #"Cannot create"
           (worker-db-page/create! conn "property1/page" {:split-namespace? true}))
          "Page can't have a property parent")
      (is (thrown-with-msg?
           js/Error
           #"Cannot create"
           (worker-db-page/create! conn "property1/class" {:split-namespace? true :class? true}))
          "Class can't have a property parent"))))

(deftest create-page
  (let [conn (db-test/create-conn)
        [_ page-uuid] (worker-db-page/create! conn "fooz" {})]
    (is (= "fooz" (:block/title (d/entity @conn [:block/uuid page-uuid])))
        "Valid page created")

    (is (thrown-with-msg?
         js/Error
         #"can't include \"/"
         (worker-db-page/create! conn "foo/bar" {}))
        "Page can't have '/'n title")))
