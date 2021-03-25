(ns frontend.handler.block-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [cljs-run-test :refer [run-test]]
            [frontend.handler.block :as block]))

(def blocks->vec-tree-args
  '[{:block/parent {:db/id 20},
     :block/left {:db/id 20},
     :block/pre-block? true,
     :block/level 2}
    {:block/parent {:db/id 20},
     :block/left {:db/id 25},
     :block/title [["Plain" "level 1"]],
     :block/level 2}
    {:block/parent {:db/id 26},
     :block/left {:db/id 26},
     :block/title [["Plain" "level 2"]],
     :block/level 3}
    {:block/parent {:db/id 27},
     :block/left {:db/id 27},
     :block/title [["Plain" "level 3"]],
     :block/level 4}
    {:block/parent {:db/id 27},
     :block/left {:db/id 28},
     :block/title [],
     :block/level 4}])

(def blocks->vec-tree-return
  '({:block/parent {:db/id 20},
     :block/left {:db/id 20},
     :block/pre-block? true,
     :block/level 2,
     :block/refs-with-children ()}
    {:block/parent {:db/id 20},
     :block/left {:db/id 25},
     :block/title [["Plain" "level 1"]],
     :block/level 2,
     :block/refs-with-children (),
     :block/children
     ({:block/parent {:db/id 26},
       :block/left {:db/id 26},
       :block/title [["Plain" "level 2"]],
       :block/level 3,
       :block/refs-with-children (),
       :block/children
       ({:block/parent {:db/id 27},
         :block/left {:db/id 27},
         :block/title [["Plain" "level 3"]],
         :block/level 4,
         :block/refs-with-children ()}
        {:block/parent {:db/id 27},
         :block/left {:db/id 28},
         :block/title [],
         :block/level 4,
         :block/refs-with-children ()})})}))

(deftest test-blocks->vec-tree
  (let [should-r (vec blocks->vec-tree-return)]
   (let [r (block/blocks->vec-tree blocks->vec-tree-args)]
     (is (= should-r (vec r))))

   (let [r (block/blocks->vec-tree-by-parent blocks->vec-tree-args)]
     (is (= should-r (vec r))))))

(run-test test-blocks->vec-tree)
