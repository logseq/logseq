(ns frontend.handler.repo-config
  "This ns is a system component that encapsulates repo config functionality.
  This component only concerns itself with one user-facing repo config file,
  logseq/config.edn. In the future it may manage more files. This component
  depends on a repo."
  (:require [frontend.db :as db]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.handler.common :as common-handler]
            [frontend.handler.common.file :as file-common-handler]
            [cljs.reader :as reader]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [frontend.spec :as spec]))

(defn- get-repo-config-content
  [repo-url]
  (db/get-file repo-url (config/get-repo-config-path)))

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

(defn create-config-file-if-not-exists
  "Creates a default logseq/config.edn if it doesn't exist"
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        app-dir config/app-name
        dir (str repo-dir "/" app-dir)]
    (p/let [_ (fs/mkdir-if-not-exists dir)]
           (let [default-content config/config-default-content
                  path (str app-dir "/" config/config-file)]
             (p/let [file-exists? (fs/create-if-not-exists repo-url repo-dir (str app-dir "/" config/config-file) default-content)]
                    (when-not file-exists?
                      (file-common-handler/reset-file! repo-url path default-content)
                      (set-repo-config-state! repo-url default-content)))))))

(defn restore-repo-config!
  "Sets repo config state from db"
  [repo-url]
  (let [config-content (get-repo-config-content repo-url)]
    (set-repo-config-state! repo-url config-content)))

(defn start
  "This component only has one reponsibility on start, to manage db and ui state
  from repo config. It does not manage the repo directory, logseq/, as that is
  loosely done by repo-handler"
  [{:keys [repo]}]
  (restore-repo-config! repo))
