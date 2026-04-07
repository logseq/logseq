(ns logseq.cli.command.upsert-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.command.upsert :as upsert-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(deftest test-execute-upsert-tag-create-creates-tag-when-missing
  (async done
    (let [q-calls* (atom 0)
          create-called?* (atom false)
          action {:type :upsert-tag
                  :mode :create
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :name "TagOne"}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method _ args]
                                             (case method
                                               :thread-api/q
                                               (let [[_ [query _]] args
                                                     where (:where query)
                                                     malformed-where? (and (= 1 (count where))
                                                                           (vector? (first where))
                                                                           (> (count (first where)) 3))]
                                                 (if malformed-where?
                                                   (throw (ex-info "Index out of bounds" {:code :http-error}))
                                                   (do
                                                     (swap! q-calls* inc)
                                                     (if (= 1 @q-calls*)
                                                       (p/resolved [])
                                                       (p/resolved [{:db/id 42
                                                                     :block/name "tagone"
                                                                     :block/title "TagOne"
                                                                     :block/tags [{:db/ident :logseq.class/Tag}]}])))))

                                               :thread-api/apply-outliner-ops
                                               (do
                                                 (reset! create-called?* true)
                                                 (p/resolved nil))

                                               (throw (ex-info "unexpected invoke"
                                                               {:method method
                                                                :args args}))))]
            (p/let [result (upsert-command/execute-upsert-tag action {})]
              (is (= :ok (:status result)))
              (is (= [42] (get-in result [:data :result])))
              (is @create-called?*)
              (is (= 2 @q-calls*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-build-task-action-validation
  (testing "upsert task requires target selector or content/page"
    (let [result (upsert-command/build-task-action {} "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :missing-target (get-in result [:error :code])))))

  (testing "upsert task rejects page and content combination"
    (let [result (upsert-command/build-task-action {:page "Home" :content "Task"} "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "upsert task build create mode"
    (let [result (upsert-command/build-task-action {:content "Task from CLI"
                                                    :status "todo"
                                                    :priority "high"}
                                                   "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= :upsert-task (get-in result [:action :type])))
      (is (= :create (get-in result [:action :mode])))
      (is (= :logseq.property/status.todo (get-in result [:action :update-properties :logseq.property/status])))
      (is (= :logseq.property/priority.high (get-in result [:action :update-properties :logseq.property/priority]))))))

(deftest test-execute-upsert-task-page-applies-task-ops
  (async done
    (let [ops* (atom nil)
          action {:type :upsert-task
                  :mode :page
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :page "TaskHome"
                  :status :logseq.property/status.todo
                  :priority :logseq.property/priority.high}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          add-command/resolve-tags (fn [_ _ _] (p/resolved nil))
                          add-command/resolve-properties (fn [_ _ _ _] (p/resolved {}))
                          add-command/resolve-property-identifiers (fn [_ _ _ _] (p/resolved []))
                          transport/invoke (fn [_ method _ args]
                                             (case method
                                               :thread-api/pull
                                               (let [[_ selector lookup] args]
                                                 (cond
                                                   (= lookup [:block/name "taskhome"])
                                                   (p/resolved {:db/id 42 :block/uuid (uuid "00000000-0000-0000-0000-000000000042")})

                                                   (= lookup [:db/ident :logseq.class/Task])
                                                   (p/resolved {:db/id 900})

                                                   (and (vector? selector) (= selector [:db/id]))
                                                   (p/resolved {:db/id 1})

                                                   :else
                                                   (p/resolved {})))

                                               :thread-api/apply-outliner-ops
                                               (let [[_ ops _] args]
                                                 (reset! ops* ops)
                                                 (p/resolved nil))

                                               (throw (ex-info "unexpected invoke"
                                                               {:method method
                                                                :args args}))))]
            (p/let [result (upsert-command/execute-upsert-task action {})]
              (is (= :ok (:status result)))
              (is (= [42] (get-in result [:data :result])))
              (is (= [[:batch-set-property [[42] :block/tags 900 {}]]
                      [:batch-set-property [[42] :logseq.property/status :logseq.property/status.todo {}]]
                      [:batch-set-property [[42] :logseq.property/priority :logseq.property/priority.high {}]]]
                     @ops*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))
