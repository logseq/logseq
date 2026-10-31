(ns frontend.worker.handler.property-tag-completion-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.handler.property :as worker-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]))

(deftest get-all-classes-sends-alias-titles-for-tag-completion
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (d/transact! conn [{:db/id -1
                        :block/title "ET"
                        :block/name "et"
                        :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
                        :block/tags :logseq.class/Page}
                       {:db/ident :user.class/Example-Tag
                        :block/title "Example Tag"
                        :block/name "example tag"
                        :block/tags :logseq.class/Tag
                        :block/alias -1}])
    (let [;; The thread API result crosses the worker boundary as transit
          classes (->> (worker-property/get-all-classes @conn {:except-root-class? true})
                       sqlite-util/write-transit-str
                       sqlite-util/read-transit-str)
          example-tag (some #(when (= :user.class/Example-Tag (:db/ident %)) %) classes)]
      (is (= ["ET"] (map :block/title (:block/alias example-tag)))
          "Tag completion matches `#ET` against the alias title"))))
