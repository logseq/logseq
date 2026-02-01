(ns logseq.db-sync.worker.agent.sandbox
  (:require [clojure.string :as string]
            [logseq.db-sync.platform.core :as platform]
            [promesa.core :as p]))

(defn normalize-base-url [base]
  (string/replace (or base "") #"/+$" ""))

(defn sessions-url [base]
  (str (normalize-base-url base) "/sandbox/sessions"))

(defn messages-url [base session-id]
  (str (normalize-base-url base) "/sandbox/sessions/" session-id "/messages"))

(defn stream-url [base session-id]
  (str (normalize-base-url base) "/sandbox/sessions/" session-id "/stream"))

(defn- json-request [url method headers body]
  (let [init (cond-> {:method method :headers headers}
               (some? body)
               (assoc :body (js/JSON.stringify (clj->js body))))]
    (platform/request url (clj->js init))))

(defn <create-session
  [base token {:keys [agent repo workdir env] :as payload}]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        req (json-request (sessions-url base) "POST" headers
                          {:agent agent
                           :repo repo
                           :workdir workdir
                           :env env
                           :payload payload})]
    (p/let [resp (js/fetch req)
            json (.json resp)]
      (js->clj json :keywordize-keys true))))

(defn <send-message
  [base token session-id message]
  (let [headers (js/Headers.)
        _ (.set headers "content-type" "application/json")
        _ (when (string? token) (.set headers "authorization" (str "Bearer " token)))
        req (json-request (messages-url base session-id) "POST" headers message)]
    (p/let [resp (js/fetch req)
            json (.json resp)]
      (js->clj json :keywordize-keys true))))
