(ns electron.shell
  (:require
   [clojure.string :as string]
   [electron.state :as state]
   [clojure.set :as set]
   ["child_process" :as child-process]
   ["command-exists" :as command-exists]))

(def commands-whitelist
  #{"git" "pandoc" "ag" "grep" "alda"})

(def dangerous-commands
  #{"rm" "mv" "rename" "dd" ">" "command" "sudo"})

(defn- get-commands-whitelist
  []
  (set/union (set (some->> (map #(some-> % str string/trim string/lower-case)
                                (get-in @state/state [:config :commands-whitelist]))
                           (remove nil?)))
             commands-whitelist))

(defn- run-command!
  [command args listener]
  (let [job (child-process/spawn (str command " " args)
                                 #js []
                                 #js {:shell true :detached true})]

    (.on (.-stderr job) "data" listener)
    (.on (.-stdout job) "data" listener)

    job))

(defn- ensure-command-exists
  [command]
  (when-not
   (some->> command (.sync command-exists))
    (throw (js/Error. (str "Shell: " command " not exist!")))) command)

(defn- ensure-command-in-whitelist
  [command]
  (when-not
   (some->> command (contains? (get-commands-whitelist)))
    (throw (js/Error. (str "Shell: " command " not be allowed!")))) command)

(defn run-command-safety!
  [command args listener]
  (when (some-> command str string/trim string/lower-case
                (ensure-command-exists)
                (ensure-command-in-whitelist))
    (run-command! command args listener)))
