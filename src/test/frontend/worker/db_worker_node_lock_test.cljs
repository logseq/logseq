(ns frontend.worker.db-worker-node-lock-test
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is testing]]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [promesa.core :as p]))

(deftest repo-dir-canonicalizes-db-prefixed-repo
  (testing "db-prefixed repo name resolves to prefix-free graph directory key"
    (let [data-dir "/tmp/logseq-db-worker-node-lock"
          expected (node-path/join data-dir "demo")]
      (is (= expected (db-lock/repo-dir data-dir "logseq_db_demo"))))))

(deftest repo-dir-canonicalizes-prefix-free-repo
  (testing "prefix-free repo name resolves to same graph directory key"
    (let [data-dir "/tmp/logseq-db-worker-node-lock"
          expected (node-path/join data-dir "demo")]
      (is (= expected (db-lock/repo-dir data-dir "demo"))))))

(deftest repo-dir-does-not-migrate-legacy-prefixed-dir
  (testing "canonical resolution does not rename legacy prefixed directories"
    (let [data-dir (node-helper/create-tmp-dir "db-worker-node-lock")
          legacy-dir (node-path/join data-dir "logseq_db_demo")
          canonical-dir (node-path/join data-dir "demo")]
      (fs/mkdirSync legacy-dir #js {:recursive true})
      (is (= canonical-dir (db-lock/repo-dir data-dir "logseq_db_demo")))
      (is (fs/existsSync legacy-dir))
      (is (not (fs/existsSync canonical-dir))))))

(deftest lock-path-default-data-dir-uses-canonical-graph-dir
  (testing "default data-dir lock path is built with canonical <graph> directory naming"
    (let [default-data-dir (db-lock/resolve-data-dir nil)
          expected-data-dir (node-path/join (.homedir os) "logseq" "graphs")
          expected-lock-path (node-path/join expected-data-dir "demo" "db-worker.lock")]
      (is (= expected-data-dir default-data-dir))
      (is (= expected-lock-path (db-lock/lock-path default-data-dir "logseq_db_demo"))))))

(deftest create-lock-persists-owner-source
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker-node-lock-owner")
          repo (str "logseq_db_lock_owner_" (subs (str (random-uuid)) 0 8))
          path (db-lock/lock-path data-dir repo)]
      (-> (p/let [_ (db-lock/create-lock! {:data-dir data-dir
                                           :repo repo
                                           :host "127.0.0.1"
                                           :port 9101
                                           :owner-source :cli})
                  lock (db-lock/read-lock path)]
            (is (= :cli (:owner-source lock))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (db-lock/remove-lock! path)
                       (done)))))))

(deftest read-lock-normalizes-missing-owner-source-to-unknown
  (let [data-dir (node-helper/create-tmp-dir "db-worker-node-lock-legacy-owner")
        repo (str "logseq_db_lock_legacy_" (subs (str (random-uuid)) 0 8))
        path (db-lock/lock-path data-dir repo)
        legacy-lock {:repo repo
                     :pid (.-pid js/process)
                     :host "127.0.0.1"
                     :port 9101
                     :startedAt (.toISOString (js/Date.))}]
    (fs/mkdirSync (node-path/dirname path) #js {:recursive true})
    (fs/writeFileSync path (js/JSON.stringify (clj->js legacy-lock)))
    (is (= :unknown (:owner-source (db-lock/read-lock path))))))

(deftest update-lock-preserves-existing-owner-source
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker-node-lock-update-owner")
          repo (str "logseq_db_lock_update_owner_" (subs (str (random-uuid)) 0 8))
          path (db-lock/lock-path data-dir repo)]
      (-> (p/let [{:keys [lock]} (db-lock/ensure-lock! {:data-dir data-dir
                                                        :repo repo
                                                        :host "127.0.0.1"
                                                        :port 9101
                                                        :owner-source :cli})
                  _ (db-lock/update-lock! path (assoc lock :port 9200 :owner-source :electron))
                  updated (db-lock/read-lock path)]
            (is (= :cli (:owner-source updated)))
            (is (= 9200 (:port updated))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (db-lock/remove-lock! path)
                       (done)))))))
