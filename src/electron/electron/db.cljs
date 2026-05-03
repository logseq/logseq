(ns electron.db
  "Provides SQLite dbs for electron and manages files of those dbs"
  (:require ["fs-extra" :as fs]
            ["path" :as node-path]
            [electron.backup-file :as backup-file]
            [electron.db-worker :as db-worker]
            [lambdaisland.glogi :as log]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.cli.transport :as cli-transport]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.sqlite.backup :as sqlite-backup]
            [promesa.core :as p]))

(def ^:private backup-interval-ms
  (* 60 60 1000))

(defonce *auto-backup
  (atom {:window->repo {}
         :interval-id nil}))

(defn ensure-graphs-dir!
  []
  (fs/ensureDirSync (cli-common-graph/get-db-graphs-dir)))

(defn ensure-graph-dir!
  [db-name]
  (ensure-graphs-dir!)
  (let [graph-dir (node-path/join (cli-common-graph/get-db-graphs-dir)
                                  (graph-dir/repo->encoded-graph-dir-name db-name))]
    (fs/ensureDirSync graph-dir)
    graph-dir))

(defn get-db
  [db-name]
  (let [_ (ensure-graph-dir! db-name)
        [_db-name db-path] (common-sqlite/get-db-full-path (cli-common-graph/get-db-graphs-dir) db-name)]
    (when (fs/existsSync db-path)
      (fs/readFileSync db-path))))

(defn- temp-backup-path
  [backups-path]
  (node-path/join backups-path
                  (str ".tmp."
                       (.now js/Date)
                       "."
                       (rand-int 1000000)
                       ".sqlite")))

(defn backup-db-with-sqlite-backup!
  [db-name {:keys [force-backup? sqlite-backup!]}]
  (let [_ (ensure-graph-dir! db-name)
        [_db-name db-path] (common-sqlite/get-db-full-path (cli-common-graph/get-db-graphs-dir) db-name)
        backups-path (common-sqlite/get-db-backups-path (cli-common-graph/get-db-graphs-dir) db-name)]
    (when (fs/existsSync db-path)
      (let [tmp-path (temp-backup-path backups-path)]
        (-> (p/let [_ (fs/ensureDirSync backups-path)
                    _ (sqlite-backup! db-path tmp-path)
                    payload (fs/readFileSync tmp-path)]
              (backup-file/backup-file db-name nil nil
                                       ".sqlite"
                                       payload
                                       :backups-dir backups-path
                                       :keep-versions 12
                                       :force-backup? force-backup?))
            (p/finally (fn []
                         (try
                           (fs/removeSync tmp-path)
                           (catch :default _
                             nil)))))))))

(defn backup-db!
  [db-name opts]
  (backup-db-with-sqlite-backup!
   db-name
   (assoc opts :sqlite-backup! sqlite-backup/backup-db-file!)))

(defn backup-db-via-worker!
  [db-name window-id opts]
  (backup-db-with-sqlite-backup!
   db-name
   (assoc opts
          :sqlite-backup!
          (fn [_src-path dst-path]
            (p/let [runtime (db-worker/ensure-runtime! db-name window-id)]
              (cli-transport/invoke runtime
                                    :thread-api/backup-db-sqlite
                                    false
                                    [db-name dst-path]))))))

(defn- active-repo-window-ids
  []
  (let [repo->window-ids (reduce-kv (fn [m window-id repo]
                                      (if (seq repo)
                                        (update m repo (fnil conj []) window-id)
                                        m))
                                    {}
                                    (:window->repo @*auto-backup))]
    (mapv (fn [[repo window-ids]]
            [repo (first window-ids)])
          repo->window-ids)))

(defn run-auto-backup!
  []
  (p/all
   (for [[repo window-id] (active-repo-window-ids)]
     (-> (backup-db-via-worker! repo window-id {})
         (p/catch (fn [error]
                    (log/warn :electron/auto-db-backup-failed
                              {:repo repo
                               :error error})
                    nil))))))

(defn- reconcile-auto-backup-timer!
  []
  (let [{:keys [interval-id]} @*auto-backup
        has-repos? (seq (active-repo-window-ids))]
    (cond
      (and has-repos? (nil? interval-id))
      (let [id (js/setInterval (fn [] (run-auto-backup!))
                               backup-interval-ms)]
        (swap! *auto-backup assoc :interval-id id))

      (and (not has-repos?) interval-id)
      (do
        (js/clearInterval interval-id)
        (swap! *auto-backup assoc :interval-id nil))

      :else
      nil)))

(defn sync-auto-backup-repo!
  [window-id repo]
  (swap! *auto-backup
         (fn [state]
           (if (seq repo)
             (assoc-in state [:window->repo window-id] repo)
             (update state :window->repo dissoc window-id))))
  (reconcile-auto-backup-timer!)
  nil)

(defn reset-auto-backup!
  []
  (when-let [interval-id (:interval-id @*auto-backup)]
    (js/clearInterval interval-id))
  (reset! *auto-backup {:window->repo {}
                        :interval-id nil}))
