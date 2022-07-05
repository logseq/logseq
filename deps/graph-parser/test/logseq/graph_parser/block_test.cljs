(ns logseq.graph-parser.block-test
  (:require [logseq.graph-parser.block :as gp-block]
            [cljs.test :refer [deftest are]]))

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

  (are [x y] (= (vec (:page-refs (gp-block/extract-properties :markdown x {}))) y)
    [["year" "1000"]] ["year"]
    [["year" "\"1000\""]] ["year"]
    [["foo" "[[bar]] test"]] ["bar" "test" "foo"]
    [["foo" "[[bar]] test [[baz]]"]] ["bar" "test" "baz" "foo"]
    [["foo" "[[bar]] test [[baz]] [[nested [[baz]]]]"]] ["bar" "test" "baz" "nested [[baz]]" "foo"]
    [["foo" "#bar, #baz"]] ["bar" "baz" "foo"]
    [["foo" "[[nested [[page]]]], test"]] ["nested [[page]]" "test" "foo"]))

#_(cljs.test/run-tests)
