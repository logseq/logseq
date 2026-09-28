(ns logseq.outliner.validate-test
  (:require [cljs.test :refer [are deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.validate :as outliner-validate]))

(deftest validate-block-title-unique-for-properties
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:color {:logseq.property/type :default}
                            :color2 {:logseq.property/type :default}}})]

    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          (:block/title (d/entity @conn :logseq.property/background-color))
          (d/entity @conn :user.property/color)))
        "Allow user property to have same name as built-in property")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate property"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "color"
          (d/entity @conn :user.property/color2)))
        "Disallow duplicate user property")))

(deftest validate-block-title-unique-for-tags
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Class1 {}
                         :Class2 {:logseq.property.class/extends :logseq.class/Task}}})]

    (is (thrown-with-msg?
         js/Error
         #"Duplicate class"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "Class1"
          (d/entity @conn :user.class/Class2)))
        "Disallow duplicate top-level class names; built-in extends are not a namespace parent")
    (is (thrown-with-msg?
         js/Error
         #"Duplicate class"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "Card"
          (d/entity @conn :user.class/Class1)))
        "Disallow duplicate class names even if it's built-in")
    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "class1"
          (d/entity @conn :user.class/Class2)))
        "Allow a class to use a case variant of another class name")))

(deftest validate-block-title-unique-for-namespaced-pages
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Library"
                        :block/uuid #uuid "d246c71a-3e71-42f0-928f-afe607ee5ce0"
                        :build/keep-uuid? true
                        :build/properties {:logseq.property/built-in? true}}}
                {:page {:block/title "n1"
                        :block/uuid #uuid "3aa1e950-5a9b-4efc-81d4-b6d89a504591"
                        :build/keep-uuid? true
                        :block/parent [:block/uuid #uuid "d246c71a-3e71-42f0-928f-afe607ee5ce0"]}}
                {:page {:block/title "n2"
                        :block/parent [:block/uuid #uuid "3aa1e950-5a9b-4efc-81d4-b6d89a504591"]}}
                {:page {:block/title "n3"
                        :block/parent [:block/uuid #uuid "3aa1e950-5a9b-4efc-81d4-b6d89a504591"]}}
                {:page {:block/title "other"
                        :block/parent [:block/uuid #uuid "d246c71a-3e71-42f0-928f-afe607ee5ce0"]}}
                {:page {:block/title "Foo"}}]
               :build-existing-tx? true})]

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "n2"
          (db-test/find-page-by-title @conn "n3")))
        "Disallow duplicate namespace child")

    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "n4"
          (db-test/find-page-by-title @conn "n3")))
        "Allow namespace child if unique")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "N2"
          (db-test/find-page-by-title @conn "n3")))
        "Disallow renaming a namespace child to a case variant of a sibling")

    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "Other"
          (db-test/find-page-by-title @conn "n3")))
        "Allow a namespace child to share a case-insensitive name with a different-parent page")

    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "foo"
          (db-test/find-page-by-title @conn "n3")))
        "Allow a namespace child to share a case-insensitive name with a top-level page")

    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "N2"
          (db-test/find-page-by-title @conn "Foo")))
        "Allow a top-level page to share a case-insensitive name with a namespaced page")))

(deftest validate-block-title-unique-for-pages
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}
               {:page {:block/title "another page"}}
               {:page {:block/title "Foo"}}
               {:page {:block/title "Apple" :build/tags [:Company]}}
               {:page {:block/title "Another Company" :build/tags [:Company]}}
               {:page {:block/title "Banana" :build/tags [:Fruit]}}])]

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "Apple"
          (db-test/find-page-by-title @conn "Another Company")))
        "Disallow duplicate page with tag")
    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "Apple"
          (db-test/find-page-by-title @conn "Banana")))
        "Allow page with same name for different tag")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "page1"
          (db-test/find-page-by-title @conn "another page")))
        "Disallow duplicate page without tag")

    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "Apple"
          (db-test/find-page-by-title @conn "Fruit")))
        "Allow class to have same name as a page")

    (try
      (outliner-validate/validate-unique-by-name-and-tags
       @conn
       "foo"
       (db-test/find-page-by-title @conn "another page"))
      (is false "expected a duplicate-name notification")
      (catch :default e
        (is (re-find #"Duplicate page" (ex-message e))
            "Disallow renaming to a case variant of another top-level page")
        (is (= :page.validation/duplicate-name (get-in (ex-data e) [:payload :i18n-key])))
        (is (= "Another page named \"foo\" already exists."
               (get-in (ex-data e) [:payload :message])))))

    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "PAGE1"
          (db-test/find-page-by-title @conn "page1")))
        "Allow renaming a page to a case variant of its own title")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "apple"
          (db-test/find-page-by-title @conn "Another Company")))
        "Disallow renaming to a case variant of another page with the same tag")

    (is (nil?
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "apple"
          (db-test/find-page-by-title @conn "Banana")))
        "Allow a case variant of the same name for a different tag")))

(deftest validate-block-title-unique-checks-all-candidates
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Foo" :build/tags [:Company]}}
               {:page {:block/title "foo" :build/tags [:Fruit]}}
               {:page {:block/title "Bar" :build/tags [:Fruit]}}])]
    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "FOO"
          (db-test/find-page-by-title @conn "Bar")))
        "Disallow rename when any candidate collides, even if an exempt candidate is checked first")))

(deftest validate-block-title-unique-for-top-level-and-namespaced-pages
  (testing "Rename there and back is allowed when a namespaced page shares the title"
    (let [conn (db-test/create-conn)
          [_ baz-uuid] (outliner-page/create! conn "Baz" {})
          _ (outliner-page/create! conn "Foo/Baz" {:split-namespace? true})
          baz (d/entity @conn [:block/uuid baz-uuid])
          foo-baz (->> (d/q '[:find [?e ...] :where [?e :block/title "Baz"]] @conn)
                       (map #(d/entity @conn %))
                       (remove #(= baz-uuid (:block/uuid %)))
                       first)]
      (is (some? foo-baz))
      (is (nil? (:block/parent baz))
          "Standalone Baz has no parent")
      (is (some? (:block/parent foo-baz))
          "Foo/Baz is nested")
      (is (nil? (outliner-validate/validate-unique-by-name-and-tags @conn "Qux" baz)))
      (outliner-core/save-block! conn {:block/uuid baz-uuid :block/title "Qux"})
      (is (nil? (outliner-validate/validate-unique-by-name-and-tags
                 @conn "Baz" (d/entity @conn [:block/uuid baz-uuid])))
          "Restoring top-level Baz must not collide with Foo/Baz")
      (outliner-core/save-block! conn {:block/uuid baz-uuid :block/title "Baz"})
      (is (= "Baz" (:block/title (d/entity @conn [:block/uuid baz-uuid]))))
      (is (= 2 (count (d/q '[:find [?e ...] :where [?e :block/title "Baz"]] @conn))))))

  (testing "Renaming a Library namespace root to a top-level title is refused"
    (let [conn (db-test/create-conn)
          [_ baz-uuid] (outliner-page/create! conn "Baz" {})
          _ (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})
          foo (ldb/get-page @conn "Foo")
          library (ldb/get-library-page @conn)]
      (is (= (:db/id library) (:db/id (:block/parent foo)))
          "Namespace root Foo lives under Library")
      (is (thrown-with-msg?
           js/Error
           #"Duplicate page"
           (outliner-validate/validate-unique-by-name-and-tags @conn "Baz" foo))
          "Foo cannot take the top-level Baz title")
      (is (thrown-with-msg?
           js/Error
           #"Duplicate page"
           (outliner-core/save-block! conn {:block/uuid (:block/uuid foo) :block/title "Baz"})))
      (is (= "Foo" (:block/title (d/entity @conn (:db/id foo)))))
      (is (= 1 (count (filter ldb/internal-page?
                              (map #(d/entity @conn %)
                                   (d/q '[:find [?e ...] :where [?e :block/title "Baz"]] @conn)))))
          "Still exactly one live page titled Baz"))))

(deftest validate-block-title-unique-for-namespaced-tags
  (testing "Rename there and back is allowed when a namespaced tag shares the title"
    (let [conn (db-test/create-conn)
          [_ foo-uuid] (outliner-page/create! conn "Foo" {:class? true})
          _ (outliner-page/create! conn "Bar/Foo" {:class? true :split-namespace? true})
          foo (d/entity @conn [:block/uuid foo-uuid])]
      (is (ldb/class? foo))
      (outliner-core/save-block! conn {:block/uuid foo-uuid :block/title "Qux"})
      (is (nil? (outliner-validate/validate-unique-by-name-and-tags
                 @conn "Foo" (d/entity @conn [:block/uuid foo-uuid])))
          "Restoring top-level #Foo must not collide with #Bar/Foo")
      (outliner-core/save-block! conn {:block/uuid foo-uuid :block/title "Foo"})
      (is (= "Foo" (:block/title (d/entity @conn [:block/uuid foo-uuid]))))
      (is (= 2 (count (filter ldb/class?
                              (map #(d/entity @conn %)
                                   (d/q '[:find [?e ...] :where [?e :block/title "Foo"]] @conn))))))))

  (testing "Renaming a top-level tag to another top-level tag title is refused"
    (let [conn (db-test/create-conn)
          [_ _foo-uuid] (outliner-page/create! conn "Foo" {:class? true})
          [_ bar-uuid] (outliner-page/create! conn "Bar" {:class? true})]
      (is (thrown-with-msg?
           js/Error
           #"Duplicate class"
           (outliner-validate/validate-unique-by-name-and-tags
            @conn "Foo" (d/entity @conn [:block/uuid bar-uuid]))))
      (is (thrown-with-msg?
           js/Error
           #"Duplicate class"
           (outliner-core/save-block! conn {:block/uuid bar-uuid :block/title "Foo"})))
      (is (= "Bar" (:block/title (d/entity @conn [:block/uuid bar-uuid]))))))

  (testing "Namespaced tags under the same parent cannot share a title"
    (let [conn (db-test/create-conn)
          _ (outliner-page/create! conn "Bar/Baz" {:class? true :split-namespace? true})
          [_ qux-uuid] (outliner-page/create! conn "Bar/Qux" {:class? true :split-namespace? true})]
      (is (thrown-with-msg?
           js/Error
           #"Duplicate class"
           (outliner-validate/validate-unique-by-name-and-tags
            @conn "Baz" (d/entity @conn [:block/uuid qux-uuid])))))))

(deftest validate-extends-property
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:prop1 {:logseq.property/type :default}}
               :classes {:Class1 {} :Class2 {}}
               :pages-and-blocks
               [{:page {:block/title "page1"}}
                {:page {:block/title "page2"}}]})
        page1 (db-test/find-page-by-title @conn "page1")
        class1 (db-test/find-page-by-title @conn "Class1")
        class2 (db-test/find-page-by-title @conn "Class2")
        property (db-test/find-page-by-title @conn "prop1")
        db @conn]

    (testing "valid parent and child combinations"
      (is (nil? (outliner-validate/validate-extends-property db class1 [class2]))
          "parent class to child class is valid"))

    (testing "invalid parent and child combinations"
      (are [parent child]
           (thrown-with-msg?
            js/Error
            #"Can't extend"
            (outliner-validate/validate-extends-property db parent [child]))

        class1 page1
        page1 class1
        property class1))

    (testing "built-in tag can't have parent changed"
      (is (thrown-with-msg?
           js/Error
           #"Can't change.*built-in"
           (outliner-validate/validate-extends-property db
                                                        (entity-plus/entity-memoized @conn :logseq.class/Task)
                                                        [(entity-plus/entity-memoized @conn :logseq.class/Cards)]))))))

(deftest validate-tags-property
  (let [class-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:classes {:SomeTag {:block/uuid class-uuid :build/keep-uuid? true}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "block"
                           :build/children [{:block/title "block - invalid location"}]}
                          {:block/title "block / invalid title"}]}
                {:page {:block/uuid class-uuid}
                 :blocks [{:block/title "class block"}]}]
               :build-existing-tx? true})
        block (db-test/find-block-by-content @conn "block")
        block-invalid-title (db-test/find-block-by-content @conn #"invalid title")
        block-invalid-location (db-test/find-block-by-content @conn #"invalid location")]

    (is (thrown-with-msg?
         js/Error
         #"Can't add tag.*Tag"
         (outliner-validate/validate-tags-property @conn [:logseq.class/Tag] :user.class/SomeTag))
        "built-in tag must not be tagged by the user")

    (is (thrown-with-msg?
         js/Error
         #"Can't add tag.*Heading"
         (outliner-validate/validate-tags-property @conn [:logseq.property/heading] :user.class/SomeTag))
        "built-in property must not be tagged by the user")

    (is (thrown-with-msg?
         js/Error
         #"Can't add tag.*Contents"
         (outliner-validate/validate-tags-property @conn [(:db/id (db-test/find-page-by-title @conn "Contents"))] :user.class/SomeTag))
        "built-in page must not be tagged by the user")

    (is (thrown-with-msg?
         js/Error
         #"Can't set tag.*Tag"
         (outliner-validate/validate-tags-property @conn [(:db/id block)] :logseq.class/Tag))
        "Nodes can't be tagged with built-in private tags")

    (is (thrown-with-msg?
         js/Error
         #"Can't set tag.*Priority"
         (outliner-validate/validate-tags-property @conn [(:db/id block)] :logseq.property/priority))
        "Nodes can't be tagged with built-in non tags")

    (is (nil? (outliner-validate/validate-tags-property @conn [(:db/id block)] :logseq.class/Page))
        "Blocks can be tagged with #Page")

    (is (thrown-with-msg?
         js/Error
         #"Page name can't.*/"
         (outliner-validate/validate-tags-property @conn [(:db/id block-invalid-title)] :logseq.class/Page))
        "Block with invalid title can't be tagged with #Page")

    (is (thrown-with-msg?
         js/Error
         #"Can't convert this block to page"
         (outliner-validate/validate-tags-property @conn [(:db/id block-invalid-location)] :logseq.class/Page))
        "Block with invalid location can't be tagged with #Page")))

(deftest validate-tags-property-deletion
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:SomeTag {}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "block" :build/tags [:logseq.class/Page]}]}]})
        page (db-test/find-page-by-title @conn "page1")
        page-with-parent (db-test/find-block-by-content @conn "block")]

    (is (thrown-with-msg?
         js/Error
         #"Can't remove tag.*Task"
         (outliner-validate/validate-tags-property-deletion @conn [(:db/id (d/entity @conn :logseq.class/Task))] :logseq.class/Tag))
        "built-in class must not have tag deleted by the user")

    (is (thrown-with-msg?
         js/Error
         #"Can't remove tag.*Tag"
         (outliner-validate/validate-tags-property-deletion @conn [(:db/id (d/entity @conn :user.class/SomeTag))] :logseq.class/Tag))
        "Node can't have private tag deleted by user")

    (is (nil? (outliner-validate/validate-tags-property-deletion @conn [(:db/id page-with-parent)] :logseq.class/Page))
        "Page with parent can remove #Page")

    (is (thrown-with-msg?
         js/Error
         #"This page cannot be converted"
         (outliner-validate/validate-tags-property-deletion @conn [(:db/id page)] :logseq.class/Page))
        "Page without parent can't remove #Page")))

(deftest validate-editing-built-in-property
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:myprop {:logseq.property/type :default}}})
        user-prop (d/entity @conn :user.property/myprop)
        built-in-prop (d/entity @conn :block/tags)]

    (testing "user property can edit any attribute"
      (is (nil? (outliner-validate/validate-editing-built-in-property
                 user-prop {:db/cardinality :db.cardinality/many}))))

    (testing "built-in property cannot edit disallowed attribute"
      (is (thrown-with-msg?
           js/Error
           #"not editable"
           (outliner-validate/validate-editing-built-in-property
            built-in-prop {:block/title "renamed"}))))

    (testing "built-in property can edit allowed attribute"
      (is (nil? (outliner-validate/validate-editing-built-in-property
                 built-in-prop {:logseq.property/hide-empty-value true}))))))

;; Try as many of the validations against a new graph to confirm
;; that validations make sense and are valid for a new graph
(deftest new-graph-should-be-valid
  (let [conn (db-test/create-conn)]

    (testing "Validate pages"
      (let [pages (->> (d/q '[:find [?b ...] :where
                              [?b :block/title]
                              [?b :block/tags]] @conn)
                       (map (fn [id]
                              (d/entity @conn id))))
            page-errors (atom {})]
        (doseq [page pages]
          (try
            (outliner-validate/validate-unique-by-name-and-tags @conn (:block/title page) page)
            (outliner-validate/validate-page-title (:block/title page) {:node page})
            (outliner-validate/validate-page-title-characters (:block/title page) {:node page})
            (when (entity-util/property? page) (outliner-validate/validate-property-title (:block/title page)))
            (when (entity-util/class? page)
              (doseq [parent (:logseq.property.class/extends page)]
                (outliner-validate/validate-extends-property @conn parent [page] {:built-in? false})))

            (catch :default e
              (if (= :notification (:type (ex-data e)))
                (swap! page-errors update (select-keys page [:block/title :db/ident :block/uuid]) (fnil conj []) e)
                (throw e)))))
        (is (= {} @page-errors)
            "Default pages shouldn't have any validation errors")))

    (testing "Validate property relationships"
      (let [parent-child-pairs (d/q '[:find ?parent ?child
                                      :where [?child :logseq.property.class/extends ?parent]] @conn)]
        (doseq [[parent-id child-id] parent-child-pairs]
          (let [parent (d/entity @conn parent-id)
                child (d/entity @conn child-id)]
            (is (nil? (#'outliner-validate/validate-extends-property-have-correct-type parent [child]))
                (str "Parent and child page is valid: " (pr-str (:block/title parent)) " " (pr-str (:block/title child))))))))))

(deftest validate-page-to-property-conversion
  (testing "Plain pages can convert"
    (is (nil? (outliner-validate/validate-page-to-property-conversion
               {:block/title "Plain"
                :block/tags [{:db/ident :logseq.class/Page}]}))))

  (testing "Namespaced pages are refused"
    (let [err (try
                (outliner-validate/validate-page-to-property-conversion
                 {:block/title "Bar"
                  :block/parent {:db/id 1}
                  :block/tags [{:db/ident :logseq.class/Page}]})
                nil
                (catch :default e e))]
      (is (= :notification (:type (ex-data err))))
      (is (= :page.convert/page-to-property-namespaced
             (get-in (ex-data err) [:payload :i18n-key])))))

  (testing "Non-pages are ignored"
    (is (nil? (outliner-validate/validate-page-to-property-conversion
               {:block/title "Bar"
                :block/parent {:db/id 1}
                :block/tags [{:db/ident :logseq.class/Tag}]})))
    (is (nil? (outliner-validate/validate-page-to-property-conversion nil)))))
