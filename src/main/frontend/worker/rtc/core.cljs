(ns frontend.worker.rtc.core
  "Main(use missionary) ns for rtc related fns"
  (:require [clojure.data :as data]
            [datascript.core :as d]
            [frontend.common.missionary :as c.m]
            [frontend.worker.device :as worker-device]
            [frontend.worker.rtc.asset :as r.asset]
            [frontend.worker.rtc.branch-graph :as r.branch-graph]
            [frontend.worker.rtc.client :as r.client]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.exception :as r.ex]
            [frontend.worker.rtc.full-upload-download-graph :as r.upload-download]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [frontend.worker.rtc.remote-update :as r.remote-update]
            [frontend.worker.rtc.skeleton]
            [frontend.worker.rtc.ws :as ws]
            [frontend.worker.rtc.ws-util :as ws-util :refer [gen-get-ws-create-map--memoized]]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [malli.core :as ma]
            [missionary.core :as m])
  (:import [missionary Cancelled]))

(def ^:private rtc-state-schema
  [:map
   [:ws-state {:optional true} [:enum :connecting :open :closing :closed]]])
(def ^:private rtc-state-validator (ma/validator rtc-state-schema))

(def ^:private sentinel (js-obj))
(defn- get-remote-updates
  "Return a flow: receive messages from ws,
  and filter messages with :req-id=
  - `push-updates`
  - `online-users-updated`.
  - `push-asset-upload-updates`"
  [get-ws-create-task]
  (m/ap
    (loop []
      (let [ws (m/? get-ws-create-task)
            x (try
                (m/?> (m/eduction
                       (filter (fn [data]
                                 (contains?
                                  #{"online-users-updated"
                                    "push-updates"
                                    "push-asset-upload-updates"}
                                  (:req-id data))))
                       (ws/recv-flow ws)))
                (catch js/CloseEvent _
                  sentinel))]
        (if (identical? x sentinel)
          (recur)
          x)))))

(defn- create-local-updates-check-flow
  "Return a flow: emit if need to push local-updates"
  [repo *auto-push? interval-ms]
  (let [auto-push-flow (m/watch *auto-push?)
        clock-flow (c.m/clock interval-ms :clock)
        merge-flow (m/latest vector auto-push-flow clock-flow)]
    (m/eduction (filter first)
                (map second)
                (filter (fn [v] (when (pos? (client-op/get-unpushed-block-ops-count repo)) v)))
                merge-flow)))

(defn- create-pull-remote-updates-flow
  "Return a flow: emit to pull remote-updates.
  reschedule next emit(INTERVAL-MS later) every time FLOW emit a value."
  [interval-ms flow]
  (let [v {:type :pull-remote-updates}
        clock-flow (m/ap
                     (loop []
                       (m/amb
                        (m/? (m/sleep interval-ms v))
                        (recur))))]
    (m/ap
      (m/amb
       v
       (let [_ (m/?< (c.m/continue-flow flow))]
         (try
           (m/?< clock-flow)
           (catch Cancelled _ (m/amb))))))))

(defn create-inject-users-info-flow
  "Return a flow: emit event if need to notify the server to inject users-info to graph."
  [repo online-users-updated-flow]
  (m/ap
    (if-let [conn (worker-state/get-datascript-conn repo)]
      (if-let [online-users (seq (m/?> online-users-updated-flow))]
        (let [user-uuid->user (into {} (map (juxt :user/uuid identity) online-users))
              user-blocks (keep (fn [user-uuid] (d/entity @conn [:block/uuid user-uuid])) (keys user-uuid->user))]
          (if (or (not= (count user-blocks) (count user-uuid->user))
                  (some
                   ;; check if some attrs not equal among user-blocks and online-users
                   (fn [user-block]
                     (let [user (user-uuid->user (:block/uuid user-block))
                           [diff-r1 diff-r2]
                           (data/diff
                            (select-keys user-block [:logseq.property.user/name :logseq.property.user/email :logseq.property.user/avatar])
                            (update-keys
                             (select-keys user [:user/name :user/email :user/avatar])
                             (fn [k] (keyword "logseq.property.user" (name k)))))]
                       (or (some? diff-r1) (some? diff-r2))))
                   user-blocks))
            (m/amb {:type :inject-users-info}
                   ;; then trigger a pull-remote-updates to update local-graph
                   {:type :pull-remote-updates :from :x})
            (m/amb)))
        (m/amb))
      (m/amb))))

(defn- create-mixed-flow
  "Return a flow that emits all kinds of events:
  `:remote-update`: remote-updates data from server
  `:remote-asset-update`: remote asset-updates from server
  `:local-update-check`: event to notify to check if there're some new local-updates, then push to remote.
  `:online-users-updated`: online users info updated
  `:pull-remote-updates`: pull remote updates
  `:inject-users-info`: notify server to inject users-info into the graph"
  [repo get-ws-create-task *auto-push? *online-users]
  (let [remote-updates-flow (m/eduction
                             (map (fn [data]
                                    (case (:req-id data)
                                      "push-updates" {:type :remote-update :value data}
                                      "online-users-updated" {:type :online-users-updated :value data}
                                      "push-asset-upload-updates" {:type :remote-asset-update :value data})))
                             (get-remote-updates get-ws-create-task))
        local-updates-check-flow (m/eduction
                                  (map (fn [data] {:type :local-update-check :value data}))
                                  (create-local-updates-check-flow repo *auto-push? 2000))
        inject-user-info-flow (create-inject-users-info-flow repo (m/watch *online-users))
        mix-flow (c.m/mix remote-updates-flow local-updates-check-flow inject-user-info-flow)]
    (c.m/mix mix-flow (create-pull-remote-updates-flow 60000 mix-flow))))

(defn- create-ws-state-flow
  [*current-ws]
  (m/relieve
   (m/ap
     (let [ws (m/?< (m/watch *current-ws))]
       (try
         (if ws
           (m/?< (ws/create-mws-state-flow ws))
           (m/amb))
         (catch Cancelled _
           (m/amb)))))))

(defn- create-rtc-state-flow
  [ws-state-flow]
  (m/latest
   (fn [ws-state]
     {:post [(rtc-state-validator %)]}
     (cond-> {}
       ws-state (assoc :ws-state ws-state)))
   (m/reductions {} nil ws-state-flow)))

(defonce ^:private *rtc-lock (atom nil))
(defn- holding-rtc-lock
  "Use this fn to prevent multiple rtc-loops at same time.
  rtc-loop-task is stateless, but conn is not.
  we need to ensure that no two concurrent rtc-loop-tasks are modifying `conn` at the same time"
  [started-dfv task]
  (m/sp
    (when-not (compare-and-set! *rtc-lock nil true)
      (let [e (ex-info "Must not run multiple rtc-loops, try later"
                       {:type :rtc.exception/lock-failed
                        :missionary/retry true})]
        (started-dfv e)
        (throw e)))
    (try
      (m/? task)
      (finally
        (reset! *rtc-lock nil)))))

(declare new-task--inject-users-info)
(defn- create-rtc-loop
  "Return a map with [:rtc-state-flow :rtc-loop-task :*rtc-auto-push? :onstarted-task]
  TODO: auto refresh token if needed"
  [graph-uuid schema-version repo conn date-formatter token
   & {:keys [auto-push? debug-ws-url] :or {auto-push? true}}]
  (let [major-schema-version       (db-schema/major-version schema-version)
        ws-url                     (or debug-ws-url (ws-util/get-ws-url token))
        *auto-push?                (atom auto-push?)
        *remote-profile?           (atom false)
        *last-calibrate-t          (atom nil)
        *online-users              (atom nil)
        *assets-sync-loop-canceler (atom nil)
        *server-schema-version     (atom nil)
        started-dfv                (m/dfv)
        add-log-fn                 (fn [type message]
                                     (assert (map? message) message)
                                     (rtc-log-and-state/rtc-log type (assoc message :graph-uuid graph-uuid)))
        {:keys [*current-ws get-ws-create-task]}
        (gen-get-ws-create-map--memoized ws-url)
        get-ws-create-task (r.client/ensure-register-graph-updates
                            get-ws-create-task graph-uuid major-schema-version
                            repo conn *last-calibrate-t *online-users *server-schema-version add-log-fn)
        {:keys [assets-sync-loop-task]}
        (r.asset/create-assets-sync-loop repo get-ws-create-task graph-uuid major-schema-version conn *auto-push?)
        mixed-flow                 (create-mixed-flow repo get-ws-create-task *auto-push? *online-users)]
    (assert (some? *current-ws))
    {:rtc-state-flow       (create-rtc-state-flow (create-ws-state-flow *current-ws))
     :*rtc-auto-push?      *auto-push?
     :*rtc-remote-profile? *remote-profile?
     :*online-users        *online-users
     :onstarted-task       started-dfv
     :rtc-loop-task
     (holding-rtc-lock
      started-dfv
      (m/sp
        (try
          ;; init run to open a ws
          (m/? get-ws-create-task)
          (started-dfv true)
          (reset! *assets-sync-loop-canceler
                  (c.m/run-task assets-sync-loop-task :assets-sync-loop-task))
          (->>
           (let [event (m/?> mixed-flow)]
             (case (:type event)
               :remote-update
               (try (r.remote-update/apply-remote-update graph-uuid repo conn date-formatter event add-log-fn)
                    (catch :default e
                      (when (= ::r.remote-update/need-pull-remote-data (:type (ex-data e)))
                        (m/? (r.client/new-task--pull-remote-data
                              repo conn graph-uuid major-schema-version date-formatter get-ws-create-task add-log-fn)))))
               :remote-asset-update
               (m/? (r.asset/new-task--emit-remote-asset-updates-from-push-asset-upload-updates
                     repo @conn (:value event)))

               :local-update-check
               (m/? (r.client/new-task--push-local-ops
                     repo conn graph-uuid major-schema-version date-formatter
                     get-ws-create-task *remote-profile? add-log-fn))

               :online-users-updated
               (reset! *online-users (:online-users (:value event)))

               :pull-remote-updates
               (m/? (r.client/new-task--pull-remote-data
                     repo conn graph-uuid major-schema-version date-formatter get-ws-create-task add-log-fn))

               :inject-users-info
               (m/? (new-task--inject-users-info token graph-uuid major-schema-version))))
           (m/ap)
           (m/reduce {} nil)
           (m/?))
          (catch Cancelled e
            (add-log-fn :rtc.log/cancelled {})
            (throw e))
          (finally
            (started-dfv :final) ;; ensure started-dfv can recv a value(values except the first one will be disregarded)
            (when @*assets-sync-loop-canceler (@*assets-sync-loop-canceler))))))}))

(def ^:private empty-rtc-loop-metadata
  {:repo nil
   :graph-uuid nil
   :local-graph-schema-version nil
   :remote-graph-schema-version nil
   :user-uuid nil
   :rtc-state-flow nil
   :*rtc-auto-push? nil
   :*rtc-remote-profile? nil
   :*online-users nil
   :*rtc-lock nil
   :canceler nil
   :*last-stop-exception nil})

(defonce ^:private *rtc-loop-metadata (atom empty-rtc-loop-metadata
                                            :validator
                                            (fn [v] (= (set (keys empty-rtc-loop-metadata))
                                                       (set (keys v))))))

(defn- validate-rtc-start-conditions
  "Return exception if validation failed"
  [repo token]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (let [user-uuid (:sub (worker-util/parse-jwt token))
          graph-uuid (ldb/get-graph-rtc-uuid @conn)
          schema-version (ldb/get-graph-schema-version @conn)
          remote-schema-version (ldb/get-graph-remote-schema-version @conn)
          app-schema-version db-schema/version]
      (cond
        (not user-uuid)
        (ex-info "Invalid token" {:type :rtc.exception/invalid-token})

        (not graph-uuid)
        r.ex/ex-local-not-rtc-graph

        (not schema-version)
        (ex-info "Not found schema-version" {:type :rtc.exception/not-found-schema-version})

        (not remote-schema-version)
        (ex-info "Not found remote-schema-version" {:type :rtc.exception/not-found-remote-schema-version})

        (apply not= (map db-schema/major-version [app-schema-version remote-schema-version schema-version]))
        (ex-info "major schema version mismatch" {:type :rtc.exception/major-schema-version-mismatched
                                                  :sub-type
                                                  (r.branch-graph/compare-schemas
                                                   remote-schema-version app-schema-version schema-version)
                                                  :app app-schema-version
                                                  :local schema-version
                                                  :remote remote-schema-version})
        :else
        {:conn conn
         :user-uuid user-uuid
         :graph-uuid graph-uuid
         :schema-version schema-version
         :remote-schema-version remote-schema-version
         :date-formatter (common-config/get-date-formatter (worker-state/get-config repo))}))
    (ex-info "Not found db-conn" {:type :rtc.exception/not-found-db-conn
                                  :repo repo})))

;;; ================ API ================
(defn new-task--rtc-start
  [repo token]
  (m/sp
    ;; ensure device metadata existing first
    (m/? (worker-device/new-task--ensure-device-metadata! token))
    (let [{:keys [conn user-uuid graph-uuid schema-version remote-schema-version date-formatter] :as r}
          (validate-rtc-start-conditions repo token)]
      (if (instance? ExceptionInfo r)
        (do (log/info :e r) (r.ex/->map r))
        (let [{:keys [rtc-state-flow *rtc-auto-push? *rtc-remote-profile? rtc-loop-task *online-users onstarted-task]}
              (create-rtc-loop graph-uuid schema-version repo conn date-formatter token)
              *last-stop-exception (atom nil)
              canceler (c.m/run-task rtc-loop-task :rtc-loop-task
                                     :fail (fn [e]
                                             (reset! *last-stop-exception e)
                                             (log/info :rtc-loop-task e)))
              start-ex (m/? onstarted-task)]
          (if-let [start-ex (:ex-data start-ex)]
            (do (log/info :start-ex start-ex) (r.ex/->map start-ex))
            (do (reset! *rtc-loop-metadata {:repo repo
                                            :graph-uuid graph-uuid
                                            :local-graph-schema-version schema-version
                                            :remote-graph-schema-version remote-schema-version
                                            :user-uuid user-uuid
                                            :rtc-state-flow rtc-state-flow
                                            :*rtc-auto-push? *rtc-auto-push?
                                            :*rtc-remote-profile? *rtc-remote-profile?
                                            :*online-users *online-users
                                            :*rtc-lock *rtc-lock
                                            :canceler canceler
                                            :*last-stop-exception *last-stop-exception})
                nil)))))))

(defn rtc-stop
  []
  (when-let [canceler (:canceler @*rtc-loop-metadata)]
    (canceler)
    (reset! *rtc-loop-metadata empty-rtc-loop-metadata)))

(defn rtc-toggle-auto-push
  []
  (when-let [*auto-push? (:*rtc-auto-push? @*rtc-loop-metadata)]
    (swap! *auto-push? not)))

(defn rtc-toggle-remote-profile
  []
  (when-let [*rtc-remote-profile? (:*rtc-remote-profile? @*rtc-loop-metadata)]
    (swap! *rtc-remote-profile? not)))

(defn new-task--get-graphs
  [token]
  (let [{:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
    (m/join :graphs
            (ws-util/send&recv get-ws-create-task {:action "list-graphs"}))))

(defn new-task--delete-graph
  "Return a task that return true if succeed"
  [token graph-uuid schema-version]
  (let [{:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
    (m/sp
      (let [{:keys [ex-data]}
            (m/? (ws-util/send&recv get-ws-create-task
                                    {:action "delete-graph"
                                     :graph-uuid graph-uuid
                                     :schema-version (str schema-version)}))]
        (when ex-data (log/info ::delete-graph-failed {:graph-uuid graph-uuid :ex-data ex-data}))
        (boolean (nil? ex-data))))))

(defn new-task--get-users-info
  "Return a task that return users-info about the graph."
  [token graph-uuid]
  (let [{:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
    (m/join :users
            (ws-util/send&recv get-ws-create-task
                               {:action "get-users-info" :graph-uuid graph-uuid}))))

(defn new-task--inject-users-info
  [token graph-uuid major-schema-version]
  (let [{:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
    (ws-util/send&recv get-ws-create-task
                       {:action "inject-users-info"
                        :graph-uuid graph-uuid
                        :schema-version (str major-schema-version)})))

(defn new-task--grant-access-to-others
  [token graph-uuid & {:keys [target-user-uuids target-user-emails]}]
  (let [{:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
    (ws-util/send&recv get-ws-create-task
                       (cond-> {:action "grant-access"
                                :graph-uuid graph-uuid}
                         target-user-uuids (assoc :target-user-uuids target-user-uuids)
                         target-user-emails (assoc :target-user-emails target-user-emails)))))

(defn new-task--get-block-content-versions
  "Return a task that return map [:ex-data :ex-message :versions]"
  [token graph-uuid block-uuid]
  (let [{:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
    (m/join :versions (ws-util/send&recv get-ws-create-task
                                         {:action "query-block-content-versions"
                                          :block-uuids [block-uuid]
                                          :graph-uuid graph-uuid}))))

(def ^:private create-get-state-flow*
  (let [rtc-loop-metadata-flow (m/watch *rtc-loop-metadata)]
    (m/ap
      (let [{rtc-lock :*rtc-lock
             :keys [repo graph-uuid local-graph-schema-version remote-graph-schema-version
                    user-uuid rtc-state-flow *rtc-auto-push? *rtc-remote-profile?
                    *online-users *last-stop-exception]}
            (m/?< rtc-loop-metadata-flow)]
        (try
          (when (and repo rtc-state-flow *rtc-auto-push? rtc-lock)
            (m/?<
             (m/latest
              (fn [rtc-state rtc-auto-push? rtc-remote-profile?
                   rtc-lock online-users pending-local-ops-count local-tx remote-tx]
                {:graph-uuid graph-uuid
                 :local-graph-schema-version (db-schema/schema-version->string local-graph-schema-version)
                 :remote-graph-schema-version (db-schema/schema-version->string remote-graph-schema-version)
                 :user-uuid user-uuid
                 :unpushed-block-update-count pending-local-ops-count
                 :local-tx local-tx
                 :remote-tx remote-tx
                 :rtc-state rtc-state
                 :rtc-lock rtc-lock
                 :auto-push? rtc-auto-push?
                 :remote-profile? rtc-remote-profile?
                 :online-users online-users
                 :last-stop-exception-ex-data (some-> *last-stop-exception deref ex-data)})
              rtc-state-flow
              (m/watch *rtc-auto-push?) (m/watch *rtc-remote-profile?)
              (m/watch rtc-lock) (m/watch *online-users)
              (client-op/create-pending-block-ops-count-flow repo)
              (rtc-log-and-state/create-local-t-flow graph-uuid)
              (rtc-log-and-state/create-remote-t-flow graph-uuid))))
          (catch Cancelled _))))))

(def ^:private create-get-state-flow (c.m/throttle 300 create-get-state-flow*))

(defn new-task--get-debug-state
  []
  (m/reduce {} nil (m/eduction (take 1) create-get-state-flow)))

(defn new-task--upload-graph
  [token repo remote-graph-name]
  (let [{:keys [conn schema-version] :as r}
        (if-let [conn (worker-state/get-datascript-conn repo)]
          (if-let [schema-version (ldb/get-graph-schema-version @conn)]
            {:conn conn :schema-version schema-version}
            (ex-info "Not found schema-version" {:type :rtc.exception/not-found-schema-version}))
          (ex-info "Not found db-conn" {:type :rtc.exception/not-found-db-conn :repo repo}))]
    (m/sp
      (if (instance? ExceptionInfo r)
        (r.ex/->map r)
        (let [major-schema-version (db-schema/major-version schema-version)
              {:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
          (m/? (r.upload-download/new-task--upload-graph
                get-ws-create-task repo conn remote-graph-name major-schema-version)))))))

(defn new-task--branch-graph
  [token repo]
  (let [{:keys [conn graph-uuid schema-version] :as r}
        (if-let [conn (worker-state/get-datascript-conn repo)]
          (if-let [graph-uuid (ldb/get-graph-rtc-uuid @conn)]
            (if-let [schema-version (ldb/get-graph-schema-version @conn)]
              {:conn conn :graph-uuid graph-uuid :schema-version schema-version}
              (ex-info "Not found schema-version" {:type :rtc.exception/not-found-schema-version}))
            r.ex/ex-local-not-rtc-graph)
          (ex-info "Not found db-conn" {:type :rtc.exception/not-found-db-conn :repo repo}))]
    (m/sp
      (if (instance? ExceptionInfo r)
        (r.ex/->map r)
        (let [major-schema-version (db-schema/major-version schema-version)
              {:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
          (m/? (r.upload-download/new-task--branch-graph
                get-ws-create-task repo conn graph-uuid major-schema-version)))))))

(defn new-task--request-download-graph
  [token graph-uuid schema-version]
  (let [{:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
    (r.upload-download/new-task--request-download-graph get-ws-create-task graph-uuid schema-version)))

(defn new-task--download-info-list
  [token graph-uuid schema-version]
  (let [{:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
    (r.upload-download/new-task--download-info-list get-ws-create-task graph-uuid schema-version)))

(defn new-task--wait-download-info-ready
  [token download-info-uuid graph-uuid schema-version timeout-ms]
  (let [{:keys [get-ws-create-task]} (gen-get-ws-create-map--memoized (ws-util/get-ws-url token))]
    (r.upload-download/new-task--wait-download-info-ready
     get-ws-create-task download-info-uuid graph-uuid schema-version timeout-ms)))

(def new-task--download-graph-from-s3 r.upload-download/new-task--download-graph-from-s3)

;;; ================ API (ends) ================

;;; subscribe state ;;;
(when-not common-config/PUBLISHING
  (c.m/run-background-task
   ::subscribe-state
   (m/reduce
    (fn [_ v] (worker-util/post-message :rtc-sync-state v))
    create-get-state-flow)))

(comment
  (do
    (def user-uuid "7f41990d-2c8f-4f79-b231-88e9f652e072")
    (def graph-uuid "ff7186c1-5903-4bc8-b4e9-ca23525b9983")
    (def repo "logseq_db_4-23")
    (def conn (worker-state/get-datascript-conn repo))
    (def date-formatter "MMM do, yyyy")
    (def debug-ws-url "wss://ws-dev.logseq.com/rtc-sync?token=???")
    (let [{:keys [rtc-state-flow *rtc-auto-push? rtc-loop-task]}
          (create-rtc-loop user-uuid graph-uuid repo conn date-formatter nil {:debug-ws-url debug-ws-url})
          c (c.m/run-task rtc-loop-task :rtc-loop-task)]
      (def cancel c)
      (def rtc-state-flow rtc-state-flow)
      (def *rtc-auto-push? *rtc-auto-push?)))
  (cancel)

  (do
    (def a (atom 1))
    (def f1 (m/watch a))
    (def f2 (create-pull-remote-updates-flow 5000 f1))
    (def cancel (c.m/run-task (m/reduce (fn [_ v] (prn :v v)) f2) :xxx)))

  (defn sleep-emit [delays]
    (m/ap (let [n (m/?> (m/seed delays))
                r (m/? (m/sleep n n))]
            (prn :xxx r (t/now))
            r)))

  (def cancel
    ((->> (m/sample vector
                    (m/latest identity (m/reductions {} 0  (sleep-emit [1000 1 2])))
                    (sleep-emit [2000 3000 1000]))
          (m/reduce (fn [_ v] (prn :v v)))) prn prn))

  (let [f (m/stream (m/ap (m/amb 1 2 3 4)))]
    ((m/reduce (fn [r v] (conj r v)) (m/reductions {} :xxx f)) prn prn)
    ((m/reduce (fn [r v] (conj r v)) f) prn prn)))
