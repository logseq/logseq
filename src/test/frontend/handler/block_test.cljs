(ns frontend.handler.block-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [cljs-run-test :refer [run-test]]
            [frontend.handler.block :as block]))

(def blocks->vec-tree-sequential-block-args
  '[{:block/parent {:db/id 20},
      :block/left {:db/id 20},
      :db/id 25
      :block/uuid "uuid-25"
      :block/pre-block? true,
      :block/level 2}
     {:block/parent {:db/id 20},
      :block/left {:db/id 25},
      :db/id 26
      :block/uuid "uuid-26"
      :block/title [["Plain" "level 1"]],
      :block/level 2}
     {:block/parent {:db/id 26},
      :block/left {:db/id 26},
      :db/id 27
      :block/uuid "uuid-27"
      :block/title [["Plain" "level 2"]],
      :block/level 3}
     {:block/parent {:db/id 27},
      :block/left {:db/id 27},
      :db/id 28
      :block/uuid "uuid-28"
      :block/title [["Plain" "level 3"]],
      :block/level 4}
     {:block/parent {:db/id 27},
      :block/left {:db/id 28},
      :db/id 29
      :block/uuid "uuid-29"
      :block/title [],
      :block/level 4}])

(def blocks->vec-tree-random-block-args
  '[{:block/parent {:db/id 26},
     :block/left {:db/id 26},
     :db/id 27
     :block/uuid "uuid-27"
     :block/title [["Plain" "level 2"]],
     :block/level 3}
    {:block/parent {:db/id 20},
     :block/left {:db/id 25},
     :db/id 26
     :block/uuid "uuid-26"
     :block/title [["Plain" "level 1"]],
     :block/level 2}
    {:block/parent {:db/id 20},
     :block/left {:db/id 20},
     :db/id 25
     :block/uuid "uuid-25"
     :block/pre-block? true,
     :block/level 2}
    {:block/parent {:db/id 27},
     :block/left {:db/id 28},
     :db/id 29
     :block/uuid "uuid-29"
     :block/title [],
     :block/level 4}
    {:block/parent {:db/id 27},
     :block/left {:db/id 27},
     :db/id 28
     :block/uuid "uuid-28"
     :block/title [["Plain" "level 3"]],
     :block/level 4}])

(def blocks->vec-tree-return
  '[{:block/parent {:db/id 20},
     :block/left {:db/id 20},
     :db/id 25,
     :block/uuid "uuid-25",
     :block/pre-block? true,
     :block/level 2,
     :block/refs-with-children ()}
    {:block/parent {:db/id 20},
     :block/left {:db/id 25},
     :db/id 26,
     :block/uuid "uuid-26",
     :block/title [["Plain" "level 1"]],
     :block/level 2,
     :block/refs-with-children (),
     :block/children
     ({:block/parent {:db/id 26},
       :block/left {:db/id 26},
       :db/id 27,
       :block/uuid "uuid-27",
       :block/title [["Plain" "level 2"]],
       :block/level 3,
       :block/refs-with-children (),
       :block/children
       ({:block/parent {:db/id 27},
         :block/left {:db/id 27},
         :db/id 28,
         :block/uuid "uuid-28",
         :block/title [["Plain" "level 3"]],
         :block/level 4,
         :block/refs-with-children ()}
        {:block/parent {:db/id 27},
         :block/left {:db/id 28},
         :db/id 29,
         :block/uuid "uuid-29",
         :block/title [],
         :block/level 4,
         :block/refs-with-children ()})})}])

(deftest test-blocks->vec-tree
  (let [should-r (vec blocks->vec-tree-return)]
   (let [r (block/blocks->vec-tree blocks->vec-tree-sequential-block-args)]
     (is (= should-r (vec r))))

   (let [r (block/blocks->vec-tree-by-outliner blocks->vec-tree-sequential-block-args)]
     (is (= should-r (vec r))))))

(deftest test-blocks->vec-tree-random-block
  (let [should-r (vec blocks->vec-tree-return)
        r (block/blocks->vec-tree-by-outliner blocks->vec-tree-random-block-args)]
    (is (= should-r (vec r)))))
