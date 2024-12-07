(ns frontend.handler.repo-config
  "This ns is a system component that encapsulates repo config functionality.
  This component only concerns itself with one user-facing repo config file,
  logseq/config.edn. In the future it may manage more files. This component
  depends on a repo."
  (:require [clojure.edn :as edn]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]))

(defn- get-repo-config-content
  [repo-url]
  (db/get-file repo-url "logseq/config.edn"))

(defn read-repo-config
  "Converts file content to edn"
  [content]
  (try
    (edn/read-string content)
    (catch :default e
      (notification/show! "The file 'logseq/config.edn' is invalid. Please reload the app to in order to see the error and fix it." :error)
      ;; Rethrow so we know how long this is an issue and to prevent downstream errors
      (throw e))))

(defn set-repo-config-state!
  "Sets repo config state using given file content"
  [repo-url content]
  (let [config (read-repo-config content)]
    (state/set-config! repo-url config)
    config))

(defn restore-repo-config!
  "Sets repo config state from db"
  ([repo-url]
   (restore-repo-config! repo-url (get-repo-config-content repo-url)))
  ([repo-url config-content]
   (set-repo-config-state! repo-url config-content)))

(defn start
  "This component only has one responsibility on start, to manage db and ui state
  from repo config. It does not manage the repo directory, logseq/, as that is
  loosely done by repo-handler"
  [{:keys [repo]}]
  (restore-repo-config! repo))
