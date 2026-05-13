(ns logseq.cli.e2e.sync-fixture
  (:require [babashka.fs :as fs]
            [clojure.string :as string]
            [logseq.cli.e2e.paths :as paths]
            [logseq.cli.e2e.runner :as runner]
            [logseq.cli.e2e.shell :as shell]))

(def default-sync-port "18080")
(def default-e2ee-password "11111")
(def default-user-keys-graph "sync-e2e-user-keys-bootstrap")

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

(defn- case-local-setup-prefix
  []
  ["mkdir -p '{{tmp-dir}}/home/logseq'"
   "cp ~/logseq/auth.json '{{tmp-dir}}/home/logseq/auth.json'"
   "python3 '{{repo-root}}/cli-e2e/scripts/prepare_sync_config.py' --output '{{config-path}}' --auth-path '{{tmp-dir}}/home/logseq/auth.json' --http-base '{{sync-http-base}}' --ws-url '{{sync-ws-url}}'"
   "python3 '{{repo-root}}/cli-e2e/scripts/prepare_sync_config.py' --output '{{tmp-dir}}/cli-b.edn' --auth-path '{{tmp-dir}}/home/logseq/auth.json' --http-base '{{sync-http-base}}' --ws-url '{{sync-ws-url}}'"])

(def ^:private case-local-resource-markers
  ["{{cli-home}}"
   "{{config-path}}"
   "{{config-path-arg}}"
   "{{tmp-dir}}/cli-b.edn"
   "{{auth-path}}"
   "{{home-dir}}"])

(defn- requires-case-local-resources?
  [command]
  (boolean (some #(string/includes? command %) case-local-resource-markers)))

(defn- suite-user-keys-bootstrap-command
  [suite-tmp-dir]
  (let [lock-dir (shell-quote (str (fs/path suite-tmp-dir "user-rsa-keys.lock")))
        done-file (shell-quote (str (fs/path suite-tmp-dir "user-rsa-keys.ready")))]
    (format (str "LOCK_DIR=%s; DONE_FILE=%s; "
                 "if [ -f \"$DONE_FILE\" ]; then exit 0; fi; "
                 "while ! mkdir \"$LOCK_DIR\" 2>/dev/null; do [ -f \"$DONE_FILE\" ] && exit 0; sleep 0.1; done; "
                 "trap 'rmdir \"$LOCK_DIR\" 2>/dev/null || true' EXIT; "
                 "if [ ! -f \"$DONE_FILE\" ]; then "
                 "{{cli-home}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json graph create --graph {{user-keys-graph-arg}} >/dev/null 2>/dev/null || true; "
                 "if {{cli-home}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json sync ensure-keys --graph {{user-keys-graph-arg}} --e2ee-password {{e2ee-password-arg}} --upload-keys >/dev/null; then "
                 "{{cli-home}} --root-dir {{root-dir-arg}} --config {{config-path-arg}} --output json server stop --graph {{user-keys-graph-arg}} >/dev/null 2>/dev/null || true; "
                 "touch \"$DONE_FILE\"; "
                 "else exit 1; fi; "
                 "fi")
            lock-dir
            done-file)))

(defn before-suite!
  [{:keys [run-command sync-port]
    :or {run-command shell/run!
         sync-port default-sync-port}}]
  (let [sync-port (str sync-port)
        suite-tmp-dir (str (fs/create-temp-dir {:prefix "logseq-cli-e2e-sync-suite-"}))
        db-sync-pid-file (str (fs/path suite-tmp-dir "db-sync-server.pid"))
        db-sync-log-file (str (fs/path suite-tmp-dir "db-sync-server.log"))
        db-sync-root-dir (str (fs/path suite-tmp-dir "db-sync-server-data"))
        sync-http-base (str "http://127.0.0.1:" sync-port)
        sync-ws-url (str "ws://127.0.0.1:" sync-port "/sync/%s")
        auth-path (str (fs/path (System/getProperty "user.home") "logseq" "auth.json"))
        start-db-sync-cmd (format "python3 %s start --repo-root %s --pid-file %s --log-file %s --data-dir %s --port %s --startup-timeout-s 60 --auth-path %s"
                                  (shell-quote (paths/repo-path "cli-e2e" "scripts" "db_sync_server.py"))
                                  (shell-quote (paths/repo-root))
                                  (shell-quote db-sync-pid-file)
                                  (shell-quote db-sync-log-file)
                                  (shell-quote db-sync-root-dir)
                                  sync-port
                                  (shell-quote auth-path))]
    (run-command {:cmd start-db-sync-cmd
                  :dir (paths/repo-root)})
    {:suite-tmp-dir suite-tmp-dir
     :db-sync-pid-file db-sync-pid-file
     :db-sync-log-file db-sync-log-file
     :db-sync-root-dir db-sync-root-dir
     :sync-port sync-port
     :sync-http-base sync-http-base
     :sync-ws-url sync-ws-url}))

(defn prepare-case
  [case {:keys [suite-tmp-dir sync-port sync-http-base sync-ws-url e2ee-password]}]
  (let [e2ee-password (or e2ee-password default-e2ee-password)
        user-keys-graph (or (get-in case [:vars :user-keys-graph])
                            default-user-keys-graph)
        setup-commands (vec (:setup case))
        insertion-point? (fn [command]
                           (or (heavy-command? command heavy-setup-patterns)
                               (requires-case-local-resources? command)))
        leading-setup (->> setup-commands
                           (take-while #(not (insertion-point? %)))
                           vec)
        trailing-setup (->> setup-commands
                            (drop (count leading-setup))
                            (remove #(heavy-command? % heavy-setup-patterns))
                            vec)
        bootstrap-setup (when suite-tmp-dir
                          [(suite-user-keys-bootstrap-command suite-tmp-dir)])
        cleanup' (->> (:cleanup case)
                      (remove #(heavy-command? % heavy-cleanup-patterns))
                      vec)]
    (-> case
        (update :vars merge {:sync-port sync-port
                             :sync-http-base sync-http-base
                             :sync-ws-url sync-ws-url
                             :e2ee-password e2ee-password
                             :e2ee-password-arg (shell-quote e2ee-password)
                             :user-keys-graph-arg (shell-quote user-keys-graph)})
        (assoc :setup (vec (concat leading-setup
                                   (case-local-setup-prefix)
                                   bootstrap-setup
                                   trailing-setup)))
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
