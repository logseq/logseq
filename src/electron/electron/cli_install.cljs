(ns electron.cli-install
  (:require [clojure.string :as string]))

(def CLI_LAUNCHER_MARKER "logseq-cli-managed")

(defn split-path-env
  [path-env windows?]
  (let [separator (if windows? ";" ":")]
    (->> (string/split (or path-env "") (re-pattern separator))
         (remove string/blank?)
         distinct)))

(defn preferred-unix-cli-dir
  [{:keys [home-dir path-join ensure-dir! writable-dir?]}]
  (let [user-bin (path-join home-dir ".local" "bin")]
    (ensure-dir! user-bin)
    (when (writable-dir? user-bin)
      user-bin)))

(defn- render-unix-cli-launcher
  [exe-path cli-path]
  (str "#!/usr/bin/env sh\n"
       "# " CLI_LAUNCHER_MARKER "\n"
       "set -eu\n"
       "ELECTRON_RUN_AS_NODE=1 exec \"" exe-path "\" \"" cli-path "\" \"$@\"\n"))

(defn- render-win-cli-launcher
  [exe-path cli-path]
  (str "@echo off\r\n"
       "REM " CLI_LAUNCHER_MARKER "\r\n"
       "set ELECTRON_RUN_AS_NODE=1\r\n"
       "\"" exe-path "\" \"" cli-path "\" %*\r\n"))

(defn- launcher-exe-path
  [{:keys [windows? exe-path appimage-path]}]
  (if windows?
    exe-path
    (if (string/blank? appimage-path)
      exe-path
      appimage-path)))

(defn- write-cli-launcher!
  [{:keys [target-path content windows? exists? read-file! write-file! chmod!]}]
  (let [should-write? (if (exists? target-path)
                        (let [existing (read-file! target-path)]
                          (and (string/includes? existing CLI_LAUNCHER_MARKER)
                               (not= existing content)))
                        true)]
    (when should-write?
      (write-file! target-path content)
      (when-not windows?
        (chmod! target-path "755"))
      true)))

(defn- error-message
  [error]
  (or (some-> error .-message)
      (str error)))

(defn install-cli-launcher!
  [{:keys [windows? cli-path cli-dir cli-dir! path-join exists?
           show-error-box! t log-info! log-warn!]
    :as deps}]
  (try
    (let [cli-dir (if cli-dir! (cli-dir!) cli-dir)]
      (cond
        (not (exists? cli-path))
        (throw (js/Error. (str "Missing CLI script at " cli-path)))

        (nil? cli-dir)
        (throw (js/Error.
                (if windows?
                  "No CLI install directory found. The configured install directory could not be selected or is not writable."
                  "No CLI install directory found. Expected to install the launcher in ~/.local/bin, but that directory could not be created or is not writable.")))

        :else
        (let [target-path (path-join cli-dir (if windows? "logseq.cmd" "logseq"))
              exe-path (launcher-exe-path deps)
              content (if windows?
                        (render-win-cli-launcher exe-path cli-path)
                        (render-unix-cli-launcher exe-path cli-path))]
          (when (write-cli-launcher! (assoc deps
                                            :target-path target-path
                                            :content content))
            (log-info! :cli/install (str "Installed launcher at " target-path))))))
    (catch :default error
      (let [message (error-message error)]
        (log-warn! :cli/install "Failed to install logseq launcher" error)
        (show-error-box! "Logseq" (t :electron/cli-install-failed message))))))
