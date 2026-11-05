(ns frontend.format.block-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]))

(deftest extract-blocks-preserves-text-without-file-graph-attributes
  (doseq [[title attr] [["task
SCHEDULED: <2024-01-02 Tue>" :block/scheduled]
                        ["task
DEADLINE: <2024-01-03 Wed>" :block/deadline]
                        ["NOW task" :block/marker]
                        ["DONE task" :block/marker]
                        ["[#B] task" :block/priority]
                        ["task
key:: v" :block/properties-text-values]
                        ["@[^1]key:: v" :block/invalid-properties]]]
    (let [content (str "- " title)
          parsed (first (block/extract-blocks
                         (mldoc/->edn content :markdown) content :markdown {}))]
      (is (= {:block/title title} (select-keys parsed [:block/title attr]))
          (str "Preserves text without " attr)))))
