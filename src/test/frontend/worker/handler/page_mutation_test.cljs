(ns frontend.worker.handler.page-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.handler.page]
            [frontend.worker.state :as worker-state]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(def ^:private test-repo "page-mutation-test")

(deftest page-exists?-thread-api-test
  (let [page-exists? (get @thread-api/*thread-apis :thread-api/page-exists?)
        conn (d/create-conn db-schema/schema)
        conns-before @worker-state/*datascript-conns]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (d/transact! conn [{:block/uuid (random-uuid)
                        :block/title "Foo"
                        :block/name "foo"
                        :block/tags :logseq.class/Page}])
    (reset! worker-state/*datascript-conns {test-repo conn})
    (try
      (is (true? (page-exists? test-repo "foo" #{:logseq.class/Page})))
      (is (false? (page-exists? test-repo "no such page" #{:logseq.class/Page})))
      (finally
        (reset! worker-state/*datascript-conns conns-before)))))
