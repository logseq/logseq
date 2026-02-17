(ns logseq.cli.command.doctor-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.cli.commands :as commands]
            [logseq.cli.data-dir :as data-dir]
            [logseq.cli.server :as cli-server]
            [promesa.core :as p]))

(deftest test-execute-doctor-script-missing
  (async done
    (let [orig-ensure-data-dir! data-dir/ensure-data-dir!
          orig-list-servers cli-server/list-servers
          ensure-data-dir-called? (atom false)
          list-servers-called? (atom false)]
      (set! data-dir/ensure-data-dir! (fn [_]
                                        (reset! ensure-data-dir-called? true)
                                        "/tmp/logseq-doctor"))
      (set! cli-server/list-servers (fn [_]
                                      (reset! list-servers-called? true)
                                      (p/resolved [])))
      (-> (p/let [result (commands/execute {:type :doctor
                                            :script-path "/tmp/logseq-cli-missing-db-worker-node.js"}
                                           {})]
            (is (= :error (:status result)))
            (is (= :doctor-script-missing (get-in result [:error :code])))
            (is (= :db-worker-script
                   (get-in result [:error :checks 0 :id])))
            (is (= :error
                   (get-in result [:error :checks 0 :status])))
            (is (false? @ensure-data-dir-called?))
            (is (false? @list-servers-called?)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! data-dir/ensure-data-dir! orig-ensure-data-dir!)
                       (set! cli-server/list-servers orig-list-servers)
                       (done)))))))

(deftest test-execute-doctor-data-dir-permission
  (async done
    (let [orig-ensure-data-dir! data-dir/ensure-data-dir!
          orig-list-servers cli-server/list-servers
          list-servers-called? (atom false)]
      (set! data-dir/ensure-data-dir! (fn [_]
                                        (throw (ex-info "data-dir is not readable/writable: /tmp/nope"
                                                        {:code :data-dir-permission
                                                         :path "/tmp/nope"
                                                         :cause "EACCES"}))))
      (set! cli-server/list-servers (fn [_]
                                      (reset! list-servers-called? true)
                                      (p/resolved [])))
      (-> (p/let [result (commands/execute {:type :doctor
                                            :script-path "src/main/logseq/cli/commands.cljs"}
                                           {:data-dir "/tmp/nope"})]
            (is (= :error (:status result)))
            (is (= :data-dir-permission (get-in result [:error :code])))
            (is (= [:db-worker-script :data-dir]
                   (mapv :id (get-in result [:error :checks]))))
            (is (= [:ok :error]
                   (mapv :status (get-in result [:error :checks]))))
            (is (false? @list-servers-called?)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! data-dir/ensure-data-dir! orig-ensure-data-dir!)
                       (set! cli-server/list-servers orig-list-servers)
                       (done)))))))

(deftest test-execute-doctor-all-checks-pass
  (async done
    (let [orig-ensure-data-dir! data-dir/ensure-data-dir!
          orig-list-servers cli-server/list-servers]
      (set! data-dir/ensure-data-dir! (fn [_] "/tmp/logseq-doctor"))
      (set! cli-server/list-servers (fn [_] (p/resolved [])))
      (-> (p/let [result (commands/execute {:type :doctor
                                            :script-path "src/main/logseq/cli/commands.cljs"}
                                           {:data-dir "/tmp/logseq-doctor"})]
            (is (= :ok (:status result)))
            (is (= :ok (get-in result [:data :status])))
            (is (= [:db-worker-script :data-dir :running-servers]
                   (mapv :id (get-in result [:data :checks]))))
            (is (= [:ok :ok :ok]
                   (mapv :status (get-in result [:data :checks])))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! data-dir/ensure-data-dir! orig-ensure-data-dir!)
                       (set! cli-server/list-servers orig-list-servers)
                       (done)))))))

(deftest test-execute-doctor-starting-server-warning
  (async done
    (let [orig-ensure-data-dir! data-dir/ensure-data-dir!
          orig-list-servers cli-server/list-servers]
      (set! data-dir/ensure-data-dir! (fn [_] "/tmp/logseq-doctor"))
      (set! cli-server/list-servers (fn [_]
                                      (p/resolved [{:repo "logseq_db_demo"
                                                    :status :starting
                                                    :host "127.0.0.1"
                                                    :port 9010}])))
      (-> (p/let [result (commands/execute {:type :doctor
                                            :script-path "src/main/logseq/cli/commands.cljs"}
                                           {:data-dir "/tmp/logseq-doctor"})]
            (is (= :ok (:status result)))
            (is (= :warning (get-in result [:data :status])))
            (is (= :running-servers
                   (get-in result [:data :checks 2 :id])))
            (is (= :warning
                   (get-in result [:data :checks 2 :status])))
            (is (= :doctor-server-not-ready
                   (get-in result [:data :checks 2 :code]))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! data-dir/ensure-data-dir! orig-ensure-data-dir!)
                       (set! cli-server/list-servers orig-list-servers)
                       (done)))))))

(deftest test-execute-doctor-default-script-checks-packaged-runtime-target
  (async done
         (let [orig-ensure-data-dir! data-dir/ensure-data-dir!
               orig-list-servers cli-server/list-servers]
           (set! data-dir/ensure-data-dir! (fn [_] "/tmp/logseq-doctor"))
           (set! cli-server/list-servers (fn [_] (p/resolved [])))
           (-> (p/let [result (commands/execute {:type :doctor}
                                                {:data-dir "/tmp/logseq-doctor"})
                       checked-path (get-in result [:data :checks 0 :path])]
                 (is (= :ok (:status result)))
                 (is (= (cli-server/db-worker-script-path) checked-path))
                 (is (string/ends-with? checked-path "/dist/db-worker-node.js")))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! data-dir/ensure-data-dir! orig-ensure-data-dir!)
                            (set! cli-server/list-servers orig-list-servers)
                            (done)))))))

(deftest test-execute-doctor-explicit-script-path-checks-static-runtime-target
  (async done
         (let [orig-ensure-data-dir! data-dir/ensure-data-dir!
               orig-list-servers cli-server/list-servers]
           (set! data-dir/ensure-data-dir! (fn [_] "/tmp/logseq-doctor"))
           (set! cli-server/list-servers (fn [_] (p/resolved [])))
           (-> (p/let [result (commands/execute {:type :doctor
                                                 :script-path (cli-server/db-worker-dev-script-path)}
                                                {:data-dir "/tmp/logseq-doctor"})
                       checked-path (get-in result [:data :checks 0 :path])]
                 (is (= :ok (:status result)))
                 (is (= (cli-server/db-worker-dev-script-path) checked-path))
                 (is (string/ends-with? checked-path "/static/db-worker-node.js")))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! data-dir/ensure-data-dir! orig-ensure-data-dir!)
                            (set! cli-server/list-servers orig-list-servers)
                            (done)))))))
