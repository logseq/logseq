(ns logseq.outliner.validate-test
  (:require [cljs.test :refer [are deftest is testing]]
            [datascript.core :as d]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.test.helper :as db-test]
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
        "Disallow duplicate class names, regardless of extends")
    (is (thrown-with-msg?
         js/Error
         #"Duplicate class"
         (outliner-validate/validate-unique-by-name-and-tags
          @conn
          "Card"
          (d/entity @conn :user.class/Class1)))
        "Disallow duplicate class names even if it's built-in")))

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
                        :block/parent [:block/uuid #uuid "3aa1e950-5a9b-4efc-81d4-b6d89a504591"]}}]
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
        "Allow namespace child if unique")))

(deftest validate-block-title-unique-for-pages
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}
               {:page {:block/title "another page"}}
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
        "Allow class to have same name as a page")))

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
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:SomeTag {}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "block"}]}]})
        block (db-test/find-block-by-content @conn "block")]

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
         #"Can't set tag.*Page"
         (outliner-validate/validate-tags-property @conn [(:db/id block)] :logseq.class/Page))
        "Nodes can't be tagged with built-in private tags")

    (is (thrown-with-msg?
         js/Error
         #"Can't set tag.*Priority"
         (outliner-validate/validate-tags-property @conn [(:db/id block)] :logseq.property/priority))
        "Nodes can't be tagged with built-in non tags")))

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
