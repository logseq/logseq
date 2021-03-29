(ns frontend.handler.block-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [cljs-run-test :refer [run-test]]
            [frontend.handler.block :as block]))

(def args-1
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

(def args-2
  "Random blocks"
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

(def return-1
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

(def args-3
  '({:block/parent #:db{:id 20},
     :block/left #:db{:id 20},
     :block/pre-block? true,
     :block/uuid #uuid"6061b993-6d08-4f32-9776-dcd2e506bce9",
     :block/level 2,
     :db/id 23}
    {:block/parent #:db{:id 20},
     :block/left #:db{:id 23},
     :block/uuid #uuid"6061b993-4e38-4b14-a698-f04c009d27fa",
     :block/level 2,
     :block/title [["Plain" "level 1"]],
     :db/id 24}
    {:block/parent #:db{:id 24},
     :block/left #:db{:id 24},
     :block/uuid #uuid"6061b993-a371-4cf7-a5ca-17e451489f89",
     :block/level 3,
     :block/title [["Plain" "level 1-1"]],
     :db/id 25}
    {:block/parent #:db{:id 25},
     :block/left #:db{:id 25},
     :block/uuid #uuid"6061b993-c13e-48c2-b6f0-bd7977134149",
     :block/level 4,
     :block/title [["Plain" "level 1-1-1"]],
     :db/id 26}
    {:block/parent #:db{:id 20},
     :block/left #:db{:id 24},
     :block/uuid #uuid"6061b993-9f37-4590-9f6f-c4ee789053be",
     :block/level 2,
     :block/title [["Plain" "level 2"]],
     :db/id 27}))

(def return-3
  '({:block/parent #:db{:id 20},
    :block/left #:db{:id 20},
    :block/pre-block? true,
    :block/uuid #uuid"6061b993-6d08-4f32-9776-dcd2e506bce9",
    :block/level 2,
    :db/id 23,
    :block/refs-with-children ()}
   {:block/parent #:db{:id 20},
    :block/left #:db{:id 23},
    :block/uuid #uuid"6061b993-4e38-4b14-a698-f04c009d27fa",
    :block/level 2,
    :block/title [["Plain" "level 1"]],
    :db/id 24,
    :block/refs-with-children (),
    :block/children ({:block/parent #:db{:id 24},
                      :block/left #:db{:id 24},
                      :block/uuid #uuid"6061b993-a371-4cf7-a5ca-17e451489f89",
                      :block/level 3,
                      :block/title [["Plain" "level 1-1"]],
                      :db/id 25,
                      :block/refs-with-children (),
                      :block/children ({:block/parent #:db{:id 25},
                                        :block/left #:db{:id 25},
                                        :block/uuid #uuid"6061b993-c13e-48c2-b6f0-bd7977134149",
                                        :block/level 4,
                                        :block/title [["Plain" "level 1-1-1"]],
                                        :db/id 26,
                                        :block/refs-with-children ()})})}
   {:block/parent #:db{:id 20},
    :block/left #:db{:id 24},
    :block/uuid #uuid"6061b993-9f37-4590-9f6f-c4ee789053be",
    :block/level 2,
    :block/title [["Plain" "level 2"]],
    :db/id 27,
    :block/refs-with-children ()}))

(deftest test-blocks->vec-tree
  (let [should-r (vec return-1)
        r (block/blocks->vec-tree args-1)]
    (is (= should-r (vec r))))

  (let [should-r (vec return-3)
        r (block/blocks->vec-tree args-3)]
    (is (= should-r (vec r)))))

(deftest test-blocks->vec-tree-random-block
  (let [should-r (vec return-1)
        r (block/blocks->vec-tree-by-outliner args-1)]
    (is (= should-r (vec r))))

  (let [should-r (vec return-1)
        r (block/blocks->vec-tree-by-outliner args-2)]
    (is (= should-r (vec r))))

  (let [should-r (vec return-3)
        r (block/blocks->vec-tree-by-outliner args-3)]
    (is (= should-r (vec r)))))

(comment
  (defn clip-block [x]
    (map #(select-keys % [:block/parent :block/left :block/pre-block? :block/uuid :block/level
                          :block/title :db/id])
      x)))
