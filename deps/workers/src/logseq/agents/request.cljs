(ns logseq.agents.request
  (:require [clojure.string :as string]))

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- normalize-base-url
  [value]
  (some-> value non-empty-str (string/replace #"/+$" "")))

(defn- normalize-int
  [value default-value]
  (let [parsed (if (number? value)
                 value
                 (some-> value str js/parseInt))]
    (if (and (number? parsed)
             (not (js/isNaN parsed)))
      parsed
      default-value)))

(defn normalize-session-create
  [body]
  (when (map? body)
    (let [attachments (:attachments body)
          attachments (when (sequential? attachments) (vec attachments))
          runtime-provider (some-> (:runtime-provider body)
                                   non-empty-str
                                   string/lower-case)
          runner-id (some-> (:runner-id body) non-empty-str)
          capabilities (if (map? (:capabilities body))
                         (:capabilities body)
                         {})
          capabilities (merge {:push-enabled true
                               :pr-enabled true}
                              (select-keys capabilities [:push-enabled :pr-enabled]))]
      (cond-> {:id (:session-id body)
               :source {:node-id (:node-id body)
                        :node-title (:node-title body)}
               :intent {:content (:content body)}
               :project (:project body)
               :agent (:agent body)
               :capabilities capabilities}
        (some? attachments) (assoc-in [:intent :attachments] attachments)
        (string? runtime-provider) (assoc :runtime-provider runtime-provider)
        (string? runner-id) (assoc :runner-id runner-id)))))

(defn normalize-runner-register
  [body user-id]
  (when (map? body)
    (let [runner-id (some-> (:runner-id body) non-empty-str)
          user-id (some-> user-id non-empty-str)
          base-url (some-> (:base-url body) normalize-base-url)
          agent-token (some-> (:agent-token body) non-empty-str)
          access-client-id (some-> (:access-client-id body) non-empty-str)
          access-client-secret (some-> (:access-client-secret body) non-empty-str)
          max-sessions (max 1 (normalize-int (:max-sessions body) 1))]
      (when (and (string? runner-id)
                 (string? user-id)
                 (string? base-url))
        (cond-> {:runner-id runner-id
                 :user-id user-id
                 :base-url base-url
                 :max-sessions max-sessions}
          (string? agent-token) (assoc :agent-token agent-token)
          (string? access-client-id) (assoc :access-client-id access-client-id)
          (string? access-client-secret) (assoc :access-client-secret access-client-secret))))))

(defn normalize-runner-heartbeat
  [body]
  (if-not (map? body)
    {}
    (let [active-sessions (:active-sessions body)
          active-sessions (when (some? active-sessions)
                            (max 0 (normalize-int active-sessions 0)))]
      (cond-> {}
        (number? active-sessions) (assoc :active-sessions active-sessions)))))
