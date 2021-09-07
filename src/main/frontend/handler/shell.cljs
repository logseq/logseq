(ns frontend.handler.shell
  (:require [electron.ipc :as ipc]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.handler.notification :as notification]
            [promesa.core :as p]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.config :as config]))

(defn run-git-command!
  [command]
  (ipc/ipc "runGit" command))

;; TODO: export to pdf/html/word
(defn run-pandoc-command!
  [command]
  (ipc/ipc "runPandoc" command))

(defn wrap-notification!
  [command f args]
  (p/let [result (f args)]
    (notification/show!
     (if (string/blank? result)
       [:p [:code.mr-1 (str command " " args) ]
        "was executed successfully!"]
       result)
     :success
     false)))

(defn run-command!
  [command]
  (let [[command args] (util/split-first " " command)
        command (and command (string/lower-case command))]
    (when (and (not (string/blank? command)) (not (string/blank? args)))
      (let [args (string/trim args)]
        (case (keyword command)
         :git
         (wrap-notification! command run-git-command! args)

         ;; :pandoc
         ;; (wrap-notification! command run-pandoc-command! args)

         (notification/show!
          [:div (str command " is not supported yet!")]
          :error))))))

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
  (p/let [r1 (run-git-command! ["config" "--global" "user.name" username])
          r2 (run-git-command! ["config" "--global" "user.email" email])]
    (state/close-modal!)
    (notification/show!
     [:div "git config successfully!"]
     :success)))
