(ns logseq.db.common.sqlite-cli-mutation-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.sqlite-cli :as sqlite-cli]))

(defn- tmp-dir []
  (fs/mkdtempSync (node-path/join (os/tmpdir) "sqlite-cli-mutation-")))

;; Fails if, in `store-addr-content!`, `when` becomes `when-not`.
;; Fails if, in `open-sqlite-datascript!`, `if` becomes `if-not`.
(deftest reopened-sqlite-db-restores-every-datom-test
  ;; Enough datoms for the stored index trees to have branch nodes, whose
  ;; child addresses are stored in the kvs addresses column.
  (let [db-path (node-path/join (tmp-dir) "db.sqlite")
        {:keys [conn sqlite]} (sqlite-cli/open-sqlite-datascript! db-path)]
    (d/transact! conn (mapv (fn [i] {:block/uuid (random-uuid)
                                     :block/title (str "block " i)
                                     :block/order (str "a" i)})
                            (range 3000)))
    (let [expected (count (d/datoms @conn :eavt))
          _ (.close sqlite)
          {conn2 :conn sqlite2 :sqlite} (sqlite-cli/open-sqlite-datascript! db-path)]
      (is (< 2000 expected))
      (is (= expected (count (d/datoms @conn2 :eavt))))
      (is (= "block 2999"
             (:v (first (d/datoms @conn2 :avet :block/title "block 2999")))))
      (.close sqlite2))))

;; Fails if, in `open-sqlite-datascript!`, `if` becomes `if-not`.
(deftest open-db-with-graphs-dir-stores-db-inside-graphs-dir-test
  (let [dir (tmp-dir)
        graphs-dir (node-path/join dir "graphs")
        db-name "mutation-graph"
        stray-path (node-path/join (js/process.cwd) db-name)
        _ (fs/mkdirSync (node-path/join graphs-dir db-name) #js {:recursive true})
        conn (sqlite-cli/open-db! graphs-dir db-name)]
    (d/transact! conn [{:block/uuid (random-uuid) :block/title "x"}])
    (is (fs/existsSync (node-path/join graphs-dir db-name "db.sqlite")))
    (is (not (fs/existsSync stray-path)))
    (when (fs/existsSync stray-path)
      (fs/unlinkSync stray-path))))
