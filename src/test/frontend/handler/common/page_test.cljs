(ns frontend.handler.common.page-test
  (:require [clojure.test :refer [async is use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]
            [promesa.core :as p]))

(use-fixtures :each
  {:before (fn []
             (async done
                    (test-helper/start-test-db!)
                    (done)))
   :after test-helper/destroy-test-db!})

(deftest-async create-page-restores-recycled-page
  (test-helper/load-test-files [{:page {:block/title "foo"}
                                 :blocks [{:block/title "child block"}]}])
  (p/let [conn (db/get-db test-helper/test-db false)
          page (db-test/find-page-by-title @conn "foo")
          page-uuid (:block/uuid page)
          _ (outliner-page/delete! conn page-uuid {})
          recycled-page (d/entity @conn [:block/uuid page-uuid])
          _ (is (ldb/recycled? recycled-page)
                "Page should be recycled after deletion")
          restored-page (page-common-handler/<create! "foo" {:redirect? false})]
    (is (= (:db/id restored-page) (:db/id page))
        "create! should return the restored page")
    (let [page' (d/entity @conn [:block/uuid page-uuid])]
      (is (not (ldb/recycled? page'))
          "Page should no longer be recycled after re-creation")
      (is (= "foo" (get-in (db-test/find-block-by-content @conn "child block") [:block/page :block/title]))
          "Restored page still has its block(s)"))))
