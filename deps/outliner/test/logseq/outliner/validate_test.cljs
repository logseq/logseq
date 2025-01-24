(ns logseq.outliner.validate-test
  (:require [cljs.test :refer [are deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.validate :as outliner-validate]))

(deftest validate-block-title-unique-for-properties
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:color {:logseq.property/type :default}
                            :color2 {:logseq.property/type :default}}})]

    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          (:block/title (d/entity @conn :logseq.property/background-color))
          (d/entity @conn :user.property/color)))
        "Allow user property to have same name as built-in property")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "color"
          (d/entity @conn :user.property/color2)))
        "Disallow duplicate user property")))

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
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Apple"
          (db-test/find-page-by-title @conn "Another Company")))
        "Disallow duplicate page with tag")
    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Apple"
          (db-test/find-page-by-title @conn "Banana")))
        "Allow page with same name for different tag")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "page1"
          (db-test/find-page-by-title @conn "another page")))
        "Disallow duplicate page without tag")

    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Apple"
          (db-test/find-page-by-title @conn "Fruit")))
        "Allow class to have same name as a page")))

(deftest validate-parent-property
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:prop1 {:logseq.property/type :default}}
               :classes {:Class1 {} :Class2 {}}
               :pages-and-blocks
               [{:page {:block/title "page1"}}
                {:page {:block/title "page2"}}]})
        page1 (db-test/find-page-by-title @conn "page1")
        page2 (db-test/find-page-by-title @conn "page2")
        class1 (db-test/find-page-by-title @conn "Class1")
        class2 (db-test/find-page-by-title @conn "Class2")
        property (db-test/find-page-by-title @conn "prop1")]

    (testing "valid parent and child combinations"
      (is (nil? (outliner-validate/validate-parent-property page1 [page2]))
          "parent page to child page is valid")
      (is (nil? (outliner-validate/validate-parent-property class1 [class2]))
          "parent class to child class is valid"))

    (testing "invalid parent and child combinations"
      (are [parent child]
           (thrown-with-msg?
            js/Error
            #"Can't set"
            (outliner-validate/validate-parent-property parent [child]))

        class1 page1
        page1 class1
        property page1
        property class1))

    (testing "built-in tag can't have parent changed"
      (is (thrown-with-msg?
           js/Error
           #"Can't change.*built-in"
           (outliner-validate/validate-parent-property (entity-plus/entity-memoized @conn :logseq.class/Task)
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
         (outliner-validate/validate-tags-property @conn [(:db/id block)] :logseq.task/priority))
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
            (outliner-validate/validate-unique-by-name-tag-and-block-type @conn (:block/title page) page)
            (outliner-validate/validate-page-title (:block/title page) {:node page})
            (outliner-validate/validate-page-title-characters (:block/title page) {:node page})

            (catch :default e
              (if (= :notification (:type (ex-data e)))
                (swap! page-errors update (select-keys page [:block/title :db/ident :block/uuid]) (fnil conj []) e)
                (throw e)))))
        (is (= {} @page-errors)
            "Default pages shouldn't have any validation errors")))

    (testing "Validate property relationships"
      (let [parent-child-pairs (d/q '[:find ?parent ?child
                                      :where [?child :logseq.property/parent ?parent]] @conn)]
        (doseq [[parent-id child-id] parent-child-pairs]
          (let [parent (d/entity @conn parent-id)
                child (d/entity @conn child-id)]
            (is (nil? (#'outliner-validate/validate-parent-property-have-same-type parent [child]))
                (str "Parent and child page is valid: " (pr-str (:block/title parent)) " " (pr-str (:block/title child))))))))))
