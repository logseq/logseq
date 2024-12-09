(ns logseq.outliner.validate-test
  (:require [cljs.test :refer [deftest is are testing]]
            [datascript.core :as d]
            [logseq.outliner.validate :as outliner-validate]
            [logseq.db.test.helper :as db-test]))

(defn- find-block-by-content [conn content]
  (->> content
       (d/q '[:find [(pull ?b [* {:block/tags [:db/id :block/title :db/ident]}]) ...]
              :in $ ?content
              :where [?b :block/title ?content] [(missing? $ ?b :logseq.property/built-in?)]]
            @conn)
       first))

(deftest validate-block-title-unique-for-properties
  (let [conn (db-test/create-conn-with-blocks
              ;; use a property name that's same as built-in
              {:properties {:background-image {:block/schema {:type :default}}}})]

    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "background-color"
          (assoc (find-block-by-content conn "background-image") :db/id 10000)))
        "Allow user property to have same name as built-in property")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "background-image"
          (assoc (find-block-by-content conn "background-image") :db/id 10000)))
        "Disallow duplicate user property")))

(deftest validate-block-title-unique-for-pages
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}
               {:page {:block/title "Apple" :build/tags [:Company]}}
               {:page {:block/title "Banana" :build/tags [:Fruit]}}])]

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Apple"
          (assoc (find-block-by-content conn "Apple") :db/id 10000)))
        "Disallow duplicate page with tag")
    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Apple"
          (find-block-by-content conn "Banana")))
        "Allow page with same name for different tag")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page"
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "page1"
          (assoc (find-block-by-content conn "page1") :db/id 10000)))
        "Disallow duplicate page without tag")

    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Apple"
          (find-block-by-content conn "Fruit")))
        "Allow class to have same name as a page")))

(deftest validate-parent-property
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:prop1 {:block/schema {:type :default}}}
               :classes {:Class1 {} :Class2 {}}
               :pages-and-blocks
               [{:page {:block/title "page1"}}
                {:page {:block/title "page2"}}]})
        page1 (find-block-by-content conn "page1")
        page2 (find-block-by-content conn "page2")
        class1 (find-block-by-content conn "Class1")
        class2 (find-block-by-content conn "Class2")
        property (find-block-by-content conn "prop1")]

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
        property class1))))

;; Try as many of the validations against a new graph to confirm
;; that validations make sense and are valid for a new graph
(deftest new-graph-should-be-valid
  (let [conn (db-test/create-conn)]

    (testing "Validate pages"
      (let [pages (->> (d/q '[:find [?b ...] :where
                              [?b :block/title]
                              (or [?b :block/tags :logseq.class/Tag]
                                  [?b :block/tags :logseq.class/Property]
                                  [?b :block/tags :logseq.class/Page]
                                  [?b :block/tags :logseq.class/Journal]
                                  [?b :block/tags :logseq.class/Whiteboard])] @conn)
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
            (is (nil? (outliner-validate/validate-parent-property parent [child]))
                (str "Parent and child page is valid: " (pr-str (:block/title parent)) " " (pr-str (:block/title child))))))))))
