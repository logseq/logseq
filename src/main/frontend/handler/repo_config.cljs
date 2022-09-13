(ns frontend.handler.repo-config
  "This ns is a system component that encapsulates repo config functionality.
  This component only concerns itself with one user-facing repo config file,
  logseq/config.edn. In the future it may manage more files. This component
  depends on a repo."
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [frontend.handler.common :as common-handler]
            [frontend.handler.common.file :as file-common-handler]
            [cljs.reader :as reader]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [frontend.spec :as spec]
            ["path" :as path]))

(defn read-repo-config
  "Converts file content to edn and handles read failure by backing up file and
  reverting to a default file"
  [repo content]
  (common-handler/safe-read-string
   content
   (fn [_e]
     (state/pub-event! [:backup/broken-config repo content])
     (reader/read-string config/config-default-content))))

(defn set-repo-config-state!
  "Sets repo config state using given file content"
  [repo-url content]
  (let [config (read-repo-config repo-url content)]
    (state/set-config! repo-url config)
    config))

(defn- repo-config-dir
  [repo-url]
  (path/join (config/get-repo-dir repo-url) config/app-name))

(defn create-config-file-if-not-exists
  "Creates a default logseq/config.edn if it doesn't exist"
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        dir (repo-config-dir repo-url)]
    (p/let [_ (fs/mkdir-if-not-exists dir)]
           (let [default-content config/config-default-content
                 path (path/join config/app-name config/config-file)]
             (p/let [file-exists? (fs/create-if-not-exists repo-url repo-dir path default-content)]
                    (when-not file-exists?
                      (file-common-handler/reset-file! repo-url path default-content)
                      (set-repo-config-state! repo-url default-content)))))))


(defn restore-repo-config!
  "Sets repo config state from db"
  [repo-url]
  (p/let [config-dir (repo-config-dir repo-url)
          config-path (path/join config-dir config/config-file)
          config-content (fs/read-file config-dir config-path)]
         (set-repo-config-state! repo-url config-content)))

(defn start
  "This component only has one reponsibility on start, set ui state of repo
  config by reading the config file. It does not manage the repo directory,
  logseq/, as that is loosely done by repo-handler"
  [{:keys [repo]}]
  (restore-repo-config! repo))
