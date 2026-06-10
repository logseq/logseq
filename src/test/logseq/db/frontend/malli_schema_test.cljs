(ns logseq.db.frontend.malli-schema-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.malli-schema :as db-malli-schema]))

(deftest datoms->entity-maps-ignores-duplicate-identical-cardinality-one-datoms
  (is (= {1 {:block/title "Title"
             :block/created-at 1}}
         (db-malli-schema/datoms->entity-maps
          [{:e 1 :a :block/title :v "Title"}
           {:e 1 :a :block/title :v "Title"}
           {:e 1 :a :block/created-at :v 1}]))))

(deftest datoms->entity-maps-keeps-conflicting-cardinality-one-values
  (is (= {1 {:block/title #{"Old" "New"}}}
         (db-malli-schema/datoms->entity-maps
          [{:e 1 :a :block/title :v "Old"}
           {:e 1 :a :block/title :v "New"}]))))
