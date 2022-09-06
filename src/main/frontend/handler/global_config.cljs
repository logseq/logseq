(ns frontend.handler.global-config
  "This ns is a system component that encapsulates global config functionality.
  Unlike repo config, this also manages a directory for configuration. This app
  component depends on a repo."
  (:require [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.common.file :as file-common-handler]
            [frontend.state :as state]
            [cljs.reader :as reader]
            [promesa.core :as p]
            [shadow.resource :as rc]
            [electron.ipc :as ipc]
            ["path" :as path]))

;; Use defonce to avoid broken state on dev reload
;; Also known as home directory a.k.a. '~'
(defonce root-dir
  (atom nil))

(defn global-config-dir
  []
  (path/join @root-dir "config"))

(defn global-config-path
  []
  (path/join @root-dir "config" "config.edn"))

(defn- set-global-config-state!
  [content]
  (let [config (reader/read-string content)]
    (state/set-global-config! config)
    config))

(def default-content (rc/inline "global-config.edn"))

(defn- create-global-config-file-if-not-exists
  [repo-url]
  (let [config-dir (global-config-dir)
        config-path (global-config-path)]
    (p/let [_ (fs/mkdir-if-not-exists config-dir)
            file-exists? (fs/create-if-not-exists repo-url config-dir config-path default-content)]
           (when-not file-exists?
             (file-common-handler/reset-file! repo-url config-path default-content)
             (set-global-config-state! default-content)))))

(defn restore-global-config!
  "Sets global config state from db"
  []
  (let [config-dir (global-config-dir)
        config-path (global-config-path)]
    (p/let [config-content (fs/read-file config-dir config-path)]
      (set-global-config-state! config-content))))

(defn- watch-dir!
  "Watches global config dir for given repo/db"
  [repo]
  (fs/watch-dir! (global-config-dir)
                 ;; Global dir needs to know it's current graph in order to send
                 ;; change events to the right window and graph db
                 {:current-repo-dir (config/get-repo-dir repo)}))

(defn re-watch-dir!
  "Rewatch global config dir for given repo/db. Unwatches dir first as we don't
  want multiple file watchers, especially when switching graphs"
  [repo]
  (fs/unwatch-dir! (global-config-dir))
  (watch-dir! repo))

(defn start
  "This component has four responsibilities on start:
- Fetch root-dir for later use with config paths
- Manage db and ui state of global config
- Create a global config dir and file if it doesn't exist
- Start a file watcher for global config dir"
  [{:keys [repo]}]
  (p/let [root-dir' (ipc/ipc "getLogseqDotDirRoot")
          _ (reset! root-dir root-dir')
          _ (restore-global-config!)
          _ (create-global-config-file-if-not-exists repo)
          _ (watch-dir! repo)]))
