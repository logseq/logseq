(ns logseq.cli.e2e.sync-fixture
  (:require [babashka.fs :as fs]
            [clojure.string :as string]
            [logseq.cli.e2e.paths :as paths]
            [logseq.cli.e2e.runner :as runner]
            [logseq.cli.e2e.shell :as shell]))

(def default-sync-port "18080")
(def default-e2ee-password "11111")

(def ^:private heavy-setup-patterns
  [#"^mkdir -p '\{\{tmp-dir\}\}/home/logseq'$"
   #"^cp ~/logseq/auth\.json\b"
   #"prepare_sync_config\.py"
   #"db_sync_server\.py'? start"])

(def ^:private heavy-cleanup-patterns
  [#"db_sync_server\.py'? stop"])

(defn- shell-quote
  [value]
  (runner/shell-escape value))

(defn- heavy-command?
  [command patterns]
  (boolean (some #(re-find % command) patterns)))

(defn before-suite!
  [{:keys [run-command sync-port]
    :or {run-command shell/run!
         sync-port default-sync-port}}]
  (let [sync-port (str sync-port)
        suite-tmp-dir (str (fs/create-temp-dir {:prefix "logseq-cli-e2e-sync-suite-"}))
        suite-home-dir (str (fs/path suite-tmp-dir "home"))
        suite-auth-path (str (fs/path suite-home-dir "logseq" "auth.json"))
        suite-config-path (str (fs/path suite-tmp-dir "sync-suite.edn"))
        db-sync-pid-file (str (fs/path suite-tmp-dir "db-sync-server.pid"))
        db-sync-log-file (str (fs/path suite-tmp-dir "db-sync-server.log"))
        db-sync-data-dir (str (fs/path suite-tmp-dir "db-sync-server-data"))
        sync-http-base (str "http://127.0.0.1:" sync-port)
        sync-ws-url (str "ws://127.0.0.1:" sync-port "/sync/%s")
        run! (fn [cmd]
               (run-command {:cmd cmd
                             :dir (paths/repo-root)}))
        prepare-sync-config-cmd (format "python3 %s --output %s --auth-path %s --http-base %s --ws-url %s"
                                        (shell-quote (paths/repo-path "cli-e2e" "scripts" "prepare_sync_config.py"))
                                        (shell-quote suite-config-path)
                                        (shell-quote suite-auth-path)
                                        (shell-quote sync-http-base)
                                        (shell-quote sync-ws-url))
        start-db-sync-cmd (format "python3 %s start --repo-root %s --pid-file %s --log-file %s --data-dir %s --port %s --startup-timeout-s 60 --auth-path %s"
                                  (shell-quote (paths/repo-path "cli-e2e" "scripts" "db_sync_server.py"))
                                  (shell-quote (paths/repo-root))
                                  (shell-quote db-sync-pid-file)
                                  (shell-quote db-sync-log-file)
                                  (shell-quote db-sync-data-dir)
                                  sync-port
                                  (shell-quote suite-auth-path))]
    (fs/create-dirs (fs/parent suite-auth-path))
    (run! (format "cp ~/logseq/auth.json %s" (shell-quote suite-auth-path)))
    (run! prepare-sync-config-cmd)
    (run! start-db-sync-cmd)
    {:suite-tmp-dir suite-tmp-dir
     :suite-home-dir suite-home-dir
     :suite-auth-path suite-auth-path
     :suite-config-path suite-config-path
     :db-sync-pid-file db-sync-pid-file
     :db-sync-log-file db-sync-log-file
     :db-sync-data-dir db-sync-data-dir
     :sync-port sync-port
     :sync-http-base sync-http-base
     :sync-ws-url sync-ws-url}))

(defn prepare-case
  [case {:keys [suite-auth-path suite-config-path sync-port sync-http-base sync-ws-url e2ee-password]}]
  (let [e2ee-password (or e2ee-password default-e2ee-password)
        lightweight-setup-prefix ["mkdir -p '{{tmp-dir}}/home/logseq'"
                                  "cp '{{suite-auth-path}}' '{{tmp-dir}}/home/logseq/auth.json'"
                                  "cp '{{suite-config-path}}' '{{config-path}}'"
                                  "cp '{{suite-config-path}}' '{{tmp-dir}}/cli-b.edn'"]
        setup' (->> (:setup case)
                    (remove #(heavy-command? % heavy-setup-patterns))
                    vec)
        cleanup' (->> (:cleanup case)
                      (remove #(heavy-command? % heavy-cleanup-patterns))
                      vec)]
    (-> case
        (update :vars merge {:suite-auth-path suite-auth-path
                             :suite-config-path suite-config-path
                             :sync-port sync-port
                             :sync-http-base sync-http-base
                             :sync-ws-url sync-ws-url
                             :e2ee-password e2ee-password
                             :e2ee-password-arg (shell-quote e2ee-password)})
        (assoc :setup (vec (concat lightweight-setup-prefix setup')))
        (assoc :cleanup cleanup'))))

(defn after-suite!
  [{:keys [db-sync-pid-file]}
   {:keys [run-command]
    :or {run-command shell/run!}}]
  (when (and (string? db-sync-pid-file)
             (not (string/blank? db-sync-pid-file)))
    (run-command {:cmd (format "python3 %s stop --pid-file %s"
                               (shell-quote (paths/repo-path "cli-e2e" "scripts" "db_sync_server.py"))
                               (shell-quote db-sync-pid-file))
                  :dir (paths/repo-root)
                  :throw? false})))
