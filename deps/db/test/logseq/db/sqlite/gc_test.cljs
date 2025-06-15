(ns logseq.db.sqlite.gc-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest async use-fixtures is testing]]
            [datascript.core :as d]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.debug :as sqlite-debug]
            [logseq.db.sqlite.gc :as sqlite-gc]))

(use-fixtures
  :each
 ;; Cleaning tmp/ before leaves last tmp/ after a test run for dev and debugging
  {:before
   #(async done
           (if (fs/existsSync "tmp")
             (fs/rm "tmp" #js {:recursive true} (fn [err]
                                                  (when err (js/console.log err))
                                                  (done)))
             (done)))})

(defn- create-graph-dir
  [dir db-name]
  (fs/mkdirSync (node-path/join dir db-name) #js {:recursive true}))

(deftest ^:long gc-kvs-table-test
  (testing "Create a datascript db, gc it and ensure there's no missing addrs and garbage addrs"
    (create-graph-dir "tmp/graphs" "test-db")

    (let [{:keys [conn sqlite]} (sqlite-cli/open-sqlite-datascript! "tmp/graphs" "test-db")
          tx-data (map (fn [i] {:block/uuid (random-uuid)
                                :block/title (str "title " i)})
                       (range 0 500000))]
      (println "DB start transacting")
      (d/transact! conn tx-data)
      (println "DB transacted")
      (let [non-ordered-tx (->> (shuffle tx-data)
                                (take 100000)
                                (map (fn [block] [:db/retractEntity [:block/uuid (:block/uuid block)]])))]
        (d/transact! conn non-ordered-tx))
      (println "gc time")
      ;; `true` to walk addresses and `false` to recursively run gc
      (time (sqlite-gc/gc-kvs-table-node-version! sqlite false))

      ;; ensure there's no missing address (broken db)
      (is (empty? (sqlite-debug/find-missing-addresses-node-version sqlite))
          "Found missing addresses!")

      (is (true? (sqlite-gc/ensure-no-garbage sqlite))
          "Found garbage addresses!"))))
