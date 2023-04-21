(ns logseq.graph-parser.block-test
  (:require [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser :as graph-parser]
            [logseq.db :as ldb]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [datascript.core :as d]
            [cljs.test :refer [deftest are testing is]]))

(defn- extract-properties
  [properties user-config]
  (gp-block/extract-properties
   (map
    (fn [[k v]]
      (let [mldoc-ast (gp-mldoc/get-references v (gp-mldoc/default-config :markdown))]
        [k v mldoc-ast]))
    properties)
   user-config))

(deftest test-fix-duplicate-id
  (are [x y]
      (let [result (gp-block/fix-duplicate-id (gp-block/block-keywordize x))]
        (and (:block/uuid result)
             (not= (:uuid x) (:block/uuid result))
             (= (select-keys result
                             [:block/properties :block/content :block/properties-text-values :block/properties-order]) (gp-block/block-keywordize y))))
    {:properties {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :tags [], :format :markdown, :meta {:start_pos 51, :end_pos 101}, :macros [], :unordered true, :content "bar\nid:: 63f199bc-c737-459f-983d-84acfcda14fe", :properties-text-values {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :level 1, :uuid #uuid "63f199bc-c737-459f-983d-84acfcda14fe", :properties-order [:id]}
    {:properties {},
     :content "bar",
     :properties-text-values {},
     :properties-order []}

    {:properties {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :tags [], :format :org, :meta {:start_pos 51, :end_pos 101}, :macros [], :unordered true, :content "bar\n:id: 63f199bc-c737-459f-983d-84acfcda14fe", :properties-text-values {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :level 1, :uuid #uuid "63f199bc-c737-459f-983d-84acfcda14fe", :properties-order [:id]}
    {:properties {},
     :content "bar",
     :properties-text-values {},
     :properties-order []}

    {:properties {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :tags [], :format :markdown, :meta {:start_pos 51, :end_pos 101}, :macros [], :unordered true, :content "bar\n  \n  id:: 63f199bc-c737-459f-983d-84acfcda14fe\nblock body", :properties-text-values {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :level 1, :uuid #uuid "63f199bc-c737-459f-983d-84acfcda14fe", :properties-order [:id]}
    {:properties {},
     :content "bar\nblock body",
     :properties-text-values {},
     :properties-order []}))

(deftest test-extract-properties
  (are [x y] (= (:properties (extract-properties x {})) y)
       ;; Built-in properties
       [["background-color" "#000000"]] {:background-color "#000000"}
       [["alias" "[[name/with space]]"]] {:alias #{"name/with space"}}
       [["tags" "[[foo]], [[bar]]"]] {:tags #{"foo" "bar"}}
       [["tags" "[[foo]] [[bar]]"]] {:tags #{"foo" "bar"}}
       [["tags" "bar"]] {:tags #{"bar"}}
       [["file-path" "file:///home/x, y.pdf"]] {:file-path "file:///home/x, y.pdf"}

       ;; User properties
       [["year" "1000"]] {:year 1000}
       [["year" "\"1000\""]] {:year "\"1000\""}
       [["year" "1000"] ["alias" "[[name/with space]]"]] {:year 1000, :alias #{"name/with space"}}
       [["year" "1000"] ["tags" "[[name/with space]]"]] {:year 1000, :tags #{"name/with space"}}
       [["year" "1000"] ["tags" "[[name/with space]], [[another]]"]] {:year 1000, :tags #{"name/with space" "another"}}
       [["year" "1000"] ["alias" "[[name/with space]], [[another]]"]] {:year 1000, :alias #{"name/with space" "another"}}
       [["year" "1000"] ["alias" "[[name/with space]], [[another [[nested]]]]"]] {:year 1000, :alias #{"name/with space" "another [[nested]]"}}
       [["year" "1000"] ["alias" "[[name/with space]], [[[[nested]] another]]"]] {:year 1000, :alias #{"name/with space" "[[nested]] another"}}
       [["foo" "bar"]] {:foo "bar"}
       [["foo" "[[bar]], [[baz]]"]] {:foo #{"bar" "baz"}}
       [["foo" "[[bar]], [[baz]]"]] {:foo #{"bar" "baz"}}
       [["foo" "[[bar]], [[baz]]"]] {:foo #{"bar" "baz"}}
       [["foo" "[[bar]], [[nested [[baz]]]]"]] {:foo #{"bar" "nested [[baz]]"}}
       [["foo" "[[bar]], [[nested [[baz]]]]"]] {:foo #{"bar" "nested [[baz]]"}}
       [["foo" "[[bar]], [[baz, test]]"]] {:foo #{"bar" "baz, test"}}
       [["foo" "[[bar]], [[baz, test, [[nested]]]]"]] {:foo #{"bar" "baz, test, [[nested]]"}})

  (testing "page-refs"
    (are [x y] (= (vec (:page-refs
                        (extract-properties x {:property-pages/enabled? true}))) y)
         [["year" "1000"]] ["year"]
         [["year" "\"1000\""]] ["year"]
         [["year" "1000"] ["month" "12"]] ["year" "month"]
         [["foo" "[[bar]] test"]] ["bar" "foo"]
         [["foo" "[[bar]] test [[baz]]"]] ["bar" "baz" "foo"]
         [["foo" "[[bar]] test [[baz]] [[nested [[baz]]]]"]] ["bar" "baz" "nested [[baz]]" "foo"]
         [["foo" "#bar, #baz"]] ["bar" "baz" "foo"]
         [["foo" "[[nested [[page]]]], test"]] ["nested [[page]]" "foo"])


    (are [x y] (= (vec (:page-refs
                        (extract-properties x {:property-pages/enabled? false}))) y)
         [["year" "1000"]] []
         [["year" "1000"] ["month" "12"]] []
         [["foo" "[[bar]] test"]] ["bar"])

    (is (= ["year"]
           (:page-refs
            (extract-properties [["year" "1000"] ["month" "12"]]
                                         {:property-pages/enabled? true
                                          :property-pages/excludelist #{:month :day}})))
        ":property-pages/exclude-list excludes specified properties")

    (is (= ["year"]
           (:page-refs
            (extract-properties [["year" "1000"]]
                                         {})))
        "Default to enabled when :property-pages/enabled? is not in config")

    (is (= ["foo" "bar"]
           (:page-refs
            (extract-properties
             ;; tags is linkable and background-color is not
             [["tags" "[[foo]], [[bar]]"] ["background-color" "#008000"]]
                                         {:property-pages/enabled? true})))
        "Only editable linkable built-in properties have page-refs in property values")))

(defn find-block-for-content
  [db content]
  (->> (d/q '[:find (pull ?b [* {:block/refs [:block/uuid]}])
              :in $ ?content
              :where [?b :block/content ?content]]
            db
            content)
       (map first)
       first))

(deftest refs-from-block-refs
  (let [conn (ldb/start-conn)
        id "63f528da-284a-45d1-ac9c-5d6a7435f6b4"
        block (str "A block\nid:: " id)
        block-ref-via-content (str "Link to " (block-ref/->block-ref id))
        block-ref-via-block-properties (str "B block\nref:: " (block-ref/->block-ref id))
        body (str "- " block "\n- " block-ref-via-content "\n- " block-ref-via-block-properties)]
    (graph-parser/parse-file conn "foo.md" body {})

    (testing "Block refs in blocks"
      (is (= [{:block/uuid (uuid id)}]
             (:block/refs (find-block-for-content @conn block-ref-via-content)))
          "Block that links to a block via paragraph content has correct block ref")

      (is (contains?
           (set (:block/refs (find-block-for-content @conn block-ref-via-block-properties)))
           {:block/uuid (uuid id)})
          "Block that links to a block via block properties has correct block ref"))

    (testing "Block refs in pre-block"
      (let [block-ref-via-page-properties (str "page-ref:: " (block-ref/->block-ref id))]
        (graph-parser/parse-file conn "foo2.md" block-ref-via-page-properties {})
        (is (contains?
             (set (:block/refs (find-block-for-content @conn block-ref-via-page-properties)))
             {:block/uuid (uuid id)})
            "Block that links to a block via page properties has correct block ref")))))

(deftest timestamp-blocks
  (let [conn (ldb/start-conn)
        deadline-block "do something\nDEADLINE: <2023-02-21 Tue>"
        scheduled-block "do something else\nSCHEDULED: <2023-02-20 Mon>"
        body (str "- " deadline-block "\n- " scheduled-block)]
    (graph-parser/parse-file conn "foo.md" body {})

    (is (= 20230220
           (:block/scheduled (find-block-for-content @conn scheduled-block)))
        "Scheduled block has correct block attribute and value")

    (is (= 20230221
           (:block/deadline (find-block-for-content @conn deadline-block)))
        "Deadline block has correct block attribute and value")))
