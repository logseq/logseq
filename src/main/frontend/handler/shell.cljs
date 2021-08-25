(ns frontend.handler.shell
  (:require [electron.ipc :as ipc]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.handler.notification :as notification]))

(defn run-git-command!
  [command]
  (ipc/ipc "runGit" command))

(defn run-pandoc-command!
  [command]
  (ipc/ipc "runPandoc" command))

(defn run-command!
  [command]
  (let [[command args] (util/split-first " " command)
        command (and command (string/lower-case command))]
    (when (and (not (string/blank? command)) (not (string/blank? args)))
      (let [args (string/trim args)]
        (case (keyword command)
         :git
         (run-git-command! args)

         :pandoc
         (run-pandoc-command! args)

         (notification/show!
          [:div (str command " is not supported yet!")]
          :error))))))
