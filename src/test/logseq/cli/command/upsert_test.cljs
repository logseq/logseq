(ns logseq.cli.command.upsert-test
  (:require [clojure.string :as string]
            [cljs.test :refer [async deftest is testing]]
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

  (testing "upsert task build create mode supports set semantics"
    (let [scheduled-ms (.getTime (js/Date. "2026-02-10T08:00:00.000Z"))
          deadline-ms (.getTime (js/Date. "2026-02-12T18:00:00.000Z"))
          result (upsert-command/build-task-action {:content "Task from CLI"
                                                    :status "todo"
                                                    :priority "high"
                                                    :scheduled "2026-02-10T08:00:00.000Z"
                                                    :deadline "2026-02-12T18:00:00.000Z"}
                                                   "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= :upsert-task (get-in result [:action :type])))
      (is (= :create (get-in result [:action :mode])))
      (is (= :logseq.property/status.todo (get-in result [:action :update-properties :logseq.property/status])))
      (is (= :logseq.property/priority.high (get-in result [:action :update-properties :logseq.property/priority])))
      (is (= scheduled-ms (get-in result [:action :update-properties :logseq.property/scheduled])))
      (is (= deadline-ms (get-in result [:action :update-properties :logseq.property/deadline])))))

  (testing "upsert task build update mode supports explicit clear semantics"
    (let [result (upsert-command/build-task-action {:id 42
                                                    :no-status true
                                                    :no-priority true
                                                    :no-scheduled true
                                                    :no-deadline true}
                                                   "logseq_db_demo")
          clear-properties (set (get-in result [:action :clear-properties]))]
      (is (true? (:ok? result)))
      (is (= :upsert-task (get-in result [:action :type])))
      (is (= :update (get-in result [:action :mode])))
      (is (= #{:logseq.property/status
               :logseq.property/priority
               :logseq.property/scheduled
               :logseq.property/deadline}
             clear-properties))))

  (testing "upsert task rejects set/no conflicts for the same field"
    (doseq [opts [{:id 42 :status "todo" :no-status true}
                  {:id 42 :priority "high" :no-priority true}
                  {:id 42 :scheduled "2026-02-10T08:00:00.000Z" :no-scheduled true}
                  {:id 42 :deadline "2026-02-12T18:00:00.000Z" :no-deadline true}]]
      (let [result (upsert-command/build-task-action opts "logseq_db_demo")]
        (is (false? (:ok? result)))
        (is (= :invalid-options (get-in result [:error :code]))))))

  (testing "upsert task create defers unknown status to runtime validation"
    (let [result (upsert-command/build-task-action {:content "Task from CLI"
                                                    :status "wat"}
                                                   "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= :upsert-task (get-in result [:action :type])))
      (is (= :create (get-in result [:action :mode])))
      (is (= "wat" (get-in result [:action :status-input])))))

  (testing "upsert task rejects invalid priority with available values"
    (let [result (upsert-command/build-task-action {:content "Task from CLI"
                                                    :priority "wat"}
                                                   "logseq_db_demo")
          message (get-in result [:error :message])]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (string/includes? message "Invalid value for option :priority: wat"))
      (is (string/includes? message "Available values: low, medium, high, urgent")))))

(deftest test-execute-upsert-task-create-invalid-status-includes-available-values
  (async done
    (let [calls* (atom [])
          action {:type :upsert-task
                  :mode :create
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :status-input "invalid-status"}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method _ _]
                                             (swap! calls* conj method)
                                             (case method
                                               :thread-api/q
                                               (p/resolved [:logseq.property/status.todo
                                                            :logseq.property/status.doing
                                                            :logseq.property/status.done])

                                               (throw (ex-info "unexpected invoke"
                                                               {:method method}))))]
            (p/let [result (upsert-command/execute-upsert-task action {})
                    message (or (get-in result [:error :message]) "")]
              (is (= :error (:status result)))
              (is (= :invalid-options (get-in result [:error :code])))
              (is (string/includes? message "Invalid value for option :status: invalid-status"))
              (is (string/includes? message "Available values:"))
              (is (= [:thread-api/q] @calls*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-task-page-applies-task-ops
  (async done
    (let [ops* (atom nil)
          scheduled-ms (.getTime (js/Date. "2026-02-10T08:00:00.000Z"))
          deadline-ms (.getTime (js/Date. "2026-02-12T18:00:00.000Z"))
          action {:type :upsert-task
                  :mode :page
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :page "TaskHome"
                  :status :logseq.property/status.todo
                  :priority :logseq.property/priority.high
                  :scheduled scheduled-ms
                  :deadline deadline-ms}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method _ args]
                                             (case method
                                               :thread-api/q
                                               (p/resolved [:logseq.property/status.todo
                                                            :logseq.property/status.doing
                                                            :logseq.property/status.done])

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
                      [:batch-set-property [[42] :logseq.property/priority :logseq.property/priority.high {}]]
                      [:batch-set-property [[42] :logseq.property/scheduled scheduled-ms {}]]
                      [:batch-set-property [[42] :logseq.property/deadline deadline-ms {}]]]
                     @ops*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-task-page-clears-task-properties
  (async done
    (let [ops* (atom nil)
          action {:type :upsert-task
                  :mode :page
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :page "TaskHome"
                  :clear-properties [:logseq.property/status
                                     :logseq.property/priority
                                     :logseq.property/scheduled
                                     :logseq.property/deadline]}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method _ args]
                                             (case method
                                               :thread-api/pull
                                               (let [[_ selector lookup] args]
                                                 (cond
                                                   (= lookup [:block/name "taskhome"])
                                                   (p/resolved {:db/id 42 :block/uuid (uuid "00000000-0000-0000-0000-000000000042")})

                                                   (= lookup [:db/ident :logseq.class/Task])
                                                   (p/resolved {:db/id 900})

                                                   (and (vector? selector) (= selector [:db/id])
                                                        (vector? lookup) (= :db/ident (first lookup)))
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
              (is (= [[:batch-remove-property [[42] :logseq.property/status]]
                      [:batch-remove-property [[42] :logseq.property/priority]]
                      [:batch-remove-property [[42] :logseq.property/scheduled]]
                      [:batch-remove-property [[42] :logseq.property/deadline]]
                      [:batch-set-property [[42] :block/tags 900 {}]]]
                     @ops*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))
