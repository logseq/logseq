(ns frontend.handler.shell
  "Git related handler fns"
  (:require [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.handler.notification :as notification]
            [frontend.util :as util]
            [logseq.common.util :as common-util]))

(defn run-cli-command!
  [command args]
  (ipc/ipc :runCli {:command      command
                    :args         args
                    :returnResult true}))

(def commands-denylist
  #{"rm" "mv" "rename" "dd" ">" "command" "sudo"})

(defn run-command!
  [command]
  (let [[command args]
        (if (and (string? command) (string/includes? command " "))
          (common-util/split-first " " command)
          [command ""])
        command (and command (string/lower-case command))
        args (-> args str string/trim)]
    (when-not (string/blank? command)
      (cond
        (contains? commands-denylist command)
        (notification/show!
         [:div (str command " is too dangerous!")]
         :error)

        :else
        (run-cli-command! command args)))))

(defn run-cli-command-wrapper!
  [command content]
  (let [args (case command
               "alda" (util/format "play -c \"%s\"" content)
               ;; TODO: plugin slot
               content)]
    (run-cli-command! command args)))
