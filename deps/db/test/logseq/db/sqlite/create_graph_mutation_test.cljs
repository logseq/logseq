(ns logseq.db.sqlite.create-graph-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

;; Fails if, in `build-initial-classes*`, `or` becomes `and`.
(deftest build-initial-classes*-title-test
  (let [[titled untitled] (sqlite-create-graph/build-initial-classes*
                           [[:user.class/Foo {:title "Foo Bar"}]
                            [:user.class/Baz {}]]
                           {})]
    (is (= "Foo Bar" (:block/title titled)) "a class keeps its given title")
    (is (= "Baz" (:block/title untitled)) "a class without a title is named after its ident")))
