(ns logseq.db-sync.index
  (:require [logseq.db-sync.common :as common]
            [promesa.core :as p]))

(def ^:private user-upsert-cache-ttl-ms (* 60 60 1000))
(def ^:private user-upsert-cache-max 1024)
(defonce ^:private *user-upsert-cache (atom {}))

(defn- prune-user-upsert-cache! [now-ms]
  (swap! *user-upsert-cache
         (fn [cache]
           (let [cache (into {}
                             (remove (fn [[_ {:keys [cached-at]}]]
                                       (>= (- now-ms cached-at) user-upsert-cache-ttl-ms)))
                             cache)
                 count-cache (count cache)]
             (if (> count-cache user-upsert-cache-max)
               (into {}
                     (drop (- count-cache user-upsert-cache-max)
                           (sort-by (comp :cached-at val) cache)))
               cache)))))

(defn- cache-user-upsert! [user-id email email-verified username now-ms]
  (swap! *user-upsert-cache assoc user-id {:email email
                                           :email-verified email-verified
                                           :username username
                                           :cached-at now-ms})
  (prune-user-upsert-cache! now-ms))

(defn <index-init! [db]
  (p/do!
   (common/<d1-run db
                   (str "create table if not exists graphs ("
                        "graph_id TEXT primary key,"
                        "graph_name TEXT,"
                        "user_id TEXT,"
                        "schema_version TEXT,"
                        "created_at INTEGER,"
                        "updated_at INTEGER"
                        ");"))
   (common/<d1-run db
                   (str "create table if not exists users ("
                        "id TEXT primary key,"
                        "email TEXT,"
                        "email_verified INTEGER,"
                        "username TEXT"
                        ");"))
   (common/<d1-run db
                   (str "create table if not exists user_rsa_keys ("
                        "user_id TEXT primary key,"
                        "public_key TEXT,"
                        "encrypted_private_key TEXT,"
                        "created_at INTEGER,"
                        "updated_at INTEGER"
                        ");"))
   (common/<d1-run db
                   (str "create table if not exists graph_members ("
                        "user_id TEXT,"
                        "graph_id TEXT,"
                        "role TEXT,"
                        "invited_by TEXT,"
                        "created_at INTEGER,"
                        "primary key (user_id, graph_id),"
                        "check (role in ('manager', 'member'))"
                        ");"))
   (common/<d1-run db
                   (str "create table if not exists graph_aes_keys ("
                        "graph_id TEXT,"
                        "user_id TEXT,"
                        "encrypted_aes_key TEXT,"
                        "created_at INTEGER,"
                        "updated_at INTEGER,"
                        "primary key (graph_id, user_id)"
                        ");"))))

(defn <index-list [db user-id]
  (if (string? user-id)
    (p/let [result (common/<d1-all db
                                   (str "select g.graph_id, g.graph_name, g.schema_version, g.created_at, g.updated_at, "
                                        "m.role, m.invited_by "
                                        "from graphs g "
                                        "left join graph_members m on g.graph_id = m.graph_id and m.user_id = ? "
                                        "where g.user_id = ? or m.user_id = ? "
                                        "order by g.updated_at desc")
                                   user-id
                                   user-id
                                   user-id)
            rows (common/get-sql-rows result)]
      (mapv (fn [row]
              {:graph-id (aget row "graph_id")
               :graph-name (aget row "graph_name")
               :schema-version (aget row "schema_version")
               :role (aget row "role")
               :invited-by (aget row "invited_by")
               :created-at (aget row "created_at")
               :updated-at (aget row "updated_at")})
            rows))
    []))

(defn <index-upsert! [db graph-id graph-name user-id schema-version]
  (p/let [now (common/now-ms)
          result (common/<d1-run db
                                 (str "insert into graphs (graph_id, graph_name, user_id, schema_version, created_at, updated_at) "
                                      "values (?, ?, ?, ?, ?, ?) "
                                      "on conflict(graph_id) do update set "
                                      "graph_name = excluded.graph_name, "
                                      "user_id = excluded.user_id, "
                                      "schema_version = excluded.schema_version, "
                                      "updated_at = excluded.updated_at")
                                 graph-id
                                 graph-name
                                 user-id
                                 schema-version
                                 now
                                 now)]
    result))

(defn <index-delete! [db graph-id]
  (p/do!
   (common/<d1-run db "delete from graph_members where graph_id = ?" graph-id)
   (common/<d1-run db "delete from graphs where graph_id = ?" graph-id)))

(defn <graph-name-exists?
  [db graph-name user-id]
  (when (and (string? graph-name) (string? user-id))
    (p/let [result (common/<d1-all db
                                   "select graph_id from graphs where graph_name = ? and user_id = ?"
                                   graph-name
                                   user-id)
            rows (common/get-sql-rows result)]
      (boolean (seq rows)))))

(defn <user-upsert! [db claims]
  (let [user-id (aget claims "sub")]
    (when (string? user-id)
      (let [email (aget claims "email")
            email-verified (aget claims "email_verified")
            username (aget claims "cognito:username")
            email-verified (cond
                             (true? email-verified) 1
                             (false? email-verified) 0
                             :else nil)
            now (common/now-ms)
            cached (get @*user-upsert-cache user-id)]
        (if (and cached
                 (= email (:email cached))
                 (= email-verified (:email-verified cached))
                 (= username (:username cached))
                 (< (- now (:cached-at cached)) user-upsert-cache-ttl-ms))
          (cache-user-upsert! user-id email email-verified username now)
          (p/let [result (common/<d1-run db
                                         (str "insert into users (id, email, email_verified, username) "
                                              "values (?, ?, ?, ?) "
                                              "on conflict(id) do update set "
                                              "email = excluded.email, "
                                              "email_verified = excluded.email_verified, "
                                              "username = excluded.username")
                                         user-id
                                         email
                                         email-verified
                                         username)]
            (cache-user-upsert! user-id email email-verified username now)
            result))))))

(defn <user-id-by-email [db email]
  (when (string? email)
    (p/let [result (common/<d1-all db {:session "first-primary"}
                                   "select id from users where email = ?"
                                   email)
            rows (common/get-sql-rows result)
            row (first rows)]
      (when row
        (aget row "id")))))

(defn <user-rsa-key-pair-upsert!
  [db user-id public-key encrypted-private-key]
  (when (string? user-id)
    (let [now (common/now-ms)]
      (common/<d1-run db
                      (str "insert into user_rsa_keys (user_id, public_key, encrypted_private_key, created_at, updated_at) "
                           "values (?, ?, ?, ?, ?) "
                           "on conflict(user_id) do update set "
                           "public_key = excluded.public_key, "
                           "encrypted_private_key = excluded.encrypted_private_key, "
                           "updated_at = excluded.updated_at")
                      user-id
                      public-key
                      encrypted-private-key
                      now
                      now))))

(defn <user-rsa-key-pair
  [db user-id]
  (when (string? user-id)
    (p/let [result (common/<d1-all db {:session "first-primary"}
                                   "select public_key, encrypted_private_key from user_rsa_keys where user_id = ?"
                                   user-id)
            rows (common/get-sql-rows result)
            row (first rows)]
      (when row
        {:public-key (aget row "public_key")
         :encrypted-private-key (aget row "encrypted_private_key")}))))

(defn <user-rsa-public-key-by-email
  [db email]
  (when (string? email)
    (p/let [result (common/<d1-all db {:session "first-primary"}
                                   (str "select k.public_key from user_rsa_keys k "
                                        "left join users u on k.user_id = u.id "
                                        "where u.email = ?")
                                   email)
            rows (common/get-sql-rows result)
            row (first rows)]
      (when row
        (aget row "public_key")))))

(defn <graph-encrypted-aes-key-upsert!
  [db graph-id user-id encrypted-aes-key]
  (when (and (string? graph-id) (string? user-id))
    (let [now (common/now-ms)]
      (common/<d1-run db
                      (str "insert into graph_aes_keys (graph_id, user_id, encrypted_aes_key, created_at, updated_at) "
                           "values (?, ?, ?, ?, ?) "
                           "on conflict(graph_id, user_id) do update set "
                           "encrypted_aes_key = excluded.encrypted_aes_key, "
                           "updated_at = excluded.updated_at")
                      graph-id
                      user-id
                      encrypted-aes-key
                      now
                      now))))

(defn <graph-encrypted-aes-key
  [db graph-id user-id]
  (when (and (string? graph-id) (string? user-id))
    (p/let [result (common/<d1-all db
                                   "select encrypted_aes_key from graph_aes_keys where graph_id = ? and user_id = ?"
                                   graph-id
                                   user-id)
            rows (common/get-sql-rows result)
            row (first rows)]
      (when row
        (aget row "encrypted_aes_key")))))

(defn <graph-member-upsert! [db graph-id user-id role invited-by]
  (let [now (common/now-ms)]
    (common/<d1-run db
                    (str "insert into graph_members (user_id, graph_id, role, invited_by, created_at) "
                         "values (?, ?, ?, ?, ?) "
                         "on conflict(user_id, graph_id) do update set "
                         "role = excluded.role, "
                         "invited_by = excluded.invited_by")
                    user-id
                    graph-id
                    role
                    invited-by
                    now)))

(defn <graph-members-list [db graph-id]
  (p/let [result (common/<d1-all db {:session "first-primary"}
                                 (str "select m.user_id, m.graph_id, m.role, m.invited_by, m.created_at, "
                                      "u.email, u.username "
                                      "from graph_members m "
                                      "left join users u on m.user_id = u.id "
                                      "where m.graph_id = ? order by m.created_at asc")
                                 graph-id)
          rows (common/get-sql-rows result)]
    (mapv (fn [row]
            {:user-id (aget row "user_id")
             :graph-id (aget row "graph_id")
             :role (aget row "role")
             :invited-by (aget row "invited_by")
             :created-at (aget row "created_at")
             :email (aget row "email")
             :username (aget row "username")})
          rows)))

(defn <graph-member-update-role! [db graph-id user-id role]
  (common/<d1-run db
                  (str "update graph_members set role = ? "
                       "where graph_id = ? and user_id = ?")
                  role
                  graph-id
                  user-id))

(defn <graph-member-delete! [db graph-id user-id]
  (common/<d1-run db
                  "delete from graph_members where graph_id = ? and user_id = ?"
                  graph-id
                  user-id))

(defn <graph-member-role [db graph-id user-id]
  (when (and (string? graph-id) (string? user-id))
    (p/let [result (common/<d1-all db
                                   "select role from graph_members where graph_id = ? and user_id = ?"
                                   graph-id
                                   user-id)
            rows (common/get-sql-rows result)
            row (first rows)]
      (when row
        (aget row "role")))))

(defn <user-has-access-to-graph? [db graph-id user-id]
  (when (and (string? graph-id) (string? user-id))
    (p/let [result (common/<d1-all db
                                   (str "select graph_id from graphs where graph_id = ? and user_id = ? "
                                        "union select graph_id from graph_members where graph_id = ? and user_id = ?")
                                   graph-id
                                   user-id
                                   graph-id
                                   user-id)
            rows (common/get-sql-rows result)]
      (boolean (seq rows)))))

(defn <user-is-manager? [db graph-id user-id]
  (when (and (string? graph-id) (string? user-id))
    (p/let [result (common/<d1-all db
                                   (str "select graph_id from graphs where graph_id = ? and user_id = ? "
                                        "union select graph_id from graph_members where graph_id = ? and user_id = ? and role = 'manager'")
                                   graph-id
                                   user-id
                                   graph-id
                                   user-id)
            rows (common/get-sql-rows result)]
      (boolean (seq rows)))))
