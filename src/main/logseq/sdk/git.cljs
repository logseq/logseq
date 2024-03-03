(ns logseq.sdk.git
  (:require [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.state :as state]
            [frontend.handler.shell :as shell]
            [frontend.config :as config]
            [frontend.fs :as fs]))

(defn ^:export exec_command
  [^js args]
  (when-let [args (and args (seq (bean/->clj args)))]
    (shell/run-git-command2! args)))

(defn ^:export load_ignore_file
  []
  (when-let [repo (state/get-current-repo)]
    (p/let [file ".gitignore"
            dir (config/get-repo-dir repo)
            _ (fs/create-if-not-exists repo dir file)
            content (fs/read-file dir file)]
           content)))

(defn ^:export save_ignore_file
  [content]
  (when-let [repo (and (string? content) (state/get-current-repo))]
    (p/let [file ".gitignore"
            dir (config/get-repo-dir repo)
            _ (fs/write-file! repo dir file content {:skip-compare? true})])))