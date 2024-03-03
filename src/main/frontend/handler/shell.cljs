(ns frontend.handler.shell
  "Git related handler fns"
  (:require [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.graph-parser.util :as gp-util]
            [promesa.core :as p]))

(defn run-git-command!
  [command]
  (ipc/ipc :runGit {:repo (state/get-current-repo)
                    :command command}))

(defn run-git-command2!
  [command]
  (ipc/ipc :runGitWithinCurrentGraph {:repo (state/get-current-repo) 
                                      :command command}))

(defn run-cli-command!
  [command args]
  (ipc/ipc :runCli {:command      command
                    :args         args
                    :returnResult true}))

(defn wrap-notification!
  [command f args]
  (p/let [result (f command args)]
    (notification/show!
     (if (string/blank? result)
       [:p [:code.mr-1 (str command " " args)]
        "was executed successfully!"]
       result)
     :success
     false)))

(def commands-denylist
  #{"rm" "mv" "rename" "dd" ">" "command" "sudo"})

(defn run-command!
  [command]
  (let [[command args]
        (if (and (string? command) (string/includes? command " "))
          (gp-util/split-first " " command)
          [command ""])
        command (and command (string/lower-case command))
        args (-> args str string/trim)]
    (when-not (string/blank? command)
      (cond
        (contains? commands-denylist command)
        (notification/show!
         [:div (str command " is too dangerous!")]
         :error)

        (= "git" command)
        (wrap-notification! command (fn [_ args] (run-git-command! args)) args)

        :else
        (run-cli-command! command args)))))


(defn get-file-latest-git-log
  [page n]
  (when (integer? n)
    (let [file-id (:db/id (:block/file page))]
      (when-let [path (:file/path (db/entity file-id))]
        (p/let [result (run-git-command! ["log" (str "-" n) "--pretty=format:Commit: %C(auto)%h$$$%s$$$%ad" "-p" path])
                lines (->> (string/split-lines result)
                           (filter #(string/starts-with? % "Commit: ")))]
          (state/pub-event! [:modal/display-file-version-selector  lines path  (fn [hash path] (run-git-command! ["show" (str hash ":" path)]))]))))))


(defn set-git-username-and-email
  [username email]
  (p/let [_r1 (run-git-command! ["config" "--global" "user.name" username])
          _r2 (run-git-command! ["config" "--global" "user.email" email])]
    (state/close-modal!)
    (notification/show!
     [:div "git config successfully!"]
     :success)))

(defn run-cli-command-wrapper!
  [command content]
  (let [args (case command
               "alda" (util/format "play -c \"%s\"" content)
               ;; TODO: plugin slot
               content)]
    (run-cli-command! command args)))
