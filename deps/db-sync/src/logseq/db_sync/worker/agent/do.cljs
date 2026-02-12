(ns logseq.db-sync.worker.agent.do
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.worker.agent.runtime-provider :as runtime-provider]
            [logseq.db-sync.worker.agent.session :as session]
            [logseq.db-sync.worker.agent.source-control :as source-control]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(defn- header [request name]
  (.get (.-headers request) name))

(defn- user-id-from-request [request]
  (header request "x-user-id"))

(defn- sse-encode [event]
  (str "data: " (js/JSON.stringify (clj->js event)) "\n\n"))

(defn- sse-bytes [event]
  (.encode (js/TextEncoder.) (sse-encode event)))

(defn- <storage-get [storage key]
  (p/let [value (.get storage key)]
    (when value (js->clj value :keywordize-keys true))))

(defn- <storage-put! [storage key value]
  (.put storage key (clj->js value)))

(def ^:private events-meta-key "events.meta")

(defn- events-item-key [idx]
  (str "events." idx))

(defn- valid-events-meta? [meta]
  (and (map? meta)
       (integer? (:count meta))
       (<= 0 (:count meta))))

(defn- <get-events-meta [^js self]
  (p/let [meta (<storage-get (.-storage self) events-meta-key)]
    (when (valid-events-meta? meta)
      meta)))

(defn- <put-events-meta! [^js self count]
  (<storage-put! (.-storage self) events-meta-key {:count count}))

(defn- <persist-events! [^js self events]
  (let [events (vec events)
        storage (.-storage self)]
    (p/let [_ (p/all (map-indexed (fn [idx event]
                                    (<storage-put! storage (events-item-key idx) event))
                                  events))
            _ (<put-events-meta! self (count events))]
      nil)))

(defn- <append-event-storage! [^js self event]
  (p/let [meta (<get-events-meta self)
          meta (or meta {:count 0})
          idx (:count meta)
          _ (<storage-put! (.-storage self) (events-item-key idx) event)
          _ (<put-events-meta! self (inc idx))]
    nil))

(defn- <get-session [^js self]
  (<storage-get (.-storage self) "session"))

(defn- <get-events [^js self]
  (p/let [meta (<get-events-meta self)]
    (if meta
      (let [count (:count meta)]
        (if (zero? count)
          []
          (p/let [events (p/all (map (fn [idx]
                                       (<storage-get (.-storage self) (events-item-key idx)))
                                     (range count)))]
            (->> events
                 (remove nil?)
                 vec))))
      [])))

(defn- <put-session! [^js self session]
  (<storage-put! (.-storage self) "session" session))

(defn- <put-events! [^js self events]
  (<persist-events! self events))

(defn- <save-session! [^js self session]
  (p/let [_ (<put-session! self session)]
    session))

(defn- stream-url [request session-id]
  (let [base (or (header request "x-stream-base")
                 (.-origin (platform/request-url request)))]
    (str base "/sessions/" session-id "/stream")))

(defn- broadcast-event! [^js self event]
  (let [streams (.-streams self)
        payload (sse-bytes event)]
    (when streams
      (.forEach streams
                (fn [writer key]
                  (-> (.write writer payload)
                      (.catch (fn [_]
                                (.delete streams key)))))))))

(defn- <append-event! [^js self event-opts]
  (p/let [session (<get-session self)]
    (if (nil? session)
      {:error :missing-session}
      (let [[session _ event] (session/append-event session [] event-opts)]
        (p/let [_ (<append-event-storage! self event)
                _ (<put-session! self session)]
          (broadcast-event! self event)
          {:session session :event event})))))

(defn- <append-publish-event!
  [^js self event-type data]
  (<append-event! self {:type event-type
                        :data data
                        :ts (common/now-ms)}))

(defn- session-conflict [message]
  (http/error-response message 409))

(defn- terminal-status? [status]
  (contains? #{"completed" "failed" "canceled"} status))

(defn- session-capabilities
  [session]
  (merge {:push-enabled true
          :pr-enabled true}
         (when (map? (:capabilities (:task session)))
           (:capabilities (:task session)))))

(defn- push-enabled?
  [session]
  (true? (:push-enabled (session-capabilities session))))

(defn- pr-enabled?
  [session]
  (true? (:pr-enabled (session-capabilities session))))

(defn- repo-url-from-session
  [session]
  (some-> (get-in session [:task :project :repo-url]) str string/trim not-empty))

(defn- generated-head-branch
  [session-id]
  (let [suffix (some-> session-id
                       str
                       string/lower-case
                       (string/replace #"[^a-z0-9-]+" "-")
                       (string/replace #"-+" "-")
                       (string/replace #"^-+" "")
                       (string/replace #"-+$" ""))]
    (str "logseq-agent/" (if (string/blank? suffix) "session" suffix))))

(defn- default-base-branch
  [^js env]
  (or (some-> (aget env "GITHUB_DEFAULT_BASE_BRANCH") str string/trim not-empty)
      "main"))

(defn- error-reason
  [error]
  (let [reason (some-> error ex-data :reason)]
    (cond
      (keyword? reason) (name reason)
      (string? reason) reason
      :else nil)))

(defn- github-error-details
  [error]
  (let [{:keys [status body raw-body response-headers]} (ex-data error)]
    (cond-> {}
      (number? status) (assoc :github-status status)
      (some? body) (assoc :github-body body)
      (string? raw-body) (assoc :github-raw-body raw-body)
      (map? response-headers) (assoc :github-response-headers response-headers))))

(defn- <terminate-runtime! [^js self runtime]
  (set! (.-runtime-events-stream self) nil)
  (if-not (map? runtime)
    (p/resolved nil)
    (let [provider (runtime-provider/resolve-provider (.-env self) runtime)]
      (runtime-provider/<terminate-runtime! provider runtime))))

(defn- parse-sse-data [frame]
  (let [lines (string/split frame #"\n")
        data-lines (keep (fn [line]
                           (when (string/starts-with? line "data:")
                             (string/trim (subs line 5))))
                         lines)
        payload (string/join "\n" data-lines)]
    (when (seq payload)
      (try
        (js->clj (js/JSON.parse payload) :keywordize-keys true)
        (catch :default _
          {:raw payload})))))

(defn- <append-runtime-event! [^js self session-id payload]
  (p/let [current-session (<get-session self)]
    (when (= session-id (:id current-session))
      (let [event-type (or (:type payload) "agent.runtime")]
        (p/let [_ (<append-event! self {:type event-type
                                        :data payload
                                        :ts (common/now-ms)})
                current-session (<get-session self)]
          (when (terminal-status? (:status current-session))
            (<terminate-runtime! self (:runtime current-session))))))))

(defn- <consume-events-stream! [^js self session-id runtime]
  (let [provider (runtime-provider/resolve-provider (.-env self) runtime)]
    (p/let [resp (runtime-provider/<open-events-stream! provider runtime)
            reader (.getReader (.-body resp))]
      (let [decoder (js/TextDecoder.)
            buffer (atom "")]
        (letfn [(emit-frame! [frame]
                  (when-let [payload (parse-sse-data frame)]
                    (<append-runtime-event! self session-id payload)))
                (drain-buffer! []
                  (loop []
                    (let [idx (.indexOf ^string @buffer "\n\n")]
                      (when (>= idx 0)
                        (let [frame (subs @buffer 0 idx)]
                          (reset! buffer (subs @buffer (+ idx 2)))
                          (emit-frame! frame)
                          (recur))))))
                (step! []
                  (p/let [chunk (.read reader)]
                    (if (.-done chunk)
                      nil
                      (do
                        (swap! buffer str (string/replace (.decode decoder (.-value chunk) #js {:stream true})
                                                          #"\r\n" "\n"))
                        (drain-buffer!)
                        (step!)))))]
          (step!))))))

(defn- start-runtime-events-stream! [^js self session-id runtime]
  (when (and (map? runtime)
             (string? (:session-id runtime))
             (nil? (.-runtime-events-stream self)))
    (let [stream-task (-> (<consume-events-stream! self session-id runtime)
                          (.catch (fn [error]
                                    (log/error :agent/runtime-events-stream-error
                                               {:session-id session-id
                                                :runtime-session-id (:session-id runtime)
                                                :error error})
                                    (<append-event! self {:type "agent.runtime.error"
                                                          :data {:session-id session-id
                                                                 :message (str error)}
                                                          :ts (common/now-ms)}))))]
      (set! (.-runtime-events-stream self)
            (.finally stream-task
                      (fn []
                        (set! (.-runtime-events-stream self) nil)))))))

(defn- start-runtime-events-stream-background! [^js self session-id runtime]
  ;; Fire-and-forget start. Returning nil avoids p/let awaiting the stream task.
  (when (and (map? runtime)
             (string? (:session-id runtime)))
    (start-runtime-events-stream! self session-id runtime)
    nil))

(defn- send-runtime-message-background!
  [^js self current-session runtime provider message kind]
  (when (and runtime
             provider
             (string? (:session-id runtime)))
    (start-runtime-events-stream-background! self (:id current-session) runtime)
    (-> (runtime-provider/<send-message! provider
                                         runtime
                                         {:message message
                                          :kind kind})
        (.catch (fn [error]
                  (log/error :agent/runtime-message-error
                             {:session-id (:id current-session)
                              :runtime-session-id (:session-id runtime)
                              :error error})
                  (<append-event! self {:type "agent.runtime.error"
                                        :data {:session-id (:id current-session)
                                               :message (str error)}
                                        :ts (common/now-ms)})))
        (.catch (fn [_] nil)))
    nil))

(defn- <transition! [^js self to-status event-type data]
  (p/let [session (<get-session self)]
    (cond
      (nil? session)
      (http/not-found)

      (not (session/transition-allowed? (:status session) to-status))
      (session-conflict (str "cannot transition from " (:status session) " to " to-status))

      :else
      (p/let [res (<append-event! self {:type event-type :data data})]
        (if (= (:error res) :missing-session)
          (http/not-found)
          (http/json-response :sessions/pause {:ok true}))))))

(defn- <provision-runtime! [^js self task session-id]
  (let [provider (runtime-provider/resolve-provider (.-env self) nil)
        provider-kind (runtime-provider/provider-id provider)]
    (p/let [runtime (runtime-provider/<provision-runtime! provider session-id task)
            session (<get-session self)]
      (cond
        (nil? runtime)
        (throw (ex-info "runtime provisioning returned nil"
                        {:session-id session-id
                         :provider provider-kind}))

        (nil? session)
        nil

        :else
        (let [session (assoc session :runtime runtime)
              [session _ event] (session/append-event session [] {:type "session.provisioned"
                                                                  :data {:provider (:provider runtime)
                                                                         :runtime-session-id (:session-id runtime)
                                                                         :sandbox-id (:sandbox-id runtime)
                                                                         :sandbox-name (:sandbox-name runtime)
                                                                         :sprite-name (:sprite-name runtime)}
                                                                  :ts (common/now-ms)})]
          (p/let [_ (<append-event-storage! self event)
                  _ (<put-session! self session)]
            (when-not (terminal-status? (:status session))
              (start-runtime-events-stream-background! self (:id session) runtime))
            runtime))))))

(defn- handle-init [^js self request]
  (p/let [existing (<get-session self)]
    (if existing
      (let [session-id (:id existing)
            runtime-id (get-in existing [:runtime :session-id])]
        (p/let [_ (when-not (string? runtime-id)
                    (<provision-runtime! self (:task existing) session-id))
                session (<get-session self)]
          (when (and (map? (:runtime session))
                     (not (terminal-status? (:status session))))
            (start-runtime-events-stream-background! self session-id (:runtime session)))
          (http/json-response :sessions/create
                              {:session-id session-id
                               :status (:status session)
                               :stream-url (stream-url request session-id)})))
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (http/bad-request "missing body")
                 (let [task (js->clj result :keywordize-keys true)
                       task-id (:id task)
                       user-id (user-id-from-request request)
                       now (common/now-ms)
                       audit-default {:requested-by user-id
                                      :requested-at now}
                       audit (merge audit-default (:audit task))]
                   (cond
                     (not (string? user-id))
                     (http/unauthorized)

                     (not (string? task-id))
                     (http/bad-request "invalid session id")

                     (and (string? (:requested-by audit))
                          (not= (:requested-by audit) user-id))
                     (http/forbidden)

                     :else
                     (let [session (session/initial-session task audit now)
                           [session events _event] (session/append-event session [] {:type "session.created"
                                                                                     :data {:requested-by user-id
                                                                                            :project (:project task)
                                                                                            :agent (:agent task)}
                                                                                     :ts now})]
                       (p/let [_ (<put-session! self session)
                               _ (<put-events! self events)
                               _ (<provision-runtime! self task task-id)]
                         (http/json-response :sessions/create
                                             {:session-id task-id
                                              :status (:status session)
                                              :stream-url (stream-url request task-id)})))))))))))

(defn- handle-status [^js self _request]
  (p/let [session (<get-session self)]
    (if (nil? session)
      (http/not-found)
      (http/json-response :sessions/get
                          {:session-id (:id session)
                           :status (:status session)
                           :task (:task session)
                           :audit (:audit session)
                           :created-at (:created-at session)
                           :updated-at (:updated-at session)}))))

(defn- handle-messages [^js self request]
  (.then (common/read-json request)
         (fn [result]
           (if (nil? result)
             (http/bad-request "missing body")
             (let [body (js->clj result :keywordize-keys true)
                   message (:message body)
                   user-id (user-id-from-request request)]
               (cond
                 (not (string? user-id))
                 (http/unauthorized)

                 (not (string? message))
                 (http/bad-request "invalid message")

                 :else
                 (p/let [res (<append-event! self {:type "audit.log"
                                                   :data {:event "user-message"
                                                          :kind (:kind body)
                                                          :by user-id}})
                         current-session (<get-session self)]
                   (cond
                     (= (:error res) :missing-session)
                     (http/not-found)

                     (terminal-status? (:status current-session))
                     (session-conflict "session is not writable")

                     (= "paused" (:status current-session))
                     (let [next-session (session/enqueue-order current-session {:message message
                                                                                :kind (:kind body)
                                                                                :by user-id})]
                       (p/let [_ (<save-session! self next-session)]
                         (http/json-response :sessions/message {:ok true})))

                     :else
                     (let [runtime (:runtime current-session)
                           provider (when runtime
                                      (runtime-provider/resolve-provider (.-env self) runtime))]
                       (send-runtime-message-background! self
                                                         current-session
                                                         runtime
                                                         provider
                                                         message
                                                         (:kind body))
                       (http/json-response :sessions/message {:ok true}))))))))))

(defn- <manual-pr-required-response!
  [^js self {:keys [user-id head-branch base-branch manual-url reason force? message
                    github-status github-body github-raw-body github-response-headers]}]
  (p/let [_ (<append-publish-event! self "git.pr.manual"
                                    {:by user-id
                                     :head-branch head-branch
                                     :base-branch base-branch
                                     :manual-pr-url manual-url
                                     :reason reason})]
    (http/json-response :sessions/pr
                        (cond-> {:status "manual-pr-required"
                                 :head-branch head-branch}
                          (string? base-branch) (assoc :base-branch base-branch)
                          (string? manual-url) (assoc :manual-pr-url manual-url)
                          (some? force?) (assoc :force force?)
                          (string? message) (assoc :message message)
                          (number? github-status) (assoc :github-status github-status)
                          (some? github-body) (assoc :github-body github-body)
                          (string? github-raw-body) (assoc :github-raw-body github-raw-body)
                          (map? github-response-headers) (assoc :github-response-headers github-response-headers)))))

(defn- <create-pr-response!
  [^js self {:keys [user-id repo-url head-branch base-branch title description pr-token force? manual-url]}]
  (-> (p/let [_ (<append-publish-event! self "git.pr.started"
                                        {:by user-id
                                         :head-branch head-branch
                                         :base-branch base-branch})
              pr-result (source-control/<create-pull-request! (.-env self)
                                                              pr-token
                                                              repo-url
                                                              {:title title
                                                               :body description
                                                               :head-branch head-branch
                                                               :base-branch base-branch})
              _ (<append-publish-event! self "git.pr.succeeded"
                                        {:by user-id
                                         :head-branch head-branch
                                         :base-branch base-branch
                                         :pr-url (:url pr-result)
                                         :pr-id (:id pr-result)})]
        (http/json-response :sessions/pr
                            (cond-> {:status "pr-created"
                                     :head-branch head-branch
                                     :message "branch pushed and pull request created"}
                              (string? base-branch) (assoc :base-branch base-branch)
                              (string? (:url pr-result)) (assoc :pr-url (:url pr-result))
                              (some? force?) (assoc :force force?))))
      (p/catch (fn [error]
                 (let [reason (error-reason error)
                       {:keys [github-status github-body github-raw-body github-response-headers]} (github-error-details error)]
                   (p/let [existing-pr (when (= reason "api-error")
                                         (source-control/<find-open-pull-request! (.-env self)
                                                                                  pr-token
                                                                                  repo-url
                                                                                  {:head-branch head-branch
                                                                                   :base-branch base-branch}))]
                     (if (map? existing-pr)
                       (p/let [_ (<append-publish-event! self "git.pr.succeeded"
                                                         {:by user-id
                                                          :head-branch head-branch
                                                          :base-branch (or (:base-branch existing-pr) base-branch)
                                                          :pr-url (:url existing-pr)
                                                          :pr-id (:id existing-pr)
                                                          :existing true})]
                         (http/json-response :sessions/pr
                                             (cond-> {:status "pr-created"
                                                      :head-branch head-branch
                                                      :message "branch pushed; existing pull request found"}
                                               (string? (or (:base-branch existing-pr) base-branch))
                                               (assoc :base-branch (or (:base-branch existing-pr) base-branch))
                                               (string? (:url existing-pr)) (assoc :pr-url (:url existing-pr))
                                               (some? force?) (assoc :force force?))))
                       (p/let [_ (<append-publish-event! self "git.pr.failed"
                                                         {:by user-id
                                                          :head-branch head-branch
                                                          :base-branch base-branch
                                                          :reason reason
                                                          :error (str error)
                                                          :github-status github-status})]
                         (<manual-pr-required-response! self
                                                        (cond-> {:user-id user-id
                                                                 :head-branch head-branch
                                                                 :base-branch base-branch
                                                                 :manual-url manual-url
                                                                 :reason "api-failed"
                                                                 :force? force?
                                                                 :message "branch pushed; pull request API failed, use manual URL"}
                                                          (number? github-status) (assoc :github-status github-status)
                                                          (some? github-body) (assoc :github-body github-body)
                                                          (string? github-raw-body) (assoc :github-raw-body github-raw-body)
                                                          (map? github-response-headers) (assoc :github-response-headers github-response-headers)))))))))))

(defn- <handle-pr-after-push!
  [^js self current-session body user-id repo-url head-branch force? create-pr?]
  (p/let [pr-token (source-control/pr-token (.-env self))
          requested-base-branch (source-control/sanitize-branch-name (:base-branch body))
          default-base (source-control/sanitize-branch-name (default-base-branch (.-env self)))
          detected-base-branch (when (and (nil? requested-base-branch)
                                          (string? pr-token))
                                 (source-control/<default-branch! (.-env self)
                                                                  pr-token
                                                                  repo-url))
          detected-base-branch (source-control/sanitize-branch-name detected-base-branch)
          base-branch (or requested-base-branch
                          detected-base-branch
                          default-base)
          base-branch (if (= base-branch head-branch)
                        (or (some (fn [candidate]
                                    (let [candidate (source-control/sanitize-branch-name candidate)]
                                      (when (and (string? candidate)
                                                 (not= candidate head-branch))
                                        candidate)))
                                  [default-base "main" "master"])
                            base-branch)
                        base-branch)]
    (cond
      (false? create-pr?)
      (http/json-response :sessions/pr
                          (cond-> {:status "pushed"
                                   :head-branch head-branch
                                   :message "branch pushed"}
                            (string? base-branch) (assoc :base-branch base-branch)
                            (some? force?) (assoc :force force?)))

      (not (pr-enabled? current-session))
      (http/forbidden)

      :else
      (let [title (or (some-> (:title body) str string/trim not-empty)
                      (str "Agent updates for session " (:id current-session)))
            description (or (some-> (:body body) str string/trim not-empty)
                            "Automated changes from agent session.")
            manual-url (source-control/manual-pr-url repo-url head-branch base-branch)]
        (if-not (string? pr-token)
          (<manual-pr-required-response! self
                                         {:user-id user-id
                                          :head-branch head-branch
                                          :base-branch base-branch
                                          :manual-url manual-url
                                          :reason "missing-token"
                                          :force? force?
                                          :message "branch pushed; create pull request manually"})
          (<create-pr-response! self
                                {:user-id user-id
                                 :repo-url repo-url
                                 :head-branch head-branch
                                 :base-branch base-branch
                                 :title title
                                 :description description
                                 :pr-token pr-token
                                 :force? force?
                                 :manual-url manual-url}))))))

(defn- <perform-pr-push!
  [^js self current-session body user-id repo-url runtime force? create-pr? push-branch-fn]
  (let [provider (runtime-provider/resolve-provider (.-env self) runtime)
        push-token (source-control/push-token (.-env self))
        commit-message (some-> (:commit-message body) str string/trim not-empty)
        head-branch (source-control/resolve-head-branch (:head-branch body)
                                                        (generated-head-branch (:id current-session)))]
    (if-not (string? head-branch)
      (http/bad-request "invalid head branch")
      (-> (p/let [_ (<append-publish-event! self "git.push.started"
                                            {:by user-id
                                             :head-branch head-branch
                                             :force force?})
                  push-result (push-branch-fn provider
                                              runtime
                                              (cond-> {:session-id (:id current-session)
                                                       :repo-url repo-url
                                                       :head-branch head-branch
                                                       :force force?
                                                       :push-token push-token}
                                                commit-message (assoc :commit-message commit-message)))
                  _ (<append-publish-event! self "git.push.succeeded"
                                            {:by user-id
                                             :head-branch head-branch
                                             :force force?
                                             :remote (:remote push-result)})]
            (<handle-pr-after-push! self
                                    current-session
                                    body
                                    user-id
                                    repo-url
                                    head-branch
                                    force?
                                    create-pr?))
          (p/catch (fn [error]
                     (p/let [_ (<append-publish-event! self "git.push.failed"
                                                       {:by user-id
                                                        :head-branch head-branch
                                                        :reason (error-reason error)
                                                        :error (str error)})]
                       (http/error-response (str error) 500))))))))

(defn- handle-pr [^js self request]
  (let [push-branch-fn runtime-provider/<push-branch!]
    (.then (common/read-json request)
           (fn [result]
             (let [body (if (nil? result)
                          {}
                          (js->clj result :keywordize-keys true))
                   user-id (user-id-from-request request)
                   force? (true? (:force body))
                   create-pr? (if (contains? body :create-pr)
                                (true? (:create-pr body))
                                true)]
               (if-not (string? user-id)
                 (http/unauthorized)
                 (p/let [current-session (<get-session self)]
                   (cond
                     (nil? current-session)
                     (http/not-found)

                     (terminal-status? (:status current-session))
                     (session-conflict "session is not writable")

                     (not (push-enabled? current-session))
                     (http/forbidden)

                     :else
                     (let [repo-url (repo-url-from-session current-session)
                           runtime (:runtime current-session)]
                       (cond
                         (not (string? repo-url))
                         (http/bad-request "missing repo url")

                         (not (map? runtime))
                         (session-conflict "session runtime unavailable")

                         :else
                         (<perform-pr-push! self
                                            current-session
                                            body
                                            user-id
                                            repo-url
                                            runtime
                                            force?
                                            create-pr?
                                            push-branch-fn)))))))))))

(defn- handle-cancel [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [res (<append-event! self {:type "session.canceled"
                                        :data {:by user-id}})
              current-session (<get-session self)
              _ (<terminate-runtime! self (:runtime current-session))
              current-session (when current-session (assoc current-session :runtime nil))
              _ (when current-session (<save-session! self current-session))]
        (if (= (:error res) :missing-session)
          (http/not-found)
          (http/json-response :sessions/cancel {:ok true}))))))

(defn- <flush-pending-orders! [^js self]
  (p/let [current-session (<get-session self)]
    (if (nil? current-session)
      nil
      (let [[orders next-session] (session/drain-orders current-session)
            runtime (:runtime current-session)
            provider (when runtime
                       (runtime-provider/resolve-provider (.-env self) runtime))]
        (p/let [_ (<save-session! self next-session)
                _ (when (and runtime
                             provider
                             (string? (:session-id runtime)))
                    (start-runtime-events-stream-background! self (:id current-session) runtime))
                _ (when (and runtime
                             provider
                             (string? (:session-id runtime)))
                    (p/all
                     (map (fn [order]
                            (runtime-provider/<send-message! provider
                                                             runtime
                                                             {:message (:message order)
                                                              :kind (:kind order)}))
                          orders)))]
          (count orders))))))

(defn- handle-pause [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (<transition! self "paused" "session.paused" {:by user-id :reason "user-pause"}))))

(defn- handle-resume [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [resp (<transition! self "running" "session.running" {:by user-id :reason "user-resume"})]
        (if-not (= 200 (.-status resp))
          resp
          (p/let [flushed (<flush-pending-orders! self)]
            (http/json-response :sessions/resume {:ok true
                                                  :flushed (or flushed 0)})))))))

(defn- handle-interrupt [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (<transition! self "paused" "session.paused" {:by user-id :reason "interrupt"}))))

(defn- ->promise
  [v]
  (js/Promise.resolve v))

(defn- handle-stream [^js self request]
  (let [streams (.-streams self)
        stream (js/TransformStream.)
        writer (.getWriter (.-writable stream))
        stream-id (str (random-uuid))
        closed? (volatile! false)
        cleanup (fn []
                  (when-not @closed?
                    (vreset! closed? true)
                    (.delete streams stream-id)
                    (try (.close writer) (catch :default _ nil))))]
    (.set streams stream-id writer)
    (.addEventListener (.-signal request) "abort" cleanup)

    ;; IMPORTANT: don't block returning the Response; write the initial backlog async
    (js/queueMicrotask
     (fn []
       (p/let [events (<get-events self)]
         (doseq [event events]
           ;; writer.write returns a promise; wait so order is preserved
           (p/let [_ (->promise (.write writer (sse-bytes event)))]
             nil)))))

    (js/Response.
     (.-readable stream)
     #js {:status 200
          :headers (js/Object.assign
                    #js {"content-type" "text/event-stream"
                         "cache-control" "no-cache"
                         "connection" "keep-alive"}
                    (common/cors-headers))})))

(defn- parse-int [value]
  (when (string? value)
    (let [parsed (js/parseInt value 10)]
      (when (js/Number.isFinite parsed) parsed))))

(defn- handle-events [^js self request]
  (let [url (platform/request-url request)
        since-ts (parse-int (.get (.-searchParams url) "since"))
        limit (parse-int (.get (.-searchParams url) "limit"))
        user-id (user-id-from-request request)]
    (log/info :agent/session-events-request {:user-id user-id
                                             :since since-ts
                                             :limit limit})
    (p/let [session (<get-session self)]
      (if (nil? session)
        (http/not-found)
        (p/let [events (<get-events self)
                filtered (session/filter-events events {:since-ts since-ts :limit limit})]
          (http/json-response :sessions/events {:events filtered}))))))

(defn handle-fetch [^js self request]
  (let [url (platform/request-url request)
        path (.-pathname url)
        method (.-method request)]
    (.catch
     (js/Promise.resolve
      (try
        (cond
          (contains? #{"OPTIONS" "HEAD"} method)
          (common/options-response)

          (= path "/__session__/init")
          (handle-init self request)

          (= path "/__session__/status")
          (handle-status self request)

          (= path "/__session__/messages")
          (handle-messages self request)

          (= path "/__session__/pause")
          (handle-pause self request)

          (= path "/__session__/resume")
          (handle-resume self request)

          (= path "/__session__/interrupt")
          (handle-interrupt self request)

          (= path "/__session__/cancel")
          (handle-cancel self request)

          (= path "/__session__/pr")
          (handle-pr self request)

          (= path "/__session__/stream")
          (handle-stream self request)

          (= path "/__session__/events")
          (handle-events self request)

          :else
          (http/not-found))
        (catch :default error
          (log/error :agent/session-do-error error)
          (http/error-response "server error" 500))))
     (fn [error]
       (log/error :agent/session-do-error error)
       (http/error-response "server error" 500)))))
