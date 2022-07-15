(ns logseq.graph-parser.block-test
  (:require [logseq.graph-parser.block :as gp-block]
            [cljs.test :refer [deftest are testing is]]))

(deftest test-extract-properties
  (are [x y] (= (:properties (gp-block/extract-properties :markdown x {})) y)
       [["year" "1000"]] {:year 1000}
       [["year" "\"1000\""]] {:year "\"1000\""}
       [["background-color" "#000000"]] {:background-color "#000000"}
       [["alias" "name/with space"]] {:alias #{"name/with space"}}
       [["year" "1000"] ["alias" "name/with space"]] {:year 1000, :alias #{"name/with space"}}
       [["year" "1000"] ["tags" "name/with space"]] {:year 1000, :tags #{"name/with space"}}
       [["year" "1000"] ["tags" "name/with space, another"]] {:year 1000, :tags #{"name/with space" "another"}}
       [["year" "1000"] ["alias" "name/with space, another"]] {:year 1000, :alias #{"name/with space" "another"}}
       [["year" "1000"] ["alias" "name/with space, [[another [[nested]]]]"]] {:year 1000, :alias #{"name/with space" "another [[nested]]"}}
       [["year" "1000"] ["alias" "name/with space, [[[[nested]] another]]"]] {:year 1000, :alias #{"name/with space" "[[nested]] another"}}
       [["foo" "bar"]] {:foo "bar"}
       [["foo" "bar, baz"]] {:foo #{"bar" "baz"}}
       [["foo" "bar, [[baz]]"]] {:foo #{"bar" "baz"}}
       [["foo" "[[bar]], [[baz]]"]] {:foo #{"bar" "baz"}}
       [["foo" "[[bar]], [[nested [[baz]]]]"]] {:foo #{"bar" "nested [[baz]]"}}
       [["foo" "[[bar]], [[nested [[baz]]]]"]] {:foo #{"bar" "nested [[baz]]"}}
       [["foo" "bar, [[baz, test]]"]] {:foo #{"bar" "baz, test"}}
       [["foo" "bar, [[baz, test, [[nested]]]]"]] {:foo #{"bar" "baz, test, [[nested]]"}}
       [["file-path" "file:///home/x, y.pdf"]] {:file-path "file:///home/x, y.pdf"})

  (testing "page-refs"
    (are [x y] (= (vec (:page-refs
                        (gp-block/extract-properties :markdown x {:property-pages/enabled? true}))) y)
         [["year" "1000"]] ["year"]
         [["year" "\"1000\""]] ["1000" "year"]
         [["year" "1000"] ["month" "12"]] ["year" "month"]
         [["foo" "[[bar]] test"]] ["bar" "test" "foo"]
         [["foo" "[[bar]] test [[baz]]"]] ["bar" "test" "baz" "foo"]
         [["foo" "[[bar]] test [[baz]] [[nested [[baz]]]]"]] ["bar" "test" "baz" "nested [[baz]]" "foo"]
         [["foo" "#bar, #baz"]] ["bar" "baz" "foo"]
         [["foo" "[[nested [[page]]]], test"]] ["nested [[page]]" "test" "foo"])


    (are [x y] (= (vec (:page-refs
                        (gp-block/extract-properties :markdown x {:property-pages/enabled? false}))) y)
         [["year" "1000"]] []
         [["year" "1000"] ["month" "12"]] []
         [["foo" "[[bar]] test"]] ["bar" "test"])

    (is (= ["year"]
           (:page-refs
            (gp-block/extract-properties :markdown
                                         [["year" "1000"] ["month" "12"]]
                                         {:property-pages/enabled? true
                                          :property-pages/excludelist #{:month :day}})))
        ":property-pages/exclude-list excludes specified properties")

    (is (= ["year"]
           (:page-refs
                (gp-block/extract-properties :markdown
                                             [["year" "1000"]]
                                             {})))
        "Default to enabled when :property-pages/enabled? is not in config")))

#_(cljs.test/run-tests)
