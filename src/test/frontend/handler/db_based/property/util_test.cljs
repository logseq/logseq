(ns frontend.handler.db-based.property.util-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.db.conn :as conn]
            [frontend.handler.db-based.property.util :as db-pu]))

(deftest get-closed-property-values-uses-built-in-metadata-test
  (with-redefs [conn/get-db
                (fn [& _]
                  (throw (js/Error. "renderer DB conn should not be used")))]
    (is (= [{:db/ident :logseq.property/status.backlog
             :block/title "Backlog"}
            {:db/ident :logseq.property/status.todo
             :block/title "Todo"}
            {:db/ident :logseq.property/status.doing
             :block/title "Doing"}
            {:db/ident :logseq.property/status.in-review
             :block/title "In Review"}
            {:db/ident :logseq.property/status.done
             :block/title "Done"}
            {:db/ident :logseq.property/status.canceled
             :block/title "Canceled"}]
           (mapv #(select-keys % [:db/ident :block/title])
                 (db-pu/get-closed-property-values :logseq.property/status))))
    (is (= ["Low" "Medium" "High" "Urgent"]
           (mapv :block/title
                 (db-pu/get-closed-property-values :logseq.property/priority))))))
