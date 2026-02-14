(ns logseq.db.common.delete-blocks-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db.common.delete-blocks :as delete-blocks]
            [logseq.db.test.helper :as db-test]))

(deftest delete-blocks-removes-reactions
  (testing "reactions targeting deleted blocks are retracted"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Block"}]}]})
          block (db-test/find-block-by-content @conn "Block")
          now (common-util/time-ms)
          reaction {:block/uuid (random-uuid)
                    :block/created-at now
                    :block/updated-at now
                    :logseq.property.reaction/emoji-id "+1"
                    :logseq.property.reaction/target (:db/id block)}
          _ (d/transact! conn [reaction])
          reaction-entity (first (:logseq.property.reaction/_target (d/entity @conn (:db/id block))))
          retracts [[:db/retractEntity (:db/id block)]]
          extra (delete-blocks/update-refs-history @conn retracts {})]
      (d/transact! conn (concat retracts extra))
      (is (nil? (d/entity @conn (:db/id reaction-entity)))))))
