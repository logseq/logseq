(ns logseq.cli.command.debug-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.cli.command.debug :as debug-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-build-action
  (testing "builds action from --id selector"
    (let [result (debug-command/build-action {:id 42} "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= :debug-pull (get-in result [:action :type])))
      (is (= "logseq_db_demo" (get-in result [:action :repo])))
      (is (= 42 (get-in result [:action :lookup])))
      (is (= '[*] (get-in result [:action :selector])))))

  (testing "builds action from --uuid selector"
    (let [result (debug-command/build-action {:uuid "11111111-1111-1111-1111-111111111111"}
                                             "logseq_db_demo")
          lookup (get-in result [:action :lookup])]
      (is (true? (:ok? result)))
      (is (= :block/uuid (first lookup)))
      (is (uuid? (second lookup)))
      (is (= "11111111-1111-1111-1111-111111111111" (str (second lookup))))))

  (testing "builds action from --ident selector"
    (let [result (debug-command/build-action {:ident ":logseq.class/Tag"}
                                             "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= [:db/ident :logseq.class/Tag]
             (get-in result [:action :lookup])))))

  (testing "rejects invalid ident"
    (let [result (debug-command/build-action {:ident "logseq.class/Tag"}
                                             "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "requires repo"
    (let [result (debug-command/build-action {:id 1} nil)]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code]))))))

(deftest test-execute-debug-pull
  (testing "invokes :thread-api/pull and returns entity"
    (async done
           (let [invoke-calls* (atom [])
                 action {:type :debug-pull
                         :repo "logseq_db_demo"
                         :lookup 42
                         :selector '[*]}]
             (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo] config)
                                 transport/invoke (fn [_ method _ args]
                                                    (swap! invoke-calls* conj {:method method :args args})
                                                    (p/resolved {:db/id 42 :block/title "Debug Home"}))]
                   (p/let [result (debug-command/execute-debug-pull action {:base-url "http://example"})]
                     (is (= :ok (:status result)))
                     (is (= {:db/id 42 :block/title "Debug Home"}
                            (get-in result [:data :entity])))
                     (is (= 42 (get-in result [:data :lookup])))
                     (is (= '[*] (get-in result [:data :selector])))
                     (is (= [{:method :thread-api/pull
                              :args ["logseq_db_demo" '[*] 42]}]
                            @invoke-calls*))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally done)))))

  (testing "returns typed error when entity is missing"
    (async done
           (let [action {:type :debug-pull
                         :repo "logseq_db_demo"
                         :lookup [:db/ident :missing/ident]
                         :selector '[*]}]
             (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo] config)
                                 transport/invoke (fn [_ _method _ _args]
                                                    (p/resolved nil))]
                   (p/let [result (debug-command/execute-debug-pull action {:base-url "http://example"})]
                     (is (= :error (:status result)))
                     (is (= :entity-not-found (get-in result [:error :code])))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally done))))))
