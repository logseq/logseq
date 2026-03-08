(ns logseq.cli.command.auth
  "Authentication-related CLI commands."
  (:require [logseq.cli.auth :as cli-auth]
            [logseq.cli.command.core :as core]
            [promesa.core :as p]))

(def entries
  [(core/command-entry ["login"]
                       :login
                       "Authenticate this machine with Logseq cloud"
                       {})
   (core/command-entry ["logout"]
                       :logout
                       "Remove persisted CLI auth"
                       {})])

(defn build-action
  [command]
  {:ok? true
   :action {:type command}})

(defn- ex-message->code
  [message]
  (when (and (string? message)
             (re-matches #"[a-zA-Z0-9._/\-]+" message))
    (keyword message)))

(defn- exception->error
  [error]
  (let [data (or (ex-data error) {})
        code (or (:code data)
                 (ex-message->code (ex-message error))
                 :exception)]
    {:status :error
     :error (merge {:code code
                    :message (or (ex-message error) (str error))}
                   (when (seq data) {:context data}))}))

(defn execute
  [action config]
  (case (:type action)
    :login
    (-> (p/let [data (cli-auth/login! config)]
          {:status :ok
           :data data})
        (p/catch exception->error))

    :logout
    (-> (p/let [data (cli-auth/logout! config)]
          {:status :ok
           :data data})
        (p/catch exception->error))

    (p/resolved {:status :error
                 :error {:code :unknown-action
                         :message "unknown auth action"}})))
