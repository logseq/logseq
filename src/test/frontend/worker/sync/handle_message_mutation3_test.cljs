(ns frontend.worker.sync.handle-message-mutation3-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.assets :as sync-assets]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.handle-message :as sync-handle-message]
            [frontend.worker.sync.log-and-state :as sync-log-state]
            [frontend.worker.sync.presence :as sync-presence]
            [frontend.worker.sync.transport :as sync-transport]
            [frontend.worker.sync.util :as sync-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(def ^:private repo "test-repo")
(def ^:private tx-a #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
(def ^:private tx-b #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
(def ^:private tx-c #uuid "cccccccc-cccc-cccc-cccc-cccccccccccc")
(def ^:private tx-x #uuid "dddddddd-dddd-dddd-dddd-dddddddddddd")
(def ^:private block-uuid #uuid "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")

(defn- <outcome
  "Calls f; resolves to its value, or to {::error e} when it throws or rejects."
  [f]
  (-> (p/resolved nil)
      (p/then (fn [_] (f)))
      (p/catch (fn [error] {::error error}))))

(defn- finish [promise done]
  (-> promise
      (p/catch (fn [error] (is false (str "unexpected error: " error))))
      (p/finally done)))

(defn- error-of [outcome]
  (::error outcome))

(defn- error-info [outcome]
  (let [error (error-of outcome)]
    [(ex-message error) (ex-data error)]))

(defn- <spied
  "Calls f with the collaborators of handle-message redefined into spies that
  record [kind & args] into the calls vector; env sets what they answer.
  Resolves to {:result .. :calls ..}."
  [env f]
  (let [calls* (atom [])
        record! (fn [& entry] (swap! calls* conj (vec entry)))
        env (merge {:local-tx 5
                    :pending-count 0
                    :local-checksum "local-checksum"
                    :ws-open? true
                    :e2ee? false
                    :aes-key nil
                    :user-uuid "me"
                    :pending-txs []}
                   env)]
    (p/let [result (p/with-redefs [shared-service/broadcast-to-clients! (fn [kind payload] (record! :broadcast kind payload))
                                   worker-state/get-id-token (fn [] "id-token")
                                   worker-state/online? (fn [] true)
                                   sync-auth/get-user-uuid (fn [_token] (:user-uuid env))
                                   sync-presence/rtc-state-payload (fn [_counts-f client] {:rtc-state-of client})
                                   sync-presence/update-online-users! (fn [_broadcast-f client users]
                                                                        (record! :update-online-users client users))
                                   sync-presence/update-user-presence! (fn [_broadcast-f client user-id editing-block-uuid]
                                                                         (record! :update-user-presence client user-id editing-block-uuid))
                                   sync-presence/current-client (fn [state repo']
                                                                  (record! :current-client state repo')
                                                                  :current-client-result)
                                   sync-transport/send! (fn [_coerce-f ws message] (record! :send ws message))
                                   sync-transport/ws-open? (fn [ws]
                                                             (let [open? (:ws-open? env)]
                                                               (if (fn? open?) (open? ws) open?)))
                                   client-op/get-local-tx (fn [_repo] (:local-tx env))
                                   client-op/get-pending-local-tx-count (fn [_repo] (:pending-count env))
                                   client-op/get-local-checksum (fn [_repo] (:local-checksum env))
                                   client-op/update-local-tx (fn [repo' tx] (record! :update-local-tx repo' tx))
                                   sync-apply/clear-upload-response-timeout! (fn [client] (record! :clear-upload-response-timeout client))
                                   sync-apply/ack-upload-response! (fn [repo' client] (record! :ack-upload-response repo' client))
                                   sync-apply/mark-pending-txs-false! (fn [repo' tx-ids] (record! :mark-pending-txs-false repo' tx-ids))
                                   sync-apply/rollback-and-mark-failed-txs! (fn [repo' tx-ids] (record! :rollback-and-mark-failed repo' tx-ids))
                                   sync-apply/enqueue-flush-pending! (fn [repo' client] (record! :enqueue-flush-pending repo' client))
                                   sync-apply/pending-txs (fn [_repo _opts] (:pending-txs env))
                                   sync-apply/apply-remote-txs! (fn [repo' client txs]
                                                                  (record! :apply-remote-txs repo' client txs)
                                                                  (when (:apply-throws? env)
                                                                    (throw (ex-info "apply failed" {}))))
                                   sync-assets/enqueue-asset-sync! (fn [repo' client opts]
                                                                     (record! :enqueue-asset-sync repo' client (set (keys opts)))
                                                                     (record! :asset-task-fn (identical? sync-assets/enqueue-asset-task!
                                                                                                         (:enqueue-asset-task-f opts)))
                                                                     (record! :asset-current-client ((:current-client-f opts) repo'))
                                                                     ((:broadcast-rtc-state!-f opts) client)
                                                                     (try ((:fail-fast-f opts) :db-sync/asset-failure {:a 1})
                                                                          (catch :default e
                                                                            (record! :asset-fail-fast (ex-message e) (ex-data e)))))
                                   sync-log-state/rtc-log (fn [kind payload] (record! :rtc-log kind payload))
                                   sync-util/clear-last-sync-error! (fn [client] (record! :clear-last-sync-error client))
                                   sync-util/set-last-sync-error! (fn [client error] (record! :set-last-sync-error client error))
                                   sync-crypt/graph-e2ee? (fn [_repo] (:e2ee? env))
                                   sync-crypt/<ensure-graph-aes-key (fn [repo' graph-id]
                                                                      (record! :ensure-aes-key repo' graph-id)
                                                                      (p/resolved (:aes-key env)))
                                   sync-crypt/<decrypt-tx-data (fn [aes-key tx-data]
                                                                 (p/resolved [:decrypted aes-key tx-data]))]
                     (<outcome f))]
      {:result result :calls @calls*})))

(defn- calls-of [calls kind]
  (filterv #(= kind (first %)) calls))

(defn- new-client
  ([] (new-client {}))
  ([overrides]
   (merge {:repo repo
           :graph-id "graph-1"
           :inflight (atom [])
           :ws :ws}
          overrides)))

;; ---------------------------------------------------------------- wrappers

;; Fails if, in `sync-counts`, the body becomes `nil`, the `:get-client-ops-conn` key is dropped, the `:get-pending-local-tx-count` key is dropped, the `:get-missing-asset-upload-files` key is dropped, the `:get-local-checksum` key is dropped, the `:latest-remote-tx` key is dropped or the `:latest-remote-checksum` key is dropped.
(deftest sync-counts-hands-the-worker-accessors-to-presence-test
  (let [orig-tx @sync-apply/*repo->latest-remote-tx
        orig-checksum @sync-apply/*repo->latest-remote-checksum]
    (try
      (reset! sync-apply/*repo->latest-remote-tx {repo 7})
      (reset! sync-apply/*repo->latest-remote-checksum {repo "c7"})
      (with-redefs [sync-presence/sync-counts (fn [config repo'] [config repo'])]
        (is (= [{:get-datascript-conn worker-state/get-datascript-conn
                 :get-client-ops-conn worker-state/get-client-ops-conn
                 :get-pending-local-tx-count client-op/get-pending-local-tx-count
                 :get-unpushed-asset-ops-count client-op/get-unpushed-asset-ops-count
                 :get-missing-asset-upload-files sync-assets/get-missing-asset-upload-files
                 :get-local-tx client-op/get-local-tx
                 :get-local-checksum client-op/get-local-checksum
                 :get-graph-uuid client-op/get-graph-uuid
                 :latest-remote-tx {repo 7}
                 :latest-remote-checksum {repo "c7"}}
                repo]
               (#'sync-handle-message/sync-counts repo))))
      (finally
        (reset! sync-apply/*repo->latest-remote-tx orig-tx)
        (reset! sync-apply/*repo->latest-remote-checksum orig-checksum)))))

;; Fails if, in `enqueue-send-task!`, the `(p/catch (fn [_] nil))` step is dropped.
(deftest enqueue-send-task-runs-the-task-after-earlier-failures-test
  (async done
         (let [ran* (atom 0)
               task (fn [] (swap! ran* inc))
               failed-queue (atom (p/rejected (ex-info "previous task failed" {})))
               empty-queue (atom nil)]
           (finish
            (p/let [_ (#'sync-handle-message/enqueue-send-task! {:repo repo :send-queue failed-queue} task)
                    _ @failed-queue
                    _ (#'sync-handle-message/enqueue-send-task! {:repo repo :send-queue empty-queue} task)
                    _ @empty-queue]
              (is (= 2 @ran*))
              (#'sync-handle-message/enqueue-send-task! {:repo repo} task)
              (is (= 3 @ran*)))
            done))))

;; Fails if, in `enqueue-send-task!`, `or` becomes `and`.
(deftest enqueue-send-task-runs-a-task-after-the-previous-one-finishes-test
  (async done
         (let [events (atom [])
               queue (atom nil)
               client {:repo repo :send-queue queue}]
           (#'sync-handle-message/enqueue-send-task!
            client
            (fn []
              (swap! events conj :first-start)
              (p/let [_ (p/delay 20)]
                (swap! events conj :first-end))))
           (#'sync-handle-message/enqueue-send-task!
            client
            (fn [] (swap! events conj :second-start)))
           (finish
            (p/let [_ @queue]
              (is (= [:first-start :first-end :second-start] @events)))
            done))))

;; Fails if, in `enqueue-send-task!`, the `(p/catch (fn [error]` step is dropped.
(deftest enqueue-send-task-swallows-a-failing-task-test
  (async done
         (let [queue (atom nil)]
           (finish
            (p/let [outcome (<outcome #(#'sync-handle-message/enqueue-send-task!
                                         {:repo repo :send-queue queue}
                                         (fn [] (throw (ex-info "task failed" {})))))]
              (is (nil? (error-of outcome))))
            done))))

;; ----------------------------------------------------------------- requires

(defn- thrown [f]
  (try (f) nil (catch :default e e)))

;; Fails if, in `require-number`, the body becomes `nil` or `:db-sync/invalid-field` becomes `:db-sync/missing-field`.
;; Fails if, in `require-seq`, the body becomes `nil`.
(deftest require-fns-fail-fast-with-the-context-and-value-test
  (doseq [[require-f bad good] [[#'sync-handle-message/require-number "x" 1]
                                [#'sync-handle-message/require-non-negative "x" 0]
                                [#'sync-handle-message/require-seq "x" []]
                                [#'sync-handle-message/require-uuid "x" tx-a]]]
    (let [error (thrown #(require-f bad {:repo repo}))]
      (is (= "invalid-field" (ex-message error)))
      (is (= {:repo repo :value "x"} (ex-data error)))
      (is (nil? (require-f good {:repo repo})))))
  (let [error (thrown #(#'sync-handle-message/require-non-negative -1 {:repo repo}))]
    (is (= "invalid-field" (ex-message error)))
    (is (= {:repo repo :value -1} (ex-data error)))))

;; ------------------------------------------------------------- request-pull!

;; Fails if, in `request-pull!`, `and` becomes `or`.
(deftest request-pull-sends-only-over-an-open-ws-test
  (async done
         (finish
          (p/let [no-ws (<spied {} #(#'sync-handle-message/request-pull! {} 3))
                  closed (<spied {:ws-open? false} #(#'sync-handle-message/request-pull! (new-client) 3))
                  open (<spied {} #(#'sync-handle-message/request-pull! (new-client) 3))
                  closes-before-send (<spied {:ws-open? (let [n (atom 0)]
                                                          (fn [_ws] (< (swap! n inc) 2)))}
                                             #(#'sync-handle-message/request-pull! (new-client) 3))]
            (is (nil? (error-of (:result no-ws))))
            (is (= [] (calls-of (:calls no-ws) :send)))
            (is (= [] (calls-of (:calls closed) :send)))
            (is (= [[:send :ws {:type "pull" :since 3}]] (calls-of (:calls open) :send)))
            (is (= [] (calls-of (:calls closes-before-send) :send))))
          done)))

;; Fails if, in `pending-local-tx?`, `or` becomes `and` or the body becomes `nil`.
(deftest pending-local-tx-is-true-only-for-a-positive-count-test
  (async done
         (finish
          (p/let [none (<spied {:pending-count nil} #(#'sync-handle-message/pending-local-tx? repo))
                  some-txs (<spied {:pending-count 2} #(#'sync-handle-message/pending-local-tx? repo))]
            (is (false? (:result none)))
            (is (true? (:result some-txs))))
          done)))

;; ------------------------------------------------------ verify-sync-checksum!

;; Fails if, in `verify-sync-checksum!`, the `:type` key is dropped, the `:repo` key is dropped, the `:local-tx` key is dropped, the `:remote-tx` key is dropped or `:db-sync/checksum-mismatch` becomes `:db-sync/handle-hello`.
(deftest verify-sync-checksum-logs-a-mismatch-only-when-in-sync-test
  (async done
         (finish
          (p/let [mismatch (<spied {} #(#'sync-handle-message/verify-sync-checksum!
                                        repo (new-client) 5 5 "remote-checksum" {:type "hello"}))
                  matching (<spied {} #(#'sync-handle-message/verify-sync-checksum!
                                        repo (new-client) 5 5 "local-checksum" {:type "hello"}))
                  behind (<spied {} #(#'sync-handle-message/verify-sync-checksum!
                                      repo (new-client) 4 5 "remote-checksum" {:type "hello"}))]
            (is (= [[:rtc-log :rtc.log/checksum-mismatch
                     {:type :db-sync/checksum-mismatch
                      :repo repo
                      :message-type "hello"
                      :local-tx 5
                      :remote-tx 5
                      :local-checksum "local-checksum"
                      :remote-checksum "remote-checksum"}]]
                   (:calls mismatch)))
            (is (= [] (:calls matching)))
            (is (= [] (:calls behind))))
          done)))

;; -------------------------------------------------------- handle-tx-reject!

;; Fails if, in `handle-tx-reject!`, `when` becomes `when-not`, `and` becomes `or`, `seq` becomes `empty?`, `some?` becomes `nil?`, the `(filter inflight-set)` step is dropped, the `vec` step is dropped, the `:repo` key is dropped, the `:message-type` key is dropped or `:db-sync/tx-rejected` becomes `:db-sync/checksum-mismatch`.
(deftest handle-tx-reject-marks-inflight-txs-and-fails-with-the-reject-data-test
  (async done
         (finish
          (p/let [full (<spied {} #(#'sync-handle-message/handle-tx-reject!
                                    repo
                                    (new-client {:inflight (atom [tx-a tx-b tx-c])})
                                    {:reason "db transact failed"
                                     :t 3
                                     :success-tx-ids [tx-a tx-x]
                                     :failed-tx-id tx-b
                                     :missing-block-uuids [block-uuid]
                                     :error-detail "detail"
                                     :data (sqlite-util/write-transit-str {:k 1})}))
                  unknown-ids (<spied {} #(#'sync-handle-message/handle-tx-reject!
                                           repo
                                           (new-client {:inflight (atom [tx-a])})
                                           {:reason "other" :success-tx-ids [tx-x] :failed-tx-id tx-x}))
                  legacy (<spied {} #(#'sync-handle-message/handle-tx-reject!
                                      repo
                                      (new-client {:inflight (atom [tx-a])})
                                      {:reason "other"}))
                  stale (<spied {} #(#'sync-handle-message/handle-tx-reject!
                                     repo (new-client {:inflight (atom [tx-a])}) {:reason "stale"} 5))]
            (let [expected {:type :db-sync/tx-rejected
                            :repo repo
                            :message-type "tx/reject"
                            :reason "db transact failed"
                            :t 3
                            :success-tx-ids [tx-a]
                            :failed-tx-id tx-b
                            :missing-block-uuids [block-uuid]
                            :error-detail "detail"
                            :data {:k 1}}
                  calls (:calls full)]
              (is (= ["tx-rejected" expected] (error-info (:result full))))
              (is (= [:mark-pending-txs-false repo [tx-a]] (nth (calls-of calls :mark-pending-txs-false) 0)))
              (is (vector? (nth (first (calls-of calls :mark-pending-txs-false)) 2)))
              (is (= [[:rollback-and-mark-failed repo [tx-b]]] (calls-of calls :rollback-and-mark-failed)))
              (is (= [[:rtc-log :rtc.log/tx-rejected expected]] (calls-of calls :rtc-log)))
              (is (= 1 (count (calls-of calls :broadcast)))))
            (is (= ["tx-rejected" {:type :db-sync/tx-rejected
                                   :repo repo
                                   :message-type "tx/reject"
                                   :reason "other"}]
                   (error-info (:result unknown-ids))))
            (is (= [[:mark-pending-txs-false repo []]] (calls-of (:calls unknown-ids) :mark-pending-txs-false)))
            (is (= [] (calls-of (:calls unknown-ids) :rollback-and-mark-failed)))
            (is (= [[:rollback-and-mark-failed repo [tx-a]]] (calls-of (:calls legacy) :rollback-and-mark-failed)))
            (is (= [] (calls-of (:calls legacy) :mark-pending-txs-false)))
            (is (= [[:send :ws {:type "pull" :since 5}]] (calls-of (:calls stale) :send)))
            (is (= [] (calls-of (:calls stale) :rollback-and-mark-failed))))
          done)))

;; Fails if, in `require-seq`, `:db-sync/invalid-field` becomes `:db-sync/missing-field`.
;; Fails if, in `require-uuid`, the body becomes `nil` or `:db-sync/invalid-field` becomes `:db-sync/missing-field`.
;; Fails if, in `handle-tx-reject!`, `:db-sync/missing-field` becomes `:db-sync/response-parse-failed`, the `:repo` key is dropped, the `:type` key is dropped, the `:field` key is dropped or the `:reason` key is dropped.
(deftest handle-tx-reject-validates-the-message-fields-test
  (async done
         (finish
          (p/let [reject! (fn [message]
                            (p/let [{:keys [result]} (<spied {} #(#'sync-handle-message/handle-tx-reject!
                                                                  repo (new-client) message 5))]
                              (error-info result)))
                  no-reason (reject! {})
                  negative-t (reject! {:reason "r" :t -1})
                  success-not-seq (reject! {:reason "r" :success-tx-ids "x"})
                  success-not-uuid (reject! {:reason "r" :success-tx-ids ["x"]})
                  failed-not-uuid (reject! {:reason "r" :failed-tx-id "x"})
                  missing-not-seq (reject! {:reason "r" :missing-block-uuids "x"})
                  missing-not-uuid (reject! {:reason "r" :missing-block-uuids ["x"]})
                  bad-data (reject! {:reason "r" :data "not transit"})]
            (is (= ["missing-field" {:repo repo :type "tx/reject" :field :reason}] no-reason))
            (is (= ["invalid-field" {:repo repo :type "tx/reject" :value -1}] negative-t))
            (is (= ["invalid-field" {:repo repo :type "tx/reject" :field :success-tx-ids :value "x"}] success-not-seq))
            (is (= ["invalid-field" {:repo repo :type "tx/reject" :field :success-tx-ids :value "x"}] success-not-uuid))
            (is (= ["invalid-field" {:repo repo :type "tx/reject" :field :failed-tx-id :value "x"}] failed-not-uuid))
            (is (= ["invalid-field" {:repo repo :type "tx/reject" :field :missing-block-uuids :value "x"}] missing-not-seq))
            (is (= ["invalid-field" {:repo repo :type "tx/reject" :field :missing-block-uuids :value "x"}] missing-not-uuid))
            (is (= "response-parse-failed" (first bad-data)))
            (is (= {:repo repo :type "tx/reject" :reason "r" :field :data}
                   (dissoc (second bad-data) :error))))
          done)))

;; ------------------------------------------------------------- other handlers

;; Fails if, in `handle-hello!`, `when` becomes `when-not`, `>` becomes `>=`, the body becomes `nil`, the `:repo` key is dropped, the `:type` key is dropped, the `:enqueue-asset-task-f` key is dropped, the `:current-client-f` key is dropped, the `:broadcast-rtc-state!-f` key is dropped or the `:fail-fast-f` key is dropped.
;; Fails if, in `current-client`, the body becomes `nil`.
;; Fails if, in `require-non-negative`, the body becomes `nil` or `:db-sync/invalid-field` becomes `:db-sync/missing-field`.
(deftest handle-hello-requests-a-pull-and-enqueues-asset-and-flush-work-test
  (async done
         (finish
          (p/let [in-sync (<spied {} #(#'sync-handle-message/handle-hello! repo (new-client) 5 5 "remote-checksum"))
                  ahead (<spied {} #(#'sync-handle-message/handle-hello! repo (new-client) 5 7 "remote-checksum"))
                  negative (<spied {} #(#'sync-handle-message/handle-hello! repo (new-client) 5 -1 nil))]
            (is (= [] (calls-of (:calls in-sync) :send)))
            (is (= [[:send :ws {:type "pull" :since 5}]] (calls-of (:calls ahead) :send)))
            (is (= [:rtc-log :rtc.log/checksum-mismatch]
                   (take 2 (first (calls-of (:calls in-sync) :rtc-log)))))
            (is (= "hello" (:message-type (nth (first (calls-of (:calls in-sync) :rtc-log)) 2))))
            (is (= #{:enqueue-asset-task-f :current-client-f :broadcast-rtc-state!-f :fail-fast-f}
                   (nth (first (calls-of (:calls in-sync) :enqueue-asset-sync)) 3)))
            (is (= [[:asset-task-fn true]] (calls-of (:calls in-sync) :asset-task-fn)))
            (is (= [[:asset-current-client :current-client-result]] (calls-of (:calls in-sync) :asset-current-client)))
            (is (= [[:asset-fail-fast "asset-failure" {:a 1}]] (calls-of (:calls in-sync) :asset-fail-fast)))
            (is (= 2 (count (calls-of (:calls in-sync) :broadcast))))
            (is (= 1 (count (calls-of (:calls in-sync) :enqueue-flush-pending))))
            (is (= ["invalid-field" {:repo repo :type "hello" :value -1}]
                   (error-info (:result negative)))))
          done)))

;; Fails if, in `handle-online-users!`, `when` becomes `when-not`, `and` becomes `or`, `some?` becomes `nil?`, `not` becomes `identity`, `or` becomes `and`, the body becomes `nil`, `:db-sync/invalid-field` becomes `:db-sync/missing-field`, the `:repo` key is dropped, the `:type` key is dropped or the `:field` key is dropped.
;; Fails if, in `update-online-users!`, the body becomes `nil`.
(deftest handle-online-users-validates-and-defaults-users-test
  (async done
         (finish
          (p/let [absent (<spied {} #(#'sync-handle-message/handle-online-users! repo :client {}))
                  present (<spied {} #(#'sync-handle-message/handle-online-users! repo :client {:online-users [{:user-id "u1"}]}))
                  invalid (<spied {} #(#'sync-handle-message/handle-online-users! repo :client {:online-users "u1"}))]
            (is (= [[:update-online-users :client []]] (:calls absent)))
            (is (= [[:update-online-users :client [{:user-id "u1"}]]] (:calls present)))
            (is (= ["invalid-field" {:repo repo :type "online-users" :field :online-users}]
                   (error-info (:result invalid))))
            (is (= [] (:calls invalid))))
          done)))

;; Fails if, in `handle-tx-batch-ok!`, the `:repo` key is dropped or the `:type` key is dropped.
(deftest handle-tx-batch-ok-advances-local-tx-and-flushes-test
  (async done
         (finish
          (p/let [client (new-client {:inflight (atom [tx-a])})
                  ok (<spied {} #(#'sync-handle-message/handle-tx-batch-ok! repo client 7 "remote-checksum"))
                  negative (<spied {} #(#'sync-handle-message/handle-tx-batch-ok! repo (new-client) -1 nil))]
            (is (= [:ack-upload-response :update-local-tx :clear-last-sync-error :mark-pending-txs-false
                    :broadcast :rtc-log :enqueue-flush-pending]
                   (mapv first (:calls ok))))
            (is (= [:update-local-tx repo 7] (nth (:calls ok) 1)))
            (is (= [:mark-pending-txs-false repo [tx-a]] (nth (:calls ok) 3)))
            (is (= [] @(:inflight client)))
            (is (= "tx/batch/ok" (:message-type (nth (nth (:calls ok) 5) 2))))
            (is (= ["invalid-field" {:repo repo :type "tx/batch/ok" :value -1}]
                   (error-info (:result negative)))))
          done)))

;; Fails if, in `handle-changed!`, `<` becomes `<=`, the `:repo` key is dropped or the `:type` key is dropped.
(deftest handle-changed-requests-a-pull-only-when-behind-test
  (async done
         (finish
          (p/let [equal (<spied {} #(#'sync-handle-message/handle-changed! repo (new-client) 5 5))
                  behind (<spied {} #(#'sync-handle-message/handle-changed! repo (new-client) 4 5))
                  negative (<spied {} #(#'sync-handle-message/handle-changed! repo (new-client) 4 -1))]
            (is (= [] (calls-of (:calls equal) :send)))
            (is (= [[:send :ws {:type "pull" :since 4}]] (calls-of (:calls behind) :send)))
            (is (= ["invalid-field" {:repo repo :type "changed" :value -1}]
                   (error-info (:result negative)))))
          done)))

;; ------------------------------------------------- latest remote state, routing

;; Fails if, in `update-latest-remote-state!`, `and` becomes `or`, `<` becomes `<=`, the `:stale-remote-tx?` key is dropped or the `:latest-remote-tx-before` key is dropped.
(deftest update-latest-remote-state-tracks-staleness-test
  (let [orig-tx @sync-apply/*repo->latest-remote-tx
        orig-checksum @sync-apply/*repo->latest-remote-checksum]
    (try
      (reset! sync-apply/*repo->latest-remote-tx {repo 10})
      (reset! sync-apply/*repo->latest-remote-checksum {})
      (is (= {:stale-remote-tx? true :latest-remote-tx-before 10}
             (#'sync-handle-message/update-latest-remote-state! repo {:type "pull/ok" :t 8 :checksum "c8"})))
      (is (= {repo 10} @sync-apply/*repo->latest-remote-tx))
      (is (= {} @sync-apply/*repo->latest-remote-checksum))
      (is (= {:stale-remote-tx? false :latest-remote-tx-before 10}
             (#'sync-handle-message/update-latest-remote-state! repo {:type "pull/ok" :t 10 :checksum "c10"})))
      (is (= {repo "c10"} @sync-apply/*repo->latest-remote-checksum))
      (is (= {:stale-remote-tx? false :latest-remote-tx-before 10}
             (#'sync-handle-message/update-latest-remote-state! repo {:type "hello" :t 3 :checksum "c3"})))
      (is (= {repo 3} @sync-apply/*repo->latest-remote-tx))
      (is (= {repo "c3"} @sync-apply/*repo->latest-remote-checksum))
      (is (= {:stale-remote-tx? false :latest-remote-tx-before 3}
             (#'sync-handle-message/update-latest-remote-state! repo {:type "pong"})))
      (finally
        (reset! sync-apply/*repo->latest-remote-tx orig-tx)
        (reset! sync-apply/*repo->latest-remote-checksum orig-checksum)))))

;; Fails if, in `validate-local-tx!`, `when` becomes `when-not`, `and` becomes `or`, the body becomes `nil`, the `:repo` key is dropped, the `:message-type` key is dropped or the `:local-tx` key is dropped.
(deftest validate-local-tx-rejects-invalid-local-tx-for-sync-messages-test
  (let [error (thrown #(#'sync-handle-message/validate-local-tx! repo {:type "hello"} -1))]
    (is (= "Invalid local tx" (ex-message error)))
    (is (= {:repo repo :message-type "hello" :local-tx -1} (ex-data error))))
  (is (some? (thrown #(#'sync-handle-message/validate-local-tx! repo {:type "changed"} 1.5))))
  (is (some? (thrown #(#'sync-handle-message/validate-local-tx! repo {:type "pull/ok"} nil))))
  (is (nil? (thrown #(#'sync-handle-message/validate-local-tx! repo {:type "hello"} 0))))
  (is (nil? (thrown #(#'sync-handle-message/validate-local-tx! repo {:type "pong"} -1)))))

;; Fails if, in `handle-message!`, `:db-sync/response-parse-failed` becomes `:db-sync/send-queue-task-failed`, the `:repo` key is dropped or the `:raw` key is dropped.
(deftest handle-message-fails-fast-on-unparseable-messages-test
  (async done
         (finish
          (p/let [{:keys [result]} (<spied {} #(sync-handle-message/handle-message! repo (new-client) "not json"))]
            (is (= ["response-parse-failed" {:repo repo :raw "not json"}]
                   (error-info result))))
          done)))

;; ------------------------------------------------------------ handle-pull-ok!

(defn- pull-message [& txs]
  {:txs (mapv (fn [[t op tx-data]]
                {:t t :outliner-op op :tx (sqlite-util/write-transit-str tx-data)})
              txs)})

;; Fails if, in `handle-pull-ok!`, `>` becomes `>=`, `when` becomes `when-not`, `and` becomes `or`, `nil?` becomes `some?`, `if` becomes `if-not`, the `:t` key is dropped, the `:outliner-op` key is dropped, the `(p/then (fn [_]` step is dropped, the `(p/catch (fn [error]` step is dropped, `:db-sync/missing-field` becomes `:db-sync/response-parse-failed`, the `:repo` key is dropped, the `:field` key is dropped or the `:type` key is dropped.
;; Fails if, in `verify-sync-checksum!`, the `:message-type` key is dropped.
(deftest handle-pull-ok-applies-remote-txs-and-updates-state-test
  (async done
         (finish
          (p/let [pending-pull (atom 3)
                  client (new-client {:pending-pull-since pending-pull})
                  message (pull-message [6 :save-block [[:db/add 1 :block/title "a"]]]
                                        [7 :insert-blocks [[:db/add 2 :block/title "b"]]])
                  ok (<spied {} #(#'sync-handle-message/handle-pull-ok! repo client 5 7 "remote-checksum" message))
                  encrypted (<spied {:e2ee? true :aes-key "aes"}
                                    #(#'sync-handle-message/handle-pull-ok! repo (new-client) 5 7 nil
                                                                            (pull-message [6 :save-block [[:db/add 1 :block/title "a"]]])))
                  no-key (<spied {:e2ee? true :aes-key nil}
                                 #(#'sync-handle-message/handle-pull-ok! repo (new-client) 5 7 nil message))
                  plain-no-key (<spied {:e2ee? false :aes-key nil}
                                       #(#'sync-handle-message/handle-pull-ok! repo (new-client) 5 7 nil message))
                  failing (<spied {:apply-throws? true}
                                  #(#'sync-handle-message/handle-pull-ok! repo (new-client) 5 7 nil message))
                  up-to-date (<spied {} #(#'sync-handle-message/handle-pull-ok! repo (new-client) 7 7 nil message))]
            (is (nil? @pending-pull))
            (is (= [[:apply-remote-txs repo client [{:t 6 :outliner-op :save-block :tx-data [[:db/add 1 :block/title "a"]]}
                                                    {:t 7 :outliner-op :insert-blocks :tx-data [[:db/add 2 :block/title "b"]]}]]]
                   (calls-of (:calls ok) :apply-remote-txs)))
            (is (= [[:ensure-aes-key repo "graph-1"]] (calls-of (:calls ok) :ensure-aes-key)))
            (is (= [[:update-local-tx repo 7]] (calls-of (:calls ok) :update-local-tx)))
            (is (= [[:enqueue-flush-pending repo client]] (calls-of (:calls ok) :enqueue-flush-pending)))
            (is (= [[:clear-last-sync-error client]] (calls-of (:calls ok) :clear-last-sync-error)))
            (is (= [] (calls-of (:calls ok) :set-last-sync-error)))
            (is (= "pull/ok" (:message-type (nth (first (calls-of (:calls ok) :rtc-log)) 2))))
            (is (= [{:t 6 :outliner-op :save-block
                     :tx-data [:decrypted "aes" [[:db/add 1 :block/title "a"]]]}]
                   (nth (first (calls-of (:calls encrypted) :apply-remote-txs)) 3)))
            (let [[_ _client error] (first (calls-of (:calls no-key) :set-last-sync-error))]
              (is (= ["missing-field" {:repo repo :field :aes-key}]
                     [(ex-message error) (ex-data error)])))
            (is (= [] (calls-of (:calls no-key) :apply-remote-txs)))
            (is (= [] (calls-of (:calls plain-no-key) :set-last-sync-error)))
            (is (= 1 (count (calls-of (:calls plain-no-key) :apply-remote-txs))))
            (is (= ["apply failed"] (mapv (fn [[_ _ error]] (ex-message error))
                                          (calls-of (:calls failing) :set-last-sync-error))))
            (is (= [] (calls-of (:calls failing) :clear-last-sync-error)))
            (is (= [] (calls-of (:calls up-to-date) :apply-remote-txs)))
            (is (= [] (calls-of (:calls up-to-date) :ensure-aes-key))))
          done)))

;; Fails if, in `handle-pull-ok!`, the `:repo` key is dropped, the `:type` key is dropped or the `:field` key is dropped.
(deftest handle-pull-ok-validates-its-input-test
  (async done
         (finish
          (p/let [negative (<spied {} #(#'sync-handle-message/handle-pull-ok! repo (new-client) -5 -1 nil {:txs []}))
                  no-txs (<spied {} #(#'sync-handle-message/handle-pull-ok! repo (new-client) 5 7 nil {}))
                  bad-tx (<spied {} #(#'sync-handle-message/handle-pull-ok! repo (new-client) 5 7 nil
                                                                            {:txs [{:t 6 :outliner-op :save-block :tx "not transit"}]}))]
            (is (= ["invalid-field" {:repo repo :type "pull/ok" :value -1}] (error-info (:result negative))))
            (is (= ["invalid-field" {:repo repo :type "pull/ok" :field :txs :value nil}] (error-info (:result no-txs))))
            (let [[message data] (error-info (:result bad-tx))]
              (is (= "response-parse-failed" message))
              (is (= {:repo repo :type "pull/ok"} (dissoc data :error)))))
          done)))
