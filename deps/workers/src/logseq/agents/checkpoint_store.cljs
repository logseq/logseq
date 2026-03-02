(ns logseq.agents.checkpoint-store
  (:require [clojure.string :as string]
            [logseq.agents.source-control :as source-control]
            [logseq.sync.common :as common]
            [promesa.core :as p]))

(def ^:private checkpoint-ttl-ms (* 30 24 60 60 1000))
(def ^:private cleanup-sample-rate 0.05)
(def ^:private cleanup-limit 200)

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- normalize-provider
  [provider]
  (some-> provider non-empty-str string/lower-case))

(defn- task-repo-url
  [task]
  (some-> (get-in task [:project :repo-url]) non-empty-str))

(defn- task-branch
  [task]
  (or (some-> (get-in task [:project :base-branch]) source-control/sanitize-branch-name)
      (some-> (get-in task [:project :branch]) source-control/sanitize-branch-name)
      "main"))

(defn- task-repo-key
  [task]
  (when-let [repo-url (task-repo-url task)]
    (let [{:keys [provider owner name]} (source-control/repo-ref repo-url)]
      (if (and (string? provider) (string? owner) (string? name))
        (str provider "/" (string/lower-case owner) "/" (string/lower-case name))
        (string/lower-case repo-url)))))

(defn- task-key
  [task]
  (let [repo-key (task-repo-key task)
        branch (some-> (task-branch task) string/lower-case)]
    (when (and (string? repo-key) (string? branch))
      {:repo-key repo-key
       :branch branch})))

(defn- normalize-checkpoint
  [checkpoint]
  (let [snapshot-id (some-> (:snapshot-id checkpoint) non-empty-str)
        provider (some-> (:provider checkpoint) normalize-provider)
        backup-key (some-> (:backup-key checkpoint) non-empty-str)
        backup-dir (some-> (:backup-dir checkpoint) non-empty-str)
        checkpoint-at (:checkpoint-at checkpoint)]
    (when (string? snapshot-id)
      (cond-> {:snapshot-id snapshot-id}
        (string? provider) (assoc :provider provider)
        (string? backup-key) (assoc :backup-key backup-key)
        (string? backup-dir) (assoc :backup-dir backup-dir)
        (number? checkpoint-at) (assoc :checkpoint-at checkpoint-at)))))

(defn- checkpoint-from-row
  [^js row]
  (when row
    (normalize-checkpoint
     {:provider (aget row "provider")
      :snapshot-id (aget row "snapshot_id")
      :backup-key (aget row "backup_key")
      :backup-dir (aget row "backup_dir")
      :checkpoint-at (aget row "checkpoint_at")})))

(defn- maybe-cleanup?
  []
  (< (js/Math.random) cleanup-sample-rate))

(defn- db-binding
  [^js env]
  (aget env "AGENTS_DB"))

(defn- <ensure-schema!
  [^js db]
  (p/do!
   (common/<d1-run db
                   (str "create table if not exists sandbox_checkpoints ("
                        "repo_key TEXT NOT NULL,"
                        "branch TEXT NOT NULL,"
                        "provider TEXT NOT NULL,"
                        "snapshot_id TEXT NOT NULL,"
                        "backup_key TEXT,"
                        "backup_dir TEXT,"
                        "checkpoint_at INTEGER NOT NULL,"
                        "updated_at INTEGER NOT NULL,"
                        "expires_at INTEGER NOT NULL,"
                        "primary key (repo_key, branch)"
                        ");"))
   (common/<d1-run db
                   "create index if not exists idx_sandbox_checkpoints_expires_at on sandbox_checkpoints(expires_at);")))

(defn- <cleanup-expired!
  [^js db now-ms]
  (common/<d1-run db
                  (str "delete from sandbox_checkpoints "
                       "where rowid in ("
                       "select rowid from sandbox_checkpoints where expires_at <= ? limit ?"
                       ")")
                  now-ms
                  cleanup-limit))

(defn <load-checkpoint-for-task!
  [^js env task]
  (if-let [db (db-binding env)]
    (if-let [{:keys [repo-key branch]} (task-key task)]
      (p/let [_ (<ensure-schema! db)
              now-ms (common/now-ms)
              _ (when (maybe-cleanup?)
                  (<cleanup-expired! db now-ms))
              result (common/<d1-all db
                                     (str "select provider, snapshot_id, backup_key, backup_dir, checkpoint_at "
                                          "from sandbox_checkpoints "
                                          "where repo_key = ? and branch = ? and expires_at > ? "
                                          "limit 1")
                                     repo-key
                                     branch
                                     now-ms)
              rows (common/get-sql-rows result)]
        (checkpoint-from-row (first rows)))
      (p/resolved nil))
    (p/resolved nil)))

(defn <upsert-checkpoint-for-task!
  [^js env task checkpoint]
  (if-let [db (db-binding env)]
    (if-let [{:keys [repo-key branch]} (task-key task)]
      (if-let [checkpoint (normalize-checkpoint checkpoint)]
        (let [checkpoint-at (or (:checkpoint-at checkpoint) (common/now-ms))
              updated-at (common/now-ms)
              expires-at (+ checkpoint-at checkpoint-ttl-ms)
              provider (or (:provider checkpoint) "unknown")
              backup-key (:backup-key checkpoint)
              backup-dir (:backup-dir checkpoint)]
          (p/let [_ (<ensure-schema! db)
                  _ (common/<d1-run db
                                    (str "insert into sandbox_checkpoints "
                                         "(repo_key, branch, provider, snapshot_id, backup_key, backup_dir, checkpoint_at, updated_at, expires_at) "
                                         "values (?, ?, ?, ?, ?, ?, ?, ?, ?) "
                                         "on conflict(repo_key, branch) do update set "
                                         "provider = excluded.provider, "
                                         "snapshot_id = excluded.snapshot_id, "
                                         "backup_key = excluded.backup_key, "
                                         "backup_dir = excluded.backup_dir, "
                                         "checkpoint_at = excluded.checkpoint_at, "
                                         "updated_at = excluded.updated_at, "
                                         "expires_at = excluded.expires_at")
                                    repo-key
                                    branch
                                    provider
                                    (:snapshot-id checkpoint)
                                    backup-key
                                    backup-dir
                                    checkpoint-at
                                    updated-at
                                    expires-at)
                  _ (when (maybe-cleanup?)
                      (<cleanup-expired! db updated-at))]
            checkpoint))
        (p/resolved nil))
      (p/resolved nil))
    (p/resolved nil)))
