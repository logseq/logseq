(ns logseq.db-sync.worker.agent.sandbox
  (:require [clojure.string :as string]
            [logseq.db-sync.platform.core :as platform]
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
