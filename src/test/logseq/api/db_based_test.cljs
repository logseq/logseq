(ns logseq.api.db-based-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [clojure.string :as string]
            [frontend.db.conn :as conn]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [logseq.api.db-based :as db-based-api]
            [logseq.api.editor :as api-editor]
            [logseq.api.test-helper :as api-test]
            [logseq.db :as ldb]
            [logseq.outliner.property :as outliner-property]
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

(deftest create-tag-accepts-custom-uuid
  (async done
    (let [custom-uuid "11111111-1111-4111-8111-111111111111"]
      (-> (api-test/with-plugin-api
            (fn []
              (p/let [tag (db-based-api/create-tag "UuidTag" #js {:uuid custom-uuid})
                      missing (db-based-api/get-property "missing-prop")]
                (is (= custom-uuid (:uuid (api-test/js->clj-kw tag))))
                (is (nil? missing)))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest create-tag-ignores-non-string-uuid
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [tag (db-based-api/create-tag "NilUuidTag" #js {:uuid nil})]
              (is (string? (:uuid (api-test/js->clj-kw tag)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-tag-objects-rejects-non-tag
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Not A Tag"}
       :blocks [{:block/title "plain"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (-> (db-based-api/get-tag-objects "Not A Tag")
                (p/then (fn [_]
                          (is false "non-tag should throw")))
                (p/catch (fn [error]
                           (is (re-find #"Not a tag|Tag not exists" (str error))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest add-block-tag-rejects-missing-tag
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Need Tag"}
       :blocks [{:block/title "needs tag"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [block (test-helper/find-block-by-content "needs tag")]
              (-> (db-based-api/add-block-tag (:block/uuid block) "MissingTag")
                  (p/then (fn [_]
                            (is false "missing tag should throw")))
                  (p/catch (fn [error]
                             (is (re-find #"Not a tag" (str error)))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest add-property-value-choices
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [property (db-based-api/upsert-property "status" #js {:type "default" :cardinality "many"} nil)
                    property-id (or (aget property "id") (:id (api-test/js->clj-kw property)))]
              (p/with-redefs [db-property-handler/add-existing-values-to-closed-values!
                              (fn [id values]
                                (p/resolved {:property-id id :values values}))]
                (p/let [result (db-based-api/add-property-value-choices property-id #js ["todo" "doing"])]
                  (is (= property-id (:property-id result)))
                  (is (= ["todo" "doing"] (:values result))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest upsert-property-blank-name-is-nil
  (is (nil? (db-based-api/upsert-property "  " nil nil))))

(defn- property-ident-by-title
  [title ns-prefix]
  (some (fn [property]
          (when (and (= title (:block/title property))
                     (string/starts-with? (namespace (:db/ident property)) ns-prefix))
            (:db/ident property)))
        (ldb/get-all-properties (conn/get-db))))

(defn- property-written-value
  [value]
  (or (when (map? value)
        (or (:logseq.property/value value)
            (:block/title value)
            (:value value)))
      (when (and (object? value) (not (coll? value)))
        (or (aget value "value")
            (aget value ":logseq.property/value")))
      (:logseq.property/value value)
      value))

(defn- create-ui-property!
  [title schema]
  (let [created (outliner-property/upsert-property!
                 (conn/get-db (state/get-current-repo) false)
                 nil
                 schema
                 {:property-name title})
        ident (or (:db/ident created)
                  (property-ident-by-title title "user.property"))]
    (is (some? ident) (str "UI property should exist: " title))
    (is (= "user.property" (namespace ident)))
    ident))

(deftest api-writes-values-on-ui-property-by-ident
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "UI Ident Page"}
       :blocks [{:block/title "ident owner"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [user-ident (create-ui-property! "Priority" {:logseq.property/type :number})
                    block (test-helper/find-block-by-content "ident owner")
                    uuid' (str (:block/uuid block))
                    _ (api-editor/upsert_block_property uuid' (str user-ident) 7 nil)
                    fetched-property (db-based-api/get-property (str user-ident))
                    fetched-map (api-test/js->clj-kw fetched-property)
                    read-value (api-editor/get_block_property uuid' (str user-ident))
                    updated (test-helper/find-block-by-content "ident owner")
                    _ (api-editor/remove_block_property uuid' (str user-ident))
                    after-remove (test-helper/find-block-by-content "ident owner")]
              (is (= (str user-ident) (:ident fetched-map)))
              (is (= 7 (property-written-value (get updated user-ident))))
              (is (= 7 (property-written-value read-value)))
              (is (nil? (get after-remove user-ident))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest plugin-short-name-writes-stay-on-plugin-property
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Plugin Own Page"}
       :blocks [{:block/title "plugin owner"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [user-ident (create-ui-property! "Status" {:logseq.property/type :number})
                    block (test-helper/find-block-by-content "plugin owner")
                    uuid' (str (:block/uuid block))
                    _ (api-editor/upsert_block_property uuid' "Status" 42 nil)
                    fetched-property (db-based-api/get-property "Status")
                    fetched-map (api-test/js->clj-kw fetched-property)
                    updated (test-helper/find-block-by-content "plugin owner")]
              (is (= ":plugin.property._test_plugin/Status" (:ident fetched-map)))
              (is (= 42 (property-written-value (get updated :plugin.property._test_plugin/Status))))
              (is (nil? (get updated user-ident))
                  "A short name must not write onto the UI-owned property"))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest plugin-schema-upsert-of-ui-property-is-rejected
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [user-ident (create-ui-property! "Status" {:logseq.property/type :number})]
              (let [original-property (some #(when (= user-ident (:db/ident %)) %)
                                            (ldb/get-all-properties (conn/get-db)))]
                (-> (db-based-api/upsert-property (str user-ident) #js {:type "string" :cardinality "many"} nil)
                    (p/then (fn [_]
                              (is false "schema upsert of a UI property should throw")))
                    (p/catch (fn [error]
                               (is (re-find #"Plugins can only upsert its own properties" (str error)))
                               (let [after (some #(when (= user-ident (:db/ident %)) %)
                                                 (ldb/get-all-properties (conn/get-db)))]
                                 (is (= (:logseq.property/type original-property)
                                        (:logseq.property/type after)))
                                 (is (= (:db/cardinality original-property)
                                        (:db/cardinality after)))))))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
