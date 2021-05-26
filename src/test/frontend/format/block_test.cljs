(ns frontend.format.block-test
  (:require [frontend.format.block :as block]
            [cljs.test :refer [deftest is are testing use-fixtures run-tests]]))

(deftest test-extract-properties
  (are [x y] (= (:properties (block/extract-properties x)) y)
    [["year" "1000"]] {:year 1000}
    [["year" "\"1000\""]] {:year "1000"}
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
    [["foo" "bar, [[baz, test, [[nested]]]]"]] {:foo #{"bar" "baz, test, [[nested]]"}})

  (are [x y] (= (vec (:page-refs (block/extract-properties x))) y)
    [["year" "1000"]] []
    [["year" "\"1000\""]] []
    [["foo" "[[bar]] test"]] ["bar" "test"]
    [["foo" "[[bar]] test [[baz]]"]] ["bar" "test" "baz"]
    [["foo" "[[bar]] test [[baz]] [[nested [[baz]]]]"]] ["bar" "test" "baz" "nested [[baz]]"]))

#_(run-tests)
