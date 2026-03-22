(ns logseq.cli.e2e.cleanup
  (:require [babashka.fs :as fs]
            [clojure.java.shell :as java-shell]
            [clojure.string :as string]))

(def ^:private cli-e2e-temp-prefix "logseq-cli-e2e-")

(defn- parse-ps-line
  [line]
  (when-let [[_ pid-str command] (re-matches #"\s*(\d+)\s+(.*)" (or line ""))]
    {:pid (Long/parseLong pid-str)
     :command command}))

(defn- cli-e2e-db-worker-command?
  [command]
  (and (re-find #"db-worker-node(?:\.js)?\b" command)
       (re-find #"logseq-cli-e2e-" command)))

(defn list-cli-e2e-db-worker-pids
  ([]
   (list-cli-e2e-db-worker-pids {}))
  ([{:keys [shell-fn]
     :or {shell-fn java-shell/sh}}]
   (let [{:keys [exit out err]} (shell-fn "ps" "-ax" "-o" "pid=" "-o" "command=")]
     (when-not (zero? exit)
       (throw (ex-info "Unable to scan processes"
                       {:exit exit
                        :err err})))
     (->> (string/split-lines (or out ""))
          (keep parse-ps-line)
          (filter (fn [{:keys [command]}]
                    (cli-e2e-db-worker-command? command)))
          (mapv :pid)))))

(defn- pid-alive?
  [pid]
  (zero? (:exit (java-shell/sh "kill" "-0" (str pid)))))

(defn- kill-pid!
  [pid]
  (try
    (if-not (pid-alive? pid)
      :not-found
      (do
        (java-shell/sh "kill" "-TERM" (str pid))
        (Thread/sleep 100)
        (if-not (pid-alive? pid)
          :killed
          (do
            (java-shell/sh "kill" "-KILL" (str pid))
            (Thread/sleep 50)
            (if (pid-alive? pid)
              :failed
              :killed)))))
    (catch Exception _
      :failed)))

(defn cleanup-db-worker-processes!
  ([]
   (cleanup-db-worker-processes! {}))
  ([{:keys [dry-run list-pids-fn kill-pid-fn]}]
   (let [list-pids-fn (or list-pids-fn list-cli-e2e-db-worker-pids)
         kill-pid-fn (or kill-pid-fn kill-pid!)
         found-pids (vec (list-pids-fn))]
     (if dry-run
       {:dry-run? true
        :found-pids found-pids
        :would-kill-pids found-pids
        :killed-pids []
        :failed-pids []}
       (let [{:keys [killed-pids failed-pids]}
             (reduce (fn [acc pid]
                       (if (= :failed (kill-pid-fn pid))
                         (update acc :failed-pids conj pid)
                         (update acc :killed-pids conj pid)))
                     {:killed-pids []
                      :failed-pids []}
                     found-pids)]
         {:dry-run? false
          :found-pids found-pids
          :would-kill-pids []
          :killed-pids killed-pids
          :failed-pids failed-pids})))))

(defn- list-cli-e2e-temp-graph-dirs
  [tmp-root]
  (->> (fs/glob tmp-root (str cli-e2e-temp-prefix "*/graphs"))
       (filter fs/directory?)
       (mapv str)))

(defn cleanup-temp-graph-dirs!
  ([]
   (cleanup-temp-graph-dirs! {}))
  ([{:keys [dry-run tmp-root list-dirs-fn delete-dir-fn]
     :or {tmp-root (System/getProperty "java.io.tmpdir")
          delete-dir-fn fs/delete-tree}}]
   (let [list-dirs-fn (or list-dirs-fn
                          #(list-cli-e2e-temp-graph-dirs tmp-root))
         found-dirs (vec (list-dirs-fn))]
     (if dry-run
       {:dry-run? true
        :found-dirs found-dirs
        :would-remove-dirs found-dirs
        :removed-dirs []
        :failed-dirs []}
       (let [{:keys [removed-dirs failed-dirs]}
             (reduce (fn [acc dir]
                       (try
                         (delete-dir-fn dir)
                         (update acc :removed-dirs conj dir)
                         (catch Exception _
                           (update acc :failed-dirs conj dir))))
                     {:removed-dirs []
                      :failed-dirs []}
                     found-dirs)]
         {:dry-run? false
          :found-dirs found-dirs
          :would-remove-dirs []
          :removed-dirs removed-dirs
          :failed-dirs failed-dirs})))))
