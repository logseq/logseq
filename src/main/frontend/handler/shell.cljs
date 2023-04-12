(ns frontend.handler.shell
  "Git related handler fns"
  (:require [electron.ipc :as ipc]
            [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]
            [frontend.handler.notification :as notification]
            [promesa.core :as p]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.config :as config]
            [frontend.util :as util]))

(defn run-git-command!
  [command]
  (ipc/ipc :runGit command))

(defn run-git-command2!
  [command]
  (ipc/ipc :runGitWithinCurrentGraph command))

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
       [:p [:code.mr-1 (str command " " args) ]
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

;; git show $REV:$FILE
(defn- get-versioned-file-content
  [hash path]
  (when (and hash path)
    (let [repo (state/get-current-repo)
          local-dir (config/get-local-dir repo)
          path (string/replace path (str local-dir "/") "")]
      (p/let [content (run-git-command! ["show" (str hash ":" path)])]
        (state/pub-event! [:modal/display-file-version path content hash])))))

(defn get-file-latest-git-log
  [page n]
  (when (integer? n)
    (let [file-id (:db/id (:block/file page))]
      (when-let [path (:file/path (db/entity file-id))]
        (p/let [result (run-git-command! ["log" (str "-" n) "--pretty=format:Commit: %C(auto)%h$$$%s$$$%ad" "-p" path])
                lines (->> (string/split-lines result)
                           (filter #(string/starts-with? % "Commit: ")))]
          (notification/show! [:div
                               [:div.font-bold "File history - " path]
                               (for [line lines]
                                 (let [[hash title time] (string/split line "$$$")
                                       hash (subs hash 8)]
                                   [:div.my-4 {:key hash}
                                    [:hr]
                                    [:div.mb-2
                                     [:a.font-medium.mr-1.inline
                                      {:on-click (fn [] (get-versioned-file-content hash path))}
                                      hash]
                                     title]
                                    [:div.opacity-50 time]]))] :success false))))))

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
