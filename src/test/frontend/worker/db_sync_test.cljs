(ns frontend.worker.db-sync-test
  (:require [cljs.test :refer [deftest is testing run-test]]
            [datascript.core :as d]
            [frontend.worker.db-sync :as db-sync]
            [frontend.worker.state :as worker-state]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(def ^:private test-repo "test-db-sync-repo")

(defn- with-datascript-conn
  [conn f]
  (let [prev @worker-state/*datascript-conns]
    (reset! worker-state/*datascript-conns {test-repo conn})
    (try
      (f)
      (finally
        (reset! worker-state/*datascript-conns prev)))))

(defn- setup-parent-child
  []
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "parent"
                           :build/children [{:block/title "child"}]}]}]})
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")]
    {:conn conn
     :parent parent
     :child child}))

(deftest create-recycle-page-when-missing-test
  (testing "recycle page is created when missing during db-sync repair"
    (let [{:keys [conn parent child]} (setup-parent-child)
          recycle-page (ldb/get-built-in-page @conn common-config/recycle-page-name)]
      (ldb/transact! conn [[:db/retractEntity (:db/id recycle-page)]])
      (with-datascript-conn conn
        (fn []
          (#'db-sync/apply-remote-tx!
           test-repo
           nil
           [[:db/retractEntity (:db/id parent)]])
          (let [recycle-page' (ldb/get-built-in-page @conn common-config/recycle-page-name)]
            (is (= common-config/recycle-page-name (:block/title recycle-page')))
            (is (= "Recycle" (:block/title (:block/parent (d/entity @conn (:db/id child))))))))))))
