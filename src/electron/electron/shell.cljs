(ns electron.shell
  (:require
   [clojure.string :as string]
   [electron.state :as state]
   [clojure.set :as set]
   [electron.logger :as logger]
   ["child_process" :as child-process]
   ["command-exists" :as command-exists]))

(def commands-allowlist
  #{"git" "pandoc" "ag" "grep" "alda"})

;(def commands-denylist
;  #{"rm" "mv" "rename" "dd" ">" "command" "sudo"})

(defn- get-commands-allowlist
  []
  (set/union (set (some->> (map #(some-> % str string/trim string/lower-case)
                                (get-in @state/state [:config :commands-allowlist]))
                           (remove nil?)))
             commands-allowlist))

(defn- run-command!
  [command args on-data on-exit]
  (logger/debug "Shell: " (str command " " args))
  (let [job (child-process/spawn (str command " " args)
                                 #js []
                                 #js {:shell true :detached false})]

    (.on (.-stderr job) "data" on-data)
    (.on (.-stdout job) "data" on-data)
    (.on job "close" on-exit)

    job))

(defn- ensure-command-exists
  [command]
  (when-not
   (some->> command (.sync command-exists))
    (throw (js/Error. (str "Shell: " command " does not exist!")))) command)

(defn- ensure-command-in-allowlist
  [command]
  (when-not
   (some->> command (contains? (get-commands-allowlist)))
    (throw (js/Error. (str "Shell: " command " is not allowed!")))) command)

(defn run-command-safely!
  [command args on-data on-exit]
  (when (some-> command str string/trim string/lower-case
                (ensure-command-exists)
                (ensure-command-in-allowlist))
    (run-command! command args on-data on-exit)))
