(ns logseq.e2e.plugins-basic-test
  (:require
   [clojure.set :as set]
   [clojure.string :as string]
   [clojure.test :refer [deftest testing is use-fixtures]]
   [jsonista.core :as json]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.keyboard :as k]
   [logseq.e2e.page :as page]
   [logseq.e2e.util :as util]
   [wally.main :as w]
   [wally.repl :as repl]))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page)

(defn ->plugin-ident
  [property-name]
  (str ":plugin.property._test_plugin/" property-name))

(defn- to-snake-case
  "Converts a string to snake_case. Handles camelCase, PascalCase, spaces, hyphens, and existing underscores.
   Examples:
     'HelloWorld' -> 'hello_world'
     'Hello World' -> 'hello_world'
     'hello-world' -> 'hello_world'
     'Hello__World' -> 'hello_world'"
  [s]
  (when (string? s)
    (-> s
      ;; Normalize input: replace hyphens/spaces with underscores, collapse multiple underscores
        (clojure.string/replace #"[-\s]+" "_")
      ;; Split on uppercase letters (except at start) and join with underscore
        (clojure.string/replace #"(?<!^)([A-Z])" "_$1")
      ;; Remove redundant underscores and trim
        (clojure.string/replace #"_+" "_")
        (clojure.string/trim)
        ;; Convert to lowercase
        (clojure.string/lower-case))))

(defonce ^:private *property-idx (atom 0))
(defn- new-property
  []
  (str "p" (swap! *property-idx inc)))

(defn- ls-api-call!
  [tag & args]
  (let [tag (name tag)
        ns' (string/split tag #"\.")
        ns? (and (seq ns') (= (count ns') 2))
        inbuilt? (contains? #{"app" "editor"} (first ns'))
        ns1 (string/lower-case (if (and ns? (not inbuilt?))
                                 (str "sdk." (first ns')) "api"))
        name1 (if ns? (to-snake-case (last ns')) tag)
        estr (format "s => { const args = JSON.parse(s);const o=logseq.%1$s; return o['%2$s']?.apply(null, args || []); }" ns1 name1)
        args (json/write-value-as-string (vec args))]
    ;; (prn "Debug: eval-js #" estr args)
    (w/eval-js estr args)))

(defn- assert-api-ls-block!
  ([ret] (assert-api-ls-block! ret 1))
  ([ret-or-uuid count]
   (let [uuid' (or (get ret-or-uuid "uuid") ret-or-uuid)]
     (is (string? uuid'))
     (assert/assert-have-count (str "#ls-block-" uuid') count)
     uuid')))

(deftest editor-apis-test
  (testing "editor related apis"
    (page/new-page "test-block-apis")
    (ls-api-call! :ui.showMsg "hello world" "info")
    (let [ret (ls-api-call! :editor.appendBlockInPage "test-block-apis" "append-block-in-page-0")
          ret1 (ls-api-call! :editor.appendBlockInPage "append-block-in-current-page-0")
          uuid' (assert-api-ls-block! ret)]
      (assert-api-ls-block! ret1)
      (-> (ls-api-call! :editor.insertBlock uuid' "insert-0")
          (assert-api-ls-block!))
      (ls-api-call! :editor.updateBlock uuid' "append-but-updated-0")
      (k/esc)
      (w/wait-for ".block-title-wrap:text('append-but-updated-0')")
      (ls-api-call! :editor.removeBlock uuid')
      (assert-api-ls-block! uuid' 0))))

(deftest block-properties-test
  (testing "block properties related apis"
    (page/new-page "test-block-properties-apis")
    (let [ret (ls-api-call! :editor.appendBlockInPage "test-block-properties-apis" "block-in-page-0" {:properties {:p1 1}})
          uuid' (assert-api-ls-block! ret)
          prop1 (ls-api-call! :editor.getBlockProperty uuid' "p1")
          props1 (ls-api-call! :editor.getBlockProperties uuid' "p1")
          props2 (ls-api-call! :editor.getPageProperties "test-block-properties-apis")]
      (w/wait-for ".property-k:text('p1')")
      (is (= 1 (get prop1 "value")))
      (is (= (get prop1 "ident") ":plugin.property._test_plugin/p1"))
      (is (= 1 (get props1 ":plugin.property._test_plugin/p1")))
      (is (= ["Page"] (get props2 ":block/tags")))
      (ls-api-call! :editor.upsertBlockProperty uuid' "p2" "p2")
      (ls-api-call! :editor.upsertBlockProperty uuid' "p3" true)
      (ls-api-call! :editor.upsertBlockProperty uuid' "p4" {:a 1, :b [2, 3]})
      (let [prop2 (ls-api-call! :editor.getBlockProperty uuid' "p2")
            prop3 (ls-api-call! :editor.getBlockProperty uuid' "p3")
            prop4 (ls-api-call! :editor.getBlockProperty uuid' "p4")]
        (w/wait-for ".property-k:text('p2')")
        (is (= "p2" (get prop2 "value")))
        (is (true? prop3))
        (is (= prop4 {"a" 1, "b" [2 3]})))
      (ls-api-call! :editor.removeBlockProperty uuid' "p4")
      ;; wait for react re-render
      (util/wait-timeout 16)
      (is (nil? (w/find-one-by-text ".property-k" "p4")))
      (ls-api-call! :editor.upsertBlockProperty uuid' "p3" false)
      (ls-api-call! :editor.upsertBlockProperty uuid' "p2" "p2-updated")
      (w/wait-for ".block-title-wrap:text('p2-updated')")
      (let [props (ls-api-call! :editor.getBlockProperties uuid')]
        (is (= (get props ":plugin.property._test_plugin/p3") false))
        (is (= (get props ":plugin.property._test_plugin/p2") "p2-updated"))))))

(deftest property-upsert-test
  (testing "property with default settings"
    (let [p (new-property)]
      (ls-api-call! :editor.upsertProperty p)
      (let [property (ls-api-call! :editor.getProperty p)]
        (is (= "default" (get property "type")))
        (is (= ":db.cardinality/one" (get property "cardinality"))))))
  (testing "property with specified cardinality && type"
    (let [p (new-property)]
      (ls-api-call! :editor.upsertProperty p {:type "number"
                                              :cardinality "one"})
      (let [property (ls-api-call! :editor.getProperty p)]
        (is (= "number" (get property "type")))
        (is (= ":db.cardinality/one" (get property "cardinality")))))
    (let [p (new-property)]
      (ls-api-call! :editor.upsertProperty p {:type "number"
                                              :cardinality "many"})
      (let [property (ls-api-call! :editor.getProperty p)]
        (is (= "number" (get property "type")))
        (is (= ":db.cardinality/many" (get property "cardinality"))))
      (ls-api-call! :editor.upsertProperty p {:type "default"})
      (let [property (ls-api-call! :editor.getProperty p)]
        (is (= "default" (get property "type"))))))
  ;; TODO: How to test against eval-js errors on playwright?
  #_(testing ":checkbox property doesn't allow :many cardinality"
      (let [p (new-property)]
        (ls-api-call! :editor.upsertProperty p {:type "checkbox"
                                                :cardinality "many"}))))

(deftest property-related-test
  (testing "properties management related apis"
    (dorun
     (map-indexed
      (fn [idx property-type]
        (let [property-name (str "p" idx)
              _ (ls-api-call! :editor.upsertProperty property-name {:type property-type})
              property (ls-api-call! :editor.getProperty property-name)]
          (is (= (get property "ident") (str ":plugin.property._test_plugin/" property-name)))
          (is (= (get property "type") property-type))
          (ls-api-call! :editor.removeProperty property-name)
          (is (nil? (ls-api-call! :editor.getProperty property-name)))))
      ["default" "number" "date" "datetime" "checkbox" "url" "node" "json" "string"]))))

(deftest insert-block-with-properties
  (testing "insert block with properties"
    (let [page "insert-block-properties-test"
          _ (page/new-page page)
          ;; :checkbox, :number, :url, :json can be inferred and default to :default, but not for :page
          b1 (ls-api-call! :editor.insertBlock page "b1" {:properties {"x1" true
                                                                       "x2" "https://logseq.com"
                                                                       "x3" 1
                                                                       "x4" [1]
                                                                       "x5" {:foo "bar"}
                                                                       "x6" "Page x"
                                                                       "x7" ["Page y" "Page z"]
                                                                       "x8" "some content"}
                                                          :schema {"x6" {:type "page"}
                                                                   "x7" {:type "page"}}})]
      (is (true? (get b1 (->plugin-ident "x1"))))
      (is (= "https://logseq.com" (-> (ls-api-call! :editor.getBlock (get b1 (->plugin-ident "x2")))
                                      (get "title"))))
      (is (= 1 (-> (ls-api-call! :editor.getBlock (get b1 (->plugin-ident "x3")))
                   (get ":logseq.property/value"))))
      (is (= 1 (-> (ls-api-call! :editor.getBlock (first (get b1 (->plugin-ident "x4"))))
                   (get ":logseq.property/value"))))
      (is (= "{\"foo\":\"bar\"}" (get b1 (->plugin-ident "x5"))))
      (let [page-x (ls-api-call! :editor.getBlock (get b1 (->plugin-ident "x6")))]
        (is (= "page x" (get page-x "name"))))
      (is (= ["page y" "page z"] (map #(-> (ls-api-call! :editor.getBlock %)
                                           (get "name")) (get b1 (->plugin-ident "x7")))))
      (let [x8-block-value (ls-api-call! :editor.getBlock (get b1 (->plugin-ident "x8")))]
        (is (= "some content" (get x8-block-value "title")))
        (is (some? (get x8-block-value "page")))))))

(deftest update-block-with-properties
  (testing "update block with properties"
    (let [page "update-block-properties-test"
          _ (page/new-page page)
          block (ls-api-call! :editor.insertBlock page "b1")
          _ (ls-api-call! :editor.updateBlock (get block "uuid")
                          "b1-new-content"
                          {:properties {"y1" true
                                        "y2" "https://logseq.com"
                                        "y3" 1
                                        "y4" [1]
                                        "y5" {:foo "bar"}
                                        "y6" "Page x"
                                        "y7" ["Page y" "Page z"]
                                        "y8" "some content"}
                           :schema {"y6" {:type "page"}
                                    "y7" {:type "page"}}})
          b1 (ls-api-call! :editor.getBlock (get block "uuid"))]
      (is (true? (get b1 (->plugin-ident "y1"))))
      (is (= "https://logseq.com" (-> (ls-api-call! :editor.getBlock (get-in b1 [(->plugin-ident "y2") "id"]))
                                      (get "title"))))
      (is (= 1 (-> (ls-api-call! :editor.getBlock (get-in b1 [(->plugin-ident "y3") "id"]))
                   (get ":logseq.property/value"))))
      (is (= 1 (-> (ls-api-call! :editor.getBlock (get (first (get b1 (->plugin-ident "y4"))) "id"))
                   (get ":logseq.property/value"))))
      (is (= "{\"foo\":\"bar\"}" (get b1 (->plugin-ident "y5"))))
      (let [page-x (ls-api-call! :editor.getBlock (get-in b1 [(->plugin-ident "y6") "id"]))]
        (is (= "page x" (get page-x "name"))))
      (is (= ["page y" "page z"] (map #(-> (ls-api-call! :editor.getBlock %)
                                           (get "name"))
                                      (map #(get % "id") (get b1 (->plugin-ident "y7"))))))
      (let [y8-block-value (ls-api-call! :editor.getBlock (get-in b1 [(->plugin-ident "y8") "id"]))]
        (is (= "some content" (get y8-block-value "title")))
        (is (some? (get y8-block-value "page")))))))

(deftest insert-batch-blocks-test
  (testing "insert batch blocks"
    (let [page "insert batch blocks"
          _ (page/new-page page)
          page-uuid (get (ls-api-call! :editor.getBlock page) "uuid")
          result (ls-api-call! :editor.insertBatchBlock page-uuid
                               [{:content "b1"
                                 :children [{:content "b1.1"
                                             :children [{:content "b1.1.1"}
                                                        {:content "b1.1.2"}]}
                                            {:content "b1.2"}]}
                                {:content "b2"}])
          contents (util/get-page-blocks-contents)]
      (is (= contents ["b1" "b1.1" "b1.1.1" "b1.1.2" "b1.2" "b2"]))
      (is (= (map #(get % "title") result) ["b1" "b1.1" "b1.1.1" "b1.1.2" "b1.2" "b2"]))))
  (testing "insert batch blocks with properties"
    (let [page "insert batch blocks with properties"
          _ (page/new-page page)
          page-uuid (get (ls-api-call! :editor.getBlock page) "uuid")
          result (ls-api-call! :editor.insertBatchBlock page-uuid
                               [{:content "b1"
                                 :children [{:content "b1.1"
                                             :children [{:content "b1.1.1"
                                                         :properties {"z3" "Page 1"
                                                                      "z4" ["Page 2" "Page 3"]}}
                                                        {:content "b1.1.2"}]}
                                            {:content "b1.2"}]
                                 :properties {"z1" "test"
                                              "z2" true}}
                                {:content "b2"}]
                               {:schema {"z3" "page"
                                         "z4" "page"}})
          contents (util/get-page-blocks-contents)]
      (is (= contents
             ["b1" "test" "b1.1" "b1.1.1" "Page 1" "Page 2" "Page 3" "b1.1.2" "b1.2" "b2"]))
      (is (true? (get (first result) (->plugin-ident "z2")))))))

(deftest create-page-test
  (testing "create page"
    (let [result (ls-api-call! :editor.createPage "Test page 1")]
      (is (= "Test page 1" (get result "title")))
      (is
       (=
        ":logseq.class/Page"
        (-> (ls-api-call! :editor.getBlock (first (get result "tags")))
            (get "ident"))))))

  (testing "create page with properties"
    (let [result (ls-api-call! :editor.createPage "Test page 2"
                               {:px1 "test"
                                :px2 1
                                :px3 "Page 1"
                                :px4 ["Page 2" "Page 3"]}
                               {:schema {:px3 {:type "page"}
                                         :px4 {:type "page"}}})
          page (ls-api-call! :editor.getBlock "Test page 2")]
      (is (= "Test page 2" (get result "title")))
      (is
       (=
        ":logseq.class/Page"
        (-> (ls-api-call! :editor.getBlock (first (get result "tags")))
            (get "ident"))))
      ;; verify properties
      (is (= "test" (-> (ls-api-call! :editor.getBlock (get-in page [(->plugin-ident "px1") "id"]))
                        (get "title"))))
      (is (= 1 (-> (ls-api-call! :editor.getBlock (get-in page [(->plugin-ident "px2") "id"]))
                   (get ":logseq.property/value"))))
      (let [page-1 (ls-api-call! :editor.getBlock (get-in page [(->plugin-ident "px3") "id"]))]
        (is (= "page 1" (get page-1 "name"))))
      (is (= ["page 2" "page 3"] (map #(-> (ls-api-call! :editor.getBlock %)
                                           (get "name"))
                                      (map #(get % "id") (get page (->plugin-ident "px4"))))))))

  (testing "create tag page"
    (let [result (ls-api-call! :editor.createPage "Tag new"
                               {}
                               {:class true})]
      (is
       (=
        ":logseq.class/Tag"
        (-> (ls-api-call! :editor.getBlock (first (get result "tags")))
            (get "ident")))))))

(deftest get-all-tags-test
  (testing "get_all_tags"
    (let [result (ls-api-call! :editor.get_all_tags)
          built-in-tags #{":logseq.class/Template"
                          ":logseq.class/Query"
                          ":logseq.class/Math-block"
                          ":logseq.class/Task"
                          ":logseq.class/Code-block"
                          ":logseq.class/Card"
                          ":logseq.class/Quote-block"
                          ":logseq.class/Cards"}]
      (is (set/subset? built-in-tags (set (map #(get % "ident") result)))))))

(deftest get-all-properties-test
  (testing "get_all_properties"
    (let [result (ls-api-call! :editor.get_all_properties)]
      (is (>= (count result) 94)))))

(deftest get-tag-objects-test
  (testing "get_tag_objects"
    (let [page "tag objects test"
          _ (page/new-page page)
          _ (ls-api-call! :editor.insertBlock page "task 1"
                          {:properties {"logseq.property/status" "Doing"}})
          result (ls-api-call! :editor.get_tag_objects "logseq.class/Task")]
      (is (= (count result) 1))
      (is (= "task 1" (get (first result) "title"))))))
