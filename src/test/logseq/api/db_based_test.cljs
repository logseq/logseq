(ns logseq.api.db-based-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.test.helper :as test-helper]
            [logseq.api.db-based :as db-based-api]
            [logseq.api.test-helper :as api-test]
            [promesa.core :as p]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(deftest cardinality-and-schema-validation
  (is (= :db.cardinality/one (db-based-api/->cardinality "one")))
  (is (= :db.cardinality/many (db-based-api/->cardinality "many")))
  (is (thrown-with-msg?
       js/Error
       #"Invalid cardinality"
       (db-based-api/->cardinality "sometimes")))
  (#'db-based-api/schema-type-check! :number)
  (is (thrown-with-msg?
       js/Error
       #"Invalid type"
       (#'db-based-api/schema-type-check! :color))))

(deftest property-upsert-get-and-remove
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [created (db-based-api/upsert-property "score" #js {:type "number" :cardinality "one"} nil)
                    created-map (api-test/js->clj-kw created)
                    fetched (db-based-api/get-property "score")
                    fetched-map (api-test/js->clj-kw fetched)
                    _ (db-based-api/remove-property "score")
                    removed (db-based-api/get-property "score")]
              (is (= ":plugin.property._test_plugin/score" (:ident created-map)))
              (is (= "number" (or (:type created-map)
                                  (get created-map (keyword ":logseq.property/type")))))
              (is (= (:uuid created-map) (:uuid fetched-map)))
              (is (nil? removed)))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-and-lookup-tags
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [tag (db-based-api/create-tag "Book" nil)
                    tag-map (api-test/js->clj-kw tag)
                    by-title (db-based-api/get-tag "Book")
                    by-ident (db-based-api/get-tag ":plugin.class._test_plugin/Book")
                    by-uuid (db-based-api/get-tag (:uuid tag-map))
                    by-name (db-based-api/get-tags-by-name "book")]
              (is (= ":plugin.class._test_plugin/Book" (:ident tag-map)))
              (is (= (:uuid tag-map) (:uuid (api-test/js->clj-kw by-title))))
              (is (= "Book" (:title (api-test/js->clj-kw by-ident))))
              (is (= "Book" (:title (api-test/js->clj-kw by-uuid))))
              (is (= 1 (count (api-test/js->clj-kw by-name)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest create-tag-rejects-invalid-titles
  (is (thrown-with-msg? js/Error #"Tag title should be a string"
                        (db-based-api/create-tag 1 nil)))
  (is (thrown-with-msg? js/Error #"Tag title shouldn't be empty"
                        (db-based-api/create-tag "  " nil)))
  (is (thrown-with-msg? js/Error #"forward slash"
                        (db-based-api/create-tag "ns/tag" nil))))

(deftest tag-extends-and-block-tags
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Tagged Page"}
       :blocks [{:block/title "tagged block"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [parent (db-based-api/create-tag "ParentTag" nil)
                    child (db-based-api/create-tag "ChildTag" nil)
                    parent-id (aget parent "id")
                    child-id (aget child "id")
                    _ (db-based-api/add-tag-extends child-id parent-id)
                    child-after (db-based-api/get-tag child-id)
                    block (test-helper/find-block-by-content "tagged block")
                    _ (db-based-api/add-block-tag (:block/uuid block) "ChildTag")
                    objects (db-based-api/get-tag-objects "ChildTag")
                    _ (db-based-api/remove-block-tag (:block/uuid block) "ChildTag")
                    objects-after (db-based-api/get-tag-objects "ChildTag")
                    _ (db-based-api/remove-tag-extends child-id parent-id)
                    child-removed (db-based-api/get-tag child-id)]
              (is (= [parent-id] (js->clj (aget child-after ":logseq.property.class/extends"))))
              (is (= 1 (count (api-test/js->clj-kw objects))))
              (is (zero? (count (api-test/js->clj-kw objects-after))))
              (is (not= [parent-id] (js->clj (aget child-removed ":logseq.property.class/extends")))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest tag-properties-and-node-tags
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [tag (db-based-api/create-tag "HasProps" nil)
                    property (db-based-api/upsert-property "isbn" #js {:type "default"} nil)
                    tag-id (aget tag "uuid")
                    _ (db-based-api/tag-add-property tag-id "isbn")
                    with-prop (db-based-api/get-tag tag-id)
                    _ (db-based-api/tag-remove-property tag-id (aget property "uuid"))
                    without-prop (db-based-api/get-tag tag-id)
                    _ (db-based-api/set-property-node-tags
                       (aget property "uuid")
                       #js [(aget tag "id")])
                    property-after (db-based-api/get-property "isbn")]
              (is (seq (aget with-prop ":logseq.property.class/properties")))
              (is (empty? (or (aget without-prop ":logseq.property.class/properties") #js [])))
              (is (= [(aget tag "id")]
                     (js->clj (aget property-after ":logseq.property/classes")))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest block-icon-set-and-remove
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Icon Page"}
       :blocks [{:block/title "icon owner"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [block (test-helper/find-block-by-content "icon owner")
                    _ (db-based-api/set-block-icon (:block/uuid block) "tabler-icon" "book")
                    with-icon (test-helper/find-block-by-content "icon owner")
                    _ (db-based-api/remove-block-icon (:block/uuid block))
                    without-icon (test-helper/find-block-by-content "icon owner")]
              (is (= :tabler-icon (get-in with-icon [:logseq.property/icon :type])))
              (is (= "book" (get-in with-icon [:logseq.property/icon :id])))
              (is (nil? (:logseq.property/icon without-icon))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest set-block-icon-validates-inputs
  (is (thrown-with-msg? js/Error #"icon-type should be one of"
                        (db-based-api/set-block-icon 1 "unknown" "book")))
  (is (thrown-with-msg? js/Error #"icon-name should be a non-blank string"
                        (db-based-api/set-block-icon 1 "emoji" "  ")))
  (is (thrown-with-msg? js/Error #"Can't find emoji"
                        (db-based-api/set-block-icon 1 "emoji" "not-an-emoji"))))

(deftest get-all-tags-and-properties-include-created-entities
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [_ (db-based-api/create-tag "ListedTag" nil)
                    _ (db-based-api/upsert-property "listed-prop" nil nil)
                    tags (db-based-api/get-all-tags)
                    properties (db-based-api/get-all-properties)
                    tag-idents (set (map :ident (api-test/js->clj-kw tags)))
                    property-idents (set (map :ident (api-test/js->clj-kw properties)))]
              (is (contains? tag-idents ":plugin.class._test_plugin/ListedTag"))
              (is (contains? property-idents ":plugin.property._test_plugin/listed-prop")))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
