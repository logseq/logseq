(ns logseq.api.db-based.util-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.api.db-based.util :as api-util]))

(deftest remove-hidden-properties-drops-temp-and-tx-keys
  (is (= {:block/title "Keep"
          :db/id 1}
         (api-util/remove-hidden-properties
          {:block/title "Keep"
           :db/id 1
           :block.temp/load-status :ready
           :block/tx-id 99}))))

(deftest summarize-upsert-operations
  (is (= "Added: {:page 1, :block 2}."
         (api-util/summarize-upsert-operations
          [{:entityType "page" :operation "add"}
           {:entityType "block" :operation "add"}
           {:entityType "block" :operation "add"}]
          {})))
  (is (= "Dry run:  Edited: {:page 1}."
         (api-util/summarize-upsert-operations
          [{:entityType "page" :operation "edit"}]
          {:dry-run true})))
  (is (= "Added: {:tag 1}. Edited: {:block 1}."
         (api-util/summarize-upsert-operations
          [{:entityType "tag" :operation "add"}
           {:entityType "block" :operation "edit"}]
          {}))))
