(ns logseq.cli.command.doctor-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.cli.commands :as commands]
            [logseq.cli.data-dir :as data-dir]
            [logseq.cli.server :as cli-server]
            [promesa.core :as p]
            [logseq.cli.command.doctor :as doctor-command]))

(deftest test-execute-doctor-script-missing
  (async done
    (let [ensure-data-dir-called? (atom false)
          list-servers-called? (atom false)]
      (-> (p/with-redefs [data-dir/ensure-data-dir! (fn [_]
                                                      (reset! ensure-data-dir-called? true)
                                                      "/tmp/logseq-doctor")
                          cli-server/list-servers (fn [_]
                                                    (reset! list-servers-called? true)
                                                    (p/resolved []))]
            (p/let [result (commands/execute {:type :doctor
                                              :script-path "/tmp/logseq-cli-missing-db-worker-node.js"}
                                             {})]
              (is (= :error (:status result)))
              (is (= :doctor-script-missing (get-in result [:error :code])))
              (is (= :db-worker-script
                     (get-in result [:error :checks 0 :id])))
              (is (= :error
                     (get-in result [:error :checks 0 :status])))
              (is (false? @ensure-data-dir-called?))
              (is (false? @list-servers-called?))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-doctor-data-dir-permission
  (async done
    (let [list-servers-called? (atom false)]
      (-> (p/with-redefs [data-dir/ensure-data-dir! (fn [_]
                                                      (throw (ex-info "data-dir is not readable/writable: /tmp/nope"
                                                                      {:code :data-dir-permission
                                                                       :path "/tmp/nope"
                                                                       :cause "EACCES"})))
                          cli-server/list-servers (fn [_]
                                                    (reset! list-servers-called? true)
                                                    (p/resolved []))]
            (p/let [result (commands/execute {:type :doctor
                                              :script-path "src/main/logseq/cli/commands.cljs"}
                                             {:data-dir "/tmp/nope"})]
              (is (= :error (:status result)))
              (is (= :data-dir-permission (get-in result [:error :code])))
              (is (= [:db-worker-script :data-dir]
                     (mapv :id (get-in result [:error :checks]))))
              (is (= [:ok :error]
                     (mapv :status (get-in result [:error :checks]))))
              (is (false? @list-servers-called?))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-doctor-all-checks-pass
  (async done
    (-> (p/with-redefs [data-dir/ensure-data-dir! (fn [_] "/tmp/logseq-doctor")
                        cli-server/list-servers (fn [_] (p/resolved []))]
          (p/let [result (commands/execute {:type :doctor
                                            :script-path "src/main/logseq/cli/commands.cljs"}
                                           {:data-dir "/tmp/logseq-doctor"})]
            (is (= :ok (:status result)))
            (is (= :ok (get-in result [:data :status])))
            (is (= [:db-worker-script :data-dir :running-servers]
                   (mapv :id (get-in result [:data :checks]))))
            (is (= [:ok :ok :ok]
                   (mapv :status (get-in result [:data :checks]))))))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))))
        (p/finally done))))

(deftest test-execute-doctor-starting-server-warning
  (async done
    (-> (p/with-redefs [data-dir/ensure-data-dir! (fn [_] "/tmp/logseq-doctor")
                        cli-server/list-servers (fn [_]
                                                  (p/resolved [{:repo "logseq_db_demo"
                                                                :status :starting
                                                                :host "127.0.0.1"
                                                                :port 9010}]))]
          (p/let [result (commands/execute {:type :doctor
                                            :script-path "src/main/logseq/cli/commands.cljs"}
                                           {:data-dir "/tmp/logseq-doctor"})]
            (is (= :ok (:status result)))
            (is (= :warning (get-in result [:data :status])))
            (is (= :running-servers
                   (get-in result [:data :checks 2 :id])))
            (is (= :warning
                   (get-in result [:data :checks 2 :status])))
            (is (= :doctor-server-not-ready
                   (get-in result [:data :checks 2 :code])))))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))))
        (p/finally done))))

(deftest test-execute-doctor-default-script-checks-packaged-runtime-target
  (async done
         (-> (p/with-redefs [data-dir/ensure-data-dir! (fn [_] "/tmp/logseq-doctor")
                             cli-server/list-servers (fn [_] (p/resolved []))
                             doctor-command/check-db-worker-script
                             (fn [_]
                               {:ok? true
                                :check {:id :db-worker-script
                                        :status :ok
                                        :path "/dist/db-worker-node.js"
                                        :message (str "Found readable file: " "/dist/db-worker-node.js")}})]
               (p/let [result (commands/execute {:type :doctor}
                                                {:data-dir "/tmp/logseq-doctor"})
                       checked-path (get-in result [:data :checks 0 :path])]
                 (is (= :ok (:status result)))
                 (is (string/ends-with? checked-path "/dist/db-worker-node.js"))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))