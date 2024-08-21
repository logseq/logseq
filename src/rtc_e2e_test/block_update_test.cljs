(ns block-update-test
  (:require [cljs.test :as t :refer [deftest]]
            [fixture]))

(t/use-fixtures :once
  fixture/install-some-consts
  fixture/install-example-db-fixture
  fixture/clear-test-remote-graphs-fixture
  fixture/build-two-conns-by-download-example-graph-fixture)

(deftest insert-blocks-test
  )
