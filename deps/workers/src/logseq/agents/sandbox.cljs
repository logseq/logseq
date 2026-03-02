(ns logseq.agents.sandbox
  (:require [clojure.string :as string]
            [logseq.sync.platform.core :as platform]
            [promesa.core :as p]))

(defn normalize-base-url [base]
  (string/replace (or base "") #"/+$" ""))

(defn sessions-base-url [base]
  (str (normalize-base-url base) "/v1/sessions"))

(defn session-url [base session-id]
  (str (sessions-base-url base) "/" session-id))

(defn messages-url [base session-id]
  (str (session-url base session-id) "/messages"))

(defn messages-stream-url [base session-id]
  (str (session-url base session-id) "/messages/stream"))

(defn events-sse-url [base session-id]
  (str (session-url base session-id) "/events/sse"))

(defn terminate-url [base session-id]
  (str (session-url base session-id) "/terminate"))

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

(defn- parse-json-or-default [^js resp fallback]
  (let [content-type (.get (.-headers resp) "content-type")]
    (if (and (string? content-type) (string/includes? content-type "application/json"))
      (.then (.json resp) #(js->clj % :keywordize-keys true))
      (js/Promise.resolve fallback))))

(defn <create-session
  [base token session-id {:keys [agent agent-mode permission-mode]}]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        body (cond-> {:agent (normalize-agent-id agent)}
               (string? agent-mode) (assoc :agentMode agent-mode)
               (string? permission-mode) (assoc :permissionMode permission-mode))
        req (json-request (session-url base session-id) "POST" headers body)]
    (p/let [resp (js/fetch req)
            status (.-status resp)
            json (parse-json-or-default resp {})]
      (if (<= 200 status 299)
        (assoc json :session-id session-id)
        (throw (ex-info "sandbox create-session failed"
                        {:status status
                         :session-id session-id
                         :response json}))))))

(defn <open-message-stream
  [base token session-id message]
  (let [headers (js/Headers.)
        _ (.set headers "accept" "text/event-stream")
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        req (json-request (messages-stream-url base session-id) "POST" headers
                          {:message (:message message)})]
    (p/let [resp (js/fetch req)
            status (.-status resp)]
      (if (<= 200 status 299)
        resp
        (throw (ex-info "sandbox open-message-stream failed"
                        {:status status
                         :session-id session-id}))))))

(defn <open-events-stream
  [base token session-id]
  (let [headers (js/Headers.)
        _ (.set headers "accept" "text/event-stream")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        req (json-request (events-sse-url base session-id) "GET" headers nil)]
    (p/let [resp (js/fetch req)
            status (.-status resp)]
      (if (<= 200 status 299)
        resp
        (throw (ex-info "sandbox open-events-stream failed"
                        {:status status
                         :session-id session-id}))))))

(defn <send-message
  [base token session-id message]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        body (cond-> {:message (:message message)}
               (string? (:kind message)) (assoc :kind (:kind message)))
        req (json-request (messages-url base session-id) "POST" headers body)]
    (p/let [resp (js/fetch req)
            status (.-status resp)]
      (if (<= 200 status 299)
        true
        (throw (ex-info "sandbox send-message failed"
                        {:status status
                         :session-id session-id}))))))

(defn <terminate-session
  [base token session-id]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        req (json-request (terminate-url base session-id) "POST" headers nil)]
    (p/let [resp (js/fetch req)
            status (.-status resp)]
      (when-not (<= 200 status 299)
        (throw (ex-info "sandbox terminate-session failed"
                        {:status status
                         :session-id session-id})))
      true)))

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
