(ns logseq.cli.command.auth
  "Authentication-related CLI commands."
  (:require [logseq.cli.auth :as cli-auth]
            [logseq.cli.command.core :as core]
            [promesa.core :as p]))

(def entries
  [(core/command-entry ["login"]
                       :login
                       "Authenticate this machine with Logseq cloud"
                       {:user {:desc "Email address (skips browser login; requires --pass)"
                               :alias :u}
                        :pass {:desc "Password (skips browser login; may be visible in shell history/process list)"
                               :alias :p}}
   (core/command-entry ["logout"]
                       :logout
                       "Remove persisted CLI auth"
                       {})])

(defn build-action
  [command options]
  (let [user (:user options)
        pass (:pass options)]
    (cond
      (and (seq user) (not (seq pass)))
      {:ok? false
       :error {:code :invalid-options
               :message "--pass is required when --user is provided"}}

      (and (seq pass) (not (seq user)))
      {:ok? false
       :error {:code :invalid-options
               :message "--user is required when --pass is provided"}}

      :else
      {:ok? true
       :action (cond-> {:type command}
                 (seq user) (assoc :user user :pass pass))})))

(defn- exception->error
  [error]
  (let [data (or (ex-data error) {})
        code (or (:code data) :exception)]
    {:status :error
     :error (merge {:code code
                    :message (or (ex-message error) (str error))}
                   (when (seq data) {:context data}))}))

(defn execute
  [action config]
  (case (:type action)
    :login
    (-> (p/let [data (cli-auth/login! (merge config (select-keys action [:user :pass])))]
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
