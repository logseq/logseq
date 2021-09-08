(ns frontend.handler.block-test)



(comment
  (defn clip-block [x]
    (map #(select-keys % [:block/parent :block/left :block/pre-block? :block/uuid :block/level
                          :block/title :db/id])
      x)))
