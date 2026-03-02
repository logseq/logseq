(ns logseq.agents.workspace-bundle-store
  (:require [clojure.string :as string]
            [logseq.agents.source-control :as source-control]
            [logseq.sync.common :as common]
            [promesa.core :as p]))

(def ^:private bundle-ttl-ms (* 30 24 60 60 1000))
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

(defn- maybe-cleanup?
  []
  (< (js/Math.random) cleanup-sample-rate))

(defn- db-binding
  [^js env]
  (aget env "AGENTS_DB"))

(defn- sanitize-object-key-part
  [value]
  (let [value (or (some-> value str string/lower-case) "unknown")
        value (-> value
                  (string/replace #"[^a-z0-9./_-]+" "-")
                  (string/replace #"-+" "-")
                  (string/replace #"^-+" "")
                  (string/replace #"-+$" ""))]
    (if (string/blank? value)
      "unknown"
      value)))

(defn bundle-object-key-for-task
  [task bundle-id]
  (when-let [{:keys [repo-key branch]} (task-key task)]
    (str "workspace-bundles/"
         (sanitize-object-key-part repo-key)
         "/"
         (sanitize-object-key-part branch)
         "/"
         (sanitize-object-key-part (or bundle-id (str (random-uuid))))
         ".bundle.b64")))

(defn- normalize-bundle
  [bundle]
  (let [bundle-id (some-> (:bundle-id bundle) non-empty-str)
        session-id (some-> (:session-id bundle) non-empty-str)
        object-key (some-> (:object-key bundle) non-empty-str)
        provider (some-> (:provider bundle) normalize-provider)
        snapshot-id (some-> (:snapshot-id bundle) non-empty-str)
        backup-key (some-> (:backup-key bundle) non-empty-str)
        backup-dir (some-> (:backup-dir bundle) non-empty-str)
        bundle-seq (:bundle-seq bundle)
        head-sha (some-> (:head-sha bundle) non-empty-str)
        base-sha (some-> (:base-sha bundle) non-empty-str)
        head-branch (some-> (:head-branch bundle) source-control/sanitize-branch-name)
        byte-size (or (:byte-size bundle) 0)
        checksum (some-> (:checksum bundle) non-empty-str)
        created-at (or (:created-at bundle) (common/now-ms))]
    (when (and (string? bundle-id)
               (string? session-id)
               (string? object-key)
               (number? byte-size)
               (pos? byte-size))
      (cond-> {:bundle-id bundle-id
               :session-id session-id
               :object-key object-key
               :byte-size byte-size
               :created-at created-at}
        (number? bundle-seq) (assoc :bundle-seq bundle-seq)
        (string? provider) (assoc :provider provider)
        (string? snapshot-id) (assoc :snapshot-id snapshot-id)
        (string? backup-key) (assoc :backup-key backup-key)
        (string? backup-dir) (assoc :backup-dir backup-dir)
        (string? head-sha) (assoc :head-sha head-sha)
        (string? base-sha) (assoc :base-sha base-sha)
        (string? head-branch) (assoc :head-branch head-branch)
        (string? checksum) (assoc :checksum checksum)))))

(defn- bundle-from-row
  [^js row]
  (when row
    (let [bundle (normalize-bundle
                  {:bundle-id (aget row "bundle_id")
                   :session-id (aget row "session_id")
                   :object-key (aget row "object_key")
                   :bundle-seq (aget row "bundle_seq")
                   :provider (aget row "provider")
                   :snapshot-id (aget row "snapshot_id")
                   :backup-key (aget row "backup_key")
                   :backup-dir (aget row "backup_dir")
                   :head-sha (aget row "head_sha")
                   :base-sha (aget row "base_sha")
                   :head-branch (aget row "head_branch")
                   :byte-size (aget row "byte_size")
                   :checksum (aget row "checksum")
                   :created-at (aget row "created_at")})]
      bundle)))

(defn- <ensure-schema!
  [^js db]
  (p/do!
   (common/<d1-run db
                   (str "create table if not exists workspace_bundle_manifests ("
                        "bundle_id TEXT PRIMARY KEY,"
                        "session_id TEXT,"
                        "repo_key TEXT NOT NULL,"
                        "branch TEXT NOT NULL,"
                        "bundle_seq INTEGER,"
                        "provider TEXT,"
                        "snapshot_id TEXT,"
                        "backup_key TEXT,"
                        "backup_dir TEXT,"
                        "head_sha TEXT,"
                        "base_sha TEXT,"
                        "head_branch TEXT,"
                        "object_key TEXT NOT NULL,"
                        "byte_size INTEGER NOT NULL,"
                        "checksum TEXT,"
                        "created_at INTEGER NOT NULL,"
                        "updated_at INTEGER NOT NULL,"
                        "expires_at INTEGER NOT NULL"
                        ");"))
   (common/<d1-run db
                   (str "create table if not exists workspace_bundle_pointers ("
                        "repo_key TEXT NOT NULL,"
                        "branch TEXT NOT NULL,"
                        "bundle_id TEXT NOT NULL,"
                        "bundle_seq INTEGER NOT NULL,"
                        "updated_at INTEGER NOT NULL,"
                        "expires_at INTEGER NOT NULL,"
                        "primary key (repo_key, branch)"
                        ");"))
   (common/<d1-run db
                   "create index if not exists idx_workspace_bundle_manifests_expires_at on workspace_bundle_manifests(expires_at);")
   (common/<d1-run db
                   "create index if not exists idx_workspace_bundle_pointers_expires_at on workspace_bundle_pointers(expires_at);")
   (-> (common/<d1-run db "alter table workspace_bundle_manifests add column session_id TEXT")
       (p/catch (fn [_] nil)))
   (-> (common/<d1-run db "alter table workspace_bundle_manifests add column bundle_seq INTEGER")
       (p/catch (fn [_] nil)))))

(defn- <cleanup-expired!
  [^js db now-ms]
  (p/do!
   (common/<d1-run db
                   (str "delete from workspace_bundle_pointers "
                        "where rowid in ("
                        "select rowid from workspace_bundle_pointers where expires_at <= ? limit ?"
                        ")")
                   now-ms
                   cleanup-limit)
   (common/<d1-run db
                   (str "delete from workspace_bundle_manifests "
                        "where rowid in ("
                        "select rowid from workspace_bundle_manifests where expires_at <= ? limit ?"
                        ")")
                   now-ms
                   cleanup-limit)))

(defn <load-latest-bundle-for-task!
  ([^js env task]
   (<load-latest-bundle-for-task! env task nil))
  ([^js env task session-id]
   (if-let [db (db-binding env)]
     (if-let [{:keys [repo-key branch]} (task-key task)]
       (p/let [_ (<ensure-schema! db)
               now-ms (common/now-ms)
               session-id (some-> session-id non-empty-str)
               _ (when (maybe-cleanup?)
                   (<cleanup-expired! db now-ms))
               result (common/<d1-all db
                                      (str "select bundle_id, session_id, bundle_seq, object_key, provider, snapshot_id, "
                                           "backup_key, backup_dir, head_sha, base_sha, head_branch, byte_size, checksum, created_at "
                                           "from workspace_bundle_manifests "
                                           "where repo_key = ? and branch = ? and expires_at > ? "
                                           "and (? is null or session_id = ?) "
                                           "order by bundle_seq desc, created_at desc "
                                           "limit 1")
                                      repo-key
                                      branch
                                      now-ms
                                      session-id
                                      session-id)
               rows (common/get-sql-rows result)]
         (bundle-from-row (first rows)))
       (p/resolved nil))
     (p/resolved nil))))

(defn <upsert-bundle-for-task!
  [^js env task bundle]
  (if-let [db (db-binding env)]
    (if-let [{:keys [repo-key branch]} (task-key task)]
      (if-let [bundle (normalize-bundle bundle)]
        (let [created-at (or (:created-at bundle) (common/now-ms))
              updated-at (common/now-ms)
              expires-at (+ created-at bundle-ttl-ms)]
          (p/let [_ (<ensure-schema! db)
                  seq-result (common/<d1-all db
                                             (str "select coalesce(max(bundle_seq), 0) as max_bundle_seq "
                                                  "from workspace_bundle_manifests "
                                                  "where repo_key = ? and branch = ? and session_id = ? and expires_at > ?")
                                             repo-key
                                             branch
                                             (:session-id bundle)
                                             updated-at)
                  seq-row (first (common/get-sql-rows seq-result))
                  previous-seq (or (when seq-row (aget seq-row "max_bundle_seq")) 0)
                  bundle-seq (if (number? previous-seq)
                               (inc previous-seq)
                               1)
                  _ (common/<d1-run db
                                    (str "insert into workspace_bundle_manifests "
                                         "(bundle_id, session_id, repo_key, branch, bundle_seq, provider, snapshot_id, backup_key, backup_dir, "
                                         "head_sha, base_sha, head_branch, object_key, byte_size, checksum, created_at, updated_at, expires_at) "
                                         "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
                                         "on conflict(bundle_id) do update set "
                                         "session_id = excluded.session_id, "
                                         "bundle_seq = excluded.bundle_seq, "
                                         "provider = excluded.provider, "
                                         "snapshot_id = excluded.snapshot_id, "
                                         "backup_key = excluded.backup_key, "
                                         "backup_dir = excluded.backup_dir, "
                                         "head_sha = excluded.head_sha, "
                                         "base_sha = excluded.base_sha, "
                                         "head_branch = excluded.head_branch, "
                                         "object_key = excluded.object_key, "
                                         "byte_size = excluded.byte_size, "
                                         "checksum = excluded.checksum, "
                                         "updated_at = excluded.updated_at, "
                                         "expires_at = excluded.expires_at")
                                    (:bundle-id bundle)
                                    (:session-id bundle)
                                    repo-key
                                    branch
                                    bundle-seq
                                    (:provider bundle)
                                    (:snapshot-id bundle)
                                    (:backup-key bundle)
                                    (:backup-dir bundle)
                                    (:head-sha bundle)
                                    (:base-sha bundle)
                                    (:head-branch bundle)
                                    (:object-key bundle)
                                    (:byte-size bundle)
                                    (:checksum bundle)
                                    created-at
                                    updated-at
                                    expires-at)
                  _ (common/<d1-run db
                                    (str "insert into workspace_bundle_pointers "
                                         "(repo_key, branch, bundle_id, bundle_seq, updated_at, expires_at) "
                                         "values (?, ?, ?, ?, ?, ?) "
                                         "on conflict(repo_key, branch) do update set "
                                         "bundle_id = excluded.bundle_id, "
                                         "bundle_seq = excluded.bundle_seq, "
                                         "updated_at = excluded.updated_at, "
                                         "expires_at = excluded.expires_at")
                                    repo-key
                                    branch
                                    (:bundle-id bundle)
                                    bundle-seq
                                    updated-at
                                    expires-at)
                  _ (when (maybe-cleanup?)
                      (<cleanup-expired! db updated-at))]
            (assoc bundle :bundle-seq bundle-seq)))
        (p/resolved nil))
      (p/resolved nil))
    (p/resolved nil)))
