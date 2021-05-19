(ns frontend.handler.block-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [cljs-run-test :refer [run-test]]
            [frontend.handler.block :as block]))



(comment
  (defn clip-block [x]
    (map #(select-keys % [:block/parent :block/left :block/pre-block? :block/uuid :block/level
                          :block/title :db/id])
      x)))
