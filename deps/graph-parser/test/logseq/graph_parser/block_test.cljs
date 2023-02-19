(ns logseq.graph-parser.block-test
  (:require [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.mldoc :as gp-mldoc]
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

(deftest test-fix-duplicate-id-in-same-file
  (are [x y]
      (let [result (gp-block/fix-duplicate-id-in-same-file x)]
        (and (:uuid result)
             (not= (:uuid x) (:uuid result))
             (= (select-keys (gp-block/fix-duplicate-id-in-same-file x)
                             [:properties :content :properties-text-values :properties-order]) y)))
    {:properties {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :tags [], :format :markdown, :meta {:start_pos 51, :end_pos 101}, :macros [], :unordered true, :content "bar\nid:: 63f199bc-c737-459f-983d-84acfcda14fe", :properties-text-values {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :level 1, :uuid #uuid "63f199bc-c737-459f-983d-84acfcda14fe", :properties-order [:id]}
    {:properties {},
     :content "bar",
     :properties-text-values {},
     :properties-order []}

    {:properties {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :tags [], :format :org, :meta {:start_pos 51, :end_pos 101}, :macros [], :unordered true, :content "bar\n:id: 63f199bc-c737-459f-983d-84acfcda14fe", :properties-text-values {:id "63f199bc-c737-459f-983d-84acfcda14fe"}, :level 1, :uuid #uuid "63f199bc-c737-459f-983d-84acfcda14fe", :properties-order [:id]}
    {:properties {},
     :content "bar",
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
