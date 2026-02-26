(ns frontend.db.persist-test
  (:require [cljs.test :refer [async deftest is]]
            [electron.ipc :as ipc]
            [frontend.db.persist :as db-persist]
            [frontend.persist-db :as persist-db]
            [frontend.util :as util]
            [promesa.core :as p]))

(deftest get-all-graphs-canonicalizes-db-prefixes-from-all-sources
  (async done
    (-> (p/with-redefs [persist-db/<list-db (fn []
                                              (p/resolved [{:name "demo"}
                                                           {:name "logseq_db_prefixed"}
                                                           {:name "logseq_db_logseq_db_legacy"}
                                                           {:name "logseq_local_local-only"}]))
                        util/electron? (constantly true)
                        ipc/ipc (fn [_channel]
                                  (p/resolved #js ["logseq_db_remote"
                                                   "logseq_db_logseq_db_remote-legacy"]))]
          (p/let [graphs (db-persist/get-all-graphs)
                  names (mapv :name graphs)]
            (is (= #{"logseq_db_demo"
                     "logseq_db_prefixed"
                     "logseq_db_legacy"
                     "logseq_db_remote"
                     "logseq_db_remote-legacy"}
                   (set names)))
            (is (not-any? #(re-find #"^logseq_db_logseq_db_" %) names))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
