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
                                                           {:name "logseq_db_logseq_local_local-only"}]))
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
            (is (not-any? #(re-find #"^logseq_db_logseq_db_" %) names))
            (is (not-any? #(re-find #"logseq_local_" %) names))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest delete-graph-on-electron-closes-db-before-ipc-and-skips-unsafe-delete
  (async done
    (let [call-log (atom [])]
      (-> (p/with-redefs [util/electron? (constantly true)
                          persist-db/<close-db (fn [graph]
                                                 (swap! call-log conj [:close-db graph])
                                                 (p/resolved nil))
                          persist-db/<unsafe-delete (fn [graph]
                                                      (swap! call-log conj [:unsafe-delete graph])
                                                      (p/resolved nil))
                          ipc/ipc (fn [channel graph]
                                    (swap! call-log conj [:ipc channel graph])
                                    (p/resolved nil))]
            (p/let [_ (db-persist/delete-graph! "logseq_db_test")]
              (is (= [[:close-db "logseq_db_test"]
                      [:ipc "deleteGraph" "logseq_db_test"]]
                     @call-log)
                  "Should call <close-db then deleteGraph IPC, and never call <unsafe-delete")))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))
