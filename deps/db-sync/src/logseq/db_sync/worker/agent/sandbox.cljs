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
  [base token session-id {:keys [agent model permission-mode]}]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        req (json-request (session-url base session-id) "POST" headers
                          {:agent agent
                           :model model
                           :permissionMode permission-mode})]
    (p/let [resp (js/fetch req)
            json (parse-json-or-default resp {})]
      (assoc json :session-id session-id))))

(defn <send-message
  [base token session-id message]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        req (json-request (messages-url base session-id) "POST" headers
                          {:message (:message message)})]
    (p/let [resp (js/fetch req)
            status (.-status resp)
            json (parse-json-or-default resp {:ok (<= 200 status 299) :status status})]
      json)))
