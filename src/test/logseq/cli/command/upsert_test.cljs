(ns logseq.cli.command.upsert-test
  (:require [clojure.string :as string]
            [cljs.test :refer [async deftest is testing]]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.command.update :as update-command]
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
                          transport/invoke (fn [_ method args]
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

(deftest test-build-asset-action
  (testing "upsert asset create mode derives default title from path"
    (let [result (upsert-command/build-asset-action {:path "/tmp/team-logo.png"}
                                                    "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= :upsert-asset (get-in result [:action :type])))
      (is (= :create (get-in result [:action :mode])))
      (is (= "/tmp/team-logo.png" (get-in result [:action :asset-path])))
      (is (= "team-logo" (get-in result [:action :blocks 0 :block/title])))))

  (testing "upsert asset update mode preserves selector and content"
    (let [result (upsert-command/build-asset-action {:id 42 :content "New title"}
                                                    "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= :upsert-asset (get-in result [:action :type])))
      (is (= :update (get-in result [:action :mode])))
      (is (= 42 (get-in result [:action :id])))
      (is (= "New title" (get-in result [:action :content]))))))

(deftest test-execute-upsert-asset-create-applies-metadata-and-copies-file
  (async done
    (let [add-actions* (atom [])
          copy-calls* (atom [])
          action {:type :upsert-asset
                  :mode :create
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :asset-path "/tmp/logo.png"
                  :content "Logo"
                  :blocks [{:block/title "Logo"}] }]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          upsert-command/asset-file-exists? (fn [_] true)
                          upsert-command/asset-file-size-bytes (fn [_] 123)
                          upsert-command/asset-file-checksum (fn [_] "sha-256-value")
                          upsert-command/copy-asset-file-to-graph! (fn [_ repo block-uuid asset-type source-path]
                                                                     (swap! copy-calls* conj [repo block-uuid asset-type source-path])
                                                                     "/tmp/copied/logo.png")
                          add-command/execute-add-block (fn [add-action _]
                                                          (swap! add-actions* conj add-action)
                                                          (p/resolved {:status :ok
                                                                       :data {:result [101]}}))
                          transport/invoke (fn [_ method args]
                                             (case method
                                               :thread-api/pull
                                               (let [[_ _ lookup] args]
                                                 (cond
                                                   (= lookup 101)
                                                   (p/resolved {:db/id 101
                                                                :block/uuid (uuid "00000000-0000-0000-0000-000000000101")})

                                                   (= lookup [:db/ident :logseq.class/Asset])
                                                   (p/resolved {:db/id 900})

                                                   :else
                                                   (p/resolved {})))

                                               (throw (ex-info "unexpected invoke"
                                                               {:method method
                                                                :args args}))))]
            (p/let [result (upsert-command/execute-upsert-asset action {})
                    block (get-in (first @add-actions*) [:blocks 0])]
              (is (= :ok (:status result)))
              (is (= [101] (get-in result [:data :result])))
              (is (= "png" (:logseq.property.asset/type block)))
              (is (= 123 (:logseq.property.asset/size block)))
              (is (= "sha-256-value" (:logseq.property.asset/checksum block)))
              (is (= #{900} (:block/tags block)))
              (is (= [["demo-repo"
                       (uuid "00000000-0000-0000-0000-000000000101")
                       "png"
                       "/tmp/logo.png"]]
                     @copy-calls*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-asset-update
  (async done
    (let [update-calls* (atom [])
          action {:type :upsert-asset
                  :mode :update
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :id 42
                  :content "Updated title"}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          update-command/execute-update (fn [update-action _]
                                                          (swap! update-calls* conj update-action)
                                                          (p/resolved {:status :ok :data {:result nil}}))
                          transport/invoke (fn [_ method args]
                                             (case method
                                               :thread-api/pull
                                               (let [[_ _ lookup] args]
                                                 (if (= lookup 42)
                                                   (p/resolved {:db/id 42
                                                                :block/uuid (uuid "00000000-0000-0000-0000-000000000042")
                                                                :block/tags [{:db/ident :logseq.class/Asset}]})
                                                   (p/resolved {})))

                                               (throw (ex-info "unexpected invoke"
                                                               {:method method
                                                                :args args}))))]
            (p/let [result (upsert-command/execute-upsert-asset action {})]
              (is (= :ok (:status result)))
              (is (= [42] (get-in result [:data :result])))
              (is (= :update-block (get-in (first @update-calls*) [:type])))
              (is (= 42 (get-in (first @update-calls*) [:id])))
              (is (= "Updated title" (get-in (first @update-calls*) [:content])))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-asset-update-rejects-non-asset-node
  (async done
    (let [action {:type :upsert-asset
                  :mode :update
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :id 42}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method args]
                                             (case method
                                               :thread-api/pull
                                               (let [[_ _ lookup] args]
                                                 (if (= lookup 42)
                                                   (p/resolved {:db/id 42
                                                                :block/uuid (uuid "00000000-0000-0000-0000-000000000042")
                                                                :block/tags [{:db/ident :logseq.class/Task}]})
                                                   (p/resolved {})))

                                               (throw (ex-info "unexpected invoke"
                                                               {:method method
                                                                :args args}))))]
            (p/let [result (upsert-command/execute-upsert-asset action {})
                    message (or (get-in result [:error :message]) "")]
              (is (= :error (:status result)))
              (is (= :upsert-id-type-mismatch (get-in result [:error :code])))
              (is (string/includes? message "#Asset"))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-block-create-does-not-insert-when-tag-missing
  (async done
         (let [mutation-called?* (atom false)
               action {:type :upsert-block
                       :mode :create
                       :repo "demo-repo"
                       :graph "demo-graph"
                       :target-page-name "TestPage"
                       :blocks [{:block/title "b2" :block/uuid (random-uuid)}]
                       :update-tags ["c2"]
                       :pos "last-child"}]
           (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                           (p/resolved (assoc config :base-url "http://example")))
                               transport/invoke (fn [_ method args]
                                                  (case method
                                                    ;; resolve-tags queries for the tag by name
                                                    :thread-api/q
                                                    (p/resolved [])

                                                    :thread-api/pull
                                                    (p/resolved {:db/id 10 :block/uuid (random-uuid)
                                                                 :block/name "testpage" :block/title "TestPage"})

                                                    :thread-api/apply-outliner-ops
                                                    (let [[_ _ops _] args]
                                                      (reset! mutation-called?* true)
                                                      (p/resolved nil))

                                                    (throw (ex-info "unexpected invoke"
                                                                    {:method method :args args}))))]
                 (p/let [result (upsert-command/execute-upsert-block action {})]
                   (is (= :error (:status result))
                       "should return error when tag does not exist")
                   (is (= :tag-not-found (get-in result [:error :code])))
                   (is (false? @mutation-called?*)
                       "block insert must not be called when tag resolution fails")))
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
                          transport/invoke (fn [_ method _]
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
          page-uuid (uuid "00000000-0000-0000-0000-000000000042")
          block-uuids [page-uuid]
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
                          transport/invoke (fn [_ method args]
                                             (case method
                                               :thread-api/q
                                               (let [[_ [_query input]] args]
                                                 (if (= input "taskhome")
                                                   (p/resolved [{:db/id 42 :block/uuid page-uuid}])
                                                   (p/resolved [:logseq.property/status.todo
                                                                :logseq.property/status.doing
                                                                :logseq.property/status.done])))

                                               :thread-api/pull
                                               (let [[_ selector lookup] args]
                                                 (cond
                                                   (= lookup [:block/name "taskhome"])
                                                   (p/resolved {:db/id 42 :block/uuid page-uuid})

                                                   (and (= selector [:db/id :block/uuid])
                                                        (= lookup 42))
                                                   (p/resolved {:db/id 42 :block/uuid page-uuid})

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
              (is (= [[:batch-set-property [block-uuids :block/tags 900 {}]]
                      [:batch-set-property [block-uuids :logseq.property/status :logseq.property/status.todo {}]]
                      [:batch-set-property [block-uuids :logseq.property/priority :logseq.property/priority.high {}]]
                      [:batch-set-property [block-uuids :logseq.property/scheduled scheduled-ms {}]]
                      [:batch-set-property [block-uuids :logseq.property/deadline deadline-ms {}]]]
                     @ops*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-task-page-applies-update-properties-map
  (async done
    (let [ops* (atom nil)
          page-uuid (uuid "00000000-0000-0000-0000-000000000042")
          block-uuids [page-uuid]
          scheduled-ms (.getTime (js/Date. "2026-02-10T08:00:00.000Z"))
          deadline-ms (.getTime (js/Date. "2026-02-12T18:00:00.000Z"))
          action {:type :upsert-task
                  :mode :page
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :page "TaskHome"
                  :update-properties {:logseq.property/status :logseq.property/status.todo
                                      :logseq.property/priority :logseq.property/priority.high
                                      :logseq.property/scheduled scheduled-ms
                                      :logseq.property/deadline deadline-ms}}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method args]
                                             (case method
                                               :thread-api/q
                                               (let [[_ [_query input]] args]
                                                 (if (= input "taskhome")
                                                   (p/resolved [{:db/id 42 :block/uuid page-uuid}])
                                                   (p/resolved [])))

                                               :thread-api/pull
                                               (let [[_ selector lookup] args]
                                                 (cond
                                                   (= lookup [:block/name "taskhome"])
                                                   (p/resolved {:db/id 42 :block/uuid page-uuid})

                                                   (and (= selector [:db/id :block/uuid])
                                                        (= lookup 42))
                                                   (p/resolved {:db/id 42 :block/uuid page-uuid})

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
              (is (= [[:batch-set-property [block-uuids :block/tags 900 {}]]
                      [:batch-set-property [block-uuids :logseq.property/status :logseq.property/status.todo {}]]
                      [:batch-set-property [block-uuids :logseq.property/priority :logseq.property/priority.high {}]]
                      [:batch-set-property [block-uuids :logseq.property/scheduled scheduled-ms {}]]
                      [:batch-set-property [block-uuids :logseq.property/deadline deadline-ms {}]]]
                     @ops*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-task-page-clears-task-properties
  (async done
    (let [ops* (atom nil)
          page-uuid (uuid "00000000-0000-0000-0000-000000000042")
          block-uuids [page-uuid]
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
                          transport/invoke (fn [_ method args]
                                             (case method
                                               :thread-api/q
                                               (let [[_ [_query input]] args]
                                                 (if (= input "taskhome")
                                                   (p/resolved [{:db/id 42 :block/uuid page-uuid}])
                                                   (p/resolved [])))

                                               :thread-api/pull
                                               (let [[_ selector lookup] args]
                                                 (cond
                                                   (= lookup [:block/name "taskhome"])
                                                   (p/resolved {:db/id 42 :block/uuid page-uuid})

                                                   (and (= selector [:db/id :block/uuid])
                                                        (= lookup 42))
                                                   (p/resolved {:db/id 42 :block/uuid page-uuid})

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
              (is (= [[:batch-remove-property [block-uuids :logseq.property/status]]
                      [:batch-remove-property [block-uuids :logseq.property/priority]]
                      [:batch-remove-property [block-uuids :logseq.property/scheduled]]
                      [:batch-remove-property [block-uuids :logseq.property/deadline]]
                      [:batch-set-property [block-uuids :block/tags 900 {}]]]
                     @ops*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-task-update-applies-task-ops
  (async done
    (let [ops* (atom nil)
          node-uuid (uuid "00000000-0000-0000-0000-000000000243")
          block-uuids [node-uuid]
          action {:type :upsert-task
                  :mode :update
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :id 243
                  :status :logseq.property/status.todo
                  :priority :logseq.property/priority.high}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method args]
                                             (case method
                                               :thread-api/q
                                               (p/resolved [:logseq.property/status.todo
                                                            :logseq.property/status.doing
                                                            :logseq.property/status.done])

                                               :thread-api/pull
                                               (let [[_ selector lookup] args]
                                                 (cond
                                                   (= lookup 243)
                                                   (p/resolved {:db/id 243 :block/uuid node-uuid})

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
              (is (= [243] (get-in result [:data :result])))
              (is (= [[:batch-set-property [block-uuids :block/tags 900 {}]]
                      [:batch-set-property [block-uuids :logseq.property/status :logseq.property/status.todo {}]]
                      [:batch-set-property [block-uuids :logseq.property/priority :logseq.property/priority.high {}]]]
                     @ops*))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-block-create-invalid-update-properties-is-atomic
  (async done
    (let [mutation-called?* (atom false)
          action {:type :upsert-block
                  :mode :create
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :target-page-name "Home"
                  :blocks [{:block/title "Atomic block" :block/uuid (random-uuid)}]
                  :update-tags ["TagOne"]
                  :update-properties {:missing-prop "value"}
                  :pos "last-child"}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          add-command/resolve-tags (fn [_ _ _]
                                                     (p/resolved [{:db/id 100}]))
                          add-command/resolve-properties (fn [_ _ _]
                                                           (p/rejected (ex-info "property not found"
                                                                                {:code :property-not-found
                                                                                 :property :missing-prop})))
                          add-command/execute-add-block (fn [_ _]
                                                          (reset! mutation-called?* true)
                                                          (p/resolved {:status :ok
                                                                       :data {:result [1001]}}))]
            (p/let [result (upsert-command/execute-upsert-block action {})]
              (is (= :error (:status result)))
              (is (= :property-not-found (get-in result [:error :code])))
              (is (= "--update-properties" (get-in result [:error :option])))
              (is (= :resolve-options (get-in result [:error :phase])))
              (is (= :missing-prop (get-in result [:error :property])))
              (is (false? @mutation-called?*)
                  "must not mutate when one option fails")))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-page-create-invalid-update-properties-is-atomic
  (async done
    (let [mutation-called?* (atom false)
          action {:type :upsert-page
                  :mode :create
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :page "AtomicPage"
                  :update-tags ["TagOne"]
                  :update-properties {:missing-prop "value"}}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          add-command/resolve-tags (fn [_ _ tags]
                                                     (if (seq tags)
                                                       (p/resolved [{:db/id 100}])
                                                       (p/resolved nil)))
                          add-command/resolve-properties (fn [_ _ _]
                                                           (p/rejected (ex-info "property not found"
                                                                                {:code :property-not-found
                                                                                 :property :missing-prop})))
                          transport/invoke (fn [_ method _]
                                             (when (= :thread-api/apply-outliner-ops method)
                                               (reset! mutation-called?* true))
                                             (throw (ex-info "unexpected invoke"
                                                             {:method method})))]
            (p/let [result (upsert-command/execute-upsert-page action {})]
              (is (= :error (:status result)))
              (is (= :property-not-found (get-in result [:error :code])))
              (is (= "--update-properties" (get-in result [:error :option])))
              (is (= :resolve-options (get-in result [:error :phase])))
              (is (= :missing-prop (get-in result [:error :property])))
              (is (false? @mutation-called?*)
                  "must not mutate page when one option fails")))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest test-execute-upsert-task-page-invalid-status-fails-before-mutation
  (async done
    (let [calls* (atom [])
          action {:type :upsert-task
                  :mode :page
                  :repo "demo-repo"
                  :graph "demo-graph"
                  :page "TaskHome"
                  :status-input "invalid-status"
                  :priority :logseq.property/priority.high}]
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config _repo]
                                                      (p/resolved (assoc config :base-url "http://example")))
                          transport/invoke (fn [_ method _]
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
              (is (= "--status" (get-in result [:error :option])))
              (is (= :validate-options (get-in result [:error :phase])))
              (is (string/includes? message "invalid-status"))
              (is (= [:thread-api/q] @calls*)
                  "must fail before page resolution or mutation")))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))


