(ns logseq.agents.sandbox
  (:require [clojure.string :as string]
            [logseq.sync.platform.core :as platform]
            [promesa.core :as p]))

(def ^:private absolute-url-re #"^[A-Za-z][A-Za-z0-9+.-]*://")
(def ^:private local-host-re #"^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:/.*)?$")
(def ^:private default-cwd "/home/user/workspace")

(defn normalize-base-url [base]
  (let [base (some-> base str string/trim not-empty)
        base (some-> base (string/replace #"/+$" ""))]
    (cond
      (not (string? base)) ""
      (re-find absolute-url-re base) base
      (re-find local-host-re base) (str "http://" base)
      :else (str "https://" base))))

(defn acp-server-url [base server-id]
  (str (normalize-base-url base) "/v1/acp/" (js/encodeURIComponent (or server-id ""))))

(defn exec-command-url [base]
  (str (normalize-base-url base) "/v1/commands/exec"))

(defn snapshots-base-url [base]
  (str (normalize-base-url base) "/v1/snapshots"))

(defn snapshot-url [base snapshot-id]
  (str (snapshots-base-url base) "/" snapshot-id))

(defn snapshot-restore-url [base snapshot-id]
  (str (snapshot-url base snapshot-id) "/restore"))

(def ^:private agent-aliases
  {"claude-code" "claude"
   "claude_code" "claude"
   "chatgpt" "codex"
   "open-code" "opencode"
   "open_code" "opencode"})

(defn normalize-agent-id [agent]
  (let [agent (some-> agent str string/lower-case string/trim)]
    (when-not (string/blank? agent)
      (get agent-aliases agent agent))))

(defn- json-request [url method headers body]
  (let [init (cond-> {:method method :headers headers}
               (some? body)
               (assoc :body (js/JSON.stringify (clj->js body))))]
    (platform/request url (clj->js init))))

(defn- add-extra-headers!
  [^js headers extra-headers]
  (when (map? extra-headers)
    (doseq [[k v] extra-headers]
      (when (and (string? k) (string? v))
        (.set headers k v)))))

(defn- parse-json-or-default [^js resp fallback]
  (let [content-type (.get (.-headers resp) "content-type")]
    (if (and (string? content-type) (string/includes? content-type "application/json"))
      (.then (.json resp) #(js->clj % :keywordize-keys true))
      (js/Promise.resolve fallback))))

(defn- rpc-request [id method params]
  (cond-> {:jsonrpc "2.0"
           :id id
           :method method}
    (some? params) (assoc :params params)))

(defn- rpc-response-result [json]
  (cond
    (contains? json :error)
    (throw (ex-info "sandbox ACP request failed"
                    {:response json}))

    (contains? json :result)
    (:result json)

    :else json))

(defn- build-url
  ([base server-id]
   (build-url base server-id nil))
  ([base server-id query]
   (let [url (js/URL. (acp-server-url base server-id))]
     (when (map? query)
       (doseq [[k v] query]
         (when (and (string? k) (some? v))
           (.set (.-searchParams url) k (str v)))))
     (.toString url))))

(defn- permission-mode->mode-id [agent permission-mode]
  (case (normalize-agent-id agent)
    "codex" (case permission-mode
              "read-only" "read-only"
              "default" "read-only"
              "bypass" "auto"
              "auto" "auto"
              "full-access" "full-access"
              nil)
    "amp" (case permission-mode
            "bypass" "bypass"
            "default" "default"
            nil)
    "claude" (case permission-mode
               "acceptedits" "acceptEdits"
               "accept-edits" "acceptEdits"
               "plan" "plan"
               "bypass" "bypassPermissions"
               "default" "default"
               nil)
    nil))

(defn session-mode-id [payload]
  (let [agent (:agent payload)
        agent-mode (some-> (or (:agent-mode payload) (:agentMode payload))
                           str string/trim not-empty)
        permission-mode (some-> (or (:permission-mode payload) (:permissionMode payload))
                                str string/lower-case string/trim not-empty)]
    (or (case (normalize-agent-id agent)
          "opencode" agent-mode
          "claude" (permission-mode->mode-id agent permission-mode)
          "codex" (permission-mode->mode-id agent permission-mode)
          "amp" (permission-mode->mode-id agent permission-mode)
          agent-mode)
        (permission-mode->mode-id agent permission-mode))))

(defn acp-envelope->event [payload]
  (let [method (:method payload)
        params (:params payload)
        runtime-event-type (:type payload)
        runtime-payload (:payload payload)]
    (cond
      (= "session/update" method)
      {:type "agent.runtime"
       :data {:method method
              :session-id (:sessionId params)
              :update (:update params)}}

      (and (= "event_msg" runtime-event-type)
           (= "task_complete" (:type runtime-payload)))
      {:type "session.completed"
       :data {:turn-id (:turn_id runtime-payload)
              :last-agent-message (:last_agent_message runtime-payload)
              :source "task_complete"}}

      :else nil)))

(defn <create-session
  ([base token session-id payload]
   (<create-session base token session-id payload nil))
  ([base token session-id payload opts]
   (let [agent (:agent payload)
         headers (js/Headers.)
         extra-headers (:headers opts)
         cwd (or (:cwd opts) default-cwd)
         server-id (or session-id "")
         agent-id (normalize-agent-id agent)
         mode-id (session-mode-id payload)
         _ (.set headers "content-type" "application/json")
         _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
         _ (add-extra-headers! headers extra-headers)
         init-req (json-request (build-url base server-id {"agent" agent-id}) "POST" headers
                                (rpc-request 1 "initialize"
                                             {:protocolVersion "1.0"
                                              :clientCapabilities {}
                                              :clientInfo {:name "logseq-workers"
                                                           :version "v1"}}))
         new-session-req (json-request (build-url base server-id) "POST" headers
                                       (rpc-request 2 "session/new"
                                                    {:cwd cwd
                                                     :mcpServers []}))]
     (p/let [init-resp (js/fetch init-req)
             init-status (.-status init-resp)
             init-json (parse-json-or-default init-resp {})
             _ (when-not (<= 200 init-status 299)
                 (throw (ex-info "sandbox initialize-session failed"
                                 {:status init-status
                                  :session-id session-id
                                  :response init-json})))
             _ (rpc-response-result init-json)
             session-resp (js/fetch new-session-req)
             session-status (.-status session-resp)
             _ (prn :debug :session-status session-status)
             session-json (parse-json-or-default session-resp {})
             session-result (if (<= 200 session-status 299)
                              (rpc-response-result session-json)
                              (throw (ex-info "sandbox create-session failed"
                                              {:status session-status
                                               :session-id session-id
                                               :response session-json})))
             remote-session-id (or (get-in session-json [:result :sessionId])
                                   (get-in session-json [:result :session-id])
                                   (when (map? session-result)
                                     (or (:sessionId session-result)
                                         (:session-id session-result)))
                                   (when session-result
                                     (aget session-result "sessionId"))
                                   session-id)]
       (if-not (string? mode-id)
         {:server-id server-id
          :session-id remote-session-id}
         (let [mode-req (json-request (build-url base server-id) "POST" headers
                                      (rpc-request 3 "session/set_mode"
                                                   {:sessionId remote-session-id
                                                    :modeId mode-id}))]
           (p/let [mode-resp (js/fetch mode-req)
                   mode-status (.-status mode-resp)
                   mode-json (parse-json-or-default mode-resp {})]
             (if (<= 200 mode-status 299)
               (do
                 (rpc-response-result mode-json)
                 {:server-id server-id
                  :session-id remote-session-id})
               (throw (ex-info "sandbox set-session-mode failed"
                               {:status mode-status
                                :session-id session-id
                                :response mode-json}))))))))))

(defn <open-events-stream
  ([base token server-id]
   (<open-events-stream base token server-id nil))
  ([base token server-id opts]
   (let [headers (js/Headers.)
         extra-headers (:headers opts)
         _ (.set headers "accept" "text/event-stream")
         _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
         _ (add-extra-headers! headers extra-headers)
         req (json-request (build-url base server-id) "GET" headers nil)]
     (p/let [resp (js/fetch req)
             status (.-status resp)]
       (if (<= 200 status 299)
         resp
         (throw (ex-info "sandbox open-events-stream failed"
                         {:status status
                          :server-id server-id})))))))

(defn <send-message
  ([base token server-id remote-session-id message]
   (<send-message base token server-id remote-session-id message nil))
  ([base token server-id remote-session-id message opts]
   (let [headers (js/Headers.)
         extra-headers (:headers opts)
         _ (.set headers "content-type" "application/json")
         _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
         _ (add-extra-headers! headers extra-headers)
         body (rpc-request 4 "session/prompt"
                           {:sessionId remote-session-id
                            :prompt [{:type "text"
                                      :text (:message message)}]})
         req (json-request (build-url base server-id) "POST" headers body)]
     (p/let [resp (js/fetch req)
             status (.-status resp)]
       (if-not (<= 200 status 299)
         (throw (ex-info "sandbox send-message failed"
                         {:status status
                          :server-id server-id
                          :session-id remote-session-id}))
         (p/let [json (parse-json-or-default resp {})]
           (rpc-response-result json)))))))

(defn <terminate-session
  ([base token server-id]
   (<terminate-session base token server-id nil))
  ([base token server-id opts]
   (let [headers (js/Headers.)
         extra-headers (:headers opts)
         _ (.set headers "content-type" "application/json")
         _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
         _ (add-extra-headers! headers extra-headers)
         req (json-request (build-url base server-id) "DELETE" headers nil)]
     (p/let [resp (js/fetch req)
             status (.-status resp)]
       (when-not (<= 200 status 299)
         (throw (ex-info "sandbox terminate-session failed"
                         {:status status
                          :server-id server-id})))
       true))))

(defn <exec-command
  [base token command]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        req (json-request (exec-command-url base) "POST" headers {:command command})]
    (p/let [resp (js/fetch req)
            status (.-status resp)
            json (parse-json-or-default resp {})]
      (if (<= 200 status 299)
        json
        (throw (ex-info "sandbox exec-command failed"
                        {:status status
                         :command command
                         :response json}))))))

(defn <create-snapshot
  [base token {:keys [dir name ttl] :as opts}]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        body (cond-> {}
               (string? dir) (assoc :dir dir)
               (string? name) (assoc :name name)
               (number? ttl) (assoc :ttl ttl))
        req (json-request (snapshots-base-url base) "POST" headers body)]
    (p/let [resp (js/fetch req)
            status (.-status resp)
            json (parse-json-or-default resp {})]
      (if (<= 200 status 299)
        (if (map? json) json opts)
        (throw (ex-info "sandbox create-snapshot failed"
                        {:status status
                         :response json}))))))

(defn <restore-snapshot
  [base token snapshot-id dir]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        body (cond-> {}
               (string? dir) (assoc :dir dir))
        req (json-request (snapshot-restore-url base snapshot-id) "POST" headers body)]
    (p/let [resp (js/fetch req)
            status (.-status resp)
            json (parse-json-or-default resp {})]
      (if (<= 200 status 299)
        json
        (throw (ex-info "sandbox restore-snapshot failed"
                        {:status status
                         :snapshot-id snapshot-id
                         :response json}))))))
