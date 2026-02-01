(ns frontend.worker.react-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.react :as worker-react]
            [logseq.db.test.helper :as db-test]))

(deftest affected-keys-block-reactions
  (testing "reaction transactions affect block-reactions query key"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          block (db-test/find-block-by-content @conn "Block")
          target-id (:db/id block)
          tx-report (d/transact! conn
                                 [{:block/uuid (random-uuid)
                                   :block/created-at 1
                                   :block/updated-at 1
                                   :logseq.property.reaction/emoji-id "+1"
                                   :logseq.property.reaction/target target-id}])
          affected (worker-react/get-affected-queries-keys tx-report)]
      (is (some #{[:frontend.worker.react/block-reactions target-id]} affected)))))
