(ns logseq.db.frontend.reaction-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]))

(deftest reaction-entity-valid
  (testing "reaction entity passes db validation"
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
                    :logseq.property.reaction/target (:db/id block)}]
      (d/transact! conn [reaction])
      (is (empty? (:errors (db-validate/validate-local-db! @conn)))))))
