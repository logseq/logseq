(ns logseq.agents.runner-store
  (:require [clojure.string :as string]
            [logseq.sync.common :as common]
            [promesa.core :as p]))

(def ^:private default-max-sessions 1)
(def ^:private default-heartbeat-ttl-ms 60000)

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- normalize-base-url
  [value]
  (some-> value non-empty-str (string/replace #"/+$" "")))

(defn- normalize-int
  [value default-value]
  (let [parsed (if (number? value)
                 value
                 (some-> value str js/parseInt))]
    (if (and (number? parsed)
             (not (js/isNaN parsed)))
      parsed
      default-value)))

(defn- db-binding
  [^js env]
  (aget env "AGENTS_DB"))

(defn- heartbeat-ttl-ms
  [^js env]
  (let [ttl (normalize-int (aget env "LOCAL_RUNNER_HEARTBEAT_TTL_MS")
                           default-heartbeat-ttl-ms)]
    (max 1000 ttl)))

(defn- ->runner
  [^js row]
  (when row
    (let [runner-id (aget row "runner_id")
          user-id (aget row "user_id")
          base-url (normalize-base-url (aget row "base_url"))
          status (or (non-empty-str (aget row "status")) "online")
          max-sessions (max 1 (normalize-int (aget row "max_sessions") default-max-sessions))
          active-sessions (max 0 (normalize-int (aget row "active_sessions") 0))
          last-heartbeat-at (normalize-int (aget row "last_heartbeat_at") 0)
          created-at (normalize-int (aget row "created_at") 0)
          updated-at (normalize-int (aget row "updated_at") 0)]
      (when (and (string? runner-id) (string? user-id) (string? base-url))
        (cond-> {:runner-id runner-id
                 :user-id user-id
                 :base-url base-url
                 :status status
                 :max-sessions max-sessions
                 :active-sessions active-sessions
                 :last-heartbeat-at last-heartbeat-at
                 :created-at created-at
                 :updated-at updated-at}
          (string? (non-empty-str (aget row "agent_token")))
          (assoc :agent-token (non-empty-str (aget row "agent_token")))
          (string? (non-empty-str (aget row "access_client_id")))
          (assoc :access-client-id (non-empty-str (aget row "access_client_id")))
          (string? (non-empty-str (aget row "access_client_secret")))
          (assoc :access-client-secret (non-empty-str (aget row "access_client_secret"))))))))

(defn- <ensure-schema!
  [^js db]
  (p/do!
   (common/<d1-run db
                   (str "create table if not exists agent_runners ("
                        "runner_id TEXT NOT NULL,"
                        "user_id TEXT NOT NULL,"
                        "base_url TEXT NOT NULL,"
                        "agent_token TEXT,"
                        "access_client_id TEXT,"
                        "access_client_secret TEXT,"
                        "status TEXT NOT NULL DEFAULT 'online',"
                        "max_sessions INTEGER NOT NULL DEFAULT 1,"
                        "active_sessions INTEGER NOT NULL DEFAULT 0,"
                        "last_heartbeat_at INTEGER NOT NULL,"
                        "created_at INTEGER NOT NULL,"
                        "updated_at INTEGER NOT NULL,"
                        "primary key (user_id, runner_id)"
                        ");"))
   (common/<d1-run db
                   (str "create index if not exists idx_agent_runners_user_status_heartbeat "
                        "on agent_runners(user_id, status, last_heartbeat_at desc);"))))

(defn <register-runner!
  [^js env runner]
  (if-let [db (db-binding env)]
    (let [runner-id (some-> (:runner-id runner) non-empty-str)
          user-id (some-> (:user-id runner) non-empty-str)
          base-url (some-> (:base-url runner) normalize-base-url)
          agent-token (some-> (:agent-token runner) non-empty-str)
          access-client-id (some-> (:access-client-id runner) non-empty-str)
          access-client-secret (some-> (:access-client-secret runner) non-empty-str)
          max-sessions (max 1 (normalize-int (:max-sessions runner) default-max-sessions))]
      (if (and (string? runner-id) (string? user-id) (string? base-url))
        (let [now (common/now-ms)]
          (p/let [_ (<ensure-schema! db)
                  _ (common/<d1-run db
                                    (str "insert into agent_runners "
                                         "(runner_id, user_id, base_url, agent_token, access_client_id, access_client_secret, status, max_sessions, active_sessions, last_heartbeat_at, created_at, updated_at) "
                                         "values (?, ?, ?, ?, ?, ?, 'online', ?, 0, ?, ?, ?) "
                                         "on conflict(user_id, runner_id) do update set "
                                         "base_url = excluded.base_url, "
                                         "agent_token = excluded.agent_token, "
                                         "access_client_id = excluded.access_client_id, "
                                         "access_client_secret = excluded.access_client_secret, "
                                         "status = 'online', "
                                         "max_sessions = excluded.max_sessions, "
                                         "last_heartbeat_at = excluded.last_heartbeat_at, "
                                         "updated_at = excluded.updated_at")
                                    runner-id
                                    user-id
                                    base-url
                                    agent-token
                                    access-client-id
                                    access-client-secret
                                    max-sessions
                                    now
                                    now
                                    now)]
            {:runner-id runner-id
             :user-id user-id
             :base-url base-url
             :status "online"
             :max-sessions max-sessions
             :active-sessions 0
             :last-heartbeat-at now
             :created-at now
             :updated-at now
             :agent-token agent-token
             :access-client-id access-client-id
             :access-client-secret access-client-secret}))
        (p/resolved nil)))
    (p/resolved nil)))

(defn <list-runners-for-user!
  [^js env user-id]
  (if-let [db (db-binding env)]
    (if-let [user-id (some-> user-id non-empty-str)]
      (p/let [_ (<ensure-schema! db)
              result (common/<d1-all db
                                     (str "select runner_id, user_id, base_url, agent_token, access_client_id, access_client_secret, status, "
                                          "max_sessions, active_sessions, last_heartbeat_at, created_at, updated_at "
                                          "from agent_runners "
                                          "where user_id = ? "
                                          "order by updated_at desc")
                                     user-id)
              rows (common/get-sql-rows result)]
        (->> rows
             (map ->runner)
             (remove nil?)
             vec))
      (p/resolved []))
    (p/resolved [])))

(defn <get-runner-for-user!
  [^js env user-id runner-id]
  (if-let [db (db-binding env)]
    (if-let [user-id (some-> user-id non-empty-str)]
      (if-let [runner-id (some-> runner-id non-empty-str)]
        (p/let [_ (<ensure-schema! db)
                result (common/<d1-all db
                                       (str "select runner_id, user_id, base_url, agent_token, access_client_id, access_client_secret, status, "
                                            "max_sessions, active_sessions, last_heartbeat_at, created_at, updated_at "
                                            "from agent_runners "
                                            "where user_id = ? and runner_id = ? "
                                            "limit 1")
                                       user-id
                                       runner-id)
                rows (common/get-sql-rows result)]
          (->runner (first rows)))
        (p/resolved nil))
      (p/resolved nil))
    (p/resolved nil)))

(defn <heartbeat-runner!
  [^js env user-id runner-id heartbeat]
  (if-let [db (db-binding env)]
    (if-let [user-id (some-> user-id non-empty-str)]
      (if-let [runner-id (some-> runner-id non-empty-str)]
        (let [active-sessions (if (contains? heartbeat :active-sessions)
                                (max 0 (normalize-int (:active-sessions heartbeat) 0))
                                nil)
              status (if (contains? heartbeat :status)
                       (or (some-> (:status heartbeat) non-empty-str)
                           "online")
                       "online")
              now (common/now-ms)]
          (p/let [_ (<ensure-schema! db)
                  _ (if (number? active-sessions)
                      (common/<d1-run db
                                      (str "update agent_runners "
                                           "set status = ?, active_sessions = ?, last_heartbeat_at = ?, updated_at = ? "
                                           "where user_id = ? and runner_id = ?")
                                      status
                                      active-sessions
                                      now
                                      now
                                      user-id
                                      runner-id)
                      (common/<d1-run db
                                      (str "update agent_runners "
                                           "set status = ?, last_heartbeat_at = ?, updated_at = ? "
                                           "where user_id = ? and runner_id = ?")
                                      status
                                      now
                                      now
                                      user-id
                                      runner-id))
                  runner (<get-runner-for-user! env user-id runner-id)]
            runner))
        (p/resolved nil))
      (p/resolved nil))
    (p/resolved nil)))

(defn <select-runner-for-user!
  [^js env user-id requested-runner-id]
  (if-let [db (db-binding env)]
    (if-let [user-id (some-> user-id non-empty-str)]
      (let [runner-id (some-> requested-runner-id non-empty-str)
            now (common/now-ms)
            min-heartbeat (- now (heartbeat-ttl-ms env))]
        (p/let [_ (<ensure-schema! db)
                result (if (string? runner-id)
                         (common/<d1-all db
                                         (str "select runner_id, user_id, base_url, agent_token, access_client_id, access_client_secret, status, "
                                              "max_sessions, active_sessions, last_heartbeat_at, created_at, updated_at "
                                              "from agent_runners "
                                              "where user_id = ? and runner_id = ? and status = 'online' "
                                              "and last_heartbeat_at >= ? and active_sessions < max_sessions "
                                              "limit 1")
                                         user-id
                                         runner-id
                                         min-heartbeat)
                         (common/<d1-all db
                                         (str "select runner_id, user_id, base_url, agent_token, access_client_id, access_client_secret, status, "
                                              "max_sessions, active_sessions, last_heartbeat_at, created_at, updated_at "
                                              "from agent_runners "
                                              "where user_id = ? and status = 'online' "
                                              "and last_heartbeat_at >= ? and active_sessions < max_sessions "
                                              "order by last_heartbeat_at desc, updated_at desc "
                                              "limit 1")
                                         user-id
                                         min-heartbeat))
                rows (common/get-sql-rows result)]
          (->runner (first rows))))
      (p/resolved nil))
    (p/resolved nil)))
