(ns frontend.handler.agent
  "Agent sessions for tasks."
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.shui.ui :as shui]
            [logseq.sync.malli-schema :as db-sync-schema]
            [promesa.core :as p]))

(def ^:private invalid-coerce ::invalid-coerce)

(defn- coerce
  [coercer value context]
  (try
    (coercer value)
    (catch :default e
      (log/error :db-sync/malli-coerce-failed (merge context {:error e :value value}))
      invalid-coerce)))

(defn- coerce-http-request [schema-key body]
  (if-let [coercer (get db-sync-schema/http-request-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :request})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn- blank->nil [value]
  (when (string? value)
    (let [value (string/trim value)]
      (when-not (string/blank? value) value))))

(defn- agent-config
  [agent-page]
  (let [api-token (blank->nil (:logseq.property/agent-api-token agent-page))
        auth-json (blank->nil (:logseq.property/agent-auth-json agent-page))
        provider (blank->nil (:block/title agent-page))]
    (cond-> {}
      (string? provider) (assoc :provider provider)
      (string? api-token) (assoc :api-token api-token)
      (string? auth-json) (assoc :auth-json auth-json))))

(defn- project-config
  ([project-page]
   (project-config project-page nil))
  ([project-page {:keys [base-branch]}]
   (let [repo-url (blank->nil (pu/get-block-property-value project-page :logseq.property/git-repo))
         project-id (some-> (:block/uuid project-page) str)
         title (blank->nil (:block/title project-page))
         base-branch (blank->nil base-branch)]
     (when (and project-id title repo-url)
       (cond-> {:id project-id
                :title title
                :repo-url repo-url}
         (string? base-branch) (assoc :base-branch base-branch))))))

(defn- task-context
  ([block]
   (task-context block nil))
  ([block opts]
   (let [block-uuid (:block/uuid block)
         node-id (some-> block-uuid str)
         node-title (or (blank->nil (:block/raw-title block))
                        (blank->nil (:block/title block))
                        "")
         content (or (blank->nil (:block/raw-title block))
                     (blank->nil (:block/title block))
                     "")
         project-page (:logseq.property/project block)
         agent-page (:logseq.property/agent block)
         project (when project-page (project-config project-page opts))
         agent (when agent-page (agent-config agent-page))]
     {:block-uuid block-uuid
      :node-id node-id
      :node-title node-title
      :content content
      :attachments []
      :project project
      :agent agent})))

(defn task-ready?
  [block]
  (let [{:keys [project agent node-id]} (task-context block)]
    (and (string? node-id)
         project
         agent
         (> (count (:block/title block)) 4))))

(defn project-repo-url
  [block]
  (some-> (:logseq.property/project block)
          (pu/get-block-property-value :logseq.property/git-repo)
          blank->nil))

(defn- github-repo-ref
  [repo-url]
  (let [repo-url (blank->nil repo-url)]
    (or (when-let [[_ owner repo]
                   (some->> repo-url
                            (re-matches #"^https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$"))]
          {:owner owner :name repo})
        (when-let [[_ owner repo]
                   (some->> repo-url
                            (re-matches #"^git@github\.com:([^/]+)/([^/]+?)(?:\.git)?$"))]
          {:owner owner :name repo})
        (when-let [[_ owner repo]
                   (some->> repo-url
                            (re-matches #"^ssh://git@github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$"))]
          {:owner owner :name repo}))))

(def ^:private github-install-required-notification-uid :agent/github-install-required)

(defn- first-url-in-text
  [text]
  (some-> (when (string? text)
            (re-find #"https?://[^\s)\]}]+" text))
          (string/replace #"[,.;:!?]+$" "")))

(defn- start-session-error-message
  [error]
  (or (some-> (ex-data error) :body :error)
      (some-> error ex-message)
      "Failed to start agent session."))

(defn- start-session-install-url
  [error]
  (first-url-in-text (some-> (ex-data error) :body :error)))

(defn- open-external-url!
  [url]
  (when (string? url)
    (if (util/electron?)
      (js/window.apis.openExternal url)
      (js/window.open url "_blank" "noopener,noreferrer"))))

(defn- show-github-install-required-notification!
  [error retry-fn]
  (let [message (start-session-error-message error)
        install-url (start-session-install-url error)
        can-retry? (fn? retry-fn)]
    (notification/show!
     [:div.space-y-2
      [:div.whitespace-pre-line message]
      [:div.flex.flex-wrap.gap-2
       (when (string? install-url)
         (shui/button
          {:size :sm
           :on-click (fn []
                       (open-external-url! install-url))}
          "Install GitHub App"))
       (when can-retry?
         (shui/button
          {:variant :outline
           :size :sm
           :on-click (fn []
                       (retry-fn))}
          "retry"))]]
     :warning false github-install-required-notification-uid)))

(defn- normalize-branches
  [branches]
  (->> branches
       (keep (fn [branch]
               (when (string? branch)
                 (let [branch (string/trim branch)]
                   (when-not (string/blank? branch)
                     branch)))))
       distinct
       vec))

(defn- <fetch-project-branches-from-github!
  [repo-url]
  (if-let [{:keys [owner name]} (github-repo-ref repo-url)]
    (-> (js/fetch (str "https://api.github.com/repos/"
                       owner
                       "/"
                       name
                       "/branches?per_page=100")
                  #js {:method "GET"
                       :headers #js {"accept" "application/vnd.github+json"
                                     "x-github-api-version" "2022-11-28"}})
        (p/then (fn [resp]
                  (if-not (.-ok resp)
                    []
                    (-> (.json resp)
                        (p/then (fn [data]
                                  (->> (js->clj data :keywordize-keys true)
                                       (keep (fn [item]
                                               (when (map? item)
                                                 (:name item))))
                                       normalize-branches)))))))
        (p/catch (fn [_] [])))
    (p/resolved [])))

(defn build-session-body
  ([block]
   (build-session-body block nil))
  ([block opts]
   (let [{:keys [block-uuid node-id node-title content attachments project agent]} (task-context block opts)
         session-id (some-> block-uuid str)]
     (when (and session-id node-id (string? node-title) (string? content) (map? project) (map? agent))
       {:session-id session-id
        :node-id node-id
        :node-title node-title
        :content content
        :attachments attachments
        :project project
        :agent agent
        :capabilities {:push-enabled true
                       :pr-enabled true}}))))

(def ^:private stream-reconnect-delay-ms 1500)

(defn- session-key [block-uuid]
  (some-> block-uuid str))

(defn- auth-headers []
  (when-let [token (state/get-auth-id-token)]
    {"authorization" (str "Bearer " token)}))

(defn- session-stream-url [base session-id]
  (str base "/sessions/" session-id "/stream"))

(defn- websocket-base-url [base]
  (when (string? base)
    (cond
      (string/starts-with? base "https://")
      (str "wss://" (subs base (count "https://")))

      (string/starts-with? base "http://")
      (str "ws://" (subs base (count "http://")))

      :else
      base)))

(defn terminal-websocket-url
  [base session-id {:keys [token cols rows]}]
  (let [ws-base (websocket-base-url base)]
    (when (and (string? ws-base) (string? session-id))
      (let [url (js/URL. (str ws-base "/sessions/" session-id "/terminal"))
            search-params (.-searchParams url)]
        (when (string? token)
          (.set search-params "token" token))
        (when (number? cols)
          (.set search-params "cols" (str cols)))
        (when (number? rows)
          (.set search-params "rows" (str rows)))
        (.toString url)))))

(def ^:private session-status->task-status
  {"created" :logseq.property/status.doing
   "running" :logseq.property/status.doing
   "paused" :logseq.property/status.todo
   "completed" :logseq.property/status.done
   "failed" :logseq.property/status.canceled
   "canceled" :logseq.property/status.canceled})
(def ^:private task-session-created-property :logseq.property/agent-session-created?)

(defn- terminal-status? [status]
  (contains? #{"completed" "failed" "canceled"} status))

(defn- normalize-runtime-provider [provider]
  (some-> provider str string/trim string/lower-case not-empty))

(defn- runtime-provider-terminal-enabled? [provider]
  (= "cloudflare" (normalize-runtime-provider provider)))

(defn- event-runtime-provider [event]
  (when (= "session.provisioned" (:type event))
    (some-> (get-in event [:data :provider]) normalize-runtime-provider)))

(defn session-terminal-enabled?
  [session]
  (let [provider (or (normalize-runtime-provider (:runtime-provider session))
                     (some->> (:events session)
                              reverse
                              (keep event-runtime-provider)
                              first))]
    (runtime-provider-terminal-enabled? provider)))

(defn- status->label [status-ident]
  (some-> (db/entity status-ident) :block/title))

(defn- maybe-update-task-status!
  [block-uuid status]
  (when-let [status-ident (get session-status->task-status status)]
    (when-let [block (db/entity [:block/uuid block-uuid])]
      (let [current (pu/get-block-property-value block :logseq.property/status)
            desired (status->label status-ident)]
        (when (and desired (not= current desired))
          (property-handler/set-block-property! block-uuid :logseq.property/status status-ident))))))

(defn- mark-task-session-created!
  [block-uuid]
  (when-let [block (db/entity [:block/uuid block-uuid])]
    (when-not (true? (pu/get-block-property-value block task-session-created-property))
      (property-handler/set-block-property! block-uuid task-session-created-property true))))

(defn- update-session!
  [block-uuid f]
  (state/update-state! :agent/sessions
                       (fn [sessions]
                         (let [key (session-key block-uuid)
                               session (get sessions key {})]
                           (assoc sessions key (f session))))))

(defn- update-session-state!
  [block-uuid data]
  (update-session! block-uuid #(merge % data)))

(defn- event->status [event]
  (case (:type event)
    "session.created" "created"
    "session.running" "running"
    "session.paused" "paused"
    "session.completed" "completed"
    "session.failed" "failed"
    "session.canceled" "canceled"
    nil))

(defn- merge-events [session events]
  (let [existing-ids (or (:event-ids session) #{})
        [new-events new-ids] (reduce (fn [[acc ids] event]
                                       (let [event-id (:event-id event)]
                                         (if (and (string? event-id) (contains? ids event-id))
                                           [acc ids]
                                           [(conj acc event) (if (string? event-id) (conj ids event-id) ids)])))
                                     [[] existing-ids]
                                     events)
        last-ts (reduce (fn [acc event]
                          (max acc (or (:ts event) 0)))
                        (or (:last-event-ts session) 0)
                        new-events)]
    (cond-> session
      (seq new-events)
      (-> (update :events (fnil into []) new-events)
          (assoc :event-ids new-ids
                 :last-event-ts last-ts)))))

(defn- append-events!
  [block-uuid events]
  (update-session! block-uuid #(merge-events % events)))

(defn- parse-sse-frame [frame]
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

(defn- split-sse-frames [buffer]
  (loop [remaining buffer
         frames []]
    (let [idx (.indexOf ^string remaining "\n\n")]
      (if (neg? idx)
        [frames remaining]
        (let [frame (subs remaining 0 idx)
              tail (subs remaining (+ idx 2))]
          (recur tail (conj frames frame)))))))

(defn- message-body
  [content]
  (when-let [message (blank->nil content)]
    {:message message
     :kind "user"}))

(defn- session-state [block-uuid]
  (get (state/sub :agent/sessions) (session-key block-uuid)))

(defn <fetch-events!
  [block]
  (let [base (db-sync/http-base)
        block-uuid (:block/uuid block)
        session-id (some-> block-uuid str)
        session (session-state block-uuid)
        since (when (number? (:last-event-ts session)) (:last-event-ts session))
        query (when since (str "?since=" since))]
    (when (and base session-id (task-ready? block))
      (-> (db-sync/fetch-json (str base "/sessions/" session-id "/events" (or query ""))
                              {:method "GET"}
                              {:response-schema :sessions/events})
          (p/then (fn [resp]
                    (when (seq (:events resp))
                      (append-events! block-uuid (:events resp))
                      (when-let [provider (some->> (:events resp)
                                                   reverse
                                                   (keep event-runtime-provider)
                                                   first)]
                        (update-session-state! block-uuid {:runtime-provider provider
                                                           :terminal-enabled (runtime-provider-terminal-enabled? provider)})))))
          (p/catch (fn [_] nil))))))

(defn <fetch-project-branches!
  [block]
  (let [base (db-sync/http-base)
        block-uuid (:block/uuid block)
        session-id (some-> block-uuid str)
        repo-url (project-repo-url block)]
    (if-not (and (string? base) (string? session-id) (string? repo-url))
      (p/resolved [])
      (let [url (str base
                     "/sessions/"
                     session-id
                     "/branches?repo-url="
                     (js/encodeURIComponent repo-url))]
        (-> (db-sync/fetch-json url
                                {:method "GET"}
                                {:response-schema :sessions/branches})
            (p/then (fn [resp]
                      (->> (:branches resp)
                           (filter string?)
                           normalize-branches)))
            (p/catch (fn [error]
                       (if (= 404 (:status (ex-data error)))
                         (<fetch-project-branches-from-github! repo-url)
                         []))))))))

(defn- session-terminal? [block-uuid]
  (terminal-status? (:status (session-state block-uuid))))

(defn- stream-controller [block-uuid]
  (get-in (session-state block-uuid) [:stream-controller]))

(defn- stream-controller-active? [controller]
  (and controller (not (.-aborted (.-signal controller)))))

(defn- stop-session-stream! [block-uuid]
  (when-let [controller (stream-controller block-uuid)]
    (.abort controller)
    (update-session-state! block-uuid {:streaming? false
                                       :stream-controller nil})))

(defn- handle-stream-event!
  [block-uuid event]
  (append-events! block-uuid [event])
  (when-let [provider (event-runtime-provider event)]
    (update-session-state! block-uuid {:runtime-provider provider
                                       :terminal-enabled (runtime-provider-terminal-enabled? provider)}))
  (when-let [status (event->status event)]
    (update-session-state! block-uuid {:status status})
    (maybe-update-task-status! block-uuid status)
    (when (terminal-status? status)
      (stop-session-stream! block-uuid))))

(defn- <consume-sse-stream!
  [block-uuid resp]
  (let [reader (.getReader (.-body resp))
        decoder (js/TextDecoder.)
        buffer (atom "")]
    (letfn [(step []
              (p/let [result (.read reader)]
                (if (.-done result)
                  nil
                  (let [chunk (.decode decoder (.-value result) #js {:stream true})
                        chunk (string/replace chunk #"\r\n" "\n")
                        merged (str @buffer chunk)
                        [frames remainder] (split-sse-frames merged)]
                    (reset! buffer remainder)
                    (doseq [frame frames]
                      (when-let [event (parse-sse-frame frame)]
                        (handle-stream-event! block-uuid event)))
                    (step)))))]
      (step))))

(declare schedule-reconnect!)
(defn- <connect-session-stream!
  [block-uuid stream-url]
  (let [session (session-state block-uuid)]
    (if (or (:streaming? session)
            (stream-controller-active? (:stream-controller session)))
      (p/resolved nil)
      (when (string? stream-url)
        (let [controller (js/AbortController.)
              headers (auth-headers)
              opts (cond-> {:method "GET"
                            :signal (.-signal controller)}
                     headers (assoc :headers headers))]
          (update-session-state! block-uuid {:streaming? true
                                             :stream-error nil
                                             :stream-controller controller})
          (-> (p/let [resp (js/fetch stream-url (clj->js opts))]
                (if-not (.-ok resp)
                  (throw (ex-info "agent session stream failed"
                                  {:status (.-status resp)
                                   :stream-url stream-url}))
                  (<consume-sse-stream! block-uuid resp)))
              (p/then (fn [_]
                        (update-session-state! block-uuid {:streaming? false
                                                           :stream-controller nil})))
              (p/catch (fn [error]
                         (if (.-aborted (.-signal controller))
                           (update-session-state! block-uuid {:streaming? false
                                                              :stream-controller nil})
                           (do
                             (update-session-state! block-uuid {:streaming? false
                                                                :stream-error (str error)
                                                                :stream-controller nil})
                             (schedule-reconnect! block-uuid stream-url)))))))))))

(defn- schedule-reconnect!
  [block-uuid stream-url]
  (js/setTimeout
   (fn []
     (when-not (session-terminal? block-uuid)
       (when-not (:streaming? (session-state block-uuid))
         (<connect-session-stream! block-uuid stream-url))))
   stream-reconnect-delay-ms))

(defn <ensure-session!
  [block]
  (let [block-uuid (:block/uuid block)
        base (db-sync/http-base)
        session-id (some-> block-uuid str)
        session (session-state block-uuid)]
    (when (and base session-id (task-ready? block))
      (cond
        (:loading? session)
        (p/resolved nil)

        (:session-id session)
        (do
          (mark-task-session-created! block-uuid)
          (when-not (:streaming? session)
            (<connect-session-stream! block-uuid (or (:stream-url session)
                                                     (session-stream-url base session-id))))
          (p/resolved session))

        :else
        (do
          (update-session-state! block-uuid {:loading? true})
          (-> (p/let [resp (db-sync/fetch-json (str base "/sessions/" session-id)
                                               {:method "GET"}
                                               {:response-schema :sessions/get})
                      stream-url (session-stream-url base session-id)]
                (update-session-state! block-uuid {:session-id session-id
                                                   :status (:status resp)
                                                   :runtime-provider (:runtime-provider resp)
                                                   :terminal-enabled (true? (:terminal-enabled resp))
                                                   :stream-url stream-url
                                                   :loading? false})
                (mark-task-session-created! block-uuid)
                (maybe-update-task-status! block-uuid (:status resp))
                (<connect-session-stream! block-uuid stream-url)
                resp)
              (p/catch (fn [error]
                         (update-session-state! block-uuid {:loading? false})
                         (let [status (:status (ex-data error))]
                           (when-not (= status 404)
                             (log/error :agent/ensure-session-failed error)))
                         nil))))))))

(defn <start-session!
  ([block]
   (<start-session! block nil))
  ([block opts]
   (let [base (db-sync/http-base)]
     (cond
       (not base)
       (do
         (notification/show! "DB sync is not configured." :error false)
         (p/resolved nil))

       (not (task-ready? block))
       (do
         (notification/show! "Task needs Project (with Git Repo) and Agent." :warning)
         (p/resolved nil))

       :else
       (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
               raw-body (build-session-body block opts)
               body (coerce-http-request :sessions/create raw-body)]
         (if (nil? body)
           (do
             (notification/show! "Invalid agent session payload." :error false)
             nil)
           (-> (p/let [resp (db-sync/fetch-json (str base "/sessions")
                                                {:method "POST"
                                                 :headers {"content-type" "application/json"}
                                                 :body (js/JSON.stringify (clj->js body))}
                                                {:response-schema :sessions/create})
                       session-id (:session-id resp)
                       status (:status resp)
                       stream-url (:stream-url resp)
                       block-uuid (:block/uuid block)
                       _ (when-let [raw-message (message-body (:content raw-body))]
                           (let [coerced (coerce-http-request :sessions/message raw-message)
                                 msg-body (if (map? coerced) coerced raw-message)]
                             (db-sync/fetch-json (str base "/sessions/" session-id "/messages")
                                                 {:method "POST"
                                                  :headers {"content-type" "application/json"}
                                                  :body (js/JSON.stringify (clj->js msg-body))}
                                                 {:response-schema :sessions/message})))]
                 (notification/clear! github-install-required-notification-uid)
                 (update-session-state! block-uuid {:session-id session-id
                                                    :status status
                                                    :runtime-provider (:runtime-provider resp)
                                                    :terminal-enabled (true? (:terminal-enabled resp))
                                                    :stream-url stream-url
                                                    :started-at (util/time-ms)})
                 (mark-task-session-created! block-uuid)
                 (<connect-session-stream! block-uuid stream-url)
                 resp)
               (p/catch (fn [error]
                          (if (= 412 (:status (ex-data error)))
                            (show-github-install-required-notification!
                             error
                             (fn []
                               (-> (<start-session! block opts)
                                   (p/catch (fn [_] nil)))))
                            (notification/show! (start-session-error-message error) :error false))
                          nil)))))))))

(defn- publish-request-body
  [{:keys [title body commit-message head-branch base-branch create-pr? force?]}]
  (cond-> {:create-pr (if (nil? create-pr?) true (true? create-pr?))
           :force (true? force?)}
    (string? (blank->nil title)) (assoc :title (blank->nil title))
    (string? (blank->nil body)) (assoc :body (blank->nil body))
    (string? (blank->nil commit-message)) (assoc :commit-message (blank->nil commit-message))
    (string? (blank->nil head-branch)) (assoc :head-branch (blank->nil head-branch))
    (string? (blank->nil base-branch)) (assoc :base-branch (blank->nil base-branch))))

(defn- maybe-insert-pr-sibling-blocks!
  [block-uuid resp summary]
  (when-let [url (or (blank->nil (:pr-url resp))
                     (blank->nil (:manual-pr-url resp)))]
    (p/let [block (editor-handler/api-insert-new-block! (str "PR URL: " url)
                                                        {:block-uuid block-uuid
                                                         :sibling? false})]

      (when-let [summary (blank->nil summary)]
        (editor-handler/api-insert-new-block! (str "PR Summary: " summary)
                                              {:block-uuid (:block/uuid block)
                                               :sibling? true})))))

(defn- publish-status-message
  [resp]
  (or (:message resp)
      (case (:status resp)
        "pushed" "Branch pushed."
        "pr-created" "Pull request created."
        "manual-pr-required" "Branch pushed. Create pull request manually."
        "Publish finished.")))

(defn- publish-error-message
  [error]
  (or (some-> (ex-data error) :body :message)
      (some-> (ex-data error) :body :error)
      (some-> error ex-message)
      "Publish failed."))

(defn <publish-session!
  [block opts]
  (let [base (db-sync/http-base)
        block-uuid (:block/uuid block)
        session (session-state block-uuid)
        session-id (or (:session-id session)
                       (some-> block-uuid str))]
    (cond
      (not base)
      (do
        (notification/show! "DB sync is not configured." :error false)
        (p/resolved nil))

      (not (task-ready? block))
      (do
        (notification/show! "Task needs Project (with Git Repo) and Agent." :warning)
        (p/resolved nil))

      (not (:session-id session))
      (do
        (notification/show! "Start the agent session before publishing." :warning)
        (p/resolved nil))

      :else
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
              raw-body (publish-request-body opts)
              body (coerce-http-request :sessions/pr raw-body)]
        (if (nil? body)
          (do
            (notification/show! "Invalid publish payload." :error false)
            nil)
          (-> (db-sync/fetch-json (str base "/sessions/" session-id "/pr")
                                  {:method "POST"
                                   :headers {"content-type" "application/json"}
                                   :body (js/JSON.stringify (clj->js body))}
                                  {:response-schema :sessions/pr})
              (p/then (fn [resp]
                        (update-session-state! block-uuid {:last-publish resp
                                                           :last-publish-at (util/time-ms)})
                        (maybe-insert-pr-sibling-blocks! block-uuid resp (:body raw-body))
                        (notification/show! (publish-status-message resp)
                                            (if (= "manual-pr-required" (:status resp))
                                              :warning
                                              :success)
                                            false)
                        (<fetch-events! block)
                        resp))
              (p/catch (fn [error]
                         (notification/show! (publish-error-message error) :error false)
                         (p/rejected error)))))))))
